import asyncio

from eval.corpus import is_heading_only, section_id
from rag.corpus_files import is_knowledge_file
from rag.local_rag import LocalRAGService, _split_sections

DOC = """# Title

## Group One

### First Section
First section body text.

### Second Section
Second section body text.

## Trailing heading with no body
"""


def test_headings_attach_to_following_block():
    assert _split_sections(DOC) == [
        "## Group One\n### First Section\nFirst section body text.",
        "### Second Section\nSecond section body text.",
    ]


def test_section_id_uses_most_specific_heading():
    first = _split_sections(DOC)[0]
    assert section_id("doc.md", first) == "doc#first-section"


def test_readme_files_are_not_knowledge(tmp_path):
    (tmp_path / "README.md").write_text("# Docs\n\nRun the ingestion script to load files.\n", encoding="utf-8")
    (tmp_path / "faq.md").write_text(DOC, encoding="utf-8")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "readme.txt").write_text("Internal notes about this folder.\n", encoding="utf-8")

    assert not is_knowledge_file(tmp_path / "README.md")
    assert not is_knowledge_file(sub / "readme.txt")
    assert is_knowledge_file(tmp_path / "faq.md")

    rag = LocalRAGService(tmp_path)
    assert {c["source"] for c in rag.chunks} == {"faq.md"}
    assert asyncio.run(rag.retrieve("ingestion script")) == []


def test_real_corpus_has_no_readme_or_heading_only_chunks(rag):
    assert all(is_knowledge_file(rag.documents_dir / c["source"]) for c in rag.chunks)
    assert not [c["chunk_id"] for c in rag.chunks if is_heading_only(c["content"])]
