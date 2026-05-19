"""TTS provider abstraction.

All implementations stream `(audio_bytes, alignment_part | None)` pairs.
- `audio_bytes` is a self-contained playable audio blob in any browser-
  decodable format (mp3 for ElevenLabs, WAV for Kokoro).
- `alignment_part` is either a dict with `characters`,
  `character_start_times_seconds`, `character_end_times_seconds` lists,
  or `None` when the provider does not produce character-level
  alignment. The WebSocket handler aggregates parts and emits one
  alignment event if any non-None parts arrived.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any


class BaseTTSService(ABC):
    """TTS provider interface."""

    @property
    @abstractmethod
    def enabled(self) -> bool:
        """True if the provider is configured and importable."""

    @abstractmethod
    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        """Yield (audio_chunk, alignment_part) tuples for `text`."""


class DisabledTTSService(BaseTTSService):
    """No-op TTS. Yields nothing; the WebSocket handler will skip audio."""

    @property
    def enabled(self) -> bool:
        return False

    async def stream_with_timestamps(self, text: str):
        if False:  # pragma: no cover - keep the type as async generator
            yield (b"", None)
        return
