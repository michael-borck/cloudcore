# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudCore Networks is an educational platform built with Quarto static site generator. It simulates a fictional cloud services company to teach cybersecurity, web design, and systems analysis concepts.

## Commands

### Development
- `quarto preview` - Start local development server with live reload
- `quarto render` - Build the static site for production

### Git Operations
- Standard git workflow applies - no pre-commit hooks detected

## Architecture

### Technology Stack
- **Static Site Generator**: Quarto with Cosmo HTML theme
- **Content Format**: Quarto Markdown (`.qmd` files)
- **Styling**: Custom CSS design system (`styles.css`) layered over the Cosmo theme — "Refined Light" direction with an Electric Blue accent (#2563eb / #06b6d4)
- **Typography**: Inter (sans) + JetBrains Mono (code), loaded via Google Fonts in `_quarto.yml` `include-in-header`
- **Brand mark**: `assets/logo.svg` (network/constellation glyph); set via `website.navbar.logo`, wordmark injected by `.navbar-brand-logo::after` in CSS
- **Scripts**: Custom JavaScript for access control (`scripts/simple-timeline-access.js` — the only gating script actually loaded; see Access Control below)
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
1. **Access Control**: JavaScript-based time restrictions (business hours only) and password gating on `/docs/` and `/chatbots/`. Client-side only and trivially bypassed — see Security Considerations before relying on it
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

**Access control is presentational, not enforcement.** `simple-timeline-access.js`
stashes `document.body.innerHTML`, then overwrites the body with a login form —
the full protected content is already in the delivered HTML. View-source,
disabling JS, or restoring `window.originalContent` from the console bypasses it
completely. The password check is an object lookup against a list shipped in the
same file, and the auth token is a forgeable client-side timestamp in
`localStorage`. Treat it as a workflow speed-bump for students following the
scenario. **Anything that must not be read must not be rendered into `_site/` at
all.**

**Known bug:** `loadAccessConfig()` fetches `/config/unit-access.json`, but
`config/` is not in `_quarto.yml` `resources:` and so is absent from `_site/`.
That fetch 404s in production and the site always falls back to
`LEGACY_UNIT_SCHEDULES`. The per-unit allow/deny rules in the JSON never take
effect on the deployed site.

Unit passwords are duplicated in `config/unit-access.json` and as the fallback in
`simple-timeline-access.js` — change both, and note they are shared with students
by design and unavoidably public in the deployed JS.

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