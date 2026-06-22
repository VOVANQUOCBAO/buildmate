import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/badge";
import { getRecommendationById } from "@/lib/buildmate-data";

export default async function WorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recommendation = getRecommendationById(id);

  if (!recommendation || recommendation.category !== "Workshop") {
    notFound();
  }

  return (
    <main className="grid-paper min-h-screen px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-950">
          ← Back to dashboard
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <article className="glass-panel rounded-[2rem] p-6">
            <Badge>Workshop detail</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">
              {recommendation.title}
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">{recommendation.detail}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {recommendation.nextSteps.map((step) => (
                <div key={step} className="rounded-3xl border border-slate-950/10 bg-white/70 p-4 text-sm font-bold text-slate-700">
                  {step}
                </div>
              ))}
            </div>
          </article>

          <aside className="dark-card rounded-[2rem] p-6">
            <Badge tone="dark">Skill Graph score</Badge>
            <p className="mt-5 font-mono text-6xl font-black text-cyan-300">{recommendation.score}</p>
            <p className="mt-2 text-sm text-white/60">Fit score from deterministic scoring engine.</p>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p>Goal overlap: {recommendation.scoreBreakdown.goalOverlap}</p>
              <p>Skill gap coverage: {recommendation.scoreBreakdown.skillGapCoverage}</p>
              <p>Timing relevance: {recommendation.scoreBreakdown.eventTimingRelevance}</p>
              <p>Availability: {recommendation.scoreBreakdown.availabilityMatch}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
