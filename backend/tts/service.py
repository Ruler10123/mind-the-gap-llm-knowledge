"""TTS service abstraction."""

from collections.abc import AsyncIterator
from typing import Any

from config import settings
from observability.logger import logger


class TTSService:
    """Text-to-speech service. No-op when ElevenLabs is not configured."""

    @property
    def enabled(self) -> bool:
        return bool(settings.elevenlabs_api_key and settings.elevenlabs_voice_id)

    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        """
        Stream TTS with alignment timestamps.
        Yields (audio_bytes, alignment_part | None) per chunk.
        Yields nothing when ElevenLabs is unconfigured — the WebSocket handler
        will then skip audio and send `done`.
        """
        if not self.enabled:
            logger.debug("[TTS] ElevenLabs not configured; skipping audio stream")
            return
        from tts.elevenlabs_client import stream_tts_with_timestamps
        async for chunk in stream_tts_with_timestamps(text):
            yield chunk
