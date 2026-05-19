"""In-memory RAG service for local/dev mode.

Reads markdown files under `rag/documents/`, splits them into paragraph
chunks, and does naive keyword overlap scoring. No external services
required. Intended as the default backend so the app can boot without
MongoDB Atlas or sentence-transformers.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import List

from config import settings
from core.schemas import Citation


_WORD_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))


class LocalRAGService:
    """Naive in-memory keyword-overlap retriever.

    Loads `*.md` and `*.txt` files from `documents_dir` at construction
    time, chunks on blank-line boundaries, and scores by token overlap
    with the query. Suitable as a placeholder while the experimental
    pipeline is being built.
    """

    def __init__(self, documents_dir: Path | None = None):
        self.documents_dir = documents_dir or (Path(__file__).parent / "documents")
        self.chunks: list[dict] = []
        self._load()

    def _load(self) -> None:
        if not self.documents_dir.exists():
            return
        for path in sorted(self.documents_dir.glob("**/*")):
            if path.suffix.lower() not in (".md", ".txt"):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                continue
            for idx, raw_chunk in enumerate(re.split(r"\n\s*\n", text)):
                chunk = raw_chunk.strip()
                if len(chunk) < 20:
                    continue
                self.chunks.append({
                    "chunk_id": f"{path.stem}-{idx}",
                    "source": path.name,
                    "content": chunk,
                    "tokens": _tokenize(chunk),
                })

    async def retrieve(
        self,
        query: str,
        retrieval_type: str = "auto",
        top_k: int | None = None,
    ) -> List[Citation]:
        if not query or not query.strip() or not self.chunks:
            return []
        limit = top_k or settings.rag_top_k
        q_tokens = _tokenize(query)
        if not q_tokens:
            return []
        scored = []
        for chunk in self.chunks:
            overlap = len(q_tokens & chunk["tokens"])
            if overlap:
                scored.append((overlap, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            Citation(
                citation_id=c["chunk_id"],
                content=c["content"],
                source=c["source"],
                category=None,
                score=float(score),
            )
            for score, c in scored[:limit]
        ]

    def close(self) -> None:  # parity with RAGDatabaseService for shutdown
        pass
