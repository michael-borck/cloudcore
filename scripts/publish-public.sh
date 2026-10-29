#!/usr/bin/env bash
# Publish the public build (_site/) to gh-pages WITHOUT `quarto publish`.
#
# quarto publish materialises AppleDouble ._ sidecars into the deploy commit
# when the project lives on exFAT; a clean worktree on the APFS temp volume
# cannot reproduce them. Requires `quarto render --profile public` first
# (scripts/build-site.sh does this as its second render).
set -euo pipefail
cd "$(dirname "$0")/.."

SITE="$(pwd)/_site"
WT="${TMPDIR:-/tmp}/cloudcore-gh-pages-$$"
BRANCH=gh-pages

# _site must exist (and the post-render scrub guarantees it is junk-free).
[ -f "$SITE/index.html" ] || {
    echo "ERROR: render _site first (quarto render --profile public)" >&2
    exit 1
}

cleanup() { git worktree remove --force "$WT" 2>/dev/null || true; }
trap cleanup EXIT

git worktree prune
git worktree add "$WT" "$BRANCH"

# .git must be excluded or --delete severs the worktree's repo link; .nojekyll
# is kept from the branch (quarto publish added it originally). Excluded files
# survive --delete, so any AppleDouble junk in the worktree is swept after.
rsync -a --delete --exclude '.git' --exclude '.nojekyll' "$SITE/" "$WT/"
find "$WT" \( -name '._*' -o -name '.DS_Store' \) -delete
touch "$WT/.nojekyll"

cd "$WT"
git add -A
if git diff --cached --quiet; then
    echo "gh-pages already up to date"
else
    git commit -q -m "Built site for gh-pages"
    git push origin "$BRANCH"
    echo "Published to $BRANCH"
fi
