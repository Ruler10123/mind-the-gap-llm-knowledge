import { useState } from 'react'
import { AlternativeFlightCard } from './AlternativeFlightCard'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface AlternativeFlight {
  id: string
  flightNumber: string
  origin: { code: string; city: string }
  destination: { code: string; city: string }
  departureTime: string
  arrivalTime: string
  duration: string
  status: string
  price: number
  seats: number
  stops: number
  aircraft: string
  departureDate: string
}

interface FlightReschedulerProps {
  isRefundable: boolean
  currentFlight: {
    flightNumber: string
    departureTime: string
  }
  alternatives: AlternativeFlight[]
  onConfirm: (selectedFlight: AlternativeFlight) => void
  onCancel?: () => void
}

export function FlightRescheduler({
  isRefundable,
  currentFlight,
  alternatives,
  onConfirm,
  onCancel,
}: FlightReschedulerProps) {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)

  const selectedFlight = alternatives.find((f) => f.id === selectedFlightId)

  const handleConfirm = () => {
    if (selectedFlight) {
      onConfirm(selectedFlight)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header - Refundability Status */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-start gap-4">
            {isRefundable ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-light text-[#0E1F34] mb-2">
                {isRefundable ? 'Ticket is Refundable' : 'Ticket is Non-Refundable'}
              </h2>
              <p className="text-sm font-light text-gray-600 mb-4">
                {isRefundable
                  ? 'You can reschedule your flight at no additional cost for select options.'
                  : 'Rescheduling may incur fees. See pricing below for each option.'}
              </p>
              <div className="flex items-center gap-2 text-xs font-light text-gray-500">
                <Info className="w-4 h-4" />
                <span>
                  Current flight: {currentFlight.flightNumber} departing at{' '}
                  {currentFlight.departureTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Flights Header */}
        <div className="px-2">
          <h3 className="text-lg font-light text-[#0E1F34] mb-1">Available Alternatives</h3>
          <p className="text-sm font-light text-gray-600">
            Select a new flight to continue
          </p>
        </div>

        {/* Alternative Flight Options */}
        <div className="space-y-4">
          {alternatives.map((flight) => (
            <AlternativeFlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedFlightId === flight.id}
              onSelect={() => setSelectedFlightId(flight.id)}
            />
          ))}
        </div>

        {/* Confirm/Cancel Actions */}
        {selectedFlightId && (
          <div className="sticky bottom-0 pt-6">
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/40 border border-white/50 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600 mb-1">Selected Flight</p>
                  <p className="text-xl font-light text-[#0E1F34]">
                    {selectedFlight?.flightNumber} - {selectedFlight?.departureDate}
                  </p>
                  {selectedFlight && selectedFlight.price !== 0 && (
                    <p className={`text-sm font-light mt-1 ${selectedFlight.price > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                      {selectedFlight.price > 0 ? 'Additional' : 'Refund'}: $
                      {Math.abs(selectedFlight.price)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-6 py-3 rounded-full bg-white/40 border border-white/60 hover:bg-white/50 text-gray-700 font-light transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-3 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
