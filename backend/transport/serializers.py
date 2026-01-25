"""Event to JSON serialization."""

from typing import Any
from core.events import BaseEvent


def event_to_json(event: BaseEvent) -> dict[str, Any]:
    """Convert event to JSON-serializable dict."""
    return event.model_dump()
