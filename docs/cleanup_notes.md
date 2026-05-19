# Phase 01 Cleanup Notes

This pass turned the hackathon kiosk repo into a runnable experimental
harness without touching the voice-first WebSocket loop. Every external
service is now optional. The app can boot, accept a WebSocket
connection, run an agent turn, and respond — all with an empty `.env`.

## What was preserved

- 3D assistant frontend (`frontend/src/components/Assistant3D/**`).
- Mic + text input UX (`frontend/src/routes/index.tsx`,
  `frontend/src/hooks/useVoiceAssistant.ts` and friends).
- WebSocket contract on `/ws` — request shape `{message}` and event
  stream `audio` / `alignment` / `done` / `error` / `retry` /
  component events. `transport/websocket_handler.py` is unchanged.
- LangGraph orchestrator (`backend/agent/orchestrator.py`,
  `backend/agent/graph.py`) and all 13 existing tools, including
  `search_knowledge_base` and the `show_*` UI tools.
- ElevenLabs TTS streaming with character alignment — now optional
  (no-op when keys are absent).

## What was changed (no deletions)

| Area | Change |
|---|---|
| `backend/config.py` | Added `llm_provider` (default `stub`), `openai_*` fields, `enable_kiosk_demo` (default `False`), `rag_backend` (default `local`). |
| `backend/agent/graph.py` | Removed top-level `ChatOpenAI` import. New `_build_llm()` picks Vultr / OpenAI-compatible / stub based on `settings.llm_provider`. Stub LLM echoes the user message so the loop runs end-to-end with no API keys. |
| `backend/agent/orchestrator.py` | Agent now built lazily (property) so app boot never crashes on LLM init. |
| `backend/tts/service.py` | TTS is a no-op when `elevenlabs_api_key` or `elevenlabs_voice_id` is missing. WebSocket handler already handles empty audio cleanly. |
| `backend/rag/local_rag.py` | **New.** In-memory keyword-overlap retriever reading `rag/documents/*.md`. Default backend. |
| `backend/main.py` | Rewritten lifespan. Auth + flights init only when `enable_kiosk_demo=True`. RAG picks local backend unless `rag_backend=mongo`. Every subsystem is best-effort and logs a warning instead of crashing. `/health` now reports active provider/backend/feature flags. |
| `backend/.env.example` | Rewritten around minimal-mode defaults. |

## What is now optional

| Service | Required when |
|---|---|
| Vultr Inference | `LLM_PROVIDER=vultr` |
| Any OpenAI-compatible LLM | `LLM_PROVIDER=openai` |
| ElevenLabs TTS | `ELEVENLABS_API_KEY` *and* `ELEVENLABS_VOICE_ID` set |
| MongoDB Atlas Vector Search | `RAG_BACKEND=mongo` |
| OpenWeatherMap | omitted → weather tool returns mocks |
| MongoDB + DeepFace (face auth, flights REST) | `ENABLE_KIOSK_DEMO=true` |

Nothing in this list is required to boot the app or to exercise the
WebSocket loop.

## What was *not* removed (intentionally isolated)

These directories still exist on disk and still build; they are simply
not loaded unless `ENABLE_KIOSK_DEMO=true`:

- `backend/auth/` — DeepFace + MongoDB face recognition + QR codes.
- `backend/flights/` — MongoDB flight CRUD REST API.
- `backend/rag/database.py`, `rag/embeddings.py`, `rag/ingestion.py`,
  `rag/ingest_documents.py` — Atlas Vector Search RAG impl.
- `testing/`, `registration/`, `frontend_test/` — untouched.
- `pyproject.toml` deps (`deepface`, `tf-keras`, `qrcode`, `pillow`,
  `motor`, `pymongo`, `sentence-transformers`, `python-multipart`) —
  kept for now so the Atlas RAG and kiosk-demo paths still work when
  re-enabled. Drop in a later phase once we commit to the new harness.

## Running locally (minimal mode)

```bash
cd backend
cp .env.example .env       # an empty .env also works
uv run main.py             # http://localhost:8000
```

Expected boot log:

```
[startup] Kiosk demo features disabled (set enable_kiosk_demo=true to enable)
[RAG] Local backend initialized with N chunks
[Agent] Using stub LLM (set llm_provider=vultr|openai for a real model)
```

`GET /health` returns:

```json
{"status":"ok","llm_provider":"stub","rag_backend":"local","tts_enabled":"false","kiosk_demo":"false"}
```

Frontend (unchanged):

```bash
cd frontend
pnpm install
pnpm dev                   # http://localhost:3000
```

## Running with a real LLM

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

or

```env
LLM_PROVIDER=vultr
VULTR_API_KEY=...
VULTR_MODEL=llama-3.1-70b-instruct-fp8
```

## Known limitation (not fixed this pass)

When TTS is disabled, the frontend's `useAudioReveal` returns early
(`audioChunks.length === 0`) and the response text never appears on
screen — the agent still runs, the WebSocket loop still completes,
but the user sees only `done`. To keep the WebSocket contract
unchanged in this pass, no text-only fallback event was added.

Suggested follow-up: when `TTSService.enabled` is false, have the
WebSocket handler emit a synthetic `alignment` payload + a small
silent audio chunk, or extend the contract with a new `text` event.
Tracked as a TODO below.

## TODOs for the experiment pipeline

Tracking against `docs/experiment_plan.md`:

- [ ] Pick the base open model (kept constant across systems).
- [ ] Build the canonical airport knowledge corpus
      (`rag/documents/` is currently one seed file).
- [ ] Replace `LocalRAGService` keyword-overlap scoring with a real
      embedding-based retriever once the corpus is fixed.
- [ ] Define the eval harness: accuracy, groundedness, hallucination,
      refusal correctness, latency.
- [ ] System 1 (base only): wire a "no tools, no RAG" mode for
      comparison runs.
- [ ] System 2 (RAG): use current `search_knowledge_base` tool with the
      real retriever.
- [ ] System 3 (RAG + Guardrails): add input/output guardrails layer.
- [ ] System 4 (LoRA/PEFT): out of scope this phase.
- [ ] System 5 (continued pretraining): out of scope this phase.
- [ ] Add a text-only WebSocket event (or synthetic alignment) so the
      frontend renders the response when TTS is disabled.
- [ ] Decide whether `backend/auth/` and `backend/flights/` should be
      moved to `legacy/` and their heavy deps (`deepface`, `tf-keras`,
      `qrcode`, `pillow`, `motor`) removed from `pyproject.toml`.

## Verification done

- `python -c "import main"` succeeds with empty `.env`.
- `/health` reflects provider flags.
- Frontend `pnpm build` still passes (no frontend changes in this
  pass).

## Verification still recommended

- Manual WebSocket smoke test: open frontend, send a text message,
  confirm the stub LLM echo flows through `done`.
- Re-enable `LLM_PROVIDER=vultr` and confirm parity with previous
  behaviour.
- `ENABLE_KIOSK_DEMO=true` with MongoDB running — confirm auth +
  flights endpoints still respond.
