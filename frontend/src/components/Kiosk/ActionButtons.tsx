import { Volume2, VolumeX, Keyboard } from 'lucide-react'

interface ActionButtonsProps {
  isMuted: boolean
  onMute: () => void
  onUnmute: () => void
  onType?: () => void
  className?: string
}

export function ActionButtons({
  isMuted,
  onMute,
  onUnmute,
  onType,
  className = ''
}: ActionButtonsProps) {
  return (
    <div className={`fixed bottom-8 right-8 flex flex-col gap-3 ${className}`}>
      {/* Mute/Unmute Button */}
      <button
        onClick={isMuted ? onUnmute : onMute}
        className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/20 hover:shadow-xl active:scale-95 transition-all duration-200"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 text-[#C8102E]" />
        ) : (
          <Volume2 className="w-6 h-6 text-[#0E1F34]" />
        )}
      </button>

      {/* Type Alternative (optional) */}
      {onType && (
        <button
          onClick={onType}
          className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/20 hover:shadow-xl active:scale-95 transition-all duration-200"
          aria-label="Type instead"
          title="Type your message"
        >
          <Keyboard className="w-6 h-6 text-[#0E1F34]" />
        </button>
      )}
    </div>
  )
}
