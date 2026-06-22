# Day A Implementation - Onboarding-Driven Recommendations

Day A is complete.

## What Changed

- Onboarding now persists a builder profile in `localStorage`.
- The dashboard reads the saved profile on load.
- `/api/dashboard` accepts a profile override through a query parameter.
- `/api/recommendations` accepts the same profile override while filtering.
- Recommendations are re-scored with the persisted onboarding profile.
- The dashboard shows `Personalized from onboarding` when a custom profile is active.
- The dashboard includes a `Reset demo profile` button to return to the default Maya profile.

## Key Files

```text
lib/profile-storage.ts
app/onboarding/page.tsx
components/buildmate-dashboard.tsx
app/api/dashboard/route.ts
app/api/recommendations/route.ts
lib/buildmate-data.ts
```

## Demo Flow

1. Open `/onboarding`.
2. Change the goal, for example:

```text
Ship an on-chain credentials demo before Demo Day
```

3. Select / deselect skills so `On-chain credentials` becomes a detected skill gap.
4. Click `Use this profile`.
5. Return to `/`.
6. The dashboard shows `Personalized from onboarding`.
7. Recommendations are re-ranked using the saved profile.
8. Click `Reset demo profile` to go back to the default fixture profile.

## Why This Matters

This closes the most important top-3 gap:

```text
onboarding form -> persisted profile -> scoring engine -> refreshed recommendations
```

Judges can now see that BuildMate ASG is not just showing static cards. Builder input changes the scoring context.

