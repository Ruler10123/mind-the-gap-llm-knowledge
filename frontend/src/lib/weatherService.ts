const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'e2831fdf6ac7de111d3815a2cad347ca'
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

export interface WeatherData {
  location: string
  temp: number
  condition: string
  high: number
  low: number
  humidity: number
  windSpeed: number
  visibility: number
  uvIndex?: number
  icon: string
  description: string
  advice: string
  feelsLike: number
  pressure: number
  clouds: number
}

interface OpenWeatherResponse {
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  clouds: {
    all: number
  }
  name: string
  sys: {
    country: string
  }
}

// Map weather condition to advice
function getWeatherAdvice(condition: string, temp: number): string {
  const tempF = temp

  if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) {
    return 'Bring an umbrella and wear a waterproof jacket'
  }
  if (condition.toLowerCase().includes('snow')) {
    return 'Bundle up! Wear warm layers and waterproof boots'
  }
  if (condition.toLowerCase().includes('thunderstorm')) {
    return 'Severe weather alert. Stay indoors if possible'
  }
  if (condition.toLowerCase().includes('cloud')) {
    return 'Overcast skies. Light jacket recommended'
  }
  if (condition.toLowerCase().includes('mist') || condition.toLowerCase().includes('fog')) {
    return 'Low visibility. Allow extra travel time'
  }

  // Temperature-based advice
  if (tempF > 85) {
    return 'Hot weather. Stay hydrated and wear light clothing'
  }
  if (tempF > 70) {
    return 'Pleasant weather. Dress comfortably'
  }
  if (tempF > 50) {
    return 'Mild weather. Light jacket recommended'
  }
  if (tempF > 32) {
    return 'Cool weather. Dress in layers'
  }

  return 'Cold weather. Wear warm clothing'
}

// Map OpenWeatherMap icon codes to friendly icons
function mapWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  }

  return iconMap[iconCode] || '🌤️'
}

export async function getWeather(cityName: string): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&units=imperial&appid=${API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`)
    }

    const data: OpenWeatherResponse = await response.json()

    const weatherData: WeatherData = {
      location: `${data.name}, ${data.sys.country}`,
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      high: Math.round(data.main.temp_max),
      low: Math.round(data.main.temp_min),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      visibility: Math.round(data.visibility / 1609.34 * 10) / 10, // Convert meters to miles
      icon: mapWeatherIcon(data.weather[0].icon),
      description: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
      advice: getWeatherAdvice(data.weather[0].main, data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      pressure: data.main.pressure,
      clouds: data.clouds.all,
    }

    return weatherData
  } catch (error) {
    console.error('Error fetching weather:', error)
    throw error
  }
}

// Get weather for multiple locations
export async function getWeatherForLocations(cities: string[]): Promise<WeatherData[]> {
  try {
    const weatherPromises = cities.map(city => getWeather(city))
    return await Promise.all(weatherPromises)
  } catch (error) {
    console.error('Error fetching weather for multiple locations:', error)
    throw error
  }
}
