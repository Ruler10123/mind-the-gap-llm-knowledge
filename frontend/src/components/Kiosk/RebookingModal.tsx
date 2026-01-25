import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { FlightRescheduler } from '../FlightRescheduler'

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

interface FlightDetails {
  flightNumber: string
  departureTime: string
  arrivalTime?: string
  origin?: { code: string; city: string }
  destination?: { code: string; city: string }
}

export interface RebookingModalProps {
  isOpen: boolean
  onClose: () => void
  currentFlight: FlightDetails
  isRefundable: boolean
  alternatives: AlternativeFlight[]
  sendMessage: (text: string) => void
}

const RebookingModal = ({
  isOpen,
  onClose,
  currentFlight,
  isRefundable,
  alternatives,
  sendMessage,
}: RebookingModalProps) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleConfirm = (selectedFlight: AlternativeFlight) => {
    const message = `Confirm rebooking to flight ${selectedFlight.flightNumber} departing ${selectedFlight.departureTime} on ${selectedFlight.departureDate}`
    sendMessage(message)
    onClose()
  }

  const handleCancel = () => {
    sendMessage('I want to cancel the rebooking')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50/95 to-purple-50/95 backdrop-blur-xl rounded-3xl shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/40 hover:bg-white/60 border border-white/30 transition-all"
            >
              <X className="w-5 h-5 text-[#0E1F34]" />
            </button>

            {/* Content */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-light text-[#0E1F34] mb-2">
                  Rebook Your Flight
                </h2>
                <p className="text-sm font-light text-gray-600">
                  Select an alternative flight to continue your journey
                </p>
              </div>

              <FlightRescheduler
                isRefundable={isRefundable}
                currentFlight={{
                  flightNumber: currentFlight.flightNumber,
                  departureTime: currentFlight.departureTime,
                  origin: currentFlight.origin || { code: 'DFW', city: 'Dallas' },
                  destination: currentFlight.destination || { code: 'LAX', city: 'Los Angeles' },
                  arrivalTime: currentFlight.arrivalTime || '',
                  departureDate: '',
                }}
                alternatives={alternatives}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default RebookingModal
