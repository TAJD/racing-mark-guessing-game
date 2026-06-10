# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based racing mark guessing game focused on the Solent (UK waters). Players identify highlighted racing marks on an interactive map using context clues and geographical knowledge. The game features multiple difficulty levels, time limits, scoring, and statistics.

## Key Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (TypeScript compilation + Vite build)
- `pnpm preview` - Build and preview with Wrangler (Cloudflare Workers)
- `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with UI
- `pnpm lint` - Lint code
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm ci` - Run full CI pipeline (format check, lint, test, build)

## Architecture

### Core Components

- **App.tsx** - Main application entry with game configuration and start screen
- **GameController.tsx** - Central game state management, question generation, and timer logic
- **GuessMode.tsx** - Question display and answer selection interface
- **OpenSeaMapContainer.tsx** - Interactive Leaflet map with racing marks
- **ScoreDisplay.tsx** - Real-time score and timer display

### Game Logic

- **gameLogic.ts** - Question generation, scoring, difficulty management, and statistics
- **gpxParser.ts** - Racing mark data processing and geographical utilities
- **marks.ts** - Racing mark data loading and management

### Key Features

- Progressive difficulty (beginner/intermediate/advanced) with different mark sets
- Time-based scoring with bonuses and streak multipliers
- Interactive map with OpenSeaMap nautical chart layers
- Context marks shown to aid identification
- Game statistics and grading system
- Cloudflare Workers deployment for global performance

### Data Structure

Racing marks are loaded from GPX data and contain:

- `id`, `name`, `lat`, `lon` coordinates
- `symbol` (mark color/type: R, G, Y, B, RW, YBY, etc.)
- `description` and optional `sponsor` information
- Difficulty classification for question generation

### Testing

- Vitest with React Testing Library
- Happy DOM environment
- Mock setup for browser APIs (matchMedia, ResizeObserver)
- Component and utility function tests

### Deployment

Configured for Cloudflare Workers with:

- SPA routing for client-side navigation
- Asset optimization and chunking
- TypeScript compilation and bundling


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
