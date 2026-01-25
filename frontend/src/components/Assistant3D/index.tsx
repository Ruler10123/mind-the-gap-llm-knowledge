import { useEffect, useState } from 'react'
import AssistantCanvas from './AssistantCanvas'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'

interface Assistant3DProps {
  passiveMode: boolean
}

export default function Assistant3D({ passiveMode }: Assistant3DProps) {
  const { getFrequencyData } = useAudioAnalyzer()
  const [webGLSupported, setWebGLSupported] = useState(true)

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
      <AssistantCanvas getFrequencyData={getFrequencyData} passiveMode={passiveMode} />
    </div>
  )
}
