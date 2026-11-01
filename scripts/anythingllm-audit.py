#!/usr/bin/env python3
"""Audit live AnythingLLM workspace prompts against the repo prompt.txt files.

AnythingLLM workspaces drift when a prompt is updated in this repo but the
matching workspace isn't refreshed (that is how Mark Gonzalez ended up
claiming a CTO title). This tool reports the drift and can repair it.

Usage (from the cloudcore repo root):
  export ANYTHINGLLM_API_KEY=<admin key>
  python3 scripts/anythingllm-audit.py            # report drift
  python3 scripts/anythingllm-audit.py --fix      # push repo prompts to drifted workspaces
  python3 scripts/anythingllm-audit.py --bot mark_gonzalez [--fix]   # single bot

Credentials: ANYTHINGLLM_API_KEY in the environment, or --env-file pointing at
a KEY=VALUE file that contains it (e.g. a deployment instance.env).
"""

import argparse
import ast
import difflib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BOTS_DIR = REPO / "chatbots" / "bots"
MIGRATE = REPO / "scripts" / "anythingllm-migrate.py"


def slug_map():
    """Reuse the migrate script's bot → slug mapping (it contains deliberate
    historic slugs, e.g. elena_chu -> elana_chu). Single source of truth."""
    tree = ast.parse(MIGRATE.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(
            getattr(t, "id", None) == "SLUG_MAP" for t in node.targets
        ):
            return ast.literal_eval(node.value)
    raise SystemExit(f"SLUG_MAP not found in {MIGRATE}")


def load_key(args):
    key = os.environ.get("ANYTHINGLLM_API_KEY", "")
    if key:
        return key
    if args.env_file:
        for line in Path(args.env_file).read_text().splitlines():
            if line.startswith("ANYTHINGLLM_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("Set ANYTHINGLLM_API_KEY (env) or pass --env-file.")


def api(base, key, method, path, payload=None):
    req = urllib.request.Request(
        base + path,
        method=("POST" if payload is not None else "GET"),
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()
            try:
                return r.status, json.loads(body)
            except ValueError:
                return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, {}
    except urllib.error.URLError as e:
        raise SystemExit(f"Cannot reach {base}: {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env-file", help="KEY=VALUE file containing ANYTHINGLLM_API_KEY")
    ap.add_argument("--base-url", default="https://chat.eduserver.au/api/v1")
    ap.add_argument("--bot", help="audit/update a single bot")
    ap.add_argument("--fix", action="store_true", help="push repo prompts to drifted workspaces")
    args = ap.parse_args()

    key = load_key(args)
    slugs = slug_map()
    bots = [args.bot] if args.bot else sorted(slugs)

    drift, missing, matched = [], [], []
    for bot in bots:
        slug = slugs[bot]
        prompt_file = BOTS_DIR / bot / "prompt.txt"
        if not prompt_file.exists():
            print(f"SKIP      {bot}: no prompt.txt in repo")
            continue
        local = prompt_file.read_text()
        status, data = api(args.base_url, key, None, f"/workspace/{slug}")
        if status != 200:
            missing.append(bot)
            print(f"MISSING   {bot} (slug {slug}): workspace not found")
            continue
        # v1 GET wraps the workspace in a list under "workspace"
        ws_list = data.get("workspace") if isinstance(data, dict) else None
        live = (ws_list[0].get("openAiPrompt") or "") if isinstance(ws_list, list) and ws_list else ""
        if live == local:
            matched.append(bot)
            print(f"MATCH     {bot}")
            continue
        diff = list(difflib.unified_diff(
            live.splitlines(), local.splitlines(),
            fromfile=f"live:{bot}", tofile=f"repo:{bot}", lineterm=""))
        changed = sum(1 for l in diff if l[:1] in "+-" and l[:3] not in ("+++", "---"))
        drift.append((bot, slug))
        print(f"DRIFT     {bot} (slug {slug}): {changed} changed lines")
        for line in diff[:6]:
            print("          " + line[:150])

    print(f"\n{len(matched)} match, {len(drift)} drift, {len(missing)} missing")

    if args.fix and drift:
        for bot, slug in drift:
            local = (BOTS_DIR / bot / "prompt.txt").read_text()
            status, data = api(args.base_url, key, None, f"/workspace/{slug}",
                               {"openAiPrompt": local})
            ok = status == 200 and (isinstance(data, dict) and data.get("workspace"))
            if ok:
                print(f"FIXED     {bot} (slug {slug})")
            else:
                print(f"FIX FAIL  {bot} (slug {slug}): HTTP {status} body={str(data)[:200]}")
        print("Re-run without --fix to confirm.")
    elif drift:
        print("Run again with --fix to push repo prompts to the drifted workspaces.")


if __name__ == "__main__":
    main()
