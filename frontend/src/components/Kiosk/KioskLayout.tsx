import { useState, useEffect } from 'react'
import { KioskHeader } from './KioskHeader'
import Assistant3D from '../Assistant3D'
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
      {/* Header with embedded progress bar */}
      <KioskHeader
        user={user}
        currentTime={currentTime}
        flight={flight}
        className="h-16 md:h-20 flex-shrink-0 relative z-30"
      />

      {/* Main Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* 3D Assistant Globe - Centered, moves lower and to left when chat opens */}
        <div className={`
          absolute z-10
          transition-all duration-700 ease-out
          ${showChat
            ? 'left-0 bottom-0 translate-y-1/2 w-[1600px] h-[1600px] -translate-x-1/2 opacity-50'
            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-100'}
        `}>
          <Assistant3D passiveMode={isIdle} hideInterface={true} />
        </div>

        {/* Center Content Area - Chat or Welcome (same space) */}
        <div className="absolute inset-0 flex items-center justify-center z-20 px-6 md:px-12 lg:px-16 py-8">
          {/* Welcome + Quick Actions - Animate Out */}
          <div className={`
            flex flex-col items-center justify-center max-w-4xl w-full pointer-events-none
            transition-all duration-500
            ${showChat ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
          `}>
            {user && (
              <WelcomeMessage
                userName={user.name}
                isVisible={showWelcome}
              />
            )}

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

          {/* Chat Interface - Animate In (same space, no background) */}
          <div className={`
            absolute inset-0 flex items-center justify-center px-6 md:px-12 lg:px-16 py-8
            transition-all duration-500
            ${showChat ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          `}>
            <div className="w-full max-w-3xl h-full">
              <InlineChat
                isVisible={showChat}
                onClose={handleClose}
              />
            </div>
          </div>
        </div>

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
