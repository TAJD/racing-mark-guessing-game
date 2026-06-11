# Session: UX polish — results screen, play again, persistent stats

You are working in the git worktree `C:\Users\tajdi\racing-mark-guessing-game\ux-polish` on branch `fix/ux-polish`. This is a React + TypeScript + Vite racing-mark guessing game. The repo uses beads (`bd`) for issue tracking — the worktree shares the main repo's beads DB.

Two other Claude sessions work in parallel on sibling worktrees: `core-logic` (game logic — the state updaters, timer, question generation, config loading in `App.tsx:11-33`) and `map-perf` (`OpenSeaMapContainer.tsx`). **To minimize merge conflicts: do not touch `gameLogic.ts`, `gpxParser.ts`, `OpenSeaMapContainer.tsx`, the timer/scoring logic in `GameController.tsx`, or the `getInitialConfig` block in `App.tsx`. Your domain is the rendered JSX of the game-over screen and in-game header, the play-again flow, and stats persistence.**

## Setup

```
pnpm install
```

## Your beads (claim each with `bd update <id> --claim` before starting, `bd close <id>` when done)

1. **racing-mark-guessing-game-p4c** (P2) — Restyle the game-over screen (`GameController.tsx` ~lines 272-383) and the in-game header (~lines 400-408) to match the yacht-club aesthetic of the start screen in `App.tsx` (see commit 7b13c21): navy `#1B2A4A`, gold `#C9A962`, warm off-whites `#FDFCFB`/`#F8F7F5`, border `#E8E6E1`, serif headings, restrained spacing — replacing the old blue-gradient + emoji style. Keep all displayed stats; replace emoji grade badges with typographic/SVG treatments consistent with the start screen's flag icon.
2. **racing-mark-guessing-game-1cb** (P2) — "Play Again" currently does `window.location.reload()` (`GameController.tsx:357`). Make it start a fresh game directly without a page reload (e.g. lift a `key` remount or an `onPlayAgain` callback up to `App.tsx`), and add a secondary "Change Settings" action that returns to the start screen (`setGameStarted(false)` in App).
3. **racing-mark-guessing-game-6nn** (P2) — Persist stats: `App.tsx`'s `handleGameEnd` only `console.log`s. Store game history (score, accuracy, grade, best streak, date) and an all-time high score in `localStorage`. Show the high score on the start screen and a "New high score!" treatment on the results screen. Remove the `console.log`. Keep the storage shape versioned/validated (a malformed blob must not crash the app).

## Verification & completion (mandatory)

- `pnpm ci` must pass (format check, lint, tests, build). Run `pnpm format` first.
- Commit per issue with conventional messages referencing the bead ids; close each bead.
- `git push -u origin fix/ux-polish` — work is not done until push succeeds.
- Open a PR: `gh pr create --base feature/cowes-proximity-mode --title "feat: yacht-club results screen, in-app play again, persistent high scores (beads p4c,1cb,6nn)"`.
