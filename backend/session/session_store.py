"""In-memory session store."""

from datetime import datetime
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from session.models import Session, ConversationTurn


class InMemorySessionStore:
    """In-memory session storage."""

    def __init__(self):
        self._sessions: dict[str, Session] = {}

    async def get_history(self, session_id: str) -> list[BaseMessage]:
        """Get conversation history as LangChain messages."""
        session = self._sessions.get(session_id)
        if not session:
            return []

        messages: list[BaseMessage] = []
        for turn in session.history:
            messages.append(HumanMessage(content=turn.user_message))
            messages.append(AIMessage(content=turn.ai_message))
        return messages

    async def append_turn(
        self,
        session_id: str,
        user_message: BaseMessage,
        ai_message: BaseMessage,
    ) -> None:
        """Append conversation turn."""
        if session_id not in self._sessions:
            self._sessions[session_id] = Session(session_id=session_id)

        session = self._sessions[session_id]
        turn = ConversationTurn(
            user_message=str(user_message.content),
            ai_message=str(ai_message.content),
        )
        session.history.append(turn)
        session.updated_at = datetime.utcnow()

    async def get_session(self, session_id: str) -> Session | None:
        """Get session by ID."""
        return self._sessions.get(session_id)

    async def create_session(self, session_id: str) -> Session:
        """Create new session."""
        session = Session(session_id=session_id)
        self._sessions[session_id] = session
        return session
