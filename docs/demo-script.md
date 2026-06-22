# BuildMate ASG Demo Script

Use this script for a short judge or stakeholder demo.

## 1. Open The Dashboard

```bash
cd buildmate-asg
npm run dev
```

Open:

```text
http://localhost:3000
```

Talk track:

> BuildMate ASG is an AI builder copilot. It helps participants move from event overload to clear next actions by combining builder profiles, skill gaps, workshops, mentors, teammates, and sponsor resources.

## 2. Show API-Backed Dashboard

Click **Refresh API data**.

Talk track:

> The dashboard is not hardcoded into the page. It loads structured data from `/api/dashboard`, which currently reads local JSON fixtures and can later be replaced by event databases or retrieval workflows.

## 3. Show Recommendation Filters

Click:

- Workshops
- Team matches
- Mentors
- Sponsors

Talk track:

> Day 2 added deterministic Skill Graph scoring. Each recommendation is ranked using goal overlap, skill-gap coverage, availability, and event timing.

## 4. Open A Workshop Detail Page

Click **Reserve seat** on `Agent Workflow Lab`.

Talk track:

> Detail pages turn recommendations into action. The builder can see why this workshop matters, what skill gaps it closes, and what to do next.

## 5. Open A Mentor Detail Page

Return to dashboard and click **Book 15 min** on `Mentor: Nina, Developer Tools PM`.

Talk track:

> Mentor matching is not generic. BuildMate ASG explains why the mentor fits the builder's goal and which missing skills or demo risks they can help with.

## 6. Show Builder Journey And Organizer Intelligence

Scroll to Builder Journey and Organizer Intelligence.

Talk track:

> The journey turns recommendations into a day-by-day build plan. Each phase links to a concrete resource. Organizer Intelligence shows the other side of the product: event teams can see top skill gaps, workshop demand, mentor demand, and sponsor pull.

## 7. Show Onboarding

Open:

```text
http://localhost:3000/onboarding
```

Talk track:

> Onboarding now drives personalization. A builder can enter their role, goal, current skills, and what help they need, then save that profile. The dashboard re-scores recommendations from the saved profile.

Suggested demo:

1. Change the goal to `Ship an on-chain credentials demo before Demo Day`.
2. Make `On-chain credentials` a detected skill gap.
3. Click `Use this profile`.
4. Return to the dashboard.
5. Point out the `Personalized from onboarding` badge and updated ranking.

## 8. Show Explanation API

Open:

```text
http://localhost:3000/api/explain?id=agent-workflow-lab
```

Talk track:

> The explanation endpoint is a mock AI layer. It does not replace the scoring engine. It explains a ranked recommendation in a structured way, which keeps the product reliable and agent-friendly.

## Closing Line

> BuildMate ASG helps builders spend less time searching and more time shipping by turning event information into personalized, explainable next actions.

