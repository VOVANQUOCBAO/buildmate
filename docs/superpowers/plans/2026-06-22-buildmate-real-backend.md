# BuildMate ASG — Real Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:phat-trien-bang-subagent (recommended) or superpowers:thuc-thi-ke-hoach to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn BuildMate ASG from a mock-fallback demo into a launchable product with real Supabase auth + DB, a real Claude explanation layer, persisted journey progress, and a production Vercel deploy — without ever breaking `npm run dev` in mock mode.

**Architecture:** Keep the existing **env-switch + graceful fallback** pattern. Every code path that touches Supabase or Claude must degrade to the current mock behaviour when its env vars are absent. P1 provisions the real Supabase project locally; P2 adds the Claude layer behind `ANTHROPIC_API_KEY`; P3 finishes `journey_progress` by mirroring the `saved_actions` pattern 1:1; P4 deploys to Vercel; P5 cleans up and updates docs.

**Tech Stack:** Next.js 16 (App Router, `next dev`/`next build`), React 19, Tailwind 4, TypeScript 6, `@supabase/supabase-js` + `@supabase/ssr`, `@anthropic-ai/sdk` ^0.105.0, Supabase (Postgres + Auth + RLS), Vercel.

## Global Constraints

These apply to **every** task implicitly:

- **No test runner exists in this project.** The only quality gates are `npm run lint` (ESLint) and `npm run build` (which also typechecks). Each task is verified by `npm run lint && npm run build` **plus** the explicit curl/manual verification in that task. Do **not** introduce vitest/jest — it is out of scope and against the established convention.
- **Graceful fallback is invariant:** anything added must self-degrade when its env var is missing. `npm run dev` must always run with zero backend env. Real mode = `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` present. Claude mode = `ANTHROPIC_API_KEY` present.
- **Never use, log, commit, or store the `service_role` key anywhere.** The app uses the anon key + user session + RLS only. The old project's service_role was leaked → that project is abandoned.
- **Active Supabase project is `neon`**, ref `ndkwqtpndychtpxghlzc`, URL `https://ndkwqtpndychtpxghlzc.supabase.co`. **Ignore the stale ref `cgkxyattkccfugvjgokt` written in the design spec — it is the abandoned project.**
- **Default Claude model:** `claude-haiku-4-5-20251001` (Haiku 4.5), overridable via `ANTHROPIC_MODEL`. Before writing Claude code, consult the `claude-api` skill for current model id + SDK syntax.
- **Checkpoint per phase:** after each phase's final task, STOP and ask the user before starting the next phase. Phases P1, P2, P4 each have a user gate (SQL/credentials/login) that blocks until the user acts.
- **Commit cadence:** commit after each task with the exact message given. (Requires git — see Task 0.)
- **Code style:** match surrounding files — 2-space indent, double quotes, named exports, `snake_case` DB columns ↔ `camelCase` TS via explicit mapper functions (see `lib/supabase/user-data.ts`). No comments unless the file's neighbours have them.

---

## File Structure

**P0 (git):**
- Init: repo at `D:\skill\buildmate-asg-main` (confirm `.gitignore` excludes `.env*`).

**P1 (Supabase live, local) — config/ops only, no source files:**
- Create: `.env.local` (gitignored — never committed).
- Run: `supabase/migrations/0001_init.sql` against the `neon` project.

**P2 (Claude layer):**
- Create: `lib/ai/explain.ts` — pure prompt builder + async `generateExplanation()` with Claude call + deterministic fallback.
- Modify: `app/api/explain/route.ts` — become `async`, resolve profile, delegate to `lib/ai/explain.ts`.

**P3 (journey_progress, mirrors saved_actions 1:1):**
- Modify: `lib/types.ts` — add `JourneyStatus` + `JourneyProgress` types.
- Modify: `lib/supabase/user-data.ts` — add `listJourneyProgress()`, `setJourneyStatus()` (mock-safe).
- Create: `app/api/journey-progress/route.ts` — GET (list) + POST (set), 401 when unauthenticated.
- Create: `lib/journey-progress-store.ts` — client store: API → localStorage fallback.
- Modify: `components/journey-timeline.tsx` — render progress badge + cycle button.
- Modify: `components/buildmate-dashboard.tsx` — lift journey-progress state (mirror `savedIds`), pass down.

**P4 (deploy):**
- Vercel project + env vars; Supabase redirect URLs.

**P5 (finalize):**
- Modify: `README.md`, `docs/` to reflect real-backend status.
- **Do NOT remove `proxy.ts`** — verified load-bearing (Next 16 renamed `middleware`; the sole session-refresh interceptor that `lib/supabase/server.ts` depends on). It is a no-op only in mock mode; it becomes essential the moment P1 sets the Supabase env.

---

## Task 0: Initialize git (one-time, gate)

**Files:**
- Init: git repo at `D:\skill\buildmate-asg-main`
- Verify: `.gitignore`

**Interfaces:**
- Produces: a git repo so every later task can commit.

> **USER GATE:** The folder is not a git repo yet. Confirm with the user before running `git init`. If the user declines, skip all `git commit` steps in this plan and rely on lint+build+manual verify alone.

- [ ] **Step 1: Confirm `.gitignore` excludes env + build files**

Read `.gitignore`. It must contain `.env*` (or `.env.local`) and `.next`. The current file is the Next.js default; confirm these lines are present. If `.env*` is missing, add it:

```
# local env files
.env*
!.env.example
```

- [ ] **Step 2: Initialize the repo**

Run:
```bash
cd "D:/skill/buildmate-asg-main" && git init && git add -A && git status --short | head -5
```
Expected: repo created; `.env.local` does NOT appear in `git status` (it doesn't exist yet, and is gitignored).

- [ ] **Step 3: First commit**

```bash
git add -A
git commit -m "chore: initialize git repo for BuildMate ASG"
```

> **CHECKPOINT:** git ready. Proceed to P1.

---

## P1 — Supabase live (local)

Goal: the real `neon` project backs auth + profile + saved actions on `localhost`, verified end-to-end. Mostly ops; no source changes.

### Task 1: Wire `.env.local` to the `neon` project

**Files:**
- Create: `D:\skill\buildmate-asg-main\.env.local` (gitignored)

**Interfaces:**
- Produces: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` in the local environment so `isSupabaseConfigured` (`lib/supabase/config.ts:12`) becomes `true`.

> **USER GATE:** Ask the user for the `neon` project's **anon/public** key (Supabase dashboard → Project Settings → API → Project API keys → `anon` `public`). Never request or accept the `service_role` key.

- [ ] **Step 1: Create `.env.local`**

Create `D:\skill\buildmate-asg-main\.env.local` with (paste the real anon key in place of `<ANON_KEY>`):

```
NEXT_PUBLIC_SUPABASE_URL=https://ndkwqtpndychtpxghlzc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do NOT add `SUPABASE_SERVICE_ROLE` or any service key.

- [ ] **Step 2: Confirm it is gitignored**

Run:
```bash
cd "D:/skill/buildmate-asg-main" && git check-ignore .env.local && echo "IGNORED OK"
```
Expected: prints `.env.local` then `IGNORED OK`. If it prints nothing, fix `.gitignore` (Task 0 Step 1) before continuing — the key must never be committed.

- [ ] **Step 3: Confirm the app picks up real mode**

Run:
```bash
cd "D:/skill/buildmate-asg-main" && npm run build 2>&1 | tail -20
```
Expected: build succeeds. With Supabase env set, `/` is rendered dynamically (it reads cookies) — this is expected, not an error.

### Task 2: Run the migration against `neon`

**Files:**
- Run: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `public.profiles`, `public.saved_actions`, `public.journey_progress` + RLS + `handle_new_user` signup trigger in the `neon` project.

> **USER GATE:** The migration must be applied by the user in the Supabase dashboard (no service_role available locally for `supabase db push`).

- [ ] **Step 1: Hand the SQL to the user**

Tell the user: open Supabase dashboard for project `neon` → **SQL Editor** → New query → paste the entire contents of `supabase/migrations/0001_init.sql` → Run. (The script is idempotent — `create table if not exists`, `drop trigger if exists` — so re-running is safe.)

- [ ] **Step 2: Verify tables + trigger exist**

Ask the user to run this in the SQL Editor and report the result:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','saved_actions','journey_progress')
order by table_name;
select tgname from pg_trigger where tgname = 'on_auth_user_created';
```
Expected: 3 table rows + 1 trigger row.

### Task 3: Enable email auth and verify end-to-end (local)

**Files:** none (Supabase dashboard config + manual run)

**Interfaces:**
- Consumes: `.env.local` (Task 1), migrated schema (Task 2).
- Produces: a verified signup → profile-seed → onboarding → dashboard → saved-action → signout flow on `localhost`.

> **USER GATE:** In Supabase dashboard → Authentication → Providers, confirm **Email** is enabled. For a frictionless demo, Authentication → Sign In / Providers → disable "Confirm email" (or instruct the user that signup needs email confirmation). Decide with the user.

- [ ] **Step 1: Start the dev server**

The user runs (interactive, keeps running):
```
! npm run dev
```
Expected: server on `http://localhost:3000`.

- [ ] **Step 2: Sign up a test user**

In the browser: go to `/auth`, sign up with a test email + password. If email confirmation is on, confirm via the emailed link.

- [ ] **Step 3: Verify the profile row was auto-seeded**

User runs in Supabase SQL Editor:
```sql
select id, name, goal from public.profiles order by created_at desc limit 1;
```
Expected: one row for the new user (the `handle_new_user` trigger fired). `goal` is empty — that is correct (empty profile → fixture demo still shows, per `hasContent` in `user-data.ts:51`).

- [ ] **Step 4: Verify onboarding persists to DB**

In the browser (signed in): go to `/onboarding`, fill in goal + skills, submit. Then re-run the SQL from Step 3.
Expected: the same row now has the goal you entered (onboarding PUTs to `/api/profile` → `upsertDbProfile`).

- [ ] **Step 5: Verify dashboard reads DB + saved actions persist**

Reload `/`. Expected: dashboard shows your onboarding profile (not the fixture). Click the ★ bookmark on one recommendation, then reload.
Expected: the bookmark survives reload and `★ N saved` counter reflects it (data came from `saved_actions` table via `/api/saved-actions`, not localStorage). Confirm with:
```sql
select recommendation_id, title from public.saved_actions order by saved_at desc limit 3;
```
Expected: your bookmarked recommendation appears.

- [ ] **Step 6: Verify signout returns to demo/mock view**

Click Sign out. Expected: the dashboard falls back to the fixture demo (no personalized profile, saved state from localStorage only). No errors in the console.

- [ ] **Step 7: Commit (no secrets)**

`.env.local` is gitignored, so nothing source-level changed in P1. If `.gitignore` was touched in Task 0, it is already committed. Confirm clean tree:
```bash
cd "D:/skill/buildmate-asg-main" && git status --short
```
Expected: empty (or only intended changes). **Never** `git add .env.local`.

> **CHECKPOINT P1:** Real Supabase auth + DB verified end-to-end locally. STOP and report results to the user before P2.

---

## P2 — Claude AI layer

Goal: `/api/explain` returns a Claude-generated, profile-grounded explanation of the engine's already-computed score, and falls back to the current deterministic template when there is no key or the API errors. Claude must **explain/personalize the engine result — never invent new recommendations** (avoids the "generic chatbot" disqualifier).

### Task 4: Create `lib/ai/explain.ts` (prompt builder + Claude call + fallback)

**Files:**
- Create: `lib/ai/explain.ts`

**Interfaces:**
- Consumes: `Recommendation` and `BuilderProfile` from `@/lib/types`; `@anthropic-ai/sdk`; env `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
- Produces (used by Task 5):
  - `type ExplainResult = { explanation: string; nextSteps: string[]; source: "claude" | "fallback" }`
  - `function buildFallback(recommendation: Recommendation): ExplainResult` — the deterministic template (pure).
  - `function buildExplainPrompt(recommendation: Recommendation, profile: BuilderProfile): string` — pure prompt string.
  - `async function generateExplanation(recommendation: Recommendation, profile: BuilderProfile): Promise<ExplainResult>` — calls Claude when keyed, else `buildFallback`.

- [ ] **Step 1: Consult the `claude-api` skill**

Invoke the `claude-api` skill to confirm the current `@anthropic-ai/sdk` message API shape and model id. Confirm: client is `new Anthropic({ apiKey })`, call is `await client.messages.create({ model, max_tokens, system, messages: [{ role: "user", content }] })`, and the text is at `response.content[0]` where `type === "text"`. Default model `claude-haiku-4-5-20251001`.

- [ ] **Step 2: Write `lib/ai/explain.ts`**

Create `lib/ai/explain.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

import type { BuilderProfile, Recommendation } from "@/lib/types";

/**
 * Claude explanation layer for the recommendation engine.
 *
 * Claude only EXPLAINS and personalises a score the deterministic engine has
 * already computed — it never invents new recommendations. When
 * ANTHROPIC_API_KEY is absent or the call fails, we return the deterministic
 * template so the endpoint never breaks (graceful fallback, like the rest of
 * the app).
 */

export type ExplainResult = {
  explanation: string;
  nextSteps: string[];
  source: "claude" | "fallback";
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** The deterministic template — identical in spirit to the old route output. */
export function buildFallback(recommendation: Recommendation): ExplainResult {
  return {
    explanation: `${recommendation.title} is recommended because it scores ${recommendation.score}/100 across goal fit, skill-gap coverage, timing, and availability. ${recommendation.detail}`,
    nextSteps: recommendation.nextSteps,
    source: "fallback"
  };
}

/** Pure: the grounding prompt. Easy to eyeball without an API call. */
export function buildExplainPrompt(
  recommendation: Recommendation,
  profile: BuilderProfile
): string {
  const b = recommendation.scoreBreakdown;
  return [
    "A deterministic Skill-Graph engine has ALREADY scored and ranked this recommendation for a hackathon builder.",
    "Your job: explain WHY it fits THIS builder, in 2-3 sentences, grounded only in the data below.",
    "Do NOT invent new recommendations, events, mentors, or facts. Do NOT change the score.",
    "",
    "BUILDER:",
    `- Role: ${profile.role || "(unspecified)"}`,
    `- Goal: ${profile.goal || "(unspecified)"}`,
    `- Current skills: ${profile.currentSkills.join(", ") || "(none listed)"}`,
    `- Target skills (gaps to close): ${profile.targetSkills.join(", ") || "(none listed)"}`,
    "",
    "RECOMMENDATION (engine output — treat as ground truth):",
    `- Title: ${recommendation.title}`,
    `- Category: ${recommendation.category}`,
    `- Score: ${recommendation.score}/100`,
    `- Score breakdown: goalOverlap=${b.goalOverlap}, skillGapCoverage=${b.skillGapCoverage}, availabilityMatch=${b.availabilityMatch}, eventTimingRelevance=${b.eventTimingRelevance}`,
    `- Skills it covers for this builder: ${recommendation.matchedSkills.join(", ") || "(none)"}`,
    `- Detail: ${recommendation.detail}`,
    `- Engine version: ${recommendation.engineVersion}`,
    "",
    "Respond with ONLY a JSON object, no markdown fences, in this exact shape:",
    `{"explanation": "<2-3 sentence grounded explanation>", "nextSteps": ["<short step>", "<short step>", "<short step>"]}`
  ].join("\n");
}

type ParsedClaude = { explanation?: unknown; nextSteps?: unknown };

/** Tolerant parse of Claude's JSON; returns null if it isn't usable. */
function parseClaudeJson(text: string): { explanation: string; nextSteps: string[] } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as ParsedClaude;
    if (typeof parsed.explanation !== "string" || !parsed.explanation.trim()) return null;
    const nextSteps = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((s): s is string => typeof s === "string")
      : [];
    return { explanation: parsed.explanation.trim(), nextSteps };
  } catch {
    return null;
  }
}

/**
 * Returns a Claude-grounded explanation when ANTHROPIC_API_KEY is set and the
 * call + parse succeed; otherwise the deterministic fallback. Never throws.
 */
export async function generateExplanation(
  recommendation: Recommendation,
  profile: BuilderProfile
): Promise<ExplainResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildFallback(recommendation);

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 400,
      system:
        "You ground every answer in the supplied builder profile and engine output. You never fabricate recommendations or facts. You reply with strict JSON only.",
      messages: [{ role: "user", content: buildExplainPrompt(recommendation, profile) }]
    });

    const block = response.content[0];
    const text = block && block.type === "text" ? block.text : "";
    const parsed = parseClaudeJson(text);
    if (!parsed) return buildFallback(recommendation);

    return {
      explanation: parsed.explanation,
      nextSteps: parsed.nextSteps.length ? parsed.nextSteps : recommendation.nextSteps,
      source: "claude"
    };
  } catch {
    return buildFallback(recommendation);
  }
}
```

- [ ] **Step 3: Lint + typecheck**

Run:
```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -15
```
Expected: lint clean, build succeeds (this typechecks the new file against the real `Recommendation`/`BuilderProfile` types and the SDK).

- [ ] **Step 4: Commit**

```bash
git add lib/ai/explain.ts
git commit -m "feat: add Claude explanation layer with deterministic fallback"
```

### Task 5: Wire `/api/explain` to the Claude layer

**Files:**
- Modify: `app/api/explain/route.ts`

**Interfaces:**
- Consumes: `generateExplanation` from `@/lib/ai/explain`; `getRecommendationById`, `getProfile` from `@/lib/buildmate-data`; `getDbProfile` from `@/lib/supabase/user-data`.
- Produces: `GET /api/explain?id=<id>` → `{ id, engineVersion, explanation, nextSteps, source }`.

- [ ] **Step 1: Rewrite the route as async, profile-grounded**

Replace the entire contents of `app/api/explain/route.ts` with:

```typescript
import { generateExplanation } from "@/lib/ai/explain";
import { getProfile, getRecommendationById } from "@/lib/buildmate-data";
import { getDbProfile } from "@/lib/supabase/user-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing recommendation id" }, { status: 400 });
  }

  const recommendation = getRecommendationById(id);

  if (!recommendation) {
    return NextResponse.json({ error: `Unknown recommendation id: ${id}` }, { status: 404 });
  }

  // Ground in the signed-in builder's DB profile when available, else fixture.
  const profile = (await getDbProfile()) ?? getProfile();
  const result = await generateExplanation(recommendation, profile);

  return NextResponse.json({
    id,
    engineVersion: recommendation.engineVersion,
    explanation: result.explanation,
    nextSteps: result.nextSteps,
    source: result.source
  });
}
```

> Confirm `getProfile` is exported from `lib/buildmate-data.ts` (it is used by `getDashboardData`). If the export name differs, use the actual fixture-profile getter.

- [ ] **Step 2: Lint + build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -15
```
Expected: clean.

- [ ] **Step 3: Verify fallback path (no key)**

Ensure `ANTHROPIC_API_KEY` is NOT set. Start `! npm run dev`, then in another shell find a real recommendation id and curl explain:
```bash
cd "D:/skill/buildmate-asg-main" && node -e "const d=require('./data/recommendations.json'); console.log(d[0].id)"
curl -s "http://localhost:3000/api/explain?id=<ID_FROM_ABOVE>"
```
Expected: JSON with `"source":"fallback"`, a template `explanation` mentioning the score, and `nextSteps` from the fixture. No error.

- [ ] **Step 4: Verify Claude path (with key) — USER GATE G1**

> **USER GATE:** This step needs an `ANTHROPIC_API_KEY`. If the user has not provided one, SKIP this step (fallback already verified) and note it. Do not block the plan.

If a key is available, add `ANTHROPIC_API_KEY=<key>` (and optionally `ANTHROPIC_MODEL=`) to `.env.local`, restart `npm run dev`, and curl the same id:
```bash
curl -s "http://localhost:3000/api/explain?id=<ID>"
```
Expected: `"source":"claude"`, an `explanation` that references the builder's goal/skills and does NOT invent new events/mentors. If it ever errors, it must still return `"source":"fallback"` (never a 500).

- [ ] **Step 5: Commit**

```bash
git add app/api/explain/route.ts
git commit -m "feat: serve Claude-grounded explanations from /api/explain"
```

> **CHECKPOINT P2:** Claude layer live with verified fallback (+ real path if key provided). STOP and report to the user before P3.

---

## P3 — journey_progress (mirror saved_actions 1:1)

Goal: per-phase builder progress (`not_started | in_progress | done | blocked`) persists to `journey_progress` when signed in, and to localStorage in mock mode — mirroring the saved-actions architecture exactly. This is a **separate concept** from the existing `JourneyStep.status` (`now/next/later`, the fixed timeline position) — do not conflate them.

### Task 6: Add journey-progress types

**Files:**
- Modify: `lib/types.ts`

**Interfaces:**
- Produces (used by Tasks 7–10):
  - `type JourneyStatus = "not_started" | "in_progress" | "done" | "blocked"`
  - `type JourneyProgress = { phase: string; status: JourneyStatus; updatedAt: string }`

- [ ] **Step 1: Append the types**

Add to `lib/types.ts` (after the existing `JourneyStep` type):

```typescript
export type JourneyStatus = "not_started" | "in_progress" | "done" | "blocked";

export type JourneyProgress = {
  phase: string;
  status: JourneyStatus;
  updatedAt: string;
};
```

- [ ] **Step 2: Build (typecheck)**

```bash
cd "D:/skill/buildmate-asg-main" && npm run build 2>&1 | tail -8
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add JourneyStatus and JourneyProgress types"
```

### Task 7: Add `listJourneyProgress` + `setJourneyStatus` to user-data

**Files:**
- Modify: `lib/supabase/user-data.ts`

**Interfaces:**
- Consumes: `JourneyProgress`, `JourneyStatus` from `@/lib/types`; `createClient` from `./server`.
- Produces (used by Task 8):
  - `async function listJourneyProgress(): Promise<JourneyProgress[]>` — `[]` in mock mode.
  - `async function setJourneyStatus(phase: string, status: JourneyStatus): Promise<{ progress: JourneyProgress[] } | null>` — `null` when not signed in.

- [ ] **Step 1: Extend the imports**

In `lib/supabase/user-data.ts`, change the types import line:
```typescript
import type { BuilderProfile, JourneyProgress, JourneyStatus, SavedAction } from "@/lib/types";
```

- [ ] **Step 2: Add a row type + mapper near the other row types**

Add after the `SavedActionRow` type block (around line 28):

```typescript
type JourneyProgressRow = {
  phase: string;
  status: string;
  updated_at: string;
};

const VALID_STATUSES: JourneyStatus[] = ["not_started", "in_progress", "done", "blocked"];

function rowToJourneyProgress(row: JourneyProgressRow): JourneyProgress {
  const status = (VALID_STATUSES as string[]).includes(row.status)
    ? (row.status as JourneyStatus)
    : "not_started";
  return { phase: row.phase, status, updatedAt: row.updated_at };
}
```

- [ ] **Step 3: Append the two functions at the end of the file**

```typescript
/** Lists the signed-in user's per-phase progress. [] in mock mode. */
export async function listJourneyProgress(): Promise<JourneyProgress[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("journey_progress")
    .select("phase, status, updated_at")
    .eq("user_id", user.id);

  if (error || !data) return [];
  return (data as JourneyProgressRow[]).map(rowToJourneyProgress);
}

/**
 * Upserts the status for one phase and returns the updated list.
 * Returns null when there is no signed-in user (caller falls back to local).
 */
export async function setJourneyStatus(
  phase: string,
  status: JourneyStatus
): Promise<{ progress: JourneyProgress[] } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase.from("journey_progress").upsert(
    {
      user_id: user.id,
      phase,
      status,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,phase" }
  );

  return { progress: await listJourneyProgress() };
}
```

- [ ] **Step 4: Lint + build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -12
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/user-data.ts
git commit -m "feat: add journey-progress read/write helpers (mock-safe)"
```

### Task 8: Create `/api/journey-progress` route

**Files:**
- Create: `app/api/journey-progress/route.ts`

**Interfaces:**
- Consumes: `getCurrentUser`, `listJourneyProgress`, `setJourneyStatus` from `@/lib/supabase/user-data`; `JourneyStatus` from `@/lib/types`.
- Produces: `GET → { progress: JourneyProgress[] }` (401 unauth); `POST { phase, status } → { progress }` (401 unauth, 400 invalid).

- [ ] **Step 1: Write the route**

Create `app/api/journey-progress/route.ts` (mirrors `app/api/saved-actions/route.ts`):

```typescript
import { getCurrentUser, listJourneyProgress, setJourneyStatus } from "@/lib/supabase/user-data";
import type { JourneyStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * Per-phase builder journey progress for the signed-in user.
 * Returns 401 in mock mode / signed out so the client store falls back to
 * localStorage.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json({ progress: await listJourneyProgress() });
}

const VALID_STATUSES: JourneyStatus[] = ["not_started", "in_progress", "done", "blocked"];

function parseInput(body: unknown): { phase: string; status: JourneyStatus } | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (typeof value.phase !== "string" || !value.phase.trim()) return null;
  if (typeof value.status !== "string" || !(VALID_STATUSES as string[]).includes(value.status)) {
    return null;
  }
  return { phase: value.phase, status: value.status as JourneyStatus };
}

/** Sets the status for one phase and returns { progress }. */
export async function POST(request: NextRequest) {
  const input = parseInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Invalid journey-progress payload" }, { status: 400 });
  }

  const result = await setJourneyStatus(input.phase, input.status);
  if (!result) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Lint + build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -10
```
Expected: clean.

- [ ] **Step 3: Verify 401 in mock mode**

Temporarily run without Supabase env (rename `.env.local` aside or use a fresh shell with no env), `npm run dev`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/journey-progress"
```
Expected: `401`. Restore `.env.local` afterwards.

- [ ] **Step 4: Commit**

```bash
git add app/api/journey-progress/route.ts
git commit -m "feat: add /api/journey-progress GET+POST route"
```

### Task 9: Create the client journey-progress store

**Files:**
- Create: `lib/journey-progress-store.ts`

**Interfaces:**
- Consumes: `JourneyProgress`, `JourneyStatus` from `@/lib/types`; `GET`/`POST /api/journey-progress`.
- Produces (used by Task 10):
  - `const JOURNEY_PROGRESS_STORAGE_KEY: string`
  - `async function listJourneyProgress(): Promise<JourneyProgress[]>`
  - `async function setJourneyStatus(phase: string, status: JourneyStatus): Promise<JourneyProgress[]>`

- [ ] **Step 1: Write the store**

Create `lib/journey-progress-store.ts` (mirrors `lib/saved-actions-store.ts`):

```typescript
import type { JourneyProgress, JourneyStatus } from "@/lib/types";

/**
 * Client-side journey-progress store with a transparent backend switch:
 *   - signed in → Supabase via /api/journey-progress
 *   - otherwise → browser localStorage (demo / signed-out)
 * A 401 from the API is the signal to fall back to localStorage.
 */

export const JOURNEY_PROGRESS_STORAGE_KEY = "buildmate-asg.journey-progress";

function readLocal(): JourneyProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOURNEY_PROGRESS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as JourneyProgress[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(progress: JourneyProgress[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function setLocal(phase: string, status: JourneyStatus): JourneyProgress[] {
  const current = readLocal().filter((p) => p.phase !== phase);
  const next = [{ phase, status, updatedAt: new Date().toISOString() }, ...current];
  writeLocal(next);
  return next;
}

export async function listJourneyProgress(): Promise<JourneyProgress[]> {
  try {
    const response = await fetch("/api/journey-progress");
    if (response.ok) {
      const data = (await response.json()) as { progress?: JourneyProgress[] };
      return data.progress ?? [];
    }
  } catch {
    // fall through to localStorage
  }
  return readLocal();
}

export async function setJourneyStatus(
  phase: string,
  status: JourneyStatus
): Promise<JourneyProgress[]> {
  try {
    const response = await fetch("/api/journey-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, status })
    });
    if (response.ok) {
      const data = (await response.json()) as { progress?: JourneyProgress[] };
      return data.progress ?? [];
    }
  } catch {
    // fall through to localStorage
  }
  return setLocal(phase, status);
}
```

- [ ] **Step 2: Build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run build 2>&1 | tail -8
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/journey-progress-store.ts
git commit -m "feat: add client journey-progress store with localStorage fallback"
```

### Task 10: Wire progress UI into the journey timeline + dashboard

**Files:**
- Modify: `components/journey-timeline.tsx`
- Modify: `components/buildmate-dashboard.tsx`

**Interfaces:**
- Consumes: `JourneyStatus`, `JourneyProgress` from `@/lib/types`; `listJourneyProgress`, `setJourneyStatus` from `@/lib/journey-progress-store`.
- Produces: an interactive per-phase progress badge + "Mark next" cycle button, persisting via the store. Mirrors the `savedIds` pattern already in `buildmate-dashboard.tsx`.

- [ ] **Step 1: Extend `JourneyTimeline` to accept progress props**

Replace the contents of `components/journey-timeline.tsx` with (keeps the existing timeline `status` badge, adds a progress badge + cycle button):

```typescript
import type { JourneyStatus, JourneyStep } from "@/lib/types";
import Link from "next/link";

const statusStyles: Record<JourneyStep["status"], string> = {
  now: "bg-cyan-300 text-slate-950",
  next: "bg-violet-300 text-slate-950",
  later: "bg-white text-slate-600"
};

const progressLabels: Record<JourneyStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked"
};

const progressStyles: Record<JourneyStatus, string> = {
  not_started: "bg-white text-slate-500 border border-slate-950/10",
  in_progress: "bg-amber-300 text-slate-950",
  done: "bg-emerald-300 text-slate-950",
  blocked: "bg-rose-300 text-slate-950"
};

const STATUS_CYCLE: JourneyStatus[] = ["not_started", "in_progress", "done", "blocked"];

export function nextStatus(current: JourneyStatus): JourneyStatus {
  const i = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

export function JourneyTimeline({
  steps,
  progressByPhase,
  onCycleStatus
}: {
  steps: JourneyStep[];
  progressByPhase: Record<string, JourneyStatus>;
  onCycleStatus: (phase: string, next: JourneyStatus) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((step) => {
        const progress = progressByPhase[step.phase] ?? "not_started";
        return (
          <article key={step.phase} className="soft-ring rounded-3xl bg-white/75 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold text-slate-400">{step.phase}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[step.status]}`}>
                {step.status}
              </span>
            </div>
            <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-slate-950">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            <button
              type="button"
              onClick={() => onCycleStatus(step.phase, nextStatus(progress))}
              className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-bold transition ${progressStyles[progress]}`}
              title="Click to advance status"
            >
              {progressLabels[progress]}
            </button>
            {step.recommendedResourceHref && step.recommendedResourceTitle ? (
              <Link
                href={step.recommendedResourceHref}
                className="mt-5 ml-2 inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                {step.recommendedResourceTitle}
              </Link>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Lift progress state into the dashboard**

In `components/buildmate-dashboard.tsx`, mirror the existing `savedIds` wiring. At the top of the file ensure the import for the store and types is present:

```typescript
import {
  listJourneyProgress as fetchJourneyProgress,
  setJourneyStatus as persistJourneyStatus
} from "@/lib/journey-progress-store";
import type { JourneyStatus } from "@/lib/types";
```

Inside the main dashboard component — **`BuildMateAsgDashboard`** (`components/buildmate-dashboard.tsx:31`), which holds `savedIds` state at line 37 and its loader `useEffect` at lines 105–112 — add state + handlers next to the saved-actions ones:

```typescript
  const [progressByPhase, setProgressByPhase] = useState<Record<string, JourneyStatus>>({});

  useEffect(() => {
    void fetchJourneyProgress().then((list) => {
      setProgressByPhase(
        Object.fromEntries(list.map((p) => [p.phase, p.status]))
      );
    });
  }, []);

  const cycleJourneyStatus = async (phase: string, next: JourneyStatus) => {
    setProgressByPhase((prev) => ({ ...prev, [phase]: next })); // optimistic
    const list = await persistJourneyStatus(phase, next);
    setProgressByPhase(Object.fromEntries(list.map((p) => [p.phase, p.status])));
  };
```

> If `useState`/`useEffect` are not already imported at the top of the file, add them to the existing `react` import. The component is already `"use client"` (it uses `useState` for filters) — confirm the directive is at the top.

- [ ] **Step 3: Pass the props into `<Journey>` and `<JourneyTimeline>`**

Update the `Journey` sub-component signature and its `JourneyTimeline` usage:

```typescript
function Journey({
  data,
  progressByPhase,
  onCycleStatus
}: {
  data: DashboardData;
  progressByPhase: Record<string, JourneyStatus>;
  onCycleStatus: (phase: string, next: JourneyStatus) => void;
}) {
  return (
    <section id="journey" className="section-journey border-b border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge tone="amber">Builder Journey</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              A five-day plan that adapts to the builder.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            BuildMate ASG compresses event overload into a practical route from registration to Demo Day.
          </p>
        </div>
        <JourneyTimeline
          steps={data.journey}
          progressByPhase={progressByPhase}
          onCycleStatus={(phase, next) => void onCycleStatus(phase, next)}
        />
      </div>
    </section>
  );
}
```

And at the call site of `<Journey ... />` in the main component (`buildmate-dashboard.tsx:157`), pass the new props:

```typescript
      <Journey data={data} progressByPhase={progressByPhase} onCycleStatus={cycleJourneyStatus} />
```

- [ ] **Step 4: Lint + build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -15
```
Expected: clean. Fix any prop-type mismatch the typecheck surfaces.

- [ ] **Step 5: Verify persistence (signed in) + fallback (mock)**

With `.env.local` set and signed in (`npm run dev`): on `/`, click a phase's progress badge to advance it (e.g. Not started → In progress). Reload.
Expected: the status survives reload. Confirm with:
```sql
select phase, status from public.journey_progress order by updated_at desc;
```
Expected: a row for that phase with the chosen status.

Then sign out (mock mode) and advance a phase's status. Reload.
Expected: the status survives via localStorage (key `buildmate-asg.journey-progress`); no 500s.

- [ ] **Step 6: Commit**

```bash
git add components/journey-timeline.tsx components/buildmate-dashboard.tsx
git commit -m "feat: interactive journey progress with DB + localStorage persistence"
```

> **CHECKPOINT P3:** journey_progress complete and verified both modes. All two original code gaps now closed. STOP and report before P4.

---

## P4 — Deploy to Vercel

Goal: production deployment with real Supabase + (optional) Claude, redirect URLs pointing at the prod domain.

### Task 11: Deploy + configure prod env

**Files:** none (Vercel + Supabase dashboard)

**Interfaces:**
- Consumes: a working local build (P1–P3).
- Produces: a live prod URL with auth working end-to-end.

> **USER GATE G2:** `vercel login` is interactive and Supabase redirect URLs are dashboard config — the user must drive these.

- [ ] **Step 1: Confirm a clean production build locally**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -15
```
Expected: clean. Do not deploy a failing build.

- [ ] **Step 2: User logs in to Vercel**

User runs:
```
! vercel login
```
Then from the project dir:
```
! vercel link
```
(Link or create a new Vercel project named `buildmate-asg`.)

- [ ] **Step 3: Set production env vars on Vercel**

User adds these in Vercel → Project → Settings → Environment Variables (Production), or via CLI `vercel env add`:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://ndkwqtpndychtpxghlzc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon key>`
- `NEXT_PUBLIC_SITE_URL` = `<prod domain, e.g. https://buildmate-asg.vercel.app>`
- `ANTHROPIC_API_KEY` = `<key>` (only if available; omit → Claude stays in fallback)
- `ANTHROPIC_MODEL` = optional override

**Never** add a service_role key.

- [ ] **Step 4: Deploy**

User runs:
```
! vercel --prod
```
Expected: a prod URL is printed.

- [ ] **Step 5: Update Supabase redirect URLs**

User: Supabase dashboard (project `neon`) → Authentication → URL Configuration:
- **Site URL** = the prod domain.
- **Redirect URLs** = add `<prod domain>/auth/callback` (keep `http://localhost:3000/auth/callback` for local dev).

- [ ] **Step 6: Verify on prod**

On the prod URL: sign up/login → onboarding saves → reload shows DB profile → bookmark persists across reload → journey progress persists → `/api/explain?id=<id>` returns an explanation (`source` = `claude` if key set, else `fallback`).
Expected: all pass on prod. Auth redirects land back on the prod domain (not localhost).

- [ ] **Step 7: Commit any config changes**

```bash
cd "D:/skill/buildmate-asg-main" && git add -A && git commit -m "chore: vercel deploy config" || echo "nothing to commit"
```

> **CHECKPOINT P4:** Live on Vercel, verified on prod. STOP and report before P5.

---

## P5 — Finalize

Goal: clean tree, honest docs, no dead files.

### Task 12: Update docs + clean up

**Files:**
- Modify: `README.md`
- Modify: `docs/` as needed
- Possibly remove: `proxy.ts` (only if confirmed unused)

**Interfaces:**
- Consumes: the finished P1–P4 product.
- Produces: docs that describe the real backend (no "mock-only" claims).

- [ ] **Step 1: Final clean lint + build**

```bash
cd "D:/skill/buildmate-asg-main" && npm run lint && npm run build 2>&1 | tail -15
```
Expected: both clean.

- [ ] **Step 2: Update README**

Edit `README.md` so setup/run reflects real mode: document `.env.local` keys (URL, anon key, site URL, optional `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`), the migration step, and that the app still runs in mock mode with no env. Remove any "mock-only / demo shell" framing. State the live Vercel URL.

- [ ] **Step 3: Keep `proxy.ts` (do NOT remove)**

Pre-execution analysis confirmed `proxy.ts` is **load-bearing**: it is Next 16's renamed `middleware` (the only request interceptor — no `middleware.ts` exists) and refreshes the Supabase auth session cookie on every matched request. `lib/supabase/server.ts` explicitly depends on it (its `setAll` swallows the read-only-cookie error precisely because the proxy refreshes the session). It is a no-op only in mock mode. **Do not delete it.** Instead, add a one-line note in the README documenting its role (session refresh in real mode).

- [ ] **Step 4: Verify the design spec's Definition of Done**

Re-read `docs/superpowers/specs/2026-06-22-buildmate-real-backend-design.md` §1 and tick each DoD item against the shipped product: auth+DB verified, Claude layer, journey_progress, Vercel deploy, lint+build clean, README honest. List any gaps.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "docs: reflect real Supabase + Claude backend; cleanup"
```

> **CHECKPOINT P5:** Product complete. Report the DoD checklist + live URL to the user.

---

## Self-Review (completed during authoring)

**Spec coverage:** DoD §1 → auth+DB (P1, Task 3 verify), Claude layer (P2, Tasks 4–5), journey_progress (P3, Tasks 6–10), Vercel deploy (P4, Task 11), lint/build clean + README (P5, Task 12). Out-of-scope items (OAuth, on-chain, next-steps #7–10) intentionally excluded. ✓

**Status-concept clash resolved:** existing `JourneyStep.status` (now/next/later, timeline position) is kept untouched; the new `JourneyStatus` (not_started/in_progress/done/blocked, user progress) is a separate field stored in `journey_progress`. The migration's leftover default `'next'` is never relied on (writes always pass an explicit status; reads map unknown/missing → `not_started`). No migration change needed. ✓

**Stale credential corrected:** spec's `cgkxyattkccfugvjgokt` is the abandoned project; plan uses `neon` ref `ndkwqtpndychtpxghlzc` throughout. service_role never used. ✓

**Type consistency:** `JourneyStatus`/`JourneyProgress` defined in Task 6 are consumed with identical names/shapes in Tasks 7–10. Store + route both return `{ progress: JourneyProgress[] }`. `ExplainResult` defined in Task 4 consumed in Task 5. `setJourneyStatus` signature `(phase, status)` consistent across user-data, route, store, and UI. ✓

**No test runner:** gates are `npm run lint` + `npm run build` + curl/manual verify everywhere — no placeholder "run the tests" steps. ✓
