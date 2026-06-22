import type { JourneyStep } from "@/lib/types";
import Link from "next/link";

const statusStyles: Record<JourneyStep["status"], string> = {
  now: "bg-cyan-300 text-slate-950",
  next: "bg-violet-300 text-slate-950",
  later: "bg-white text-slate-600"
};

export function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((step) => (
        <article key={step.phase} className="soft-ring rounded-3xl bg-white/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold text-slate-400">{step.phase}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[step.status]}`}>
              {step.status}
            </span>
          </div>
          <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-slate-950">{step.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          {step.recommendedResourceHref && step.recommendedResourceTitle ? (
            <Link
              href={step.recommendedResourceHref}
              className="mt-5 inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              {step.recommendedResourceTitle}
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}
