import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVoiceWebSocket } from "./useVoiceWebSocket";
import { useAudioReveal } from "./useAudioReveal";
import { useWebSocketMessages } from "./useWebSocketMessages";
import { useNavigationHandler } from "./useNavigationHandler";

export function useVoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [componentMessages, setComponentMessages] = useState<Array<{
    id: string;
    componentType: string;
    data: Record<string, any>;
  }>>([]);
  const { audioElRef, revealedText, isRevealing, playWithReveal, clearText, stopAudio } =
    useAudioReveal();
  const { handleUIAction, modalState, closeModal, openPendingModal, clearPendingModal } = useNavigationHandler();
  // Track if we're closing to prevent mic completion from sending messages
  const isClosingRef = useRef(false);

  const handleDone = useCallback(() => {
    console.log("[VoiceAssistant] Done message received, playing all chunks");
    const chunks = getQueuedChunks();
    const alignment = getAlignment();
    if (chunks.length > 0) {
      playWithReveal(chunks, alignment);
      clearQueue();
      setIsProcessing(false);
    }
  }, []);

  const handleError = useCallback((message: string) => {
    console.error("[VoiceAssistant] Error message received:", message);
    clearQueue();
    setIsProcessing(false);
  }, []);

  const handleComponent = useCallback((event: { componentType: string; data: Record<string, any> }) => {
    console.log("[VoiceAssistant] Component received:", event);
    setComponentMessages(prev => [...prev, {
      id: Date.now().toString(),
      componentType: event.componentType,
      data: event.data,
    }]);
  }, []);

  const { handleMessage, clearQueue, getQueuedChunks, getAlignment } =
    useWebSocketMessages({
      onDone: handleDone,
      onError: handleError,
      onUIAction: handleUIAction,
      onComponent: handleComponent,
    });

  // Expose clear methods for external use - stops audio and clears all buffers
  const clearAllBuffers = useCallback(() => {
    console.log("[VoiceAssistant] clearAllBuffers called - stopping all audio and clearing state");
    // Set closing flag to prevent mic completion from sending messages
    isClosingRef.current = true;
    stopAudio(); // Stop any currently playing audio (this also revokes blob URLs)
    clearText(); // Clear revealed text (streamingText) - this ensures assistant mode resets to passive
    clearQueue(); // Clear audio queue and alignment
    setIsProcessing(false); // Reset processing state - this ensures assistant mode resets to passive
    setComponentMessages([]); // Clear component messages
    clearPendingModal(); // Clear any pending modals
    // Reset closing flag after a delay to allow mic stop to complete
    setTimeout(() => {
      isClosingRef.current = false;
    }, 1000);
  }, [stopAudio, clearText, clearQueue, clearPendingModal]);

  const {
    connected,
    status,
    error: wsError,
    connect,
    disconnect,
    send,
  } = useVoiceWebSocket(handleMessage);

  const {
    isRecording,
    transcript: micTranscript,
    toggle: toggleMic,
    supported: micSupported,
    error: micError,
  } = useSpeechRecognition();

  useEffect(() => {
    console.log("[VoiceAssistant] useVoiceAssistant hook initialized");
    console.log("[VoiceAssistant] Mic supported:", micSupported);
    console.log(
      "[VoiceAssistant] Initial state - isRecording:",
      isRecording,
      "connected:",
      connected
    );
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) {
        console.warn("[VoiceAssistant] sendMessage() called with empty text");
        return;
      }
      console.log("[VoiceAssistant] Sending message:", t);
      setIsProcessing(true);
      clearQueue();
      clearText();
      clearPendingModal(); // Clear any pending modals from previous requests
      send({ message: t });
    },
    [send, clearQueue, clearText, clearPendingModal]
  );

  const handleMicComplete = useCallback(
    (finalTranscript: string) => {
      console.log(
        "[VoiceAssistant] handleMicComplete called with transcript:",
        finalTranscript
      );
      // Skip sending if we're closing (to prevent sending messages when chat is closed)
      if (isClosingRef.current) {
        console.log("[VoiceAssistant] Skipping send - chat is closing");
        setIsProcessing(false);
        return;
      }
      if (finalTranscript) {
        console.log(
          "[VoiceAssistant] Sending transcript to backend:",
          finalTranscript
        );
        sendMessage(finalTranscript);
      } else {
        console.warn(
          "[VoiceAssistant] handleMicComplete called with empty transcript"
        );
        setIsProcessing(false);
      }
    },
    [sendMessage]
  );

  const wrappedToggleMic = useCallback(() => {
    console.log("[VoiceAssistant] toggleMic button clicked");
    console.log(
      "[VoiceAssistant] Current state - isRecording:",
      isRecording,
      "micSupported:",
      micSupported,
      "connected:",
      connected
    );
    // When stopping to send: set processing *before* stop so we never render
    // passive (isRecording false, isProcessing false). stop() sync-sets
    // isRecording false; onend runs async and calls sendMessage. Without this,
    // we'd jitter passive -> processing.
    if (isRecording) {
      setIsProcessing(true);
    }
    toggleMic(handleMicComplete);
  }, [isRecording, micSupported, connected, toggleMic, handleMicComplete]);

  // Only show revealed text (assistant responses), not mic transcript
  // Mic transcript should only appear in the input field
  const displayText = useMemo(
    () => revealedText,
    [revealedText]
  );

  const isStreaming = useMemo(
    () => isRecording || isRevealing,
    [isRecording, isRevealing]
  );

  // Open pending modals only when text is actually visible (not just when audio starts)
  useEffect(() => {
    // Only open modal when there's actual visible text content (at least a few characters)
    // This ensures the modal appears when speech/text is actually visible, not just when audio playback begins
    if (revealedText && revealedText.trim().length > 0 && !modalState.isOpen) {
      openPendingModal();
    }
  }, [revealedText, modalState.isOpen, openPendingModal]);

  const error = useMemo(
    () => wsError || micError || null,
    [wsError, micError]
  );

  return {
    connected,
    status,
    error,
    connect,
    disconnect,
    isRecording,
    micTranscript,
    micSupported,
    toggleMic: wrappedToggleMic,
    streamingText: displayText,
    isStreaming,
    isProcessing,
    sendMessage,
    audioElRef,
    clearAllBuffers,
    modalState,
    closeModal,
    componentMessages,
  };
}
