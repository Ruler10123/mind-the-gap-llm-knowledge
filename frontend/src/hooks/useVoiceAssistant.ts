import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVoiceWebSocket } from "./useVoiceWebSocket";

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type WebSocketMessage = {
  type: string;
  content?: string;
  chunk?: string;
  message?: string;
  characters?: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
};

export function useVoiceAssistant() {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioQueueRef = useRef<string[]>([]);
  const alignmentRef = useRef<Alignment | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const playAllChunks = useCallback(() => {
    const queue = audioQueueRef.current;
    if (queue.length === 0) return;

    const align = alignmentRef.current;
    alignmentRef.current = null;

    try {
      let totalLen = 0;
      for (const b64 of queue) {
        totalLen += atob(b64).length;
      }

      const bytes = new Uint8Array(totalLen);
      let offset = 0;
      for (const b64 of queue) {
        const bin = atob(b64);
        for (let i = 0; i < bin.length; i++) {
          bytes[offset++] = bin.charCodeAt(i);
        }
      }
      audioQueueRef.current = [];

      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = audioElRef.current;
      if (!audio) {
        URL.revokeObjectURL(url);
        return;
      }

      audio.src = url;
      setStreamingText("");
      setIsStreaming(true);
      setIsProcessing(false); // Transition from processing to streaming
      console.log("[VoiceAssistant] Starting audio playback, alignment characters:", align?.characters.length ?? 0);

      let lastIdx = -1;

      const revealByTime = () => {
        if (!align || align.characters.length === 0) return;
        const t = audio.currentTime;
        let idx = lastIdx;
        while (
          idx + 1 < align.character_start_times_seconds.length &&
          align.character_start_times_seconds[idx + 1] <= t
        ) {
          idx += 1;
        }
        if (idx > lastIdx) {
          lastIdx = idx;
          setStreamingText(align.characters.slice(0, idx + 1).join(""));
        }
      };

      audio.ontimeupdate = revealByTime;
      audio.onplay = () => revealByTime();
      audio.onended = () => {
        console.log("[VoiceAssistant] Audio playback ended");
        audio.onplay = null;
        audio.ontimeupdate = null;
        if (align?.characters.length) {
          setStreamingText(align.characters.join(""));
        }
        setIsStreaming(false);
        URL.revokeObjectURL(url);
      };

      audio.play().catch((e: Error) => {
        console.error("[VoiceAssistant] Audio playback failed:", e);
        setIsStreaming(false);
        setIsProcessing(false);
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      console.error("[VoiceAssistant] Audio decode failed:", e);
      audioQueueRef.current = [];
      setIsStreaming(false);
      setIsProcessing(false);
    }
  }, [setIsProcessing]);

  const handleMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data) as WebSocketMessage;
        console.log("[VoiceAssistant] Received message type:", msg.type);
        switch (msg.type) {
          case "audio":
            const chunk = msg.chunk ?? "";
            if (chunk && typeof chunk === "string") {
              audioQueueRef.current.push(chunk);
              console.log("[VoiceAssistant] Audio chunk received, queue length:", audioQueueRef.current.length);
            }
            break;
          case "alignment":
            alignmentRef.current = {
              characters: msg.characters ?? [],
              character_start_times_seconds: msg.character_start_times_seconds ?? [],
              character_end_times_seconds: msg.character_end_times_seconds ?? [],
            };
            console.log("[VoiceAssistant] Alignment received, characters:", alignmentRef.current.characters.length);
            break;
          case "done":
            console.log("[VoiceAssistant] Done message received, playing all chunks");
            playAllChunks();
            break;
          case "error":
            console.error("[VoiceAssistant] Error message received:", msg.message);
            audioQueueRef.current = [];
            alignmentRef.current = null;
            setIsProcessing(false);
            break;
          default:
            console.log("[VoiceAssistant] Unknown message type:", msg.type);
        }
      } catch (e) {
        console.error("[VoiceAssistant] Failed to parse message from server:", e);
      }
    },
    [playAllChunks]
  );

  const {
    connected,
    status,
    error: wsError,
    connect,
    disconnect,
    send,
  } = useVoiceWebSocket(handleMessage);

  const { isRecording, transcript: micTranscript, toggle: toggleMic, supported: micSupported, error: micError } = useSpeechRecognition();

  useEffect(() => {
    console.log("[VoiceAssistant] useVoiceAssistant hook initialized");
    console.log("[VoiceAssistant] Mic supported:", micSupported);
    console.log("[VoiceAssistant] Initial state - isRecording:", isRecording, "connected:", connected);
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
      audioQueueRef.current = [];
      alignmentRef.current = null;
      setStreamingText("");
      send({ message: t });
    },
    [send]
  );

  const handleMicComplete = useCallback(
    (finalTranscript: string) => {
      console.log("[VoiceAssistant] handleMicComplete called with transcript:", finalTranscript);
      if (finalTranscript) {
        console.log("[VoiceAssistant] Sending transcript to backend:", finalTranscript);
        sendMessage(finalTranscript);
      } else {
        console.warn("[VoiceAssistant] handleMicComplete called with empty transcript");
      }
    },
    [sendMessage]
  );

  const wrappedToggleMic = useCallback(() => {
    console.log("[VoiceAssistant] toggleMic button clicked");
    console.log("[VoiceAssistant] Current state - isRecording:", isRecording, "micSupported:", micSupported, "connected:", connected);
    toggleMic(handleMicComplete);
  }, [isRecording, micSupported, connected, toggleMic, handleMicComplete]);

  return {
    connected,
    status,
    error: wsError || micError || null,
    connect,
    disconnect,
    isRecording,
    micTranscript,
    micSupported,
    toggleMic: wrappedToggleMic,
    streamingText: isRecording ? micTranscript : streamingText,
    isStreaming: isRecording || isStreaming,
    isProcessing,
    sendMessage,
    audioElRef,
  };
}
