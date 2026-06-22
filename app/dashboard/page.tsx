import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/badge";
import { BuildMateAsgDashboard } from "@/components/buildmate-dashboard";
import { getCurrentUser, getDbProfile } from "@/lib/supabase/user-data";

/**
 * Personal builder dashboard. Unlike the public landing page (which shows the
 * Maya Chen demo fixture), this route requires sign-in and renders only the
 * signed-in builder's own profile + score.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const displayName =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) || user.email || "Builder";

  const profile = await getDbProfile();

  // The builder's name is their account identity, never client-supplied profile
  // data — this keeps a stale/placeholder stored name (e.g. an old "Maya Chen"
  // onboarding row) from ever showing on the personal dashboard.
  const personalProfile = profile ? { ...profile, name: displayName } : null;

  return (
    <main className="grid-paper min-h-screen overflow-hidden">
      <DashboardHeader name={displayName} />
      {personalProfile ? (
        <BuildMateAsgDashboard personalProfile={personalProfile} />
      ) : (
        <EmptyState name={displayName} />
      )}
    </main>
  );
}

function DashboardHeader({ name }: { name: string }) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-cyan-300">
          BM
        </div>
        <div>
          <p className="text-sm font-bold text-slate-950">BuildMate ASG</p>
          <p className="text-xs text-slate-500">Your builder dashboard</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[12rem] truncate rounded-full border border-slate-950/10 bg-white/70 px-4 py-2.5 text-sm font-bold text-slate-700 sm:inline">
          {name}
        </span>
        <Link
          href="/onboarding"
          className="rounded-full border border-slate-950/10 bg-white/70 px-5 py-3 text-sm font-bold text-slate-950 hover:border-slate-950/30"
        >
          Edit profile
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <section className="section-hero border-y border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="glass-panel rounded-[2rem] p-8 md:p-12">
          <Badge tone="violet">No profile yet</Badge>
          <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
            Welcome, {name}. Let&apos;s build your skill graph.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Your dashboard is empty because we don&apos;t have your skills and goals yet. Complete a one-minute
            onboarding and BuildMate ASG will score your personalized builder actions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-full bg-cyan-300 px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20"
            >
              Start onboarding
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-950/10 bg-white/70 px-6 py-4 text-sm font-bold text-slate-950"
            >
              View the demo first
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
