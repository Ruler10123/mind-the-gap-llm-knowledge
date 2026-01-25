"""Tool I/O Pydantic models."""

from pydantic import BaseModel, Field


class TimeToolInput(BaseModel):
    """No input needed for time tool."""

    pass


class ArithmeticInput(BaseModel):
    """Input for arithmetic operations."""

    a: int = Field(..., description="First number")
    b: int = Field(..., description="Second number")


class RAGToolInput(BaseModel):
    """Input for RAG knowledge search."""

    query: str = Field(..., description="Search query")
    category: str = Field(
        default="auto",
        description="Category: 'policy', 'manual', 'faq', or 'auto' for automatic",
    )
