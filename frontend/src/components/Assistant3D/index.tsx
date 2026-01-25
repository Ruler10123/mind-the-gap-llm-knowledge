import { useEffect, useRef, useState } from 'react'
import AssistantCanvas from './AssistantCanvas'
import AssistantInterface from './AssistantInterface'
import { MapModal } from '@/components/MapModal'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'

export interface MapModalPayload {
  title: string
  imageSrc: string
  altText: string
  notes?: string[]
}

export default function Assistant3D() {
  const { isActive, error, initAudio, stopAudio, getFrequencyData } =
    useAudioAnalyzer()
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalData, setModalData] = useState<MapModalPayload | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

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

  const handleSubmitPrompt = (text: string) => {
    if (!text.trim()) return
    setIsSubmitting(true)

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket('ws://localhost:8000/ws')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ message: text }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        // Handle UI action events (modal)
        if (msg.type === 'ui_action' && msg.action === 'OPEN_MODAL') {
          setModalData(msg.payload)
        }

        // Handle done event
        if (msg.type === 'done') {
          setIsSubmitting(false)
        }

        // Handle error event
        if (msg.type === 'error') {
          console.error('WebSocket error:', msg.message)
          setIsSubmitting(false)
        }
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }

    ws.onerror = () => {
      console.error('WebSocket connection error')
      setIsSubmitting(false)
    }

    ws.onclose = () => {
      wsRef.current = null
    }
  }

  const handleCloseModal = () => {
    setModalData(null)
  }

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
      <AssistantCanvas getFrequencyData={getFrequencyData} />
      <AssistantInterface
        isAudioActive={isActive}
        onToggleAudio={handleToggleAudio}
        error={error}
        onSubmitPrompt={handleSubmitPrompt}
        isSubmitting={isSubmitting}
      />
      <MapModal
        isOpen={modalData !== null}
        onClose={handleCloseModal}
        title={modalData?.title ?? ''}
        imageSrc={modalData?.imageSrc ?? ''}
        altText={modalData?.altText ?? ''}
        notes={modalData?.notes}
      />
    </div>
  )
}
