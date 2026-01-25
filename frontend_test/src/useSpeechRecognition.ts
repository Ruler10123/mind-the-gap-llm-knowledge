import { useCallback, useRef, useState } from "react";

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopRequestedRef = useRef(false);
  const transcriptRef = useRef("");

  const onStop = useRef<(finalTranscript: string) => void>(() => {});

  const start = useCallback((onComplete: (finalTranscript: string) => void) => {
    const SR = getSpeechRecognition();
    if (!SR) return false;
    stopRequestedRef.current = false;
    onStop.current = onComplete;
    transcriptRef.current = "";
    setTranscript("");

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let committed = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) committed += t;
        else interim = t;
      }
      transcriptRef.current += committed;
      setTranscript(transcriptRef.current + interim);
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (stopRequestedRef.current) {
        const final = transcriptRef.current.trim();
        transcriptRef.current = "";
        setTranscript("");
        onStop.current(final);
      }
    };

    rec.onerror = () => {};

    rec.start();
    setIsRecording(true);
    return true;
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    stopRequestedRef.current = true;
    rec.stop();
    setIsRecording(false);
  }, []);

  const toggle = useCallback(
    (onComplete: (finalTranscript: string) => void) => {
      if (isRecording) {
        stop();
      } else {
        start(onComplete);
      }
    },
    [isRecording, start, stop]
  );

  const supported = !!getSpeechRecognition();
  return { isRecording, transcript, start, stop, toggle, supported };
}
