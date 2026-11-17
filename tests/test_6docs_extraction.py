"""Regression checks for faithful, complete public-page extraction."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sixdocs", ROOT / "scripts/build-6docs-skill.py")
sixdocs = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sixdocs)


def block(kind, title="", children=None):
    return {"value": {"type": kind, "properties": {"title": [[title]]}, "content": children or []}}


class SixDocsExtractionTests(unittest.TestCase):
    def setUp(self):
        self.snapshot = json.loads((sixdocs.DEST / "references/source-page.json").read_text())

    def test_saved_page_and_every_generated_file_match_ledger(self):
        guide, codes, blocks = sixdocs.render(self.snapshot["recordMap"], return_ledger=True)
        self.assertTrue(guide.startswith("# The 6 Documents You Need Before Vibe Coding Any App\n"))
        self.assertEqual(len(blocks), 82)
        self.assertEqual(len(codes), 17)
        self.assertEqual(guide, (sixdocs.DEST / "references/full-guide.md").read_text())
        ledger = json.loads((sixdocs.DEST / "references/extraction.json").read_text())
        self.assertEqual(ledger["blocks"], blocks)
        for rel, expected_hash in ledger["files"].items():
            self.assertEqual(hashlib.sha256((sixdocs.DEST / rel).read_bytes()).hexdigest(), expected_hash, rel)
        for rel, text in codes:
            self.assertEqual((sixdocs.DEST / rel).read_text(), text.rstrip("\n") + "\n", rel)
        source = json.loads((sixdocs.DEST / "SOURCE.json").read_text())
        self.assertEqual(source["extraction"]["snapshotSha256"], ledger["snapshotSha256"])

    def test_actual_source_annotations_survive_rendering(self):
        guide, _ = sixdocs.render(self.snapshot["recordMap"])
        self.assertIn("**Turn an app idea into clear instructions before asking an AI coding agent to build it.**", guide)
        self.assertIn("**one at a time in this order**", guide)
        self.assertIn("`00-app-brief.md`", guide)
        self.assertIn("`docs`", guide)

    def test_missing_or_unsupported_block_fails_instead_of_silently_omitting_it(self):
        records = {"block": {"root": block("page", "Title", ["missing"])}}
        with self.assertRaisesRegex(ValueError, "Missing referenced block"):
            sixdocs.render(records, page_id="root", codefile_map={})
        records["block"]["missing"] = block("image", "Important image")
        with self.assertRaisesRegex(ValueError, "Unsupported block type"):
            sixdocs.render(records, page_id="root", codefile_map={})
        with self.assertRaisesRegex(ValueError, "Unsupported Notion annotation"):
            sixdocs.rich_text([["text", [["unknown"]]]])

    def test_paginated_fetch_merges_all_chunks(self):
        requests = []
        def loader(cursor, number):
            requests.append((cursor, number))
            if number == 0:
                return {"cursor": {"stack": [{"id": "next"}]}, "recordMap": {"block": {"root": block("page", "Title", ["child"])}}}
            return {"cursor": {"stack": []}, "recordMap": {"block": {"child": block("text", "Last page")}}}
        data = sixdocs.fetch(loader)
        guide, _ = sixdocs.render(data["recordMap"], page_id="root", codefile_map={})
        self.assertIn("Last page", guide)
        self.assertEqual(len(data["chunks"]), 2)
        self.assertEqual(requests[1], ({"stack": [{"id": "next"}]}, 1))

    def test_repeated_or_missing_cursor_fails(self):
        response = {"cursor": {"stack": [{"id": "stuck"}]}, "recordMap": {"block": {}}}
        with self.assertRaisesRegex(ValueError, "cursor repeated"):
            sixdocs.fetch(lambda *_: response)
        with self.assertRaisesRegex(ValueError, "valid pagination cursor"):
            sixdocs.fetch(lambda *_: {"recordMap": {"block": {}}})

    def test_incomplete_snapshot_does_not_write_partial_files(self):
        self.snapshot["cursor"] = {"stack": [{"id": "remaining"}]}
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, "unfinished pagination"):
                sixdocs.write_extraction(self.snapshot, Path(tmp))
            self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_code_mapping_change_requires_review(self):
        with self.assertRaisesRegex(ValueError, "Unmapped code block"):
            sixdocs.render(self.snapshot["recordMap"], codefile_map={})
        records = {"block": {"root": block("page", "Title")}}
        with self.assertRaisesRegex(ValueError, "Expected 17 code blocks"):
            sixdocs.render(records, page_id="root")

    def test_code_block_identity_change_requires_review(self):
        records = self.snapshot["recordMap"]["block"]
        original_id = sixdocs.EXPECTED_CODE_BLOCK_IDS[0]
        records["new-code-id"] = records.pop(original_id)
        for wrapper in records.values():
            value = sixdocs.value(wrapper)
            value["content"] = ["new-code-id" if x == original_id else x for x in value.get("content", [])]
        with self.assertRaisesRegex(ValueError, "Code block order or identity changed"):
            sixdocs.render(self.snapshot["recordMap"])


if __name__ == "__main__":
    unittest.main()
