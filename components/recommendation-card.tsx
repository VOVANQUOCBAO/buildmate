"use client";

import Link from "next/link";
import { useState } from "react";

import type { Recommendation } from "@/lib/types";

const categoryStyles: Record<Recommendation["category"], string> = {
  Workshop: "bg-cyan-100 text-cyan-950",
  "Team Match": "bg-violet-100 text-violet-950",
  Mentor: "bg-amber-100 text-amber-950",
  Sponsor: "bg-emerald-100 text-emerald-950"
};

export function RecommendationCard({
  recommendation,
  saved = false,
  onToggleSave
}: {
  recommendation: Recommendation;
  saved?: boolean;
  onToggleSave?: (recommendation: Recommendation) => void;
}) {
  return (
    <article className="glass-panel rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryStyles[recommendation.category]}`}>
            {recommendation.category}
          </span>
          <h3 className="mt-4 text-xl font-bold tracking-[-0.03em] text-slate-950">{recommendation.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {onToggleSave ? (
            <button
              type="button"
              onClick={() => onToggleSave(recommendation)}
              aria-pressed={saved}
              aria-label={saved ? "Remove bookmark" : "Save for later"}
              title={saved ? "Saved — click to remove" : "Save for later"}
              className={`grid h-9 w-9 place-items-center rounded-full border text-base transition ${
                saved
                  ? "border-slate-950 bg-slate-950 text-cyan-300"
                  : "border-slate-950/10 bg-white/70 text-slate-500 hover:border-slate-950/30"
              }`}
            >
              {saved ? "★" : "☆"}
            </button>
          ) : null}
          <div className="text-right">
            <p className="font-mono text-3xl font-black text-slate-950">{recommendation.score}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Fit</p>
          </div>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600">{recommendation.reason}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <ScorePill label="Goal" value={recommendation.scoreBreakdown.goalOverlap} />
        <ScorePill label="Gaps" value={recommendation.scoreBreakdown.skillGapCoverage} />
        <ScorePill label="Timing" value={recommendation.scoreBreakdown.eventTimingRelevance} />
        <ScorePill label="Avail" value={recommendation.scoreBreakdown.availabilityMatch} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recommendation.matchedSkills.map((skill) => (
          <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {skill}
          </span>
        ))}
      </div>

      <details className="mt-4 rounded-2xl border border-slate-950/10 bg-white/70 p-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Why this recommendation?
        </summary>
        <p className="mt-3 text-sm leading-6 text-slate-600">{recommendation.detail}</p>
        <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
          {recommendation.nextSteps.map((step) => (
            <li key={step}>• {step}</li>
          ))}
        </ul>
      </details>

      <AiExplain id={recommendation.id} />

      <RecommendationAction recommendation={recommendation} />
    </article>
  );
}

type AiState = "idle" | "loading" | "done" | "error";
type AiResult = { explanation: string; nextSteps: string[]; source: string };

function AiExplain({ id }: { id: string }) {
  const [state, setState] = useState<AiState>("idle");
  const [result, setResult] = useState<AiResult | null>(null);

  async function run() {
    setState("loading");
    try {
      const res = await fetch(`/api/explain?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as AiResult;
      setResult({ explanation: data.explanation, nextSteps: data.nextSteps ?? [], source: data.source });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done" && result) {
    return (
      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">✨ AI explanation</span>
          <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-900">
            {result.source === "groq" ? "Groq · Llama 3.3" : "fallback"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{result.explanation}</p>
        {result.nextSteps.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-600">
            {result.nextSteps.map((step) => (
              <li key={step}>→ {step}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={run}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-900 transition hover:bg-violet-100 disabled:opacity-60"
      >
        {state === "loading" ? "Thinking…" : "✨ Explain with AI"}
      </button>
      {state === "error" ? (
        <p className="mt-2 text-xs font-semibold text-rose-500">AI unavailable — please try again.</p>
      ) : null}
    </div>
  );
}

function RecommendationAction({ recommendation }: { recommendation: Recommendation }) {
  const href =
    recommendation.category === "Workshop"
      ? `/workshops/${recommendation.id}`
      : recommendation.category === "Mentor"
        ? `/mentors/${recommendation.id}`
        : null;

  if (href) {
    return (
      <Link href={href} className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white">
        {recommendation.action}
      </Link>
    );
  }

  return (
    <button className="mt-5 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white">
      {recommendation.action}
    </button>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-950/10 bg-white/70 p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
