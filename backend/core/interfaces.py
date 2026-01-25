"""Protocol definitions for core abstractions."""

from typing import Any, AsyncIterator, Protocol
from langchain_core.messages import BaseMessage

from core.events import BaseEvent
from core.schemas import ToolResult, Citation


class Tool(Protocol):
    """Tool interface."""

    name: str
    description: str
    is_read_only: bool

    async def execute(self, args: dict[str, Any]) -> Any:
        """Execute tool with arguments."""
        ...


class Agent(Protocol):
    """Agent orchestrator interface."""

    async def process(
        self,
        input_text: str,
        session_context: list[BaseMessage],
    ) -> AsyncIterator[BaseEvent]:
        """Process user input, yield events."""
        ...


class RAGService(Protocol):
    """RAG retrieval service interface."""

    async def retrieve(
        self,
        query: str,
        retrieval_type: str = "auto",
        top_k: int = 5,
    ) -> list[Citation]:
        """Retrieve relevant documents."""
        ...


class SessionStore(Protocol):
    """Session storage interface."""

    async def get_history(self, session_id: str) -> list[BaseMessage]:
        """Get conversation history."""
        ...

    async def append_turn(
        self,
        session_id: str,
        user_message: BaseMessage,
        ai_message: BaseMessage,
    ) -> None:
        """Append conversation turn."""
        ...
