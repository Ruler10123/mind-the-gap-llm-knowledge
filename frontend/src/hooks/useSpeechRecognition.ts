import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopRequestedRef = useRef(false);
  const transcriptRef = useRef("");
  const onCompleteRef = useRef<(finalTranscript: string) => void>(() => {});
  const onEndFiredRef = useRef(false);

  const supported = !!getSpeechRecognition();

  useEffect(() => {
    console.log("[Mic] useSpeechRecognition hook initialized");
    console.log("[Mic] Speech recognition supported:", supported);
    if (!supported) {
      console.warn("[Mic] Speech Recognition API not available in this browser");
    }
  }, [supported]);

  const start = useCallback((onComplete: (finalTranscript: string) => void) => {
    console.log("[Mic] start() called");
    const SR = getSpeechRecognition();
    if (!SR) {
      console.warn("[Mic] Speech Recognition not supported in this browser");
      setError("Speech Recognition not supported in this browser");
      return false;
    }
    
    stopRequestedRef.current = false;
    onEndFiredRef.current = false;
    onCompleteRef.current = onComplete;
    transcriptRef.current = "";
    setTranscript("");
    setError(null);

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    console.log("[Mic] Speech recognition initialized, starting...");

    rec.onresult = (e: SpeechRecognitionEvent) => {
      console.log(`[Mic] onresult fired, results length: ${e.results.length}`);
      let committed = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        console.log(`[Mic] Result [${i}]: isFinal=${r.isFinal}, transcript="${t}"`);
        if (r.isFinal) {
          committed += t;
          console.log(`[Mic] Final result [${i}]: "${t}"`);
        } else {
          interim = t;
          console.log(`[Mic] Interim result [${i}]: "${t}"`);
        }
      }
      transcriptRef.current += committed;
      const newTranscript = transcriptRef.current + interim;
      console.log(`[Mic] Updated transcript: "${newTranscript}" (committed: "${transcriptRef.current}", interim: "${interim}")`);
      setTranscript(newTranscript);
    };

    rec.onstart = () => {
      console.log("[Mic] Recording started successfully");
    };

    rec.onend = () => {
      console.log("[Mic] Recording ended, stopRequested:", stopRequestedRef.current);
      onEndFiredRef.current = true;
      const final = transcriptRef.current.trim();
      console.log(`[Mic] Transcript at end: "${final}"`);
      recognitionRef.current = null;
      if (stopRequestedRef.current) {
        console.log(`[Mic] User-initiated stop, calling onComplete with: "${final}"`);
        transcriptRef.current = "";
        setTranscript("");
        onCompleteRef.current(final);
      } else {
        console.log("[Mic] Recording ended unexpectedly (not user-initiated stop), transcript:", final);
        // Still call onComplete even if not user-initiated, in case there's a transcript
        if (final) {
          console.log("[Mic] Calling onComplete with unexpected end transcript:", final);
          transcriptRef.current = "";
          setTranscript("");
          onCompleteRef.current(final);
        }
      }
    };

    rec.onerror = (e: Event) => {
      const errorEvent = e as SpeechRecognitionErrorEvent;
      console.error("[Mic] Speech recognition error:", errorEvent.error, errorEvent.message);
      setIsRecording(false);
      const errorCode = errorEvent.error;
      if (errorCode === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else if (errorCode === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Speech recognition error: ${errorCode}`);
      }
    };

    try {
      rec.start();
      setIsRecording(true);
      console.log("[Mic] Recording started, isRecording set to true");
      return true;
    } catch (err) {
      console.error("[Mic] Failed to start speech recognition:", err);
      setError("Failed to start microphone. Please check permissions.");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    console.log("[Mic] stop() called");
    const rec = recognitionRef.current;
    if (!rec) {
      console.warn("[Mic] stop() called but no active recognition");
      return;
    }
    console.log("[Mic] Stopping recognition, current transcript:", transcriptRef.current);
    stopRequestedRef.current = true;
    
    // Get the current transcript before stopping
    const currentTranscript = transcriptRef.current.trim();
    
    rec.stop();
    setIsRecording(false);
    console.log("[Mic] Recognition stopped, isRecording set to false");
    
    // Fallback: if we have a transcript and onend doesn't fire, send it after a short delay
    if (currentTranscript) {
      console.log("[Mic] Setting fallback timer to send transcript if onend doesn't fire");
      setTimeout(() => {
        // Only send if onend hasn't fired yet
        if (!onEndFiredRef.current && stopRequestedRef.current) {
          console.log("[Mic] Fallback: onend didn't fire within 500ms, sending transcript manually:", currentTranscript);
          onEndFiredRef.current = true; // Prevent double-sending
          transcriptRef.current = "";
          setTranscript("");
          onCompleteRef.current(currentTranscript);
        }
      }, 500);
    }
  }, []);

  const toggle = useCallback(
    (onComplete: (finalTranscript: string) => void) => {
      console.log(`[Mic] toggle() called, current state: isRecording=${isRecording}`);
      if (isRecording) {
        console.log("[Mic] Currently recording, stopping...");
        stop();
      } else {
        console.log("[Mic] Not recording, starting...");
        start(onComplete);
      }
    },
    [isRecording, start, stop]
  );

  return { isRecording, transcript, start, stop, toggle, supported, error };
}
