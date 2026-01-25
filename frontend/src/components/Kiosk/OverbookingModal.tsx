import { useState } from 'react'
import {
  X,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Plane,
  Clock,
  MapPin,
  DollarSign,
  Gift
} from 'lucide-react'
import type { OverbookingOffer, FlightDetails } from './types'

interface OverbookingModalProps {
  isOpen: boolean
  offer: OverbookingOffer | null
  onAccept: (offerId?: string, selectedCompensation?: 'cash' | 'credits') => void
  onDecline: (offerId?: string) => void
  onClose: () => void
}

interface FlightCardProps {
  title: string
  flight: FlightDetails
  variant: 'original' | 'new'
}

function FlightCard({ title, flight, variant }: FlightCardProps) {
  const Icon = variant === 'original' ? XCircle : CheckCircle
  const accentColor = variant === 'original'
    ? 'text-red-400 border-red-400/30'
    : 'text-green-400 border-green-400/30'

  return (
    <div className={`p-5 rounded-xl bg-white/10 backdrop-blur-md border ${variant === 'new' ? 'border-green-400/30' : 'border-white/20'} hover:bg-white/15 transition-all duration-200`}>
      {/* Card Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <Icon className={`w-5 h-5 ${accentColor}`} />
        <h3 className="text-white font-semibold text-lg">{title}</h3>
      </div>

      {/* Flight Details Grid */}
      <div className="space-y-3">
        {/* Flight Number */}
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Flight</div>
            <div className="text-xl md:text-2xl font-bold text-white">{flight.flightNumber}</div>
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Date</div>
          <div className="text-lg font-semibold text-white">{flight.date}</div>
        </div>

        {/* Times */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Departure - Arrival</div>
            <div className="text-lg font-semibold text-white">
              {flight.departureTime} - {flight.arrivalTime}
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Route</div>
            <div className="text-lg font-semibold text-white">
              {flight.origin} → {flight.destination}
            </div>
          </div>
        </div>

        {/* Gate */}
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Gate</div>
          <div className="text-xl font-bold text-white">{flight.gate}</div>
        </div>
      </div>
    </div>
  )
}

export function OverbookingModal({
  isOpen,
  offer,
  onAccept,
  onDecline,
  onClose
}: OverbookingModalProps) {
  const [selectedCompensation, setSelectedCompensation] = useState<'cash' | 'credits'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !offer) return null

  const handleAccept = () => {
    setIsProcessing(true)
    if (offer.compensation.type === 'choice') {
      onAccept(offer.id, selectedCompensation)
    } else {
      onAccept(offer.id)
    }
  }

  const handleDecline = () => {
    setIsProcessing(true)
    onDecline(offer.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`
          fixed inset-4
          bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20
          z-50
          overflow-hidden
          ${isOpen ? 'animate-slide-up' : 'animate-slide-down-out'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Flight Change Offer</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Reason Card */}
              <div className="p-4 rounded-xl bg-yellow-500/10 backdrop-blur-md border border-yellow-400/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{offer.reason}</h3>
                    <p className="text-white/80 text-sm">{offer.reasonDetail}</p>
                  </div>
                </div>
              </div>

              {/* Flight Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FlightCard
                  title="Original Flight"
                  flight={offer.originalFlight}
                  variant="original"
                />
                <FlightCard
                  title="New Flight Offer"
                  flight={offer.newFlight}
                  variant="new"
                />
              </div>

              {/* Compensation Section */}
              <div>
                <h3 className="text-white font-bold text-xl mb-4">Your Compensation</h3>

                {offer.compensation.type === 'both' ? (
                  // Display both compensation options (user gets both)
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offer.compensation.cashAmount && (
                      <div className="p-5 rounded-xl bg-green-500/20 backdrop-blur-md border border-green-400/40">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-6 h-6 text-green-400" />
                          <div>
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Cash Compensation</div>
                            <div className="text-3xl font-bold text-white mb-1">
                              ${offer.compensation.cashAmount}
                            </div>
                            <p className="text-white/70 text-sm">Refunded to original payment method</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {offer.compensation.creditsAmount && (
                      <div className="p-5 rounded-xl bg-green-500/20 backdrop-blur-md border border-green-400/40">
                        <div className="flex items-start gap-3">
                          <Gift className="w-6 h-6 text-green-400" />
                          <div>
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Travel Credits</div>
                            <div className="text-3xl font-bold text-white mb-1">
                              ${offer.compensation.creditsAmount}
                            </div>
                            <p className="text-white/70 text-sm">
                              Valid for {offer.compensation.creditsExpiryMonths || 12} months on any AA flight
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Display selectable compensation options (user chooses one)
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offer.compensation.cashAmount && (
                      <button
                        onClick={() => setSelectedCompensation('cash')}
                        disabled={isProcessing}
                        className={`
                          p-5 rounded-xl backdrop-blur-md border-2 transition-all duration-200 text-left
                          ${selectedCompensation === 'cash'
                            ? 'bg-[#C8102E]/20 border-[#C8102E]'
                            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-[#C8102E]/50'
                          }
                          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <DollarSign className={`w-6 h-6 ${selectedCompensation === 'cash' ? 'text-[#C8102E]' : 'text-white/60'}`} />
                          <div>
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Cash Compensation</div>
                            <div className="text-3xl font-bold text-white mb-1">
                              ${offer.compensation.cashAmount}
                            </div>
                            <p className="text-white/70 text-sm">Refunded to original payment method</p>
                          </div>
                        </div>
                        {selectedCompensation === 'cash' && (
                          <div className="mt-3 flex items-center gap-2 text-[#C8102E] text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    )}
                    {offer.compensation.creditsAmount && (
                      <button
                        onClick={() => setSelectedCompensation('credits')}
                        disabled={isProcessing}
                        className={`
                          p-5 rounded-xl backdrop-blur-md border-2 transition-all duration-200 text-left
                          ${selectedCompensation === 'credits'
                            ? 'bg-[#C8102E]/20 border-[#C8102E]'
                            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-[#C8102E]/50'
                          }
                          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <Gift className={`w-6 h-6 ${selectedCompensation === 'credits' ? 'text-[#C8102E]' : 'text-white/60'}`} />
                          <div>
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Travel Credits</div>
                            <div className="text-3xl font-bold text-white mb-1">
                              ${offer.compensation.creditsAmount}
                            </div>
                            <p className="text-white/70 text-sm">
                              Valid for {offer.compensation.creditsExpiryMonths || 12} months on any AA flight
                            </p>
                          </div>
                        </div>
                        {selectedCompensation === 'credits' && (
                          <div className="mt-3 flex items-center gap-2 text-[#C8102E] text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/20 bg-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="flex-1 bg-white/10 border border-white/20 hover:bg-white/25 text-white font-semibold py-4 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline Offer
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 bg-[#C8102E] hover:bg-[#a00d26] text-white font-semibold py-4 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Accept Offer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
