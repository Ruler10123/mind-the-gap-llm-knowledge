import json
from collections import Counter

import pytest

from eval.corpus import chunk_index, corpus_sha256, is_heading_only, section_id
from eval.dataset import DatasetError, EvalCase, load_dataset


def _row(**overrides):
    row = {
        "id": "x-1",
        "question": "Where is lost and found?",
        "gold_answer": "Near baggage claim.",
        "source_ids": ["airport_faq#lost-and-found"],
        "answerable": True,
        "category": "facilities",
    }
    row.update(overrides)
    return row


def _write(tmp_path, rows):
    path = tmp_path / "set.jsonl"
    path.write_text("\n".join(r if isinstance(r, str) else json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    return path


# ------------------------------------------------------------------ loader

def test_valid_file_loads(tmp_path):
    path = _write(tmp_path, [_row(), "", _row(id="x-2", answerable=False, source_ids=[])])
    cases = load_dataset(path)
    assert [c.id for c in cases] == ["x-1", "x-2"]


def test_bad_rows_report_line_numbers(tmp_path):
    path = _write(tmp_path, [
        _row(),                                   # line 1 ok
        "{not json",                              # line 2
        _row(id="x-3", question=""),              # line 3
        _row(id="x-4", source_ids=[]),            # line 4 answerable w/o sources
        _row(),                                   # line 5 duplicate of x-1
        _row(id="x-6", extra_field=1),            # line 6 unknown field
    ])
    with pytest.raises(DatasetError) as exc:
        load_dataset(path)
    lines = [line for line, _ in exc.value.errors]
    assert lines == [2, 3, 4, 5, 6]
    assert "duplicate id 'x-1' (first on line 1)" in str(exc.value)


def test_unanswerable_rules():
    with pytest.raises(ValueError):
        EvalCase(**_row(answerable=False))
    with pytest.raises(ValueError):
        EvalCase(**_row(answerable=False, source_ids=[], key_facts=["x"]))


# ----------------------------------------------------- dev set integrity

@pytest.fixture(scope="module")
def dev_cases(dev_dataset_path):
    return load_dataset(dev_dataset_path)


def test_dev_set_sources_exist_in_corpus(dev_cases, rag):
    """Fails when a document edit renames or removes a section used as a gold label."""
    index = chunk_index(rag)
    missing = {(c.id, s) for c in dev_cases for s in c.source_ids if s not in index}
    assert not missing, f"gold source_ids not found in corpus: {sorted(missing)}"


def test_dev_set_gold_sections_have_content(dev_cases, rag):
    index = chunk_index(rag)
    empty = {s for c in dev_cases for s in c.source_ids if is_heading_only(index[s]["content"])}
    assert not empty


def test_dev_set_key_facts_present_in_gold_answer(dev_cases):
    from eval.answer_metrics import fact_present
    bad = [(c.id, f) for c in dev_cases for f in c.key_facts if not fact_present(c.gold_answer, f)]
    assert not bad, f"gold_answer misses its own key_facts: {bad}"


def test_dev_set_composition(dev_cases):
    assert 30 <= len(dev_cases) <= 80
    share = sum(not c.answerable for c in dev_cases) / len(dev_cases)
    assert 0.15 <= share <= 0.30
    answerable = [c for c in dev_cases if c.answerable]
    assert all(c.difficulty for c in answerable)
    assert all(c.key_facts for c in answerable)
    counts = Counter(c.difficulty for c in answerable)
    assert set(counts) == {"lexical", "paraphrase", "multi_hop"}
    assert all(len(c.source_ids) >= 2 for c in answerable if c.difficulty == "multi_hop")


# ------------------------------------------------------------ corpus ids

def test_section_ids_are_unique_and_stable(rag):
    ids = [section_id(ch["source"], ch["content"]) for ch in rag.chunks]
    named = [i for i in ids if i]
    assert len(named) == len(set(named))
    assert "airport_faq#carry-on-baggage" in named
    assert section_id("airport_faq.md", "### Check-In\nOnline check-in...") == "airport_faq#check-in"
    assert section_id("x.md", "no heading here") is None


def test_corpus_hash_ignores_line_endings(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    a.mkdir()
    b.mkdir()
    (a / "doc.md").write_bytes(b"# T\n\nbody\n")
    (b / "doc.md").write_bytes(b"# T\r\n\r\nbody\r\n")
    assert corpus_sha256(a) == corpus_sha256(b)
    (b / "doc.md").write_bytes(b"# T\n\nchanged\n")
    assert corpus_sha256(a) != corpus_sha256(b)
