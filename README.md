# mind-the-gap-llm-knowledge

Experimental harness, cloned from the Aria airport-kiosk hackathon
project, for comparing domain-knowledge strategies for LLM assistants:
base model, RAG, RAG + guardrails, LoRA/PEFT, and continued pretraining.

The voice-first 3D kiosk UI is preserved; everything outside the
WebSocket loop is now optional and swappable. See
[`docs/experiment_plan.md`](docs/experiment_plan.md) for the research
question and [`docs/cleanup_notes.md`](docs/cleanup_notes.md) for what
changed in this phase.

## Tech Stack

**Frontend**
- React with TanStack Router and Query
- Three.js for 3D visualization
- Tailwind CSS
- Web Audio API for audio analysis

**Backend**
- FastAPI with WebSocket support
- LangGraph for agent orchestration
- Pluggable LLM provider (stub / Vultr / OpenAI-compatible)
- Pluggable RAG backend (local in-memory / MongoDB Atlas)
- Optional ElevenLabs TTS

## Quick Start (minimal local mode, no API keys)

### Backend

```bash
cd backend
cp .env.example .env       # empty .env also works
uv run main.py             # http://localhost:8000
```

Boots with a stub LLM that echoes input, a local keyword RAG over
`backend/rag/documents/`, and TTS disabled. Useful for verifying the
WebSocket / 3D loop without provisioning anything.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev                   # http://localhost:3000
```

## Enabling a real LLM

In `backend/.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

or for Vultr:

```env
LLM_PROVIDER=vultr
VULTR_API_KEY=...
VULTR_MODEL=llama-3.1-70b-instruct-fp8
```

## Optional features

| Feature | How to enable |
|---|---|
| ElevenLabs TTS (cloud) | `TTS_PROVIDER=elevenlabs` + `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`. |
| Kokoro TTS (local, no API key) | `TTS_PROVIDER=kokoro` + `uv pip install kokoro soundfile`. |
| MongoDB Atlas RAG | `RAG_BACKEND=mongo` + Atlas vars (see `.env.example`). |
| Kiosk demo (face auth + flights REST) | `ENABLE_KIOSK_DEMO=true` + MongoDB. Requires DeepFace. |
| OpenWeatherMap | Set `OPENWEATHER_API_KEY` (tool falls back to mocks otherwise). |

## TTS providers

The `TTSService` facade in `backend/tts/service.py` dispatches to one of
three implementations based on `TTS_PROVIDER`:

- **`kokoro`** — local on-device TTS via the [`kokoro`](https://github.com/hexgrad/kokoro)
  package. Emits one WAV chunk per response. No character alignment
  (the WebSocket alignment event is simply omitted). Tunables:
  `KOKORO_VOICE`, `KOKORO_LANG_CODE`, `KOKORO_SPEED`, `KOKORO_SAMPLE_RATE`.
  Install:

  ```bash
  cd backend
  uv pip install kokoro soundfile
  # On first synthesis, kokoro downloads its model weights (~hundreds of MB).
  ```

  Note: `kokoro` is *not* in `pyproject.toml` to keep `uv sync` fast.
  If `TTS_PROVIDER=kokoro` but the package fails to import, the facade
  falls back to disabled and logs an install hint.

- **`elevenlabs`** — cloud TTS with character-level alignment.
  Requires `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`.

- **`disabled`** — no TTS. WebSocket loop completes with `done` only.

If `TTS_PROVIDER` is unset, the facade preserves the original
behaviour: ElevenLabs if both keys are present, otherwise disabled.

The WebSocket audio event format (`{"type":"audio","chunk":<base64>}`)
is unchanged across providers. Browsers sniff the audio header, so
both mp3 (ElevenLabs) and WAV (Kokoro) play through the existing
frontend `<audio>` element.

## Project Structure

```
frontend/          React + TanStack + Three.js
  src/
    components/Assistant3D/    3D particle sphere with audio reactivity
    routes/                    File-based routing
backend/           FastAPI + LangGraph
  core/            Abstractions, interfaces, events
  transport/       WebSocket handler
  session/         Session management
  agent/           LangGraph orchestration
  tools/           Tool registry and execution
  rag/             RAG service (stub)
  tts/             TTS service
```

## Frontend Architecture

### Commands

```bash
cd frontend
pnpm dev          # Dev server on port 3000
pnpm build        # Build and type check
pnpm test         # Vitest tests
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm check        # Format and fix
```

### Routing

**TanStack Router** - File-based routing in `src/routes/`:
- Routes auto-generate from files
- Layout in `__root.tsx` wraps all routes with `<Outlet />`
- Router context includes QueryClient for data fetching integration

**TanStack Query** - Data fetching:
- Provider in `src/integrations/tanstack-query/root-provider.tsx`
- QueryClient passed to router context in `main.tsx`
- Use loaders in routes or `useQuery` in components

**Path Alias**: `@/` maps to `src/`

### 3D Assistant Component

Located in `src/components/Assistant3D/`, built using refs instead of React state for 60fps animations without re-renders.

**Component Structure**:
- `index.tsx` - Entry point, WebGL detection, WebSocket integration
- `AssistantInterface.tsx` - UI layer: mic toggle, prompt input, error toast
- `AssistantCanvas.tsx` - Three.js scene, mouse interaction
- `entities/ParticleSphereEntity.ts` - Particle system with audio-reactive deformation
- `hooks/useAudioAnalyzer.ts` - Web Audio API with FFT analysis (bass, mid, high bands)
- `hooks/useAssistantAnimation.ts` - Animation loop: dragging → momentum → auto-rotation
- `hooks/useThreeScene.ts` - Three.js scene initialization
- `entities/PostProcessing.ts` - Bloom effects via EffectComposer
- `constants/animationConstants.ts` - Tunable parameters

**Animation State Machine**:
1. **Dragging**: Mouse rotation with velocity tracking (100ms window, 5-sample averaging)
2. **Momentum**: Post-drag inertia with exponential damping (0.95)
3. **Auto-rotation**: Idle rotation (velocity < 0.0001 threshold)

**Audio-Reactive Features**:
- FFT: 128 size, 64 frequency bins
- 3 bands: bass (0-10), mid/vocal (10-20), high (30-64)
- 20 spike centers (Fibonacci sphere distribution)
- Smoothing: 0.30 factor prevents jitter

**Performance Optimizations**:
- Refs for animation state (not React state)
- Pixel ratio capped at 2x
- No shadows
- Delta-time aware
- requestAnimationFrame pattern

## Backend Architecture

### Commands

```bash
cd backend
uv run main.py              # FastAPI server on port 8000 with reload
uv run python verify_refactor.py  # Verify refactoring
uv run pytest tests/        # Run tests
```

### Setup Requirements

- Python >=3.13
- Package manager: uv
- Dependencies: fastapi, uvicorn, websockets, langchain, langgraph, elevenlabs, motor, pymongo
- Configuration: Uses `config.py` (loads from `.env`)

### Layered Architecture

```
Transport (WebSocket) → Session Manager → Agent Orchestrator
                                            ↓
                        LLM Client | Tool Registry | RAG Service | TTS Service
```

**Key Directories**:

**`core/`** - Core abstractions and contracts
- `interfaces.py` - Protocols: Agent, Tool, RAGService, SessionStore
- `events.py` - Event types for streaming (ReasoningEvent, ToolCallEvent, AudioEvent, etc.)
- `exceptions.py` - Exception hierarchy with natural language translation
- `schemas.py` - Shared Pydantic models

**`transport/`** - WebSocket layer
- `websocket_handler.py` - `/ws` endpoint, maintains WebSocket contract
- `serializers.py` - Event → JSON conversion

**`session/`** - Session management
- `session_manager.py` - Lifecycle, interruption handling
- `session_store.py` - In-memory store (future: DB persistence)
- `models.py` - Session, ConversationTurn schemas

**`agent/`** - Orchestration
- `orchestrator.py` - Self-correcting loop, retry logic, event emission
- `graph.py` - LangGraph implementation
- `state.py` - AgentState schema
- `strategies.py` - RetryStrategy

**`tools/`** - Tool layer
- `registry.py` - Tool discovery, registration
- `executor.py` - Resilient wrapper: timeout, error translation
- `base.py` - BaseTool with `is_read_only` flag
- `implementations/` - time_tool.py, arithmetic_tools.py, rag_tool.py (stub)

**`rag/`** - RAG service (stub)
- `service.py` - Retrieval orchestration (stub)

**`tts/`** - Text-to-speech
- `service.py` - TTS abstraction
- `elevenlabs_client.py` - ElevenLabs implementation

**`observability/`** - Structured logging
- `logger.py`

### WebSocket API

**Client Sends**:
```json
{"message": "user text"}
```

**Server Streams**:
```json
{"type": "audio", "chunk": "base64..."}
{"type": "alignment", "characters": [...], "character_start_times_seconds": [...], ...}
{"type": "done"}
{"type": "error", "message": "..."}
{"type": "retry", "attempt": N, "reason": "..."}
```

### Error Handling

- `AgentException` base class with `to_natural_language()` method
- Tool execution errors auto-translate to user-friendly messages
- Resilient tool execution: timeout enforcement (30s default), schema validation
- Never crashes app - all errors caught and translated

### Configuration

Environment variables in `.env`:
- `vultr_api_key`, `vultr_model` - LLM client
- `elevenlabs_api_key`, `elevenlabs_voice_id` - Text-to-speech
- `mongodb_uri`, `mongodb_database`, `mongodb_collection` - RAG database
- `tool_execution_timeout_seconds` (30) - Tool timeout
- `llm_call_timeout_seconds` (60) - LLM timeout
- `agent_max_execution_time_seconds` (300) - Overall agent timeout
- `agent_max_retries` (3) - Agent retry limit
- `tool_max_retries` (1) - Tool retry limit
- `rag_top_k` (5) - RAG results count
- `embedding_model` (all-MiniLM-L6-v2) - Embedding model name

### Design Decisions

1. **Session Management**: In-memory store, conversation history persists across turns
2. **Event Streaming**: All agent events stream to frontend for observability
3. **Self-Correction**: Orchestrator supports retry logic for error recovery
4. **Tool Resilience**: Timeout enforcement, validation, error translation
5. **RAG**: Stubbed for MongoDB Atlas Vector Search integration
