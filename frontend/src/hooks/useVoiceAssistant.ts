import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { handleUIAction, modalState, closeModal } = useNavigationHandler();

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
    stopAudio(); // Stop any currently playing audio (this also revokes blob URLs)
    clearText(); // Clear revealed text
    clearQueue(); // Clear audio queue and alignment
    setIsProcessing(false); // Reset processing state
    setComponentMessages([]); // Clear component messages
  }, [stopAudio, clearText, clearQueue]);

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
      send({ message: t });
    },
    [send, clearQueue, clearText]
  );

  const handleMicComplete = useCallback(
    (finalTranscript: string) => {
      console.log(
        "[VoiceAssistant] handleMicComplete called with transcript:",
        finalTranscript
      );
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
