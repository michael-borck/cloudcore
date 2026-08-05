# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudCore Networks is an educational platform built with Quarto static site generator. It simulates a fictional cloud services company to teach cybersecurity, web design, and systems analysis concepts.

## Commands

### Development
- `quarto preview` - Start local development server with live reload
- `quarto render` - Build the PUBLIC site (gated sections are scrubbed from the output)
- `scripts/build-site.sh` - Build both variants: `_site/` (public, GitHub Pages) and `_site-full/` (gated, rsync to the VPS). Requires a private `simulation-staff` checkout as a sibling.

### Git Operations
- Standard git workflow applies - no pre-commit hooks detected

## Architecture

### Technology Stack
- **Static Site Generator**: Quarto with Cosmo HTML theme
- **Content Format**: Quarto Markdown (`.qmd` files)
- **Styling**: Custom CSS design system (`styles.css`) layered over the Cosmo theme — "Refined Light" direction with an Electric Blue accent (#2563eb / #06b6d4)
- **Typography**: Inter (sans) + JetBrains Mono (code), loaded via Google Fonts in `_quarto.yml` `include-in-header`
- **Brand mark**: `assets/logo.svg` (network/constellation glyph); set via `website.navbar.logo`, wordmark injected by `.navbar-brand-logo::after` in CSS
- **Scripts**: `scripts/session-gate.js` (unit gate UX; enforcement is server-side, see Access Control below), plus the badge-keyed booking trio (`booking-api.js`, `booking-modal.js`, `chatbot-booking.js`)
- **Chatbot Integration**: AnythingLLM embedded widgets

### Project Structure
- `_quarto.yml` - Main configuration defining site structure, navigation, and theme
- `/blog/` - Blog posts with categories and listings
- `/chatbots/` - Character-based chatbot interfaces for staff/client personas
- `/docs/` - Documentation including policies, interviews, articles, and logs
- `/chatbots/_backstories/` - Character persona ground truth. **Untracked and gitignored** — present on disk only (see Security Considerations)
- `/data/` - CSV files with financial data for educational scenarios
- `/assets/` - Images and media files
- `/_extensions/` - Quarto extensions (lordicon for animated icons)

### Key Implementation Details
1. **Access Control**: SERVER-SIDE since Aug 2026. The public Pages build contains no `/docs/` or `/chatbots/` at all; those live on `gated.cloudcore.eduserver.au`, served from the VPS behind Caddy `forward_auth` → cloudcore-api `/session/verify` (unit password → HttpOnly cookie via `POST /session`; per-unit visibility rules and staged release evaluated server-side). Bookings/chat identity is an issued badge code via sim-booking-api. `session-gate.js` is UX only
2. **Content Organization**: Uses Quarto's listing feature for blog and chatbot directories
3. **Navigation**: Multi-level navbar with dropdown menus for documentation sections
4. **Chatbot Integration**: Each character has an embedded AnythingLLM chat widget with unique embed IDs

### Theme & Design System (`styles.css`)
All visual styling is driven by CSS custom properties at `:root` (tokens for color, radius, shadow, type, motion). When changing the look, edit tokens — not individual rules. Key conventions:
- **Palette**: ink `#0f172a`, accent `#2563eb`, hairline borders `#e2e8f0`, surfaces on `#f8fafc`. The purple/blue gradient that used to cover the navbar/footer/buttons has been retired in favour of flat surfaces + a single accent; gradients appear only as the hero mesh and the featured-plan accent bar.
- **Cards**: 1px hairline border + 12px radius; hover swaps border to accent and adds a soft shadow (no global lift).
- **Avatars** (leadership headshots): `.card img` is forced to a 116px circle via `border-radius: 50% !important` (Bootstrap's `.rounded` utility is `!important`, so the override must be too).
- **Footer**: rendered by Quarto as `.nav-footer` (NOT `.page-footer`); background comes from `_quarto.yml` `page-footer.background`, link/heading colours from `.nav-footer` rules.
- **Gated pages** (docs/chatbots): content is hidden by `scripts/simple-timeline-access.js` outside business hours — the "Outside Business Hours" state is expected, not a styling bug.

### Security Considerations

**This repo is PUBLIC** (`github.com/michael-borck/cloudcore`) and publishes a
`gh-pages` branch. Two consequences that are easy to get wrong:

1. **A leading underscore hides a directory from Quarto, not from GitHub.** It
   keeps content out of the rendered site while leaving it fully browsable in the
   repo. `_instructor/` (lecturer guides, `reference-*.qmd` model answers) and
   `chatbots/_backstories/` (persona ground truth students are meant to uncover by
   interviewing the bots) were both exposed this way. Both are now **untracked and
   gitignored** — they live on disk only. Do not re-add them.
2. **Never commit a real secret here.** An AnythingLLM admin key was committed,
   served live off `gh-pages`, and required a full history rewrite. The migrate
   scripts now read `ANYTHINGLLM_API_KEY` from the environment; keep it that way.

**Access control is server-side (Aug 2026 cutover).** The old client-side gate
(`simple-timeline-access.js`, `unit-access.js`, `staged-access.js`) and
`config/unit-access.json` are deleted and purged from history. No passwords ship
in any JS. Tier-2 sources (interviews, logs, incident report, breach articles,
letters, diagrams) are canonical in the private `simulation-staff` repo under
`cloudcore/site-gated/`; `scripts/build-site.sh` copies them in (gitignored
paths) for the full render only, and `scripts/scrub-public-build.py`
(post-render) deletes `docs/` and `chatbots/` from any output built without
`GATED_BUILD=1` — that scrub is the enforcement point, because Quarto merges
profile render arrays AND copies unrendered sources into the output as
resources. Do not weaken either behaviour.

Unit passwords now live only in cloudcore-api's database (managed by lecturers,
rotated per semester). Student identity for bookings is an issued badge code
(sim-booking-api); the system stores no student PII.

Educational platform — some security weaknesses are intentional teaching
artifacts (e.g. the SQL-injection payload in `docs/scenarios/`). Distinguish those
from real operational secrets before "fixing" anything.

### Working on an exFAT volume

This repo lives on an exFAT SSD, which has no resource forks, so Finder writes
AppleDouble `._*` sidecars next to every file — including inside `.git/objects/`,
where git tries to read `._pack-*.idx` as a real pack index and emits
`non-monotonic index` errors. They are ignored via `.gitignore` and
`.quartoignore` (without the latter, `resources:` copies them into `_site/` and
deploys them). To clear them:

```bash
find . -path ./.git -prune -o \( -name '._*' -o -name '.DS_Store' \) -type f -print0 | xargs -0 rm -f
find .git \( -name '._*' -o -name '.DS_Store' \) -type f -delete
```

## Content Types
- **Blog Posts**: Technical articles in `/blog/posts/`
- **Character Profiles**: Staff and client personas in `/chatbots/bots/`
- **Policy Documents**: Security and compliance policies in `/docs/policies/`
- **Interview Transcripts**: Scenario-based interviews in `/docs/interviews/`
- **System Documentation**: ERD, network diagrams, org charts in `/docs/support/`