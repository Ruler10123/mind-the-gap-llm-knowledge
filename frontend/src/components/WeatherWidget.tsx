import { Droplets, Wind, Eye, Sun, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface WeatherWidgetProps {
  location?: string
  advice?: string | null
  isMinimized?: boolean
  onToggleMinimize?: () => void
  onClose?: () => void
}

export function WeatherWidget({ location = 'Dallas', advice, isMinimized = false, onToggleMinimize, onClose }: WeatherWidgetProps) {
  // Dummy data - will be replaced with real API data
  const weather = {
    location: location,
    temp: 78,
    condition: 'Sunny',
    high: 82,
    low: 68,
    humidity: 45,
    windSpeed: 8,
    visibility: 10,
    uvIndex: 7,
  }

  // Weather background images - using Unsplash weather images (will be replaced with proper library)
  const weatherImages = {
    Sunny: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&q=80',
    Cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80',
    Rainy: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80',
    Clear: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800&q=80',
  }

  const bgImage = weatherImages['Sunny'] || weatherImages.Sunny

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
                <span className="text-sm font-light text-gray-500">{weather.condition}</span>
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
            <p className="text-xl font-light text-white/90 mb-1">{weather.condition}</p>
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
