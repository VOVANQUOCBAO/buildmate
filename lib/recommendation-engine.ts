import type { BuilderProfile, Recommendation, RecommendationCategory, RecommendationSource } from "@/lib/types";

export const ENGINE_VERSION = "skill-graph-v0.1";

export type RecommendationFilter = RecommendationCategory | "All";

export function rankRecommendations(
  profile: BuilderProfile,
  sources: RecommendationSource[],
  filter: RecommendationFilter = "All"
): Recommendation[] {
  return sources
    .filter((source) => filter === "All" || source.category === filter)
    .map((source) => scoreRecommendation(profile, source))
    .sort((a, b) => b.score - a.score);
}

function scoreRecommendation(profile: BuilderProfile, source: RecommendationSource): Recommendation {
  const goalOverlap = scoreGoalOverlap(profile.goal, source.goalKeywords);
  const matchedSkills = findMatchedSkills(profile, source);
  const skillGapCoverage = profile.targetSkills.length > 0 ? matchedSkills.length / profile.targetSkills.length : 0;
  const availabilityMatch = clamp01(source.availabilityMatch);
  const eventTimingRelevance = clamp01(source.eventTimingRelevance);

  const score = Math.round(
    goalOverlap * 40 +
      skillGapCoverage * 30 +
      availabilityMatch * 15 +
      eventTimingRelevance * 15
  );

  return {
    id: source.id,
    title: source.title,
    category: source.category,
    action: source.action,
    summary: source.summary,
    detail: source.detail,
    nextSteps: source.nextSteps,
    score,
    reason: buildReason(profile, source, matchedSkills, score),
    matchedSkills,
    scoreBreakdown: {
      goalOverlap: Math.round(goalOverlap * 100),
      skillGapCoverage: Math.round(skillGapCoverage * 100),
      availabilityMatch: Math.round(availabilityMatch * 100),
      eventTimingRelevance: Math.round(eventTimingRelevance * 100)
    },
    engineVersion: ENGINE_VERSION
  };
}

function scoreGoalOverlap(goal: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const normalizedGoal = goal.toLowerCase();
  const hits = keywords.filter((keyword) => normalizedGoal.includes(keyword.toLowerCase()));
  return hits.length / keywords.length;
}

function findMatchedSkills(profile: BuilderProfile, source: RecommendationSource): string[] {
  const sourceSkills = source.coversSkills.map((skill) => skill.toLowerCase());
  return profile.targetSkills.filter((skill) => sourceSkills.includes(skill.toLowerCase()));
}

function buildReason(
  profile: BuilderProfile,
  source: RecommendationSource,
  matchedSkills: string[],
  score: number
): string {
  const skillText =
    matchedSkills.length > 0
      ? `It covers ${matchedSkills.join(", ")} for ${profile.name}'s current skill gaps.`
      : "It supports the builder journey even though it does not directly close a target skill gap.";

  return `${source.summary} ${skillText} Fit score: ${score}/100.`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
