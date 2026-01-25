"""Session lifecycle and interruption handling."""

import asyncio
import uuid
from collections.abc import AsyncIterator
from langchain_core.messages import HumanMessage, AIMessage

from core.events import BaseEvent, ErrorEvent
from agent.orchestrator import AgentOrchestrator
from session.session_store import InMemorySessionStore
from observability.logger import logger


class SessionManager:
    """Manages session lifecycle and interruptions."""

    def __init__(self):
        self.store = InMemorySessionStore()
        self.orchestrator = AgentOrchestrator()
        self.active_tasks: dict[str, asyncio.Task] = {}

    def generate_session_id(self) -> str:
        """Generate unique session ID."""
        return str(uuid.uuid4())

    async def process_message(
        self,
        session_id: str,
        message: str,
    ) -> AsyncIterator[BaseEvent | str]:
        """
        Process user message with interruption handling.
        Yields events or response text.
        """
        # Cancel any active task for this session
        if session_id in self.active_tasks:
            old_task = self.active_tasks[session_id]
            old_task.cancel()
            yield ErrorEvent(message="Previous request cancelled")
            logger.info(f"Cancelled previous task for session {session_id}")

        # Get conversation history
        history = await self.store.get_history(session_id)

        # Process message
        try:
            full_response = ""
            async for item in self.orchestrator.process(message, history):
                # orchestrator yields either string (response text) or events
                if isinstance(item, str):
                    full_response = item
                    yield item
                elif isinstance(item, BaseEvent):
                    yield item

            # Save turn to history if we got a response
            if full_response:
                await self.store.append_turn(
                    session_id,
                    HumanMessage(content=message),
                    AIMessage(content=full_response),
                )

        except asyncio.CancelledError:
            logger.info(f"Task cancelled for session {session_id}")
            raise
        except Exception as e:
            logger.error(f"Session processing error: {e}")
            yield ErrorEvent(message=str(e))
        finally:
            # Clean up active task reference
            if session_id in self.active_tasks:
                del self.active_tasks[session_id]
