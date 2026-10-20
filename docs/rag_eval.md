# RAG evaluation

Measures how well the RAG pipeline finds the right corpus section and
whether answers built on it are correct, grounded, and refuse when they
should. It is the measurement side of the systems in
[`experiment_plan.md`](experiment_plan.md). The committed baseline is in
[`rag_eval_baseline.md`](rag_eval_baseline.md). The dataset format is in
[`eval_dataset.md`](eval_dataset.md).

## What gets evaluated

| System | What it does | Code |
|---|---|---|
| retrieval | `LocalRAGService` (the default `RAG_BACKEND=local`) top-5 for each question | `eval/runner.py::evaluate_retrieval` |
| `rag` | top-`RAG_TOP_K` chunks put into the system prompt with their source ids, one LLM call, no tools. Told to answer only from the context or reply `I don't have that information.` | `eval/pipeline.py::rag_answer` |
| `base_only` | Same as `EXPERIMENT_MODE=base_only`: `BASE_ONLY_SYSTEM_PROMPT`, one call, no retrieval | `eval/pipeline.py::base_only_answer` |

Both systems use the app's own `_build_llm()`, so they get the same provider
config (`LLM_PROVIDER`, `OPENAI_*`, ...). The live `agent` mode (LangGraph
with the `search_knowledge_base` tool) is not evaluated yet, since the
eval harness would have to drive the tool loop. `<think>...</think>` blocks
from reasoning models are stripped before scoring; the raw text is kept in
`cases.jsonl` as `raw_answer`.

## Reproduce

All commands run from `backend/`. Install the test deps with `uv sync`
(pytest is in the `dev` group, which uv installs by default).

**Tests (offline, under 1 s, no LLM):**

```powershell
cd backend
uv run pytest -q
```

**Retrieval only (deterministic, no LLM):**

```powershell
uv run python ../scripts/eval_rag.py --retrieval-only
```

**Full baseline against LM Studio** (the committed report used these settings):

```powershell
lms ps                                        # a chat model must be loaded
Invoke-RestMethod http://127.0.0.1:1234/v1/models
$env:LLM_PROVIDER    = "openai"
$env:OPENAI_BASE_URL = "http://127.0.0.1:1234/v1"
$env:OPENAI_API_KEY  = "lm-studio"            # any non-empty value; LM Studio ignores it
$env:OPENAI_MODEL    = "qwen/qwen3.8-27b"
uv run python ../scripts/eval_rag.py --run-id baseline-qwen3.8-27b
```

Outputs go to `results/<run-id>/` (gitignored):

| File | Contents |
|---|---|
| `run.json` | git sha + dirty flag, dataset and corpus sha256, retriever, top_k, effective LLM provider/model/host (never the key), temperature |
| `metrics.json` | retrieval summary/breakdowns/per-case rankings; per-system answer summaries and per-category breakdowns |
| `cases.jsonl` | one scored row per (system, case): answer, retrieved ids and scores, every metric, latencies |
| `report.md` | the Markdown report |

If `_build_llm()` falls back to the stub (e.g. no `OPENAI_API_KEY`),
`run.json` says `"provider": "stub"` and the report starts with
**SIMULATED - not a result**.

**Live smoke test** (one question against the server, skipped by default):

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
uv run pytest -m lmstudio -q -rs
```

### Determinism

Retrieval is deterministic (keyword overlap, ties keep file order), and a
test asserts it. Generation uses `temperature=0`, but local inference is still
not bit-exact across runs, hardware or LM Studio versions, so expect answer
metrics to move a little between reruns. Compare runs with the same
`dataset_sha256`, `corpus_sha256` and model.

## Metrics

### Retrieval (answerable cases only; binary relevance against `source_ids`)

| Metric | Definition |
|---|---|
| Hit@k | 1 if any gold section is in the top k |
| Recall@k | share of the gold sections in the top k (matters for multi_hop) |
| Precision@k | gold sections in the top k / k |
| MRR | 1 / rank of the first gold section (0 if none) |
| nDCG@k | DCG with binary gains, normalized by the ideal ranking |
| Top-1 score | raw keyword-overlap score of the best chunk, for answerable vs unanswerable, i.e. the data a P5.1 refusal threshold would be set from |

### Answers (deterministic; no LLM judge, which is ROADMAP P3.3)

| Metric | Definition |
|---|---|
| Accuracy | answerable: every key fact present and not refused; unanswerable: refused. Mean over all cases. |
| Key-fact recall | share of `key_facts` present in the answer (answerable) |
| Token F1 / exact match | SQuAD-style overlap with `gold_answer`. Kept for comparability; low for verbose but correct answers. |
| Refusal recall | unanswerable cases that were refused |
| False refusal rate | answerable cases that were refused |
| Refusal precision | refused cases that were actually unanswerable |
| Hallucination proxy | answered (didn't refuse) an unanswerable case, **or** stated a number missing from the gold evidence, question and gold answer |
| Groundedness proxy | `rag` only: share of the answer's content words (stopwords removed) found in the retrieved context |
| Latency | p50/p95 of generation, retrieval and total, in ms |

Refusals are detected with the phrase patterns in
`eval/answer_metrics.py::REFUSAL_PATTERNS` ("I don't have...", "not mentioned
in...", "I can't find..."). They deliberately exclude redirects like "please
check with your airline", which also appear in correct answers.

### Limits of these proxies

- Key facts are string matches. A correct answer with an unexpected spelling
  ("twenty-four hours") is scored wrong, and an answer that contains the
  fact but also contradicts it is scored right.
- Groundedness is lexical reuse, not entailment.
- The hallucination proxy only catches unanswerable questions that get answered
  and invented numbers, not invented places, names or policies.
- The dev set is hand-written by the harness author and small (47 cases), so a
  1-case change moves answerable accuracy by about 2.6 points. Held-out results
  need P2.4.

The LLM judge (P3.3) is meant to add semantic scores in separate columns next
to these, not to replace them.

## Regression gate

`tests/test_rag_retrieval_regression.py` reruns retrieval over the dev set and
fails if any metric drops more than 0.01 below
`backend/eval/baselines/retrieval_baseline.json`, or if the dataset or corpus
changed without the baseline being re-recorded. After a deliberate change:

```powershell
uv run python ../scripts/eval_rag.py --update-baseline
```

and commit the new JSON with a note on why the numbers moved.
