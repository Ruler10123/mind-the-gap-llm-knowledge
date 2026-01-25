# Streaming audio test

Minimal pnpm + TypeScript (Vite) frontend to test backend WebSocket + TTS streaming. Plays audio chunks as they arrive (no collect-then-play).

## Usage

1. Start backend:

   ```bash
   cd backend
   uv run main.py
   ```

2. Run frontend:

   ```bash
   cd frontend_test
   pnpm install
   pnpm dev
   ```

3. Open http://localhost:5173 → Connect → Send a message. Audio plays immediately as chunks stream.

## Stack

- pnpm, Vite, TypeScript
- Proxies `/ws` and `/health` to `http://localhost:8000`
