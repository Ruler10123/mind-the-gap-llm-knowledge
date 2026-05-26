"""Smoke test for the selected LLM provider.

Bypasses FastAPI, WebSockets, and LangGraph. Loads the same `_build_llm()`
factory the agent uses, asks 3 fixed airport-assistant questions, and
prints the response + wall-clock latency for each.

Run from the repo root (or the backend/ dir — adds backend/ to sys.path):

    cd backend && uv run python ../scripts/smoke_base_model.py
    # or, with a real provider:
    LLM_PROVIDER=local uv run python ../scripts/smoke_base_model.py
    LLM_PROVIDER=openai OPENAI_API_KEY=... uv run python ../scripts/smoke_base_model.py
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Make `backend/` importable when invoked from the repo root.
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND = REPO_ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from langchain_core.messages import HumanMessage, SystemMessage  # noqa: E402

from config import settings  # noqa: E402
from agent.graph import _build_llm, BASE_ONLY_SYSTEM_PROMPT  # noqa: E402


QUESTIONS = [
    "What is the carry-on baggage size limit?",
    "How early should I arrive for an international flight?",
    "Can I bring a 200ml bottle of water through security?",
]


def main() -> int:
    print(f"LLM_PROVIDER={settings.llm_provider}")
    if settings.llm_provider == "local":
        print(f"LOCAL_MODEL_ID={settings.local_model_id}")
        print(f"LOCAL_MODEL_DEVICE={settings.local_model_device}")
    elif settings.llm_provider == "openai":
        print(f"OPENAI_MODEL={settings.openai_model}")
    elif settings.llm_provider == "vultr":
        print(f"VULTR_MODEL={settings.vultr_model}")
    print()

    print("Building LLM...")
    t0 = time.perf_counter()
    llm = _build_llm()
    build_ms = (time.perf_counter() - t0) * 1000
    print(f"Built in {build_ms:.0f} ms\n")

    for i, q in enumerate(QUESTIONS, 1):
        msgs = [SystemMessage(content=BASE_ONLY_SYSTEM_PROMPT), HumanMessage(content=q)]
        t0 = time.perf_counter()
        try:
            resp = llm.invoke(msgs)
            ms = (time.perf_counter() - t0) * 1000
            text = resp.content if isinstance(resp.content, str) else str(resp.content)
        except Exception as e:
            ms = (time.perf_counter() - t0) * 1000
            text = f"<error after {ms:.0f} ms: {e}>"
        print(f"[{i}] Q: {q}")
        print(f"    A ({ms:.0f} ms): {text}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
