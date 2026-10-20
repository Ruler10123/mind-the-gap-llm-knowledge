"""The systems under evaluation, as plain functions.

`rag` mirrors EXPERIMENT_MODE=rag: it builds its prompt with
`agent/rag_mode.py`, so both send the same messages. `base_only` mirrors
EXPERIMENT_MODE=base_only in agent/orchestrator.py. Both take the LLM as
an argument so tests can pass a stub and runs can pass `_build_llm()`.
"""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage, SystemMessage

from agent.graph import BASE_ONLY_SYSTEM_PROMPT
from agent.rag_mode import RAG_REFUSAL, RAG_SYSTEM_PROMPT, build_context, build_messages
from core.schemas import Citation
from eval.corpus import citation_source_id

__all__ = [
    "RAG_REFUSAL", "RAG_SYSTEM_PROMPT", "SystemAnswer", "base_only_answer",
    "build_context", "rag_answer", "retrieve", "strip_reasoning",
]

# Reasoning models (e.g. Qwen3) may emit <think>...</think> before the answer.
_THINK_RE = re.compile(r"<think>.*?(?:</think>|$)", re.DOTALL | re.IGNORECASE)


@dataclass
class SystemAnswer:
    answer: str
    raw_answer: str
    retrieved_ids: list[str] = field(default_factory=list)
    retrieved_scores: list[float | None] = field(default_factory=list)
    context: str = ""
    retrieval_ms: float | None = None
    generation_ms: float = 0.0


def strip_reasoning(text: str) -> str:
    return _THINK_RE.sub("", text).strip()


def retrieve(rag, query: str, top_k: int) -> tuple[list[Citation], float]:
    t0 = time.perf_counter()
    citations = asyncio.run(rag.retrieve(query, top_k=top_k))
    return citations, (time.perf_counter() - t0) * 1000


def _generate(llm, messages) -> tuple[str, float]:
    t0 = time.perf_counter()
    response = llm.invoke(messages)
    ms = (time.perf_counter() - t0) * 1000
    content = response.content if isinstance(response.content, str) else str(response.content)
    return content, ms


def rag_answer(question: str, rag, llm, top_k: int) -> SystemAnswer:
    citations, retrieval_ms = retrieve(rag, question, top_k)
    context = build_context(citations)
    raw, generation_ms = _generate(llm, build_messages(question, citations))
    return SystemAnswer(
        answer=strip_reasoning(raw),
        raw_answer=raw,
        retrieved_ids=[citation_source_id(c) for c in citations],
        retrieved_scores=[c.score for c in citations],
        context=context,
        retrieval_ms=retrieval_ms,
        generation_ms=generation_ms,
    )


def base_only_answer(question: str, llm) -> SystemAnswer:
    messages = [SystemMessage(content=BASE_ONLY_SYSTEM_PROMPT), HumanMessage(content=question)]
    raw, generation_ms = _generate(llm, messages)
    return SystemAnswer(answer=strip_reasoning(raw), raw_answer=raw, generation_ms=generation_ms)
