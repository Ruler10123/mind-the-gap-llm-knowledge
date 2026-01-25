"""WebSocket endpoint handler."""

import base64
import json
from fastapi import WebSocket, WebSocketDisconnect

from core.events import BaseEvent
from session.session_manager import SessionManager
from tts.service import TTSService
from tts.elevenlabs_client import _merge_alignment
from transport.serializers import event_to_json
from observability.logger import logger


class WebSocketHandler:
    """Handles WebSocket connections."""

    def __init__(self):
        self.session_manager = SessionManager()
        self.tts_service = TTSService()

    async def handle(self, websocket: WebSocket) -> None:
        """Handle WebSocket connection."""
        await websocket.accept()
        session_id = self.session_manager.generate_session_id()
        logger.info(f"WebSocket connected, session: {session_id}")

        async def send(msg: dict) -> None:
            await websocket.send_text(json.dumps(msg))

        try:
            while True:
                # Receive user message
                data = await websocket.receive_json()
                raw = data.get("message") if isinstance(data, dict) else None

                if not isinstance(raw, str) or not raw.strip():
                    await send({"type": "error", "message": "Missing or empty 'message' field."})
                    continue

                user_message = raw.strip()
                full_text = ""

                # Process message through session manager
                try:
                    async for item in self.session_manager.process_message(session_id, user_message):
                        # Handle events
                        if isinstance(item, BaseEvent):
                            await send(event_to_json(item))
                        # Handle response text
                        elif isinstance(item, str):
                            full_text = item
                except Exception as e:
                    await send({"type": "error", "message": str(e)})
                    continue

                # If no text, send done
                if not full_text.strip():
                    await send({"type": "done"})
                    continue

                # Stream TTS with alignment
                alignment_acc: dict[str, list] = {}
                try:
                    async for audio_chunk, alignment_part in self.tts_service.stream_with_timestamps(full_text):
                        b64 = base64.b64encode(audio_chunk).decode("ascii")
                        await send({"type": "audio", "chunk": b64})
                        _merge_alignment(alignment_acc, alignment_part)

                    if alignment_acc:
                        await send({
                            "type": "alignment",
                            "characters": alignment_acc.get("characters", []),
                            "character_start_times_seconds": alignment_acc.get("character_start_times_seconds", []),
                            "character_end_times_seconds": alignment_acc.get("character_end_times_seconds", []),
                        })
                except Exception as e:
                    await send({"type": "error", "message": f"TTS failed: {e}"})

                await send({"type": "done"})

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected, session: {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            try:
                await send({"type": "error", "message": str(e)})
            except Exception:
                pass
