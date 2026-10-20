"""EXPERIMENT_MODE=rag (ROADMAP P4.1): retrieve, inject with citation ids, one LLM call, no tools."""

from __future__ import annotations

import asyncio

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, HumanMessage

import agent.orchestrator as orch_mod
from agent.orchestrator import AgentOrchestrator
from agent.rag_mode import NO_CONTEXT, RAG_REFUSAL
from config import settings
from core.events import RetrievalEvent
from eval.pipeline import rag_answer
from transport.websocket_handler import WebSocketHandler

CARRY_ON_Q = "What are the size limits for carry-on bags?"


def _no_agent():
    raise AssertionError("rag mode must not build the LangGraph tool agent")


@pytest.fixture
def rag_mode(monkeypatch, rag, scripted_llm):
    """Orchestrator in rag mode over the real corpus with a scripted LLM."""
    llm = scripted_llm(lambda q, s: "Up to 22 x 14 x 9 inches [airport_faq#carry-on-baggage].")
    monkeypatch.setattr(settings, "experiment_mode", "rag")
    monkeypatch.setattr(settings, "rag_top_k", 5)
    monkeypatch.setattr(orch_mod, "get_base_llm", lambda: llm)
    monkeypatch.setattr(orch_mod, "get_rag_service", lambda: rag)
    monkeypatch.setattr(orch_mod, "get_agent", _no_agent)
    return llm


def run(input_text: str, history=None) -> list:
    async def collect():
        return [item async for item in AgentOrchestrator().process(input_text, history or [])]
    return asyncio.run(collect())


def test_retrieves_injects_citations_and_calls_llm_once(rag_mode):
    items = run(CARRY_ON_Q)

    retrieval, answer = items
    assert isinstance(retrieval, RetrievalEvent)
    assert "airport_faq#carry-on-baggage" in retrieval.source_ids
    assert len(retrieval.source_ids) == len(retrieval.scores) <= 5
    assert answer == "Up to 22 x 14 x 9 inches [airport_faq#carry-on-baggage]."

    assert len(rag_mode.calls) == 1
    system, question = rag_mode.calls[0]
    assert system.type == "system" and question.content == CARRY_ON_Q
    for sid in retrieval.source_ids:
        assert f"[{sid}]\n" in system.content
    assert RAG_REFUSAL in system.content


def test_matches_eval_harness_rag_system(rag_mode, rag, scripted_llm):
    # The eval `rag` system must send exactly what the live mode sends.
    [retrieval, _] = run(CARRY_ON_Q)
    eval_llm = scripted_llm(lambda q, s: "x")
    answer = rag_answer(CARRY_ON_Q, rag, eval_llm, top_k=5)

    assert answer.retrieved_ids == retrieval.source_ids
    assert answer.retrieved_scores == retrieval.scores
    assert [(m.type, m.content) for m in eval_llm.calls[0]] == [(m.type, m.content) for m in rag_mode.calls[0]]


def test_respects_rag_top_k(rag_mode, monkeypatch):
    monkeypatch.setattr(settings, "rag_top_k", 2)
    retrieval = run(CARRY_ON_Q)[0]
    assert len(retrieval.source_ids) == 2


def test_session_history_goes_between_context_and_question(rag_mode):
    history = [HumanMessage(content="Hi"), AIMessage(content="Hello, how can I help?")]
    run(CARRY_ON_Q, history)
    types = [m.type for m in rag_mode.calls[0]]
    assert types == ["system", "human", "ai", "human"]
    assert rag_mode.calls[0][-1].content == CARRY_ON_Q


class _BrokenRAG:
    async def retrieve(self, query, retrieval_type="auto", top_k=None):
        raise ConnectionError("vector store down")


@pytest.mark.parametrize("service", [None, _BrokenRAG()], ids=["no-service", "retrieval-fails"])
def test_missing_or_failing_rag_degrades_to_no_context(rag_mode, monkeypatch, service):
    monkeypatch.setattr(orch_mod, "get_rag_service", lambda: service)
    retrieval, answer = run(CARRY_ON_Q)

    assert retrieval.source_ids == [] and retrieval.scores == []
    assert isinstance(answer, str)
    assert f"Context:\n{NO_CONTEXT}" in rag_mode.calls[0][0].content


def test_websocket_does_not_send_retrieval_event(monkeypatch):
    handler = WebSocketHandler()

    async def process_message(session_id, message):
        yield RetrievalEvent(source_ids=["airport_faq#parking"], scores=[3.0])
        yield "Parking is in Garage A."

    async def no_audio(text):
        return
        yield

    monkeypatch.setattr(handler.session_manager, "process_message", process_message)
    monkeypatch.setattr(handler.tts_service, "stream_with_timestamps", no_audio)
    app = FastAPI()
    app.add_api_websocket_route("/ws", handler.handle)

    with TestClient(app).websocket_connect("/ws") as ws:
        ws.send_json({"message": "Where do I park?"})
        events = [ws.receive_json(), ws.receive_json()]

    assert events == [{"type": "text", "content": "Parking is in Garage A."}, {"type": "done"}]
