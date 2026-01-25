"""TTS service abstraction."""

from collections.abc import AsyncIterator
from typing import Any

from tts.elevenlabs_client import stream_tts_with_timestamps


class TTSService:
    """Text-to-speech service."""

    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        """
        Stream TTS with alignment timestamps.
        Yields (audio_bytes, alignment_part | None) per chunk.
        """
        async for chunk in stream_tts_with_timestamps(text):
            yield chunk
