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
- **Scripts**: Custom JavaScript for access control (`scripts/simple-timeline-access.js`, `scripts/password.js`)
- **Chatbot Integration**: AnythingLLM embedded widgets

### Project Structure
- `_quarto.yml` - Main configuration defining site structure, navigation, and theme
- `/blog/` - Blog posts with categories and listings
- `/chatbots/` - Character-based chatbot interfaces for staff/client personas
- `/docs/` - Documentation including policies, interviews, articles, and logs
- `/_backstories/` - Character backgrounds and scenario documentation
- `/data/` - CSV files with financial data for educational scenarios
- `/assets/` - Images and media files
- `/_extensions/` - Quarto extensions (lordicon for animated icons)

### Key Implementation Details
1. **Access Control**: JavaScript-based time restrictions (business hours only) and password protection for certain pages
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
- Password visible in `scripts/password.js`: `GottaCatchEmAll!2024`
- Client-side access control can be bypassed
- Educational platform - security weaknesses may be intentional for teaching purposes

## Content Types
- **Blog Posts**: Technical articles in `/blog/posts/`
- **Character Profiles**: Staff and client personas in `/chatbots/bots/`
- **Policy Documents**: Security and compliance policies in `/docs/policies/`
- **Interview Transcripts**: Scenario-based interviews in `/docs/interviews/`
- **System Documentation**: ERD, network diagrams, org charts in `/docs/support/`