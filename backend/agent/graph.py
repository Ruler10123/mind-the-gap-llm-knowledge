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
from weather.service import get_weather_service


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


def _get_weather_advice(location: str, temp: int, condition: str) -> str:
    """Generate dressing and activity advice based on weather conditions."""
    location_lower = location.lower()
    is_destination = "los angeles" in location_lower or "lax" in location_lower or "la" in location_lower
    
    advice_parts = []
    
    # Temperature-based dressing advice
    if temp >= 80:
        advice_parts.append("Light, breathable clothing like shorts and t-shirts are perfect.")
        if is_destination:
            advice_parts.append("Don't forget sunscreen and a hat for protection.")
    elif temp >= 70:
        advice_parts.append("Comfortable light layers work well - a t-shirt with a light jacket or cardigan.")
    elif temp >= 60:
        advice_parts.append("A light jacket or sweater is recommended.")
    elif temp >= 50:
        advice_parts.append("Wear a warm jacket or coat.")
    else:
        advice_parts.append("Bundle up with a heavy coat, gloves, and a hat.")
    
    # Condition-based advice
    if "rain" in condition.lower() or "storm" in condition.lower():
        advice_parts.append("Bring an umbrella or rain jacket.")
    elif "sunny" in condition.lower() or "clear" in condition.lower():
        if is_destination:
            advice_parts.append("Great weather for outdoor activities like beach visits or hiking.")
    elif "cloudy" in condition.lower() or "overcast" in condition.lower():
        if is_destination:
            advice_parts.append("Perfect for exploring museums or indoor attractions.")
    
    # Destination-specific activity suggestions
    if is_destination:
        if temp >= 75:
            advice_parts.append("Consider beach activities, outdoor dining, or visiting parks.")
        elif temp >= 65:
            advice_parts.append("Great for walking tours, outdoor markets, or sightseeing.")
        else:
            advice_parts.append("Indoor activities like museums, shopping, or dining are ideal.")
    
    return " ".join(advice_parts)


@tool
def show_weather(location: str = "Dallas") -> dict:
    """Show weather widget in chat when user asks about weather, temperature, or conditions.
    
    Location can be:
    - "destination", "LAX", "Los Angeles", "LA" - shows weather at destination (Los Angeles)
    - "here", "Dallas", "DFW" - shows weather at current location (Dallas)
    - "both" - shows weather for both locations
    - Any specific city name (e.g. "Dallas", "Los Angeles")
    
    When showing destination weather, automatically includes dressing and activity advice.
    IMPORTANT: After calling this tool, you MUST provide a brief spoken response (1-2 sentences)
    acknowledging what you're showing them. For example: 'Here\'s the weather in Los Angeles.'"""
    
    location = location.strip() or "Dallas"
    location_lower = location.lower()
    
    # Map location keywords to actual cities
    location_map = {
        "destination": "Los Angeles",
        "lax": "Los Angeles",
        "los angeles": "Los Angeles",
        "la": "Los Angeles",
        "here": "Dallas",
        "dallas": "Dallas",
        "dfw": "Dallas",
    }
    
    # Normalize location
    normalized = location_map.get(location_lower, location)
    
    # Get weather service
    weather_service = get_weather_service()
    
    # Handle "both" case
    if location_lower == "both":
        # Fetch real weather for both locations
        dallas_weather = weather_service.get_weather_sync("Dallas,US")
        la_weather = weather_service.get_weather_sync("Los Angeles,US")
        
        # Build response with real data or fallbacks
        locations_data = []
        
        # Dallas
        if dallas_weather:
            locations_data.append({
                "location": dallas_weather["location"],
                "temp": dallas_weather["temp"],
                "condition": dallas_weather["condition"],
                "high": dallas_weather["high"],
                "low": dallas_weather["low"],
                "humidity": dallas_weather["humidity"],
                "windSpeed": dallas_weather["windSpeed"],
                "visibility": dallas_weather["visibility"],
                "uvIndex": dallas_weather["uvIndex"],
                "icon": dallas_weather["icon"],
                "description": dallas_weather["description"],
                "advice": None,
            })
        else:
            # Fallback
            locations_data.append({
                "location": "Dallas",
                "temp": 78,
                "condition": "Sunny",
                "high": 82,
                "low": 68,
                "humidity": 45,
                "windSpeed": 8,
                "visibility": 10,
                "uvIndex": 7,
                "icon": "01d",
                "description": "clear sky",
                "advice": None,
            })
        
        # Los Angeles
        if la_weather:
            la_advice = _get_weather_advice(la_weather["location"], la_weather["temp"], la_weather["condition"])
            locations_data.append({
                "location": la_weather["location"],
                "temp": la_weather["temp"],
                "condition": la_weather["condition"],
                "high": la_weather["high"],
                "low": la_weather["low"],
                "humidity": la_weather["humidity"],
                "windSpeed": la_weather["windSpeed"],
                "visibility": la_weather["visibility"],
                "uvIndex": la_weather["uvIndex"],
                "icon": la_weather["icon"],
                "description": la_weather["description"],
                "advice": la_advice,
            })
        else:
            # Fallback
            la_advice = _get_weather_advice("Los Angeles", 72, "Sunny")
            locations_data.append({
                "location": "Los Angeles",
                "temp": 72,
                "condition": "Sunny",
                "high": 75,
                "low": 68,
                "humidity": 60,
                "windSpeed": 5,
                "visibility": 10,
                "uvIndex": 6,
                "icon": "01d",
                "description": "clear sky",
                "advice": la_advice,
            })
        
        return {
            "component_type": "weather",
            "data": {
                "locations": locations_data,
            },
        }
    
    # Fetch real weather data
    weather_data = weather_service.get_weather_sync(f"{normalized},US")
    
    # Check if this is destination weather (for advice)
    is_destination = normalized == "Los Angeles"
    
    # Generate advice for destination
    advice = None
    if is_destination and weather_data:
        advice = _get_weather_advice(weather_data["location"], weather_data["temp"], weather_data["condition"])
    elif is_destination:
        # Fallback advice
        advice = _get_weather_advice(normalized, 72, "Sunny")
    
    # Build response with real data or fallback
    if weather_data:
        return {
            "component_type": "weather",
            "data": {
                "location": weather_data["location"],
                "temp": weather_data["temp"],
                "condition": weather_data["condition"],
                "high": weather_data["high"],
                "low": weather_data["low"],
                "humidity": weather_data["humidity"],
                "windSpeed": weather_data["windSpeed"],
                "visibility": weather_data["visibility"],
                "uvIndex": weather_data["uvIndex"],
                "icon": weather_data["icon"],
                "description": weather_data["description"],
                "advice": advice,
            },
        }
    else:
        # Fallback to dummy data if API fails
        return {
            "component_type": "weather",
            "data": {
                "location": normalized,
                "temp": 78 if normalized == "Dallas" else 72,
                "condition": "Sunny",
                "high": 82 if normalized == "Dallas" else 75,
                "low": 68,
                "humidity": 45,
                "windSpeed": 8,
                "visibility": 10,
                "uvIndex": 7,
                "icon": "01d",
                "description": "clear sky",
                "advice": advice,
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
- show_weather: use when the user asks about weather, temperature, or conditions. Location can be "destination"/"LAX"/"Los Angeles" for destination, "here"/"Dallas"/"DFW" for current location, "both" for both, or any city name. When showing destination weather, advice is automatically included.
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
