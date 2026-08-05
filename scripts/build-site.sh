#!/usr/bin/env bash
# Build both CloudCore site variants.
#
#   public build -> _site/       deploy: quarto publish gh-pages --no-render
#   gated build  -> _site-full/  deploy: rsync to the VPS behind Caddy
#                                        forward_auth (gated.cloudcore.…)
#
# Tier-2 sources (interviews, logs, incident report, breach articles, letters,
# diagrams) are canonical in the PRIVATE simulation-staff repo and are copied
# into the working tree (gitignored paths) for the full render only. The
# public profile never renders docs/ or chatbots/, and the post-render scrub
# guarantees they cannot reach _site/ even as copied resources.
set -euo pipefail
cd "$(dirname "$0")/.."

# --- locate the private simulation-staff checkout ---------------------------
STAFF="${SIMULATION_STAFF:-}"
for c in ../simulation-staff ../../simulation-staff; do
    [ -z "$STAFF" ] && [ -d "$c/cloudcore/site-gated" ] && STAFF="$c"
done
if [ -z "$STAFF" ] || [ ! -d "$STAFF/cloudcore/site-gated" ]; then
    echo "ERROR: simulation-staff checkout not found (set SIMULATION_STAFF=...)" >&2
    exit 1
fi

# --- 1) copy gated sources in (paths are gitignored here) -------------------
rsync -a --exclude '._*' --exclude '.DS_Store' "$STAFF/cloudcore/site-gated/docs/" docs/
echo "gated sources copied from $STAFF"

# --- 2) full render (VPS) ---------------------------------------------------
GATED_BUILD=1 quarto render --output-dir _site-full

# --- 3) public render (GitHub Pages) ----------------------------------------
quarto render --profile public

echo
echo "Builds complete:"
echo "  _site/       public  -> quarto publish gh-pages --no-render"
echo "  _site-full/  gated   -> rsync -av --delete _site-full/ <vps>:<gated-site-root>/"
