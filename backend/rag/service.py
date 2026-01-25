"""RAG retrieval service."""

from typing import List
from core.schemas import Citation
from rag.database import RAGDatabaseService
from rag.embeddings import EmbeddingService
from config import settings


class RAGService:
    """RAG retrieval service with MongoDB Atlas Vector Search."""

    def __init__(self, database_service: RAGDatabaseService, embedding_service: EmbeddingService):
        """Initialize RAG service.

        Args:
            database_service: Database service for vector search
            embedding_service: Embedding service for query encoding
        """
        self.database_service = database_service
        self.embedding_service = embedding_service

    async def retrieve(
        self,
        query: str,
        retrieval_type: str = "auto",
        top_k: int = None,
    ) -> List[Citation]:
        """Retrieve relevant documents from knowledge base.

        Args:
            query: User query text
            retrieval_type: Retrieval strategy (currently unused, defaults to vector search)
            top_k: Number of results to return (defaults to settings.rag_top_k)

        Returns:
            List of Citation objects with retrieved content
        """
        if not query or not query.strip():
            return []

        # Use default top_k if not specified
        limit = top_k or settings.rag_top_k

        try:
            # Generate query embedding
            query_embedding = self.embedding_service.embed_text(query)

            # Perform vector search
            results = self.database_service.vector_search(
                query_embedding=query_embedding,
                limit=limit
            )

            # Convert to Citation objects
            citations = []
            for result in results:
                citation = Citation(
                    citation_id=result.get("chunk_id", ""),
                    content=result.get("content", ""),
                    source=result.get("source", "unknown"),
                    category=result.get("category"),
                    score=result.get("score")
                )
                citations.append(citation)

            return citations

        except Exception as e:
            print(f"RAG retrieval error: {str(e)}")
            return []
