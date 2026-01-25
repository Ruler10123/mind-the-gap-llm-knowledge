import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useVoiceAssistant } from './useVoiceAssistant'

/**
 * Unified state management for voice assistant UI
 * Consolidates all chat, input, and UI state in one place
 */
export function useVoiceAssistantState() {
  const voiceAssistant = useVoiceAssistant()
  
  // UI State
  const [showChat, setShowChat] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ id: string; type: 'user' | 'assistant'; content: string }>>([])

  // Derive voice state from voice assistant
  const voiceState = useMemo(() => {
    if (voiceAssistant.isRecording) return 'listening'
    if (voiceAssistant.isProcessing) return 'processing'
    if (voiceAssistant.streamingText) return 'speaking'
    return 'idle'
  }, [voiceAssistant.isRecording, voiceAssistant.isProcessing, voiceAssistant.streamingText])

  // Sync input with microphone transcript when recording
  useEffect(() => {
    if (voiceAssistant.micTranscript && voiceAssistant.isRecording) {
      setInput(voiceAssistant.micTranscript)
    }
  }, [voiceAssistant.micTranscript, voiceAssistant.isRecording])

  // Track if we're closing to prevent adding messages during close
  const isClosingRef = useRef(false)
  
  // Add user message when recording stops and we have a transcript
  const lastSentTranscriptRef = useRef<string>('')
  useEffect(() => {
    if (
      !voiceAssistant.isRecording && 
      voiceAssistant.micTranscript && 
      voiceAssistant.micTranscript.trim() && 
      voiceAssistant.micTranscript !== lastSentTranscriptRef.current &&
      !isClosingRef.current
    ) {
      lastSentTranscriptRef.current = voiceAssistant.micTranscript
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: voiceAssistant.micTranscript
      }])
      setInput('')
    }
  }, [voiceAssistant.isRecording, voiceAssistant.micTranscript])

  // Handlers
  const handleVoiceActivate = useCallback(() => {
    if (!voiceAssistant.connected || voiceAssistant.isProcessing) return
    
    if (!showChat) {
      setShowChat(true)
      setInput('')
    }
    voiceAssistant.toggleMic()
  }, [voiceAssistant.connected, voiceAssistant.isProcessing, voiceAssistant.toggleMic, showChat])

  const handleType = useCallback(() => {
    setShowChat(true)
    setInput('')
  }, [])

  const handleSend = useCallback((text?: string) => {
    const textToSend = (text || input).trim()
    if (!textToSend || !voiceAssistant.connected) return

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend
    }])
    setInput('')
    voiceAssistant.sendMessage(textToSend)
  }, [input, voiceAssistant.connected, voiceAssistant.sendMessage])

  const handleClose = useCallback(() => {
    // Set closing flag to prevent adding messages
    isClosingRef.current = true
    
    // Stop recording if active (this may send the transcript, but we'll clear UI anyway)
    if (voiceAssistant.isRecording) {
      voiceAssistant.toggleMic()
    }
    
    // Clear all buffers and state - this stops audio, clears queue, resets processing
    if (voiceAssistant.clearAllBuffers) {
      voiceAssistant.clearAllBuffers()
    }
    
    // Clear UI state
    setShowChat(false)
    setInput('')
    setMessages([])
    lastSentTranscriptRef.current = ''
    
    // Reset closing flag after a brief delay to allow any pending operations to complete
    setTimeout(() => {
      isClosingRef.current = false
    }, 500)
  }, [voiceAssistant])

  const handleMute = useCallback(() => {
    setIsMuted(true)
  }, [])

  const handleUnmute = useCallback(() => {
    setIsMuted(false)
  }, [])

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  return {
    // Voice assistant state (pass through)
    ...voiceAssistant,
    
    // UI state
    showChat,
    isMuted,
    input,
    messages,
    voiceState,
    
    // Handlers
    handleVoiceActivate,
    handleType,
    handleSend,
    handleClose,
    handleMute,
    handleUnmute,
    handleInputChange,
  }
}
