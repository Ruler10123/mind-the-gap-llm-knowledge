"""Weather service using OpenWeatherMap API."""

import httpx
import asyncio
from typing import Optional
from config import settings
from observability.logger import logger


class WeatherService:
    """Service for fetching weather data from OpenWeatherMap."""

    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "openweather_api_key", None)

    def get_weather_sync(self, city: str) -> Optional[dict]:
        """
        Synchronously fetch current weather for a city.
        Uses sync httpx client for compatibility with tool calls.
        """
        if not self.api_key:
            logger.warning("[WeatherService] No API key provided, returning None")
            return None

        try:
            import httpx
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    self.BASE_URL,
                    params={
                        "q": city,
                        "appid": self.api_key,
                        "units": "imperial",  # Fahrenheit and mph
                    },
                )
                response.raise_for_status()
                data = response.json()

                # Check API response code (200 = success, other codes indicate errors)
                cod = data.get("cod")
                if cod != 200:
                    error_message = data.get("message", "Unknown error")
                    logger.error(f"[WeatherService] API error for {city}: {cod} - {error_message}")
                    return None

                # Extract weather data - API returns weather as an array
                weather_array = data.get("weather", [])
                if not weather_array:
                    logger.warning(f"[WeatherService] No weather data in response for {city}")
                    return None
                
                weather = weather_array[0]
                main = data.get("main", {})
                wind = data.get("wind", {})
                
                # Visibility is in meters, max is 10000 (10km) per API docs
                visibility_m = data.get("visibility", 10000)
                if visibility_m > 10000:
                    visibility_m = 10000

                # Convert visibility from meters to miles
                visibility_miles = visibility_m / 1609.34

                # Get UV index (not in current weather API, using a placeholder based on conditions)
                # In production, you'd use the One Call API 3.0 for UV index
                uv_index = self._estimate_uv_index(weather.get("main", ""), data.get("dt", 0))

                # Extract city name from response (more reliable than query parameter)
                city_name = data.get("name", city.split(",")[0] if "," in city else city)

                temp_f = int(round(main.get("temp", 70)))
                condition = weather.get("main", "Clear")

                return {
                    "location": city_name,
                    "temp": temp_f,
                    "condition": condition,
                    "high": int(round(main.get("temp_max", main.get("temp", 75)))),
                    "low": int(round(main.get("temp_min", main.get("temp", 65)))),
                    "humidity": int(round(main.get("humidity", 50))),
                    "windSpeed": round(wind.get("speed", 0), 1),
                    "visibility": round(visibility_miles, 1),
                    "uvIndex": uv_index,
                    "icon": weather.get("icon", "01d"),
                    "description": weather.get("description", "clear sky").capitalize(),
                    "advice": self._get_weather_advice(condition, temp_f),
                }
        except httpx.HTTPStatusError as e:
            error_detail = ""
            try:
                error_data = e.response.json()
                error_detail = f" - {error_data.get('message', '')}"
            except:
                pass
            logger.error(f"[WeatherService] HTTP error fetching weather for {city}: {e.response.status_code}{error_detail}")
            return None
        except httpx.RequestError as e:
            logger.error(f"[WeatherService] Request error fetching weather for {city}: {e}")
            return None
        except KeyError as e:
            logger.error(f"[WeatherService] Missing expected field in API response for {city}: {e}")
            return None
        except Exception as e:
            logger.error(f"[WeatherService] Unexpected error fetching weather for {city}: {e}")
            return None

    async def get_weather(self, city: str) -> Optional[dict]:
        """
        Fetch current weather for a city.
        
        Returns dict with:
        - location: str
        - temp: int (Fahrenheit)
        - condition: str
        - high: int (Fahrenheit)
        - low: int (Fahrenheit)
        - humidity: int (percentage)
        - windSpeed: float (mph)
        - visibility: float (miles)
        - uvIndex: int (0-11)
        - icon: str (OpenWeatherMap icon code)
        - description: str (detailed condition description)
        """
        if not self.api_key:
            logger.warning("[WeatherService] No API key provided, returning None")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.BASE_URL,
                    params={
                        "q": city,
                        "appid": self.api_key,
                        "units": "imperial",  # Fahrenheit and mph
                    },
                )
                response.raise_for_status()
                data = response.json()

                # Check API response code (200 = success, other codes indicate errors)
                cod = data.get("cod")
                if cod != 200:
                    error_message = data.get("message", "Unknown error")
                    logger.error(f"[WeatherService] API error for {city}: {cod} - {error_message}")
                    return None

                # Extract weather data - API returns weather as an array
                weather_array = data.get("weather", [])
                if not weather_array:
                    logger.warning(f"[WeatherService] No weather data in response for {city}")
                    return None
                
                weather = weather_array[0]
                main = data.get("main", {})
                wind = data.get("wind", {})
                
                # Visibility is in meters, max is 10000 (10km) per API docs
                visibility_m = data.get("visibility", 10000)
                if visibility_m > 10000:
                    visibility_m = 10000

                # Convert visibility from meters to miles
                visibility_miles = visibility_m / 1609.34

                # Get UV index (not in current weather API, using a placeholder based on conditions)
                # In production, you'd use the One Call API 3.0 for UV index
                uv_index = self._estimate_uv_index(weather.get("main", ""), data.get("dt", 0))

                # Extract city name from response (more reliable than query parameter)
                city_name = data.get("name", city.split(",")[0] if "," in city else city)

                temp_f = int(round(main.get("temp", 70)))
                condition = weather.get("main", "Clear")

                return {
                    "location": city_name,
                    "temp": temp_f,
                    "condition": condition,
                    "high": int(round(main.get("temp_max", main.get("temp", 75)))),
                    "low": int(round(main.get("temp_min", main.get("temp", 65)))),
                    "humidity": int(round(main.get("humidity", 50))),
                    "windSpeed": round(wind.get("speed", 0), 1),
                    "visibility": round(visibility_miles, 1),
                    "uvIndex": uv_index,
                    "icon": weather.get("icon", "01d"),
                    "description": weather.get("description", "clear sky").capitalize(),
                    "advice": self._get_weather_advice(condition, temp_f),
                }
        except httpx.HTTPStatusError as e:
            error_detail = ""
            try:
                error_data = e.response.json()
                error_detail = f" - {error_data.get('message', '')}"
            except:
                pass
            logger.error(f"[WeatherService] HTTP error fetching weather for {city}: {e.response.status_code}{error_detail}")
            return None
        except httpx.RequestError as e:
            logger.error(f"[WeatherService] Request error fetching weather for {city}: {e}")
            return None
        except KeyError as e:
            logger.error(f"[WeatherService] Missing expected field in API response for {city}: {e}")
            return None
        except Exception as e:
            logger.error(f"[WeatherService] Unexpected error fetching weather for {city}: {e}")
            return None

    def _estimate_uv_index(self, condition: str, timestamp: int) -> int:
        """
        Estimate UV index based on weather condition.
        In production, use One Call API 3.0 for accurate UV data.
        """
        condition_lower = condition.lower()

        # Cloudy/rainy conditions reduce UV
        if "cloud" in condition_lower or "rain" in condition_lower or "storm" in condition_lower:
            return 2
        elif "clear" in condition_lower or "sunny" in condition_lower:
            # Assume moderate UV for clear/sunny (would need time of day for accuracy)
            return 6
        else:
            return 4

    def _get_weather_advice(self, condition: str, temp: int) -> str:
        """Generate weather advice based on condition and temperature."""
        condition_lower = condition.lower()

        # Condition-based advice takes priority
        if "rain" in condition_lower or "drizzle" in condition_lower:
            return "Bring an umbrella and wear a waterproof jacket"
        if "snow" in condition_lower:
            return "Bundle up! Wear warm layers and waterproof boots"
        if "thunderstorm" in condition_lower or "storm" in condition_lower:
            return "Severe weather alert. Stay indoors if possible"
        if "cloud" in condition_lower:
            return "Overcast skies. Light jacket recommended"
        if "mist" in condition_lower or "fog" in condition_lower:
            return "Low visibility. Allow extra travel time"

        # Temperature-based advice
        if temp > 85:
            return "Hot weather. Stay hydrated and wear light clothing"
        if temp > 70:
            return "Pleasant weather. Dress comfortably"
        if temp > 50:
            return "Mild weather. Light jacket recommended"
        if temp > 32:
            return "Cool weather. Dress in layers"

        return "Cold weather. Wear warm clothing"


# Global instance
_weather_service: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    """Get or create weather service instance."""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service
