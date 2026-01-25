/**
 * Pure functions for text reveal based on audio timing alignment
 */

export type CharacterAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/**
 * Get the revealed text at a specific time based on alignment data
 * @returns The revealed text and the new character index
 */
export function getRevealedTextAtTime(
  alignment: CharacterAlignment,
  currentTime: number,
  lastIndex: number
): { text: string; newIndex: number } {
  if (!alignment || alignment.characters.length === 0) {
    return { text: "", newIndex: lastIndex };
  }

  let idx = lastIndex;
  while (
    idx + 1 < alignment.character_start_times_seconds.length &&
    alignment.character_start_times_seconds[idx + 1] <= currentTime
  ) {
    idx += 1;
  }

  const text = alignment.characters.slice(0, idx + 1).join("");
  return { text, newIndex: idx };
}

/**
 * Get the full text from alignment data
 */
export function getFullText(alignment: CharacterAlignment | null): string {
  if (!alignment || !alignment.characters.length) {
    return "";
  }
  return alignment.characters.join("");
}
