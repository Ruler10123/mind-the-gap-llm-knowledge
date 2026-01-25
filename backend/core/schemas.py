"""Shared Pydantic models."""

from typing import Any
from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    """Result from tool execution."""

    success: bool
    output: Any | None = None
    error_message: str | None = None
    tool_name: str = ""


class AgentInput(BaseModel):
    """Input to agent processing."""

    message: str = Field(..., min_length=1)
    session_id: str | None = None


class Citation(BaseModel):
    """Document citation with source metadata."""

    citation_id: str
    content: str
    source: str
    category: str | None = None
    score: float | None = None
