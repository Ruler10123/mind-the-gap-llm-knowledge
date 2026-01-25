import { useRef, useState } from 'react'

/**
 * Manages microphone access and a Web Audio API AnalyserNode for real-time
 * frequency data. Used to drive audio-reactive visuals (e.g. particle sphere).
 *
 * - Requests `getUserMedia` on `initAudio`; stores AnalyserNode, AudioContext,
 *   and MediaStream in refs. Stops tracks and closes context on `stopAudio`.
 * - `getFrequencyData` returns a `Uint8Array` of frequency bins (FFT size 128);
 *   call each frame for viz. Returns `null` if not initialized.
 *
 * @returns `{ isActive, error, initAudio, stopAudio, getFrequencyData }`
 *   - `isActive`: true after successful `initAudio`
 *   - `error`: `"Microphone access denied"` on permission failure, else `null`
 *   - `initAudio` / `stopAudio`: start/teardown microphone and analyzer
 *   - `getFrequencyData`: returns current frequency data or `null`
 */
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
