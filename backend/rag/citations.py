"""Stable source ids for retrieved chunks.

`LocalRAGService` names chunks by position (`airport_faq-7`), so any edit to
a document renumbers every chunk after it. Citations shown to the LLM and
gold labels in the eval dataset use `<file stem>#<slug of the chunk's most
specific heading>` instead, e.g. `airport_faq#carry-on-baggage`, which
survives reordering and edits to other sections.
"""

from __future__ import annotations

import re
from pathlib import Path

from core.schemas import Citation

HEADING_RE = re.compile(r"^#{1,6}\s+(.+?)\s*#*\s*$")


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def section_id(source: str, content: str) -> str | None:
    """Stable id for a chunk that starts with markdown heading(s).

    Uses the last heading before the body, i.e. the most specific one, so
    `## Baggage Policies` + `### Carry-On Baggage` + text is
    `<stem>#carry-on-baggage`.
    """
    heading = None
    for line in content.strip().splitlines():
        m = HEADING_RE.match(line.strip())
        if not m:
            break
        heading = m.group(1)
    if heading is None:
        return None
    return f"{Path(source).stem}#{slugify(heading)}"


def citation_source_id(citation: Citation) -> str:
    """Map a retrieved citation to its stable id (positional id as fallback)."""
    return section_id(citation.source, citation.content) or citation.citation_id
