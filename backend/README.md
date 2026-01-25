# AI Assistant API

FastAPI backend for an agentic AI assistant using LangGraph (Vultr Serverless Inference) and ElevenLabs TTS. Exposes a WebSocket endpoint that streams text and audio.

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
| `VULTR_API_KEY` | Yes | Vultr Serverless Inference API key |
| `VULTR_MODEL` | No | Vultr model name (defaults to `llama-3.1-70b-instruct-fp8`) |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Yes | ElevenLabs voice ID |

Copy `.env.example` to `.env`, fill in your keys, then run. Or export the variables before running.

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
  - `{"type": "audio", "chunk": "<base64>"}` — TTS MP3 chunks (stream-with-timestamps)
  - `{"type": "alignment", "characters": [...], "character_start_times_seconds": [...], "character_end_times_seconds": [...]}` — per-character timings for sync’d text reveal
  - `{"type": "done"}` — turn complete
  - `{"type": "error", "message": "..."}` — error

Multi-turn: keep the connection open and send multiple `message` payloads; the server keeps in-memory history per connection.
