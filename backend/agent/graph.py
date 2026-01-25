"""LangGraph agent: general assistant with tool-calling (node) capability."""

import json
from datetime import datetime, timezone
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

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
    """Return the current date and time in ISO format (CST). Use when the user asks about time, date, or today."""
    utc_time = datetime.now(timezone.utc)
    cst_time = utc_time.astimezone(ZoneInfo("America/Chicago"))
    return cst_time.isoformat()


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
            "origin": "DFW",
            "destination": "LAX",
            "gate": "D23",
            "boardingTime": "2:15 PM",
            "departureTime": "2:45 PM",
            "status": "On Time",
            "progress": 50,
            "currentPhase": "gate",
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
    Valid destinations: RESTROOM, CUSTOMER_SERVICE, A28, B9. Don't reference specific gates, like A28, B9, etc. Just say "Gates".
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
def show_destination_info(destination: str) -> dict:
    """Show detailed information about airport destinations, facilities, or services.
    Use when user asks about specific places like restaurants, lounges, shops, gates, services, or amenities.
    Valid destinations include: ADMIRALS_CLUB, CENTURION_LOUNGE, FOOD_COURT, DUTY_FREE, BAGGAGE_CLAIM, TERMINAL_A, TERMINAL_B, TERMINAL_C.
    IMPORTANT: After calling this tool, you MUST provide a brief spoken response (1-2 sentences)
    acknowledging what you're showing them. For example: 'Here's information about the Admirals Club lounge.'"""
    destinations = {
        "ADMIRALS_CLUB": {
            "name": "American Airlines Admirals Club",
            "description": "Premium lounge offering complimentary refreshments, Wi-Fi, and comfortable seating for eligible passengers.",
            "location": "Terminal D",
            "terminal": "D",
            "gate": "D20",
            "estimatedWalkTime": "8-12 minutes from security",
            "hours": "5:00 AM - 10:00 PM daily",
            "amenities": [
                "Complimentary snacks and beverages",
                "High-speed Wi-Fi",
                "Comfortable seating areas",
                "Business center with printing",
                "Shower facilities",
                "Television and reading materials"
            ],
            "directions": [
                "Clear security checkpoint",
                "Turn left and proceed down main concourse",
                "Pass gates D15-D19",
                "Look for Admirals Club entrance near gate D20 on your right"
            ]
        },
        "CENTURION_LOUNGE": {
            "name": "American Express Centurion Lounge",
            "description": "Exclusive lounge for American Express Platinum and Centurion cardholders featuring premium dining and amenities.",
            "location": "Terminal D",
            "terminal": "D",
            "gate": "D15",
            "estimatedWalkTime": "5-8 minutes from security",
            "hours": "5:00 AM - 11:00 PM daily",
            "amenities": [
                "Premium food and cocktails",
                "Spa services",
                "High-speed Wi-Fi and charging stations",
                "Quiet rooms",
                "Shower suites",
                "Family room"
            ],
            "directions": [
                "Clear security checkpoint",
                "Turn left into Terminal D concourse",
                "Walk approximately 300 feet",
                "Lounge entrance is near gate D15 on your left"
            ]
        },
        "FOOD_COURT": {
            "name": "Central Food Court",
            "description": "Main dining area with multiple restaurant options and cuisines.",
            "location": "Terminal C, Central Area",
            "terminal": "C",
            "estimatedWalkTime": "3-5 minutes from most gates",
            "hours": "4:30 AM - 11:00 PM daily",
            "amenities": [
                "10+ restaurant options",
                "Quick service and sit-down dining",
                "Grab-and-go options",
                "Charging stations at tables",
                "Family seating areas"
            ]
        },
        "DUTY_FREE": {
            "name": "Duty Free Americas",
            "description": "Tax-free shopping for international travelers offering luxury goods, spirits, and travel essentials.",
            "location": "Terminal D, International Gates",
            "terminal": "D",
            "gate": "D30",
            "estimatedWalkTime": "10-15 minutes from security",
            "hours": "Variable based on international flight schedules",
            "amenities": [
                "Designer fragrances and cosmetics",
                "Premium spirits and wine",
                "Luxury watches and accessories",
                "Travel essentials",
                "Gift items"
            ]
        },
        "BAGGAGE_CLAIM": {
            "name": "Baggage Claim Area",
            "description": "Baggage carousel area for arriving passengers.",
            "location": "Lower Level",
            "estimatedWalkTime": "5-10 minutes via escalator/elevator",
            "amenities": [
                "Multiple baggage carousels",
                "Baggage services desk",
                "Lost and found",
                "Ground transportation information"
            ],
            "directions": [
                "Follow 'Baggage Claim' signs from gate",
                "Take escalator or elevator to lower level",
                "Check flight information monitors for carousel number"
            ]
        },
        "TERMINAL_A": {
            "name": "Terminal A",
            "description": "Main terminal serving domestic flights with gates A1-A39.",
            "terminal": "A",
            "amenities": [
                "Multiple dining options",
                "Retail shops",
                "Restrooms throughout",
                "Charging stations",
                "Customer service desks"
            ]
        },
        "TERMINAL_B": {
            "name": "Terminal B",
            "description": "Secondary terminal serving domestic flights with gates B1-B49.",
            "terminal": "B",
            "amenities": [
                "Food court and restaurants",
                "Convenience stores",
                "Restrooms throughout",
                "Charging stations",
                "Family restrooms"
            ]
        },
        "TERMINAL_C": {
            "name": "Terminal C",
            "description": "Main concourse terminal with central food court and gates C1-C39.",
            "terminal": "C",
            "amenities": [
                "Central food court",
                "Multiple shops and services",
                "Restrooms throughout",
                "Business center",
                "Children's play area"
            ]
        }
    }

    key = destination.upper().replace(" ", "_")
    entry = destinations.get(key)
    if not entry:
        return {"ok": False, "error": f"Unknown destination: {destination}"}

    return {
        "ok": True,
        "component_type": "destination_info",
        "data": entry
    }


@tool
def show_flight_delay(
    flight_number: str = "AA 2847",
    delay_minutes: int = 90,
    reason: str = "Weather conditions",
    original_time: str = "3:00 PM",
    new_time: str = "4:30 PM"
) -> dict:
    """Show flight delay info when user asks about delays.
    IMPORTANT: Provide brief spoken response acknowledging the delay."""

    # Determine options based on delay duration
    options = [{"id": "wait", "label": "Wait for flight", "description": "Stay at gate"}]
    if delay_minutes >= 60:
        options.append({"id": "rebook", "label": "View rebooking options", "description": "Find alternative flight"})
    if delay_minutes >= 180:
        options.append({"id": "compensation", "label": "Request compensation", "description": "File claim"})

    return {
        "component_type": "flight_delay",
        "data": {
            "flightNumber": flight_number,
            "delayMinutes": delay_minutes,
            "reason": reason,
            "originalTime": original_time,
            "newTime": new_time,
            "resolutionOptions": options,
        }
    }


@tool
def show_flight_cancellation(
    flight_number: str = "AA 2847",
    reason: str = "Aircraft mechanical issue",
    automatic_rebooking: bool = True
) -> dict:
    """Show cancellation notice when user asks or flight is cancelled.
    IMPORTANT: Provide spoken explanation and next steps."""

    return {
        "component_type": "flight_cancellation",
        "data": {
            "flightNumber": flight_number,
            "reason": reason,
            "automaticRebooking": automatic_rebooking,
            "nextSteps": [
                "We're automatically rebooking you on the next available flight",
                "You can view alternatives and select your preferred option",
                "Compensation may be available based on circumstances"
            ]
        }
    }


@tool
def show_overbooking_offer(
    reason: str = "Flight Overbooked",
    compensation_type: str = "choice",  # "both", "choice", "cash", "credits"
    cash_amount: int = 400,
    credits_amount: int = 600
) -> dict:
    """Show overbooking offer modal when volunteers needed.
    IMPORTANT: Explain the offer and compensation options."""

    import time

    # Mock flight data (in production, fetch from DB)
    original = {
        "flightNumber": "AA 2847",
        "date": "Jan 25, 2026",
        "departureTime": "3:00 PM",
        "arrivalTime": "4:30 PM",
        "origin": {"code": "DFW", "city": "Dallas"},
        "destination": {"code": "LAX", "city": "Los Angeles"},
        "gate": "D24",
    }
    new = {
        "flightNumber": "AA 2849",
        "date": "Jan 25, 2026",
        "departureTime": "5:30 PM",
        "arrivalTime": "7:00 PM",
        "origin": {"code": "DFW", "city": "Dallas"},
        "destination": {"code": "LAX", "city": "Los Angeles"},
        "gate": "D26",
    }

    return {
        "component_type": "overbooking_offer",
        "data": {
            "id": f"ob_{int(time.time())}",
            "reason": reason,
            "reasonDetail": "More passengers checked in than available seats",
            "originalFlight": original,
            "newFlight": new,
            "compensation": {
                "type": compensation_type,
                "cashAmount": cash_amount,
                "creditsAmount": credits_amount,
                "creditsExpiryMonths": 12,
            },
            "expiresAt": "5 minutes",
        }
    }


@tool
def show_rebooking_options(
    flight_number: str = "AA 2847",
    is_refundable: bool = False,
    reason: str = "passenger_request"
) -> dict:
    """Show rebooking modal when user wants to reschedule.
    IMPORTANT: Introduce the rebooking options available."""

    # Mock current flight
    current = {
        "flightNumber": flight_number,
        "departureTime": "3:00 PM",
        "arrivalTime": "4:30 PM",
        "origin": {"code": "DFW", "city": "Dallas"},
        "destination": {"code": "LAX", "city": "Los Angeles"},
    }

    # Mock alternatives (in production, call flight search API)
    alternatives = [
        {
            "id": "alt_1",
            "flightNumber": "AA 2849",
            "departureDate": "Jan 25, 2026",
            "departureTime": "5:30 PM",
            "arrivalTime": "7:00 PM",
            "duration": "3h 30m",
            "status": "On Time",
            "origin": {"code": "DFW", "city": "Dallas"},
            "destination": {"code": "LAX", "city": "Los Angeles"},
            "price": 0,
            "seats": 12,
            "stops": 0,
            "aircraft": "Boeing 737",
        },
        {
            "id": "alt_2",
            "flightNumber": "AA 2851",
            "departureDate": "Jan 25, 2026",
            "departureTime": "8:00 PM",
            "arrivalTime": "9:30 PM",
            "duration": "3h 30m",
            "status": "On Time",
            "origin": {"code": "DFW", "city": "Dallas"},
            "destination": {"code": "LAX", "city": "Los Angeles"},
            "price": 0,
            "seats": 8,
            "stops": 0,
            "aircraft": "Airbus A321",
        },
    ]

    return {
        "component_type": "rebooking_options",
        "data": {
            "currentFlight": current,
            "isRefundable": is_refundable,
            "reason": reason,
            "alternatives": alternatives,
        }
    }


@tool
def search_knowledge_base(query: str) -> str:
    """Search airport knowledge base for policies, procedures, services, and facilities information.
    Use this when the user asks about airport rules, baggage policies, security procedures, available services, or facility information."""
    if _rag_service is None:
        return "Knowledge base not available."

    try:
        import asyncio
        citations = asyncio.run(_rag_service.retrieve(query))

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


@tool
def show_seat_management() -> dict:
    """Show seat selection interface when user asks about their seat, changing seats, or viewing seat map.
    IMPORTANT: After calling this tool, provide a brief spoken response acknowledging what you're showing."""
    return {
        "component_type": "seat_management",
        "data": {
            "currentSeat": "12C",
            "seatClass": "Main Cabin",
            "features": ["Window", "Extra Legroom"],
            "availableSeats": [
                {"id": "12A", "type": "window", "available": True, "price": 0},
                {"id": "12B", "type": "middle", "available": True, "price": 0},
                {"id": "12C", "type": "aisle", "available": False, "price": 0, "current": True},
                {"id": "14A", "type": "window", "available": True, "price": 35, "extra": "Exit Row"},
                {"id": "14F", "type": "aisle", "available": True, "price": 35, "extra": "Exit Row"},
                {"id": "16C", "type": "aisle", "available": True, "price": 15},
            ]
        }
    }


@tool
def show_meal_preference() -> dict:
    """Show meal selection interface when user asks about meals, food preferences, or in-flight dining.
    IMPORTANT: After calling this tool, provide a brief spoken response acknowledging what you're showing."""
    return {
        "component_type": "meal_preference",
        "data": {
            "currentMeal": "Vegetarian Pasta",
            "mealService": "Complimentary meal service on this flight",
            "availableMeals": [
                {
                    "id": "chicken",
                    "name": "Grilled Chicken",
                    "description": "Herb-seasoned grilled chicken breast with roasted vegetables",
                    "dietary": ["Gluten-Free"],
                    "available": True
                },
                {
                    "id": "pasta",
                    "name": "Vegetarian Pasta",
                    "description": "Penne pasta with marinara sauce and seasonal vegetables",
                    "dietary": ["Vegetarian"],
                    "available": True,
                    "selected": True
                },
                {
                    "id": "salad",
                    "name": "Mediterranean Salad",
                    "description": "Fresh greens with feta, olives, and balsamic vinaigrette",
                    "dietary": ["Vegetarian", "Vegan Option"],
                    "available": True
                }
            ]
        }
    }


@tool
def show_checked_bags() -> dict:
    """Show checked baggage information when user asks about bags, luggage, or baggage allowance.
    IMPORTANT: After calling this tool, provide a brief spoken response acknowledging what you're showing."""
    return {
        "component_type": "checked_bags",
        "data": {
            "checkedBags": 1,
            "allowance": 2,
            "weight": "23 kg (50 lbs) per bag",
            "bags": [
                {
                    "id": "bag-1",
                    "tagNumber": "AA 1234567890",
                    "weight": "18 kg (40 lbs)",
                    "status": "Checked in",
                    "destination": "LAX"
                }
            ],
            "additionalBagFee": "$35 per bag",
            "oversizeFee": "$200 per bag"
        }
    }


@tool
def show_wifi() -> dict:
    """Show WiFi connection information when user asks about internet, WiFi, or in-flight connectivity.
    IMPORTANT: After calling this tool, provide a brief spoken response acknowledging what you're showing."""
    return {
        "component_type": "wifi",
        "data": {
            "available": True,
            "network": "AA-Inflight",
            "plans": [
                {
                    "id": "free",
                    "name": "Free Messaging",
                    "price": 0,
                    "description": "iMessage, WhatsApp, and Facebook Messenger",
                    "speed": "Basic"
                },
                {
                    "id": "full",
                    "name": "Full Flight WiFi",
                    "price": 12,
                    "description": "Unlimited high-speed internet for the entire flight",
                    "speed": "High Speed"
                },
                {
                    "id": "streaming",
                    "name": "Streaming Pass",
                    "price": 18,
                    "description": "Stream video and music without buffering",
                    "speed": "Maximum Speed"
                }
            ],
            "instructions": [
                "Connect to 'AA-Inflight' WiFi network",
                "Open your browser",
                "Select a plan and complete payment",
                "Start browsing!"
            ]
        }
    }


tools = [
    get_current_time, add, multiply, divide,
    show_flight_details, show_weather, show_map, show_destination_info,
    show_flight_delay, show_flight_cancellation, show_overbooking_offer, show_rebooking_options,
    show_seat_management, show_meal_preference, show_checked_bags, show_wifi,
    search_knowledge_base
]
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
- show_destination_info: use when the user asks about specific airport destinations, lounges, restaurants, shops, or terminal information. Valid destinations: ADMIRALS_CLUB, CENTURION_LOUNGE, FOOD_COURT, DUTY_FREE, BAGGAGE_CLAIM, TERMINAL_A, TERMINAL_B, TERMINAL_C
- show_flight_delay: when user asks about delays or flight timing changes
- show_flight_cancellation: when user asks about cancellations or their flight is cancelled
- show_overbooking_offer: when airline needs volunteers due to overbooking
- show_rebooking_options: when user wants to reschedule, change flights, or rebook
- show_seat_management: when user asks about their seat, changing seats, or viewing seat map
- show_meal_preference: when user asks about meals, food preferences, or in-flight dining
- show_checked_bags: when user asks about bags, luggage, or baggage allowance
- show_wifi: when user asks about internet, WiFi, or in-flight connectivity
- search_knowledge_base: use when the user asks about airport policies, procedures, baggage rules, security guidelines, available services, or facility information

CRITICAL: After calling show_flight_details, show_weather, show_map, show_destination_info, show_flight_delay, show_flight_cancellation, show_overbooking_offer, show_rebooking_options, show_seat_management, show_meal_preference, show_checked_bags, or show_wifi, you MUST provide a brief spoken response (1-2 sentences) to accompany the visual component.
For example: "Here are your flight details" or "Here's the weather in Dallas." or "Here are directions to Gate A28. Follow the highlighted path." or "Here's information about the Admirals Club lounge." or "Your flight is delayed by 90 minutes" or "I'm showing you alternative flights." or "Here's your current seat." or "Here are your meal options." or "Here's your baggage info." or "Here's how to connect to WiFi."

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
