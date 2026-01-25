import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Send } from 'lucide-react'

interface AssistantInterfaceProps {
  isAudioActive: boolean
  onToggleAudio: () => void
  error: string | null
  onSubmitPrompt: (prompt: string) => void
  isSubmitting?: boolean
}

export default function AssistantInterface({
  isAudioActive,
  onToggleAudio,
  error,
  onSubmitPrompt,
  isSubmitting = false,
}: AssistantInterfaceProps) {
  const [prompt, setPrompt] = useState('')
  const [showError, setShowError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Error display with auto-dismiss
  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSubmit = () => {
    if (!prompt.trim() || isSubmitting) return
    onSubmitPrompt(prompt)
    setPrompt('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setPrompt('')
    }
  }

  return (
    <>
      {/* Mic toggle - top-left */}
      <button
        onClick={onToggleAudio}
        className={`
          fixed top-6 left-6 z-20
          p-3 rounded-full
          backdrop-blur-md
          border border-white/10
          transition-all duration-300
          ${
            isAudioActive
              ? 'bg-cyan-500/20 shadow-lg shadow-cyan-500/50'
              : 'bg-black/30 hover:bg-black/40'
          }
        `}
        aria-label={isAudioActive ? 'Stop microphone' : 'Start microphone'}
      >
        {isAudioActive ? (
          <Mic size={20} className="text-white" />
        ) : (
          <MicOff size={20} className="text-white/70" />
        )}
      </button>

      {/* Input bar - bottom-center */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-[700px] px-4 sm:px-6">
        <div
          className="
            backdrop-blur-xl bg-white/10
            border border-white/20
            rounded-full
            shadow-2xl shadow-black/20
            px-6 py-3
            flex items-center gap-3
            transition-all duration-300
            focus-within:border-cyan-500/50 focus-within:shadow-cyan-500/20
          "
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            maxLength={2000}
            className="
              flex-1 bg-transparent
              text-white placeholder-white/50
              resize-none outline-none
              max-h-24 overflow-y-auto
              scrollbar-thin scrollbar-thumb-white/20
            "
            aria-label="Prompt input"
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
            className="
              p-2 rounded-full
              bg-cyan-500/20 hover:bg-cyan-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              hover:scale-105 active:scale-95
            "
            aria-label="Send prompt"
          >
            <Send
              size={20}
              className={`${isSubmitting ? 'animate-pulse' : ''} text-cyan-400`}
            />
          </button>
        </div>
      </div>

      {/* Error toast - top-center */}
      {showError && error && (
        <div
          className="
            fixed top-6 left-1/2 -translate-x-1/2 z-30
            px-6 py-3 rounded-full
            backdrop-blur-xl bg-red-500/20
            border border-red-500/30
            text-red-200 text-sm
            animate-slide-down
            max-w-md
          "
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  )
}
