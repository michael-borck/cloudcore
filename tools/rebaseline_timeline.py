#!/usr/bin/env python3
"""
CloudCore Networks — timeline re-baseline tool.

Shifts the breach-event dates forward by one year (canon: 2024 -> 2025) across
the breach-canon files ONLY, using date-scoped patterns so unrelated 2024
references (policy version dates, CVE IDs) are never touched.

Re-runnable: bump TARGET_YEAR and the source list to re-baseline again later
(e.g. for 2027 teaching). Dry-run by default; pass --write to apply.

Usage:
    python3 scripts/rebaseline_timeline.py            # show planned changes
    python3 scripts/rebaseline_timeline.py --write     # apply them
"""
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Files that carry breach-event dates. Only these are touched.
TARGETS = [
    "docs/articles/data_breach_initial_report.md",
    "docs/articles/data_breach_customer_reactions.md",
    "docs/articles/data-breach_industry_analysis.md",
    "docs/articles/data_breach_technical_analysis.md",
    "docs/articles/data_breach_risk_analysis.md",
    "docs/articles/data_breach_recommendations_post_breach.md",
    "docs/support/incident_report.md",
    "docs/support/letter_exec_summary_board_of_directors.md",
    "docs/support/letter_internal_eployees.md",
    "docs/support/letter_notification_customers.md",
    "docs/support/threat-intellegiance-feed.md",
    "chatbots/_backstories/data_breach_overview.md",
    "chatbots/_backstories/reputation_recovery_plan.md",
]

# (pattern, replacement) — all date-scoped. Order matters.
RULES = [
    (re.compile(r"September\s+(\d{1,2}(?:-\d{1,2})?),\s*2024"), r"September \1, 2025"),
    (re.compile(r"September\s+2024"), "September 2025"),
    (re.compile(r"\bCCN-BR-0924\b"), "CCN-BR-0925"),  # incident ID year-stamp
]


def apply(dry_run: bool) -> int:
    changes = 0
    for rel in TARGETS:
        p = ROOT / rel
        if not p.exists():
            print(f"  SKIP (missing): {rel}")
            continue
        text = p.read_text(encoding="utf-8")
        new, n = text, 0
        for pat, rep in RULES:
            new, k = pat.subn(rep, new)
            n += k
        if n:
            print(f"  {rel}: {n} replacement(s)")
            if not dry_run:
                p.write_text(new, encoding="utf-8")
            changes += n
    return changes


if __name__ == "__main__":
    dry = "--write" not in sys.argv
    print(f"Re-baseline breach dates 2024 -> 2025 ({'DRY RUN' if dry else 'WRITING'})")
    total = apply(dry)
    print(f"\nTotal replacements: {total} ({'not written — pass --write to apply' if dry else 'written'})")
