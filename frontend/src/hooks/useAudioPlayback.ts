import { useCallback, useRef, useState } from "react";

/**
 * Manages HTMLAudioElement lifecycle and playback state
 */
export function useAudioPlayback() {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(
    (
      url: string,
      onTimeUpdate?: (time: number) => void,
      onEnded?: () => void
    ): Promise<void> => {
      const audio = audioElRef.current;
      if (!audio) {
        console.warn("[useAudioPlayback] Audio element not initialized");
        return Promise.reject(new Error("Audio element not available"));
      }

      audio.src = url;
      setIsPlaying(true);

      if (onTimeUpdate) {
        audio.ontimeupdate = () => onTimeUpdate(audio.currentTime);
      }

      if (onEnded) {
        audio.onended = () => {
          audio.onplay = null;
          audio.ontimeupdate = null;
          setIsPlaying(false);
          onEnded();
        };
      }

      return audio.play().catch((e: Error) => {
        console.error("[useAudioPlayback] Playback failed:", e);
        setIsPlaying(false);
        throw e;
      });
    },
    []
  );

  const stopAudio = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onplay = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    audioElRef,
    playAudio,
    stopAudio,
    isPlaying,
  };
}
