export type BuilderProfile = {
  name: string;
  role: string;
  goal: string;
  currentSkills: string[];
  targetSkills: string[];
};

export type SavedAction = {
  recommendationId: string;
  title: string;
  category: string;
  action: string;
  savedAt: string;
};

export type RecommendationCategory = "Workshop" | "Team Match" | "Mentor" | "Sponsor";

export type RecommendationSource = {
  id: string;
  title: string;
  category: RecommendationCategory;
  action: string;
  goalKeywords: string[];
  coversSkills: string[];
  availabilityMatch: number;
  eventTimingRelevance: number;
  summary: string;
  detail: string;
  nextSteps: string[];
};

export type Recommendation = {
  id: string;
  title: string;
  category: RecommendationCategory;
  score: number;
  reason: string;
  action: string;
  summary: string;
  detail: string;
  nextSteps: string[];
  matchedSkills: string[];
  scoreBreakdown: {
    goalOverlap: number;
    skillGapCoverage: number;
    availabilityMatch: number;
    eventTimingRelevance: number;
  };
  engineVersion: string;
};

export type JourneyStep = {
  phase: string;
  title: string;
  description: string;
  status: "now" | "next" | "later";
  recommendedResourceId?: string;
  recommendedResourceTitle?: string;
  recommendedResourceHref?: string;
};

export type ProofMetric = {
  label: string;
  value: string;
  note: string;
};

export type EventResource = {
  id: string;
  title: string;
  tags: string[];
  skills: string[];
  time?: string;
  availability?: string;
  sponsor?: string;
  recommendedFor: string[];
};

export type OrganizerInsight = {
  label: string;
  value: string;
  note: string;
};

export type DashboardData = {
  profile: BuilderProfile;
  recommendations: Recommendation[];
  journey: JourneyStep[];
  skillGraph: string[];
  proofMetrics: ProofMetric[];
  organizerInsights: OrganizerInsight[];
};

export type JourneyStatus = "not_started" | "in_progress" | "done" | "blocked";

export type JourneyProgress = {
  phase: string;
  status: JourneyStatus;
  updatedAt: string;
};
