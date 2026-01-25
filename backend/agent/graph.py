"""LangGraph agent: general assistant with tool-calling (node) capability."""

from datetime import datetime, timezone
from typing import Annotated, Literal

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

from config import settings


@tool
def get_current_time() -> str:
    """Return the current date and time in ISO format (UTC). Use when the user asks about time, date, or today."""
    return datetime.now(timezone.utc).isoformat()


@tool
def add(a: int, b: int) -> int:
    """Add two integers. Use for basic arithmetic when the user asks to add numbers."""
    return a + b


@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers. Use for basic arithmetic when the user asks to multiply numbers."""
    return a * b


@tool
def divide(a: int, b: int) -> float:
    """Divide a by b. Use for basic arithmetic when the user asks to divide numbers. b must not be 0."""
    return a / b


tools = [get_current_time, add, multiply, divide]
tools_by_name = {t.name: t for t in tools}


class MessagesState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    llm_calls: int


SYSTEM_PROMPT = """You are a helpful general assistant. You can answer questions, have conversations, and use tools when useful.

You have access to callable tools (nodes):
- get_current_time: use when the user asks about the current time, date, or "today"
- add, multiply, divide: use for basic arithmetic when the user asks for calculations

Call the appropriate tool when it helps answer the user. Otherwise reply directly. Keep replies clear and concise."""

_agent = None


def _build_agent():
    if not settings.vultr_api_key:
        raise ValueError("VULTR_API_KEY must be provided")
    
    model = ChatOpenAI(
        model=settings.vultr_model,
        api_key=settings.vultr_api_key,
        base_url="https://api.vultrinference.com/v1",
        temperature=0,
    )
    model_with_tools = model.bind_tools(tools)

    def llm_call(state: dict) -> dict:
        msgs = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        response = model_with_tools.invoke(msgs)
        return {
            "messages": [response],
            "llm_calls": state.get("llm_calls", 0) + 1,
        }

    def tool_node(state: dict) -> dict:
        result: list[ToolMessage] = []
        last = state["messages"][-1]
        if not isinstance(last, AIMessage) or not last.tool_calls:
            return {"messages": result}
        for tc in last.tool_calls:
            name = tc["name"] if isinstance(tc, dict) else getattr(tc, "name", None)
            args = tc["args"] if isinstance(tc, dict) else getattr(tc, "args", {})
            tid = tc["id"] if isinstance(tc, dict) else getattr(tc, "id", "")
            tool_fn = tools_by_name.get(name)
            if not tool_fn:
                result.append(ToolMessage(content=f"Unknown tool: {name}", tool_call_id=tid))
                continue
            observation = tool_fn.invoke(args)
            result.append(ToolMessage(content=str(observation), tool_call_id=tid))
        return {"messages": result}

    def should_continue(state: MessagesState) -> Literal["tool_node", "__end__"]:
        messages = state["messages"]
        last = messages[-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tool_node"
        return "__end__"

    builder = StateGraph(MessagesState)
    builder.add_node("llm_call", llm_call)
    builder.add_node("tool_node", tool_node)
    builder.add_edge(START, "llm_call")
    builder.add_conditional_edges("llm_call", should_continue, {"tool_node": "tool_node", "__end__": END})
    builder.add_edge("tool_node", "llm_call")
    return builder.compile()


def get_agent():
    global _agent
    if _agent is None:
        _agent = _build_agent()
    return _agent
