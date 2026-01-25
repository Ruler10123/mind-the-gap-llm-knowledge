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
        logger.info(f"[AgentOrchestrator] Starting query processing: '{input_text[:100]}{'...' if len(input_text) > 100 else ''}' (context: {len(session_context)} messages)")
        attempt = 0
        messages = session_context.copy()
        messages.append(HumanMessage(content=input_text))

        while attempt < settings.agent_max_retries:
            try:
                if attempt > 0:
                    logger.info(f"[AgentOrchestrator] Retry attempt {attempt}/{settings.agent_max_retries}")
                else:
                    logger.info(f"[AgentOrchestrator] Executing agent graph (attempt {attempt + 1}/{settings.agent_max_retries})")
                
                # Run agent graph
                full_text_parts: list[str] = []
                buffered_components: list[ComponentEvent] = []
                components_yielded = False

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

                                # Check for component - buffer it instead of yielding immediately
                                component_type = data.get("component_type")
                                if component_type:
                                    buffered_components.append(ComponentEvent(
                                        component_type=component_type,
                                        data=data.get("data", {}),
                                    ))
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

                    # Yield buffered components before first text chunk
                    if buffered_components and not components_yielded:
                        for component in buffered_components:
                            yield component
                        components_yielded = True

                    full_text_parts.append(text)

                # If we have buffered components but no text was generated, yield them now
                if buffered_components and not components_yielded:
                    for component in buffered_components:
                        yield component

                # Success - return full response text
                full_text = "".join(full_text_parts)
                logger.info(f"[AgentOrchestrator] Query processed successfully. Response length: {len(full_text)} chars")
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
