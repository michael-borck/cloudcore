#!/usr/bin/env python3
"""
CloudCore Networks — Artefact Registry generator.

Reads config/registry-manifest.yml (the INTENT source of truth), scans the repo
(docs/, chatbots/bots/, chatbots/_backstories/, data/) to:

  (a) confirm each manifest path exists          -> warn on MISSING
  (b) catch ORPHANED files not listed            -> report (never an error)
  (c) extract a date per file where findable     -> policy 'Date' table row,
                                                   article 'Date:' prose,
                                                   else file mtime (ISO)
  (d) emit docs/registry.qmd grouped BY UNIT,    -> path/topic/distractor/date
      plus a stats summary (counts per unit,
      # distractors, # orphans).

docs/registry.qmd is GENERATED. Regenerate via:
    python3 scripts/generate_registry.py

Robust to files appearing/disappearing at run time: parallel agents create
files concurrently and the main agent re-runs this at the end. Missing manifest
paths are warned (expected for pending parallel dirs); unlisted files are
reported as orphans.

Author: Registry tooling pass. British spelling throughout the output.
"""

from __future__ import annotations

import re
import sys
import datetime as dt
from pathlib import Path

try:
    import yaml  # PyYAML
except ImportError as exc:  # pragma: no cover
    sys.stderr.write("PyYAML is required: pip install pyyaml\n")
    raise SystemExit(1) from exc

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent          # repo root
MANIFEST = ROOT / "config" / "registry-manifest.yml"
OUTPUT = ROOT / "_instructor" / "registry.qmd"

# The directories the scanner sweeps for content + orphan detection.
SCAN_ROOTS = ["docs", "chatbots/bots", "chatbots/_backstories", "data"]

# Extensions treated as "content" (everything else is ignored as chrome/assets).
CONTENT_EXTS = {".md", ".qmd", ".txt", ".csv"}

# Canonical unit order for the generated page.
UNIT_ORDER = ["ISYS6018", "ISYS6014", "ISYS6020", "ISYS2002", "ISAD5001"]

# Date extraction patterns (tried in order).
#   1. doc-control table row:  | **Date**     | 15-03-2024 |
#   2. prose bold line:        **Date:** September 13, 2024
RE_DATE_TABLE = re.compile(r"\|\s*\*\*Date\*\*\s*\|\s*([^|\n]+?)\s*\|")
RE_DATE_PROSE = re.compile(r"\*\*Date:\*\*\s*(.+?)\s*$", re.MULTILINE)


# ---------------------------------------------------------------------------
# Glob helpers (path-aware, with brace expansion; `**` spans directories)
# ---------------------------------------------------------------------------

def expand_braces(pattern: str) -> list[str]:
    """Expand a single `{a,b,c}` group into a list of patterns (one level)."""
    m = re.search(r"\{([^{}]+)\}", pattern)
    if not m:
        return [pattern]
    head, opts, tail = pattern[: m.start()], m.group(1).split(","), pattern[m.end():]
    out: list[str] = []
    for opt in opts:
        out.extend(expand_braces(head + opt + tail))
    return out


# ---------------------------------------------------------------------------
# File-system helpers
# ---------------------------------------------------------------------------

def is_noise(name: str) -> bool:
    """Dotfiles and macOS AppleDouble (`._*`) entries are never content."""
    return name.startswith(".") or name.startswith("._")


def content_files_under(directory: Path) -> list[Path]:
    """All content files (by extension) under `directory`, skipping noise."""
    if not directory.is_dir():
        return []
    found: list[Path] = []
    for p in directory.rglob("*"):
        if p.is_file() and p.suffix.lower() in CONTENT_EXTS and not is_noise(p.name):
            found.append(p)
    return sorted(found)


def scan_all_content() -> list[Path]:
    """Every content file across SCAN_ROOTS (used for orphan detection)."""
    out: list[Path] = []
    for rel in SCAN_ROOTS:
        out.extend(content_files_under(ROOT / rel))
    # de-dup while preserving order
    seen, uniq = set(), []
    for p in out:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)
    return sorted(uniq)


# ---------------------------------------------------------------------------
# Date extraction
# ---------------------------------------------------------------------------

def extract_date(path: Path) -> tuple[str | None, str]:
    """
    Return (date_text, source) where source in {'content', 'mtime'}.
    Tries the doc-control table 'Date' row, then a bold '**Date:**' prose line,
    then falls back to the file's modification time (ISO YYYY-MM-DD).
    """
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        text = ""

    if text:
        m = RE_DATE_TABLE.search(text)
        if not m:
            m = RE_DATE_PROSE.search(text)
        if m:
            val = m.group(1).strip().strip("*").strip()
            # drop a trailing table cell artefact if any slipped through
            val = val.split("|")[0].strip()
            if val:
                return val, "content"

    try:
        iso = dt.datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()
    except OSError:
        iso = "????-??-??"
    return f"{iso} (file mtime)", "mtime"


# ---------------------------------------------------------------------------
# Manifest resolution
# ---------------------------------------------------------------------------

def merge_filemeta(accumulator: dict, rel: str, entry: dict, units_doc: dict) -> None:
    """Merge one entry's metadata into the per-file record for `rel`."""
    rec = accumulator.setdefault(
        rel,
        {"units": set(), "topics": set(), "distractor": False, "notes": []},
    )
    for u in entry.get("units", []) or []:
        if u not in units_doc:
            sys.stderr.write(f"  [warn] unknown unit '{u}' in entry for {rel}\n")
        rec["units"].add(u)
    for t in entry.get("topics", []) or []:
        rec["topics"].add(t)
    if entry.get("distractor"):
        rec["distractor"] = True
    note = entry.get("notes")
    if note:
        rec["notes"].append(str(note).strip())


def resolve_manifest(manifest: dict, units_doc: dict):
    """
    Returns:
      filemeta : dict[rel_path_str -> {units, topics, distractor, notes}]
      missing  : list[str]   manifest paths that do not exist on disk
    """
    filemeta: dict = {}
    missing: list[str] = []

    for entry in manifest.get("entries", []) or []:
        raw_path = entry.get("path")
        if not raw_path:
            sys.stderr.write("  [warn] manifest entry without a 'path' — skipped\n")
            continue

        target = ROOT / raw_path

        # --- directory group: expand with pathlib glob -----------------------
        if target.is_dir():
            # pathlib glob treats `**/*.md` the standard way (matches files at
            # the directory root AND in subdirectories), so we do not hand-roll
            # matching here.
            globs = entry.get("glob", "**/*")
            if isinstance(globs, str):
                globs = [globs]
            matched: set = set()
            for pat in set(expand_braces_multi(globs)):
                for p in target.glob(pat):
                    if p.is_file() and p.suffix.lower() in CONTENT_EXTS and not is_noise(p.name):
                        matched.add(p)
            for f in sorted(matched):
                merge_filemeta(filemeta, f.relative_to(ROOT).as_posix(), entry, units_doc)
            continue

        # --- single file -------------------------------------------------------
        if target.is_file():
            if not is_noise(target.name):
                merge_filemeta(filemeta, target.relative_to(ROOT).as_posix(), entry, units_doc)
        else:
            missing.append(raw_path)

    return filemeta, missing


def expand_braces_multi(patterns: list[str]) -> list[str]:
    out: list[str] = []
    for p in patterns:
        out.extend(expand_braces(p))
    return out


# ---------------------------------------------------------------------------
# Orphan detection
def build_ignored_set(manifest: dict) -> set[str]:
    """Resolve every `ignore:` rule to concrete on-disk relative paths."""
    ignored: set[str] = set()
    for pat in manifest.get("ignore", []) or []:
        for expanded in expand_braces(pat):
            for p in ROOT.glob(expanded):
                if p.is_file():
                    ignored.add(p.relative_to(ROOT).as_posix())
    return ignored


def find_orphans(all_content: list[Path], filemeta: dict, ignored: set[str]) -> list[str]:
    mapped = set(filemeta.keys())
    orphans: list[str] = []
    for p in all_content:
        rel = p.relative_to(ROOT).as_posix()
        if rel in mapped or rel in ignored:
            continue
        orphans.append(rel)
    return sorted(orphans)


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

UNIT_TITLES = {
    "ISYS6018": "Information Security Audit and Control",
    "ISYS6014": "AI-Driven Knowledge Systems",
    "ISYS6020": "AI in Business Strategy",
    "ISYS2002": "Systems Analysis",
    "ISAD5001": "Systems Analysis",
}


def md_escape_cell(s: str) -> str:
    """Escape pipe characters inside a markdown table cell."""
    return s.replace("|", "\\|")


def render(filemeta: dict, orphans: list[str], missing: list[str],
           units_doc: dict, generated_on: str) -> str:
    # attach a date to every mapped file
    rows: dict[str, dict] = {}
    for rel, meta in filemeta.items():
        date_text, _src = extract_date(ROOT / rel)
        rows[rel] = {**meta, "date": date_text, "rel": rel}

    # counts per unit
    per_unit = {u: 0 for u in UNIT_ORDER}
    for meta in rows.values():
        for u in meta["units"]:
            per_unit[u] = per_unit.get(u, 0) + 1

    total = len(rows)
    n_distractors = sum(1 for m in rows.values() if m["distractor"])

    lines: list[str] = []
    lines.append("---")
    lines.append('title: "Artefact Registry"')
    lines.append("---")
    lines.append("")
    lines.append("::: {.callout-note}")
    lines.append("## Generated page — do not hand-edit")
    lines.append(
        "This registry is **generated** by `scripts/generate_registry.py` from "
        "`config/registry-manifest.yml` (the source of truth for intent). "
        "Regenerate it with:"
    )
    lines.append("")
    lines.append("```bash")
    lines.append("python3 scripts/generate_registry.py")
    lines.append("```")
    lines.append(f"Last generated: {generated_on}.")
    lines.append(":::")
    lines.append("")
    lines.append(
        "This registry maps every CloudCore teaching artefact to the course "
        "unit(s) and topic(s) it serves and flags any **distractors** "
        "(plausible-but-misleading evidence used in the audit simulation). An "
        "artefact may serve more than one unit and therefore appears under each "
        "unit it maps to. British spelling is used throughout (`Artefact`, "
        "`organisation`)."
    )
    lines.append("")

    # --- distractor callout -------------------------------------------------
    distractor_rows = sorted((rel for rel, m in rows.items() if m["distractor"]), key=str.lower)
    lines.append("::: {.callout-warning}")
    lines.append(f"## Distractors flagged ({len(distractor_rows)})")
    lines.append(
        "These artefacts are marked `distractor: true` in the manifest. They are "
        "deliberate decoys for the audit simulation and must not be read as canon."
    )
    lines.append("")
    if distractor_rows:
        for rel in distractor_rows:
            lines.append(f"- `{rel}`")
    else:
        lines.append("_No distractor files found yet (pending `docs/distractors/`)._")
    lines.append(":::")
    lines.append("")

    # --- summary ------------------------------------------------------------
    lines.append("## Summary")
    lines.append("")
    lines.append("| Metric | Count |")
    lines.append("|---|---:|")
    lines.append(f"| Distinct artefacts mapped | {total} |")
    lines.append(f"| Artefacts flagged as distractors | {n_distractors} |")
    lines.append(f"| Unmapped files (orphans) | {len(orphans)} |")
    lines.append(f"| Manifest paths missing on disk | {len(missing)} |")
    lines.append("")
    lines.append("**Artefacts per unit**")
    lines.append("")
    lines.append("| Unit | Name | Artefacts |")
    lines.append("|---|---|---:|")
    for u in UNIT_ORDER:
        if per_unit.get(u, 0) or u in units_doc:
            lines.append(f"| `{u}` | {UNIT_TITLES.get(u, units_doc.get(u, ''))} | {per_unit.get(u, 0)} |")
    lines.append("")

    # --- per-unit sections --------------------------------------------------
    for u in UNIT_ORDER:
        unit_rows = sorted(
            (m for m in rows.values() if u in m["units"]),
            key=lambda m: m["rel"].lower(),
        )
        if not unit_rows:
            continue
        lines.append(f"## `{u}` — {UNIT_TITLES.get(u, units_doc.get(u, ''))}")
        lines.append("")
        lines.append("| Artefact | Topics | Distractor | Date |")
        lines.append("|---|---|:---:|---|")
        for m in unit_rows:
            topics = md_escape_cell(", ".join(sorted(m["topics"]))) or "—"
            distractor = "⚠ Yes" if m["distractor"] else "No"
            date = md_escape_cell(m["date"]) or "—"
            lines.append(f"| `{md_escape_cell(m['rel'])}` | {topics} | {distractor} | {date} |")
        lines.append("")

    # --- orphans ------------------------------------------------------------
    lines.append("## Unmapped files (orphans)")
    lines.append("")
    lines.append(
        "Files found under the scanned roots (`docs/`, `chatbots/bots/`, "
        "`chatbots/_backstories/`, `data/`) that match **no** manifest entry. "
        "Add an entry to `config/registry-manifest.yml` (or an `ignore:` rule for "
        "site chrome) to resolve them."
    )
    lines.append("")
    if orphans:
        for rel in orphans:
            lines.append(f"- `{rel}`")
    else:
        lines.append("_None — every scanned content file is mapped._")
    lines.append("")

    # --- missing ------------------------------------------------------------
    if missing:
        lines.append("## Manifest paths not yet on disk")
        lines.append("")
        lines.append(
            "These manifest entries point at paths that do not exist yet. This is "
            "expected for the parallel directories (`docs/distractors/`, "
            "`docs/systems-analysis/`, `docs/strategy/`, `docs/diagrams/`) until "
            "the sibling agents finish, and harmless for individual pending files."
        )
        lines.append("")
        for rel in sorted(missing, key=str.lower):
            lines.append(f"- `{rel}`")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    if not MANIFEST.is_file():
        sys.stderr.write(f"FATAL: manifest not found at {MANIFEST}\n")
        return 2

    with MANIFEST.open(encoding="utf-8") as fh:
        manifest = yaml.safe_load(fh) or {}

    units_doc = manifest.get("units", {}) or {}

    filemeta, missing = resolve_manifest(manifest, units_doc)

    all_content = scan_all_content()
    ignored = build_ignored_set(manifest)
    orphans = find_orphans(all_content, filemeta, ignored)

    generated_on = dt.datetime.now().replace(microsecond=0).isoformat(timespec="seconds")
    text = render(filemeta, orphans, missing, units_doc, generated_on)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(text, encoding="utf-8")

    # console summary
    print(f"[registry] wrote {OUTPUT.relative_to(ROOT)}")
    print(f"[registry] mapped artefacts : {len(filemeta)}")
    print(f"[registry] orphans         : {len(orphans)}")
    print(f"[registry] missing paths   : {len(missing)}")
    per_unit = {u: 0 for u in UNIT_ORDER}
    for meta in filemeta.values():
        for u in meta["units"]:
            per_unit[u] = per_unit.get(u, 0) + 1
    for u in UNIT_ORDER:
        print(f"[registry]   {u}: {per_unit[u]}")
    if orphans:
        print("[registry] orphans:")
        for o in orphans:
            print(f"[registry]   - {o}")
    if missing:
        print("[registry] missing manifest paths:")
        for m in missing:
            print(f"[registry]   - {m}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
