import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import Assistant3D from '@/components/Assistant3D'
import { StreamingText } from '@/components/StreamingText'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'
import type { AssistantCanvasMode } from '@/components/Assistant3D/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [input, setInput] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [debugModeSelection, setDebugModeSelection] = useState<AssistantCanvasMode>('passive')
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

  // Determine the mode to use
  const assistantMode: AssistantCanvasMode = debugMode
    ? debugModeSelection
    : isRecording
      ? 'active'
      : isProcessing
        ? 'processing'
        : 'passive'

  return (
    <div className="fixed inset-0 bg-black">
      <Assistant3D mode={assistantMode} isRecording={isRecording} />
      {/* <LoginButtons /> */}
      {/* <UserNameDisplay /> */}

      {/* Voice Assistant UI */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {/* Debug Mode Toggle - Top Left */}
        <div className="absolute top-6 left-6 pointer-events-auto">
          <div className="backdrop-blur-xl bg-black/40 border border-white/20 rounded-lg shadow-2xl p-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-white text-sm font-medium">Debug Mode</label>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${debugMode ? 'bg-cyan-500' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${debugMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            {debugMode && (
              <div className="space-y-2">
                <label className="text-white/70 text-xs block">Mode:</label>
                <select
                  value={debugModeSelection}
                  onChange={(e) => setDebugModeSelection(e.target.value as AssistantCanvasMode)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="passive">Passive</option>
                  <option value="active">Active</option>
                  <option value="processing">Processing</option>
                </select>
                <div className="text-white/50 text-xs mt-2">
                  Current: <span className="text-cyan-400">{assistantMode}</span>
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Processing Indicator - Center (shown when processing but no text yet) */}
        {isProcessing && !streamingText && !isRecording && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-white/80 text-sm font-medium tracking-wide">
                Processing your request...
              </div>
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
              disabled={!connected || !input.trim() || isProcessing}
              className="px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-cyan-200 text-sm flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-200/30 border-t-cyan-200 rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                'Send'
              )}
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
