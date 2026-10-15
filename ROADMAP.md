# Roadmap: mind-the-gap

## Goal

Answer the question in `docs/experiment_plan.md`: for a domain assistant (airport kiosk), when should
knowledge live outside the model (RAG), around it (guardrails), or inside it (LoRA/PEFT)? Done means
every compared system runs against the same base model and a human-validated held-out set, and a
report compares accuracy, groundedness, hallucination rate, refusal correctness and latency.

## Current state (verified 2026-10-15 on master `7607e6a`)

- Backend boots with an empty `.env`: `cd backend; uv run python -c "import main"` succeeds.
- No backend test suite. `pytest` is not installed (`backend/agent/test_map.py` is a standalone script).
- `cd frontend; npx tsc --noEmit -p .` reports 30 errors in legacy code: 15 in `src/components/Kiosk`,
  8 in `src/components/*.tsx`, 1 in `src/components/FlightManagement`, 6 in `src/routes`. 21 are
  unused-symbol errors (TS6133/TS6196). `pnpm build` fails because it runs `tsc` after `vite build`.
- `pnpm lint` fails: `eslint` is not a devDependency (only `@tanstack/eslint-config` is).
- Kiosk-only packages (`deepface`, `tf-keras`, `motor`, `pymongo`, `qrcode`, `pillow`) are default
  dependencies, but are only imported inside `auth/`, `flights/` and `rag/database.py` (Mongo RAG).
- LLM providers: `stub` (default), `openai` (any OpenAI-compatible `OPENAI_BASE_URL`), `vultr`,
  `local` (HF transformers, no tool calling). `EXPERIMENT_MODE=agent|base_only`.
- RAG: in-memory keyword retrieval over one document, `backend/rag/documents/airport_faq.md`.

## Architecture

```
frontend (React, 3D assistant) --ws--> FastAPI /ws -> orchestrator -> mode: agent | base_only | rag | rag_guarded
                                                              |-> LLM: stub | openai-compatible (LM Studio on EVO X2) | local HF
                                                              |-> RAG: local keyword -> local embeddings
scripts/eval_systems.py -> same orchestrator per mode -> results/<run>/*.csv -> scripts/report.py
```

Every external dependency has a fake: stub LLM and a fake OpenAI-compatible server for tests, fake
embedder, stub judge. Real models run through LM Studio (free, local, OpenAI-compatible) and are only
used in `integration` tests and `human` evaluation runs.

## Production-ready still requires

- LM Studio running on the EVO X2 with the chosen base model (P1.4).
- Hand-validated held-out set (P2.4).
- Real LoRA training run and GGUF export (P6.4).
- Full evaluation on real models, reviewed by a human (P7.2).
- Paid API keys are optional and only for the demo (P8.3).

Simulated tests passing means the plumbing works. It does not mean any result is valid.

## Verify command conventions

The runner installs dependencies first (`setup` in `autopilot.json`), then runs each verify from the repo root under PowerShell (later bash). Verify is an optional `cd <dir>; ` plus one command
(no pipes, no `&&`). `baselineVerify` runs on every task.

## P0 Verification baseline

- [ ] **P0.1** `auto` Pytest scaffold with app smoke test
  - done-when: `pytest` and `httpx` are a uv dev dependency group; `backend/tests/test_app.py` checks `GET /health` returns 200 and reports `llm_provider: stub` with no env vars set
  - verify: `cd backend; uv run pytest -q`
  - test-kind: simulated
- [ ] **P0.2** `auto` Tests for LLM provider selection and base_only mode
  - done-when: tests cover `_build_llm` for stub, openai without key (falls back to stub), local with failing import (falls back to stub), and `EXPERIMENT_MODE=base_only` returning one stub reply with no tool calls
  - verify: `cd backend; uv run pytest tests/test_llm_factory.py -q`
  - depends: P0.1
  - test-kind: simulated
- [ ] **P0.3** `auto` WebSocket contract test for the text-only path
  - done-when: a test sends `{"message": ...}` to `/ws` with stub LLM and TTS disabled and asserts a `text` event followed by `done`, with no `audio` events
  - verify: `cd backend; uv run pytest tests/test_ws_contract.py -q`
  - depends: P0.1
  - test-kind: simulated
- [ ] **P0.4** `auto` Move kiosk-only dependencies into optional extras
  - done-when: `deepface`, `tf-keras`, `qrcode`, `pillow` move to a `kiosk` extra and `motor`, `pymongo` to a `mongo` extra (kiosk includes mongo); an exact sync without extras imports `main` and passes all tests; README and `.env.example` explain how to install extras
  - verify: `cd backend; uv run --exact pytest -q`
  - depends: P0.1, P0.3
  - test-kind: simulated
- [ ] **P0.5** `auto` Script to count TypeScript errors by folder
  - done-when: `scripts/check_tsc.py` runs `npx tsc --noEmit -p frontend`, prints error counts per folder, and with a path argument exits 1 if any error is under that path (exit 0 otherwise); standard library only
  - verify: `python scripts/check_tsc.py --report-only`
  - test-kind: none
- [ ] **P0.6** `auto` Fix TypeScript errors in src/components/Kiosk
  - done-when: zero tsc errors under `frontend/src/components/Kiosk`; no behavior change; no `any`, `@ts-ignore` or `@ts-expect-error` added
  - verify: `python scripts/check_tsc.py frontend/src/components/Kiosk`
  - depends: P0.5
  - test-kind: none
- [ ] **P0.7** `auto` Fix remaining TypeScript errors in src/components
  - done-when: zero tsc errors under `frontend/src/components`; same constraints as P0.6
  - verify: `python scripts/check_tsc.py frontend/src/components`
  - depends: P0.6
  - test-kind: none
- [ ] **P0.8** `auto` Fix TypeScript errors in src/routes so the frontend builds
  - done-when: zero tsc errors in `frontend/`; `pnpm build` exits 0
  - verify: `cd frontend; pnpm build`
  - depends: P0.7
  - test-kind: none
- [ ] **P0.9** `human` Ratchet baselineVerify
  - done-when: `autopilot.json` `baselineVerify` contains `cd backend; uv run pytest -q` and `cd frontend; pnpm build`
  - depends: P0.4, P0.8

## P1 Local LLM endpoint (LM Studio)

- [ ] **P1.1** `auto` Fake OpenAI-compatible server for tests
  - done-when: a pytest fixture serves `/v1/chat/completions` locally; tests show `LLM_PROVIDER=openai` with `OPENAI_BASE_URL` pointed at the fake returns plain content, and in agent mode executes one tool call returned by the fake
  - verify: `cd backend; uv run pytest tests/test_openai_compatible.py -q`
  - depends: P0.2
  - test-kind: simulated
- [ ] **P1.2** `auto` LM Studio configuration profile
  - done-when: `.env.example` has an LM Studio block (`LLM_PROVIDER=openai`, `OPENAI_BASE_URL=http://<evo-x2-host>:1234/v1`, `OPENAI_API_KEY=lm-studio`, `OPENAI_MODEL=<model id>`); README explains it; `/health` reports the base URL host (never the key)
  - verify: `cd backend; uv run pytest tests/test_app.py -q`
  - depends: P1.1
  - test-kind: simulated
- [ ] **P1.3** `auto` Opt-in integration test against a live OpenAI-compatible server
  - done-when: tests marked `lmstudio` run only when `LMSTUDIO_BASE_URL` is set and reachable, otherwise they are skipped; when run, they ask one airport question in base_only mode and assert a non-empty answer and latency
  - verify: `cd backend; uv run pytest -m lmstudio -q -rs`
  - depends: P1.1
  - test-kind: integration
- [ ] **P1.4** `human` Run LM Studio on the EVO X2 and pick the base model
  - done-when: LM Studio serves on the LAN only; base model chosen with both HF weights and GGUF available (needed for LoRA later); model id and quantization recorded in `docs/decisions.md`; `-m lmstudio` tests pass with `LMSTUDIO_BASE_URL` set
  - depends: P1.3

## P2 Evaluation data

- [ ] **P2.1** `auto` Eval dataset schema and loader
  - done-when: `docs/eval_dataset.md` defines JSONL fields (`id`, `question`, `gold_answer`, `source_ids`, `answerable`, `category`); `backend/eval/dataset.py` loads and validates a file and reports line numbers for bad rows
  - verify: `cd backend; uv run pytest tests/test_eval_dataset.py -q`
  - depends: P0.1
  - test-kind: simulated
- [ ] **P2.2** `auto` Expand the synthetic knowledge corpus
  - done-when: 8 to 12 documents in `backend/rag/documents/` covering gates, baggage, security, delays, rebooking and accessibility; each has a stable `doc_id` header and is marked synthetic; a test checks headers and unique ids
  - verify: `cd backend; uv run pytest tests/test_corpus.py -q`
  - depends: P0.1
  - test-kind: simulated
- [ ] **P2.3** `auto` Draft dev-set generator
  - done-when: `scripts/generate_questions.py` drafts Q/A pairs per document through the configured LLM (deterministic template output with the stub), including unanswerable questions, writing `eval/dev/generated.jsonl`; output validates with the P2.1 loader
  - verify: `cd backend; uv run pytest tests/test_generate_questions.py -q`
  - depends: P2.1, P2.2
  - test-kind: simulated
- [ ] **P2.4** `human` Hand-validated held-out set
  - done-when: 30 to 50 Q/A pairs written or checked by hand in `eval/heldout/heldout.jsonl`, about 20% unanswerable; never generated by the tested models and never used for tuning or prompt iteration
  - depends: P2.1, P2.2

## P3 Evaluation harness

- [ ] **P3.1** `auto` Eval runner writes one CSV per system
  - done-when: `scripts/eval_systems.py --dataset <file> --modes base_only,...` runs each question through the orchestrator and writes `results/<run>/<mode>.csv` with id, answer, latency_ms, retrieved ids, provider and model; works end to end with the stub
  - verify: `cd backend; uv run pytest tests/test_eval_runner.py -q`
  - depends: P2.1, P0.2
  - test-kind: simulated
- [ ] **P3.2** `auto` Deterministic metrics
  - done-when: normalized exact match, token F1, refusal correctness (from `answerable`), and latency p50/p95 computed per mode into `results/<run>/metrics.csv`, with unit tests on hand-written cases
  - verify: `cd backend; uv run pytest tests/test_metrics.py -q`
  - depends: P3.1
  - test-kind: simulated
- [ ] **P3.3** `auto` Pluggable LLM judge for groundedness and hallucination
  - done-when: judge scores go in separate columns next to the deterministic metrics, never replacing them; judge provider and model are recorded; the stub judge is deterministic for tests
  - verify: `cd backend; uv run pytest tests/test_judge.py -q`
  - depends: P3.2
  - test-kind: simulated

## P4 System 2: RAG

- [ ] **P4.1** `auto` EXPERIMENT_MODE=rag
  - done-when: retrieves top-k from the local RAG service, injects context with citation ids, makes one LLM call, and exposes retrieved ids to the eval runner; no tools
  - verify: `cd backend; uv run pytest tests/test_rag_mode.py -q`
  - depends: P0.2
  - test-kind: simulated
- [ ] **P4.2** `auto` Embedding retrieval behind an interface
  - done-when: local RAG supports keyword or embedding retrieval via config; tests use a fake embedder and check hit@k on fixed queries; a real sentence-transformers test is marked `integration` and skipped by default
  - verify: `cd backend; uv run pytest tests/test_retrieval.py -q`
  - depends: P4.1, P2.2
  - test-kind: simulated

## P5 System 3: RAG + guardrails

- [ ] **P5.1** `auto` Refuse when retrieval confidence is low
  - done-when: EXPERIMENT_MODE=rag_guarded refuses with a fixed message when the best retrieval score is below a configurable threshold; tests cover both sides of the threshold
  - verify: `cd backend; uv run pytest tests/test_guardrails.py -q`
  - depends: P4.2
  - test-kind: simulated
- [ ] **P5.2** `auto` Citation check
  - done-when: answers in rag_guarded mode must cite retrieved doc ids; an uncited answer is retried once, then refused; tests use the fake server to return cited and uncited answers
  - verify: `cd backend; uv run pytest tests/test_citation_check.py -q`
  - depends: P5.1, P1.1
  - test-kind: simulated

## P6 System 4: LoRA/PEFT

- [ ] **P6.1** `human` Choose training hardware
  - done-when: decision recorded in `docs/decisions.md`: EVO X2 (ROCm support verified for the chosen model) or a rented GPU, with cost estimate
  - depends: P1.4
- [ ] **P6.2** `auto` SFT dataset builder
  - done-when: `scripts/build_sft_data.py` builds chat-format training data from the corpus and dev set only; a test proves no held-out question or id can leak into the output
  - verify: `cd backend; uv run pytest tests/test_sft_data.py -q`
  - depends: P2.3
  - test-kind: simulated
- [ ] **P6.3** `auto` LoRA training script with a smoke mode
  - done-when: `scripts/train_lora.py` (peft, in a `train` extra) trains from P6.2 data; `--smoke` trains a tiny model for 2 steps on CPU and saves an adapter; a test runs smoke mode
  - verify: `cd backend; uv run --extra train pytest tests/test_train_smoke.py -q`
  - depends: P6.2
  - test-kind: simulated
- [ ] **P6.4** `human` Real LoRA training run
  - done-when: adapter trained on the chosen base model, merged or converted to GGUF, loaded in LM Studio; model id recorded in `docs/decisions.md`
  - depends: P6.1, P6.3
- [ ] **P6.5** `auto` LoRA system in the eval harness
  - done-when: `--modes lora` uses a configurable model id on the same OpenAI-compatible endpoint, in base_only style; tested with the fake server
  - verify: `cd backend; uv run pytest tests/test_eval_runner.py -q`
  - depends: P3.1, P1.1
  - test-kind: simulated

## P7 Report

- [ ] **P7.1** `auto` Report generator
  - done-when: `scripts/report.py` turns a results folder into `report.md` with per-system tables; runs that used stub or fake providers are labeled "SIMULATED - not a result" at the top
  - verify: `cd backend; uv run pytest tests/test_report.py -q`
  - depends: P3.3
  - test-kind: simulated
- [ ] **P7.2** `human` Full evaluation and findings
  - done-when: all systems run on the held-out set with real models; report reviewed; findings written in `docs/findings.md`
  - depends: P2.4, P5.2, P6.4, P6.5, P7.1

## P8 Later and optional

- [ ] **P8.1** `auto` Stream text deltas over the WebSocket
  - done-when: `text` events carry `delta: true` chunks when TTS is off and the frontend appends them; contract test updated; frontend builds
  - verify: `cd backend; uv run pytest tests/test_ws_contract.py -q`
  - depends: P0.3, P0.8
  - test-kind: simulated
- [ ] **P8.2** `human` Decide whether continued pretraining is in scope
  - done-when: decision recorded in `docs/decisions.md`
- [ ] **P8.3** `human` Optional demo with paid APIs
  - done-when: if wanted, OpenAI/ElevenLabs/OpenWeather keys set locally (never committed) and the kiosk demo smoke-tested
