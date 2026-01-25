"""RAG data models."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class Document(BaseModel):
    """Document retrieved from knowledge base."""

    content: str
    source: str
    category: str | None = None
    metadata: dict = Field(default_factory=dict)
    score: float | None = None


class DocumentChunk(BaseModel):
    """Chunk stored in MongoDB with vector embedding."""

    chunk_id: str
    content: str
    embedding: List[float]  # 384-dim from all-MiniLM-L6-v2
    source: str
    category: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    chunk_index: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IngestionResult(BaseModel):
    """Result of document ingestion."""

    success: bool
    documents_processed: int
    chunks_created: int
    chunks_inserted: int
    errors: List[str] = Field(default_factory=list)
