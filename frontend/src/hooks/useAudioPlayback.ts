import { useCallback, useRef, useState } from "react";

/**
 * Manages HTMLAudioElement lifecycle and playback state
 */
export function useAudioPlayback() {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentUrlRef = useRef<string | null>(null);

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

      // Stop any currently playing audio first
      if (currentUrlRef.current && audio.src) {
        audio.pause();
        audio.currentTime = 0;
      }

      audio.src = url;
      currentUrlRef.current = url;
      setIsPlaying(true);

      if (onTimeUpdate) {
        audio.ontimeupdate = () => onTimeUpdate(audio.currentTime);
      }

      if (onEnded) {
        audio.onended = () => {
          audio.onplay = null;
          audio.ontimeupdate = null;
          setIsPlaying(false);
          currentUrlRef.current = null;
          onEnded();
        };
      }

      return audio.play().catch((e: Error) => {
        console.error("[useAudioPlayback] Playback failed:", e);
        setIsPlaying(false);
        currentUrlRef.current = null;
        throw e;
      });
    },
    []
  );

  const stopAudio = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      console.log("[useAudioPlayback] Stopping audio playback");
      audio.pause();
      audio.currentTime = 0;
      audio.onplay = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      // Clear the src to fully stop playback
      audio.src = "";
      audio.load(); // Reset the audio element
      setIsPlaying(false);
      currentUrlRef.current = null;
    }
  }, []);

  return {
    audioElRef,
    playAudio,
    stopAudio,
    isPlaying,
  };
}
