"""Eval dataset schema and JSONL loader. Format documented in docs/eval_dataset.md."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator


class EvalCase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    question: str = Field(min_length=1)
    gold_answer: str = Field(min_length=1)
    source_ids: list[str] = Field(default_factory=list)
    answerable: bool
    category: str = Field(min_length=1)
    # Short strings a correct answer must contain; "a|b" means either a or b.
    key_facts: list[str] = Field(default_factory=list)
    difficulty: Literal["lexical", "paraphrase", "multi_hop"] | None = None

    @model_validator(mode="after")
    def _sources_match_answerable(self) -> "EvalCase":
        if self.answerable and not self.source_ids:
            raise ValueError("answerable cases need at least one source_id")
        if not self.answerable and self.source_ids:
            raise ValueError("unanswerable cases must have empty source_ids")
        if not self.answerable and self.key_facts:
            raise ValueError("unanswerable cases must have empty key_facts")
        return self


class DatasetError(ValueError):
    """Raised with every bad row at once, each tagged with its line number."""

    def __init__(self, path: Path, errors: list[tuple[int, str]]):
        self.path = path
        self.errors = errors
        detail = "\n".join(f"  line {line}: {msg}" for line, msg in errors)
        super().__init__(f"{path}: {len(errors)} invalid row(s)\n{detail}")


def load_dataset(path: str | Path) -> list[EvalCase]:
    path = Path(path)
    cases: list[EvalCase] = []
    errors: list[tuple[int, str]] = []
    seen: dict[str, int] = {}

    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        try:
            case = EvalCase.model_validate(json.loads(raw))
        except json.JSONDecodeError as e:
            errors.append((lineno, f"invalid JSON: {e.msg}"))
            continue
        except ValidationError as e:
            msgs = "; ".join(
                f"{'.'.join(str(p) for p in err['loc']) or 'row'}: {err['msg']}"
                for err in e.errors()
            )
            errors.append((lineno, msgs))
            continue
        if case.id in seen:
            errors.append((lineno, f"duplicate id {case.id!r} (first on line {seen[case.id]})"))
            continue
        seen[case.id] = lineno
        cases.append(case)

    if errors:
        raise DatasetError(path, errors)
    return cases


def dataset_sha256(path: str | Path) -> str:
    return hashlib.sha256(Path(path).read_bytes().replace(b"\r\n", b"\n")).hexdigest()
