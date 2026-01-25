"""Time tool implementation."""

from datetime import datetime, timezone
from typing import Any

from tools.base import BaseTool
from tools.schemas import TimeToolInput


class TimeTool(BaseTool):
    """Get current time tool."""

    def __init__(self):
        super().__init__(
            name="get_current_time",
            description="Return the current date and time in ISO format (UTC). Use when the user asks about time, date, or today.",
            is_read_only=True,
            schema=TimeToolInput,
        )

    async def execute(self, args: dict[str, Any]) -> str:
        """Execute time tool."""
        return datetime.now(timezone.utc).isoformat()
