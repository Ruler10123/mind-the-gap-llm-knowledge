"""EXPERIMENT_MODE=rag: retrieve top-k chunks, put them in the prompt, one LLM call.

System 2 in docs/experiment_plan.md. No tools and no LangGraph: the context
is injected with each chunk's stable citation id (`[airport_faq#parking]`)
and the model is told to answer only from it. The eval harness's `rag`
system (`eval/pipeline.py::rag_answer`) builds its prompt here too, so an
eval run measures exactly what this mode serves.
"""

from __future__ import annotations

from collections.abc import Sequence

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from core.schemas import Citation
from observability.logger import logger
from rag.citations import citation_source_id

RAG_REFUSAL = "I don't have that information."

RAG_SYSTEM_PROMPT = (
    "You are a helpful airport assistant. Answer the user's question using only "
    "the context below. Be concise and do not use markdown formatting. If the "
    f'context does not contain the answer, reply exactly: "{RAG_REFUSAL}"\n\n'
    "Context:\n{context}"
)

NO_CONTEXT = "(no results)"


def build_context(citations: Sequence[Citation]) -> str:
    return "\n\n".join(f"[{citation_source_id(c)}]\n{c.content}" for c in citations)


def build_messages(
    question: str,
    citations: Sequence[Citation],
    history: Sequence[BaseMessage] = (),
) -> list[BaseMessage]:
    context = build_context(citations)
    messages: list[BaseMessage] = [
        SystemMessage(content=RAG_SYSTEM_PROMPT.format(context=context or NO_CONTEXT)),
    ]
    messages.extend(history)
    messages.append(HumanMessage(content=question))
    return messages


async def retrieve(rag, query: str, top_k: int) -> list[Citation]:
    """Top-k citations, or [] when no RAG service is configured or it fails.

    A missing or broken knowledge base degrades to the no-context prompt
    (which makes the model refuse) rather than an error.
    """
    if rag is None:
        logger.warning("[rag mode] no RAG service configured; answering without context")
        return []
    try:
        return list(await rag.retrieve(query, top_k=top_k))
    except Exception as e:
        logger.warning(f"[rag mode] retrieval failed ({e}); answering without context")
        return []
