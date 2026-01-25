import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FlightDetailsCard } from '@/components/FlightDetailsCard'
import { WeatherWidget } from '@/components/WeatherWidget'

export const Route = createFileRoute('/flight-preview')({
  component: FlightPreviewPage,
})

function FlightPreviewPage() {
  const [flightMinimized, setFlightMinimized] = useState(false)
  const [weatherMinimized, setWeatherMinimized] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0E1F34] mb-2">Component Preview</h1>
          <p className="text-gray-700">Kiosk background simulation - 3 column chat layout</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setFlightMinimized(!flightMinimized)}
              className="px-4 py-2 bg-white/30 border border-white/40 rounded-lg text-sm font-light text-[#0E1F34] hover:bg-white/40 transition-all"
            >
              Toggle Flight: {flightMinimized ? 'Minimized' : 'Expanded'}
            </button>
            <button
              onClick={() => setWeatherMinimized(!weatherMinimized)}
              className="px-4 py-2 bg-white/30 border border-white/40 rounded-lg text-sm font-light text-[#0E1F34] hover:bg-white/40 transition-all"
            >
              Toggle Weather: {weatherMinimized ? 'Minimized' : 'Expanded'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Flight Details */}
          <FlightDetailsCard
            isMinimized={flightMinimized}
            onToggleMinimize={() => setFlightMinimized(!flightMinimized)}
          />

          {/* Weather Widget */}
          <WeatherWidget
            isMinimized={weatherMinimized}
            onToggleMinimize={() => setWeatherMinimized(!weatherMinimized)}
          />
        </div>

        {/* 3-Column Layout Demo */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#0E1F34] mb-4">3-Column Chat Layout Preview</h2>
          <p className="text-gray-700 mb-6">
            Components can be placed in side columns when minimized, or take center stage when expanded
          </p>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <p className="text-xs font-light text-gray-500 text-center">LEFT SIDEBAR</p>
              <WeatherWidget
                isMinimized={true}
                onToggleMinimize={() => {}}
              />
            </div>

            {/* Center Column - Main Chat */}
            <div className="space-y-4">
              <p className="text-xs font-light text-gray-500 text-center">MAIN CHAT</p>
              <div className="backdrop-blur-3xl bg-white/20 border border-white/30 rounded-3xl p-6 h-96">
                <p className="text-sm font-light text-gray-600 text-center">
                  Chat messages appear here
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <p className="text-xs font-light text-gray-500 text-center">RIGHT SIDEBAR</p>
              <FlightDetailsCard
                isMinimized={true}
                onToggleMinimize={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
