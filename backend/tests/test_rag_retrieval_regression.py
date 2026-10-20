"""Retrieval quality must not drop below the committed baseline.

If you change the corpus, the dataset or the retriever on purpose, rerun

    cd backend; uv run python ../scripts/eval_rag.py --update-baseline

and commit the new eval/baselines/retrieval_baseline.json with the change.
"""

import json

import pytest

from eval.corpus import DOCUMENTS_DIR, corpus_sha256
from eval.dataset import dataset_sha256, load_dataset
from eval.runner import RETRIEVAL_BASELINE, evaluate_retrieval

TOLERANCE = 0.01
UPDATE_HINT = "rerun `uv run python ../scripts/eval_rag.py --update-baseline` and commit it"


@pytest.fixture(scope="module")
def baseline():
    return json.loads(RETRIEVAL_BASELINE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def current(dev_dataset_path, rag):
    return evaluate_retrieval(load_dataset(dev_dataset_path), rag)


def test_baseline_matches_dataset_and_corpus(baseline, dev_dataset_path):
    assert baseline["dataset_sha256"] == dataset_sha256(dev_dataset_path), (
        f"dev dataset changed since the retrieval baseline was recorded; {UPDATE_HINT}"
    )
    assert baseline["corpus_sha256"] == corpus_sha256(DOCUMENTS_DIR), (
        f"corpus changed since the retrieval baseline was recorded; {UPDATE_HINT}"
    )


def test_retrieval_not_worse_than_baseline(baseline, current):
    regressions = {
        key: (expected, current["summary"][key])
        for key, expected in baseline["summary"].items()
        if key != "n" and current["summary"][key] < expected - TOLERANCE
    }
    assert not regressions, f"retrieval regressed (baseline, now): {regressions}"


def test_retrieval_is_deterministic(dev_dataset_path, rag, current):
    again = evaluate_retrieval(load_dataset(dev_dataset_path), rag)
    assert [c["retrieved"] for c in again["per_case"]] == [c["retrieved"] for c in current["per_case"]]
