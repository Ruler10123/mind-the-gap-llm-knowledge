import { useState, useRef, useEffect } from 'react'
import { Send, Mic } from 'lucide-react'
import { StreamingText } from '../StreamingText'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
}

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
  micTranscript?: string
}

export function InlineChat({
  isVisible,
  onClose,
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
  micTranscript,
}: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
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

  // Update input with microphone transcript when recording
  useEffect(() => {
    if (micTranscript && isRecording) {
      setInput(micTranscript)
    }
  }, [micTranscript, isRecording])

  // Add user message when recording stops and we have a transcript
  // The voice assistant will automatically send the message, we just display it
  const lastSentTranscriptRef = useRef<string>('')
  useEffect(() => {
    if (!isRecording && micTranscript && micTranscript.trim() && micTranscript !== lastSentTranscriptRef.current) {
      lastSentTranscriptRef.current = micTranscript
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: micTranscript
      }
      setMessages(prev => [...prev, userMessage])
      setInput('')
    }
  }, [isRecording, micTranscript])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !connected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    sendMessage(text)
  }

  const handleVoiceToggle = () => {
    if (!connected || !micSupported) return
    toggleMic()
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
        {messages.length === 0 && !streamingText ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className={`
              w-20 h-20 rounded-full mb-6 flex items-center justify-center
              ${isRecording ? 'bg-[#C8102E] animate-pulse' : 'bg-white/20'}
              transition-all duration-300
            `}>
              <Mic className={`w-10 h-10 ${isRecording ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <p className="text-gray-600 text-lg font-light mb-2">
              {isRecording ? 'Listening...' : connected ? 'Voice-First Assistant' : 'Connecting...'}
            </p>
            <p className="text-gray-500 text-sm">
              {!connected ? status : 'Tap the microphone or type to start'}
            </p>
            {error && (
              <p className="text-red-500 text-xs mt-2 max-w-md">{error}</p>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] px-5 py-3 rounded-2xl
                    ${message.type === 'user'
                      ? 'bg-[#C8102E] text-white shadow-lg'
                      : 'bg-white/20 text-gray-800 backdrop-blur-md border border-white/30 shadow-md'}
                  `}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-white/20 text-gray-800 backdrop-blur-md border border-white/30 shadow-md">
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
          {/* Voice Toggle Button */}
          <button
            onClick={handleVoiceToggle}
            disabled={!connected || !micSupported || (isStreaming && !isRecording)}
            className={`
              p-4 rounded-full transition-all duration-300
              ${isRecording
                ? 'bg-[#C8102E] shadow-lg shadow-[#C8102E]/50 scale-110'
                : 'bg-white/20 hover:bg-white/30'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={
              !micSupported
                ? 'Microphone not supported'
                : isRecording
                  ? 'Stop recording and send'
                  : 'Start microphone input'
            }
          >
            <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-700'}`} />
          </button>

          {/* Text Input - Subtle */}
          <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? "Or type here..." : "Connecting..."}
              disabled={!connected}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm disabled:opacity-50"
            />
            {input.trim() && connected && (
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="p-2 rounded-full bg-[#C8102E] hover:bg-[#a00d26] transition-all active:scale-95 disabled:opacity-50"
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
