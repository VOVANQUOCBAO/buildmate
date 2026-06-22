# Gate Landing-Page Data Behind a Completed Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:phat-trien-bang-subagent (recommended) or superpowers:thuc-thi-ke-hoach to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the landing page `/`, a signed-in builder who has not yet filled in their profile must see a gentle invitation to add their details — never the skill graph, recommendations, or "Next best builder actions" — while guests keep seeing the Maya Chen demo and signed-in builders with a saved profile see their own data.

**Architecture:** `app/page.tsx` becomes an async server component that resolves three states on the server (guest / signed-in-no-profile / signed-in-with-profile) and renders one of three bodies. The "skill graph + actions" UI (`BuildMateAsgDashboard`) is only rendered for guests (demo mode) and for signed-in users who already have a saved profile (personal mode). A new lightweight `PersonalizePrompt` component covers the signed-in-no-profile state. No API, engine, or data-fixture changes are needed — `getDbProfile()` already returns `null` for an empty/unfilled profile row via its `hasContent()` guard, so "đã điền đủ" maps exactly to `getDbProfile() !== null`.

**Tech Stack:** Next.js 16 (App Router, React Server Components), React 19, TypeScript, Tailwind v4, Supabase SSR.

## Global Constraints

- Keep all UI copy in **English** to match the surrounding page (the rest of `/` is English; do not introduce a single Vietnamese banner into an otherwise-English page).
- **Do not** add a test framework. This repo's only quality gates are `npm run lint` and `npm run build`; use those plus manual browser checks. (One line each, verbatim from project setup: scripts are `dev`, `build`, `start`, `lint` — there is no `test` script.)
- The builder's display name is the **account identity** from the Supabase session, never the stored profile's `name` field. Reuse the exact precedence used elsewhere: `(typeof user.user_metadata?.name === "string" && user.user_metadata.name) || user.email || "Builder"`.
- Guests (not signed in) must keep the existing demo behavior on `/` unchanged, including the Maya Chen fixture and the localStorage "Reset demo profile" flow.
- All paths below are relative to the project root `D:\skill\buildmate-asg-main`.

---

## File Structure

- `components/personalize-prompt.tsx` — **new.** Presentational, server-safe (no client hooks) gentle-invite card shown to signed-in users without a saved profile. Sibling to the existing `EmptyState` in `app/dashboard/page.tsx`, but intentionally lighter in tone ("one quick step", not "No profile yet"). Kept separate because the copy/tone differs and `EmptyState` is a private local function in the dashboard route; do not refactor the dashboard in this plan.
- `app/page.tsx` — **modify.** `Home` becomes `async`; add server-side auth + profile resolution and three-way branching. The existing `Header`, `AccountControls`, and `Launch` functions are unchanged.

These two files change together (the prompt exists only to be rendered by the gated landing page) and form the whole change.

---

### Task 1: Create the `PersonalizePrompt` gentle-invite component

**Files:**
- Create: `components/personalize-prompt.tsx`

**Interfaces:**
- Consumes: `Badge` from `@/components/badge` (existing; props `{ tone?: ... ; children }` — used elsewhere as `<Badge tone="violet">`).
- Produces: `export function PersonalizePrompt({ name }: { name: string }): JSX.Element` — Task 2 imports and renders this with the builder's display name.

- [ ] **Step 1: Write the component**

Create `components/personalize-prompt.tsx` with this exact content:

```tsx
import Link from "next/link";

import { Badge } from "@/components/badge";

/**
 * Shown on the landing page to a signed-in builder who has not filled in their
 * profile yet. Deliberately gentle ("one quick step") — it invites onboarding
 * instead of showing the demo's skill graph / recommendations, so personalized
 * data only appears after the builder enters their details.
 */
export function PersonalizePrompt({ name }: { name: string }) {
  return (
    <section className="section-hero border-y border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="glass-panel rounded-[2rem] p-8 md:p-12">
          <Badge tone="violet">One quick step</Badge>
          <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
            Welcome, {name}. Add your details to unlock your skill graph.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Your skill graph, recommendations, and next best builder actions appear as soon as
            you tell BuildMate ASG your role, goal, and skills. It takes about a minute.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-full bg-cyan-300 px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20"
            >
              Add your details
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-950/10 bg-white/70 px-6 py-4 text-sm font-bold text-slate-950"
            >
              Go to your dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run lint`
Expected: PASS with no errors referencing `components/personalize-prompt.tsx` (no unused imports, no missing types).

- [ ] **Step 3: Commit**

```bash
git add components/personalize-prompt.tsx
git commit -m "feat: add PersonalizePrompt gentle-invite component"
```

---

### Task 2: Gate `app/page.tsx` by auth + profile state

**Files:**
- Modify: `app/page.tsx:5-13` (the `Home` component body and its imports)

**Interfaces:**
- Consumes:
  - `getCurrentUser(): Promise<User | null>` and `getDbProfile(): Promise<BuilderProfile | null>` from `@/lib/supabase/user-data` (existing; `getDbProfile` already returns `null` for an unfilled row via `hasContent()`).
  - `BuildMateAsgDashboard` from `@/components/buildmate-dashboard` (existing; optional `personalProfile?: BuilderProfile` prop — when omitted it runs in demo mode, when provided it ignores localStorage/fixture and shows that profile).
  - `PersonalizePrompt` from `@/components/personalize-prompt` (Task 1).
- Produces: nothing consumed by later tasks (this is the final task).

- [ ] **Step 1: Add the new imports**

In `app/page.tsx`, the existing import block is:

```tsx
import { Badge } from "@/components/badge";
import { BuildMateAsgDashboard } from "@/components/buildmate-dashboard";
import { createClient } from "@/lib/supabase/server";
```

Replace it with (adds `PersonalizePrompt` and the two user-data helpers; keep `createClient` — `AccountControls` still uses it):

```tsx
import { Badge } from "@/components/badge";
import { BuildMateAsgDashboard } from "@/components/buildmate-dashboard";
import { PersonalizePrompt } from "@/components/personalize-prompt";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getDbProfile } from "@/lib/supabase/user-data";
```

- [ ] **Step 2: Make `Home` async and branch on auth + profile**

The existing `Home` is:

```tsx
export default function Home() {
  return (
    <main className="grid-paper min-h-screen overflow-hidden">
      <Header />
      <BuildMateAsgDashboard />
      <Launch />
    </main>
  );
}
```

Replace it with:

```tsx
export default async function Home() {
  // Resolve auth + saved profile on the server so unfilled signed-in builders
  // never receive the demo's skill graph / recommendations in the first place.
  const user = await getCurrentUser();
  const profile = user ? await getDbProfile() : null;

  const displayName = user
    ? (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      user.email ||
      "Builder"
    : "Builder";

  // The builder's name is their account identity, not stored profile data —
  // this keeps a stale "Maya Chen" onboarding row from showing on /.
  const personalProfile = profile ? { ...profile, name: displayName } : null;

  return (
    <main className="grid-paper min-h-screen overflow-hidden">
      <Header />
      {!user ? (
        // Guest: keep the public Maya Chen demo (+ localStorage personalization).
        <BuildMateAsgDashboard />
      ) : personalProfile ? (
        // Signed in with a filled profile: show their own data.
        <BuildMateAsgDashboard personalProfile={personalProfile} />
      ) : (
        // Signed in but nothing entered yet: gentle invite, no demo data.
        <PersonalizePrompt name={displayName} />
      )}
      <Launch />
    </main>
  );
}
```

- [ ] **Step 3: Verify lint + production build pass**

Run: `npm run lint && npm run build`
Expected: PASS. The build compiles `/` as a dynamic server route with no type errors. If lint flags `createClient` as unused, confirm `AccountControls` (lower in the same file) still calls it — it does; do not remove the import.

- [ ] **Step 4: Manual verification — guest still sees the demo**

Run: `npm run dev`, then in a private/incognito window (signed out) open `http://localhost:3000/`.
Expected: The hero badge reads "API-backed demo", the "Current builder" card shows **Maya Chen**, and the Skill Graph, "Next best builder actions", and journey sections all render. (Demo unchanged.)

- [ ] **Step 5: Manual verification — signed-in, no profile sees only the invite**

In a normal window, sign in with an account that has **not** completed onboarding (or first run the DB `delete from profiles where id = '<your-user-id>'`, or use a fresh account). Open `http://localhost:3000/`.
Expected: Header shows your real name; the body shows the **"One quick step / Welcome, <name>. Add your details to unlock your skill graph."** card with "Add your details" + "Go to your dashboard" buttons. There is **no** Skill Graph, **no** recommendations / "Next best builder actions", **no** journey, **no** Maya Chen data.

- [ ] **Step 6: Manual verification — signed-in, with profile sees their own data**

Still signed in, click "Add your details", complete onboarding, save. Return to `http://localhost:3000/`.
Expected: The hero badge reads "Your live profile"; the "Current builder" card shows **your** name; Skill Graph, recommendations, and journey render from **your** saved profile (not Maya Chen).

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: gate landing-page data behind a completed profile"
```

---

### Task 3: Make onboarding start empty and require real input

**Why:** With the form pre-filled with defaults, a builder could click "Use this profile" without typing anything and still create a "filled" profile row — so the landing gate showed data even though they never entered their own info. This task makes onboarding start blank and blocks saving until role, goal, and at least one skill are genuinely provided, so a profile only counts as "filled" when the builder really filled it.

**Files:**
- Modify: `app/onboarding/page.tsx` (initial state, a `canSave` guard, the save handler, the submit button, and input placeholders)

**Interfaces:**
- Consumes: existing `BuilderProfile` shape and `saveProfile()` flow (unchanged contract — still PUTs to `/api/profile` and writes localStorage).
- Produces: nothing consumed by other tasks. The downstream gate in `lib/supabase/user-data.ts` `hasContent()` is unchanged — it already treats a row with role/goal/skills as filled; this task simply stops empty rows from ever being created.

- [ ] **Step 1: Start the form empty**

In `app/onboarding/page.tsx`, the initial state is:

```tsx
  const [role, setRole] = useState("Full-stack builder");
  const [goal, setGoal] = useState("Ship an agentic workflow demo before Demo Day");
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Product Design"]);
  const [needs, setNeeds] = useState<string[]>(["Workshops", "Team matches"]);
```

Replace it with:

```tsx
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
```

- [ ] **Step 2: Add a `canSave` guard**

Immediately after the `missingSkills` `useMemo` block, add:

```tsx
  // A profile only counts as "filled" once the builder gives real input —
  // role, goal, and at least one current skill. This is what stops an empty /
  // default profile from unlocking the dashboard.
  const canSave = role.trim().length > 0 && goal.trim().length > 0 && skills.length > 0;
```

- [ ] **Step 3: Block `saveProfile` when not ready**

The `saveProfile` function starts with:

```tsx
  async function saveProfile() {
    const profile: BuilderProfile = {
```

Insert the guard as its first line:

```tsx
  async function saveProfile() {
    if (!canSave) return;
    const profile: BuilderProfile = {
```

- [ ] **Step 4: Add placeholders to the empty inputs**

The role input is:

```tsx
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
```

Add a placeholder:

```tsx
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Full-stack builder"
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
```

The goal textarea is:

```tsx
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
```

Add a placeholder:

```tsx
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={4}
                placeholder="e.g. Ship an agentic workflow demo before Demo Day"
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
```

- [ ] **Step 5: Disable the submit button + add a hint until the form is valid**

The submit button block is:

```tsx
              <button
                type="button"
                onClick={() => void saveProfile()}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                Use this profile
              </button>
```

Replace it with (adds `disabled` + disabled styling):

```tsx
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={!canSave}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use this profile
              </button>
```

Then, directly after the closing `</div>` of the buttons row (the `<div className="mt-6 flex flex-col gap-3 sm:flex-row">...</div>`), add a hint:

```tsx
            {!canSave ? (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Add your role, goal, and at least one current skill to continue.
              </p>
            ) : null}
```

- [ ] **Step 6: Verify lint + build pass**

Run: `npm run lint && npm run build`
Expected: PASS, no type errors.

- [ ] **Step 7: Manual verification**

With `npm run dev` running and signed in on an account whose profile row was deleted (or a fresh account):
1. Open `/onboarding` → role and goal fields are empty (showing placeholders), no skills selected, "Use this profile" is disabled, hint is visible.
2. Type a role, a goal, and select one skill → button enables, hint disappears.
3. Click "Use this profile" → redirected to `/dashboard` showing your data.
4. Open `/` → your live profile data shows (no invite).
5. Sign out / fresh account with no profile → `/` shows the "One quick step" invite, `/onboarding` is empty and cannot be saved blank.

- [ ] **Step 8: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: require real onboarding input before a profile counts as filled"
```

---

## Self-Review

**1. Spec coverage**
- "Phải điền rồi mới thấy các thông số" → Task 2 Step 2: signed-in users only get `BuildMateAsgDashboard` when `personalProfile` is non-null, and `getDbProfile()` returns null until the profile row has content (`hasContent()` in `lib/supabase/user-data.ts:66`). ✓
- "Giữ Maya Chen ở phần khách chưa đăng nhập" → Task 2 Step 2: the `!user` branch renders `<BuildMateAsgDashboard />` (demo mode) unchanged; verified in Step 4. ✓
- "Một lời mời nhẹ vào để điền thông tin" → Task 1 `PersonalizePrompt` ("One quick step" card with onboarding CTA); rendered by the signed-in-no-profile branch. ✓

**2. Placeholder scan** — No TBD/TODO/"handle edge cases" placeholders; every code step shows full content. ✓

**3. Type consistency** — `PersonalizePrompt({ name }: { name: string })` defined in Task 1, called as `<PersonalizePrompt name={displayName} />` (string) in Task 2. `getCurrentUser`/`getDbProfile` signatures match `lib/supabase/user-data.ts`. `personalProfile` spread `{ ...profile, name: displayName }` matches the `BuilderProfile` shape `BuildMateAsgDashboard` expects. ✓

**Note on `getDbProfile()` being called twice** — `Home` calls `getCurrentUser()` and `getDbProfile()`, and `AccountControls` independently calls `supabase.auth.getUser()`. This is a minor redundant session read on `/`, consistent with how `app/dashboard/page.tsx` already works; not worth threading state through props for a hackathon page. Left as-is intentionally.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-22-gate-landing-data-behind-profile.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
