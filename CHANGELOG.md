# Changelog

Entries for substantial merged changes, newest first; small fixes are folded
into periodic consolidated entries rather than getting their own changelog
PR. Each entry records what changed,
why, how, when, and what it produced (run outputs, baselines, lockfiles), so
an experiment result can be traced back to the exact code and data behind it.

Timestamps are UTC, taken from git. "Merged" is the GitHub merge-commit time.
Detailed design notes stay in `docs/`; this file links to them, it doesn't
repeat them.

---

## 2026-10-20 — Merge verification of #2, #3, #4

All three PRs were merged together onto `master`. Before merging, the three
branches were merged into a scratch worktree on top of `origin/master`
(`21aa68b`) and checked as one tree, because #3 is stacked on #2 and none of
the three had CI.

| Check | Result |
|---|---|
| Merge conflicts (#2 → #3 → #4) | none; #4 touches only `frontend/`, the others don't touch it |
| `cd backend; uv sync` | installs |
| `python -c "import main"` (autopilot `baselineVerify`) | ok |
| `pytest -q` | 47 passed, 1 skipped (the opt-in `lmstudio` test) |
| `eval_rag.py --retrieval-only` | hit@1 0.579, hit@5 0.868, recall@5 0.803, MRR 0.691; same as the #3 baseline |
| `cd frontend; pnpm install --frozen-lockfile` (pnpm 12.14.0, Node 24.22.0) | exit 0 |
| `pnpm build` / `pnpm test` / `pnpm lint` | fail; these failures were already on master (see Known issues) |

PR #3 was retargeted from `rag-eval-framework` to `master` before merging, so
it didn't depend on the order in which the PRs merged.

**Environment note (Nyx).** On 2026-10-19 Windows Application Control started
blocking uv's per-venv launcher (`backend\.venv\Scripts\python.exe`). This
affects new and existing venvs alike, with Code Integrity events 3033/3077.
The signed base interpreter still runs, so the checks above ran as:

```powershell
$env:PYTHONPATH = "<worktree>\backend\.venv\Lib\site-packages"
& "$env:APPDATA\uv\python\cpython-3.13-windows-x86_64-none\python.exe" -m pytest -q
```

This is a machine policy, not a repo issue. The policy was not changed.

### Known issues (already on master before these merges, not introduced by them)

- `pnpm build` fails on TypeScript errors, e.g. `src/routes/kiosk.tsx(49,32)`:
  `currentPhase: "gate"` is not one of `"boarding" | "departed" | "checkin" | "arrived"`.
- `pnpm test` exits 1 because there are no `*.test.*` / `*.spec.*` files in
  `frontend/src`.
- `pnpm lint` reports 151 problems (148 errors, 3 warnings); 117 can be fixed with `--fix`.
- Running `pnpm build` regenerates `src/routeTree.gen.ts` with changes.

---

## PR #4 — Pin pnpm 12.14.0 and approve esbuild/unrs-resolver builds

| | |
|---|---|
| Merged | 2026-10-20 03:42:21 · merge `7e7d986` · branch `frontend/pnpm12-allow-builds` |
| Commits | `5ccc7a7` 2026-10-20 03:34:53 — pin pnpm, approve builds · `fdf41e0` 03:35:15 — record pinned pnpm in lockfile |
| Files | `frontend/package.json`, `frontend/pnpm-workspace.yaml` (new), `frontend/pnpm-lock.yaml` |
| PR | https://github.com/Ruler10123/mind-the-gap-llm-knowledge/pull/4 |

**What.** `"packageManager": "pnpm@12.14.0"` was added to `package.json`. A new
`pnpm-workspace.yaml` has an `allowBuilds` list with only `esbuild` (pulled in
by vite/tsx) and `unrs-resolver`. pnpm 12 also wrote its own pinned version
into the lockfile as an extra YAML document at the top, adding 158 lines and
removing none. No project dependency version changed.

**Why.** pnpm 12 refuses to run dependency install scripts unless they are
approved, so `pnpm install --frozen-lockfile` failed with
`ERR_PNPM_IGNORED_BUILDS`. That command is the autopilot `setup` step, so
autopilot runs failed before any task started.

**How.** Only the two packages that need install scripts are approved, rather
than all builds. pnpm is pinned so the approval format matches the pnpm
version that reads it. The lockfile addition is required: with a pinned
`packageManager`, `--frozen-lockfile` also checks pnpm's own entry.

**Verified.** In a fresh clone and again in the combined merge check: frozen
install exits 0, only the two approved install scripts run, and the tree is
clean afterwards.

---

## PR #3 — Stop indexing the documents README; attach headings to their sections

| | |
|---|---|
| Merged | 2026-10-20 03:42:18 · merge `1871f04` · branch `rag-chunking-fix` (stacked on #2, retargeted to `master`) |
| Commits | `446333b` 2026-10-19 18:41:46 — README exclusion + heading attachment · `968d308` 18:56:56 — drop `#` titles, fix svc-004 · `6219a2f` 19:10:10 — rerun docs and outputs |
| PR | https://github.com/Ruler10123/mind-the-gap-llm-knowledge/pull/3 |
| Details | `docs/rag_eval_baseline.md` → "Follow-up: chunking fix (2026-10-19)" |

**What.**
- New `backend/rag/corpus_files.py::is_knowledge_file()` skips any file whose
  stem is `readme`, in any letter case. It is used by `LocalRAGService._load`,
  by Mongo ingestion (`rag/ingestion.py::ingest_directory`), and by the eval
  corpus hash (`eval/corpus.py::corpus_sha256`).
- `rag/local_rag.py::_split_sections()`: a block made only of headings is no
  longer indexed on its own. It is prepended to the next block instead.
  Level-1 `#` document titles are dropped. Index size went from 48 chunks to 31,
  matching the 31 `###` sections in the FAQ.
- `eval/corpus.py::section_id()` now uses the most specific of a chunk's
  leading headings, so `## Group` + `### Section` still maps to `#section`.
- `eval/dev/rag_dev.jsonl`: the `svc-004` key fact `day pass` became
  `day pass|day passes`. The old fact wrongly failed the correct answer
  "day passes".
- `backend/tests/test_local_rag.py` (new) covers heading attachment, section
  ids, README exclusion, and the real corpus having no README or heading-only
  chunks.

**Why.** The PR #2 baseline found two problems:
- The 12 chunks of `rag/documents/README.md`, which is ingestion
  instructions rather than airport knowledge, were retrieved into 5 of the
  rag prompts.
- `##` group headings were indexed as chunks with no answer text. They took
  top-k slots from real sections.

**How, and the dead end.** The first version prepended *every* heading,
including the document's `# Airport Frequently Asked Questions` title. That
title then sat in the first section (carry-on baggage), which began to match
every query containing "airport". Retrieval metrics didn't change, because the
gold section's rank stayed the same. The full answer rerun showed the cost: the
extra chunk pushed out useful context, and `svc-005` ("How many restaurants
does the airport have?") flipped to a refusal. Dropping `#` titles fixed it:
the answer was correct in 3 of 3 repeats. Lesson recorded in the report: a
retrieval change needs an answer-level rerun, not just retrieval metrics.

**Results** (rag system only; `base_only` doesn't retrieve and was not rerun):

| Metric | #2 baseline | #3 | Note |
|---|---|---|---|
| Accuracy | 0.787 | 0.809 | +1 case (mh-001), within noise |
| Key-fact recall | 0.763 | 0.776 | |
| False refusals | 0.158 | 0.184 | fac-003 now refused; it was answered wrongly before |
| Refusal recall / hallucination proxy | 1.0 / 0 | 1.0 / 0 | |
| Prompts containing README text | 5 | 0 | the targeted fix |
| Retrieval recall@5 / MRR | 0.789 / 0.686 | 0.803 / 0.691 | |
| Retrieval hit@1 / hit@5 | 0.579 / 0.868 | unchanged | paraphrase misses remain (keyword scorer) |

**Artifacts.**
- `backend/eval/baselines/runs/chunking-fix-qwen3.8-27b/`, created
  2026-10-19 18:57:04, from `968d308` with a clean tree.
  - Dataset sha256 `e0cb3c53…`, corpus sha256 `e8222479…`. Both hashes
    changed: the corpus because the README is no longer hashed, the dataset
    because of the svc-004 edit.
  - Model `qwen/qwen3.8-27b` via LM Studio on `127.0.0.1:1234`, temperature 0.
  - Files: `cases.jsonl` (40 KB), `metrics.json` (44 KB), `report.md`, `run.json`.
- `backend/eval/baselines/retrieval_baseline.json` was re-recorded. The
  regression test now gates against the numbers above.

**Ops note.** The LM Studio daemon restarted overnight without its API server.
The server was restarted with `lms server start --port 1234 --bind 127.0.0.1`,
the same localhost-only binding as before.

---

## PR #2 — RAG evaluation framework, dev dataset, regression tests and baseline report

| | |
|---|---|
| Merged | 2026-10-20 03:42:12 · merge `71f542b` · branch `rag-eval-framework` |
| Commits | `1ef4f17` 2026-10-19 02:11:36 — framework, dataset, tests · `9c0328f` 02:46:14 — baseline report, docs, progress output |
| PR | https://github.com/Ruler10123/mind-the-gap-llm-knowledge/pull/2 |
| Details | `docs/rag_eval.md` (reproduce, metrics), `docs/eval_dataset.md` (format), `docs/rag_eval_baseline.md` (results) |

**What.**
- `backend/eval/` package:
  - dataset loader with per-line errors;
  - stable section ids (`airport_faq#carry-on-baggage`);
  - retrieval metrics: hit/recall/precision@k, MRR and nDCG@k at k = 1, 3, 5;
  - deterministic answer metrics: key-fact recall, token F1/EM, refusal
    precision/recall, hallucination and groundedness proxies, latency
    p50/p95;
  - `rag` and `base_only` answer pipelines, a runner, and a Markdown report
    renderer.
- `scripts/eval_rag.py` CLI that writes `results/<run_id>/{run.json,metrics.json,cases.jsonl,report.md}`.
- `eval/dev/rag_dev.jsonl`: 47 hand-written cases.
  - 38 answerable cases across all FAQ categories, tagged lexical, paraphrase
    or multi-hop.
  - 9 unanswerable cases (19%).
- `backend/tests/`: the repo's first pytest suite. It runs offline on the stub
  LLM and includes a retrieval regression gate against
  `backend/eval/baselines/retrieval_baseline.json` (tolerance 0.01, plus
  dataset and corpus hash checks). An opt-in `lmstudio` marker covers the
  live test.
- `pyproject.toml` gained a `dev` dependency group with pytest. `.gitignore`
  now ignores `results/`. `CLAUDE.md` documents the test and eval commands.

**Why.** `docs/experiment_plan.md` compares base-only, RAG, RAG + guardrails
and LoRA, but nothing measured RAG. Every later roadmap item (embedding
retrieval, guardrails, LoRA) needs a fixed dataset, fixed metrics and a
recorded baseline to compare against.

**How (key decisions).**
- Gold labels use heading-derived ids, not positional chunk ids, so editing
  the FAQ doesn't silently shift every label.
- All scoring is deterministic, with no LLM judge (that stays in roadmap
  P3.3). Results are reproducible and the tests can run offline.
- `run.json` records:
  - git sha and dirty flag;
  - sha256 of the dataset and corpus, with line endings normalised so Windows
    and Linux checkouts hash the same;
  - provider, model, and endpoint host (never the key);
  - temperature 0.
- Qwen3 `<think>` blocks are stripped before scoring.
- Retrieval behaviour was deliberately left unchanged in this PR. The
  weaknesses it found became findings, and the first of them was fixed in #3.
- The dataset is a **dev** set. `eval/heldout/**` is a protected path and was
  not touched.

**Baseline results** (`qwen/qwen3.8-27b`, LM Studio, local keyword retriever, top_k 5):

| Metric | rag | base_only |
|---|---|---|
| Accuracy | 0.787 | 0.468 |
| Key-fact recall | 0.763 | 0.539 |
| Refusal recall | 1.0 | 0.333 |
| False refusals | 0.158 | 0.026 |
| Hallucination proxy | 0 | 0.255 |
| Latency p50 / p95 | 15.1 s / 33.0 s | 24.3 s / 42.7 s |

Retrieval: hit@1 0.579, hit@5 0.868, recall@5 0.789, MRR 0.686. Paraphrase
hit@5 is only 0.667. Findings 1–7 and next steps are in
`docs/rag_eval_baseline.md`.

**Artifacts.**
- `backend/eval/baselines/runs/baseline-qwen3.8-27b/`, created
  2026-10-19 02:11:46, from `1ef4f17` with a clean tree.
  - Dataset sha256 `357a8303…`, corpus sha256 `c299aa97…`.
  - Systems: rag and base_only.
  - Files: `cases.jsonl` (80 KB), `metrics.json` (51 KB), `report.md`, `run.json`.
- `backend/eval/baselines/retrieval_baseline.json`: the first recorded
  retrieval baseline. It was superseded by #3.

**Reproduce.** See `docs/rag_eval.md`. In short:

```powershell
cd backend
uv sync
uv run pytest -q
$env:LLM_PROVIDER="openai"; $env:OPENAI_BASE_URL="http://127.0.0.1:1234/v1"
$env:OPENAI_API_KEY="lm-studio"; $env:OPENAI_MODEL="qwen/qwen3.8-27b"
uv run python ../scripts/eval_rag.py --dataset ../eval/dev/rag_dev.jsonl --systems rag,base_only --out ../results
```

---

## PR #1 — Agent-executable ROADMAP.md and autopilot.json

| | |
|---|---|
| Merged | 2026-10-15 21:03:55 · merge `21aa68b` · branch `autopilot-setup` |
| Commits | `6981162` 2026-10-15 20:39:10 |

**What and why.** Added `ROADMAP.md`, a task list written so an agent can
execute it, and `autopilot.json`, which holds the setup and baseline-verify
commands and the protected paths (`ROADMAP.md`, `autopilot.json`, `.claude/**`,
`.github/**`, `testing/**`, `eval/heldout/**`, `.env`). Together they let
autopilot agents pick up roadmap tasks without touching held-out evaluation
data or secrets.

---

## Before PRs (2026-05) — Fork cleanup and local alternatives

Direct commits from before the PR workflow: `5dcfc08` (2026-05-19, cleanup,
face embeddings removed, third-party APIs made optional), `cffd675`
(2026-05-19, Kokoro TTS replaces ElevenLabs as the local option) and `7607e6a`
(2026-05-26, local alternatives). These are documented in
`docs/phase_01_codebase_cleanup.md`, `docs/phase_02_local_model_inference.md`
and `docs/cleanup_notes.md`.
