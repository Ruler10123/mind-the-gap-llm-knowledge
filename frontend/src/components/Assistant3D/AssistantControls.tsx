import { Mic, MicOff } from 'lucide-react'

interface AssistantControlsProps {
  isAudioActive: boolean
  onToggleAudio: () => void
  error: string | null
}

export default function AssistantControls({
  isAudioActive,
  onToggleAudio,
  error,
}: AssistantControlsProps) {
  return (
    <div className="fixed top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={onToggleAudio}
        className={`p-4 rounded-full backdrop-blur-md transition-all ${
          isAudioActive
            ? 'bg-cyan-600/80 hover:bg-cyan-700/80'
            : 'bg-black/50 hover:bg-black/70'
        }`}
        aria-label={isAudioActive ? 'Stop microphone' : 'Start microphone'}
      >
        {isAudioActive ? (
          <Mic size={24} className="text-white" />
        ) : (
          <MicOff size={24} className="text-white" />
        )}
      </button>

      {error && (
        <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-red-600/80 text-white text-sm max-w-xs">
          {error}
        </div>
      )}

      {isAudioActive && (
        <div className="px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/50 text-white text-xs">
          Listening...
        </div>
      )}
    </div>
  )
}
