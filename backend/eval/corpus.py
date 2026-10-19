"""Stable source ids for corpus chunks.

`LocalRAGService` names chunks by position (`airport_faq-7`), so any edit to
a document renumbers every chunk after it. Gold labels in the eval dataset
use `<file stem>#<slug of the chunk's first heading>` instead, e.g.
`airport_faq#carry-on-baggage`, which survives reordering and edits to
other sections.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from core.schemas import Citation

DOCUMENTS_DIR = Path(__file__).resolve().parent.parent / "rag" / "documents"
CORPUS_SUFFIXES = (".md", ".txt")

_HEADING_RE = re.compile(r"^#{1,6}\s+(.+?)\s*#*\s*$")


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def section_id(source: str, content: str) -> str | None:
    """Stable id for a chunk whose first line is a markdown heading."""
    lines = content.strip().splitlines()
    if not lines:
        return None
    m = _HEADING_RE.match(lines[0].strip())
    if not m:
        return None
    return f"{Path(source).stem}#{slugify(m.group(1))}"


def citation_source_id(citation: Citation) -> str:
    """Map a retrieved citation to its stable id (positional id as fallback)."""
    return section_id(citation.source, citation.content) or citation.citation_id


def is_heading_only(content: str) -> bool:
    lines = [ln for ln in content.strip().splitlines() if ln.strip()]
    return len(lines) == 1 and bool(_HEADING_RE.match(lines[0].strip()))


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
        if path.suffix.lower() not in CORPUS_SUFFIXES or not path.is_file():
            continue
        h.update(path.relative_to(root).as_posix().encode("utf-8"))
        h.update(b"\0")
        # Normalise line endings so a Windows checkout hashes the same.
        h.update(path.read_bytes().replace(b"\r\n", b"\n"))
        h.update(b"\0")
    return h.hexdigest()
