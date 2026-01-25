import { useCallback, useEffect, useMemo, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVoiceWebSocket } from "./useVoiceWebSocket";
import { useAudioReveal } from "./useAudioReveal";
import { useWebSocketMessages } from "./useWebSocketMessages";

export function useVoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { audioElRef, revealedText, isRevealing, playWithReveal, clearText } =
    useAudioReveal();

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

  const { handleMessage, clearQueue, getQueuedChunks, getAlignment } =
    useWebSocketMessages({
      onDone: handleDone,
      onError: handleError,
    });

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

  const displayText = useMemo(
    () => (isRecording ? micTranscript : revealedText),
    [isRecording, micTranscript, revealedText]
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
  };
}
