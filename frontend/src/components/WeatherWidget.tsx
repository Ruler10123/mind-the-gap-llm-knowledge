import { Droplets, Wind, Eye, Sun, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface WeatherData {
  location: string
  temp: number
  condition: string
  high: number
  low: number
  humidity: number
  windSpeed: number
  visibility: number
  uvIndex: number
  icon?: string
  description?: string
}

interface WeatherWidgetProps {
  location?: string
  temp?: number
  condition?: string
  high?: number
  low?: number
  humidity?: number
  windSpeed?: number
  visibility?: number
  uvIndex?: number
  icon?: string
  description?: string
  advice?: string | null
  isMinimized?: boolean
  onToggleMinimize?: () => void
  onClose?: () => void
}

// Comprehensive weather image mapping based on OpenWeatherMap conditions and icons
function getWeatherImage(condition: string, icon?: string, description?: string): string {
  const conditionLower = condition.toLowerCase()
  const descLower = description?.toLowerCase() || ''
  
  // Use icon code if available (OpenWeatherMap format: 01d, 02n, etc.)
  if (icon) {
    const iconCode = icon.slice(0, 2) // First 2 chars indicate condition
    const isNight = icon.includes('n')
    
    // Clear sky
    if (iconCode === '01') {
      return isNight 
        ? 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
        : 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&q=80'
    }
    // Few clouds
    if (iconCode === '02') {
      return 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80'
    }
    // Scattered clouds
    if (iconCode === '03') {
      return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80'
    }
    // Broken clouds
    if (iconCode === '04') {
      return 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80'
    }
    // Shower rain / Rain
    if (iconCode === '09' || iconCode === '10') {
      return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80'
    }
    // Thunderstorm
    if (iconCode === '11') {
      return 'https://images.unsplash.com/photo-1594736797933-d0cbc0c0d5e0?w=800&q=80'
    }
    // Snow
    if (iconCode === '13') {
      return 'https://images.unsplash.com/photo-1483664852090-d6c1b73251c1?w=800&q=80'
    }
    // Mist / Fog
    if (iconCode === '50') {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
    }
  }
  
  // Fallback to condition-based mapping
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&q=80'
  }
  if (conditionLower.includes('cloud') || descLower.includes('cloud')) {
    if (descLower.includes('few') || descLower.includes('scattered')) {
      return 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80'
    }
    return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80'
  }
  if (conditionLower.includes('rain') || descLower.includes('rain') || descLower.includes('drizzle')) {
    if (descLower.includes('thunder') || descLower.includes('storm')) {
      return 'https://images.unsplash.com/photo-1594736797933-d0cbc0c0d5e0?w=800&q=80'
    }
    return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80'
  }
  if (conditionLower.includes('storm') || descLower.includes('thunder')) {
    return 'https://images.unsplash.com/photo-1594736797933-d0cbc0c0d5e0?w=800&q=80'
  }
  if (conditionLower.includes('snow') || descLower.includes('snow')) {
    return 'https://images.unsplash.com/photo-1483664852090-d6c1b73251c1?w=800&q=80'
  }
  if (conditionLower.includes('mist') || conditionLower.includes('fog') || descLower.includes('mist') || descLower.includes('fog')) {
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  }
  
  // Default sunny/clear
  return 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&q=80'
}

export function WeatherWidget({ 
  location: locationProp = 'Dallas',
  temp: tempProp,
  condition: conditionProp,
  high: highProp,
  low: lowProp,
  humidity: humidityProp,
  windSpeed: windSpeedProp,
  visibility: visibilityProp,
  uvIndex: uvIndexProp,
  icon,
  description,
  advice,
  isMinimized = false,
  onToggleMinimize,
  onClose
}: WeatherWidgetProps) {
  // Use real data if provided, otherwise fallback to defaults
  const weather: WeatherData = {
    location: locationProp,
    temp: tempProp ?? 78,
    condition: conditionProp ?? 'Sunny',
    high: highProp ?? 82,
    low: lowProp ?? 68,
    humidity: humidityProp ?? 45,
    windSpeed: windSpeedProp ?? 8,
    visibility: visibilityProp ?? 10,
    uvIndex: uvIndexProp ?? 7,
    icon,
    description,
  }

  const bgImage = getWeatherImage(weather.condition, weather.icon, weather.description)

  if (isMinimized) {
    // Minimized/Collapsed State - Compact
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/20 border border-white/30 shadow-2xl cursor-pointer transition-all hover:bg-white/25"
          onClick={onToggleMinimize}
        >
          {/* Uniform top padding */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-light text-[#0E1F34]">{weather.location}</span>
                <span className="text-3xl font-extralight text-gray-600">{weather.temp}°</span>
                <span className="text-sm font-light text-gray-500">{weather.description || weather.condition}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expanded State - Full Details
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Apple-style Weather Card with Real Background */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl shadow-2xl h-64 transition-all">
        {/* Real Weather Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />

        {/* Uniform top padding - p-8 */}
        <div className="relative p-8 h-full flex flex-col justify-between">
          {/* Top Row - Location & Details Grid */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <p className="text-base font-light text-white/90">{weather.location}</p>
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Compact Details Grid - Top Right */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-white/70" />
                <span className="text-3xl font-light text-white">{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-6 h-6 text-white/70" />
                <span className="text-3xl font-light text-white">{weather.windSpeed} mph</span>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white/70" />
                <span className="text-3xl font-light text-white">{weather.visibility} mi</span>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="w-6 h-6 text-white/70" />
                <span className="text-3xl font-light text-white">UV {weather.uvIndex}</span>
              </div>
            </div>
          </div>

          {/* Bottom - Large Temperature */}
          <div>
            <div className="text-7xl font-extralight text-white mb-2">{weather.temp}°</div>
            <p className="text-xl font-light text-white/90 mb-1 capitalize">{weather.description || weather.condition}</p>
            <p className="text-base font-light text-white/80">
              H:{weather.high}° L:{weather.low}°
            </p>
          </div>
        </div>
      </div>

      {/* Advice Card - shown when advice is provided */}
      {advice && (
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-amber-200/50 shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Lightbulb className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Travel Tips</h3>
              <p className="text-base font-light text-amber-800 leading-relaxed">{advice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
