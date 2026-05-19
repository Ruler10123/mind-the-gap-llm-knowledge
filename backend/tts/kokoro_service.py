"""Kokoro local TTS provider.

Wraps the `kokoro` Python package's `KPipeline`. Runs entirely on the
local machine — no API key required. The pipeline yields float32 PCM
segments per phoneme group; we concatenate them, wrap once in a WAV
header, and emit a single audio chunk.

Kokoro does not produce character-level alignment, so the alignment
part is always `None`. The WebSocket handler will therefore skip
emitting an `alignment` event (existing behaviour for empty alignment).

The `kokoro` package is *not* in pyproject.toml because the model
weights and torch dependency are heavy. Install on demand:

    uv pip install kokoro soundfile

When `tts_provider == "kokoro"` and the package is not importable, the
service reports `enabled = False` and the TTSService facade falls back
to disabled (logs a warning).
"""

from __future__ import annotations

import asyncio
import io
import wave
from collections.abc import AsyncIterator
from typing import Any

from config import settings
from observability.logger import logger
from tts.base import BaseTTSService


class KokoroTTSService(BaseTTSService):
    """Local TTS via the Kokoro `KPipeline`."""

    def __init__(self) -> None:
        self._pipeline = None
        self._import_error: Exception | None = None

    def _ensure_pipeline(self):
        if self._pipeline is not None or self._import_error is not None:
            return
        try:
            from kokoro import KPipeline  # type: ignore
        except Exception as e:  # ImportError or runtime deps missing
            self._import_error = e
            logger.warning(
                f"[Kokoro] Package not importable; install with "
                f"`uv pip install kokoro soundfile`. Error: {e}"
            )
            return
        try:
            self._pipeline = KPipeline(lang_code=settings.kokoro_lang_code)
            logger.info(
                f"[Kokoro] Pipeline ready (lang={settings.kokoro_lang_code}, "
                f"voice={settings.kokoro_voice})"
            )
        except Exception as e:
            self._import_error = e
            logger.warning(f"[Kokoro] Pipeline init failed: {e}")

    @property
    def enabled(self) -> bool:
        self._ensure_pipeline()
        return self._pipeline is not None

    async def stream_with_timestamps(
        self,
        text: str,
    ) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
        if not text.strip():
            return
        self._ensure_pipeline()
        if self._pipeline is None:
            return

        wav_bytes = await asyncio.to_thread(self._synthesize_wav, text)
        if wav_bytes:
            yield (wav_bytes, None)

    def _synthesize_wav(self, text: str) -> bytes:
        """Run Kokoro synchronously (it's not async-aware) and pack to WAV."""
        try:
            import numpy as np  # numpy is a torch dep, already present
        except Exception as e:
            logger.error(f"[Kokoro] numpy unavailable: {e}")
            return b""

        try:
            segments = self._pipeline(  # type: ignore[misc]
                text,
                voice=settings.kokoro_voice,
                speed=settings.kokoro_speed,
            )
            pcm_parts: list[Any] = []
            for seg in segments:
                # KPipeline yields a namedtuple/result with an `.audio`
                # tensor (torch) or numpy array. Be permissive.
                audio = getattr(seg, "audio", None)
                if audio is None and isinstance(seg, (tuple, list)):
                    audio = seg[-1]
                if audio is None:
                    continue
                if hasattr(audio, "detach"):
                    audio = audio.detach().cpu().numpy()
                pcm_parts.append(np.asarray(audio, dtype=np.float32).reshape(-1))
            if not pcm_parts:
                return b""
            pcm = np.concatenate(pcm_parts)
        except Exception as e:
            logger.error(f"[Kokoro] Synthesis failed: {e}")
            return b""

        # Convert float32 [-1, 1] PCM to 16-bit little-endian and wrap in WAV.
        clipped = np.clip(pcm, -1.0, 1.0)
        int16 = (clipped * 32767.0).astype("<i2").tobytes()
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(settings.kokoro_sample_rate)
            wav.writeframes(int16)
        return buf.getvalue()
