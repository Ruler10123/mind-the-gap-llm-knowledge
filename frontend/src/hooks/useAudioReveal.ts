import { useCallback, useRef, useState } from "react";
import { useAudioPlayback } from "./useAudioPlayback";
import {
  createAudioBlobUrl,
  revokeAudioUrl,
} from "@/utils/audio";
import {
  getRevealedTextAtTime,
  getFullText,
  type CharacterAlignment,
} from "@/utils/textReveal";

/**
 * Combines audio playback with character-by-character text reveal synced to audio timing
 */
export function useAudioReveal() {
  const { audioElRef, playAudio, stopAudio, isPlaying } = useAudioPlayback();
  const [revealedText, setRevealedText] = useState("");
  const lastCharIndexRef = useRef(-1);
  const currentAudioUrlRef = useRef<string | null>(null);

  const playWithReveal = useCallback(
    (audioChunks: string[], alignment: CharacterAlignment | null) => {
      if (audioChunks.length === 0) {
        console.warn("[useAudioReveal] No audio chunks to play");
        return;
      }

      try {
        // Revoke previous URL if it exists
        if (currentAudioUrlRef.current) {
          revokeAudioUrl(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        }

        const url = createAudioBlobUrl(audioChunks);
        currentAudioUrlRef.current = url;
        lastCharIndexRef.current = -1;
        setRevealedText("");

        console.log(
          "[useAudioReveal] Starting playback, alignment characters:",
          alignment?.characters.length ?? 0
        );

        const handleTimeUpdate = (currentTime: number) => {
          if (!alignment || alignment.characters.length === 0) return;

          const { text, newIndex } = getRevealedTextAtTime(
            alignment,
            currentTime,
            lastCharIndexRef.current
          );

          if (newIndex > lastCharIndexRef.current) {
            lastCharIndexRef.current = newIndex;
            setRevealedText(text);
          }
        };

        const handleEnded = () => {
          console.log("[useAudioReveal] Playback ended");
          if (alignment?.characters.length) {
            setRevealedText(getFullText(alignment));
          }
          if (currentAudioUrlRef.current) {
            revokeAudioUrl(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }
        };

        playAudio(url, handleTimeUpdate, handleEnded).catch((e) => {
          console.error("[useAudioReveal] Playback error:", e);
          if (currentAudioUrlRef.current) {
            revokeAudioUrl(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }
        });
      } catch (e) {
        console.error("[useAudioReveal] Failed to create audio:", e);
      }
    },
    [playAudio]
  );

  const clearText = useCallback(() => {
    setRevealedText("");
    lastCharIndexRef.current = -1;
  }, []);

  const stopAudioAndCleanup = useCallback(() => {
    console.log("[useAudioReveal] Stopping audio and cleaning up");
    stopAudio();
    // Revoke blob URL if it exists
    if (currentAudioUrlRef.current) {
      revokeAudioUrl(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    clearText();
  }, [stopAudio, clearText]);

  const setText = useCallback((text: string) => {
    setRevealedText(text);
    lastCharIndexRef.current = text.length - 1;
  }, []);

  return {
    audioElRef,
    revealedText,
    isRevealing: isPlaying,
    playWithReveal,
    stopAudio: stopAudioAndCleanup,
    clearText,
    setText,
  };
}
