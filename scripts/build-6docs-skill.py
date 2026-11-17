#!/usr/bin/env python3
"""Build the vibe-planning-6docs skill from the public Notion page.

The page is fetched from Notion's public loadPageChunk endpoint and rendered
block-for-block into references/full-guide.md. Every code block is also saved
as an individual template or prompt. Source prose is rendered as Markdown;
original Notion responses and an extraction ledger are retained for verification.
"""
import argparse
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "skills" / "planning" / "vibe-planning-6docs"
PAGE_ID = "3d313d90-aa8f-8076-9b6a-ecefb5f83f45"
SOURCE_URL = (
    "https://midi-garment-d51.notion.site/"
    "The-6-Documents-You-Need-Before-Vibe-Coding-Any-App-"
    "3d313d90aa8f80769b6aecefb5f83f45"
)

CODEFILE_MAP = {
    1: ("references/document-order.md", None),
    2: ("templates/00-app-brief.md", None),
    3: ("templates/01-prd.md", None),
    4: ("prompts/01-prd.prompt.md", None),
    5: ("templates/02-trd.md", None),
    6: ("prompts/02-trd.prompt.md", None),
    7: ("templates/03-app-flow.md", None),
    8: ("prompts/03-app-flow.prompt.md", None),
    9: ("templates/04-ui-ux-brief.md", None),
    10: ("prompts/04-ui-ux-brief.prompt.md", None),
    11: ("templates/05-backend-schema.md", None),
    12: ("prompts/05-backend-schema.prompt.md", None),
    13: ("templates/06-implementation-plan.md", None),
    14: ("prompts/06-implementation-plan.prompt.md", None),
    15: ("prompts/final-consistency-check.prompt.md", None),
    16: ("references/project-layout.md", None),
    17: ("prompts/handoff.prompt.md", None),
}


EXPECTED_CODE_BLOCK_IDS = ['3d313d90-aa8f-81cd-b032-f36bb942fd0a', '3d313d90-aa8f-8157-9214-cacee0365bfc', '3d313d90-aa8f-817f-868e-dbc982cb1e53', '3d313d90-aa8f-8138-a6d2-c4bf462af98a', '3d313d90-aa8f-816a-a0fd-f54d0334a26d', '3d313d90-aa8f-81e5-a327-e9988a0b38ac', '3d313d90-aa8f-81b0-b674-cc9ee1dfbf17', '3d313d90-aa8f-81bd-b8e3-e2961b82ce81', '3d313d90-aa8f-81d5-bd9a-e9c0e402e7f4', '3d313d90-aa8f-813c-a079-dbb442bada93', '3d313d90-aa8f-819e-bc84-ca7a26055286', '3d313d90-aa8f-81a9-ba7b-e13667f33dd2', '3d313d90-aa8f-81cf-885e-cc90ab329cac', '3d313d90-aa8f-8127-ad0e-c931b10ced75', '3d313d90-aa8f-8105-8c53-d2d14b6da0e5', '3d313d90-aa8f-81a9-a4a2-cb886ea335ff', '3d313d90-aa8f-813c-ace0-c9eaa794d3ec']


def fetch_chunk(cursor, chunk_number):
    req = urllib.request.Request(
        "https://www.notion.so/api/v3/loadPageChunk",
        data=json.dumps({
            "pageId": PAGE_ID, "limit": 200, "cursor": cursor,
            "chunkNumber": chunk_number, "verticalColumns": False,
        }).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read())


def fetch(loader=None):
    """Follow the public cursor; retain every response for an auditable snapshot."""
    loader = loader or fetch_chunk
    cursor = {"stack": []}
    chunks, record_map, seen = [], {}, set()
    for number in range(100):
        data = loader(cursor, number)
        if not isinstance(data.get("recordMap", {}).get("block"), dict):
            raise ValueError("Notion response is missing its block record map")
        chunks.append(data)
        for table, entries in data["recordMap"].items():
            record_map.setdefault(table, {}).update(entries)
        next_cursor = data.get("cursor")
        if not isinstance(next_cursor, dict) or not isinstance(next_cursor.get("stack"), list):
            raise ValueError("Notion response is missing a valid pagination cursor")
        if not next_cursor["stack"]:
            return {"cursor": next_cursor, "recordMap": record_map, "chunks": chunks}
        key = json.dumps(next_cursor, sort_keys=True)
        if key in seen:
            raise ValueError("Notion pagination cursor repeated; refusing partial extraction")
        seen.add(key)
        cursor = next_cursor
    raise ValueError("Notion pagination exceeded 100 chunks; refusing partial extraction")


def value(block):
    v = block.get("value", {})
    return v.get("value", v)


def plain_text(arr):
    return "".join(item[0] or "" for item in arr or [])


def rich_text(arr):
    """Represent supported Notion annotations in Markdown without dropping any."""
    out = []
    for item in arr or []:
        text = item[0] or ""
        for annotation in item[1] if len(item) > 1 else []:
            kind = annotation[0]
            if kind == "b":
                text = f"**{text}**"
            elif kind == "i":
                text = f"*{text}*"
            elif kind == "s":
                text = f"~~{text}~~"
            elif kind == "c":
                fence = "`"
                while fence in text:
                    fence += "`"
                text = f"{fence} {text} {fence}" if "`" in text else f"{fence}{text}{fence}"
            elif kind == "a" and len(annotation) == 2:
                text = f"[{text}]({annotation[1]})"
            elif kind == "_":
                text = f"<u>{text}</u>"
            else:
                raise ValueError(f"Unsupported Notion annotation: {annotation!r}")
        out.append(text)
    return "".join(out)


def block_text(block, formatted=True):
    props = block.get("properties", {})
    key = "title"
    if key not in props and block.get("type") != "divider":
        raise ValueError(f"Block {block.get('id')} has no supported title property")
    return (rich_text if formatted else plain_text)(props.get(key, []))


def render(record_map, page_id=PAGE_ID, codefile_map=None, return_ledger=False):
    blocks = record_map["block"]
    codefile_map = CODEFILE_MAP if codefile_map is None else codefile_map
    lines, code_files, ledger = [], [], []
    visited = set()

    def walk(block_id, depth=0, number=1):
        if block_id in visited:
            raise ValueError(f"Repeated or cyclic block: {block_id}")
        block = value(blocks.get(block_id, {}))
        if not block:
            raise ValueError(f"Missing referenced block: {block_id}")
        visited.add(block_id)
        kind = block.get("type")
        supported = {"page", "header", "sub_header", "sub_sub_header", "text",
                     "quote", "divider", "numbered_list", "bulleted_list", "code"}
        if kind not in supported:
            raise ValueError(f"Unsupported block type {kind!r} at {block_id}; refusing to omit it")
        text = block_text(block, formatted=kind != "code")
        entry = {"id": block_id, "type": kind, "version": block.get("version"),
                 "lastEditedTime": block.get("last_edited_time")}
        indent = "    " * depth
        if kind in {"page", "header", "sub_header", "sub_sub_header"}:
            level = {"page": 1, "header": 1, "sub_header": 2, "sub_sub_header": 3}[kind]
            lines.append(f"\n{'#' * level} {text}\n")
        elif kind == "text":
            lines.append(f"\n{indent}{text}\n")
        elif kind == "quote":
            lines.append("\n" + "\n".join(f"{indent}> {line}" for line in text.split("\n")) + "\n")
        elif kind == "divider":
            lines.append("\n---\n")
        elif kind in {"numbered_list", "bulleted_list"}:
            prefix = f"{number}. " if kind == "numbered_list" else "- "
            lines.append(f"{indent}{prefix}{text}")
        elif kind == "code":
            index = len(code_files) + 1
            if index not in codefile_map:
                raise ValueError(f"Unmapped code block {index} at {block_id}; review extraction mapping")
            fence = "```"
            while fence in text:
                fence += "`"
            lines.append(f"\n{fence}\n{text}\n{fence}\n")
            if codefile_map is CODEFILE_MAP and block_id != EXPECTED_CODE_BLOCK_IDS[index - 1]:
                raise ValueError(f"Code block order or identity changed at {block_id}; review extraction mapping")
            path = codefile_map[index][0]
            code_files.append((path, text))
            entry.update(path=path, textSha256=hashlib.sha256(text.encode()).hexdigest())
        ledger.append(entry)
        counter = 0
        for child in block.get("content", []):
            child_kind = value(blocks.get(child, {})).get("type")
            counter = counter + 1 if child_kind == "numbered_list" else 0
            walk(child, depth + 1 if kind in {"numbered_list", "bulleted_list"} else depth, counter or 1)

    walk(page_id)
    if len(code_files) != len(codefile_map):
        raise ValueError(f"Expected {len(codefile_map)} code blocks, found {len(code_files)}; review extraction mapping")
    result = ("\n".join(lines).strip() + "\n", code_files)
    return (*result, ledger) if return_ledger else result


def write_extraction(data, dest=DEST):
    """Validate the whole page before writing any generated content."""
    if data.get("cursor", {}).get("stack") != []:
        raise ValueError("Snapshot contains an unfinished pagination cursor")
    guide, codes, ledger = render(data["recordMap"], return_ledger=True)
    snapshot = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    outputs = {"references/full-guide.md": guide, "references/source-page.json": snapshot}
    for rel, text in codes:
        # Existing extracted Markdown files use exactly one final newline.
        # The unmodified source text and its hash remain in source-page.json / extraction.json.
        outputs[rel] = text.rstrip("\n") + "\n"
    extraction = {
        "sourceUrl": SOURCE_URL, "pageId": PAGE_ID,
        "snapshot": "references/source-page.json",
        "snapshotSha256": hashlib.sha256(snapshot.encode()).hexdigest(),
        "blockCount": len(ledger), "codeBlockCount": len(codes),
        "blocks": ledger,
        "files": {rel: hashlib.sha256(content.encode()).hexdigest() for rel, content in outputs.items()},
        "codeFileNewlinePolicy": "Preserve source text; normalize terminal newlines to one LF in extracted Markdown files. Raw source text is retained in the snapshot.",
    }
    outputs["references/extraction.json"] = json.dumps(extraction, indent=2, ensure_ascii=False) + "\n"
    source_file = dest / "SOURCE.json"
    if source_file.exists():
        source = json.loads(source_file.read_text(encoding="utf-8"))
        source["extraction"] = {
            "snapshot": extraction["snapshot"],
            "snapshotSha256": extraction["snapshotSha256"],
            "ledger": "references/extraction.json",
            "pageId": PAGE_ID,
            "blockCount": extraction["blockCount"],
            "codeBlockCount": extraction["codeBlockCount"],
        }
        outputs["SOURCE.json"] = json.dumps(source, indent=2, ensure_ascii=False) + "\n"
    for rel, content in outputs.items():
        path = dest / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    return extraction


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, help="Rebuild from a saved complete Notion response instead of fetching")
    args = parser.parse_args()
    data = json.loads(args.snapshot.read_text()) if args.snapshot else fetch()
    extraction = write_extraction(data)
    print(f"wrote {extraction['codeBlockCount']} code files, full-guide.md, source snapshot and ledger ({extraction['blockCount']} blocks)")


if __name__ == "__main__":
    main()
