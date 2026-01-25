import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Plane,
  Clock,
  MapPin,
  DollarSign,
  Gift
} from 'lucide-react'

interface FlightDetails {
  flightNumber: string
  date: string
  departureTime: string
  arrivalTime: string
  origin: { code: string; city: string } | string
  destination: { code: string; city: string } | string
  gate: string
}

interface Compensation {
  type: 'cash' | 'credits' | 'choice' | 'both'
  cashAmount?: number
  creditsAmount?: number
  creditsExpiryMonths?: number
}

interface OverbookingOffer {
  id?: string
  reason: string
  reasonDetail: string
  originalFlight: FlightDetails
  newFlight: FlightDetails
  compensation: Compensation
}

export interface OverbookingInfoProps {
  offer: OverbookingOffer
  sendMessage: (text: string) => void
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

  // Helper to format origin/destination
  const formatLocation = (loc: { code: string; city: string } | string) => {
    if (typeof loc === 'string') return loc
    return `${loc.code} - ${loc.city}`
  }

  return (
    <div className={`p-5 rounded-xl bg-white/10 backdrop-blur-md border ${variant === 'new' ? 'border-green-400/30' : 'border-white/20'} hover:bg-white/15 transition-all duration-200`}>
      {/* Card Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <Icon className={`w-5 h-5 ${accentColor}`} />
        <h3 className="text-[#0E1F34] font-semibold text-lg">{title}</h3>
      </div>

      {/* Flight Details Grid */}
      <div className="space-y-3">
        {/* Flight Number */}
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Flight</div>
            <div className="text-xl md:text-2xl font-bold text-[#0E1F34]">{flight.flightNumber}</div>
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Date</div>
          <div className="text-lg font-semibold text-[#0E1F34]">{flight.date}</div>
        </div>

        {/* Times */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Departure - Arrival</div>
            <div className="text-lg font-semibold text-[#0E1F34]">
              {flight.departureTime} - {flight.arrivalTime}
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#C8102E]" />
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Route</div>
            <div className="text-lg font-semibold text-[#0E1F34]">
              {formatLocation(flight.origin)} → {formatLocation(flight.destination)}
            </div>
          </div>
        </div>

        {/* Gate */}
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Gate</div>
          <div className="text-xl font-bold text-[#0E1F34]">{flight.gate}</div>
        </div>
      </div>
    </div>
  )
}

export default function OverbookingInfo({ offer, sendMessage }: OverbookingInfoProps) {
  const [selectedCompensation, setSelectedCompensation] = useState<'cash' | 'credits'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = () => {
    setIsProcessing(true)
    if (offer.compensation.type === 'choice') {
      sendMessage(`I accept the overbooking offer with ${selectedCompensation} compensation`)
    } else {
      sendMessage('I accept the overbooking offer')
    }
  }

  const handleDecline = () => {
    setIsProcessing(true)
    sendMessage('I decline the overbooking offer')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Reason Card */}
      <div className="p-4 rounded-xl bg-yellow-500/10 backdrop-blur-md border border-yellow-400/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[#0E1F34] font-semibold text-lg mb-1">{offer.reason}</h3>
            <p className="text-gray-700 text-sm">{offer.reasonDetail}</p>
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
        <h3 className="text-[#0E1F34] font-bold text-xl mb-4">Your Compensation</h3>

        {offer.compensation.type === 'both' ? (
          // Display both compensation options (user gets both)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offer.compensation.cashAmount && (
              <div className="p-5 rounded-xl bg-green-500/20 backdrop-blur-md border border-green-400/40">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Cash Compensation</div>
                    <div className="text-3xl font-bold text-[#0E1F34] mb-1">
                      ${offer.compensation.cashAmount}
                    </div>
                    <p className="text-gray-700 text-sm">Refunded to original payment method</p>
                  </div>
                </div>
              </div>
            )}
            {offer.compensation.creditsAmount && (
              <div className="p-5 rounded-xl bg-green-500/20 backdrop-blur-md border border-green-400/40">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Travel Credits</div>
                    <div className="text-3xl font-bold text-[#0E1F34] mb-1">
                      ${offer.compensation.creditsAmount}
                    </div>
                    <p className="text-gray-700 text-sm">
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
                  <DollarSign className={`w-6 h-6 ${selectedCompensation === 'cash' ? 'text-[#C8102E]' : 'text-gray-600'}`} />
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Cash Compensation</div>
                    <div className="text-3xl font-bold text-[#0E1F34] mb-1">
                      ${offer.compensation.cashAmount}
                    </div>
                    <p className="text-gray-700 text-sm">Refunded to original payment method</p>
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
                  <Gift className={`w-6 h-6 ${selectedCompensation === 'credits' ? 'text-[#C8102E]' : 'text-gray-600'}`} />
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Travel Credits</div>
                    <div className="text-3xl font-bold text-[#0E1F34] mb-1">
                      ${offer.compensation.creditsAmount}
                    </div>
                    <p className="text-gray-700 text-sm">
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

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDecline}
          disabled={isProcessing}
          className="flex-1 bg-white/10 border border-white/20 hover:bg-white/25 text-[#0E1F34] font-semibold py-4 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </motion.div>
  )
}
