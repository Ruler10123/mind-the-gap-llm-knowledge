import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plane,
  Users,
  Luggage,
  Wifi,
  Coffee,
  Cloud,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
  Calendar,
  DoorOpen,
} from 'lucide-react'

interface FlightDetailsCardProps {
  onClose?: () => void
}

export function FlightDetailsCard({ onClose }: FlightDetailsCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'baggage' | 'amenities'>('overview')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Dummy flight data - will be replaced with real data
  const flightData = {
    flightNumber: 'AA 2847',
    origin: { code: 'DFW', city: 'Dallas/Fort Worth', terminal: 'D', gate: 'D23' },
    destination: { code: 'LAX', city: 'Los Angeles', terminal: '4', gate: 'TBA' },
    departureTime: '2:45 PM',
    arrivalTime: '4:15 PM',
    scheduledDeparture: '2:45 PM',
    scheduledArrival: '4:15 PM',
    status: 'On Time',
    boardingStatus: 'Boarding Group 3',
    currentPhase: 'boarding', // checkin, security, lounge, gate, boarding, departed, arrived
    progress: 65, // 0-100
    seat: '12F',
    seatType: 'Main Cabin Extra',
    duration: '3h 30m',
    aircraft: 'Boeing 737-800',
    bags: {
      checked: 2,
      checkedIn: 2,
      loaded: 1,
      carryon: 1,
    },
    weather: {
      origin: { temp: 78, condition: 'Sunny', icon: '☀️' },
      destination: { temp: 72, condition: 'Partly Cloudy', icon: '⛅' },
    },
    onTimePerformance: 92,
    amenities: ['WiFi', 'Power Outlets', 'Streaming Entertainment', 'Premium Snacks'],
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const phases = [
    { id: 'checkin', label: 'Check-in', progress: 100 },
    { id: 'security', label: 'Security', progress: 100 },
    { id: 'lounge', label: 'Lounge', progress: 100 },
    { id: 'gate', label: 'Gate', progress: 80 },
    { id: 'boarding', label: 'Boarding', progress: 40 },
    { id: 'departed', label: 'In Flight', progress: 0 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto pointer-events-auto"
    >
      {/* Main Card */}
      <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
        {/* Header - Flight Number & Route */}
        <div className="bg-gradient-to-r from-[#0E1F34] to-[#1a3350] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8102E]/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-3xl font-bold">{flightData.flightNumber}</h2>
                  <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-200 text-xs font-medium">
                    {flightData.status}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{flightData.aircraft}</p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Route */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-4xl font-bold mb-1">{flightData.origin.code}</div>
                <div className="text-white/70 text-sm">{flightData.origin.city}</div>
                <div className="text-white/50 text-xs mt-1">Gate {flightData.origin.gate}</div>
              </div>

              <div className="flex-1 flex flex-col items-center px-4">
                <div className="relative w-full">
                  <div className="h-px bg-white/30 w-full" />
                  <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#C8102E] rotate-90" />
                </div>
                <div className="text-white/70 text-sm mt-2">{flightData.duration}</div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-4xl font-bold mb-1">{flightData.destination.code}</div>
                <div className="text-white/70 text-sm">{flightData.destination.city}</div>
                <div className="text-white/50 text-xs mt-1">
                  Gate {flightData.destination.gate}
                </div>
              </div>
            </div>

            {/* Times */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
              <div>
                <div className="text-white/60 text-xs mb-1">Departure</div>
                <div className="text-xl font-semibold">{flightData.departureTime}</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-xs mb-1">Arrival</div>
                <div className="text-xl font-semibold">{flightData.arrivalTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Boarding Progress */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Boarding Progress</h3>
            <span className="text-sm font-medium text-[#C8102E]">
              {flightData.boardingStatus}
            </span>
          </div>
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C8102E] to-[#e01e3a] transition-all duration-500 rounded-full"
                style={{ width: `${flightData.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {phases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / phases.length}%` }}
                >
                  <div
                    className={`w-2 h-2 rounded-full mb-1 ${
                      phase.progress === 100
                        ? 'bg-[#C8102E]'
                        : phase.progress > 0
                          ? 'bg-[#C8102E]/50'
                          : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-[10px] text-gray-500 text-center">{phase.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'baggage', label: 'Baggage' },
            { id: 'amenities', label: 'Amenities' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#C8102E] border-b-2 border-[#C8102E]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Seat Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Your Seat</div>
                    <div className="text-2xl font-bold text-[#0E1F34]">{flightData.seat}</div>
                    <div className="text-xs text-gray-500 mt-1">{flightData.seatType}</div>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-8 h-8 text-[#C8102E]" />
                  </div>
                </div>
              </div>

              {/* Weather Comparison */}
              <div>
                <button
                  onClick={() => toggleSection('weather')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">Weather Conditions</span>
                  </div>
                  {expandedSection === 'weather' ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSection === 'weather' && (
                  <div className="mt-2 grid grid-cols-2 gap-3 px-3">
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="text-xs text-gray-600 mb-2">
                        {flightData.origin.code}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{flightData.weather.origin.icon}</span>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {flightData.weather.origin.temp}°F
                          </div>
                          <div className="text-xs text-gray-600">
                            {flightData.weather.origin.condition}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-gray-600 mb-2">
                        {flightData.destination.code}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{flightData.weather.destination.icon}</span>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {flightData.weather.destination.temp}°F
                          </div>
                          <div className="text-xs text-gray-600">
                            {flightData.weather.destination.condition}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* On-Time Performance */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-800">On-Time Performance</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {flightData.onTimePerformance}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  This flight arrives on time {flightData.onTimePerformance}% of the time
                </p>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Terminal</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    {flightData.origin.terminal}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DoorOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Gate</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    {flightData.origin.gate}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Baggage Tab */}
          {activeTab === 'baggage' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Luggage className="w-6 h-6 text-[#C8102E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Baggage Status</h3>
                    <p className="text-xs text-gray-600">
                      {flightData.bags.loaded} of {flightData.bags.checked} bags loaded
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">Bag 1</div>
                        <div className="text-xs text-gray-500">Loaded - 23 lbs</div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-600">Ready</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Bag 2</div>
                        <div className="text-xs text-gray-500">In transit - 19 lbs</div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-600">Loading</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">Carry-On</div>
                        <div className="text-xs text-gray-500">Overhead bin space available</div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-600">1 item</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>Baggage Claim:</strong> Carousel 3 at {flightData.destination.code}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {[
                  { icon: Wifi, label: 'WiFi Available', detail: 'Purchase in-flight' },
                  { icon: Coffee, label: 'Premium Snacks', detail: 'Complimentary' },
                  {
                    icon: Plane,
                    label: 'Streaming Entertainment',
                    detail: 'Free movies & TV',
                  },
                  { icon: Users, label: 'Power Outlets', detail: 'At every seat' },
                ].map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <amenity.icon className="w-6 h-6 text-[#C8102E]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{amenity.label}</div>
                      <div className="text-sm text-gray-600">{amenity.detail}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong className="text-indigo-900">Main Cabin Extra:</strong> Enjoy up to 6
                    inches of extra legroom and priority boarding.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 px-4 bg-[#C8102E] hover:bg-[#a50d26] text-white rounded-lg font-medium transition-colors text-sm">
              View Boarding Pass
            </button>
            <button className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-medium border border-gray-300 transition-colors text-sm">
              Change Seat
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
