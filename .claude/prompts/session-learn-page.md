# Session: Learn page — buoyage tutorial + how to play

You are working in the git worktree `C:\Users\tajdi\racing-mark-guessing-game\tutorial` on branch `feat/learn-page` (branched from `main`). This is a React + TypeScript + Vite racing-mark guessing game on Cloudflare Workers. The repo uses beads (`bd`) — the worktree shares the main repo's beads DB. No other sessions are running.

**IMPORTANT: `main` autodeploys to production.** Your PR targets `main`, so everything must be fully verified before you push.

## Setup

```
pnpm install
```

## Your bead (claim with `bd update racing-mark-guessing-game-cqn --claim`, close when done)

**racing-mark-guessing-game-cqn** — Build a crawlable tutorial/learn page at `/learn/`. There is an existing model to follow: `public/solent-racing-marks-2026/index.html` (the season-changes page) — match its approach exactly: self-contained static HTML in `public/learn/index.html`, inline CSS, yacht-club aesthetic (navy `#1B2A4A`, gold `#C9A962`, off-white `#FDFCFB`, serif headings), no JS, mobile-friendly.

### Content (three sections)

1. **Understanding the marks (buoyage explainer)** — the SEO core, targets "cardinal mark colours", "IALA buoyage", "what is a special mark":
   - Port hand (red can) / starboard hand (green cone) lateral marks
   - Cardinal marks: north (BY), south (YB), east (BYB), west (YBY) — explain the black/yellow band logic and what each tells you about safe water
   - Safe water (red/white stripes), special marks (yellow — most Solent racing marks are these)
   - Render each mark as a small inline SVG mirroring the app's `MarkIcon` shapes in `src/components/Graphics/MarkIcons.tsx` (cylinders with the same colours/bands: R `#dc2626`, G `#16a34a`, Y `#ca8a04`, B `#2563eb`, black `#000`) — copy the SVG geometry from that file so the page matches the in-game legend.
2. **How the game works** — difficulties (beginner 30s / intermediate 20s / advanced 10s, what marks each includes), scoring (100 base + time bonus + streak bonus from 3-in-a-row, difficulty multipliers), Cowes Daring Mode (marks within 5km of Cowes), hints for sponsored marks. Check `src/utils/gameLogic.ts` for exact numbers — don't guess.
3. **Tips for learning the Solent marks** — short practical section (e.g. learn by area, start with the unsponsored landmarks like forts and banks, use the nautical chart layer).

### SEO head

Title, meta description, canonical `https://guess-the-mark.verdient.co.uk/learn/`, OG tags, and JSON-LD: `Article` plus a `FAQPage` block with 3-4 genuine Q&As ("What do the colours of racing marks mean?", "What is a cardinal mark?", "How many racing marks are in the Solent?" — 157 in 2026).

### Linking (both ways, same pattern as the changes page)

- Add `/learn/` to `public/sitemap.xml`.
- Add a footer link on the game start screen in `src/App.tsx` next to the existing "2026 mark changes" link — e.g. "Learn the marks".
- Cross-link: the learn page links to the game (`/`) and the 2026 changes page (`/solent-racing-marks-2026/`); also add a small link from the changes page to `/learn/` if it fits naturally.

## Verification & completion (mandatory)

- `pnpm run ci` must pass (format check, lint, tests, build). Run `pnpm format` first.
- `pnpm preview` (wrangler dev): verify `/learn/` serves the static page, `/` still serves the game, `/solent-racing-marks-2026/` still works.
- Commit with a conventional message referencing the bead id; close the bead.
- `git push -u origin feat/learn-page` — work is not done until push succeeds.
- Open a PR targeting main: `gh pr create --base main --title "feat: /learn/ tutorial page — buoyage explainer + how to play (bead cqn)"`. Do NOT merge it — main autodeploys; a human reviews first.
