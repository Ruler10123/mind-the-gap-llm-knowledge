import { useState, useEffect } from 'react'
import type { VoiceState } from '../types'

interface UseKioskStateProps {
  isRecording: boolean
  isProcessing: boolean
  connected: boolean
  streamingText: string
  sendMessage: (text: string) => void
  toggleMic: () => void
  micTranscript?: string
}

export function useKioskState({
  isRecording,
  isProcessing,
  connected,
  streamingText,
  sendMessage,
  toggleMic,
  micTranscript,
}: UseKioskStateProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [currentQuery, setCurrentQuery] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Sync voice state with actual recording/processing states
  useEffect(() => {
    if (isRecording) {
      setVoiceState('listening')
    } else if (isProcessing) {
      setVoiceState('processing')
    } else if (streamingText) {
      setVoiceState('speaking')
    } else if (showChat) {
      setVoiceState('idle')
    }
  }, [isRecording, isProcessing, streamingText, showChat])

  // Update input with microphone transcript when recording
  useEffect(() => {
    if (micTranscript && isRecording) {
      setCurrentQuery(micTranscript)
    }
  }, [micTranscript, isRecording])

  const handleVoiceActivate = () => {
    if (!connected) return
    
    if (voiceState === 'idle' || !showChat) {
      setShowChat(true)
      setCurrentQuery(null)
      // Start recording
      toggleMic()
    } else if (isRecording) {
      // Stop recording and send
      toggleMic()
    }
  }

  const handleType = () => {
    setShowChat(true)
    setCurrentQuery(null)
  }

  const handleQuery = (query: string) => {
    if (!connected || !query.trim()) return
    setCurrentQuery(query)
    sendMessage(query)
  }

  const handleClose = () => {
    setVoiceState('idle')
    setShowChat(false)
    setCurrentQuery(null)
  }

  const handleMute = () => {
    setIsMuted(true)
  }

  const handleUnmute = () => {
    setIsMuted(false)
  }

  return {
    voiceState,
    showChat,
    isMuted,
    currentQuery,
    handleVoiceActivate,
    handleType,
    handleQuery,
    handleClose,
    handleMute,
    handleUnmute,
  }
}
