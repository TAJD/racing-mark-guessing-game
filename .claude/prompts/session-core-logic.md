# Session: core game-logic fixes

You are working in the git worktree `C:\Users\tajdi\racing-mark-guessing-game\core-logic` on branch `fix/core-logic`. This is a React + TypeScript + Vite racing-mark guessing game. The repo uses beads (`bd`) for issue tracking — the worktree shares the main repo's beads DB.

Two other Claude sessions are working in parallel on sibling worktrees (`map-perf` touches `src/components/Map/OpenSeaMapContainer.tsx`; `ux-polish` restyles the game-over screen and in-game header JSX in `GameController.tsx` and edits `App.tsx`'s `handleGameEnd`). **To minimize merge conflicts: do NOT restyle any JSX, do NOT touch `OpenSeaMapContainer.tsx`, and do NOT change `handleGameEnd` in App.tsx.** Stick to logic.

## Setup

```
pnpm install
```

## Your beads (claim each with `bd update <id> --claim` before starting, `bd close <id>` when done)

Work them in this order. Run `bd show <id>` for full descriptions.

1. **racing-mark-guessing-game-cnx** (P1) — Side effects inside `setGameState` updater functions. `GameController.tsx:134-164` (timeout path inside the timer effect) and `:181-210` (`handleGuessAnswer`) call `setLastResult`/`setShowResult`/`setTimeout(generateNewQuestion)` INSIDE `setGameState` updaters. Updaters must be pure (StrictMode double-invokes them, risking double question-advance). Refactor: compute the result first, call setters and schedule the advance at top level.
2. **racing-mark-guessing-game-l47** (P1) — Beginner pool exhaustion ends the game early showing the "Game Complete!" celebration screen. `generateGuessQuestion` (`gameLogic.ts:120`) adds ALL option IDs to `usedSet` (up to 6 marks/question) while the beginner pool is only 13 marks; when the pool drops below `numberOfOptions` it throws, and `GameController.tsx:92` catches → `setGameEnded(true)`. Fix: only the target mark goes into `usedSet`; add a distinct error state (simple message + retry, no celebration) used for both generation failure and GPX load failure; if the pool runs dry before the question limit, end the game gracefully as a *completed* game only if at least one question was answered, otherwise show the error state.
3. **racing-mark-guessing-game-6nh** (P1) — "Show hints" setting has no effect. `GuessMode.tsx:116` shows the sponsor hint whenever the mark has a sponsor; `config.hintEnabled` is never consumed. Thread it through `GameController` into `GuessMode` and gate the hint on it.
4. **racing-mark-guessing-game-t5v** (P2) — "Best Streak" on the results screen renders `gameState.streak` (current, 0 after a final miss). Add `bestStreak` to `GameState`, update it on answer, display it. (Don't restyle the screen — just fix the value.)
5. **racing-mark-guessing-game-sqm** (P2) — Validate localStorage `gameConfig` in `App.tsx:11-33`: merge parsed values with defaults field-by-field, type-checking each field, instead of trusting the blob.
6. **racing-mark-guessing-game-gfz** (P2) — Extract a `QUESTIONS_PER_GAME = 10` constant (suggest `src/constants/app.ts`); replace the hardcoded `>= 10` in `GameController.tsx` (2 places) and the `/10` strings in `ScoreDisplay.tsx`.
7. **racing-mark-guessing-game-0yt** (P3) — Deadline-based timer: the timer effect's deps include `timeRemaining`, so the interval is recreated every second and drifts. Store an end-timestamp ref and derive remaining time from `Date.now()`.
8. **racing-mark-guessing-game-7hl** (P3) — Distractor options ignore difficulty: `generateGuessQuestion` draws wrong options from all 161 marks. Prefer distractors from the active difficulty pool, fall back to all marks when short.
9. **racing-mark-guessing-game-1sh** (P3) — Dead code cleanup: remove `getMarkHint` + its tests (`gameLogic.ts:171`), `GameState.currentMark`/`options` (never set), `ScoreDisplay`'s unreachable non-"guess" mode branch, the dead avg-center logic `GameController.tsx:81-87` (the map's `fitBounds` branch always wins), unnecessary `eslint-disable react-hooks/exhaustive-deps` comments, `config.openSeaMapEnabled` in the question-regeneration effect deps (`GameController.tsx:124`), and the `getCryptoRandomInt` modulo-bias helper (plain `Math.random()` is fine for a game). Also delete `worker/index.ts`'s dead `/api/` stub body (keep a minimal valid worker) and delete `map.html` at the repo root after grepping that nothing references it. Do NOT remove the `hiddenMarks` prop — the map session owns that.
10. **racing-mark-guessing-game-6wg** (P2, blocked by 1–2 above) — Add `GameController` tests with vitest + React Testing Library + fake timers: timer countdown and timeout path, answer scoring + streak/bestStreak, game end after `QUESTIONS_PER_GAME`, error state on load failure, and a `generateGuessQuestion` pool-exhaustion unit test. Mock `OpenSeaMapContainer` (Leaflet won't run in happy-dom).

## Verification & completion (mandatory)

- `pnpm ci` must pass (format check, lint, tests, build). Run `pnpm format` first to avoid format-check failures.
- Commit per issue (or small coherent groups) with conventional messages referencing the bead id.
- Close each bead as you finish it.
- `git push -u origin fix/core-logic` — work is not done until push succeeds.
- Open a PR with `gh pr create --base feature/cowes-proximity-mode --title "fix: core game-logic bugs (beads 6nh,l47,cnx,t5v,sqm,gfz,0yt,7hl,1sh,6wg)"` and a body summarizing each fix.
