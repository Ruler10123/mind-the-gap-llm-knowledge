import { motion } from 'framer-motion'
import { XCircle, AlertTriangle, CheckCircle } from 'lucide-react'

export interface FlightCancellationInfoProps {
  flightNumber: string
  reason: string
  automaticRebooking: boolean
  nextSteps: string[]
  sendMessage: (text: string) => void
}

const FlightCancellationInfo = ({
  flightNumber,
  reason,
  automaticRebooking,
  nextSteps,
  sendMessage,
}: FlightCancellationInfoProps) => {
  const handleViewAlternatives = () => {
    sendMessage('Show me alternative flights')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-2xl p-6 shadow-xl"
    >
      {/* Alert header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-[#C8102E]/20 rounded-lg">
          <XCircle className="w-6 h-6 text-[#C8102E]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#C8102E]">
            Flight {flightNumber} Cancelled
          </h3>
          <p className="text-sm text-[#0E1F34]/80 mt-1">{reason}</p>
        </div>
      </div>

      {/* Auto-rebooking status */}
      {automaticRebooking && (
        <div className="bg-white/30 rounded-lg p-4 mb-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-[#0E1F34]">
            We're automatically rebooking you on the next available flight
          </p>
        </div>
      )}

      {/* Next steps */}
      <div className="mb-4">
        <p className="text-sm font-medium text-[#0E1F34] mb-2">Next Steps:</p>
        <ul className="space-y-2">
          {nextSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[#0E1F34]/80">
              <div className="w-1.5 h-1.5 bg-[#C8102E] rounded-full mt-1.5 flex-shrink-0" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action button */}
      <button
        onClick={handleViewAlternatives}
        className="w-full px-6 py-3 bg-[#0E1F34] hover:bg-[#0E1F34]/90 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
      >
        View Alternative Flights
      </button>
    </motion.div>
  )
}

export default FlightCancellationInfo
