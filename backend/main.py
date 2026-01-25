"""FastAPI app: CORS, /health, WebSocket /ws for AI assistant."""

import base64
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from agent.graph import get_agent
from tts.elevenlabs_client import stream_tts_with_timestamps
from tts.elevenlabs_client import _merge_alignment

app = FastAPI(title="AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev: file://, localhost:*, 127.0.0.1:*
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_assistant(websocket: WebSocket) -> None:
    await websocket.accept()
    messages: list[BaseMessage] = []

    async def send(msg: dict) -> None:
        await websocket.send_text(json.dumps(msg))

    try:
        while True:
            data = await websocket.receive_json()
            raw = data.get("message") if isinstance(data, dict) else None
            if not isinstance(raw, str) or not raw.strip():
                await send({"type": "error", "message": "Missing or empty 'message' field."})
                continue

            messages.append(HumanMessage(content=raw.strip()))
            full_text_parts: list[str] = []

            try:
                async for msg_chunk, metadata in get_agent().astream(
                    {"messages": messages, "llm_calls": 0},
                    stream_mode="messages",
                ):
                    if not getattr(msg_chunk, "content", None):
                        continue
                    text = msg_chunk.content if isinstance(msg_chunk.content, str) else ""
                    if not text:
                        continue
                    full_text_parts.append(text)
            except Exception as e:
                await send({"type": "error", "message": str(e)})
                continue

            full_text = "".join(full_text_parts)
            messages.append(AIMessage(content=full_text))

            if not full_text.strip():
                await send({"type": "done"})
                continue

            alignment_acc: dict[str, list] = {}
            try:
                async for audio_chunk, alignment_part in stream_tts_with_timestamps(full_text):
                    b64 = base64.b64encode(audio_chunk).decode("ascii")
                    await send({"type": "audio", "chunk": b64})
                    _merge_alignment(alignment_acc, alignment_part)
                if alignment_acc:
                    await send(
                        {
                            "type": "alignment",
                            "characters": alignment_acc.get("characters", []),
                            "character_start_times_seconds": alignment_acc.get(
                                "character_start_times_seconds", []
                            ),
                            "character_end_times_seconds": alignment_acc.get(
                                "character_end_times_seconds", []
                            ),
                        }
                    )
            except Exception as e:
                await send({"type": "error", "message": f"TTS failed: {e}"})

            await send({"type": "done"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await send({"type": "error", "message": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
