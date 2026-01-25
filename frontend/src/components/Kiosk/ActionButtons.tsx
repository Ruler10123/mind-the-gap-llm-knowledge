import { Volume2, VolumeX, Keyboard, X } from 'lucide-react'

interface ActionButtonsProps {
  isMuted: boolean
  onMute: () => void
  onUnmute: () => void
  onType?: () => void
  showChat?: boolean
  onClose?: () => void
  className?: string
}

export function ActionButtons({
  isMuted,
  onMute,
  onUnmute,
  onType,
  showChat = false,
  onClose,
  className = ''
}: ActionButtonsProps) {
  return (
    <div className={`absolute bottom-8 right-8 flex flex-col gap-3 z-30 ${className}`}>

      {/* Mute/Unmute Button */}
      <button
        onClick={isMuted ? onUnmute : onMute}
        className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/25 hover:shadow-2xl hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 text-[#C8102E] transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Volume2 className="w-6 h-6 text-[#0E1F34] transition-transform duration-300 group-hover:scale-110" />
        )}
      </button>

      
      {/* Close Chat Button (when chat is open) */}
      {showChat && onClose && (
        <button
          onClick={onClose}
          className="p-4 rounded-full bg-[#C8102E] backdrop-blur-xl shadow-lg hover:bg-[#a00d26] hover:shadow-2xl hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
          aria-label="Close chat"
          title="Close chat"
        >
          <X className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-90" />
        </button>
      )}

      {/* Type/Keyboard Toggle (only when chat is closed) */}
      {!showChat && onType && (
        <button
          onClick={onType}
          className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/25 hover:shadow-2xl hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
          aria-label="Open chat"
          title="Type or speak"
        >
          <Keyboard className="w-6 h-6 text-[#0E1F34] transition-transform duration-300 group-hover:scale-110" />
        </button>
      )}

      

      
    </div>
  )
}
