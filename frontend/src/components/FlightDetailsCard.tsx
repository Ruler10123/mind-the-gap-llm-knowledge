import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

interface FlightDetailsCardProps {
  onClose?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function FlightDetailsCard({ onClose, isMinimized = false, onToggleMinimize }: FlightDetailsCardProps) {
  // Dummy flight data - will be replaced with real data
  const flight = {
    flightNumber: 'AA 2847',
    origin: { code: 'DFW', city: 'Dallas', gate: 'D23' },
    destination: { code: 'LAX', city: 'Los Angeles' },
    departureTime: '2:45 PM',
    arrivalTime: '4:15 PM',
    status: 'On Time',
    boardingGroup: '3',
    boardingTime: '2:15 PM',
    seat: '12F',
    bagsChecked: 2,
  }

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
                <span className="text-2xl font-light text-[#0E1F34]">{flight.flightNumber}</span>
                <span className="text-lg font-extralight text-gray-600">
                  {flight.origin.code} → {flight.destination.code}
                </span>
                <span className="text-sm font-light text-gray-500">Gate {flight.origin.gate}</span>
                <span className="text-2xl font-light text-[#C8102E]">Group {flight.boardingGroup}</span>
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card - Minimal Glass */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl transition-all">
        {/* Top Half - Blue American Airlines Gradient */}
        <div className="relative bg-gradient-to-br from-[#0E1F34] via-[#1a3a5c] to-[#2a4a6e]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#4a7ba7]/20 rounded-full blur-3xl" />

          {/* Uniform top padding - p-10 */}
          <div className="relative p-10">
            {/* Header - Flight Number & Status */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-light text-white">{flight.flightNumber}</h2>
                <span className="px-3 py-1.5 text-sm font-light text-white bg-white/10 border border-white/30 rounded-full backdrop-blur-md">
                  {flight.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Route - Large & Minimal */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-5xl font-extralight text-white mb-1">
                    {flight.origin.code}
                  </div>
                  <div className="text-sm font-light text-white/70">{flight.origin.city}</div>
                </div>

                <div className="flex flex-col items-center px-8">
                  <ChevronRight className="w-6 h-6 text-white/50" />
                </div>

                <div className="text-right">
                  <div className="text-5xl font-extralight text-white mb-1">
                    {flight.destination.code}
                  </div>
                  <div className="text-sm font-light text-white/70">{flight.destination.city}</div>
                </div>
              </div>

              {/* Times */}
              <div className="flex items-center justify-between text-center">
                <div>
                  <div className="text-xs font-light text-white/60 mb-1">DEPARTURE</div>
                  <div className="text-2xl font-light text-white">{flight.departureTime}</div>
                </div>
                <div>
                  <div className="text-xs font-light text-white/60 mb-1">ARRIVAL</div>
                  <div className="text-2xl font-light text-white">{flight.arrivalTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Half - Glass Theme */}
        <div className="backdrop-blur-3xl bg-white/20 border-t border-white/30 p-10">

          {/* Key Info Grid - No Boxes */}
          <div className="grid grid-cols-3 gap-8">
            {/* Gate */}
            <div>
              <p className="text-xs font-light text-gray-500 mb-2">GATE</p>
              <p className="text-4xl font-extralight text-[#0E1F34]">{flight.origin.gate}</p>
            </div>

            {/* Boarding Group */}
            <div>
              <p className="text-xs font-light text-gray-500 mb-2">BOARDING GROUP</p>
              <p className="text-4xl font-extralight text-[#C8102E]">{flight.boardingGroup}</p>
              <p className="text-xs font-light text-gray-500 mt-1">{flight.boardingTime}</p>
            </div>

            {/* Seat */}
            <div>
              <p className="text-xs font-light text-gray-500 mb-2">SEAT</p>
              <p className="text-4xl font-extralight text-[#0E1F34]">{flight.seat}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-300/30 my-10" />

          {/* Baggage */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light text-gray-500 mb-1">CHECKED BAGS</p>
              <p className="text-xl font-light text-[#0E1F34]">{flight.bagsChecked} bags checked</p>
            </div>
            <div className="text-xs font-light text-gray-500">All bags loaded</div>
          </div>
        </div>
      </div>
    </div>
  )
}
