# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

An **experimental harness** for comparing domain-knowledge strategies for LLM
assistants: base model only, RAG, RAG + guardrails, LoRA/PEFT, and continued
pretraining. The research question and metrics live in
[`docs/experiment_plan.md`](docs/experiment_plan.md).

It was forked from the "Aria" airport-kiosk hackathon project, so the demo
domain is an **airport kiosk assistant** with a voice-first 3D UI. That UI and
the WebSocket loop are preserved; **everything else (LLM, TTS, RAG, face auth,
flights) is now optional and swappable** so the app boots with no API keys.
`docs/phase_*.md` and `docs/cleanup_notes.md` record how it got this way.

Monorepo with two workspaces:
- `frontend/` - React + TanStack Router/Query + Tailwind + Three.js (pnpm)
- `backend/` - FastAPI + LangGraph + WebSocket API, layered architecture (uv)

Default branch: `master`. Do not start dev servers yourself.

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

**TanStack Router** - File-based routing in `src/routes/`, auto-generated to
`routeTree.gen.ts`. `__root.tsx` wraps all routes with `<Outlet />`. Router
context carries the QueryClient (wired in `main.tsx`).

**TanStack Query** - Provider in `src/integrations/tanstack-query/root-provider.tsx`.

**Path Alias**: `@/` maps to `src/`.

### Voice Assistant Data Flow (`src/hooks/`)

The WebSocket loop is fully wired (no longer a TODO). The hooks compose top-down:
- `useVoiceAssistant.ts` - orchestrator; owns processing state, component
  messages, and wires the callbacks below
- `useVoiceWebSocket.ts` - WebSocket connection to backend `/ws`
- `useWebSocketMessages.ts` - parses server events (`audio`, `alignment`,
  `done`, `error`, `retry`, `text`, `component`), queues audio chunks
- `useAudioReveal.ts` - paces text reveal to audio playback; `setText` renders
  instantly for the text-only fallback (TTS disabled)
- `useSpeechRecognition.ts` - mic → text
- `useNavigationHandler.ts` - handles legacy `ui_action` events (modals/nav)

`component` events drive in-chat cards (flight details, weather, maps, etc.)
rendered from `componentMessages`.

### 3D Assistant Component (`src/components/Assistant3D/`)

**Performance Pattern**: Refs instead of React state for 60fps animations
without re-renders.

- `index.tsx` - Entry point, WebGL detection, WebSocket integration
- `AssistantInterface.tsx` - UI layer: mic toggle, prompt input, error toast
- `AssistantCanvas.tsx` - Three.js scene, mouse interaction
- `entities/ParticleSphereEntity.ts` - Particle system with audio-reactive deformation
- `hooks/useAudioAnalyzer.ts` - Web Audio API, FFT analysis (bass/mid/high bands)
- `hooks/useAssistantAnimation.ts` - Animation loop: dragging → momentum → auto-rotation
- `hooks/useThreeScene.ts` - Three.js scene init
- `entities/PostProcessing.ts` - Bloom via EffectComposer
- `constants/animationConstants.ts` - Tunable parameters

**Animation state machine**: Dragging (velocity tracking, 100ms window, 5-sample
avg) → Momentum (exponential damping 0.95) → Auto-rotation (idle, velocity
< 0.0001). **Audio-reactive**: FFT size 128 / 64 bins, 3 bands (bass 0-10,
mid 10-20, high 30-64), 20 Fibonacci-distributed spike centers, 0.30 smoothing.
**Perf**: refs not state, pixel ratio capped 2x, no shadows, delta-time aware.

## Backend (Python FastAPI + LangGraph)

### Commands

```bash
cd backend
uv run main.py                              # FastAPI on port 8000 (reload)
uv run python ../scripts/smoke_base_model.py  # Smoke-test the LLM provider, no FastAPI/WS
uv sync --extra local                       # Install local-inference deps (torch/transformers)
```

Python >=3.13, package manager `uv`. There is no `tests/` suite yet
(`backend/agent/test_map.py` is a standalone script). Config loads from `.env`
via `config.py` (see `.env.example`).

### Provider Selection — the central design idea

Three independent dimensions are env-driven so experiments and minimal-mode
startup are one config change away. **`stub`/`disabled`/`local` defaults mean
the app boots with zero external dependencies.**

| Dimension | Env var | Values (default) | Wiring point |
|-----------|---------|------------------|--------------|
| LLM provider | `llm_provider` | `stub` / `vultr` / `openai` / `local` (**stub**) | `agent/graph.py::_build_llm()` |
| Experiment mode | `experiment_mode` | `agent` / `base_only` (**agent**) | `agent/orchestrator.py::process()` |
| TTS provider | `tts_provider` | `kokoro` / `elevenlabs` / `disabled` (**auto**) | `tts/service.py::_select_provider()` |
| RAG backend | `rag_backend` | `local` / `mongo` (**local**) | `main.py::_init_rag()` |
| Kiosk demo | `enable_kiosk_demo` | bool (**false**) | `main.py::_init_kiosk_demo()` |

- **LLM**: `stub` echoes input (no key). `vultr`/`openai` use `ChatOpenAI`
  against their base URLs. `local` is `llm/local.py::LocalChatModel`, a HF
  causal LM (default `Qwen/Qwen2.5-0.5B-Instruct`) — **no native function
  calling**, so it ignores `bind_tools` and returns plain text. Any provider
  with a missing key falls back to `stub` rather than crashing.
- **Experiment mode**: `agent` runs the full LangGraph tool-using loop.
  `base_only` short-circuits to a single `llm.invoke()` with
  `BASE_ONLY_SYSTEM_PROMPT` — no tools, no RAG, no components. This is
  "System 1" in the experiment plan; pair with `local` for clean baselines.
- **TTS**: empty `tts_provider` auto-selects ElevenLabs if keys present, else
  disabled. `kokoro` is local (`uv pip install kokoro soundfile`). When TTS
  yields no audio, the backend emits a `text` event instead (see contract).
- **RAG**: `local` is `rag/local_rag.py` (in-memory keyword retrieval over
  `rag/documents/`). `mongo` is Atlas Vector Search; falls back to local on
  connection failure.

Check live config at `GET /health` — it reports every selected provider plus
`tts_enabled` and (for local) `local_model_id`.

### Architecture (Layered)

```
Transport (WebSocket) → Session Manager → Agent Orchestrator
                                            ↓
                        LLM (provider) | LangGraph + Tools | RAG Service | TTS (provider)
```

**Key directories**:
- `core/` - abstractions: `interfaces.py` (Protocols), `events.py` (stream
  event types), `exceptions.py` (`AgentException` + `to_natural_language()`),
  `schemas.py`
- `transport/` - `websocket_handler.py` (`/ws`, owns the TTS service and the
  audio-vs-text decision), `serializers.py`
- `session/` - `session_manager.py` (lifecycle, interruption),
  `session_store.py` (in-memory), `models.py`
- `agent/` - `graph.py` (LangGraph, **all tool definitions + `_build_llm`
  live here**), `orchestrator.py` (self-correcting loop + base_only branch),
  `state.py`, `strategies.py`
- `llm/` - `local.py` local HF provider (lazy-imports torch/transformers)
- `tools/` - `registry.py`, `executor.py` (timeout/error translation),
  `base.py` (`is_read_only`), `implementations/`. **Note**: the live agent's
  tools are the `@tool` functions defined inline in `agent/graph.py`, not this
  directory.
- `rag/` - `local_rag.py`, `database.py`, `embeddings.py`, `service.py` (Mongo),
  `ingestion.py`/`ingest_documents.py`, `documents/`
- `tts/` - `service.py` (facade), `base.py` (`BaseTTSService`/`DisabledTTSService`),
  `kokoro_service.py`, `elevenlabs_service.py`
- `weather/`, `auth/`, `flights/` - optional integrations (weather via
  `openweather_api_key`; auth/flights gated behind `enable_kiosk_demo`)
- `observability/logger.py`

### WebSocket Contract

**Client sends**: `{"message": "user text"}`

**Server sends**:
- `{"type": "audio", "chunk": "base64..."}`
- `{"type": "alignment", "characters": [...], "character_start_times_seconds": [...], ...}`
- `{"type": "component", "component_type": "...", "data": {...}}` - in-chat UI card
- `{"type": "text", "content": "..."}` - **only** when zero audio chunks were
  sent that turn (TTS disabled or empty); not streamed token-by-token
- `{"type": "done"}`
- `{"type": "error", "message": "..."}`
- `{"type": "retry", "attempt": N, "reason": "..."}` (optional)

Tools that return `{"component_type": ..., "data": ...}` (e.g. `show_weather`,
`show_flight_details`, `show_map`) become `component` events; the orchestrator
buffers them and flushes before the first text chunk.

### Error Handling

- `AgentException` base with `to_natural_language()`; tool errors auto-translate
  to user-friendly messages
- Resilient execution: timeout enforcement (30s default), schema validation
- App never crashes on a subsystem failure — every external service init in
  `main.py` is best-effort and logs a warning on failure

### Configuration (`config.py`, loaded from `.env`)

Provider selectors (see table above) plus:
- LLM: `vultr_api_key`/`vultr_model`, `openai_api_key`/`openai_base_url`/`openai_model`,
  `local_model_id`/`local_model_device`/`local_model_max_new_tokens`/`local_model_temperature`
- TTS: `elevenlabs_api_key`/`elevenlabs_voice_id`, `kokoro_voice`/`kokoro_lang_code`/`kokoro_speed`/`kokoro_sample_rate`
- RAG: `rag_top_k` (5), `embedding_model` (**`all-mpnet-base-v2`**, 768-dim —
  must match the Atlas index `numDimensions`), `rag_*` Mongo settings, `mongodb_*`
- Timeouts: `tool_execution_timeout_seconds` (30), `llm_call_timeout_seconds`
  (60), `agent_max_execution_time_seconds` (300)
- Retries: `agent_max_retries` (3), `tool_max_retries` (1)
- Kiosk demo: `enable_kiosk_demo`, `openweather_api_key`, `auth_*`, `flights_*`,
  `face_*`

### Optional dependency notes

`pyproject.toml` still lists heavy kiosk-demo deps (`deepface`, `tf-keras`,
`motor`, `pymongo`, `qrcode`, `pillow`) in the default deps; `docs/phase_02`
flags dropping them once experiments commit to not using kiosk features. Local
inference deps (`torch`/`transformers`/`accelerate`) are the opt-in `[local]`
extra — install with `uv sync --extra local`.

## Docs

- `docs/experiment_plan.md` - research question, compared systems, metrics
- `docs/phase_01_codebase_cleanup.md`, `docs/phase_02_local_model_inference.md` -
  phase-by-phase change logs (read before extending provider/experiment plumbing)
- `docs/cleanup_notes.md` - what was made optional and why
