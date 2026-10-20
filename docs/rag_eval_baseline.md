# RAG evaluation baseline

First measurement of the existing RAG pipeline (local keyword retriever over
`backend/rag/documents/`) against the 47-case dev set, compared with the same
model without retrieval. How to reproduce it and what the metrics mean are in
[`rag_eval.md`](rag_eval.md). The raw outputs are committed under
`backend/eval/baselines/runs/baseline-qwen3.8-27b/`.

| | |
|---|---|
| Date | 2026-10-19 02:11 UTC |
| Commit | `1ef4f17` (clean tree) |
| Model | `qwen/qwen3.8-27b` via LM Studio at `127.0.0.1:1234`, temperature 0 |
| Dataset | `eval/dev/rag_dev.jsonl` (sha256 `357a8303…`), 38 answerable / 9 unanswerable |
| Corpus | `backend/rag/documents/` (sha256 `c299aa97…`), 48 chunks |
| Retriever | `LocalRAGService`, top 5 into the prompt |

> This is a **dev-set** result: the cases were written by the harness author
> and the dataset is small (one answerable case = 2.6 points). Treat it as a
> baseline for regressions and for choosing what to fix, not as a finding for
> the experiment. That needs the held-out set (ROADMAP P2.4).

## Headline

| System | Accuracy | Key-fact recall | Refusal recall | False refusals | Hallucination proxy | Total latency p50 |
|---|---|---|---|---|---|---|
| **rag** | **0.787** | 0.763 | **1.000** | 0.158 | **0.000** | 15.1 s |
| base_only | 0.468 | 0.539 | 0.333 | 0.026 | 0.255 | 24.3 s |

| Retrieval (answerable) | Hit@1 | Hit@5 | Recall@5 | MRR | nDCG@5 |
|---|---|---|---|---|---|
| all (38) | 0.579 | 0.868 | 0.789 | 0.686 | 0.690 |
| lexical (17) | 0.882 | 1.000 | 1.000 | 0.926 | - |
| paraphrase (15) | 0.400 | 0.667 | 0.633 | 0.489 | - |
| multi_hop (6) | 0.167 | 1.000 | 0.583 | 0.500 | - |

## Findings

1. **RAG is safe but retrieval-limited.** It refused all 9 unanswerable
   questions and stated no unsupported numbers. Of its 10 errors, 5 are
   retrieval misses (`bag-003`, `svc-002`, `svc-003`, `fac-003`, `fli-002`, all
   paraphrased questions), where it correctly said it didn't know or gave a vague
   answer. The other 5 are multi-section questions with the gold sections in the
   top 5 but not first: it answered half (`mh-001`, `mh-003`) or refused
   (`mh-002`, `mh-004`, `mh-005`). So retrieval quality, not the model, sets
   the ceiling, and the strict "answer only from context" prompt turns
   partial context into false refusals (0.158).

2. **The keyword retriever breaks on paraphrase.** Hit@5 is 1.0 on lexical
   questions and 0.667 on paraphrases. Scoring is set overlap of all tokens
   with no stopword removal or weighting, so "Where can I swap dollars for
   euros?" ranks chunks that share only "can" and "for", and 19 of 48 chunks
   overlap with that query. This is the main motivation for embedding
   retrieval (ROADMAP P4.2).

3. **The ingestion README is indexed as airport knowledge.**
   `backend/rag/documents/README.md` ("Run the ingestion script…", "500 chars
   with 50 char overlap") makes up 12 of the 48 chunks and appeared in the
   prompt context for 5 of 47 questions (`sec-002`, `sec-004`, `trn-001`, `mh-001`,
   `una-001`). It didn't cause a wrong answer here, but it is noise in every
   ranking and a risk of the kiosk quoting dev instructions. Fix: move the
   README out of `documents/` or have `LocalRAGService` skip it.

4. **Heading-only chunks are indexed.** Splitting on blank lines makes every
   `#`/`##` heading of 20+ characters its own chunk (10 of 48, e.g.
   `## Parking and Ground Transportation`). They carry no answer and take
   top-k slots (in the top 5 for 2 of 47 questions). Fix: attach headings to
   the following section when chunking.

5. **A retrieval-score threshold can't separate unanswerable questions yet.**
   Top-1 overlap scores: answerable p50 4 (range 1-7), unanswerable p50 3
   (range 1-5). With raw keyword overlap the two distributions mostly overlap,
   so the P5.1 confidence guardrail needs a better-calibrated score
   (embeddings or BM25) first.

6. **base_only mostly asks "which airport?" or answers from general knowledge.**
   7 of its 38 answerable cases are clarifying questions instead of
   answers, and it invented prices for the lounge day pass (`$35-$100`) and second
   bag fees (`$30-$75`). RAG supplies what it lacks; the accuracy gap
   (0.787 vs 0.468) is the measured value of retrieval on this corpus.

7. **RAG is faster.** Short grounded answers mean less generation: p50 15.1 s
   vs 24.3 s, p95 33.0 s vs 42.7 s. Retrieval itself is about 1.5 ms. All latency
   is generation on a 27B model. The model emitted no `<think>` blocks in this
   run.

## Scoring caveats seen in this run

- **Clarifying questions count as answering.** `una-005` ("which airport and
  which pharmacy?") and `una-008` ask instead of refusing, so they count
  toward base_only's hallucination proxy. If they counted as refusals,
  base_only refusal recall would be 0.556 instead of 0.333. The detector was
  not changed after seeing these results, to avoid tuning the metric on the
  dev set.
- **Key-fact misses on correct wording.** base_only `bag-004` ("No, you cannot
  bring a pocket knife…") is right but matches none of `sharp|prohibited|not
  allowed|not permitted`. The LLM judge (P3.3) should catch these.
- **Corpus-specific gold answers.** Where base_only gives real-world answers
  (`ast-004`: US DOT treats ESAs as pets), it is scored against the synthetic
  airport's policy. That's intended: the experiment measures domain
  knowledge, not general correctness.

## Recommended next steps (not in this PR)

1. Exclude `documents/README.md` from indexing and attach headings to their
   sections (findings 3-4). Rerun with `--update-baseline`; retrieval should
   only improve.
2. Embedding retrieval behind the same interface (P4.2), then compare
   paraphrase Hit@5 and the top-1 score separation (findings 2 and 5).
3. Loosen the RAG prompt to allow partial answers from partial context and
   measure the false-refusal rate (finding 1).
4. Add a clarification class to the refusal detector, validated on the
   held-out set rather than this one.

---

## Generated report

The report below is `report.md` from the run, copied unedited (headings
demoted one level).


### Run

| Field | Value |
|---|---|
| Created (UTC) | 2026-10-19T02:11:46+00:00 |
| Git commit | 1ef4f17b01ed88a717c6020035ff6275b860b4a4 |
| Dataset | `eval/dev/rag_dev.jsonl` |
| Dataset sha256 | `357a83033f2b1fc0` |
| Corpus sha256 | `c299aa9702c11857` |
| Retriever | local_keyword (answer context top_k=5) |
| Systems | rag, base_only |
| LLM | openai / qwen/qwen3.8-27b @ 127.0.0.1:1234 |
| Temperature | 0 |

### Retrieval

Answerable cases: 38. Relevance is binary against `source_ids`.

| Metric | @1 | @3 | @5 |
|---|---|---|---|
| Hit | 0.579 | 0.789 | 0.868 |
| Recall | 0.553 | 0.697 | 0.789 |
| Precision | 0.579 | 0.263 | 0.179 |
| nDCG | 0.579 | 0.650 | 0.690 |

MRR: 0.686

#### Retrieval by category

| Category | n | Hit@1 | Hit@5 | Recall@5 | MRR |
|---|---|---|---|---|---|
| assistance | 6 | 0.500 | 1.000 | 0.833 | 0.750 |
| baggage | 5 | 0.600 | 0.800 | 0.800 | 0.667 |
| facilities | 6 | 0.500 | 0.833 | 0.750 | 0.597 |
| flight_info | 6 | 0.333 | 0.833 | 0.750 | 0.472 |
| security | 5 | 1.000 | 1.000 | 0.900 | 1.000 |
| services | 5 | 0.600 | 0.600 | 0.600 | 0.600 |
| transport | 5 | 0.600 | 1.000 | 0.900 | 0.767 |

#### Retrieval by difficulty

| Difficulty | n | Hit@1 | Hit@5 | Recall@5 | MRR |
|---|---|---|---|---|---|
| lexical | 17 | 0.882 | 1.000 | 1.000 | 0.926 |
| multi_hop | 6 | 0.167 | 1.000 | 0.583 | 0.500 |
| paraphrase | 15 | 0.400 | 0.667 | 0.633 | 0.489 |

#### Top-1 retrieval score (keyword overlap)

Unanswerable questions scoring as high as answerable ones means a score threshold alone can't make the system refuse.

| Cases | n | min | p50 | mean | max |
|---|---|---|---|---|---|
| answerable | 38 | 1.000 | 4.000 | 3.684 | 7.000 |
| unanswerable | 9 | 1.000 | 3.000 | 3.111 | 5.000 |

#### Retrieval misses (no gold section in top 5)

| Case | Gold | Retrieved top 5 |
|---|---|---|
| bag-003 | airport_faq#lost-baggage | airport_faq#carry-on-baggage, airport_faq#gate-information, airport_faq#wheelchair-service, airport_faq#service-animals, airport_faq#rideshare |
| svc-002 | airport_faq#currency-exchange | airport_faq#precheck, airport_faq#lounges, airport_faq#checked-baggage, airport_faq#tsa-screening, airport_faq#international-travel |
| svc-003 | airport_faq#charging-stations | airport_faq#lost-baggage, airport_faq#parking, airport_faq#checked-baggage, airport_faq#tsa-screening, airport_faq#precheck |
| fac-003 | airport_faq#pet-relief-areas | airport_faq#service-animals, airport_faq#precheck, airport_faq#international-travel, airport_faq#help-desk, airport_faq#parking |
| fli-002 | airport_faq#check-in | airport_faq#service-animals, airport_faq#rideshare, airport_faq#carry-on-baggage, airport_faq#gate-information, airport_faq#wheelchair-service |

### Answer quality

| System | n | Accuracy | Key-fact recall | Token F1 | Refusal recall | False refusals | Hallucination proxy | Groundedness proxy |
|---|---|---|---|---|---|---|---|---|
| rag | 47 | 0.787 | 0.763 | 0.607 | 1.000 | 0.158 | 0.000 | 0.873 |
| base_only | 47 | 0.468 | 0.539 | 0.263 | 0.333 | 0.026 | 0.255 | - |

#### Latency (ms)

| System | Gen p50 | Gen p95 | Retrieval p50 | Retrieval p95 | Total p50 | Total p95 |
|---|---|---|---|---|---|---|
| rag | 15109.081 | 32985.437 | 1.542 | 2.238 | 15111.381 | 32986.500 |
| base_only | 24292.175 | 42693.829 | - | - | 24292.175 | 42693.829 |

#### Accuracy by category

| Category | rag | base_only |
|---|---|---|
| assistance | 0.667 | 0.667 |
| baggage | 0.857 | 0.429 |
| facilities | 0.750 | 0.250 |
| flight_info | 0.714 | 0.857 |
| out_of_scope | 1.000 | 1.000 |
| security | 1.000 | 0.800 |
| services | 0.750 | 0.250 |
| transport | 0.800 | 0.000 |

#### Worst cases: rag (10 incorrect)

| Case | Question | Answer | Why |
|---|---|---|---|
| bag-003 | My suitcase never showed up on the carousel. What should I do? | I don't have that information. | refused an answerable question |
| fac-003 | Where can my dog go to the bathroom after security? | Pet relief areas are available after security. | key facts 0.00 |
| fli-002 | How long before takeoff do they start letting people on the plane? | I don't have that information. | refused an answerable question |
| mh-002 | Where can I find someone who speaks Spanish to give me directions? | I don't have that information. | refused an answerable question |
| mh-004 | I need to return my rental car and then take the train. Where do I drop the car… | I don't have that information. | refused an answerable question |

#### Worst cases: base_only (25 incorrect)

| Case | Question | Answer | Why |
|---|---|---|---|
| una-002 | How much does a lounge day pass cost? | Lounge day pass prices vary by airport and specific lounge, but they typically range from $35 to $100. Please tell me which airport and lou… | answered an unanswerable question |
| una-003 | Is there a smoking area in the terminal? | It depends on your specific airport. Most airports have designated smoking areas, usually located outdoors or in specific enclosed rooms. P… | answered an unanswerable question |
| una-005 | What time does the pharmacy close? | I would be happy to help, but I need to know which airport and which pharmacy you are asking about. | answered an unanswerable question |
| una-006 | Can I bring a drone in my carry-on? | Yes. You can bring a drone in your carry-on. Keep any removable or spare lithium batteries in your carry-on, and make sure the drone is tur… | answered an unanswerable question |
| una-007 | How much does it cost to check a second bag in economy? | The cost to check a second bag in economy varies depending on the airline and your destination. For domestic flights in the US, it typicall… | answered an unanswerable question |
