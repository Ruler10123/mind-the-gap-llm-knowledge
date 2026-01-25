"""Agent orchestrator with self-correcting loop."""

import json
from collections.abc import AsyncIterator
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage, ToolMessage

from config import settings
from core.events import BaseEvent, RetryEvent, ErrorEvent, UIActionEvent, ComponentEvent
from core.exceptions import LLMParseError, ToolExecutionError, AgentException
from agent.strategies import RetryStrategy
from agent.graph import get_agent
from observability.logger import logger


class AgentOrchestrator:
    """Orchestrates agent execution with self-correction."""

    def __init__(self):
        self.retry_strategy = RetryStrategy(max_retries=settings.agent_max_retries)
        self.agent = get_agent()

    async def process(
        self,
        input_text: str,
        session_context: list[BaseMessage],
    ) -> AsyncIterator[BaseEvent]:
        """
        Process user input with self-correcting loop.
        Yields events for streaming to frontend.
        """
        attempt = 0
        messages = session_context.copy()
        messages.append(HumanMessage(content=input_text))

        while attempt < settings.agent_max_retries:
            try:
                # Run agent graph
                full_text_parts: list[str] = []
                async for msg_chunk, metadata in self.agent.astream(
                    {"messages": messages, "llm_calls": 0},
                    stream_mode="messages",
                ):
                    # Check for component or UI action in ToolMessage results
                    if isinstance(msg_chunk, ToolMessage):
                        try:
                            content = msg_chunk.content
                            if isinstance(content, str) and content.startswith("{"):
                                data = json.loads(content)

                                # Check for component
                                component_type = data.get("component_type")
                                if component_type:
                                    yield ComponentEvent(
                                        component_type=component_type,
                                        data=data.get("data", {}),
                                    )
                                    continue

                                # Legacy: Check for UI action
                                ui_action = data.get("ui_action")
                                if ui_action in ("OPEN_MODAL", "NAVIGATE"):
                                    yield UIActionEvent(
                                        action=data["ui_action"],
                                        modal_id=data.get("modal_id", ""),
                                        payload=data.get("payload", {}),
                                    )
                        except (json.JSONDecodeError, KeyError):
                            pass
                        continue

                    if not getattr(msg_chunk, "content", None):
                        continue
                    text = msg_chunk.content if isinstance(msg_chunk.content, str) else ""
                    if not text:
                        continue
                    full_text_parts.append(text)

                # Success - return full response text
                full_text = "".join(full_text_parts)
                yield full_text  # Return as string for compatibility
                break

            except LLMParseError as e:
                attempt += 1
                logger.warning(f"LLM parse error (attempt {attempt}): {e}")

                if attempt >= settings.agent_max_retries:
                    yield ErrorEvent(message=e.to_natural_language())
                    break

                # Feed error back to LLM
                error_msg = f"System Error: {e.to_natural_language()}. Please try again with correct format."
                messages.append(SystemMessage(content=error_msg))
                yield RetryEvent(attempt=attempt, reason=e.to_natural_language())

            except ToolExecutionError as e:
                attempt += 1
                logger.error(f"Tool execution error (attempt {attempt}): {e}")

                if not self.retry_strategy.should_retry(e, attempt):
                    yield ErrorEvent(message=e.to_natural_language())
                    break

                # Feed error back to LLM
                messages.append(SystemMessage(content=f"Tool Error: {e.to_natural_language()}"))
                yield RetryEvent(attempt=attempt, reason=e.to_natural_language())

            except AgentException as e:
                logger.error(f"Agent error: {e}")
                yield ErrorEvent(message=e.to_natural_language())
                break

            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                yield ErrorEvent(message=f"Unexpected error: {str(e)}")
                break
