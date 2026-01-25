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


class PageInfo(BaseModel):
    """Information about a single UI page."""

    page_name: str = Field(..., description="Unique name/identifier of the page")
    page_description: str = Field(..., description="Description of page functionality")


class PageFilterInput(BaseModel):
    """Input for page filtering tool."""

    user_requirement: str = Field(..., description="What the user is trying to achieve")
    available_pages: list[PageInfo] = Field(..., description="List of available pages to filter")


class PageFilterOutput(BaseModel):
    """Output from page filtering tool."""

    selected_page_name: str | None = Field(None, description="The most relevant page name, or null if no page is relevant")
    reasoning: str = Field(..., description="Brief explanation of why this page was selected or why none matched")
