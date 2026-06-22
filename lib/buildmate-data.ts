import journey from "@/data/journey.json";
import organizerInsights from "@/data/organizer-insights.json";
import profile from "@/data/profile.json";
import proofMetrics from "@/data/proof-metrics.json";
import recommendationSources from "@/data/recommendations.json";
import skillGraph from "@/data/skill-graph.json";
import { rankRecommendations, type RecommendationFilter } from "@/lib/recommendation-engine";
import type {
  BuilderProfile,
  DashboardData,
  OrganizerInsight,
  JourneyStep,
  ProofMetric,
  Recommendation,
  RecommendationSource
} from "@/lib/types";

export function getProfile(): BuilderProfile {
  return profile;
}

export function getRecommendations(
  filter: RecommendationFilter = "All",
  profileOverride?: BuilderProfile
): Recommendation[] {
  return rankRecommendations(profileOverride ?? getProfile(), recommendationSources as RecommendationSource[], filter);
}

export function getRecommendationById(id: string): Recommendation | undefined {
  return getRecommendations().find((recommendation) => recommendation.id === id);
}

export function getJourney(): JourneyStep[] {
  return journey as JourneyStep[];
}

export function getSkillGraph(): string[] {
  return skillGraph;
}

export function getProofMetrics(): ProofMetric[] {
  return proofMetrics;
}

export function getOrganizerInsights(): OrganizerInsight[] {
  return organizerInsights;
}

export function getDashboardData(profileOverride?: BuilderProfile): DashboardData {
  const profileData = profileOverride ?? getProfile();

  return {
    profile: profileData,
    recommendations: getRecommendations("All", profileData),
    journey: getJourney(),
    skillGraph: getSkillGraph(),
    proofMetrics: getProofMetrics(),
    organizerInsights: getOrganizerInsights()
  };
}
