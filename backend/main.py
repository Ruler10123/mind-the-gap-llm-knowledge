"""FastAPI app: CORS, /health, WebSocket /ws for AI assistant."""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from transport.websocket_handler import WebSocketHandler

app = FastAPI(title="AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev: file://, localhost:*, 127.0.0.1:*
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WebSocket handler
ws_handler = WebSocketHandler()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_assistant(websocket: WebSocket) -> None:
    await ws_handler.handle(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
