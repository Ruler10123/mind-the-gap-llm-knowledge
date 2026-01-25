"""LangGraph agent: general assistant with tool-calling (node) capability."""

import json
from datetime import datetime, timezone
from typing import Annotated, Literal

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict

from config import settings
from observability.logger import logger


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


@tool
def show_flight_details(flight_number: str = "AA 2847") -> dict:
    """Show flight details card in chat when user asks about their flight, gate, boarding, or flight status.
    IMPORTANT: After calling this tool, you MUST provide a brief spoken response (1-2 sentences)
    acknowledging what you're showing them. For example: 'Here are your flight details for AA 2847.'"""
    return {
        "component_type": "flight_details",
        "data": {
            "flightNumber": flight_number,
        }
    }


@tool
def show_weather(location: str = "Dallas") -> dict:
    """Show weather widget in chat when user asks about weather, temperature, or conditions
    at the airport or their destination. Use the specified location (city name, e.g. Dallas, DFW).
    IMPORTANT: After calling this tool, you MUST provide a brief spoken response (1-2 sentences)
    acknowledging what you're showing them. For example: 'Here\'s the weather in Dallas.'"""
    return {
        "component_type": "weather",
        "data": {
            "location": location.strip() or "Dallas",
        },
    }


@tool
def show_map(destination: str) -> dict:
    """Show map directions in chat when user asks for directions or location of gates, restrooms, or services.
    Valid destinations: RESTROOM, CUSTOMER_SERVICE, A28, B9.
    IMPORTANT: After calling this tool, you MUST provide a brief spoken response (1-2 sentences)
    acknowledging what you're showing them. For example: 'Here are directions to Gate A28. Follow the highlighted path from your current location.'"""
    destinations = {
        "RESTROOM": (
            "Directions to Restroom",
            "/RESTROOM.png",
            [
                "The Location Marker marks your current location (YOU ARE HERE).",
                "1. You're next to the TerminalLink Station in Terminal C. Walk south (down on the map) toward the TSA Pre / Lower Level area.",
                "2. At the first corner, turn right (east).",
                "3. Take the next right (south) around the edge of the TSA Pre block.",
                "4. Continue straight and the **restroom will be on your right**.",
            ],
        ),
        "CUSTOMER_SERVICE": (
            "Directions to Customer Service",
            "/CUSTOMER_SERVICE.png",
            [
                "The Location Marker marks your current location (YOU ARE HERE).",
                "1. From your spot by the **TerminalLink Station** in **Terminal C**, walk **right (east)** to the main hallway.",
                "2. Turn **left (north)** and go up to the junction by gates **C23/C24**.",
                "3. Turn **left (west)** into the North Concourse hallway. **Customer Service** is right along that corridor where the red line ends.",
            ],
        ),
        "B9": (
            "Directions to Gate B9",
            "/B9.png",
            [
                "The Location Marker marks your current location (YOU ARE HERE).",
                "1. From the **TerminalLink area** in **Terminal B** (near the B85–B88 side), walk **south (down)** into the main concourse.",
                "2. Turn **right (east)** toward the **B1–B12** gate pier.",
                "3. Continue **down** the pier until you reach **B9** (on the right side of that pier, where it's marked in red).",
            ],
        ),
        "A28": (
            "Directions to Gate A28",
            "/A28.png",
            [
                "The Location Marker marks your current location (YOU ARE HERE).",
                "1. From your location in **Terminal C**, walk **south (down)** to the **TerminalLink Station**.",
                "2. Take the **TerminalLink train** to **Terminal A**.",
                "3. Exit at **Terminal A Station** (near the A7 area on the map).",
                "4. Walk **south (down)** into **Terminal A South Concourse**.",
                "5. Follow the concourse toward gates **A27–A30**.",
                "6. **A28** is in that row (between **A27** and **A29**).",
            ],
        ),
    }
    key = destination.upper().replace(" ", "_")
    entry = destinations.get(key)
    if not entry:
        return {"ok": False, "error": f"Unknown destination: {destination}"}
    title, image_src, notes = entry
    return {
        "ok": True,
        "component_type": "map",
        "data": {
            "title": title,
            "imageSrc": image_src,
            "altText": f"{title}. The Location Marker marks your current location.",
            "notes": notes,
        },
    }


# Global RAG service (injected at startup)
_rag_service = None


def set_rag_service(rag_service):
    """Set the RAG service for the search_knowledge_base tool."""
    global _rag_service
    _rag_service = rag_service


@tool
def search_knowledge_base(query: str) -> str:
    """Search airport knowledge base for policies, procedures, services, and facilities information.
    Use this when the user asks about airport rules, baggage policies, security procedures, available services, or facility information."""
    if _rag_service is None:
        return "Knowledge base not available."

    try:
        import asyncio
        loop = asyncio.get_event_loop()
        citations = loop.run_until_complete(_rag_service.retrieve(query))

        if not citations:
            return "No relevant information found in the knowledge base."

        # Format citations for LLM context
        formatted_results = []
        for citation in citations:
            formatted_results.append(f"[Source: {citation.source}]\n{citation.content}")

        return "\n\n---\n\n".join(formatted_results)
    except Exception as e:
        logger.error(f"Knowledge base search error: {str(e)}")
        return f"Unable to search knowledge base: {str(e)}"


tools = [get_current_time, add, multiply, divide, show_flight_details, show_weather, show_map, search_knowledge_base]
tools_by_name = {t.name: t for t in tools}


class MessagesState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    llm_calls: int


SYSTEM_PROMPT = """You are a helpful airport kiosk assistant. You can answer questions, have conversations, and use tools when useful.

You have access to callable tools (nodes):
- get_current_time: use when the user asks about the current time, date, or "today"
- add, multiply, divide: use for basic arithmetic when the user asks for calculations
- show_flight_details: use when the user asks about their flight, gate, boarding status, or flight information
- show_weather: use when the user asks about weather, temperature, or conditions at the airport or their destination (pass location e.g. Dallas, DFW)
- show_map: use when the user asks for directions or where to find gates (A28, B9, C43, D12), restrooms, or customer service. Valid destinations: RESTROOM, CUSTOMER_SERVICE, A28, B9, C43, D12
- search_knowledge_base: use when the user asks about airport policies, procedures, baggage rules, security guidelines, available services, or facility information

CRITICAL: After calling show_flight_details, show_weather, or show_map, you MUST provide a brief spoken response (1-2 sentences) to accompany the visual component.
For example: "Here are your flight details" or "Here's the weather in Dallas." or "Here are directions to Gate A28. Follow the highlighted path."

Call the appropriate tool when it helps answer the user. Otherwise reply directly. Keep replies clear and concise and do not use markdown formatting."""

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
        llm_call_count = state.get("llm_calls", 0) + 1
        logger.info(f"[AgentGraph] Making LLM call #{llm_call_count} with {len(msgs)} messages")
        response = model_with_tools.invoke(msgs)
        logger.info(f"[AgentGraph] LLM call #{llm_call_count} completed. Response has {len(response.tool_calls) if hasattr(response, 'tool_calls') and response.tool_calls else 0} tool call(s)")
        return {
            "messages": [response],
            "llm_calls": llm_call_count,
        }

    def tool_node(state: dict) -> dict:
        result: list[ToolMessage] = []
        last = state["messages"][-1]
        if not isinstance(last, AIMessage) or not last.tool_calls:
            return {"messages": result}
        
        logger.info(f"[AgentGraph] Executing {len(last.tool_calls)} tool call(s)")
        for tc in last.tool_calls:
            name = tc["name"] if isinstance(tc, dict) else getattr(tc, "name", None)
            args = tc["args"] if isinstance(tc, dict) else getattr(tc, "args", {})
            tid = tc["id"] if isinstance(tc, dict) else getattr(tc, "id", "")
            logger.info(f"[AgentGraph] Calling tool: {name} with args: {args}")
            tool_fn = tools_by_name.get(name)
            if not tool_fn:
                logger.warning(f"[AgentGraph] Unknown tool requested: {name}")
                result.append(ToolMessage(content=f"Unknown tool: {name}", tool_call_id=tid))
                continue
            observation = tool_fn.invoke(args)
            logger.info(f"[AgentGraph] Tool {name} completed successfully")
            # Use JSON for dict results, str for others
            content = json.dumps(observation) if isinstance(observation, dict) else str(observation)
            result.append(ToolMessage(content=content, tool_call_id=tid))
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
