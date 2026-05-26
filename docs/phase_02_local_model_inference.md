# Phase 02: Local Model Inference + Base-Only Baseline

## Goal

Make on-device LLM inference a first-class option, and add a baseline
`base_only` mode so future runs can compare base-model-only vs. RAG vs.
guardrails vs. LoRA. Also closes the Phase 01 known limitation where
the frontend showed nothing when TTS was disabled.

## What changed

### Text-only WebSocket fallback

- New event: `{"type":"text","content": "<final response>"}`.
- Emitted by `transport/websocket_handler.py` **only** when zero audio
  chunks were sent for that turn (TTS disabled or yielded nothing).
- Existing `audio` / `alignment` / `done` / `error` / `retry` /
  `component` events are unchanged. Both ElevenLabs and Kokoro paths
  are unaffected — they still send audio, so `text` is never emitted
  when TTS is active.
- Frontend updates: `useWebSocketMessages` parses the new event,
  `useAudioReveal` exposes a `setText` setter, `useVoiceAssistant`
  wires `onText` into the existing `revealedText` state. The 3D
  assistant and reveal animation are untouched — text just appears
  instantly when there's no audio to pace it.

### Local LLM provider

- New value: `LLM_PROVIDER=local`.
- Implementation in `backend/llm/local.py` (`LocalChatModel`). Lazy-
  imports `transformers` + `torch`, builds an `AutoModelForCausalLM`,
  exposes the minimal `bind_tools` + `invoke(messages) -> AIMessage`
  interface LangGraph expects.
- New config: `LOCAL_MODEL_ID`, `LOCAL_MODEL_DEVICE`,
  `LOCAL_MODEL_MAX_NEW_TOKENS`, `LOCAL_MODEL_TEMPERATURE`.
- Default model: `Qwen/Qwen2.5-0.5B-Instruct` (~1 GB download, runs on
  CPU). Override freely.
- Tool calling: the local provider has no native function-calling. In
  `agent` mode it will reply with plain text and the LangGraph loop
  ends after one LLM call — no UI tools fire. For tool-using flows
  use `LLM_PROVIDER=vultr|openai`. The first ignored `bind_tools` call
  logs a one-time warning.

### Base-only experiment mode

- New config: `EXPERIMENT_MODE=agent|base_only` (default `agent`).
- When `base_only`, `AgentOrchestrator.process()` short-circuits
  LangGraph: one `llm.invoke([SystemMessage, *history, HumanMessage])`
  call, yields the text. No tools, no RAG, no retries, no
  `ComponentEvent`s. Uses a stripped-down `BASE_ONLY_SYSTEM_PROMPT`.
- This is **System 1** from `docs/experiment_plan.md`.

### Optional install group

- `backend/pyproject.toml` gets a `[project.optional-dependencies]`
  `local` group containing `torch`, `transformers`, `accelerate`. It
  is **not** in the default deps — local inference is opt-in.

## How to run

### Stub (no deps, default)

```bash
cd backend
uv run main.py
# /health → "llm_provider":"stub", "experiment_mode":"agent"
```

### Local model

Install once:

```bash
cd backend
uv sync --extra local
# or, if you don't want to touch pyproject lock:
# uv pip install transformers accelerate
```

Then:

```bash
cd backend
LLM_PROVIDER=local uv run main.py
# or pick a different model:
LLM_PROVIDER=local LOCAL_MODEL_ID=meta-llama/Llama-3.2-1B-Instruct uv run main.py
```

First request downloads the model weights to the HF cache
(`~/.cache/huggingface/`). Subsequent requests are warm.

### base_only mode

Works with any LLM provider:

```bash
cd backend
LLM_PROVIDER=local EXPERIMENT_MODE=base_only uv run main.py
```

`/health` will report `"experiment_mode":"base_only"`. The WebSocket
loop now skips tool calls and the agent graph entirely.

### Smoke test (no FastAPI, no frontend)

```bash
cd backend
uv run python ../scripts/smoke_base_model.py
# Or with a real provider:
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... uv run python ../scripts/smoke_base_model.py
LLM_PROVIDER=local uv run python ../scripts/smoke_base_model.py
```

Prints provider info, build time, then 3 fixed airport-assistant Q/A
pairs with per-call latency.

## Known limitations

- **Text event is one-shot, not streamed token-by-token.** The
  orchestrator currently yields the final concatenated string; the
  WebSocket handler emits the `text` event after the agent completes.
  For long replies this means the user waits, then sees the whole
  message at once. Token streaming is a follow-up.
- **Local provider has no tool calling.** `agent` mode + local
  provider works but won't invoke UI tools (`show_*`,
  `search_knowledge_base`, etc.). Use `base_only` mode for clean
  baselines, or pair the local model with `EXPERIMENT_MODE=base_only`
  for repeatable comparisons.
- **First local request is slow.** Model download + load can take
  minutes for first run; subsequent calls reuse the in-memory model.
- **`audio/mpeg` blob MIME** when Kokoro emits WAV still relies on
  browser sniffing (carry-over from Phase 01.5). Untouched here.

## Build status

`pnpm build` (frontend) currently fails, but **not** because of Phase 02. The
Vite bundle builds fine; the failure is the `tsc` type-check step, and every
error is in **pre-existing legacy code** — kiosk/flight components and routes
(e.g. `Kiosk/InlineChat.tsx`, `Kiosk/OverbookingModal.tsx`, `kiosk.tsx`,
`LoginModal.tsx`, plus many TS6133 unused-import warnings). The three files
Phase 02 touched (`useAudioReveal.ts`, `useVoiceAssistant.ts`,
`useWebSocketMessages.ts`) are additive and type-clean — none appear in the
error list. Fixing the legacy type errors is out of scope for this phase.

## Next-phase recommendations

1. **Token streaming for the `text` event** — emit incremental
   `{"type":"text","content":"<delta>", "delta": true}` chunks and have
   the frontend append, so base_only feels comparable to TTS reveal.
2. **System 2 (RAG mode)** — add `EXPERIMENT_MODE=rag` that calls
   `LocalRAGService.retrieve()`, injects citations into the prompt,
   then does a single LLM call. Reuses the base_only short-circuit.
3. **Eval harness** — a `scripts/eval_systems.py` that runs a fixed
   question set against each mode and writes accuracy / groundedness /
   latency to CSV. Build on `smoke_base_model.py`.
4. **Replace `LocalRAGService` keyword overlap with embeddings.**
   `sentence-transformers` is already in the default deps. Avoids the
   MongoDB Atlas dependency for local experiments.
5. **Drop legacy deps from `pyproject.toml`** (`deepface`, `tf-keras`,
   `motor`, `pymongo`, `qrcode`, `pillow`) once we commit to not
   using the kiosk-demo features in experiments.
