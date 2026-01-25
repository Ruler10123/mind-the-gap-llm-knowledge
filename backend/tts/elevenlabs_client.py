"""ElevenLabs TTS streaming client."""

import base64
from collections.abc import AsyncIterator
from typing import Any

from elevenlabs import AsyncElevenLabs

from config import settings


async def stream_tts(text: str) -> AsyncIterator[bytes]:
    """Async generator that yields raw MP3 bytes from ElevenLabs TTS."""
    if not text.strip():
        return
    client = AsyncElevenLabs(api_key=settings.api_key_elevenlabs())
    stream = client.text_to_speech.stream(
        voice_id=settings.elevenlabs_voice_id,
        text=text,
        output_format="mp3_44100_128",
        model_id="eleven_multilingual_v2",
    )
    async for chunk in stream:
        if isinstance(chunk, bytes):
            yield chunk


def _merge_alignment(
    acc: dict[str, list[Any]],
    part: dict[str, list[float]] | None,
) -> None:
    if not part:
        return
    for k in ("characters", "character_start_times_seconds", "character_end_times_seconds"):
        v = part.get(k)
        if isinstance(v, list):
            acc.setdefault(k, []).extend(v)


async def stream_tts_with_timestamps(
    text: str,
) -> AsyncIterator[tuple[bytes, dict[str, list[Any]] | None]]:
    """
    Stream TTS using ElevenLabs stream-with-timestamps API.
    Yields (audio_bytes, alignment_part | None) per chunk.
    Alignment parts can be merged (append characters and times) for full alignment.
    """
    if not text.strip():
        return
    client = AsyncElevenLabs(api_key=settings.api_key_elevenlabs())
    stream = client.text_to_speech.stream_with_timestamps(
        voice_id=settings.elevenlabs_voice_id,
        text=text,
        output_format="mp3_44100_128",
        model_id="eleven_multilingual_v2",
    )
    async for chunk in stream:
        b64 = getattr(chunk, "audio_base_64", None) or getattr(chunk, "audio_base64", None)
        if not b64:
            continue
        audio = base64.b64decode(b64)
        if not audio:
            continue
        align = getattr(chunk, "alignment", None)
        part: dict[str, list[Any]] | None = None
        if align is not None:
            part = {
                "characters": list(getattr(align, "characters", []) or []),
                "character_start_times_seconds": list(
                    getattr(align, "character_start_times_seconds", []) or []
                ),
                "character_end_times_seconds": list(
                    getattr(align, "character_end_times_seconds", []) or []
                ),
            }
            if not part["characters"]:
                part = None
        yield (audio, part)
