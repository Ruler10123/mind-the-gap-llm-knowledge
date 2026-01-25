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
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant' | 'component';
    content?: string;
    componentType?: string;
    componentData?: Record<string, any>;
    timestamp?: Date;
  }>>([])

  // Derive voice state from voice assistant
  const voiceState = useMemo(() => {
    if (voiceAssistant.isRecording) return 'listening'
    if (voiceAssistant.isProcessing) return 'processing'
    if (voiceAssistant.streamingText) return 'speaking'
    return 'idle'
  }, [voiceAssistant.isRecording, voiceAssistant.isProcessing, voiceAssistant.streamingText])

  // Convert completed streaming text to message
  const lastStreamingTextRef = useRef<string>('')
  useEffect(() => {
    // When streaming completes (text exists but no longer streaming), add as message
    if (
      voiceAssistant.streamingText &&
      !voiceAssistant.isStreaming &&
      voiceAssistant.streamingText !== lastStreamingTextRef.current &&
      !isClosingRef.current
    ) {
      lastStreamingTextRef.current = voiceAssistant.streamingText
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: voiceAssistant.streamingText,
        timestamp: new Date(),
      }])
    }
  }, [voiceAssistant.streamingText, voiceAssistant.isStreaming])

  // Merge component messages into messages array
  const lastComponentIdRef = useRef<string>('')
  useEffect(() => {
    if (voiceAssistant.componentMessages && voiceAssistant.componentMessages.length > 0) {
      const newComponentMsg = voiceAssistant.componentMessages[voiceAssistant.componentMessages.length - 1]

      if (newComponentMsg.id !== lastComponentIdRef.current && !isClosingRef.current) {
        lastComponentIdRef.current = newComponentMsg.id
        setMessages(prev => [...prev, {
          id: newComponentMsg.id,
          type: 'component',
          componentType: newComponentMsg.componentType,
          componentData: newComponentMsg.data,
          timestamp: new Date(),
        }])
      }
    }
  }, [voiceAssistant.componentMessages])

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
        content: voiceAssistant.micTranscript,
        timestamp: new Date(),
      }])
      setInput('')
    }
  }, [voiceAssistant.isRecording, voiceAssistant.micTranscript])

  // Auto-send when mic is enabled and no new text is added for a short period
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>('')
  useEffect(() => {
    // Clear any existing timeout
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }

    // Only auto-send when recording and we have a transcript
    if (
      voiceAssistant.isRecording && 
      voiceAssistant.micTranscript && 
      voiceAssistant.micTranscript.trim() &&
      voiceAssistant.connected &&
      !voiceAssistant.isProcessing &&
      !isClosingRef.current
    ) {
      const currentTranscript = voiceAssistant.micTranscript.trim()
      
      // If transcript changed, reset the timer
      if (currentTranscript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = currentTranscript
        
        // Set timeout to auto-send after 2 seconds of no new text
        autoSendTimeoutRef.current = setTimeout(() => {
          // Only send if still recording and transcript hasn't changed
          if (
            voiceAssistant.isRecording &&
            voiceAssistant.micTranscript?.trim() === currentTranscript &&
            !isClosingRef.current
          ) {
            console.log('[VoiceAssistantState] Auto-sending message after silence:', currentTranscript)
            // Stop recording first, then send
            voiceAssistant.toggleMic()
            // The handleMicComplete callback will send the message
          }
        }, 2000) // 2 seconds of silence
      }
    } else if (!voiceAssistant.isRecording) {
      // Clear the ref when recording stops
      lastTranscriptRef.current = ''
    }

    // Cleanup timeout on unmount or when conditions change
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
        autoSendTimeoutRef.current = null
      }
    }
  }, [
    voiceAssistant.isRecording,
    voiceAssistant.micTranscript,
    voiceAssistant.connected,
    voiceAssistant.isProcessing,
    voiceAssistant.toggleMic,
  ])

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
      content: textToSend,
      timestamp: new Date(),
    }])
    setInput('')
    voiceAssistant.sendMessage(textToSend)
  }, [input, voiceAssistant.connected, voiceAssistant.sendMessage])

  const handleClose = useCallback(() => {
    console.log('[VoiceAssistantState] handleClose called - resetting all state')
    
    // Set closing flag to prevent adding messages
    isClosingRef.current = true

    // Clear auto-send timeout if active
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
    }

    // Reset auto-send transcript tracking
    lastTranscriptRef.current = ''

    // Stop recording if active (this will stop mic and Assistant3D audio analyzer)
    if (voiceAssistant.isRecording) {
      console.log('[VoiceAssistantState] Stopping recording')
      voiceAssistant.toggleMic()
    }

    // Clear all buffers and state - this stops audio, clears queue, resets processing
    // This handles:
    // - Stopping any currently playing audio
    // - Clearing revealed text (streamingText)
    // - Clearing audio queue and alignment
    // - Resetting isProcessing to false
    // - Clearing component messages
    if (voiceAssistant.clearAllBuffers) {
      console.log('[VoiceAssistantState] Clearing all buffers')
      voiceAssistant.clearAllBuffers()
    }

    // Close any open modals
    if (voiceAssistant.modalState?.isOpen) {
      console.log('[VoiceAssistantState] Closing open modal')
      voiceAssistant.closeModal()
    }

    // Clear UI state
    setShowChat(false)
    setInput('')
    setMessages([])
    setIsMuted(false) // Reset mute state
    lastSentTranscriptRef.current = ''
    lastComponentIdRef.current = ''
    lastStreamingTextRef.current = ''

    // Reset closing flag after a brief delay to allow any pending operations to complete
    setTimeout(() => {
      isClosingRef.current = false
      console.log('[VoiceAssistantState] Reset complete')
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
