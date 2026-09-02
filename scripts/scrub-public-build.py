#!/usr/bin/env python3
"""Quarto post-render scrub.

1. On the PUBLIC (default) profile, remove docs/ and chatbots/ from the output
   entirely. Quarto copies unrendered sources into the output as site
   resources, so without this the public build would publish the raw gated
   .qmd/.md files verbatim — this scrub is the hard guarantee that a bare
   `quarto render`/`quarto publish` can never ship gated content.
2. On every profile, strip AppleDouble ._* sidecars and .DS_Store (this repo
   lives on exFAT; Finder regenerates them constantly and they otherwise
   deploy).
"""

import os
import shutil
from pathlib import Path

out = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site"))
gated_build = os.environ.get("GATED_BUILD", "") == "1"

if not gated_build:
    for gated in ("docs", "chatbots"):
        target = out / gated
        if target.exists():
            shutil.rmtree(target)
            print(f"scrub: removed {target} (public build)")

junk = 0
for pattern in ("._*", ".DS_Store"):
    for p in out.rglob(pattern):
        if p.is_file():
            p.unlink()
            junk += 1
print(f"scrub: build={'gated' if gated_build else 'public'}, junk files removed={junk}")
