from __future__ import annotations

import pytest
from langchain_core.messages import AIMessage

from eval.runner import DEV_DATASET
from rag.local_rag import LocalRAGService


class ScriptedLLM:
    """Deterministic chat model: returns `reply(question, system_prompt)`."""

    def __init__(self, reply):
        self.reply = reply
        self.calls: list[list] = []

    def invoke(self, messages):
        self.calls.append(messages)
        system = next((m.content for m in messages if m.type == "system"), "")
        question = next((m.content for m in reversed(messages) if m.type == "human"), "")
        return AIMessage(content=self.reply(question, system))


@pytest.fixture(scope="session")
def dev_dataset_path():
    return DEV_DATASET


@pytest.fixture(scope="session")
def rag():
    return LocalRAGService()


@pytest.fixture
def scripted_llm():
    return ScriptedLLM


@pytest.fixture
def stub_llm():
    from agent.graph import _StubChatModel
    return _StubChatModel()
