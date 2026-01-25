import { useState, useEffect } from 'react'
import { KioskHeader } from './KioskHeader'
import { Globe3D } from './Globe3D'
import { FlightProgressBar } from './FlightProgressBar'
import { WelcomeMessage } from './WelcomeMessage'
import { QuickActions } from './QuickActions'
import { ActionButtons } from './ActionButtons'
import { ConversationPanel } from './ConversationPanel'
import { useKioskState } from './hooks/useKioskState'
import type { UserProfile } from './types'

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

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)]">
      {/* Header */}
      <KioskHeader
        user={user}
        currentTime={currentTime}
        className="h-16 md:h-20 flex-shrink-0"
      />

      {/* Main Content Area - Morphs when chat opens */}
      <main className={`
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

      {/* 3D Globe - Positioned at bottom in passive mode, hidden when chat opens */}
      <div
        className={`
          fixed transition-all duration-500 z-30
          ${showChat ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}
          ${isIdle
            ? 'bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[280px] md:w-[320px] md:h-[320px]'
            : 'bottom-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] md:w-[400px] md:h-[400px]'
          }
        `}
      >
        <Globe3D passiveMode={isIdle} />
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
    </div>
  )
}
