"""Ranked-retrieval metrics with binary relevance.

All functions take `ranked` (retrieved ids, best first) and `relevant` (gold
ids). Duplicate ids in `ranked` are collapsed to their first occurrence so a
document can't be credited twice.
"""

from __future__ import annotations

import math
from collections.abc import Iterable, Sequence


def dedupe(ranked: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for doc in ranked:
        if doc not in seen:
            seen.add(doc)
            out.append(doc)
    return out


def hit_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    return 1.0 if any(d in relevant for d in dedupe(ranked)[:k]) else 0.0


def recall_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    if not relevant:
        return 0.0
    return len(set(dedupe(ranked)[:k]) & relevant) / len(relevant)


def precision_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    # Denominator is k, not the number retrieved: returning fewer results
    # than asked for is not rewarded.
    if k <= 0:
        return 0.0
    return len(set(dedupe(ranked)[:k]) & relevant) / k


def reciprocal_rank(ranked: Sequence[str], relevant: set[str]) -> float:
    for i, doc in enumerate(dedupe(ranked), 1):
        if doc in relevant:
            return 1.0 / i
    return 0.0


def ndcg_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    if not relevant or k <= 0:
        return 0.0
    dcg = sum(
        1.0 / math.log2(i + 2)
        for i, doc in enumerate(dedupe(ranked)[:k])
        if doc in relevant
    )
    idcg = sum(1.0 / math.log2(i + 2) for i in range(min(len(relevant), k)))
    return dcg / idcg


def score_ranking(ranked: Sequence[str], relevant: set[str], ks: Sequence[int]) -> dict[str, float]:
    """All retrieval metrics for one query, keyed like `hit@3`, `mrr`."""
    row: dict[str, float] = {"mrr": reciprocal_rank(ranked, relevant)}
    for k in ks:
        row[f"hit@{k}"] = hit_at_k(ranked, relevant, k)
        row[f"recall@{k}"] = recall_at_k(ranked, relevant, k)
        row[f"precision@{k}"] = precision_at_k(ranked, relevant, k)
        row[f"ndcg@{k}"] = ndcg_at_k(ranked, relevant, k)
    return row
