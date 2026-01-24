import { useRef, useState } from 'react'

export function useAudioAnalyzer() {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyzer = audioContext.createAnalyser()

      analyzer.fftSize = 128 // 64 frequency bins
      analyzer.smoothingTimeConstant = 0.8

      source.connect(analyzer)

      analyzerRef.current = analyzer
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount)
      audioContextRef.current = audioContext
      streamRef.current = stream
      setIsActive(true)
      setError(null)
    } catch (err) {
      setError('Microphone access denied')
      setIsActive(false)
    }
  }

  const stopAudio = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioContextRef.current?.close()
    analyzerRef.current = null
    dataArrayRef.current = null
    audioContextRef.current = null
    streamRef.current = null
    setIsActive(false)
  }

  const getFrequencyData = (): Uint8Array<ArrayBuffer> | null => {
    if (!analyzerRef.current || !dataArrayRef.current) return null
    analyzerRef.current.getByteFrequencyData(dataArrayRef.current)
    return dataArrayRef.current
  }

  return { isActive, error, initAudio, stopAudio, getFrequencyData }
}
