import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MapPin } from 'lucide-react'
import { StreamingText } from '../StreamingText'
import { FlightDetailsCard } from '../FlightDetailsCard'

interface InlineChatProps {
  isVisible: boolean
  onClose: () => void
  connected: boolean
  status: string
  error: string | null
  isRecording: boolean
  micSupported: boolean
  toggleMic: () => void
  streamingText: string
  isStreaming: boolean
  isProcessing: boolean
  sendMessage: (text: string) => void
  input: string
  onInputChange: (value: string) => void
  messages: Array<{
    id: string;
    type: 'user' | 'assistant' | 'component';
    content?: string;
    componentType?: string;
    componentData?: Record<string, any>;
    timestamp?: Date;
  }>
}

// Simple markdown renderer for basic formatting
function renderMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let key = 0

  const segments = text.split(/(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|_.*?_|`.*?`)/g)

  segments.forEach((segment) => {
    if (!segment) return

    if (segment.match(/^\*\*.*\*\*$/) || segment.match(/^__.*__$/)) {
      const content = segment.slice(2, -2)
      parts.push(<strong key={key++}>{content}</strong>)
    } else if (segment.match(/^(?<!\*)\*(?!\*).*(?<!\*)\*(?!\*)$/) || segment.match(/^_.*_$/)) {
      const content = segment.slice(1, -1)
      parts.push(<em key={key++}>{content}</em>)
    } else if (segment.match(/^`.*`$/)) {
      const content = segment.slice(1, -1)
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
          {content}
        </code>
      )
    } else {
      parts.push(segment)
    }
  })

  return parts.length > 0 ? parts : text
}

function formatTime(date?: Date): string {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function InlineChat({
  isVisible,
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
  input,
  onInputChange,
  messages,
}: InlineChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [messages, streamingText])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !connected) return
    sendMessage(text)
  }

  const handleVoiceToggle = () => {
    if (!connected || !micSupported || isProcessing) return
    // When recording, stop and send (same as send button)
    if (isRecording) {
      toggleMic() // This will stop recording and send via handleMicComplete
    } else {
      // When not recording, start recording
      toggleMic()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isVisible) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !streamingText && !isRecording ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {!isRecording && (
              <>
                <p className="text-gray-600 text-lg font-light mb-2">
                  {connected ? 'Voice-First Assistant' : 'Connecting...'}
                </p>
                <p className="text-gray-500 text-sm">
                  {!connected ? status : 'Tap the microphone or type to start'}
                </p>
              </>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-2 max-w-md">{error}</p>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => {
              // Render component messages
              if (message.type === 'component') {
                return (
                  <div key={message.id} className="flex justify-start w-full">
                    {message.componentType === 'flight_details' && (
                      <div className="w-full max-w-2xl">
                        <FlightDetailsCard />
                      </div>
                    )}
                    {message.componentType === 'map' && message.componentData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl mx-auto"
                      >
                        <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
                          <div className="bg-gradient-to-r from-[#0E1F34] to-[#1a3350] p-4 text-white">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              <h3 className="font-semibold">{message.componentData.title}</h3>
                            </div>
                          </div>
                          <div className="p-4">
                            <img
                              src={message.componentData.imageSrc}
                              alt={message.componentData.altText}
                              className="w-full rounded-lg"
                            />
                            {message.componentData.notes && message.componentData.notes.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {message.componentData.notes.map((note: string, i: number) => (
                                  <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-[#C8102E]">•</span>
                                    <span>{note}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              }

              // Render text messages
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] px-5 py-3 rounded-2xl
                      ${message.type === 'user'
                        ? 'bg-[#C8102E] text-white shadow-lg'
                        : 'bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-md'}
                    `}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.type === 'user' ? message.content : renderMarkdown(message.content || '')}
                    </div>
                  </div>
                  {message.timestamp && (
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>
              )
            })}
            {streamingText && !isRecording && isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-md">
                  <StreamingText text={streamingText} isStreaming={isStreaming} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Voice-First with Text Fallback */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          {/* Voice Toggle / Send Button - Shows Send icon when recording */}
          <button
            onClick={handleVoiceToggle}
            disabled={!connected || !micSupported || isProcessing || (isStreaming && !isRecording)}
            className={`
              p-4 rounded-full transition-all duration-300
              ${isRecording
                ? 'bg-[#C8102E] shadow-lg shadow-[#C8102E]/50 scale-110 hover:bg-[#a00d26]'
                : 'bg-white/20 hover:bg-white/30'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={
              !micSupported
                ? 'Microphone not supported'
                : isProcessing
                  ? 'Processing request...'
                : isRecording
                  ? 'Stop recording and send'
                  : 'Start microphone input'
            }
          >
            {isRecording ? (
              <Send className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Text Input - Subtle */}
          <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? "Or type here..." : "Connecting..."}
              disabled={!connected}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm disabled:opacity-50"
            />
            {input.trim() && connected && !isRecording && (
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="p-2 rounded-full bg-[#C8102E] hover:bg-[#a00d26] transition-all active:scale-95 disabled:opacity-50"
                title="Send message"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
