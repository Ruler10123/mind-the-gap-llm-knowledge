"""Retry strategies and timeout enforcement."""

from core.exceptions import ToolExecutionError, LLMParseError, AgentException
from tools.base import BaseTool


class RetryStrategy:
    """Determines if an error should trigger retry."""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    def should_retry(
        self,
        error: AgentException,
        attempt: int,
        tool: BaseTool | None = None,
    ) -> bool:
        """Determine if error warrants retry."""
        if attempt >= self.max_retries:
            return False

        # Always retry LLM parse errors (safe, no side effects)
        if isinstance(error, LLMParseError):
            return True

        # Tool errors: only retry if read-only
        if isinstance(error, ToolExecutionError) and tool:
            return tool.is_read_only

        # Default: no retry
        return False
