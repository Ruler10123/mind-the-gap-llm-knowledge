"""Retry strategies and timeout enforcement."""

from core.exceptions import ToolExecutionError, LLMParseError, AgentException


class RetryStrategy:
    """Determines if an error should trigger retry."""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    def should_retry(
        self,
        error: AgentException,
        attempt: int,
    ) -> bool:
        """Determine if error warrants retry."""
        if attempt >= self.max_retries:
            return False

        # Always retry LLM parse errors (safe, no side effects)
        if isinstance(error, LLMParseError):
            return True

        # Tool errors: don't retry (tools in graph.py are simple)
        if isinstance(error, ToolExecutionError):
            return False

        # Default: no retry
        return False
