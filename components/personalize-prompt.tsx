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
