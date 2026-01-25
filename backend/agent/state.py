"""Agent state schema."""

from typing import Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """State for agent graph execution."""

    # Persistent conversation context
    session_id: str
    messages: Annotated[list[BaseMessage], add_messages]

    # Transient reasoning
    reasoning_log: list[str]
    retry_count: int
    last_error: str | None
    llm_calls: int
    current_tool_calls: list[dict]
