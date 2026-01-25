"""RAG retrieval service (stub implementation)."""

from core.schemas import Citation


class RAGService:
    """RAG retrieval service."""

    async def retrieve(
        self,
        query: str,
        retrieval_type: str = "auto",
        top_k: int = 5,
    ) -> list[Citation]:
        """
        Retrieve relevant documents.
        Currently returns empty list - implement MongoDB integration later.
        """
        # TODO: Implement MongoDB Atlas Vector Search
        return []
