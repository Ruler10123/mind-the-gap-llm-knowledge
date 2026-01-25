import { motion } from 'framer-motion'
import { AlertTriangle, Clock, Plane } from 'lucide-react'

interface ResolutionOption {
  id: string
  label: string
  description: string
}

export interface FlightDelayInfoProps {
  flightNumber: string
  delayMinutes: number
  reason: string
  originalTime: string
  newTime: string
  resolutionOptions: ResolutionOption[]
  sendMessage: (text: string) => void
}

const FlightDelayInfo = ({
  flightNumber,
  delayMinutes,
  reason,
  originalTime,
  newTime,
  resolutionOptions,
  sendMessage,
}: FlightDelayInfoProps) => {
  const hours = Math.floor(delayMinutes / 60)
  const minutes = delayMinutes % 60
  const delayText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const handleOptionClick = (option: ResolutionOption) => {
    if (option.id === 'wait') {
      sendMessage('I will wait for the delayed flight')
    } else if (option.id === 'compensation') {
      sendMessage('I want to request compensation for the delay')
    } else {
      // Handle any other option by sending its label
      sendMessage(`I want to: ${option.label}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl"
    >
      {/* Header with delay badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C8102E]/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-[#C8102E]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0E1F34]">
              Flight {flightNumber} Delayed
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-[#C8102E]" />
              <span className="text-sm font-medium text-[#C8102E]">
                Delayed {delayText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Time comparison */}
      <div className="bg-white/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#0E1F34]/60 mb-1">Original Time</p>
            <p className="text-lg font-semibold text-[#0E1F34] line-through opacity-60">
              {originalTime}
            </p>
          </div>
          <Plane className="w-5 h-5 text-[#0E1F34]/40" />
          <div>
            <p className="text-xs text-[#0E1F34]/60 mb-1">New Time</p>
            <p className="text-lg font-semibold text-[#C8102E]">{newTime}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <p className="text-sm text-[#0E1F34]/80">
          <span className="font-medium">Reason:</span> {reason}
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0E1F34] mb-2">
          What would you like to do?
        </p>
        {resolutionOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            className="w-full text-left px-4 py-3 bg-white/40 hover:bg-white/60 rounded-lg transition-all border border-white/30 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0E1F34] group-hover:text-[#C8102E] transition-colors">
                  {option.label}
                </p>
                <p className="text-xs text-[#0E1F34]/60 mt-0.5">
                  {option.description}
                </p>
              </div>
              <div className="w-2 h-2 bg-[#C8102E] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export default FlightDelayInfo
