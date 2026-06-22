"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/badge";
import { JourneyTimeline } from "@/components/journey-timeline";
import { RecommendationCard } from "@/components/recommendation-card";
import { SkillGraph } from "@/components/skill-graph";
import {
  BUILDMATE_PROFILE_STORAGE_KEY,
  decodeProfile,
  encodeProfile
} from "@/lib/profile-storage";
import {
  listJourneyProgress as fetchJourneyProgress,
  setJourneyStatus as persistJourneyStatus
} from "@/lib/journey-progress-store";
import { listSavedActions, toggleSavedAction } from "@/lib/saved-actions-store";
import type { BuilderProfile, DashboardData, JourneyStatus, Recommendation } from "@/lib/types";

type LoadState = "idle" | "loading" | "ready" | "error";
type RecommendationFilter = {
  label: string;
  type: string;
};

const recommendationFilters: RecommendationFilter[] = [
  { label: "All", type: "all" },
  { label: "Workshops", type: "workshop" },
  { label: "Team matches", type: "team-match" },
  { label: "Mentors", type: "mentor" },
  { label: "Sponsors", type: "sponsor" }
];

export function BuildMateAsgDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeProfile, setActiveProfile] = useState<BuilderProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [recommendationFilter, setRecommendationFilter] = useState("all");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [progressByPhase, setProgressByPhase] = useState<Record<string, JourneyStatus>>({});
  const [error, setError] = useState<string | null>(null);

  const refreshSaved = useCallback(async () => {
    const actions = await listSavedActions();
    setSavedIds(new Set(actions.map((action) => action.recommendationId)));
  }, []);

  const cycleJourneyStatus = async (phase: string, next: JourneyStatus) => {
    setProgressByPhase((prev) => ({ ...prev, [phase]: next })); // optimistic
    const list = await persistJourneyStatus(phase, next);
    setProgressByPhase(Object.fromEntries(list.map((p) => [p.phase, p.status])));
  };

  const toggleSave = useCallback(async (recommendation: Recommendation) => {
    const { actions } = await toggleSavedAction({
      recommendationId: recommendation.id,
      title: recommendation.title,
      category: recommendation.category,
      action: recommendation.action
    });
    setSavedIds(new Set(actions.map((action) => action.recommendationId)));
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    try {
      const storedProfile = readStoredProfile();
      const response = await fetch(`/api/dashboard${profileQuery(storedProfile)}`);
      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
      setActiveProfile(storedProfile);
      setRecommendationFilter("all");
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load BuildMate ASG dashboard data");
      setLoadState("error");
    }
  }, []);

  const loadRecommendations = useCallback(async (type: string) => {
    setRecommendationsLoading(true);
    setError(null);

    try {
      const storedProfile = readStoredProfile();
      const response = await fetch(`/api/recommendations?type=${type}${profileQuery(storedProfile, "&")}`);
      if (!response.ok) {
        throw new Error(`Recommendations API returned ${response.status}`);
      }

      const recommendations = (await response.json()) as DashboardData["recommendations"];
      setData((current) => (current ? { ...current, profile: storedProfile ?? current.profile, recommendations } : current));
      setActiveProfile(storedProfile);
      setRecommendationFilter(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load filtered recommendations");
      setLoadState("error");
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const resetProfile = useCallback(async () => {
    window.localStorage.removeItem(BUILDMATE_PROFILE_STORAGE_KEY);
    await loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
      void refreshSaved();
      void fetchJourneyProgress().then((list) => {
        setProgressByPhase(
          Object.fromEntries(list.map((p) => [p.phase, p.status]))
        );
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard, refreshSaved]);

  if (loadState === "error") {
    return (
      <section className="section-hero border-y border-slate-950/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="glass-panel rounded-[2rem] p-8">
            <Badge tone="amber">Data error</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">BuildMate ASG could not load.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <Hero
        data={data}
        activeProfile={activeProfile}
        onRefresh={loadDashboard}
        onResetProfile={resetProfile}
        isRefreshing={loadState === "loading"}
      />
      <CopilotPanel data={data} />
      <Recommendations
        data={data}
        activeFilter={recommendationFilter}
        isLoading={recommendationsLoading}
        onFilterChange={loadRecommendations}
        savedIds={savedIds}
        onToggleSave={toggleSave}
      />
      <Journey data={data} progressByPhase={progressByPhase} onCycleStatus={cycleJourneyStatus} />
      <OrganizerInsights data={data} />
      <Proof data={data} />
    </>
  );
}

function Hero({
  data,
  activeProfile,
  onRefresh,
  onResetProfile,
  isRefreshing
}: {
  data: DashboardData;
  activeProfile: BuilderProfile | null;
  onRefresh: () => Promise<void>;
  onResetProfile: () => Promise<void>;
  isRefreshing: boolean;
}) {
  return (
    <section className="section-hero border-y border-slate-950/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 pt-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <div className="flex flex-wrap gap-3">
            <Badge>Agentic build week</Badge>
            <Badge tone="violet">Skill Graph</Badge>
            <Badge tone="amber">{activeProfile ? "Personalized from onboarding" : "API-backed demo"}</Badge>
          </div>
          <h1 className="mt-8 max-w-5xl text-6xl font-black tracking-[-0.06em] text-slate-950 md:text-8xl">
            The shortest path from learning to shipping.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            BuildMate ASG turns workshops, mentors, teammates, sponsor resources, and deadlines into a personalized builder journey.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="rounded-full bg-cyan-300 px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20" href="#recommendations">
              View recommendations
            </a>
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              className="rounded-full border border-slate-950/10 bg-white/70 px-6 py-4 text-sm font-bold text-slate-950 disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh API data"}
            </button>
            {activeProfile ? (
              <button
                type="button"
                onClick={() => void onResetProfile()}
                className="rounded-full border border-slate-950/10 bg-white/70 px-6 py-4 text-sm font-bold text-slate-950"
              >
                Reset demo profile
              </button>
            ) : null}
          </div>
        </div>

        <div className="dark-card relative rounded-[2rem] p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <Badge tone="dark">Builder Mode</Badge>
              <span className="font-mono text-xs text-white/50">/api/dashboard</span>
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-white/60">Current builder</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-black tracking-[-0.04em]">{data.profile.name}</h2>
                  <p className="mt-2 text-cyan-200">{data.profile.role}</p>
                </div>
                <p className="font-mono text-5xl font-bold text-cyan-300">
                  {data.recommendations[0]?.score ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <DarkMetric label="Skills" value={data.profile.currentSkills.length.toString()} />
              <DarkMetric label="Gaps" value={data.profile.targetSkills.length.toString()} />
              <DarkMetric label="Actions" value={data.recommendations.length.toString()} />
            </div>
            <div className="mt-6 rounded-3xl bg-cyan-300 p-5 text-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.22em]">AI recommendation</p>
              <p className="mt-3 text-sm leading-6">
                {data.recommendations[0]?.reason ?? "No recommendation is available yet."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function readStoredProfile(): BuilderProfile | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(BUILDMATE_PROFILE_STORAGE_KEY);
  return decodeProfile(stored ? encodeURIComponent(stored) : null);
}

function profileQuery(profile: BuilderProfile | null, prefix = "?"): string {
  return profile ? `${prefix}profile=${encodeProfile(profile)}` : "";
}

function CopilotPanel({ data }: { data: DashboardData }) {
  return (
    <section id="copilot" className="section-copilot border-b border-slate-950/10">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <Badge tone="violet">AI builder copilot</Badge>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
            Context first, chat second.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            BuildMate ASG avoids the generic chatbot trap by grounding every answer in a builder profile, event schedule,
            team needs, mentor availability, and sponsor resources.
          </p>
          <div className="mt-6 rounded-3xl bg-white/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Builder goal</p>
            <p className="mt-3 text-lg font-bold text-slate-950">{data.profile.goal}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.profile.targetSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <SkillGraph nodes={data.skillGraph} />
      </div>
    </section>
  );
}

function Recommendations({
  data,
  activeFilter,
  isLoading,
  onFilterChange,
  savedIds,
  onToggleSave
}: {
  data: DashboardData;
  activeFilter: string;
  isLoading: boolean;
  onFilterChange: (type: string) => Promise<void>;
  savedIds: Set<string>;
  onToggleSave: (recommendation: Recommendation) => Promise<void>;
}) {
  return (
    <section id="recommendations" className="section-recommendations border-b border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Recommendation board</Badge>
              <span className="rounded-full border border-slate-950/10 bg-white/70 px-3 py-1 text-xs font-bold text-slate-600">
                ★ {savedIds.size} saved
              </span>
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Next best builder actions</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Ranked by a deterministic Skill Graph engine, with score breakdowns for goal fit, skill gaps, timing, and availability.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {recommendationFilters.map((filter) => (
            <button
              key={filter.type}
              type="button"
              onClick={() => void onFilterChange(filter.type)}
              disabled={isLoading}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeFilter === filter.type
                  ? "bg-slate-950 text-white"
                  : "border border-slate-950/10 bg-white/70 text-slate-700"
              } disabled:opacity-60`}
            >
              {filter.label}
            </button>
          ))}
          {isLoading ? <span className="px-3 py-2 text-sm font-semibold text-slate-500">Scoring...</span> : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.title}
              recommendation={recommendation}
              saved={savedIds.has(recommendation.id)}
              onToggleSave={(rec) => void onToggleSave(rec)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

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

function OrganizerInsights({ data }: { data: DashboardData }) {
  return (
    <section className="section-organizer border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="dark-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge tone="dark">Organizer Intelligence</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">
              What the event team can learn from builder demand.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/60">
            BuildMate ASG is useful for builders first, but the same Skill Graph can help organizers route mentors,
            workshops, and sponsor resources.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {data.organizerInsights.map((insight) => (
            <div key={insight.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{insight.label}</p>
              <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-cyan-300">{insight.value}</p>
              <p className="mt-3 text-sm leading-6 text-white/60">{insight.note}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function Proof({ data }: { data: DashboardData }) {
  return (
    <section className="section-proof border-b border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-4">
          {data.proofMetrics.map((metric) => (
            <div key={metric.label} className="soft-ring rounded-3xl bg-white/75 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
              <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950">{metric.value}</p>
              <p className="mt-3 text-sm text-slate-600">{metric.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <section className="section-hero border-y border-slate-950/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-panel animate-pulse rounded-[2rem] p-8">
            <div className="h-8 w-48 rounded-full bg-slate-200" />
            <div className="mt-8 h-32 rounded-3xl bg-slate-200" />
            <div className="mt-6 h-16 rounded-3xl bg-slate-200" />
          </div>
          <div className="dark-card animate-pulse rounded-[2rem] p-8">
            <div className="h-8 w-32 rounded-full bg-white/10" />
            <div className="mt-8 h-48 rounded-3xl bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-2 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}
