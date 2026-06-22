# BuildMate ASG

## BuildMate ASG: BuildMate AI & Skill Graph

## Inspiration

Agentic AI Build Week is an exciting but intense experience. Builders must navigate workshops, venues, teammates, mentors, deadlines, sponsor resources, and Demo Day preparations—all within five days.

The challenge isn't a lack of opportunities; it's information overload.

Many participants miss valuable workshops, struggle to find the right teammates, or spend too much time searching for information instead of building.

We created **BuildMate ASG** to become an intelligent companion that helps builders make faster and smarter decisions throughout their journey at Agentic AI Build Week.

---

## What it does

BuildMate ASG is an AI-powered builder copilot that combines personalized event guidance with skill intelligence.

The platform helps builders:

* Discover the most relevant workshops based on their skills and goals.
* Identify skill gaps for their project.
* Find teammates with complementary expertise.
* Connect with suitable mentors.
* Track important deadlines and event milestones.
* Discover sponsor resources, APIs, credits, and perks.
* Receive a personalized Builder Journey for the entire event.

Instead of browsing multiple channels and schedules, builders receive actionable recommendations tailored specifically to them.

---

## How we built it

We built BuildMate ASG using:

* Large Language Models (LLMs) for personalized recommendations.
* A Skill Graph engine to map relationships between skills, goals, workshops, mentors, and teammates.
* Retrieval-based workflows to organize event knowledge and resources.
* A lightweight web interface optimized for quick access during live events.

The Skill Graph acts as the intelligence layer of the platform, allowing the system to understand not only what a builder knows today but also what they need to learn or who they need to meet to achieve their goals.

---

## Challenges we ran into

One of the biggest challenges was avoiding the creation of a generic chatbot.

The goal was not to build another AI assistant that simply answers questions, but to create a system that actively helps builders take action.

Another challenge was designing meaningful recommendations with limited event data while keeping the experience simple enough for first-time users.

We also had to ensure that the platform remains useful throughout every stage of the event—from registration and team formation to project submission and Demo Day.

---

## Accomplishments that we're proud of

* Created a personalized Skill Graph model for builders.
* Built an AI recommendation system focused on real builder workflows.
* Designed a Builder Journey feature that provides individualized guidance throughout the event.
* Combined team matching, workshop recommendations, mentor discovery, and resource navigation into a single experience.
* Developed a solution that can be deployed and used immediately during Agentic AI Build Week.

Most importantly, we transformed event information into actionable intelligence that helps builders spend less time searching and more time building.

---

## What we learned

Through this project, we learned that builders rarely struggle because of insufficient information—they struggle because there is too much information competing for their attention.

We also learned that AI becomes significantly more valuable when combined with context. By connecting event activities with a builder's skills and goals, recommendations become more relevant and useful.

The project reinforced our belief that the best AI experiences help users make decisions and take action, not just generate answers.

---

## What's next for BuildMate ASG

Our next goal is to evolve BuildMate ASG into a reusable Builder Intelligence Platform for hackathons, buildathons, developer conferences, and startup communities.

Future features include:

* Real-time team formation recommendations.
* AI-powered mentor matchmaking.
* Dynamic workshop and event recommendations.
* On-chain skill credentials and achievement tracking.
* Cross-event Builder Profiles that grow with each participation.

Our vision is simple:

**Help every builder find the shortest path from learning to building, from building to shipping, and from shipping to success.**

---

## Local UI

This folder now includes a Next.js + TypeScript + Tailwind demo interface inspired by the structure of `sentdiv-ui`.

Day 1 implementation is complete:

- Demo data lives in JSON fixtures under `data/`.
- API routes expose profile, recommendations, journey, skill graph, proof metrics, and full dashboard data.
- The UI fetches from `/api/dashboard`.
- Loading, refresh, retry, and error states are included.

Day 2 implementation is complete:

- `lib/recommendation-engine.ts` ranks recommendations with deterministic Skill Graph scoring.
- Recommendation fixtures include goal keywords, covered skills, availability, timing, and summaries.
- `/api/recommendations?type=...` supports filters for workshops, team matches, mentors, and sponsors.
- Recommendation cards show score breakdowns and matched skill tags.

Day 3 implementation is complete:

- `/onboarding` adds a lightweight builder intake preview.
- `/workshops/[id]` and `/mentors/[id]` turn recommendations into detail pages.
- `/api/explain?id=...` provides a mock AI explanation layer on top of deterministic scoring.
- `docs/demo-script.md` gives a short walkthrough for judges or stakeholders.

Day A top-3 implementation is complete:

- `/onboarding` now saves a builder profile to local storage.
- The dashboard reads the saved profile and sends it to the API.
- `/api/dashboard` and `/api/recommendations` re-score recommendations with the personalized profile.
- The UI shows `Personalized from onboarding` and includes a reset button for the default demo profile.

Day B top-3 implementation is complete:

- Realistic event datasets were added for workshops, mentors, sponsors, team candidates, and deadlines.
- Builder Journey steps now link to recommended resources.
- Recommendation cards include an expandable `Why this recommendation?` panel.
- `/api/organizer-insights` and the Organizer Intelligence dashboard section show event-level demand signals.

Run it locally:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Validate before demo:

```bash
npm run lint
npm run build
```

## UI Structure

```text
buildmate-asg/
├── app/
│   ├── api/
│   │   ├── dashboard/route.ts
│   │   ├── explain/route.ts
│   │   ├── journey/route.ts
│   │   ├── organizer-insights/route.ts
│   │   ├── profile/route.ts
│   │   ├── proof/route.ts
│   │   ├── recommendations/route.ts
│   │   └── skill-graph/route.ts
│   ├── mentors/[id]/page.tsx
│   ├── onboarding/page.tsx
│   ├── workshops/[id]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── badge.tsx
│   ├── buildmate-dashboard.tsx
│   ├── journey-timeline.tsx
│   ├── recommendation-card.tsx
│   └── skill-graph.tsx
├── data/
│   ├── journey.json
│   ├── deadlines.json
│   ├── mentors.json
│   ├── organizer-insights.json
│   ├── profile.json
│   ├── proof-metrics.json
│   ├── recommendations.json
│   ├── skill-graph.json
│   ├── sponsors.json
│   ├── team-candidates.json
│   └── workshops.json
├── lib/
│   ├── buildmate-data.ts
│   ├── profile-storage.ts
│   ├── recommendation-engine.ts
│   └── types.ts
└── package.json
```

The current UI is an API-backed demo shell with structured local fixtures. The next backend step is to replace the JSON fixtures with real event schedules, builder profiles, mentor availability, sponsor resources, and Skill Graph recommendations.
