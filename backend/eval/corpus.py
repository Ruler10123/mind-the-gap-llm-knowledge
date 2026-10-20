"""Corpus helpers for the eval harness.

Stable source ids (`airport_faq#carry-on-baggage`) are defined in
`rag/citations.py`, since EXPERIMENT_MODE=rag shows them to the LLM too;
they are re-exported here for the eval code and tests.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from rag.citations import HEADING_RE, citation_source_id, section_id, slugify
from rag.corpus_files import is_knowledge_file

__all__ = [
    "CORPUS_SUFFIXES", "DOCUMENTS_DIR", "chunk_index", "citation_source_id",
    "corpus_sha256", "is_heading_only", "section_id", "slugify",
]

DOCUMENTS_DIR = Path(__file__).resolve().parent.parent / "rag" / "documents"
CORPUS_SUFFIXES = (".md", ".txt")


def is_heading_only(content: str) -> bool:
    lines = [ln for ln in content.strip().splitlines() if ln.strip()]
    return len(lines) == 1 and bool(HEADING_RE.match(lines[0].strip()))


def chunk_index(rag) -> dict[str, dict]:
    """Stable id -> chunk for every chunk the retriever has indexed."""
    index: dict[str, dict] = {}
    for chunk in rag.chunks:
        sid = section_id(chunk["source"], chunk["content"]) or chunk["chunk_id"]
        index[sid] = chunk
    return index


def corpus_sha256(documents_dir: Path | None = None) -> str:
    """Hash of every corpus file (relative path + bytes), in sorted order."""
    root = documents_dir or DOCUMENTS_DIR
    h = hashlib.sha256()
    for path in sorted(root.glob("**/*")):
        if path.suffix.lower() not in CORPUS_SUFFIXES or not is_knowledge_file(path):
            continue
        h.update(path.relative_to(root).as_posix().encode("utf-8"))
        h.update(b"\0")
        # Normalise line endings so a Windows checkout hashes the same.
        h.update(path.read_bytes().replace(b"\r\n", b"\n"))
        h.update(b"\0")
    return h.hexdigest()
