import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MapPin, Info, Clock, Navigation } from 'lucide-react'
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
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                                <Navigation className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{message.componentData.title}</h3>
                                <p className="text-sm text-gray-500">Navigation directions</p>
                              </div>
                            </div>
                          </div>

                          {/* Map Image */}
                          <div className="p-6 bg-gray-50">
                            <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-200">
                              <img
                                src={message.componentData.imageSrc}
                                alt={message.componentData.altText}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Directions */}
                          {message.componentData.notes && message.componentData.notes.length > 0 && (
                            <div className="px-6 py-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Step-by-step directions</h4>
                              <div className="space-y-3">
                                {message.componentData.notes.map((note: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-xs font-medium mt-0.5">
                                      {i === 0 ? '📍' : i}
                                    </div>
                                    <div className="flex-1 text-sm text-gray-700 leading-relaxed pt-0.5">
                                      {renderMarkdown(note)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'destination_info' && message.componentData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl mx-auto"
                      >
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{message.componentData.name}</h3>
                                <p className="text-sm text-gray-500">{message.componentData.description}</p>
                              </div>
                            </div>
                          </div>

                          {/* Location Info Grid */}
                          {(message.componentData.location || message.componentData.terminal || message.componentData.gate || message.componentData.estimatedWalkTime || message.componentData.hours) && (
                            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                              <div className="grid grid-cols-2 gap-4">
                                {message.componentData.terminal && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-[#0E1F34]">T</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terminal</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.terminal}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.location && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.location}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.gate && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-[#0E1F34]">G</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Near Gate</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.gate}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.estimatedWalkTime && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Walk Time</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.estimatedWalkTime}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.hours && (
                                  <div className="flex items-start gap-3 col-span-2">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.hours}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Amenities */}
                          {message.componentData.amenities && message.componentData.amenities.length > 0 && (
                            <div className="px-6 py-5 border-b border-gray-100">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Amenities & Services</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {message.componentData.amenities.map((amenity: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Directions */}
                          {message.componentData.directions && message.componentData.directions.length > 0 && (
                            <div className="px-6 py-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">How to Get There</h4>
                              <div className="space-y-3">
                                {message.componentData.directions.map((direction: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-xs font-medium mt-0.5">
                                      {i + 1}
                                    </div>
                                    <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-0.5">{direction}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                        : 'bg-[#0E1F34]/50 text-white backdrop-blur-md border border-white/30 shadow-md'}
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
                <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-[#0E1F34]/50 text-white backdrop-blur-md border border-white/30 shadow-md">
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
