# Day 2 Implementation - Deterministic Skill Graph Scoring

Day 2 is complete.

## What Changed

- Added deterministic recommendation scoring:
  - `lib/recommendation-engine.ts`

- Extended recommendation fixtures with scoring inputs:
  - `goalKeywords`
  - `coversSkills`
  - `availabilityMatch`
  - `eventTimingRelevance`
  - `summary`

- Updated shared types in:
  - `lib/types.ts`

- Updated `lib/buildmate-data.ts` so recommendations are ranked by the engine, not by static scores.

- Updated API route:
  - `GET /api/recommendations`

- Added filter support:
  - `GET /api/recommendations?type=all`
  - `GET /api/recommendations?type=workshop`
  - `GET /api/recommendations?type=team-match`
  - `GET /api/recommendations?type=mentor`
  - `GET /api/recommendations?type=sponsor`

- Updated UI:
  - filter buttons on the recommendation board
  - API-backed filter loading state
  - score breakdown on every recommendation card
  - matched skill tags on every recommendation card

## Scoring Formula

```text
score =
  goal_overlap * 40
+ skill_gap_coverage * 30
+ availability_match * 15
+ event_timing_relevance * 15
```

## Why This Matters

BuildMate ASG is no longer only displaying static recommendation cards.

The app now has a small, auditable Skill Graph engine that ranks recommendations based on:

- the builder's goal
- missing target skills
- event timing relevance
- availability fit

This is the first step toward replacing static demo data with real event data and AI explanations.

## How To Test

```bash
cd buildmate-asg
npm run dev
```

Open:

```text
http://localhost:3000
```

Then try the recommendation filters:

- All
- Workshops
- Team matches
- Mentors
- Sponsors

Inspect API output:

```text
http://localhost:3000/api/recommendations?type=all
http://localhost:3000/api/recommendations?type=workshop
http://localhost:3000/api/recommendations?type=team-match
http://localhost:3000/api/recommendations?type=mentor
http://localhost:3000/api/recommendations?type=sponsor
```

Validate:

```bash
npm run lint
npm run build
```

Both commands pass after Day 2 changes.

## Next Best Step

Day 3 should add builder onboarding and detail pages:

```text
onboarding form -> profile inputs -> scoring engine -> personalized recommendations
```

Suggested next files:

```text
app/onboarding/page.tsx
app/workshops/[id]/page.tsx
app/mentors/[id]/page.tsx
```

