"""Exception hierarchy with natural language translation."""


class AgentException(Exception):
    """Base exception for all agent errors."""

    def to_natural_language(self) -> str:
        """Convert exception to user-friendly message."""
        return str(self)


class ToolExecutionError(AgentException):
    """Tool execution failed."""

    def __init__(self, tool_name: str, original_error: Exception):
        self.tool_name = tool_name
        self.original_error = original_error
        super().__init__(f"Tool '{tool_name}' failed: {original_error}")

    def to_natural_language(self) -> str:
        """Translate to natural language."""
        error_str = str(self.original_error)

        # Specific error translations
        if isinstance(self.original_error, ZeroDivisionError):
            return "Cannot divide by zero"
        if "timeout" in error_str.lower():
            return f"The {self.tool_name} operation timed out"
        if "http" in error_str.lower() or "connection" in error_str.lower():
            return f"External service unavailable while using {self.tool_name}"

        # Generic fallback
        return f"Unexpected error in {self.tool_name}: {error_str}"


class LLMParseError(AgentException):
    """LLM output parsing failed (invalid JSON, hallucinated tool)."""

    def to_natural_language(self) -> str:
        return f"I made a formatting mistake. {str(self)}"


class RAGRetrievalError(AgentException):
    """RAG knowledge retrieval failed."""

    def to_natural_language(self) -> str:
        return f"Unable to access knowledge base: {str(self)}"


class TimeoutError(AgentException):
    """Operation exceeded time limit."""

    def to_natural_language(self) -> str:
        return f"Operation timed out: {str(self)}"


class SessionError(AgentException):
    """Session management error."""

    def to_natural_language(self) -> str:
        return f"Session error: {str(self)}"
