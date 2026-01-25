import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FlightDetailsCard } from '@/components/FlightDetailsCard'
import { WeatherWidget } from '@/components/WeatherWidget'
import { FlightRescheduler } from '@/components/FlightRescheduler'
import { SeatManagement } from '@/components/SeatManagement'
import { MealPreference } from '@/components/MealPreference'
import { CheckedBags } from '@/components/CheckedBags'
import { WiFiManagement } from '@/components/WiFiManagement'
import { TripSummary } from '@/components/TripSummary'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/flight-preview')({
  component: FlightPreviewPage,
})

type ActiveView = 'none' | 'rescheduler' | 'seat' | 'meal' | 'bags' | 'wifi' | 'summary'

function FlightPreviewPage() {
  const [flightMinimized, setFlightMinimized] = useState(false)
  const [weatherMinimized, setWeatherMinimized] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>('none')

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
    toast.success(`Flight ${selectedFlight.flightNumber} confirmed!`, {
      description: 'Your profile and boarding pass have been updated',
    })
    setActiveView('none')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0E1F34] mb-2">Component Preview</h1>
          <p className="text-gray-700">Kiosk background simulation - 3 column chat layout</p>
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => setActiveView('rescheduler')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'rescheduler'
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-[#C8102E]/20 border border-[#C8102E]/40 text-[#C8102E] hover:bg-[#C8102E]/30'
                }`}
              >
                Flight Rescheduler
              </button>
              <button
                onClick={() => setActiveView('seat')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'seat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-700 hover:bg-blue-500/30'
                }`}
              >
                Seat Management
              </button>
              <button
                onClick={() => setActiveView('meal')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'meal'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500/20 border border-green-500/40 text-green-700 hover:bg-green-500/30'
                }`}
              >
                Meal Preference
              </button>
              <button
                onClick={() => setActiveView('bags')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'bags'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-700 hover:bg-amber-500/30'
                }`}
              >
                Checked Bags
              </button>
              <button
                onClick={() => setActiveView('wifi')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'wifi'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-500/20 border border-purple-500/40 text-purple-700 hover:bg-purple-500/30'
                }`}
              >
                Wi-Fi Management
              </button>
              <button
                onClick={() => setActiveView('summary')}
                className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                  activeView === 'summary'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-500/20 border border-gray-500/40 text-gray-700 hover:bg-gray-500/30'
                }`}
              >
                Trip Summary
              </button>
              {activeView !== 'none' && (
                <button
                  onClick={() => setActiveView('none')}
                  className="px-4 py-2 rounded-lg text-sm font-light bg-white/30 border border-white/40 text-[#0E1F34] hover:bg-white/40 transition-all"
                >
                  Hide All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Flight Rescheduler */}
        {activeView === 'rescheduler' && (
          <FlightRescheduler
            isRefundable={true}
            currentFlight={{
              flightNumber: 'AA 2847',
              departureTime: '2:45 PM',
              origin: { code: 'DFW', city: 'Dallas' },
              destination: { code: 'LAX', city: 'Los Angeles' },
              arrivalTime: '4:20 PM',
              departureDate: 'Today, Jan 25',
            }}
            alternatives={alternativeFlights}
            onConfirm={handleFlightConfirm}
            onCancel={() => setActiveView('none')}
          />
        )}

        {/* Seat Management */}
        {activeView === 'seat' && (
          <SeatManagement
            onClose={() => setActiveView('none')}
            aiMode={true}
          />
        )}

        {/* Meal Preference */}
        {activeView === 'meal' && (
          <MealPreference
            onClose={() => setActiveView('none')}
            aiMode={true}
          />
        )}

        {/* Checked Bags */}
        {activeView === 'bags' && (
          <CheckedBags
            onClose={() => setActiveView('none')}
            aiMode={true}
          />
        )}

        {/* WiFi Management */}
        {activeView === 'wifi' && (
          <WiFiManagement
            onClose={() => setActiveView('none')}
            aiMode={true}
          />
        )}

        {/* Trip Summary */}
        {activeView === 'summary' && (
          <TripSummary
            onClose={() => setActiveView('none')}
          />
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
