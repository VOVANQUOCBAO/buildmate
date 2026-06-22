# Day 1 Implementation - API-Backed Demo Shell

Day 1 is complete.

## What Changed

- Moved demo data into local JSON fixtures:
  - `data/profile.json`
  - `data/recommendations.json`
  - `data/journey.json`
  - `data/skill-graph.json`
  - `data/proof-metrics.json`

- Added shared TypeScript types:
  - `lib/types.ts`

- Converted `lib/buildmate-data.ts` into typed fixture loaders.

- Added API routes:
  - `GET /api/profile`
  - `GET /api/recommendations`
  - `GET /api/journey`
  - `GET /api/skill-graph`
  - `GET /api/proof`
  - `GET /api/dashboard`

- Added `components/buildmate-dashboard.tsx` as the client-side dashboard.

- Updated `app/page.tsx` so the page now uses the API-backed dashboard.

- Added UI states:
  - loading skeleton
  - refresh button
  - retry button
  - error panel

## How To Test

```bash
cd buildmate-asg
npm run dev
```

Open:

```text
http://localhost:3000
```

Inspect API routes:

```text
http://localhost:3000/api/dashboard
http://localhost:3000/api/profile
http://localhost:3000/api/recommendations
http://localhost:3000/api/journey
http://localhost:3000/api/skill-graph
http://localhost:3000/api/proof
```

Validate:

```bash
npm run lint
npm run build
```

Both commands pass after Day 1 changes.

## Next Best Step

Day 2 should add the deterministic recommendation engine:

```text
builder profile + JSON fixtures -> scoring engine -> ranked recommendations
```

Suggested file:

```text
lib/recommendation-engine.ts
```

