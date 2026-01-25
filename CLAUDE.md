# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two main workspaces:
- `frontend/` - React + TanStack Router/Query + Tailwind + Three.js
- `backend/` - FastAPI + LangGraph + WebSocket API with layered architecture

## Frontend (React + TanStack + Three.js)

### Commands

```bash
cd frontend
pnpm install
pnpm dev          # Dev server on port 3000
pnpm build        # Build and type check
pnpm test         # Vitest tests
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm check        # Format and fix
```

### Architecture

**TanStack Router** - File-based routing in `src/routes/`:
- Routes auto-generate from files
- Layout in `__root.tsx` wraps all routes with `<Outlet />`
- Router context includes QueryClient for data fetching integration

**TanStack Query** - Data fetching:
- Provider in `src/integrations/tanstack-query/root-provider.tsx`
- QueryClient passed to router context in `main.tsx`
- Use loaders in routes or `useQuery` in components

**Path Alias**: `@/` maps to `src/`

### 3D Assistant Component (`src/components/Assistant3D/`)

**Performance Pattern**: Refs instead of React state for 60fps animations without re-renders.

**Component Structure**:
- `index.tsx` - Entry point, WebGL detection, WebSocket integration (TODO: implement backend connection at line 33)
- `AssistantInterface.tsx` - UI layer: mic toggle (top-left), prompt input (bottom), error toast (top-center)
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

**Audio-Reactive**:
- FFT: 128 size, 64 frequency bins
- 3 bands: bass (0-10), mid/vocal (10-20), high (30-64)
- 20 spike centers (Fibonacci sphere distribution)
- Smoothing: 0.30 factor prevents jitter

**Performance**:
- Refs for animation state (not React state)
- Pixel ratio capped at 2x
- No shadows
- Delta-time aware
- requestAnimationFrame pattern

## Backend (Python FastAPI + LangGraph)

### Commands

```bash
cd backend
uv run main.py              # FastAPI server on port 8000 with reload
uv run python verify_refactor.py  # Verify refactoring
uv run pytest tests/        # Run tests
```

### Setup

- Python >=3.13
- Package manager: uv
- Dependencies: fastapi, uvicorn, websockets, langchain, langgraph, elevenlabs, motor, pymongo
- Configuration: Uses `config.py` (loads from `.env`)

### Architecture (Layered)

```
Transport (WebSocket) → Session Manager → Agent Orchestrator
                                            ↓
                        LLM Client | Tool Registry | RAG Service | TTS Service
```

**Key Directories**:

- `core/` - Abstractions, contracts
  - `interfaces.py` - Protocols: Agent, Tool, RAGService, SessionStore
  - `events.py` - Event types for streaming (ReasoningEvent, ToolCallEvent, AudioEvent, etc.)
  - `exceptions.py` - Exception hierarchy with natural language translation
  - `schemas.py` - Shared Pydantic models

- `transport/` - WebSocket layer
  - `websocket_handler.py` - `/ws` endpoint, maintains WebSocket contract
  - `serializers.py` - Event → JSON conversion

- `session/` - Session management
  - `session_manager.py` - Lifecycle, interruption handling
  - `session_store.py` - In-memory store (future: DB persistence)
  - `models.py` - Session, ConversationTurn schemas

- `agent/` - Orchestration
  - `orchestrator.py` - Self-correcting loop, retry logic, event emission
  - `graph.py` - LangGraph (existing, unchanged)
  - `state.py` - AgentState schema
  - `strategies.py` - RetryStrategy

- `tools/` - Tool layer
  - `registry.py` - Tool discovery, registration
  - `executor.py` - Resilient wrapper: timeout, error translation
  - `base.py` - BaseTool with `is_read_only` flag
  - `implementations/` - time_tool.py, arithmetic_tools.py, rag_tool.py (stub)

- `rag/` - RAG service (stub)
  - `service.py` - Retrieval orchestration (stub)

- `tts/` - TTS
  - `service.py` - TTS abstraction
  - `elevenlabs_client.py` - ElevenLabs implementation

- `observability/` - Structured logging
  - `logger.py`

### WebSocket Contract

**Client Sends**: `{"message": "user text"}`

**Server Sends**:
- `{"type": "audio", "chunk": "base64..."}`
- `{"type": "alignment", "characters": [...], "character_start_times_seconds": [...], ...}`
- `{"type": "done"}`
- `{"type": "error", "message": "..."}`
- `{"type": "retry", "attempt": N, "reason": "..."}` (optional)

### Error Handling

- `AgentException` base with `to_natural_language()` method
- Tool execution errors auto-translate to user-friendly messages
- Resilient tool execution: timeout enforcement (30s default), schema validation
- Never crashes app - all errors caught and translated

### Configuration (`config.py`)

Environment variables (`.env` file):
- `vultr_api_key`, `vultr_model` - LLM
- `elevenlabs_api_key`, `elevenlabs_voice_id` - TTS
- `mongodb_uri`, `mongodb_database`, `mongodb_collection` - RAG
- Timeouts: `tool_execution_timeout_seconds` (30), `llm_call_timeout_seconds` (60), `agent_max_execution_time_seconds` (300)
- Retries: `agent_max_retries` (3), `tool_max_retries` (1)
- RAG: `rag_top_k` (5), `embedding_model` (all-MiniLM-L6-v2)

### Key Design Decisions

1. **Session Management**: In-memory store, conversation history persists across turns
2. **Event Streaming**: All agent events stream to frontend for observability
3. **Self-Correction**: Orchestrator prepared for retry logic (partially implemented)
4. **Tool Resilience**: Timeout, validation, never crashes
5. **RAG**: Stubbed for MongoDB Atlas Vector Search integration

See `backend/REFACTORING_SUMMARY.md` for detailed refactoring notes.

## Development Notes

- Frontend uses pnpm
- Backend uses uv
- No main branch configured
- Do not start dev servers yourself
