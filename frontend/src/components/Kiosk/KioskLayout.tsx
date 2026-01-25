import { useState, useEffect } from 'react'
import { KioskHeader } from './KioskHeader'
import Assistant3D from '../Assistant3D'
import { FlightProgressBar } from './FlightProgressBar'
import { WelcomeMessage } from './WelcomeMessage'
import { QuickActions } from './QuickActions'
import { ActionButtons } from './ActionButtons'
import { ConversationPanel } from './ConversationPanel'
import { OverbookingModal } from './OverbookingModal'
import { useKioskState } from './hooks/useKioskState'
import type { UserProfile, OverbookingOffer } from './types'
import { Plane } from 'lucide-react'

interface SimplifiedFlight {
  flightNumber: string
  origin: string
  destination: string
  gate: string
  boardingTime: string
  departureTime: string
  status: string
  progress: number
  currentPhase: 'checkin' | 'boarding' | 'departed' | 'arrived'
}

interface KioskLayoutProps {
  user?: UserProfile
  flight: SimplifiedFlight
}

export function KioskLayout({ user, flight }: KioskLayoutProps) {
  const {
    voiceState,
    showChat,
    isMuted,
    currentQuery,
    handleVoiceActivate,
    handleType,
    handleQuery,
    handleClose,
    handleMute,
    handleUnmute,
  } = useKioskState()

  const [currentTime, setCurrentTime] = useState(new Date())

  // Overbooking modal state (DEV)
  const [showOverbooking, setShowOverbooking] = useState(false)
  const [overbookingOffer] = useState<OverbookingOffer>({
    id: "OVB-123456",
    reason: "Flight Overbooked",
    reasonDetail: "More passengers checked in than available seats due to aircraft change",
    originalFlight: {
      flightNumber: "AA 2451",
      date: "Jan 24, 2026",
      departureTime: "3:00 PM",
      arrivalTime: "5:30 PM",
      origin: "DFW",
      destination: "LAX",
      gate: "D24"
    },
    newFlight: {
      flightNumber: "AA 2901",
      date: "Jan 24, 2026",
      departureTime: "5:30 PM",
      arrivalTime: "7:15 PM",
      origin: "DFW",
      destination: "LAX",
      gate: "D18"
    },
    compensation: {
      type: "choice",
      cashAmount: 400,
      creditsAmount: 600,
      creditsExpiryMonths: 12
    }
  })

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const isIdle = voiceState === 'idle'
  const showWelcome = isIdle && !showChat
  const isFlightDelayed = flight.status !== 'On Time'

  // Overbooking handlers (DEV)
  const handleAcceptOverbooking = (offerId: string, compensation?: 'cash' | 'credits') => {
    console.log('✅ Accepted overbooking offer:', offerId, 'Compensation:', compensation)
    setShowOverbooking(false)
    // TODO: API call to backend
  }

  const handleDeclineOverbooking = (offerId: string) => {
    console.log('❌ Declined overbooking offer:', offerId)
    setShowOverbooking(false)
    // TODO: API call to backend
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)]">
      {/* Header */}
      <KioskHeader
        user={user}
        currentTime={currentTime}
        className="h-16 md:h-20 flex-shrink-0 relative z-30"
      />

      {/* Main Content Area - Morphs when chat opens */}
      <main className={`
        relative z-20
        flex-1 flex flex-col items-center justify-center px-6 md:px-12 lg:px-16 py-8
        transition-all duration-500
        ${showChat ? 'scale-95 opacity-50 pointer-events-none' : 'scale-100 opacity-100'}
      `}>
        {/* Welcome Message (only when idle) */}
        {user && (
          <WelcomeMessage
            userName={user.name}
            isVisible={showWelcome}
          />
        )}

        {/* Flight Progress Bar */}
        <FlightProgressBar
          flight={flight}
          isCompact={!isIdle || showChat}
        />

        {/* Quick Actions (only when idle) */}
        <QuickActions
          isVisible={isIdle && !showChat}
          isFlightDelayed={isFlightDelayed}
          onActionClick={(action) => {
            console.log('Quick action:', action)
            handleVoiceActivate()
          }}
        />
      </main>

      {/* 3D Assistant Globe - Centered */}
      <div
        className={`
          fixed transition-all duration-500 z-10
          ${showChat ? 'opacity-30 scale-90 blur-sm pointer-events-none' : 'opacity-100 scale-100'}
          inset-0
        `}
      >
        <Assistant3D 
          mode={
            isIdle 
              ? 'passive' 
              : voiceState === 'processing' 
                ? 'processing' 
                : 'active'
          } 
        />
      </div>

      {/* Action Buttons (Mute/Type) - Fixed bottom right */}
      <ActionButtons
        isMuted={isMuted}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onType={handleType}
      />

      {/* Conversation Modal */}
      <ConversationPanel
        isVisible={showChat}
        voiceState={voiceState}
        currentQuery={currentQuery}
        onClose={handleClose}
        onQuery={handleQuery}
      />

      {/* Overbooking Modal */}
      <OverbookingModal
        isOpen={showOverbooking}
        offer={overbookingOffer}
        onAccept={handleAcceptOverbooking}
        onDecline={handleDeclineOverbooking}
        onClose={() => setShowOverbooking(false)}
      />

      {/* DEV: Test Button for Overbooking Modal */}
      <button
        onClick={() => setShowOverbooking(true)}
        className="fixed top-24 right-4 z-50 p-2 rounded-lg bg-[#C8102E]/80 hover:bg-[#C8102E] text-white shadow-lg backdrop-blur-sm transition-all active:scale-95"
        title="Test Overbooking Modal (DEV)"
      >
        <Plane className="w-4 h-4" />
      </button>
    </div>
  )
}
