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
- **Styling**: Custom CSS (`styles.css`)
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