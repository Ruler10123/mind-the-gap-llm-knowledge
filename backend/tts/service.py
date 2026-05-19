"""TTS service facade.

`TTSService` keeps its public shape (`enabled`, `stream_with_timestamps`)
so callers — notably `transport/websocket_handler.py` — do not change.
Internally it dispatches to an implementation selected by
`settings.tts_provider`.
"""

from collections.abc import AsyncIterator
from typing import Any

from config import settings
from observability.logger import logger
from tts.base import BaseTTSService, DisabledTTSService


def _select_provider() -> BaseTTSService:
    raw = (settings.tts_provider or "").strip().lower()

    # Back-compat: unset provider but ElevenLabs keys present → ElevenLabs.
    if not raw:
        if settings.elevenlabs_api_key and settings.elevenlabs_voice_id:
            raw = "elevenlabs"
        else:
            raw = "disabled"

    if raw == "disabled":
        logger.info("[TTS] Provider disabled")
        return DisabledTTSService()

    if raw == "elevenlabs":
        from tts.elevenlabs_service import ElevenLabsTTSService
        svc = ElevenLabsTTSService()
        if not svc.enabled:
            logger.warning(
                "[TTS] tts_provider=elevenlabs but ELEVENLABS_API_KEY or "
                "ELEVENLABS_VOICE_ID missing; TTS disabled"
            )
            return DisabledTTSService()
        logger.info("[TTS] Using ElevenLabs")
        return svc

    if raw == "kokoro":
        from tts.kokoro_service import KokoroTTSService
        svc = KokoroTTSService()
        if not svc.enabled:
            logger.warning(
                "[TTS] tts_provider=kokoro but the kokoro package failed to "
                "load; TTS disabled. Install with `uv pip install kokoro soundfile`."
            )
            return DisabledTTSService()
        logger.info("[TTS] Using Kokoro (local)")
        return svc

    logger.warning(f"[TTS] Unknown tts_provider={raw!r}; TTS disabled")
    return DisabledTTSService()


class TTSService:
    """Public TTS facade. Selects provider lazily on first use."""

    def __init__(self) -> None:
        self._impl: BaseTTSService | None = None

    @property
    def impl(self) -> BaseTTSService:
        if self._impl is None:
            self._impl = _select_provider()
        return self._impl

    @property
    def enabled(self) -> bool:
        return self.impl.enabled

    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        async for chunk in self.impl.stream_with_timestamps(text):
            yield chunk
