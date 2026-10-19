"""Render a run's metrics as Markdown."""

from __future__ import annotations

SIMULATED_BANNER = (
    "> **SIMULATED - not a result.** Answers came from the stub LLM, so only the "
    "retrieval section is meaningful."
)

ANSWER_COLUMNS = [
    ("accuracy", "Accuracy"),
    ("key_fact_recall", "Key-fact recall"),
    ("token_f1", "Token F1"),
    ("refusal_recall", "Refusal recall"),
    ("false_refusal_rate", "False refusals"),
    ("hallucination_rate", "Hallucination proxy"),
    ("groundedness", "Groundedness proxy"),
]


def _fmt(value, digits: int = 3) -> str:
    if value is None:
        return "-"
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, float):
        return f"{value:.{digits}f}"
    return str(value)


def _table(headers: list[str], rows: list[list]) -> list[str]:
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    out += ["| " + " | ".join(_fmt(c) for c in row) + " |" for row in rows]
    return out


def _clip(text: str, n: int = 140) -> str:
    text = " ".join((text or "").split()).replace("|", "\\|")
    return text if len(text) <= n else text[: n - 1] + "…"


def _why(row: dict) -> str:
    if not row["answerable"]:
        return "answered an unanswerable question"
    if row["refused"]:
        return "refused an answerable question"
    reasons = [f"key facts {row['key_fact_recall']:.2f}"] if row["key_fact_recall"] is not None else []
    if row["unsupported_numbers"]:
        reasons.append("unsupported numbers " + ", ".join(row["unsupported_numbers"]))
    return "; ".join(reasons) or "incorrect"


def render_report(meta: dict, metrics: dict, rows: list[dict], worst_n: int = 5) -> str:
    lines: list[str] = ["# RAG evaluation report", ""]
    if meta.get("simulated"):
        lines += [SIMULATED_BANNER, ""]

    llm = meta.get("llm") or {}
    lines += ["## Run", ""]
    lines += _table(["Field", "Value"], [
        ["Created (UTC)", meta["created_at"]],
        ["Git commit", f"{meta['git_sha'] or '-'}{' (dirty)' if meta.get('git_dirty') else ''}"],
        ["Dataset", f"`{meta['dataset']}`"],
        ["Dataset sha256", f"`{meta['dataset_sha256'][:16]}`"],
        ["Corpus sha256", f"`{meta['corpus_sha256'][:16]}`"],
        ["Retriever", f"{meta['retriever']} (answer context top_k={meta['rag_top_k']})"],
        ["Systems", ", ".join(meta["systems"]) or "retrieval only"],
        ["LLM", f"{llm.get('provider', '-')} / {llm.get('model') or '-'}"
                + (f" @ {llm['base_url_host']}" if llm.get("base_url_host") else "")],
        ["Temperature", meta["temperature"]],
    ])

    r = metrics["retrieval"]
    ks = r["ks"]
    s = r["summary"]
    lines += ["", "## Retrieval", "", f"Answerable cases: {s['n']}. Relevance is binary against `source_ids`.", ""]
    lines += _table(
        ["Metric"] + [f"@{k}" for k in ks],
        [[name] + [s.get(f"{key}@{k}") for k in ks]
         for key, name in (("hit", "Hit"), ("recall", "Recall"), ("precision", "Precision"), ("ndcg", "nDCG"))],
    )
    lines += ["", f"MRR: {_fmt(s.get('mrr'))}", ""]

    kmax = max(ks)
    for title, groups in (("category", r["by_category"]), ("difficulty", r["by_difficulty"])):
        lines += [f"### Retrieval by {title}", ""]
        lines += _table(
            [title.capitalize(), "n", "Hit@1", f"Hit@{kmax}", f"Recall@{kmax}", "MRR"],
            [[g, v["n"], v.get("hit@1"), v.get(f"hit@{kmax}"), v.get(f"recall@{kmax}"), v.get("mrr")]
             for g, v in groups.items()],
        )
        lines.append("")

    lines += ["### Top-1 retrieval score (keyword overlap)", "",
              "Unanswerable questions scoring as high as answerable ones means a score "
              "threshold alone can't make the system refuse.", ""]
    lines += _table(
        ["Cases", "n", "min", "p50", "mean", "max"],
        [[k, v["n"], v["min"], v["p50"], v["mean"], v["max"]] for k, v in r["top1_score"].items()],
    )

    misses = [c for c in r["per_case"] if c.get(f"hit@{kmax}") == 0.0]
    lines += ["", f"### Retrieval misses (no gold section in top {kmax})", ""]
    if misses:
        lines += _table(["Case", "Gold", f"Retrieved top {kmax}"],
                        [[c["id"], ", ".join(c["relevant"]), ", ".join(c["retrieved"])] for c in misses])
    else:
        lines.append("None.")

    answers = metrics.get("answers") or {}
    if answers:
        lines += ["", "## Answer quality", ""]
        lines += _table(["System", "n"] + [label for _, label in ANSWER_COLUMNS],
                        [[name, a["summary"]["n"]] + [a["summary"].get(k) for k, _ in ANSWER_COLUMNS]
                         for name, a in answers.items()])
        lines += ["", "### Latency (ms)", ""]
        lines += _table(["System", "Gen p50", "Gen p95", "Retrieval p50", "Retrieval p95", "Total p50", "Total p95"],
                        [[name] + [a["summary"]["latency_ms"][k] for k in (
                            "generation_p50", "generation_p95", "retrieval_p50",
                            "retrieval_p95", "total_p50", "total_p95")]
                         for name, a in answers.items()])

        categories = sorted({c for a in answers.values() for c in a["by_category"]})
        lines += ["", "### Accuracy by category", ""]
        lines += _table(["Category"] + list(answers),
                        [[c] + [answers[s]["by_category"].get(c, {}).get("accuracy") for s in answers]
                         for c in categories])

        for system in answers:
            wrong = [row for row in rows if row["system"] == system and not row["correct"]]
            wrong.sort(key=lambda row: (row["answerable"], row["key_fact_recall"] or 0.0, row["id"]))
            lines += ["", f"### Worst cases: {system} ({len(wrong)} incorrect)", ""]
            if not wrong:
                lines.append("None.")
                continue
            lines += _table(["Case", "Question", "Answer", "Why"],
                            [[w["id"], _clip(w["question"], 80), _clip(w["answer"]), _why(w)]
                             for w in wrong[:worst_n]])

    lines.append("")
    return "\n".join(lines)
