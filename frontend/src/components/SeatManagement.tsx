import { useState } from 'react'
import { SeatSelector } from './SeatSelector'
import { toast } from '@/lib/toast'
import { Armchair, ChevronRight, Info } from 'lucide-react'

interface SeatManagementProps {
  currentSeat?: string
  flightNumber?: string
  onSeatChange?: (newSeat: string) => void
  onClose?: () => void
  aiMode?: boolean // If true, shows AI-friendly view
}

export function SeatManagement({
  currentSeat = '12C',
  flightNumber = 'AA 2847',
  onSeatChange,
  onClose,
  aiMode = false,
}: SeatManagementProps) {
  const [showSeatSelector, setShowSeatSelector] = useState(false)
  const [seat, setSeat] = useState(currentSeat)

  const handleSeatChange = (newSeat: string) => {
    setSeat(newSeat)
    setShowSeatSelector(false)
    toast.success(`Seat changed to ${newSeat}`, {
      description: 'Your boarding pass has been updated',
    })
    onSeatChange?.(newSeat)
  }

  // AI can call this to change seat programmatically
  const changeSeatProgrammatically = (newSeat: string) => {
    setSeat(newSeat)
    toast.success(`AI changed your seat to ${newSeat}`, {
      description: 'Seat updated based on your preferences',
    })
    onSeatChange?.(newSeat)
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Armchair className="w-6 h-6 text-[#C8102E]" />
                  <h2 className="text-2xl font-light text-[#0E1F34]">Seat Selection</h2>
                </div>
                <p className="text-sm font-light text-gray-600">
                  Flight {flightNumber}
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

          {/* Current Seat Display */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-600 mb-2">Current Seat Assignment</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-extralight text-[#0E1F34]">{seat}</p>
                  <p className="text-lg font-light text-gray-600">
                    {parseInt(seat) <= 5 ? 'First Class'
                      : parseInt(seat) <= 12 ? 'Premium Economy'
                      : (seat.includes('13') || seat.includes('14')) ? 'Extra Legroom'
                      : 'Economy'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSeatSelector(true)}
                className="px-8 py-4 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg flex items-center gap-2"
              >
                Change Seat
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Seat Map Preview */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
            <h3 className="text-lg font-light text-[#0E1F34] mb-4">Seat Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                  <span className="text-sm font-light text-gray-600">Row</span>
                  <span className="text-sm font-light text-[#0E1F34]">{parseInt(seat)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                  <span className="text-sm font-light text-gray-600">Position</span>
                  <span className="text-sm font-light text-[#0E1F34]">
                    {['A', 'F'].includes(seat.slice(-1)) ? 'Window'
                      : ['C', 'D'].includes(seat.slice(-1)) ? 'Aisle'
                      : 'Middle'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                  <span className="text-sm font-light text-gray-600">Class</span>
                  <span className="text-sm font-light text-[#0E1F34]">
                    {parseInt(seat) <= 5 ? 'First'
                      : parseInt(seat) <= 12 ? 'Premium'
                      : 'Economy'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                  <span className="text-sm font-light text-gray-600">Extra Legroom</span>
                  <span className="text-sm font-light text-[#0E1F34]">
                    {(seat.includes('13') || seat.includes('14')) ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-blue-50/40 border border-blue-200/60 shadow-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-light text-gray-700">
                  You can change your seat at any time before check-in. Some seats may have additional fees.
                </p>
                {aiMode && (
                  <p className="text-xs font-light text-blue-600 mt-2">
                    AI can automatically select seats based on your preferences: window/aisle, front/back, legroom priority.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selector Modal */}
      {showSeatSelector && (
        <SeatSelector
          currentSeat={seat}
          onSelect={handleSeatChange}
          onClose={() => setShowSeatSelector(false)}
        />
      )}
    </>
  )
}
