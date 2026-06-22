# BuildMate ASG - Recommended Next Steps

This document suggests what to build next for `BuildMate ASG`, based on the current Next.js UI and the product vision in `README.md`.

## Current Status

BuildMate ASG currently has:

- A polished Next.js + TypeScript + Tailwind UI.
- Structured mock data in `lib/buildmate-data.ts`.
- Core screens for:
  - Builder profile.
  - Skill Graph.
  - Workshop / teammate / mentor / sponsor recommendations.
  - Builder Journey timeline.
  - Demo launch guide.

The next goal should be to turn the static demo shell into a credible AI-powered product prototype.

---

## Recommended Priority Order

## 1. Add Real Data Models

Before adding AI, define the core entities clearly.

Create types for:

- `BuilderProfile`
- `Skill`
- `Goal`
- `Workshop`
- `Mentor`
- `SponsorResource`
- `TeamCandidate`
- `JourneyStep`
- `Recommendation`

Suggested file:

```text
buildmate-asg/lib/types.ts
```

Why this matters:

- It prevents the project from becoming a generic chatbot.
- It makes the Skill Graph easier to reason about.
- It gives the AI layer structured inputs and outputs.

---

## 2. Replace Mock Data With Local JSON Fixtures

Move the current mock data out of TypeScript constants and into JSON fixtures.

Suggested files:

```text
buildmate-asg/data/builders.json
buildmate-asg/data/workshops.json
buildmate-asg/data/mentors.json
buildmate-asg/data/sponsors.json
buildmate-asg/data/team-candidates.json
```

Why this matters:

- Judges can inspect the data.
- The demo becomes easier to customize for a real event.
- Later, these files can be replaced by database/API sources.

---

## 3. Add API Routes

Create API routes so the UI no longer reads data directly from `lib/buildmate-data.ts`.

Recommended routes:

```text
GET /api/profile
GET /api/recommendations
GET /api/journey
GET /api/skill-graph
```

Optional query examples:

```text
GET /api/recommendations?builderId=maya&type=workshop
GET /api/journey?builderId=maya&day=2
```

Why this matters:

- It gives BuildMate ASG a real product architecture.
- It mirrors the clean API boundary used in `sentdiv-ui`.
- It prepares the app for an AI/retrieval backend.

---

## 4. Build the Skill Graph Engine

Add a simple scoring engine first, before using an LLM.

The engine should score matches between:

- Builder skills and workshop topics.
- Builder goals and mentor expertise.
- Skill gaps and sponsor resources.
- Project needs and teammate strengths.

Example scoring logic:

```text
score =
  goal_overlap * 40
+ skill_gap_coverage * 30
+ availability_match * 15
+ event_timing_relevance * 15
```

Suggested file:

```text
buildmate-asg/lib/recommendation-engine.ts
```

Why this matters:

- Deterministic scoring makes the demo easier to explain.
- AI can explain or refine recommendations later.
- The project becomes more than a visual dashboard.

---

## 5. Add AI Explanation Layer

After deterministic scoring works, add an AI explanation layer.

The AI should not decide everything from scratch. It should explain and personalize ranked results.

Good output:

```json
{
  "recommendation": "Join Agent Workflow Lab",
  "reason": "This workshop closes your biggest skill gap for building an agentic workflow demo.",
  "nextAction": "Reserve a seat before Day 2 morning."
}
```

Avoid:

- Generic chatbot answers.
- Unstructured free-text recommendations.
- AI outputs that cannot be inspected or scored.

Why this matters:

- It keeps BuildMate ASG action-oriented.
- It makes the product feel intelligent without losing reliability.

---

## 6. Add Builder Onboarding

Add an onboarding form so a builder can enter:

- Role.
- Current skills.
- Target project.
- Team status.
- Preferred workshops.
- What help they need most.

Suggested UI route:

```text
/onboarding
```

For hackathon demo, keep it short:

1. What are you building?
2. What can you already do?
3. What skills are missing?
4. Do you need teammates, mentors, sponsors, or workshops?

Why this matters:

- It makes personalization believable.
- It gives the recommendation engine real inputs.
- It creates a stronger demo story.

---

## 7. Add Interactive Filters

Improve the recommendation board with filters:

- Workshops
- Team matches
- Mentors
- Sponsors
- Urgent today
- Highest skill-gap coverage

Why this matters:

- It makes the product usable during a live event.
- It helps judges see that recommendations are not static cards.

---

## 8. Add Builder Journey State

Make the Builder Journey dynamic.

Each journey step should have:

- Day / phase.
- Required action.
- Recommended resource.
- Deadline.
- Completion status.

Possible statuses:

- `not_started`
- `in_progress`
- `done`
- `blocked`

Why this matters:

- The product becomes useful across the full build week.
- It supports the README vision: from learning to building, shipping, and success.

---

## 9. Add Mentor and Team Matching Detail Pages

Create detail pages:

```text
/mentors/[id]
/team/[id]
/workshops/[id]
```

Each page should explain:

- Why this match is relevant.
- Which skill gap it addresses.
- What the builder should ask or do next.

Why this matters:

- It turns recommendations into action.
- It makes BuildMate ASG feel like a real event copilot.

---

## 10. Add On-Chain Skill Credentials

This is a strong future feature, but should come after the core recommendation system.

Possible flow:

1. Builder completes workshop.
2. BuildMate ASG updates skill graph.
3. Builder receives a verifiable skill credential.
4. Credential can be stored as an on-chain attestation or achievement record.

Good demo framing:

> BuildMate ASG starts as a builder copilot, then evolves into a portable skill graph that follows builders across hackathons and build weeks.

Why this matters:

- It creates ecosystem relevance.
- It gives the Skill Graph long-term value.
- It supports cross-event Builder Profiles.

---

## Suggested 3-Day Implementation Plan

## Day 1 - Make The Demo Dynamic

- Move mock data to JSON fixtures.
- Add `/api/profile`, `/api/recommendations`, `/api/journey`.
- Update UI to fetch from API routes.
- Add loading/error states.

## Day 2 - Add Recommendation Intelligence

- Build `recommendation-engine.ts`.
- Add scoring for workshops, mentors, teammates, and sponsors.
- Add filters to the recommendation board.
- Add explanation text based on score reasons.

## Day 3 - Strengthen The Pitch

- Add onboarding form.
- Add one mentor detail page and one workshop detail page.
- Add a simple AI explanation endpoint or mock.
- Add a short demo script in `docs/demo-script.md`.

---

## Best Next Feature To Build First

If only one feature can be built next, build:

> API-backed recommendations using local JSON fixtures and a deterministic Skill Graph scoring engine.

This gives the highest impact because it proves BuildMate ASG is not just a landing page. It becomes a working recommendation product.

---

## Demo Story To Aim For

The ideal demo should be:

1. A builder enters their skills and goal.
2. BuildMate ASG identifies skill gaps.
3. BuildMate ASG recommends one workshop, one teammate, one mentor, and one sponsor resource.
4. The Skill Graph explains why each recommendation matters.
5. The Builder Journey turns those recommendations into a day-by-day action plan.

One-sentence demo message:

> BuildMate ASG helps builders spend less time searching and more time shipping by turning event information into personalized next actions.

