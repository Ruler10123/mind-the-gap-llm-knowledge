/**
 * Pure functions for audio operations
 */

/**
 * Concatenate base64-encoded audio chunks into a single Uint8Array
 */
export function concatenateBase64AudioChunks(chunks: string[]): Uint8Array {
  let totalLen = 0;
  for (const b64 of chunks) {
    totalLen += atob(b64).length;
  }

  const bytes = new Uint8Array(totalLen);
  let offset = 0;
  for (const b64 of chunks) {
    const bin = atob(b64);
    for (let i = 0; i < bin.length; i++) {
      bytes[offset++] = bin.charCodeAt(i);
    }
  }

  return bytes;
}

/**
 * Create a blob URL from base64 audio chunks
 */
export function createAudioBlobUrl(chunks: string[]): string {
  const bytes = concatenateBase64AudioChunks(chunks);
  const blob = new Blob([bytes as BlobPart], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

/**
 * Revoke an audio blob URL to free memory
 */
export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}
