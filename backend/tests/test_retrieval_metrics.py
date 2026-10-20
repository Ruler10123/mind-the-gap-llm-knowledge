import math

import pytest

from eval.retrieval_metrics import (
    dedupe,
    hit_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
    score_ranking,
)

RANKED = ["a", "x", "b", "y", "z"]
RELEVANT = {"a", "b"}


def test_hit_at_k():
    assert hit_at_k(RANKED, RELEVANT, 1) == 1.0
    assert hit_at_k(["x", "a"], RELEVANT, 1) == 0.0
    assert hit_at_k(["x", "a"], RELEVANT, 2) == 1.0


def test_recall_and_precision():
    assert recall_at_k(RANKED, RELEVANT, 1) == 0.5
    assert recall_at_k(RANKED, RELEVANT, 3) == 1.0
    assert precision_at_k(RANKED, RELEVANT, 3) == pytest.approx(2 / 3)
    # Fewer results than k: precision still divides by k.
    assert precision_at_k(["a"], RELEVANT, 5) == pytest.approx(0.2)


def test_reciprocal_rank():
    assert reciprocal_rank(RANKED, RELEVANT) == 1.0
    assert reciprocal_rank(["x", "y", "b"], RELEVANT) == pytest.approx(1 / 3)
    assert reciprocal_rank(["x"], RELEVANT) == 0.0


def test_ndcg_hand_computed():
    # Relevant at ranks 1 and 3: DCG = 1 + 1/log2(4); ideal = 1 + 1/log2(3).
    expected = (1 + 1 / math.log2(4)) / (1 + 1 / math.log2(3))
    assert ndcg_at_k(RANKED, RELEVANT, 3) == pytest.approx(expected)
    assert ndcg_at_k(["a", "b"], RELEVANT, 5) == pytest.approx(1.0)


def test_empty_inputs():
    for fn in (lambda r, g: hit_at_k(r, g, 3), lambda r, g: recall_at_k(r, g, 3),
               lambda r, g: ndcg_at_k(r, g, 3), reciprocal_rank):
        assert fn([], RELEVANT) == 0.0
        assert fn(RANKED, set()) == 0.0


def test_duplicates_not_double_counted():
    assert dedupe(["a", "a", "b", "a"]) == ["a", "b"]
    assert precision_at_k(["a", "a"], {"a"}, 2) == 0.5
    assert ndcg_at_k(["a", "a", "b"], RELEVANT, 2) == pytest.approx(1.0)


def test_k_larger_than_results():
    assert recall_at_k(["a"], RELEVANT, 10) == 0.5
    assert hit_at_k(["b"], RELEVANT, 10) == 1.0


def test_score_ranking_keys():
    row = score_ranking(RANKED, RELEVANT, (1, 5))
    assert set(row) == {"mrr", "hit@1", "recall@1", "precision@1", "ndcg@1",
                        "hit@5", "recall@5", "precision@5", "ndcg@5"}
