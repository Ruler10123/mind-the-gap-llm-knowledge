import { useState, useRef, useEffect } from 'react'
import { Send, Mic } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
}

interface InlineChatProps {
  isVisible: boolean
  onClose: () => void
}

export function InlineChat({ isVisible, onClose }: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I can help you with that. What would you like to know about your flight?'
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  const handleVoiceToggle = () => {
    setIsListening(!isListening)
    // TODO: Implement voice input
  }

  if (!isVisible) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className={`
              w-20 h-20 rounded-full mb-6 flex items-center justify-center
              ${isListening ? 'bg-[#C8102E] animate-pulse' : 'bg-white/20'}
              transition-all duration-300
            `}>
              <Mic className={`w-10 h-10 ${isListening ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <p className="text-gray-600 text-lg font-light mb-2">
              {isListening ? 'Listening...' : 'Voice-First Assistant'}
            </p>
            <p className="text-gray-500 text-sm">
              Tap the microphone or type to start
            </p>
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
            className={`
              p-4 rounded-full transition-all duration-300
              ${isListening
                ? 'bg-[#C8102E] shadow-lg shadow-[#C8102E]/50 scale-110'
                : 'bg-white/20 hover:bg-white/30'}
            `}
          >
            <Mic className={`w-6 h-6 ${isListening ? 'text-white' : 'text-gray-700'}`} />
          </button>

          {/* Text Input - Subtle */}
          <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Or type here..."
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm"
            />
            {input.trim() && (
              <button
                onClick={handleSend}
                className="p-2 rounded-full bg-[#C8102E] hover:bg-[#a00d26] transition-all active:scale-95"
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
