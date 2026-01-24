"""FastAPI app: CORS, /health, WebSocket /ws for AI assistant."""

import base64
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from agent.graph import get_agent
from tts.elevenlabs_client import stream_tts

app = FastAPI(title="AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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
                    await send({"type": "text", "content": text})
            except Exception as e:
                await send({"type": "error", "message": str(e)})
                continue

            full_text = "".join(full_text_parts)
            if full_text.strip():
                try:
                    async for audio_chunk in stream_tts(full_text):
                        b64 = base64.b64encode(audio_chunk).decode("ascii")
                        await send({"type": "audio", "chunk": b64})
                except Exception as e:
                    await send({"type": "error", "message": f"TTS failed: {e}"})

            messages.append(AIMessage(content=full_text))
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
