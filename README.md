# Developer DNA

Turn any public GitHub username into a dynamic developer archetype card: language matrix,
24-hour activity rhythm, five-axis radar (Velocity, Versatility, Impact, Originality, Seniority),
a generated persona badge, and one-click PNG/SVG export.

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

Then open `http://localhost:3000/?user=torvalds` or type a username (debounced, shareable via query param).

## Architecture

| Path | Responsibility |
| --- | --- |
| `app/api/dna/[username]/route.ts` | Server-side GitHub aggregation endpoint; maps 404/401/403/429 to structured errors, accepts optional `x-github-token` header |
| `lib/github.ts` | Typed GitHub REST client (profile, repos, public events, per-repo language bytes) with rate-limit error classification |
| `lib/metrics.ts` | Pure transformation layer: language shares, UTC hour histogram + peak window, radar score normalization (0-100), persona classifier |
| `lib/languages.ts` | Language-to-hex color map (linguist palette) |
| `lib/mock.ts` | Mock `DnaProfile` for offline / rate-limited preview |
| `components/DnaCard.tsx` | Fixed 1200x630 exportable card (glassmorphism, glow accents) |
| `components/RadarChart.tsx` | Mathematical SVG pentagon radar with gradient/glow and spring animation |
| `components/ExportControls.tsx` | PNG download at 2x pixel ratio + raw card SVG copy via `html-to-image` |
| `components/DnaExperience.tsx` | Client orchestrator: query-param state, responsive card scaling, error UI with token retry + mock toggle |
| `components/HeroInput.tsx` | Debounced, validated username input synced to `?user=` |
| `components/CardSkeleton.tsx` | Pulse skeleton mirroring the card layout |

## Rate limits

Unauthenticated GitHub API calls are capped at 60/hour per IP. On a 429 the UI offers two paths:
paste a personal access token (kept in `sessionStorage` only, sent as a header to the same-origin API route),
or preview the card with mock data.
