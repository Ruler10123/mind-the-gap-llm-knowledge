"""ElevenLabs TTS streaming client."""

import asyncio
from collections.abc import AsyncIterator

from elevenlabs import ElevenLabs

from config import settings


def _sync_stream(
    text: str,
    queue: asyncio.Queue[bytes | None],
    loop: asyncio.AbstractEventLoop,
) -> None:
    """Run in thread: consume sync TTS stream, push chunks to queue."""
    client = ElevenLabs(api_key=settings.api_key_elevenlabs())
    stream = client.text_to_speech.stream(
        voice_id=settings.elevenlabs_voice_id,
        text=text,
        output_format="mp3_44100_128",
        model_id="eleven_multilingual_v2",
    )
    try:
        for chunk in stream:
            if isinstance(chunk, bytes):
                loop.call_soon_threadsafe(queue.put_nowait, chunk)
    finally:
        loop.call_soon_threadsafe(queue.put_nowait, None)


async def stream_tts(text: str) -> AsyncIterator[bytes]:
    """Async generator that yields raw MP3 bytes from ElevenLabs TTS."""
    if not text.strip():
        return
    queue: asyncio.Queue[bytes | None] = asyncio.Queue()
    loop = asyncio.get_event_loop()
    task = asyncio.create_task(
        loop.run_in_executor(None, _sync_stream, text, queue, loop)
    )
    try:
        while True:
            chunk = await asyncio.wait_for(queue.get(), timeout=120.0)
            if chunk is None:
                break
            yield chunk
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
