import { useState, useEffect } from 'react'
import { KioskHeader } from './KioskHeader'
import Assistant3D from '../Assistant3D'
import { WelcomeMessage } from './WelcomeMessage'
import { QuickActions } from './QuickActions'
import { ActionButtons } from './ActionButtons'
import { InlineChat } from './InlineChat'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'
import type { UserProfile } from './types'
import type { AssistantCanvasMode } from '../Assistant3D/types'

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
    connected,
    status,
    error,
    isRecording,
    micSupported,
    toggleMic,
    streamingText,
    isStreaming,
    isProcessing,
    sendMessage,
    audioElRef,
    connect,
    disconnect,
    micTranscript,
  } = useVoiceAssistant()

  const [showChat, setShowChat] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Derive voice state from useVoiceAssistant
  const voiceState = isRecording
    ? 'listening'
    : isProcessing
      ? 'processing'
      : streamingText
        ? 'speaking'
        : 'idle'

  // Connect voice assistant on mount
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handlers
  const handleVoiceActivate = () => {
    if (!connected) return
    if (!showChat) {
      setShowChat(true)
    }
    toggleMic()
  }

  const isIdle = voiceState === 'idle'
  const showWelcome = isIdle && !showChat
  const isFlightDelayed = flight.status !== 'On Time'

  // Determine assistant mode based on voice state
  const assistantMode: AssistantCanvasMode = isRecording
    ? 'active'
    : isProcessing
      ? 'processing'
      : 'passive'

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)] relative">
      {/* 3D Assistant Globe - Fixed background like index.tsx */}
      <div className="fixed inset-0 z-0">
        <Assistant3D mode={assistantMode} isRecording={isRecording} />
      </div>

      {/* Header with embedded progress bar */}
      <KioskHeader
        user={user}
        currentTime={currentTime}
        flight={flight}
        className="h-16 md:h-20 flex-shrink-0 relative z-30"
      />

      {/* Main Container */}
      <div className="flex-1 relative overflow-hidden z-10">
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

            <QuickActions
              isVisible={isIdle && !showChat}
              isFlightDelayed={isFlightDelayed}
              onActionClick={(action) => {
                console.log('Quick action:', action)
                handleVoiceActivate()
              }}
            />
          </div>

          {/* Chat Interface - Animate In (same space, no background) */}
          <div className={`
            absolute inset-0 px-6 md:px-12 lg:px-16 py-8
            transition-opacity duration-500
            ${showChat ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            flex items-center justify-center
          `}>
            <div className="w-full max-w-3xl h-full">
              <InlineChat
                isVisible={showChat}
                onClose={() => setShowChat(false)}
                connected={connected}
                status={status}
                error={error}
                isRecording={isRecording}
                micSupported={micSupported}
                toggleMic={toggleMic}
                streamingText={streamingText}
                isStreaming={isStreaming}
                isProcessing={isProcessing}
                sendMessage={sendMessage}
                micTranscript={micTranscript}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Right Side */}
        <ActionButtons
          isMuted={isMuted}
          onMute={() => setIsMuted(true)}
          onUnmute={() => setIsMuted(false)}
          onType={() => setShowChat(true)}
          showChat={showChat}
          onClose={() => setShowChat(false)}
        />

        {/* Hidden Audio Element */}
        <audio ref={audioElRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
