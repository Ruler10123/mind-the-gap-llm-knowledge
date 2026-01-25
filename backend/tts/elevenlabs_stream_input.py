"""ElevenLabs TTS via stream-input WebSocket for low-latency LLM→TTS pipelining."""

import asyncio
import base64
import json
from collections.abc import AsyncIterator
from typing import Callable, Awaitable

import websockets

from config import settings

STREAM_INPUT_URL = "wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input"


async def run_stream_input(
    sentence_iter: AsyncIterator[str],
    *,
    send_audio_chunk: Callable[[bytes], Awaitable[None]],
) -> None:
    """
    Connect to ElevenLabs stream-input WS, feed sentences with try_trigger_generation,
    and forward audio chunks via send_audio_chunk.
    """
    url = STREAM_INPUT_URL.format(voice_id=settings.elevenlabs_voice_id)
    api_key = settings.api_key_elevenlabs()

    init = {
        "text": " ",
        "voice_settings": {"speed": 1, "stability": 0.5, "similarity_boost": 0.75},
        "xi_api_key": api_key,
        "model_id": "eleven_multilingual_v2",
    }

    async with websockets.connect(
        url,
        additional_headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        close_timeout=2,
    ) as ws:
        await ws.send(json.dumps(init))

        async def producer() -> None:
            async for s in sentence_iter:
                if not s.strip():
                    continue
                payload = {"text": s, "try_trigger_generation": True}
                await ws.send(json.dumps(payload))
            await ws.send(json.dumps({"text": ""}))

        async def consumer() -> None:
            async for raw in ws:
                try:
                    s = raw.decode() if isinstance(raw, bytes) else raw
                    msg = json.loads(s)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    continue
                b64 = msg.get("audio")
                if not b64:
                    continue
                chunk = base64.b64decode(b64)
                if chunk:
                    await send_audio_chunk(chunk)

        await asyncio.gather(producer(), consumer())
