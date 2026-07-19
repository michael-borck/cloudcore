#!/usr/bin/env python3
"""
CloudCore Networks — policy document-control date refresher.

Refreshes ONLY the header document-control dates in docs/policies/*.md so the
spread is coherent with "now" = 2026:
  - **Date** (last reviewed): lifted to >= 2024 (nothing looks ancient)
  - **Next Review**: set to Date + 1 year  (so by 2026 most are overdue — a
    realistic, findable ISMS "policy review lapse" for a company still
    *pursuing* ISO 27001)

Does NOT touch: Supersedes rows, inline prose dates (e.g. "migrated Dec 2023"),
version numbers, or the deliberately-DRAFT data_classification policy.
Re-runnable. Dry-run by default; --write to apply.
"""
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POLICY_DIR = ROOT / "docs" / "policies"
SKIP = {"data_classification.md"}  # intentionally DRAFT / pending approval

DATE_ROW = re.compile(r"(\|\s*\*\*Date\*\*\s*\|\s*)(\d{2})-(\d{2})-(\d{4})")
NEXT_ROW = re.compile(r"(\|\s*\*\*Next Review\*\*\s*\|\s*)(\d{2})-(\d{2})-(\d{4})")


def refresh(dry: bool) -> int:
    touched = 0
    for p in sorted(POLICY_DIR.glob("*.md")):
        if p.name in SKIP:
            print(f"  SKIP (draft): {p.name}")
            continue
        text = p.read_text(encoding="utf-8")
        m = DATE_ROW.search(text)
        if not m:
            print(f"  SKIP (no Date header): {p.name}")
            continue
        dd, mm, yy = m.group(2), m.group(3), int(m.group(4))
        new_yy = max(yy, 2024)
        new_date = f"{dd}-{mm}-{new_yy}"
        new_review = f"{dd}-{mm}-{new_yy + 1}"

        out = DATE_ROW.sub(lambda mo, rep=new_date: mo.group(1) + rep, text, count=1)
        before = out
        out = NEXT_ROW.sub(lambda mo, rep=new_review: mo.group(1) + rep, out, count=1)
        if out != text:
            kind = "Date" + (", NextReview" if NEXT_ROW.search(before) else "")
            print(f"  {p.name}: {kind} -> {new_date} / review {new_review}")
            if not dry:
                p.write_text(out, encoding="utf-8")
            touched += 1
    return touched


if __name__ == "__main__":
    dry = "--write" not in sys.argv
    print(f"Refresh policy dates ({'DRY RUN' if dry else 'WRITING'})")
    n = refresh(dry)
    print(f"\nPolicies touched: {n} ({'not written — pass --write' if dry else 'written'})")
