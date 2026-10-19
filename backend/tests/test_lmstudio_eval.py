"""Opt-in: one rag case against a live OpenAI-compatible server.

    $env:LMSTUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
    $env:LMSTUDIO_MODEL = "qwen/qwen3.8-27b"   # optional; defaults to the first listed model
    uv run pytest -m lmstudio -q -rs
"""

import os

import httpx
import pytest

from eval.answer_metrics import fact_present
from eval.pipeline import rag_answer

pytestmark = pytest.mark.lmstudio


@pytest.fixture(scope="module")
def live_llm():
    base_url = os.environ.get("LMSTUDIO_BASE_URL")
    if not base_url:
        pytest.skip("LMSTUDIO_BASE_URL not set")
    try:
        models = httpx.get(f"{base_url.rstrip('/')}/models", timeout=5).json()["data"]
    except (httpx.HTTPError, KeyError, ValueError) as e:
        pytest.skip(f"LM Studio not reachable at {base_url}: {e}")
    model = os.environ.get("LMSTUDIO_MODEL") or next(
        (m["id"] for m in models if "embed" not in m["id"]), None
    )
    if not model:
        pytest.skip("no chat model listed")
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(model=model, api_key="lm-studio", base_url=base_url, temperature=0, timeout=120)


def test_live_rag_answer(live_llm, rag):
    result = rag_answer("How long does lost and found keep items?", rag, live_llm, top_k=5)
    assert result.answer
    assert "<think>" not in result.answer
    assert fact_present(result.answer, "90 days")
    assert result.generation_ms > 0
