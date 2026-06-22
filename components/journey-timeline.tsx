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
