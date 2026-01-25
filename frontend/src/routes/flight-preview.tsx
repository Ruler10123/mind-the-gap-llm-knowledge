import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FlightDetailsCard } from '@/components/FlightDetailsCard'
import { WeatherWidget } from '@/components/WeatherWidget'
import { FlightRescheduler } from '@/components/FlightRescheduler'

export const Route = createFileRoute('/flight-preview')({
  component: FlightPreviewPage,
})

function FlightPreviewPage() {
  const [flightMinimized, setFlightMinimized] = useState(false)
  const [weatherMinimized, setWeatherMinimized] = useState(false)
  const [showRescheduler, setShowRescheduler] = useState(false)

  // Dummy alternative flights data
  const alternativeFlights = [
    {
      id: '1',
      flightNumber: 'AA 1234',
      origin: { code: 'DFW', city: 'Dallas' },
      destination: { code: 'LAX', city: 'Los Angeles' },
      departureTime: '6:30 AM',
      arrivalTime: '8:00 AM',
      duration: '3h 30m',
      status: 'Available',
      price: 0, // No additional cost
      seats: 42,
      stops: 0,
      aircraft: 'Boeing 737-800',
      departureDate: 'Today, Jan 25',
    },
    {
      id: '2',
      flightNumber: 'AA 5678',
      origin: { code: 'DFW', city: 'Dallas' },
      destination: { code: 'LAX', city: 'Los Angeles' },
      departureTime: '11:15 AM',
      arrivalTime: '12:50 PM',
      duration: '3h 35m',
      status: 'Available',
      price: 75, // $75 additional
      seats: 18,
      stops: 0,
      aircraft: 'Airbus A321',
      departureDate: 'Today, Jan 25',
    },
    {
      id: '3',
      flightNumber: 'AA 9012',
      origin: { code: 'DFW', city: 'Dallas' },
      destination: { code: 'LAX', city: 'Los Angeles' },
      departureTime: '4:20 PM',
      arrivalTime: '5:55 PM',
      duration: '3h 35m',
      status: 'Available',
      price: -25, // $25 refund
      seats: 8,
      stops: 0,
      aircraft: 'Boeing 737-800',
      departureDate: 'Tomorrow, Jan 26',
    },
    {
      id: '4',
      flightNumber: 'AA 3456',
      origin: { code: 'DFW', city: 'Dallas' },
      destination: { code: 'LAX', city: 'Los Angeles' },
      departureTime: '1:30 PM',
      arrivalTime: '4:45 PM',
      duration: '5h 15m',
      status: 'Available',
      price: 0,
      seats: 35,
      stops: 1,
      aircraft: 'Boeing 737-700',
      departureDate: 'Tomorrow, Jan 26',
    },
  ]

  const handleFlightConfirm = (selectedFlight: any) => {
    console.log('Flight confirmed:', selectedFlight)
    alert(`Flight ${selectedFlight.flightNumber} confirmed! UI would update here.`)
  }

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
            <button
              onClick={() => setShowRescheduler(!showRescheduler)}
              className="px-4 py-2 bg-[#C8102E]/20 border border-[#C8102E]/40 rounded-lg text-sm font-light text-[#C8102E] hover:bg-[#C8102E]/30 transition-all"
            >
              {showRescheduler ? 'Hide' : 'Show'} Rescheduler
            </button>
          </div>
        </div>

        {!showRescheduler && (
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
        )}

        {/* Flight Rescheduler */}
        {showRescheduler && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0E1F34]">Flight Rescheduler</h2>
            <p className="text-gray-700 mb-6">
              AI checks refundability → Shows alternatives → User selects → Updates everywhere
            </p>

            {/* Refundable Ticket Example */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">Example: Refundable Ticket</h3>
              <FlightRescheduler
                isRefundable={true}
                currentFlight={{
                  flightNumber: 'AA 2847',
                  departureTime: '2:45 PM',
                }}
                alternatives={alternativeFlights}
                onConfirm={handleFlightConfirm}
                onCancel={() => setShowRescheduler(false)}
              />
            </div>

            {/* Non-Refundable Ticket Example */}
            <div>
              <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">Example: Non-Refundable Ticket</h3>
              <FlightRescheduler
                isRefundable={false}
                currentFlight={{
                  flightNumber: 'AA 2847',
                  departureTime: '2:45 PM',
                }}
                alternatives={alternativeFlights}
                onConfirm={handleFlightConfirm}
                onCancel={() => setShowRescheduler(false)}
              />
            </div>
          </div>
        )}

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
