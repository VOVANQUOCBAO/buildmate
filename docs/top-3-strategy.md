# BuildMate ASG - Top 3 Selection Strategy

This document analyzes what BuildMate ASG should do next to maximize the chance of being selected as a top 3 project.

The current project is already past a static UI:

- API-backed dashboard.
- JSON fixtures.
- Deterministic Skill Graph scoring.
- Recommendation filters.
- Onboarding preview.
- Workshop and mentor detail pages.
- Explanation API.
- Demo script.

To reach top 3, the next work should focus less on adding many screens and more on making the project feel real, differentiated, and easy to judge.

---

## Top 3 Thesis

BuildMate ASG should pitch itself as:

> A builder intelligence layer for hackathons and build weeks that turns event overload into personalized next actions using a Skill Graph.

The strongest angle is not "AI chatbot for events." That is too generic.

The winning angle is:

> BuildMate ASG knows the builder, maps their skills and gaps, ranks workshops / teammates / mentors / sponsor resources, and turns them into a day-by-day action plan.

If judges remember one thing, it should be:

> BuildMate ASG helps builders spend less time searching and more time shipping.

---

## Judging Lens

Most judging panels will implicitly score around four areas:

1. **Technical execution**  
   Does it actually work beyond static mockups?

2. **Originality**  
   Is it more than another chatbot?

3. **Real-world relevance**  
   Would real builders or event organizers use it?

4. **Demo clarity**  
   Can judges understand the product in two minutes?

BuildMate ASG should optimize for these four areas.

---

## Current Strengths

## 1. Clear Problem

The problem is easy to understand:

- Build weeks have too much information.
- Builders miss workshops, mentors, teammates, sponsor resources, and deadlines.
- Searching across Discord, Notion, websites, and announcements wastes build time.

## 2. Clear User

The user is specific:

- Hackathon builders.
- Build-week participants.
- Event organizers.
- Mentor / sponsor teams.

## 3. Strong Product Metaphor

The Skill Graph is a strong differentiator:

```text
Builder profile -> skills -> gaps -> resources -> next actions
```

This is better than a generic chat interface.

## 4. Working Demo Foundation

The current app already has:

- Next.js app.
- API routes.
- Scoring engine.
- Filters.
- Detail pages.
- Onboarding preview.

That is a good base.

---

## Current Gaps

## 1. Onboarding Does Not Yet Affect Recommendations

The onboarding page creates a preview, but it does not persist profile input or refresh the dashboard scoring.

Why this matters:

- Judges may ask: "Is it really personalized?"
- The best demo would show recommendations changing after onboarding.

## 2. Data Still Feels Like Fixtures

JSON fixtures are good for Day 1, but top 3 demos need data that feels like a real event.

Missing data examples:

- event schedule
- workshop times
- mentor availability
- sponsor perks
- team candidates
- deadlines

## 3. No Organizer View

The builder view is strong, but an organizer view would make adoption more believable.

Possible organizer value:

- See common skill gaps.
- Know which workshops are over/under recommended.
- Route mentors to the right builders.
- Understand sponsor resource demand.

## 4. No Measured Impact Yet

The project says it saves time, but does not quantify it.

Judges like concrete proof:

- "4 recommended actions in under 30 seconds."
- "Reduces event search across 5 channels to one builder route."
- "Maps 6 resources to 3 skill gaps."

---

## Highest Impact Next Features

## Priority 1 - Make Onboarding Drive Recommendations

This is the single highest value feature.

Current flow:

```text
onboarding preview -> no persistence
```

Target flow:

```text
onboarding form -> profile state/API -> scoring engine -> refreshed recommendations
```

Implementation options:

### Option A: Client-only Demo Mode

Use local state or `localStorage`.

Pros:

- Fast.
- Good for demo.
- No database needed.

Cons:

- Not production-grade.

### Option B: API-backed Session

Add:

```text
POST /api/profile
GET /api/profile
```

Store the profile in memory or local JSON for demo.

Pros:

- More realistic architecture.
- Easier to explain.

Cons:

- Slightly more work.

Recommended for top 3:

> Use client-side persisted profile with `localStorage` first, then explain how it becomes a backend profile service.

Demo moment:

1. Start with Maya as frontend/product builder.
2. Change goal to "on-chain credentials demo."
3. Recommendations shift toward credential clinic and smart contract teammate.

This proves personalization.

---

## Priority 2 - Add Realistic Event Dataset

Add richer JSON fixtures:

```text
data/workshops.json
data/mentors.json
data/sponsors.json
data/team-candidates.json
data/deadlines.json
```

Each object should include:

- `id`
- `title`
- `tags`
- `skills`
- `time`
- `capacity` or `availability`
- `sponsor`
- `recommendedFor`

Why this matters:

- Makes BuildMate ASG feel event-ready.
- Gives the scoring engine real inputs.
- Makes demo more credible.

Minimum top 3 version:

- 5 workshops
- 4 mentors
- 4 team candidates
- 4 sponsor resources
- 5 deadlines

---

## Priority 3 - Add "Why This Recommendation" Panel

The recommendation cards already show score breakdown.

Next step:

Add an expandable explanation panel or detail modal:

```text
Why this recommendation?
- Goal match: 67%
- Skill gap coverage: Agent orchestration, Vector retrieval
- Timing: high because workshop is before prototype day
- Next action: reserve seat
```

Why this matters:

- Judges can see the intelligence layer.
- It proves the output is inspectable.
- It avoids the "black box AI" problem.

This can use the current `/api/explain?id=...` route.

---

## Priority 4 - Add Dynamic Builder Journey

Current journey is static.

Target:

Each journey step should include recommended resources:

```text
Day 1: choose direction -> Agent Workflow Lab
Day 2: prototype -> Omar AI infra teammate
Day 3: validate -> Nina mentor session
Day 4: polish -> Demo Day checklist
```

Why this matters:

- The project becomes a week-long copilot, not just a recommendation board.
- It directly supports the vision: learning -> building -> shipping -> success.

Minimum version:

- Add `recommendedResourceId` to journey items.
- Link each journey step to a recommendation detail page.

---

## Priority 5 - Add Organizer Insight Snapshot

Add a small section:

```text
Organizer Intelligence
- Top skill gap: Agent orchestration
- Most recommended workshop: Agent Workflow Lab
- Mentor demand: Product scoping
- Sponsor resource demand: Vector DB credits
```

Why this matters:

- Shows a second customer: event organizers.
- Makes adoption more plausible.
- Helps differentiate from personal assistant apps.

This can be a simple static/API-backed panel at first.

---

## Priority 6 - Add Submission-Ready Pitch Section

Add a final "Why BuildMate ASG wins" section to the UI or README:

- Not a generic chatbot.
- Skill Graph gives structured context.
- Recommendation engine is inspectable.
- Event organizers and builders both benefit.
- Can extend across hackathons with cross-event profiles.

Why this matters:

- Judges often review quickly.
- The app should explain itself without you narrating every detail.

---

## Recommended 48-Hour Plan

## Day A - Personalization Proof

Goal: prove onboarding changes output.

Tasks:

1. Persist onboarding profile in `localStorage`.
2. Add "Use this profile" button.
3. Update `/api/recommendations` or client scorer to accept profile override.
4. Show changed recommendations after onboarding.
5. Add one visual label: `Personalized from onboarding`.

Demo payoff:

> The judge sees the app adapt in real time.

## Day B - Event Credibility

Goal: make data feel like a real build week.

Tasks:

1. Add richer event datasets.
2. Add organizer insight snapshot.
3. Link journey steps to recommendations.
4. Add `Why this recommendation` detail from `/api/explain`.
5. Update demo script.

Demo payoff:

> The judge sees that this could run at a real hackathon.

---

## What Not To Build Yet

Avoid these unless the core demo is already strong:

- Full authentication.
- Real database setup.
- Complex chat UI.
- Multi-user live matching.
- On-chain credentials implementation.
- Overly broad admin dashboard.

Reason:

These are valuable later, but they can dilute the demo. For top 3, judges need a clear proof that BuildMate ASG's recommendation intelligence works.

---

## Top 3 Demo Script

Target demo length: 2 minutes.

## Step 1 - Problem

> Build weeks overwhelm builders. They do not need more information; they need the right next action.

## Step 2 - Onboarding

Show `/onboarding`.

> BuildMate ASG starts with the builder's role, goal, current skills, and missing skills.

## Step 3 - Recommendations

Show dashboard filters.

> The Skill Graph ranks workshops, teammates, mentors, and sponsor resources using goal fit, skill-gap coverage, timing, and availability.

## Step 4 - Explanation

Open a workshop detail page or `/api/explain?id=agent-workflow-lab`.

> Every recommendation is explainable. It is not a black-box chatbot response.

## Step 5 - Journey

Show Builder Journey.

> BuildMate ASG turns recommendations into a day-by-day build plan.

## Step 6 - Close

> BuildMate ASG helps every builder find the shortest path from learning to building, from building to shipping, and from shipping to success.

---

## Success Criteria Before Submission

BuildMate ASG is top-3-ready when:

- [ ] Onboarding changes recommendations.
- [ ] Recommendations are ranked by deterministic scoring.
- [ ] At least one workshop and one mentor detail page are strong.
- [ ] Builder Journey links to recommended resources.
- [ ] Data looks like a real event, not only placeholder cards.
- [ ] Demo can be completed in under 2 minutes.
- [ ] README clearly explains the Skill Graph and scoring.
- [ ] `npm run lint` and `npm run build` pass.

---

## Final Recommendation

The most important next build is:

> Make onboarding actually drive the recommendation engine.

If BuildMate ASG can show recommendations changing based on a builder profile, it becomes much more credible as an AI builder copilot and much more likely to stand out in the top 3.

