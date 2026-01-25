"""RAG knowledge search tool (stub)."""

from typing import Any

from tools.base import BaseTool
from tools.schemas import RAGToolInput


class RAGTool(BaseTool):
    """Search knowledge base tool."""

    def __init__(self):
        super().__init__(
            name="search_knowledge_base",
            description="Search the knowledge base for policy, manual, or FAQ information. Use when user asks about company policies, product manuals, or frequently asked questions.",
            is_read_only=True,
            schema=RAGToolInput,
        )

    async def execute(self, args: dict[str, Any]) -> str:
        """Execute RAG search."""
        # TODO: Integrate with RAG service
        return "Knowledge base search is not yet configured. Please contact administrator."
