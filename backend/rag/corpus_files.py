"""Which files under rag/documents/ count as knowledge-base content."""

from pathlib import Path


def is_knowledge_file(path: Path) -> bool:
    """False for README files: they document the directory for developers and
    must not be retrieved as airport knowledge."""
    return path.is_file() and path.stem.lower() != "readme"
