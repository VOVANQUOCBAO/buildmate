import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/badge";
import { getRecommendationById } from "@/lib/buildmate-data";

export default async function MentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recommendation = getRecommendationById(id);

  if (!recommendation || recommendation.category !== "Mentor") {
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
            <Badge tone="amber">Mentor detail</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">
              {recommendation.title}
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">{recommendation.detail}</p>

            <div className="mt-6 rounded-3xl bg-white/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Questions to ask</p>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                {recommendation.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </article>

          <aside className="dark-card rounded-[2rem] p-6">
            <Badge tone="dark">Why this mentor</Badge>
            <p className="mt-5 text-sm leading-7 text-white/70">{recommendation.reason}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {recommendation.matchedSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-bold text-slate-950">
                  {skill}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
