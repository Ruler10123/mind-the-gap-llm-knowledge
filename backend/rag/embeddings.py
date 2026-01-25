"""Embedding service using sentence-transformers."""
from typing import List
from sentence_transformers import SentenceTransformer
from config import settings


class EmbeddingService:
    """Service for generating text embeddings."""

    def __init__(self):
        """Initialize embedding model."""
        print(f"Loading embedding model: {settings.embedding_model}...")
        self.model = SentenceTransformer(settings.embedding_model)
        self.dimensions = self.model.get_sentence_embedding_dimension()
        print(f"Embedding model loaded ({self.dimensions} dimensions)")

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector (384-dim for all-MiniLM-L6-v2)
        """
        if not text or not text.strip():
            raise ValueError("Cannot embed empty text")

        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def embed_batch(self, texts: List[str], batch_size: int = 32, show_progress: bool = True) -> List[List[float]]:
        """Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            batch_size: Batch size for processing
            show_progress: Show progress bar

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        # Filter out empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        if len(valid_texts) != len(texts):
            print(f"Warning: Filtered out {len(texts) - len(valid_texts)} empty texts")

        embeddings = self.model.encode(
            valid_texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True
        )

        return [emb.tolist() for emb in embeddings]
