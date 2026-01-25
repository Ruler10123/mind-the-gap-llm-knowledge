# AI Assistant API

FastAPI backend for an agentic AI assistant using LangGraph (Gemini) and ElevenLabs TTS. Exposes a WebSocket endpoint that streams text and audio.

## Setup

- Python ≥3.13
- [uv](https://docs.astral.sh/uv/) for package management

```bash
cd backend
uv sync
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | Yes | Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey)) |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No | Voice ID (default: `JBFqnCBsd6RMkjVDRZzb`) |

Create a `.env` in `backend/` or export these before running.

## Run

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or:

```bash
uv run main.py
```

- **Health:** `GET http://localhost:8000/health` → `{"status":"ok"}`
- **WebSocket:** `ws://localhost:8000/ws`

### WebSocket protocol

- **Client → server:** `{"message": "user prompt"}`
- **Server → client:**
  - `{"type": "text", "content": "..."}` — streamed LLM tokens
  - `{"type": "audio", "chunk": "<base64>"}` — TTS MP3 chunks
  - `{"type": "done"}` — turn complete
  - `{"type": "error", "message": "..."}` — error

Multi-turn: keep the connection open and send multiple `message` payloads; the server keeps in-memory history per connection.
