"""RAG data models."""

from pydantic import BaseModel, Field


class Document(BaseModel):
    """Document retrieved from knowledge base."""

    content: str
    source: str
    category: str | None = None
    metadata: dict = Field(default_factory=dict)
    score: float | None = None
