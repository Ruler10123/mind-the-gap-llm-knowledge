"""Evaluate retrieval and answer quality on an eval dataset.

Run from the backend/ dir so `.env` is picked up (adds backend/ to sys.path):

    cd backend
    uv run python ../scripts/eval_rag.py                          # rag + base_only, configured LLM
    uv run python ../scripts/eval_rag.py --retrieval-only         # no LLM needed
    uv run python ../scripts/eval_rag.py --update-baseline        # rewrite the regression baseline

See docs/rag_eval.md for the LM Studio settings used for the committed baseline.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make `backend/` importable when invoked from the repo root.
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND = REPO_ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from eval.corpus import DOCUMENTS_DIR  # noqa: E402
from eval.dataset import DatasetError, load_dataset  # noqa: E402
from eval.runner import (  # noqa: E402
    DEV_DATASET,
    RETRIEVAL_BASELINE,
    SYSTEMS,
    evaluate_retrieval,
    retrieval_baseline,
    run_eval,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dataset", type=Path, default=DEV_DATASET)
    parser.add_argument("--systems", default=",".join(SYSTEMS),
                        help=f"comma-separated subset of {', '.join(SYSTEMS)}")
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "results")
    parser.add_argument("--run-id", help="results subfolder name (default: timestamp)")
    parser.add_argument("--top-k", type=int, help="chunks given to the rag system (default: RAG_TOP_K)")
    parser.add_argument("--retrieval-only", action="store_true", help="skip the LLM systems")
    parser.add_argument("--update-baseline", action="store_true",
                        help=f"write retrieval metrics to {RETRIEVAL_BASELINE.relative_to(REPO_ROOT)} and exit")
    args = parser.parse_args()

    try:
        cases = load_dataset(args.dataset)
    except DatasetError as e:
        print(e, file=sys.stderr)
        return 1

    if args.update_baseline:
        from rag.local_rag import LocalRAGService
        retrieval = evaluate_retrieval(cases, LocalRAGService(DOCUMENTS_DIR))
        RETRIEVAL_BASELINE.parent.mkdir(parents=True, exist_ok=True)
        snapshot = retrieval_baseline(args.dataset.resolve(), DOCUMENTS_DIR, retrieval)
        RETRIEVAL_BASELINE.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {RETRIEVAL_BASELINE}")
        print(json.dumps(snapshot["summary"], indent=2))
        return 0

    systems = [] if args.retrieval_only else [s.strip() for s in args.systems.split(",") if s.strip()]
    unknown = sorted(set(systems) - set(SYSTEMS))
    if unknown:
        parser.error(f"unknown system(s): {', '.join(unknown)}")

    run_dir = run_eval(args.dataset, args.out, systems, top_k=args.top_k, run_id=args.run_id, progress=True)
    meta = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
    metrics = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))

    print(f"Results: {run_dir}")
    if meta["simulated"]:
        print("SIMULATED - answers came from the stub LLM; only retrieval metrics are meaningful.")
    r = metrics["retrieval"]["summary"]
    print(f"retrieval  n={r['n']}  hit@1={r['hit@1']:.3f}  hit@5={r['hit@5']:.3f}  "
          f"recall@5={r['recall@5']:.3f}  mrr={r['mrr']:.3f}")
    for name, a in metrics["answers"].items():
        s = a["summary"]
        print(f"{name:<10} n={s['n']}  accuracy={s['accuracy']:.3f}  "
              f"refusal_recall={s['refusal_recall']:.3f}  hallucination={s['hallucination_rate']:.3f}  "
              f"p50={s['latency_ms']['total_p50']:.0f}ms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
