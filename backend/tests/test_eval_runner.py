import json

import pytest

from eval.pipeline import RAG_REFUSAL, base_only_answer, rag_answer, strip_reasoning
from eval.report import SIMULATED_BANNER
from eval.runner import run_eval

SMALL = [
    {"id": "a-1", "question": "How long does lost and found keep items?", "gold_answer": "90 days.",
     "source_ids": ["airport_faq#lost-and-found"], "answerable": True, "category": "facilities",
     "key_facts": ["90 days"], "difficulty": "lexical"},
    {"id": "a-2", "question": "What is the average taxi fare to downtown?", "gold_answer": "$45 to $60.",
     "source_ids": ["airport_faq#taxis"], "answerable": True, "category": "transport",
     "key_facts": ["45", "60"], "difficulty": "lexical"},
    {"id": "u-1", "question": "What time does the pharmacy close?", "gold_answer": RAG_REFUSAL,
     "source_ids": [], "answerable": False, "category": "facilities"},
]

ORACLE = {
    "How long does lost and found keep items?": "<think>check context</think>Items are held for 90 days.",
    "What is the average taxi fare to downtown?": "About $45 to $70.",
    "What time does the pharmacy close?": RAG_REFUSAL,
}


@pytest.fixture
def small_dataset(tmp_path):
    path = tmp_path / "small.jsonl"
    path.write_text("\n".join(json.dumps(r) for r in SMALL) + "\n", encoding="utf-8")
    return path


def test_strip_reasoning():
    assert strip_reasoning("<think>a\nb</think>\n Answer") == "Answer"
    assert strip_reasoning("<think>never closed") == ""
    assert strip_reasoning("plain") == "plain"


def test_rag_answer_puts_context_and_ids_in_prompt(rag, scripted_llm):
    llm = scripted_llm(lambda q, system: "ok")
    result = rag_answer("How long does lost and found keep items?", rag, llm, top_k=3)
    system_prompt = llm.calls[0][0].content
    assert result.retrieved_ids[0] == "airport_faq#lost-and-found"
    assert "[airport_faq#lost-and-found]" in system_prompt
    assert "90 days" in system_prompt
    assert len(result.retrieved_ids) <= 3
    assert result.retrieval_ms is not None


def test_base_only_answer_has_no_context(scripted_llm):
    llm = scripted_llm(lambda q, system: "answer")
    result = base_only_answer("Where is the help desk?", llm)
    assert result.context == "" and result.retrieved_ids == []
    assert "Context:" not in llm.calls[0][0].content


def test_scripted_run_scores_as_expected(small_dataset, tmp_path, rag, scripted_llm):
    llm = scripted_llm(lambda q, system: ORACLE[q])
    run_dir = run_eval(small_dataset, tmp_path / "out", ["rag"], rag=rag, llm=llm, run_id="t")
    rows = {r["id"]: r for r in map(json.loads, (run_dir / "cases.jsonl").read_text(encoding="utf-8").splitlines())}

    assert rows["a-1"]["correct"] and rows["a-1"]["answer"] == "Items are held for 90 days."
    assert rows["a-1"]["raw_answer"].startswith("<think>")
    assert rows["a-2"]["key_fact_recall"] == 0.5 and not rows["a-2"]["correct"]
    assert rows["a-2"]["unsupported_numbers"] == ["70"] and rows["a-2"]["hallucination_flag"]
    assert rows["u-1"]["refused"] and rows["u-1"]["correct"]

    summary = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))["answers"]["rag"]["summary"]
    assert summary["accuracy"] == pytest.approx(2 / 3)
    assert summary["refusal_recall"] == 1.0
    assert summary["false_refusal_rate"] == 0.0
    assert summary["hallucination_rate"] == pytest.approx(1 / 3)


def test_stub_run_writes_all_outputs_and_is_labelled_simulated(dev_dataset_path, tmp_path, rag, stub_llm):
    run_dir = run_eval(dev_dataset_path, tmp_path, ["rag", "base_only"], rag=rag, llm=stub_llm, run_id="stub")
    for name in ("run.json", "metrics.json", "cases.jsonl", "report.md"):
        assert (run_dir / name).is_file()

    meta = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
    assert meta["simulated"] is True
    assert meta["llm"]["provider"] == "stub"
    assert meta["dataset"] == "eval/dev/rag_dev.jsonl"
    assert len(meta["dataset_sha256"]) == 64 and len(meta["corpus_sha256"]) == 64

    report = (run_dir / "report.md").read_text(encoding="utf-8")
    assert SIMULATED_BANNER in report
    assert "## Retrieval" in report and "## Answer quality" in report

    n_cases = sum(1 for _ in dev_dataset_path.open(encoding="utf-8") if _.strip())
    lines = (run_dir / "cases.jsonl").read_text(encoding="utf-8").splitlines()
    assert len(lines) == 2 * n_cases


def test_retrieval_only_run_is_not_simulated(dev_dataset_path, tmp_path, rag):
    run_dir = run_eval(dev_dataset_path, tmp_path, [], rag=rag, run_id="r")
    meta = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
    assert meta["simulated"] is False and meta["llm"] is None
    assert SIMULATED_BANNER not in (run_dir / "report.md").read_text(encoding="utf-8")


def test_unknown_system_rejected(small_dataset, tmp_path, rag, stub_llm):
    with pytest.raises(ValueError, match="unknown system"):
        run_eval(small_dataset, tmp_path, ["lora"], rag=rag, llm=stub_llm)
