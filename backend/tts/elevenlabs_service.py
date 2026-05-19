"""ElevenLabs TTS provider — thin class wrapper around `elevenlabs_client`."""

from collections.abc import AsyncIterator
from typing import Any

from config import settings
from tts.base import BaseTTSService


class ElevenLabsTTSService(BaseTTSService):
    """Streams mp3 audio + character alignment from ElevenLabs."""

    @property
    def enabled(self) -> bool:
        return bool(settings.elevenlabs_api_key and settings.elevenlabs_voice_id)

    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        if not self.enabled:
            return
        from tts.elevenlabs_client import stream_tts_with_timestamps
        async for chunk in stream_tts_with_timestamps(text):
            yield chunk
