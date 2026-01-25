import { useEffect, useState } from 'react'
import AssistantCanvas from './AssistantCanvas'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'
import type { AssistantCanvasMode } from './types'

interface Assistant3DProps {
  mode: AssistantCanvasMode
  isRecording?: boolean
}

export default function Assistant3D({ mode, isRecording = false }: Assistant3DProps) {
  const { getFrequencyData, initAudio, stopAudio, isActive } = useAudioAnalyzer()
  const [webGLSupported, setWebGLSupported] = useState(true)

  // Initialize/stop audio analyzer based on recording state
  useEffect(() => {
    if (isRecording && !isActive) {
      console.log('[Assistant3D] Recording started, initializing audio analyzer...')
      initAudio()
    } else if (!isRecording && isActive) {
      console.log('[Assistant3D] Recording stopped, stopping audio analyzer...')
      stopAudio()
    }
  }, [isRecording, isActive, initAudio, stopAudio])

  // Check WebGL support
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
    }
  }, [])

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
      <AssistantCanvas getFrequencyData={getFrequencyData} mode={mode} />
    </div>
  )
}
