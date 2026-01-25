import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, Info, Navigation } from 'lucide-react'

export interface DestinationInfo {
  name: string
  description: string
  location?: string
  terminal?: string
  gate?: string
  estimatedWalkTime?: string
  directions?: string[]
  amenities?: string[]
  hours?: string
  imageUrl?: string
}

export interface DestinationInfoModalProps {
  isOpen: boolean
  onClose: () => void
  destination: DestinationInfo
}

export default function DestinationInfoModal({
  isOpen,
  onClose,
  destination,
}: DestinationInfoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md"
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-700" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">{destination.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{destination.description}</p>
              </div>
            </div>
          </div>

          {/* Image (optional) */}
          {destination.imageUrl && (
            <div className="px-8 py-6 bg-gray-50">
              <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-200">
                <img
                  src={destination.imageUrl}
                  alt={destination.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* Location Info Grid */}
          {(destination.location || destination.terminal || destination.gate || destination.estimatedWalkTime || destination.hours) && (
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-5">
                {destination.terminal && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-semibold text-[#0E1F34]">T</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Terminal</p>
                      <p className="text-base font-medium text-gray-900 mt-1">{destination.terminal}</p>
                    </div>
                  </div>
                )}
                {destination.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#0E1F34]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-base font-medium text-gray-900 mt-1">{destination.location}</p>
                    </div>
                  </div>
                )}
                {destination.gate && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-semibold text-[#0E1F34]">G</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Near Gate</p>
                      <p className="text-base font-medium text-gray-900 mt-1">{destination.gate}</p>
                    </div>
                  </div>
                )}
                {destination.estimatedWalkTime && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#0E1F34]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Walk Time</p>
                      <p className="text-base font-medium text-gray-900 mt-1">{destination.estimatedWalkTime}</p>
                    </div>
                  </div>
                )}
                {destination.hours && (
                  <div className="flex items-start gap-3 col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#0E1F34]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hours</p>
                      <p className="text-base font-medium text-gray-900 mt-1">{destination.hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {destination.amenities && destination.amenities.length > 0 && (
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Amenities & Services</h3>
              <div className="grid grid-cols-2 gap-3">
                {destination.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Directions */}
          {destination.directions && destination.directions.length > 0 && (
            <div className="px-8 py-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">How to Get There</h3>
              <div className="space-y-4">
                {destination.directions.map((direction, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>
                    <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-1">{direction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}
