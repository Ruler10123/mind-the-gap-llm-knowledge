import { useState } from 'react'
import type { VoiceState } from '../types'

export function useKioskState() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [currentQuery, setCurrentQuery] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const handleVoiceActivate = () => {
    if (voiceState === 'idle') {
      setVoiceState('listening')
      setShowChat(true)
      setCurrentQuery(null)
    } else if (voiceState === 'listening') {
      // Stop listening
      setVoiceState('idle')
      setShowChat(false)
    }
  }

  const handleType = () => {
    setVoiceState('listening')
    setShowChat(true)
    setCurrentQuery(null)
  }

  const handleQuery = (query: string) => {
    setCurrentQuery(query)
    setVoiceState('speaking')
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
