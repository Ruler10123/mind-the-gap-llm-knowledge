"""Event types for streaming to frontend."""

from typing import Any, Literal
from pydantic import BaseModel, Field


class BaseEvent(BaseModel):
    """Base event type."""

    type: str


class ReasoningEvent(BaseEvent):
    """Agent reasoning step."""

    type: Literal["reasoning"] = "reasoning"
    content: str


class PlanningEvent(BaseEvent):
    """Agent planning step."""

    type: Literal["planning"] = "planning"
    content: str


class ToolCallEvent(BaseEvent):
    """Tool execution started."""

    type: Literal["tool_call"] = "tool_call"
    tool_name: str
    arguments: dict[str, Any]


class ToolFailureEvent(BaseEvent):
    """Tool execution failed."""

    type: Literal["tool_failure"] = "tool_failure"
    tool_name: str
    error: str


class RetryEvent(BaseEvent):
    """Retry attempt after error."""

    type: Literal["retry"] = "retry"
    attempt: int
    reason: str


class ErrorEvent(BaseEvent):
    """Unrecoverable error."""

    type: Literal["error"] = "error"
    message: str


class AudioEvent(BaseEvent):
    """Audio chunk (base64 encoded)."""

    type: Literal["audio"] = "audio"
    chunk: str  # base64


class AlignmentEvent(BaseEvent):
    """Text-to-speech alignment data."""

    type: Literal["alignment"] = "alignment"
    characters: list[str]
    character_start_times_seconds: list[float]
    character_end_times_seconds: list[float]


class DoneEvent(BaseEvent):
    """Processing complete."""

    type: Literal["done"] = "done"


class UIActionEvent(BaseEvent):
    """UI action to be handled by frontend."""

    type: Literal["ui_action"] = "ui_action"
    action: str  # e.g. "OPEN_MODAL"
    modal_id: str
    payload: dict[str, Any]
