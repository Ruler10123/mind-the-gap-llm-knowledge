import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import Assistant3D from '@/components/Assistant3D'
import UserNameDisplay from '@/components/UserNameDisplay'
import { StreamingText } from '@/components/StreamingText'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [input, setInput] = useState('')
  const {
    connected,
    status,
    error,
    isRecording,
    micSupported,
    toggleMic,
    streamingText,
    isStreaming,
    sendMessage,
    audioElRef,
    connect,
    disconnect,
    micTranscript,
  } = useVoiceAssistant()

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Update input with microphone transcript when recording or when recording stops
  useEffect(() => {
    if (micTranscript) {
      setInput(micTranscript)
    }
  }, [micTranscript, isRecording])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black">
      <Assistant3D passiveMode={!isRecording} />
      {/* <LoginButtons /> */}
      {/* <UserNameDisplay /> */}

      {/* Voice Assistant UI */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {/* Connection Status - Top Right */}
        <div className="absolute top-6 right-6 pointer-events-auto flex gap-2 items-center">
          {!micSupported && (
            <div className="px-2 py-1 rounded text-xs backdrop-blur-md bg-yellow-500/20 border border-yellow-500/30 text-yellow-200">
              Mic not supported
            </div>
          )}
          <div
            className={`
              px-3 py-1.5 rounded-full text-xs
              backdrop-blur-md border
              ${
                connected
                  ? 'bg-green-500/20 border-green-500/30 text-green-200'
                  : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
              }
            `}
          >
            {status}
          </div>
        </div>

        {/* Error Display - Top Center */}
        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className="px-4 py-2 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm max-w-md">
              {error}
            </div>
          </div>
        )}

        {/* Streaming Text Display - Center */}
        {streamingText && !isRecording && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto max-w-2xl px-6">
            <StreamingText text={streamingText} isStreaming={isStreaming} />
          </div>
        )}

        {/* Input Bar - Bottom Center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-[700px] px-4 sm:px-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-2xl px-6 py-3 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or use microphone..."
              disabled={!connected}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!connected || !input.trim()}
              className="px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-cyan-200 text-sm"
            >
              Send
            </button>
            <button
              onClick={toggleMic}
              disabled={!connected || !micSupported || (isStreaming && !isRecording)}
              className={`
                p-2 rounded-full transition-all
                ${
                  isRecording
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={
                !micSupported
                  ? 'Microphone not supported in this browser'
                  : isRecording
                    ? 'Stop recording and send'
                    : 'Start microphone input'
              }
            >
              {isRecording ? '⏹' : '🎤'}
            </button>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioElRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
