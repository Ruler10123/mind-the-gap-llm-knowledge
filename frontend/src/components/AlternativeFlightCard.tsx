import { ChevronRight, Clock, DollarSign, Users } from 'lucide-react'

interface AlternativeFlight {
  flightNumber: string
  origin: { code: string; city: string }
  destination: { code: string; city: string }
  departureTime: string
  arrivalTime: string
  duration: string
  status: string
  price: number // Price difference (+ or - from current)
  seats: number // Available seats
  stops: number
  aircraft: string
  departureDate: string
}

interface AlternativeFlightCardProps {
  flight: AlternativeFlight
  isSelected?: boolean
  onSelect: () => void
}

export function AlternativeFlightCard({ flight, isSelected = false, onSelect }: AlternativeFlightCardProps) {
  const priceDiff = flight.price
  const isPriceIncrease = priceDiff > 0
  const noCostChange = priceDiff === 0

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-[#C8102E] bg-white/40'
          : 'hover:bg-white/30 bg-white/20'
        }
        rounded-2xl backdrop-blur-3xl border border-white/40 shadow-xl
      `}
    >
      <div className="p-6">
        {/* Top Row - Flight Number, Date, Status */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-light text-[#0E1F34] mb-1">{flight.flightNumber}</h3>
            <p className="text-sm font-light text-gray-600">{flight.departureDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && (
              <span className="px-3 py-1 bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-full text-[#C8102E] text-xs font-light">
                Selected
              </span>
            )}
            <span className="px-3 py-1 bg-white/40 border border-white/50 rounded-full text-gray-700 text-xs font-light">
              {flight.status}
            </span>
          </div>
        </div>

        {/* Route & Times */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="text-3xl font-extralight text-[#0E1F34] mb-1">{flight.origin.code}</div>
              <div className="text-xs font-light text-gray-600">{flight.origin.city}</div>
            </div>

            <div className="flex flex-col items-center px-6">
              <ChevronRight className="w-5 h-5 text-gray-400 mb-1" />
              <div className="text-xs font-light text-gray-500">{flight.duration}</div>
              {flight.stops > 0 && (
                <div className="text-xs font-light text-amber-600 mt-1">
                  {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="flex-1 text-right">
              <div className="text-3xl font-extralight text-[#0E1F34] mb-1">{flight.destination.code}</div>
              <div className="text-xs font-light text-gray-600">{flight.destination.city}</div>
            </div>
          </div>

          {/* Times */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-light text-[#0E1F34]">{flight.departureTime}</span>
            </div>
            <div>
              <span className="text-lg font-light text-[#0E1F34]">{flight.arrivalTime}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-300/30 mb-4" />

        {/* Bottom Row - Details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-light text-gray-600">{flight.seats} seats left</span>
            </div>
            <div className="text-sm font-light text-gray-600">{flight.aircraft}</div>
          </div>

          {/* Price Difference */}
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${noCostChange ? 'text-green-600' : isPriceIncrease ? 'text-amber-600' : 'text-blue-600'}`} />
            <span className={`text-lg font-light ${noCostChange ? 'text-green-600' : isPriceIncrease ? 'text-amber-600' : 'text-blue-600'}`}>
              {noCostChange ? 'No charge' : `${isPriceIncrease ? '+' : ''}$${Math.abs(priceDiff)}`}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
