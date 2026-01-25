import { useState, useEffect } from 'react'
import { KioskHeader } from './KioskHeader'
import Assistant3D from '../Assistant3D'
import { WelcomeMessage } from './WelcomeMessage'
import { QuickActions } from './QuickActions'
import { ActionButtons } from './ActionButtons'
import { InlineChat } from './InlineChat'
import { useVoiceAssistantState } from '@/hooks/useVoiceAssistantState'
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
    audioElRef,
    connect,
    disconnect,
    showChat,
    isMuted,
    input,
    messages,
    voiceState,
    handleVoiceActivate,
    handleType,
    handleSend,
    handleClose,
    handleMute,
    handleUnmute,
    handleInputChange,
  } = useVoiceAssistantState()

  const [currentTime, setCurrentTime] = useState(new Date())

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
                onClose={handleClose}
                connected={connected}
                status={status}
                error={error}
                isRecording={isRecording}
                micSupported={micSupported}
                toggleMic={toggleMic}
                streamingText={streamingText}
                isStreaming={isStreaming}
                isProcessing={isProcessing}
                sendMessage={handleSend}
                input={input}
                onInputChange={handleInputChange}
                messages={messages}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Right Side */}
        <ActionButtons
          isMuted={isMuted}
          onMute={handleMute}
          onUnmute={handleUnmute}
          onType={handleType}
          showChat={showChat}
          onClose={handleClose}
        />

        {/* Microphone Button - Bottom Center (only when idle) */}
        <div className={`
          absolute bottom-32 left-1/2 -translate-x-1/2 z-30
          transition-all duration-500
          ${showChat ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 pointer-events-auto scale-100'}
        `}>
          <button
            onClick={handleVoiceActivate}
            className="group relative flex items-center justify-center"
          >
            {/* Outer pulsing ring */}
            <div className="absolute w-24 h-24 rounded-full bg-white/20 border border-white/40 animate-ping-slow" />

            {/* Middle ring */}
            <div className="absolute w-20 h-20 rounded-full bg-white/30 border border-white/50 backdrop-blur-md transition-all group-hover:scale-110" />

            {/* Inner button */}
            <div className="relative w-16 h-16 rounded-full bg-white/40 border-2 border-white/60 backdrop-blur-lg flex items-center justify-center transition-all group-hover:bg-white/50 group-hover:scale-105 shadow-xl">
              <svg
                className="w-8 h-8 text-[#0E1F34] transition-all group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>

            {/* Text hint below */}
            <div className="absolute top-full mt-4 whitespace-nowrap">
              <p className="text-sm font-light text-[#0E1F34]/70 animate-fade-in-out">
                Tap to speak
              </p>
            </div>
          </button>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioElRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
