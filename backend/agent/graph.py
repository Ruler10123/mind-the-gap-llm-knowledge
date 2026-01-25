"""LangGraph agent: StateGraph, Gemini, tools."""

from typing import Annotated, Literal

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

from config import settings


@tool
def add(a: int, b: int) -> int:
    """Adds `a` and `b`."""
    return a + b


@tool
def multiply(a: int, b: int) -> int:
    """Multiply `a` and `b`."""
    return a * b


@tool
def divide(a: int, b: int) -> float:
    """Divide `a` by `b`."""
    return a / b


tools = [add, multiply, divide]
tools_by_name = {t.name: t for t in tools}


class MessagesState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    llm_calls: int


SYSTEM_PROMPT = (
    "You are a helpful assistant tasked with performing arithmetic on a set of inputs. "
    "Use tools when the user asks for calculations. Keep replies concise."
)

_agent = None


def _build_agent():
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=settings.api_key_google(),
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
