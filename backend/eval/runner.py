"""Run the eval dataset through retrieval and each system, then score it.

Writes `<out>/<run_id>/` containing:
  run.json     - provenance (git sha, dataset/corpus hashes, provider, model)
  metrics.json - retrieval and per-system answer metrics
  cases.jsonl  - one scored row per (system, case)
  report.md    - human-readable summary (eval/report.py)
"""

from __future__ import annotations

import json
import subprocess
from collections import defaultdict
from collections.abc import Iterable, Sequence
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from config import settings
from eval import answer_metrics as am
from eval.corpus import DOCUMENTS_DIR, chunk_index, citation_source_id, corpus_sha256
from eval.dataset import EvalCase, dataset_sha256, load_dataset
from eval.pipeline import base_only_answer, rag_answer, retrieve
from eval.retrieval_metrics import score_ranking

SYSTEMS = ("rag", "base_only")
RETRIEVAL_KS = (1, 3, 5)
REPO_ROOT = Path(__file__).resolve().parents[2]
DEV_DATASET = REPO_ROOT / "eval" / "dev" / "rag_dev.jsonl"
RETRIEVAL_BASELINE = Path(__file__).resolve().parent / "baselines" / "retrieval_baseline.json"


def mean(values: Iterable[float | None]) -> float | None:
    vals = [v for v in values if v is not None]
    return sum(vals) / len(vals) if vals else None


def _stats(values: Sequence[float]) -> dict:
    return {
        "n": len(values),
        "min": min(values) if values else None,
        "p50": am.percentile(values, 50),
        "max": max(values) if values else None,
        "mean": mean(values),
    }


def _group(rows: list[dict], key: str) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        groups[str(row.get(key) or "none")].append(row)
    return dict(sorted(groups.items()))


# ---------------------------------------------------------------- retrieval

def evaluate_retrieval(cases: list[EvalCase], rag, ks: Sequence[int] = RETRIEVAL_KS) -> dict:
    depth = max(ks)
    per_case: list[dict] = []
    top1 = {"answerable": [], "unanswerable": []}

    for case in cases:
        citations, ms = retrieve(rag, case.question, depth)
        ranked = [citation_source_id(c) for c in citations]
        top_score = citations[0].score if citations and citations[0].score is not None else 0.0
        top1["answerable" if case.answerable else "unanswerable"].append(top_score)
        if not case.answerable:
            continue
        row = {
            "id": case.id,
            "category": case.category,
            "difficulty": case.difficulty,
            "relevant": case.source_ids,
            "retrieved": ranked,
            "latency_ms": ms,
            **score_ranking(ranked, set(case.source_ids), ks),
        }
        per_case.append(row)

    metric_keys = [k for k in per_case[0] if k == "mrr" or "@" in k] if per_case else []

    def summarise(rows: list[dict]) -> dict:
        return {"n": len(rows), **{k: mean(r[k] for r in rows) for k in metric_keys}}

    return {
        "ks": list(ks),
        "summary": summarise(per_case),
        "by_category": {g: summarise(rs) for g, rs in _group(per_case, "category").items()},
        "by_difficulty": {g: summarise(rs) for g, rs in _group(per_case, "difficulty").items()},
        "top1_score": {k: _stats(v) for k, v in top1.items()},
        "per_case": per_case,
    }


def retrieval_baseline(dataset_path: Path, documents_dir: Path, retrieval: dict) -> dict:
    """The committed snapshot the regression test compares against."""
    return {
        "dataset_sha256": dataset_sha256(dataset_path),
        "corpus_sha256": corpus_sha256(documents_dir),
        "retriever": "local_keyword",
        "ks": retrieval["ks"],
        "summary": retrieval["summary"],
    }


# ------------------------------------------------------------------ answers

def score_answer(case: EvalCase, answer, evidence: str) -> dict:
    text = answer.answer
    refused = am.is_refusal(text)
    facts = am.key_fact_recall(text, case.key_facts)
    if case.answerable:
        correct = (facts == 1.0) and not refused
    else:
        correct = refused
    reference = "\n".join([evidence, case.question, case.gold_answer])
    unsupported = am.unsupported_numbers(text, reference)
    total_ms = answer.generation_ms + (answer.retrieval_ms or 0.0)
    return {
        "id": case.id,
        "category": case.category,
        "difficulty": case.difficulty,
        "answerable": case.answerable,
        "question": case.question,
        "gold_answer": case.gold_answer,
        "answer": text,
        "raw_answer": answer.raw_answer if answer.raw_answer != text else None,
        "retrieved_ids": answer.retrieved_ids,
        "retrieved_scores": answer.retrieved_scores,
        "exact_match": am.exact_match(text, case.gold_answer),
        "token_f1": am.token_f1(text, case.gold_answer),
        "key_fact_recall": facts,
        "refused": refused,
        "correct": correct,
        "groundedness": am.groundedness(text, answer.context) if answer.context else None,
        "unsupported_numbers": unsupported,
        # Answered something it can't know, or stated numbers not in the
        # gold evidence. A lexical proxy for hallucination, not a judgement.
        "hallucination_flag": (not refused) and ((not case.answerable) or bool(unsupported)),
        "retrieval_ms": answer.retrieval_ms,
        "generation_ms": answer.generation_ms,
        "total_ms": total_ms,
    }


def summarise_answers(rows: list[dict]) -> dict:
    answerable = [r for r in rows if r["answerable"]]
    unanswerable = [r for r in rows if not r["answerable"]]
    refused = [r for r in rows if r["refused"]]
    retrieval_ms = [r["retrieval_ms"] for r in rows if r["retrieval_ms"] is not None]
    return {
        "n": len(rows),
        "accuracy": mean(float(r["correct"]) for r in rows),
        "answerable_accuracy": mean(float(r["correct"]) for r in answerable),
        "key_fact_recall": mean(r["key_fact_recall"] for r in answerable),
        "token_f1": mean(r["token_f1"] for r in answerable),
        "exact_match": mean(r["exact_match"] for r in answerable),
        "refusal_recall": mean(float(r["refused"]) for r in unanswerable),
        "refusal_precision": mean(float(not r["answerable"]) for r in refused),
        "false_refusal_rate": mean(float(r["refused"]) for r in answerable),
        "refusal_accuracy": mean(float(r["refused"] == (not r["answerable"])) for r in rows),
        "hallucination_rate": mean(float(r["hallucination_flag"]) for r in rows),
        "groundedness": mean(r["groundedness"] for r in rows),
        "latency_ms": {
            "generation_p50": am.percentile([r["generation_ms"] for r in rows], 50),
            "generation_p95": am.percentile([r["generation_ms"] for r in rows], 95),
            "retrieval_p50": am.percentile(retrieval_ms, 50),
            "retrieval_p95": am.percentile(retrieval_ms, 95),
            "total_p50": am.percentile([r["total_ms"] for r in rows], 50),
            "total_p95": am.percentile([r["total_ms"] for r in rows], 95),
        },
    }


def evaluate_system(system: str, cases: list[EvalCase], rag, llm, top_k: int) -> list[dict]:
    index = chunk_index(rag)
    rows = []
    for case in cases:
        if system == "rag":
            answer = rag_answer(case.question, rag, llm, top_k)
        elif system == "base_only":
            answer = base_only_answer(case.question, llm)
        else:
            raise ValueError(f"unknown system {system!r}; expected one of {SYSTEMS}")
        evidence = "\n".join(index[s]["content"] for s in case.source_ids if s in index)
        rows.append({"system": system, **score_answer(case, answer, evidence)})
    return rows


# --------------------------------------------------------------- provenance

def _git(*args: str) -> str | None:
    try:
        out = subprocess.run(
            ["git", *args], cwd=REPO_ROOT, capture_output=True, text=True, timeout=10, check=True
        )
        return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None


def describe_llm(llm) -> dict:
    """Effective provider/model, so a silent stub fallback is visible in results."""
    if type(llm).__name__ == "_StubChatModel":
        return {"provider": "stub", "model": None, "base_url_host": None}
    provider = (settings.llm_provider or "stub").lower()
    model = getattr(llm, "model_name", None) or getattr(llm, "model_id", None)
    host = None
    if provider == "openai":
        host = urlparse(settings.openai_base_url).netloc
        model = model or settings.openai_model
    elif provider == "vultr":
        host = "api.vultrinference.com"
        model = model or settings.vultr_model
    elif provider == "local":
        model = model or settings.local_model_id
    return {"provider": provider, "model": model, "base_url_host": host}


def _repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def run_metadata(dataset_path: Path, documents_dir: Path, systems: Sequence[str], llm_info: dict, top_k: int) -> dict:
    status = _git("status", "--porcelain")
    return {
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "git_sha": _git("rev-parse", "HEAD"),
        "git_dirty": bool(status) if status is not None else None,
        "dataset": _repo_relative(dataset_path),
        "dataset_sha256": dataset_sha256(dataset_path),
        "corpus_dir": _repo_relative(documents_dir),
        "corpus_sha256": corpus_sha256(documents_dir),
        "retriever": "local_keyword",
        "rag_top_k": top_k,
        "retrieval_ks": list(RETRIEVAL_KS),
        "systems": list(systems),
        "llm": llm_info if systems else None,
        "temperature": 0,
        "simulated": bool(systems) and llm_info.get("provider") == "stub",
    }


# ---------------------------------------------------------------------- run

def run_eval(
    dataset_path: str | Path,
    out_dir: str | Path,
    systems: Sequence[str] = SYSTEMS,
    *,
    rag=None,
    llm=None,
    documents_dir: str | Path | None = None,
    top_k: int | None = None,
    run_id: str | None = None,
) -> Path:
    from eval.report import render_report
    from rag.local_rag import LocalRAGService

    dataset_path = Path(dataset_path).resolve()
    documents_dir = Path(documents_dir).resolve() if documents_dir else DOCUMENTS_DIR
    top_k = top_k or settings.rag_top_k
    cases = load_dataset(dataset_path)
    rag = rag or LocalRAGService(documents_dir)

    if systems and llm is None:
        from agent.graph import _build_llm
        llm = _build_llm()
    llm_info = describe_llm(llm) if systems else {}

    # Provenance is captured before the (possibly long) run starts.
    meta = run_metadata(dataset_path, documents_dir, systems, llm_info, top_k)
    retrieval = evaluate_retrieval(cases, rag)
    rows: list[dict] = []
    answers: dict[str, dict] = {}
    for system in systems:
        sys_rows = evaluate_system(system, cases, rag, llm, top_k)
        rows.extend(sys_rows)
        answers[system] = {
            "summary": summarise_answers(sys_rows),
            "by_category": {g: summarise_answers(rs) for g, rs in _group(sys_rows, "category").items()},
        }

    run_id = run_id or datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = Path(out_dir) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    metrics = {"retrieval": retrieval, "answers": answers}
    (run_dir / "run.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    (run_dir / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    with (run_dir / "cases.jsonl").open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    (run_dir / "report.md").write_text(render_report(meta, metrics, rows), encoding="utf-8")
    return run_dir
