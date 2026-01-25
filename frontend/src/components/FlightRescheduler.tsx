import { useState, useEffect } from 'react'
import { AlternativeFlightCard } from './AlternativeFlightCard'
import { SeatSelector } from './SeatSelector'
import { CheckCircle, AlertCircle, Info, Loader2, Sparkles, Plane, CheckCircle2, Armchair, Wand2, UtensilsCrossed, Luggage } from 'lucide-react'
import { toast } from '@/lib/toast'

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
    origin: { code: string; city: string }
    destination: { code: string; city: string }
    arrivalTime: string
    departureDate: string
  }
  alternatives: AlternativeFlight[]
  onConfirm: (selectedFlight: AlternativeFlight) => void
  onCancel?: () => void
}

type Step = 'selection' | 'seat-selection' | 'auto-optimize' | 'processing' | 'confirmation' | 'complete'

interface Preferences {
  seat?: string
  meal?: string
  bags?: number
}

export function FlightRescheduler({
  isRefundable,
  currentFlight,
  alternatives,
  onConfirm,
  onCancel,
}: FlightReschedulerProps) {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('selection')
  const [processingMessage, setProcessingMessage] = useState('Analyzing your preferences...')
  const [showSeatSelector, setShowSeatSelector] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    seat: '12C',
    meal: 'Vegetarian Pasta',
    bags: 1,
  })
  const [useAutoOptimize, setUseAutoOptimize] = useState(false)

  const selectedFlight = alternatives.find((f) => f.id === selectedFlightId)

  // Simulate AI processing with multiple messages
  useEffect(() => {
    if (step === 'processing') {
      const messages = [
        'Analyzing your preferences...',
        'Checking seat availability...',
        'Updating your itinerary...',
        'Processing payment adjustments...',
        'Finalizing your new booking...',
      ]

      let currentIndex = 0
      const interval = setInterval(() => {
        currentIndex++
        if (currentIndex < messages.length) {
          setProcessingMessage(messages[currentIndex])
        } else {
          clearInterval(interval)
          setTimeout(() => setStep('confirmation'), 500)
        }
      }, 1200)

      return () => clearInterval(interval)
    }
  }, [step])

  const handleConfirm = () => {
    if (selectedFlight) {
      if (useAutoOptimize) {
        setStep('auto-optimize')
      } else {
        setStep('seat-selection')
      }
    }
  }

  const handleSeatSelect = (seat: string) => {
    setPreferences(prev => ({ ...prev, seat }))
    setShowSeatSelector(false)
    toast.success(`Seat ${seat} selected`, {
      description: 'Proceeding with your flight change',
    })
    setStep('processing')
  }

  const handleSkipSeatSelection = () => {
    toast.info('Keeping current seat preference', {
      description: 'Seat will be assigned automatically',
    })
    setStep('processing')
  }

  const handleAutoOptimizeConfirm = () => {
    // Simulate AI selecting best options
    const autoSelectedSeat = '14A' // AI picks exit row window
    setPreferences(prev => ({
      ...prev,
      seat: autoSelectedSeat,
      meal: 'Grilled Chicken', // AI picks based on preferences
      bags: 1,
    }))
    toast.success('AI optimized your preferences', {
      description: 'Review changes before finalizing',
    })
    setStep('processing')
  }

  const handleFinalConfirm = () => {
    setStep('complete')
    setTimeout(() => {
      onConfirm(selectedFlight!)
    }, 2000)
  }

  // Selection Step
  if (step === 'selection') {
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

          {/* Auto-Optimize Toggle */}
          {selectedFlightId && (
            <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Wand2 className="w-5 h-5 text-[#C8102E] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#0E1F34]">AI Auto-Optimize</p>
                    <p className="text-xs font-light text-gray-600 mt-1">
                      Let AI pick the best seat, meal, and options based on your preferences
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUseAutoOptimize(!useAutoOptimize)}
                  className={`
                    relative w-12 h-6 rounded-full transition-all
                    ${useAutoOptimize ? 'bg-[#C8102E]' : 'bg-gray-300'}
                  `}
                >
                  <div className={`
                    absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${useAutoOptimize ? 'translate-x-6' : 'translate-x-0'}
                  `} />
                </button>
              </div>
            </div>
          )}

          {/* Confirm/Cancel Actions */}
          {selectedFlightId && (
            <div className="pt-6">
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
                      className="px-6 py-3 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg flex items-center gap-2"
                    >
                      {useAutoOptimize && <Wand2 className="w-4 h-4" />}
                      Continue
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

  // Seat Selection Step
  if (step === 'seat-selection') {
    return (
      <>
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
              <div className="flex items-start gap-4">
                <Armchair className="w-6 h-6 text-[#C8102E] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-2xl font-light text-[#0E1F34] mb-2">
                    Choose Your Seat
                  </h2>
                  <p className="text-sm font-light text-gray-600">
                    Select a seat for flight {selectedFlight?.flightNumber}, or skip to keep your current preference
                  </p>
                </div>
              </div>
            </div>

            {/* Current Selection Preview */}
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600 mb-1">Current Seat</p>
                  <p className="text-3xl font-light text-[#0E1F34]">{preferences.seat}</p>
                </div>
                <button
                  onClick={() => setShowSeatSelector(true)}
                  className="px-6 py-3 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg"
                >
                  Choose New Seat
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6">
              <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/40 border border-white/50 shadow-2xl p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-light text-gray-600">
                    You can change your seat now or skip to continue
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSkipSeatSelection}
                      className="px-6 py-3 rounded-full bg-white/40 border border-white/60 hover:bg-white/50 text-gray-700 font-light transition-all"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Selector Modal */}
        {showSeatSelector && (
          <SeatSelector
            currentSeat={preferences.seat}
            onSelect={handleSeatSelect}
            onClose={() => setShowSeatSelector(false)}
          />
        )}
      </>
    )
  }

  // Auto-Optimize Step - AI suggests preferences
  if (step === 'auto-optimize') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
            <div className="flex items-start gap-4">
              <Wand2 className="w-8 h-8 text-[#C8102E] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-light text-[#0E1F34] mb-2">
                  AI-Optimized Preferences
                </h2>
                <p className="text-sm font-light text-gray-600">
                  AI has selected the best options based on your profile and preferences
                </p>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
            <h3 className="text-lg font-light text-[#0E1F34] mb-6">Recommended Changes</h3>

            <div className="space-y-4">
              {/* Seat */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-white/30">
                <div className="flex items-center gap-3">
                  <Armchair className="w-5 h-5 text-[#C8102E]" />
                  <div>
                    <p className="text-sm font-light text-gray-700">Seat Assignment</p>
                    <p className="text-xs font-light text-gray-600 mt-0.5">
                      Exit row, window seat for extra legroom
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-gray-500 line-through">{preferences.seat}</p>
                  <p className="text-lg font-light text-[#0E1F34]">14A</p>
                </div>
              </div>

              {/* Meal */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-white/30">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5 text-[#C8102E]" />
                  <div>
                    <p className="text-sm font-light text-gray-700">Meal Preference</p>
                    <p className="text-xs font-light text-gray-600 mt-0.5">
                      Based on your dietary profile
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-gray-500 line-through">{preferences.meal}</p>
                  <p className="text-lg font-light text-[#0E1F34]">Grilled Chicken</p>
                </div>
              </div>

              {/* Bags */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/20 border border-white/30">
                <div className="flex items-center gap-3">
                  <Luggage className="w-5 h-5 text-[#C8102E]" />
                  <div>
                    <p className="text-sm font-light text-gray-700">Checked Bags</p>
                    <p className="text-xs font-light text-gray-600 mt-0.5">
                      Optimal for your trip duration
                    </p>
                  </div>
                </div>
                <p className="text-lg font-light text-[#0E1F34]">{preferences.bags} bag</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6">
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/40 border border-white/50 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600 mb-1">AI Optimization Ready</p>
                  <p className="text-lg font-light text-[#0E1F34]">
                    Review and approve the AI-selected preferences
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('seat-selection')}
                    className="px-6 py-3 rounded-full bg-white/40 border border-white/60 hover:bg-white/50 text-gray-700 font-light transition-all"
                  >
                    Customize Instead
                  </button>
                  <button
                    onClick={handleAutoOptimizeConfirm}
                    className="px-8 py-4 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Confirm AI Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Processing Step - AI is working
  if (step === 'processing') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-16">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#C8102E] animate-spin" />
              <Sparkles className="w-8 h-8 text-[#C8102E] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-light text-[#0E1F34] mb-2">AI Processing Your Request</h2>
              <p className="text-lg font-light text-gray-600 animate-pulse">{processingMessage}</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-light text-gray-500">
              <Plane className="w-4 h-4" />
              <span>Rescheduling to {selectedFlight?.flightNumber}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Step - Show new ticket details
  if (step === 'confirmation') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-green-50/40 border border-green-200/60 shadow-xl p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-light text-[#0E1F34] mb-2">
                  Flight Rescheduling Complete
                </h2>
                <p className="text-sm font-light text-gray-600">
                  Your flight has been successfully rescheduled. Review your new ticket details below.
                </p>
              </div>
            </div>
          </div>

          {/* Old vs New Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* Old Flight */}
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/20 border border-white/30 shadow-xl p-6 opacity-60">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gray-500/20 border border-gray-400/30 rounded-full text-gray-600 text-xs font-light">
                  Previous
                </span>
              </div>
              <h3 className="text-lg font-light text-[#0E1F34] mb-6">Original Flight</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Flight Number</p>
                  <p className="text-2xl font-light text-gray-700">{currentFlight.flightNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Route</p>
                  <p className="text-lg font-light text-gray-700">
                    {currentFlight.origin.code} → {currentFlight.destination.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Departure</p>
                  <p className="text-lg font-light text-gray-700">
                    {currentFlight.departureDate} at {currentFlight.departureTime}
                  </p>
                </div>
              </div>
            </div>

            {/* New Flight */}
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/40 border border-[#C8102E]/40 shadow-xl p-6 ring-2 ring-[#C8102E]">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-[#C8102E]/20 border border-[#C8102E]/40 rounded-full text-[#C8102E] text-xs font-light">
                  New Booking
                </span>
              </div>
              <h3 className="text-lg font-light text-[#0E1F34] mb-6">Your New Flight</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Flight Number</p>
                  <p className="text-2xl font-light text-[#0E1F34]">{selectedFlight?.flightNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Route</p>
                  <p className="text-lg font-light text-[#0E1F34]">
                    {selectedFlight?.origin.code} → {selectedFlight?.destination.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Departure</p>
                  <p className="text-lg font-light text-[#0E1F34]">
                    {selectedFlight?.departureDate} at {selectedFlight?.departureTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-1">Arrival</p>
                  <p className="text-lg font-light text-[#0E1F34]">
                    {selectedFlight?.arrivalTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          {selectedFlight && selectedFlight.price !== 0 && (
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
              <h3 className="text-lg font-light text-[#0E1F34] mb-4">Payment Summary</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-gray-600">
                  {selectedFlight.price > 0 ? 'Additional Charge' : 'Refund Amount'}
                </span>
                <span className={`text-2xl font-light ${selectedFlight.price > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {selectedFlight.price > 0 ? '+' : ''}${Math.abs(selectedFlight.price)}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-6">
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/40 border border-white/50 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600 mb-1">Ready to finalize?</p>
                  <p className="text-lg font-light text-[#0E1F34]">
                    Your profile will be updated with the new booking
                  </p>
                </div>
                <button
                  onClick={handleFinalConfirm}
                  className="px-8 py-4 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg"
                >
                  Confirm & Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Complete Step - Final confirmation
  if (step === 'complete') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-green-50/40 border border-green-200/60 shadow-xl p-16">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <CheckCircle2 className="w-24 h-24 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-light text-[#0E1F34] mb-3">All Set!</h2>
              <p className="text-lg font-light text-gray-600 mb-2">
                Your profile has been updated with your new flight
              </p>
              <p className="text-sm font-light text-gray-500">
                {selectedFlight?.flightNumber} departing {selectedFlight?.departureDate} at{' '}
                {selectedFlight?.departureTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
