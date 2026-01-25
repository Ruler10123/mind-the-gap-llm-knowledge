import { Plane, Calendar, Clock, MapPin, User, Armchair, UtensilsCrossed, Luggage, Wifi } from 'lucide-react'

interface TripSummaryProps {
  flightNumber?: string
  origin?: { code: string; city: string }
  destination?: { code: string; city: string }
  departureDate?: string
  departureTime?: string
  arrivalTime?: string
  seat?: string
  meal?: string
  bags?: number
  wifi?: boolean
  passengerName?: string
  confirmationCode?: string
  onClose?: () => void
}

export function TripSummary({
  flightNumber = 'AA 2847',
  origin = { code: 'DFW', city: 'Dallas/Fort Worth' },
  destination = { code: 'LAX', city: 'Los Angeles' },
  departureDate = 'Today, Jan 25',
  departureTime = '2:45 PM',
  arrivalTime = '4:20 PM',
  seat = '12C',
  meal = 'Vegetarian Pasta',
  bags = 1,
  wifi = false,
  passengerName = 'John Doe',
  confirmationCode = 'ABC123',
  onClose,
}: TripSummaryProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Plane className="w-6 h-6 text-[#C8102E]" />
                <h2 className="text-2xl font-light text-[#0E1F34]">Trip Summary</h2>
              </div>
              <p className="text-sm font-light text-gray-600">
                All your flight details in one place
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Flight Information */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <h3 className="text-lg font-light text-[#0E1F34] mb-6">Flight Information</h3>

          {/* Route */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="text-4xl font-extralight text-[#0E1F34] mb-1">{origin.code}</div>
              <div className="text-sm font-light text-gray-600">{origin.city}</div>
            </div>

            <div className="flex flex-col items-center px-6">
              <Plane className="w-6 h-6 text-[#C8102E] mb-1" />
              <div className="text-xs font-light text-gray-500">{flightNumber}</div>
            </div>

            <div className="flex-1 text-right">
              <div className="text-4xl font-extralight text-[#0E1F34] mb-1">{destination.code}</div>
              <div className="text-sm font-light text-gray-600">{destination.city}</div>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-light">Departure</span>
              </div>
              <div>
                <p className="text-2xl font-light text-[#0E1F34]">{departureTime}</p>
                <p className="text-sm font-light text-gray-600">{departureDate}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-light">Arrival</span>
              </div>
              <div>
                <p className="text-2xl font-light text-[#0E1F34]">{arrivalTime}</p>
                <p className="text-sm font-light text-gray-600">{departureDate}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-300/30 my-6" />

          {/* Confirmation */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-light text-gray-600 mb-1">Passenger</p>
              <p className="text-lg font-light text-[#0E1F34]">{passengerName}</p>
            </div>
            <div>
              <p className="text-xs font-light text-gray-600 mb-1">Confirmation Code</p>
              <p className="text-lg font-light text-[#0E1F34] font-mono">{confirmationCode}</p>
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <h3 className="text-lg font-light text-[#0E1F34] mb-6">Your Preferences</h3>

          <div className="space-y-4">
            {/* Seat */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-gray-200/30">
              <div className="flex items-center gap-3">
                <Armchair className="w-5 h-5 text-[#C8102E]" />
                <span className="text-sm font-light text-gray-700">Seat Assignment</span>
              </div>
              <span className="text-lg font-light text-[#0E1F34]">{seat}</span>
            </div>

            {/* Meal */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-gray-200/30">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-5 h-5 text-[#C8102E]" />
                <span className="text-sm font-light text-gray-700">Meal Preference</span>
              </div>
              <span className="text-lg font-light text-[#0E1F34]">{meal}</span>
            </div>

            {/* Bags */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-gray-200/30">
              <div className="flex items-center gap-3">
                <Luggage className="w-5 h-5 text-[#C8102E]" />
                <span className="text-sm font-light text-gray-700">Checked Bags</span>
              </div>
              <span className="text-lg font-light text-[#0E1F34]">
                {bags} {bags === 1 ? 'bag' : 'bags'}
              </span>
            </div>

            {/* WiFi */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-gray-200/30">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-[#C8102E]" />
                <span className="text-sm font-light text-gray-700">In-Flight Wi-Fi</span>
              </div>
              <span className={`text-sm font-light ${wifi ? 'text-green-600' : 'text-gray-400'}`}>
                {wifi ? 'Purchased' : 'Not purchased'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Boarding Pass */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-gradient-to-br from-[#C8102E]/10 to-[#0E1F34]/10 border border-[#C8102E]/30 shadow-xl p-6">
          <div className="text-center">
            <p className="text-sm font-light text-gray-600 mb-2">Mobile Boarding Pass</p>
            <p className="text-xs font-light text-gray-500">
              Your boarding pass has been sent to your email and mobile app
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
