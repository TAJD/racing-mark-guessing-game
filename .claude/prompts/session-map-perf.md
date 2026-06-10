# Session: map performance fix

You are working in the git worktree `C:\Users\tajdi\racing-mark-guessing-game\map-perf` on branch `fix/map-performance`. This is a React + TypeScript + Vite racing-mark guessing game using Leaflet. The repo uses beads (`bd`) for issue tracking — the worktree shares the main repo's beads DB.

Two other Claude sessions work in parallel on sibling worktrees: `core-logic` (game logic in `GameController.tsx`/`gameLogic.ts`/`App.tsx`) and `ux-polish` (restyles `GameController.tsx` JSX). **Confine your edits to `src/components/Map/OpenSeaMapContainer.tsx`, except the minimal call-site line removals in `GameController.tsx` described below.**

## Setup

```
pnpm install
```

## Your bead (claim with `bd update racing-mark-guessing-game-c6k --claim`, close when done)

**racing-mark-guessing-game-c6k** (P1) — Leaflet map destroyed and recreated on every question.

In `src/components/Map/OpenSeaMapContainer.tsx`:

1. The init effect (line ~92-146) has deps `[center, zoom, onMapClick]`. Every new question changes `center`, so the cleanup runs `map.remove()` and a whole new map initializes, refetching all tiles. Fix: initialize the map exactly once (empty dep array; read initial center/zoom from refs or props at mount). The existing third effect (`setView`/`fitBounds`) already handles repositioning. Attach/detach the `onMapClick` handler in its own small effect so the map isn't recreated when the callback identity changes.
2. The markers effect clears and rebuilds all ~161 markers on every change of `marks`/`highlightedMark`. The marks array is stable during a game — only the highlighted marker changes per question. Diff instead: create markers once per `marks` identity; on `highlightedMark` change, only update the icon of the previously-highlighted and newly-highlighted markers (`marker.setIcon(...)`).
3. Remove the dead `hiddenMarks` prop (it is always `[]`, never used to hide anything) — from this component's props/effect deps AND its three call-site lines in `GameController.tsx` (the `const hiddenMarks: string[] = []` declaration and the two `hiddenMarks={hiddenMarks}` JSX props). Touch nothing else in `GameController.tsx`.

Manual sanity check if possible: `pnpm dev` and confirm the map no longer flashes/refetches tiles between questions.

## Verification & completion (mandatory)

- `pnpm ci` must pass (format check, lint, tests, build). Run `pnpm format` first.
- Commit with a conventional message referencing the bead id; close the bead.
- `git push -u origin fix/map-performance` — work is not done until push succeeds.
- Open a PR: `gh pr create --base feature/cowes-proximity-mode --title "perf: stop recreating Leaflet map and markers every question (bead c6k)"`.
