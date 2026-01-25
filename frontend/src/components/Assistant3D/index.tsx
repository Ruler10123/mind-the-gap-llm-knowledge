import { useEffect, useState } from 'react'
import AssistantCanvas from './AssistantCanvas'
import AssistantInterface from './AssistantInterface'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'

interface Assistant3DProps {
  passiveMode?: boolean
  hideInterface?: boolean
}

export default function Assistant3D({ passiveMode, hideInterface = false }: Assistant3DProps) {
  const { isActive, error, initAudio, stopAudio, getFrequencyData } =
    useAudioAnalyzer()
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check WebGL support
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
    }
  }, [])

  const handleToggleAudio = () => {
    if (isActive) {
      stopAudio()
    } else {
      initAudio()
    }
  }

  const handleSubmitPrompt = async (text: string) => {
    if (!text.trim()) return
    setIsSubmitting(true)
    // TODO: Connect to backend API
    console.log('Prompt submitted:', text)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
  }

  // Automatically enable passiveMode (show bubble) when microphone is disabled
  // unless passiveMode is explicitly set
  const effectivePassiveMode = passiveMode ?? !isActive
  console.log('[Assistant3D] Render state', {
    isActive,
    passiveMode,
    effectivePassiveMode,
    webGLSupported,
  })

  if (!webGLSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">WebGL Not Supported</h2>
          <p className="text-gray-400">
            Your browser doesn't support WebGL. Please use a modern browser.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <AssistantCanvas getFrequencyData={getFrequencyData} passiveMode={effectivePassiveMode} />
      {!hideInterface && (
        <AssistantInterface
          isAudioActive={isActive}
          onToggleAudio={handleToggleAudio}
          error={error}
          onSubmitPrompt={handleSubmitPrompt}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
