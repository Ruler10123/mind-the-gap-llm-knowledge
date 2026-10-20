"""Deterministic answer-quality metrics (no LLM judge).

Normalisation is SQuAD-style (lowercase, drop articles, collapse
whitespace) except that punctuation is replaced with a space rather than
deleted, so "30-45" -> "30 45" and "Airport_Free_WiFi" -> "airport free
wifi" instead of gluing tokens together.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from collections.abc import Sequence

_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s]")
_ARTICLES_RE = re.compile(r"\b(a|an|the)\b")
_NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")

STOPWORDS = frozenset(
    """a an the and or but if of to in on at by for with from as is are was were be been being
    it its this that these those there here i you your we our they their he she his her my me
    do does did can could should would will may might must shall not no yes so than then too
    very just also about into over under up down out off what which who whom when where why how
    all any each some such only own same have has had am s t don""".split()
)

# Phrases that signal the answer declines rather than answers. Matched on
# lowercased raw text. Deliberately excludes redirects like "please check
# with your airline", which also appear in correct answers.
REFUSAL_PATTERNS = [
    re.compile(p)
    for p in (
        r"\bi (?:do not|don't) have (?:that|this|any|enough|specific|the)\b",
        r"\bi (?:do not|don't) know\b",
        r"\bi'?m not (?:sure|certain|aware)\b",
        r"\bi am not (?:sure|certain|aware)\b",
        r"\b(?:cannot|can't|can not|unable to) (?:find|answer|confirm|provide|say|determine|tell)\b",
        r"\bno (?:information|details|data) (?:about|on|regarding|available)\b",
        r"\b(?:isn't|is not|not) (?:mentioned|provided|included|covered|listed|specified|available) in\b",
        r"\bdoes(?:n't| not) (?:say|mention|specify|include|cover|contain)\b",
        r"\bi (?:do not|don't) have access\b",
    )
]


def normalize(text: str) -> str:
    text = _NON_ALNUM_RE.sub(" ", text.lower())
    text = _ARTICLES_RE.sub(" ", text)
    return " ".join(text.split())


def exact_match(prediction: str, gold: str) -> float:
    return 1.0 if normalize(prediction) == normalize(gold) else 0.0


def token_f1(prediction: str, gold: str) -> float:
    pred = normalize(prediction).split()
    ref = normalize(gold).split()
    if not pred or not ref:
        return 1.0 if pred == ref else 0.0
    common = sum((Counter(pred) & Counter(ref)).values())
    if common == 0:
        return 0.0
    precision = common / len(pred)
    recall = common / len(ref)
    return 2 * precision * recall / (precision + recall)


def fact_present(answer: str, fact: str) -> bool:
    """True if any `|`-separated alternative of `fact` appears in `answer`."""
    norm_answer = f" {normalize(answer)} "
    for alt in fact.split("|"):
        norm_alt = normalize(alt)
        if norm_alt and f" {norm_alt} " in norm_answer:
            return True
    return False


def key_fact_recall(answer: str, key_facts: Sequence[str]) -> float | None:
    if not key_facts:
        return None
    return sum(fact_present(answer, f) for f in key_facts) / len(key_facts)


def is_refusal(answer: str) -> bool:
    text = answer.lower().replace("’", "'")
    return any(p.search(text) for p in REFUSAL_PATTERNS)


def content_tokens(text: str) -> list[str]:
    return [t for t in normalize(text).split() if t not in STOPWORDS]


def groundedness(answer: str, context: str) -> float | None:
    """Share of the answer's content tokens that occur in the context.

    A lexical proxy: high values mean the answer reuses retrieved wording,
    not that it is entailed by it. None when either side is empty.
    """
    tokens = content_tokens(answer)
    if not tokens or not context.strip():
        return None
    ctx = set(normalize(context).split())
    return sum(t in ctx for t in tokens) / len(tokens)


def numbers(text: str) -> set[str]:
    return set(_NUMBER_RE.findall(text.replace(",", "")))


def unsupported_numbers(answer: str, reference: str) -> list[str]:
    """Numbers stated in the answer that never appear in the reference."""
    return sorted(numbers(answer) - numbers(reference))


def percentile(values: Sequence[float], q: float) -> float | None:
    """Linear-interpolated percentile (q in [0, 100]), like numpy's default."""
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q / 100
    lo, hi = math.floor(pos), math.ceil(pos)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo)
