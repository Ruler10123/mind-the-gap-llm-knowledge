"""Session data models."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage


class ConversationTurn(BaseModel):
    """Single conversation turn."""

    user_message: str
    ai_message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Session(BaseModel):
    """User session."""

    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    history: list[ConversationTurn] = Field(default_factory=list)
