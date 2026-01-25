import { useState } from 'react'
import { X, MessageCircle, CheckCircle, Send, Mic } from 'lucide-react'
import type { VoiceState } from './types'

interface ConversationPanelProps {
  isVisible: boolean
  voiceState: VoiceState
  currentQuery: string | null
  onClose: () => void
  onQuery: (query: string) => void
}

const EXAMPLE_QUERIES = [
  "Where is gate D24?",
  "When does boarding start?",
  "Can I change my seat?",
  "What's my baggage allowance?",
]

const ACTION_CARDS = [
  {
    title: "Rebook on Next Flight",
    description: "AA 2901 departs at 17:30, arrives 19:15",
    action: "Select"
  },
  {
    title: "Accept $150 Travel Credit",
    description: "Valid for 1 year on any AA flight",
    action: "Accept"
  },
  {
    title: "Request Full Refund",
    description: "Refund to original payment method",
    action: "Request"
  }
]

export function ConversationPanel({
  isVisible,
  voiceState,
  currentQuery,
  onClose,
  onQuery
}: ConversationPanelProps) {
  const [manualInput, setManualInput] = useState('')

  if (!isVisible) return null

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onQuery(manualInput)
      setManualInput('')
    }
  }

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Immersive Modal - Takes more screen space */}
      <div
        className={`
          fixed inset-4
          bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20
          z-50
          overflow-hidden
          ${isVisible ? 'animate-slide-up' : 'animate-slide-down-out'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">How can I help?</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {voiceState === 'listening' && (
              <div className="space-y-3">
                <p className="text-white/70 text-sm mb-4">Select a question or ask your own:</p>
                {EXAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => onQuery(query)}
                    className="w-full text-left p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-[#C8102E]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-[#C8102E] flex-shrink-0 mt-0.5" />
                      <span className="text-white font-medium">{query}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {voiceState === 'speaking' && currentQuery && (
              <div className="space-y-4">
                {/* Query display */}
                <div className="p-4 rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white font-medium">{currentQuery}</p>
                  </div>
                </div>

                {/* Response */}
                <div className="p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
                  <h3 className="text-white font-bold text-lg mb-2">
                    Your flight is delayed due to maintenance
                  </h3>
                  <p className="text-white/80 text-sm mb-3">
                    A routine inspection is required after the previous flight.
                    The aircraft is currently being checked by our maintenance team.
                  </p>
                  <p className="text-white text-sm font-semibold">
                    Here are your options:
                  </p>
                </div>

                {/* Action Cards */}
                <div className="space-y-3">
                  {ACTION_CARDS.map((card, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-[#C8102E]/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">{card.title}</h4>
                          <p className="text-white/70 text-xs">{card.description}</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-[#C8102E] text-white text-xs font-semibold hover:bg-[#a00d26] transition-colors">
                          {card.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Success indicator */}
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                  <span>Tap an option to proceed</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Area - Touch/Voice */}
          <div className="p-6 border-t border-white/20 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="Type your question or tap to speak..."
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/50 transition-all"
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="p-4 rounded-2xl bg-[#C8102E] hover:bg-[#a00d26] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => {/* Voice input logic */}}
                className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
