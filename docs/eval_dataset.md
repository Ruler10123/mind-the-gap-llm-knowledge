# Eval dataset format

Eval sets are JSONL: one JSON object per line, blank lines ignored. They are
loaded and validated by `backend/eval/dataset.py::load_dataset`, which reports
**every** bad row with its line number before failing.

| File | Purpose |
|---|---|
| `eval/dev/rag_dev.jsonl` | Hand-written **dev** set (47 cases). Fine to inspect and iterate prompts against. |
| `eval/heldout/` | Reserved for the hand-validated held-out set (ROADMAP P2.4). Never tune on it. Protected path. |

## Fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Unique within the file. Convention: `<category prefix>-<nnn>`, `mh-` for multi-section, `una-` for unanswerable. |
| `question` | string | yes | What the user asks the kiosk. |
| `gold_answer` | string | yes | Reference answer. For unanswerable cases: `I don't have that information.` |
| `source_ids` | string[] | yes if answerable | Corpus sections that contain the answer (see below). Must be empty when `answerable` is false. |
| `answerable` | bool | yes | Whether the corpus contains the answer. |
| `category` | string | yes | Topic, matching the corpus `##` sections: `baggage`, `security`, `services`, `facilities`, `flight_info`, `assistance`, `transport`, or `out_of_scope`. |
| `key_facts` | string[] | no (expected for answerable) | Short strings a correct answer must contain. `a\|b` means either alternative counts. Must be empty when unanswerable. |
| `difficulty` | `lexical` / `paraphrase` / `multi_hop` | no (expected for answerable) | `lexical`: shares key words with the source. `paraphrase`: same meaning, little word overlap. `multi_hop`: needs two or more sections. |

Example:

```json
{"id": "trn-003", "question": "What is the average taxi fare to downtown?", "gold_answer": "The average fare to downtown is $45 to $60.", "source_ids": ["airport_faq#taxis"], "answerable": true, "category": "transport", "key_facts": ["45", "60"], "difficulty": "lexical"}
```

## Source ids

`LocalRAGService` names chunks by position (`airport_faq-7`), so editing a
document renumbers everything after the edit. Gold labels use a stable id
instead:

```
<file stem>#<slug of the chunk's first heading>
airport_faq.md, "### Carry-On Baggage"  ->  airport_faq#carry-on-baggage
```

`backend/eval/corpus.py::citation_source_id` maps retrieved citations to this
form. The test `test_dev_set_sources_exist_in_corpus` fails if a document edit
renames or removes a section a case depends on.

## Key facts

Matching is on normalized text (lowercase, punctuation becomes a space,
articles dropped) at token boundaries, so `"5"` does not match inside `"50"`
and `"Airport_Free_WiFi"` matches `"airport free wifi"`. Keep facts short and
list the spellings a correct answer might use: `"3 hours|three hours"`. A
test checks that every `gold_answer` contains its own key facts.

## Adding cases

1. Append rows to `eval/dev/rag_dev.jsonl`. Write the question first, then
   find the answer in `backend/rag/documents/`. For unanswerable cases, check
   the corpus really doesn't answer them, not even partly.
2. Keep the mix: about 20% unanswerable (a test requires 15-30%), and
   answerable cases spread across lexical, paraphrase and multi_hop.
3. `cd backend; uv run pytest tests/test_eval_dataset.py -q`
4. Changing the dataset changes its hash, so the retrieval regression test
   asks you to record a new baseline:
   `uv run python ../scripts/eval_rag.py --update-baseline`. Commit it with the
   dataset change and say in the PR why the numbers moved.
