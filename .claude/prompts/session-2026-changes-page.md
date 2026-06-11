# Session: "Solent racing marks 2026 — what changed" page

You are working in the git worktree `C:\Users\tajdi\racing-mark-guessing-game\update-post` on branch `feat/2026-changes-page`. This is a React + TypeScript + Vite racing-mark guessing game deployed on Cloudflare Workers. The repo uses beads (`bd`) for issue tracking — the worktree shares the main repo's beads DB. No other sessions are running; you have the whole repo to yourself.

## Setup

```
pnpm install
```

## Your bead (claim with `bd update racing-mark-guessing-game-eiw --claim`, close when done)

**racing-mark-guessing-game-eiw** — Build the first crawlable content page: a seasonal post covering what changed in the Solent racing marks for 2026. This is an SEO play: it targets the spring search spike ("Solent racing marks 2026") and is the kind of page sailing forums and clubs link to each season.

### Source material

- `docs/data/2026-mark-changes.md` — the machine-generated 2025→2026 diff (4 removed, 23 renamed/re-sponsored, 2 moved >50m, 157 total marks vs 161).
- `public/data/2026_racing_marks.gpx` and `public/data/2025_racing_marks.gpx` if you need to check details (format: `<name>CODE </name><sym>COLOUR</sym><desc>Title [*]</desc>`, `*`/`@` suffix = sponsored mark).
- Mark data originates from SCRA (scra.org.uk) via Winning Tides (winningtides.co.uk/pages/buoyracer.htm) — credit both.

### What to build

1. **A static HTML page at `public/solent-racing-marks-2026/index.html`** so Cloudflare Workers serves it as a plain asset (static files take precedence over the SPA `single-page-application` not-found fallback — verify with `pnpm preview` that the route serves the page, not the SPA).
2. **Content** — curate, don't dump the raw diff:
   - Title/H1 along the lines of "Solent Racing Marks 2026: What's Changed".
   - Short intro: what SCRA marks are, 157 marks this season (down from 161), data sources credited with links.
   - Sections: removed marks (5N Mary Rose, 71 Mark, 75 Magazine, 7F Jib); marks that moved (13 Parkstone YC ~278m, 2D Lymington Yacht Haven ~268m — moved marks matter to racers, lead with these); renamed/re-sponsored marks as a table (code, 2025 name, 2026 name).
   - Use judgment on data noise: "'Cowes Week 2026' → 'Cowes Week 200'" is likely upstream truncation; "Greetings→Greenings", "Johnson→Johnston", "Doneney→Domeney" are typo corrections, group them as such rather than presenting as real changes.
   - End with a CTA linking to the game ("test yourself on the 2026 marks") at `/`.
3. **Styling**: self-contained inline CSS (no Tailwind build needed for a static page) matching the yacht-club aesthetic — navy `#1B2A4A`, gold `#C9A962`, off-white `#FDFCFB`, serif headings. Mobile-friendly. Keep it lightweight: no JS required.
4. **SEO head**: title, meta description, canonical (`https://guess-the-mark.verdient.co.uk/solent-racing-marks-2026/`), Open Graph tags, and `Article` JSON-LD (datePublished 2026-06-11, about Solent racing marks).
5. **Internal linking both ways**: add the page's URL to `public/sitemap.xml` (hand-edit; build-time generation is a separate bead), and add a small footer link on the game start screen in `src/App.tsx` (next to the existing SCRA credit) — e.g. "2026 mark changes" → `/solent-racing-marks-2026/`. Without an internal link the page is orphaned for crawlers.

## Verification & completion (mandatory)

- `pnpm run ci` must pass (format check, lint, tests, build). Run `pnpm format` first.
- `pnpm preview` (wrangler dev): verify `/solent-racing-marks-2026/` serves the static page and `/` still serves the game.
- Commit with a conventional message referencing the bead id; close the bead.
- `git push -u origin feat/2026-changes-page` — work is not done until push succeeds.
- Open a PR: `gh pr create --base feature/cowes-proximity-mode --title "feat: Solent racing marks 2026 changes page (bead eiw)"` with a summary and a screenshot description of the page structure.
