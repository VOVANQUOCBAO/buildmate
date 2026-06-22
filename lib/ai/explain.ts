import type { BuilderProfile, Recommendation } from "@/lib/types";

/**
 * AI explanation layer for the recommendation engine (Groq-backed).
 *
 * The model only EXPLAINS and personalises a score the deterministic engine has
 * already computed — it never invents new recommendations. When GROQ_API_KEY is
 * absent or the call fails, we return the deterministic template so the endpoint
 * never breaks (graceful fallback, like the rest of the app).
 *
 * Groq exposes an OpenAI-compatible Chat Completions API, so we call it with a
 * plain fetch — no extra SDK dependency.
 */

export type ExplainResult = {
  explanation: string;
  nextSteps: string[];
  source: "groq" | "fallback";
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/** The deterministic template — identical in spirit to the old route output. */
export function buildFallback(recommendation: Recommendation): ExplainResult {
  return {
    explanation: `${recommendation.title} is recommended because it scores ${recommendation.score}/100 across goal fit, skill-gap coverage, timing, and availability. ${recommendation.detail}`,
    nextSteps: recommendation.nextSteps,
    source: "fallback"
  };
}

/** Pure: the grounding prompt. Easy to eyeball without an API call. */
export function buildExplainPrompt(
  recommendation: Recommendation,
  profile: BuilderProfile
): string {
  const b = recommendation.scoreBreakdown;
  return [
    "A deterministic Skill-Graph engine has ALREADY scored and ranked this recommendation for a hackathon builder.",
    "Your job: explain WHY it fits THIS builder, in 2-3 sentences, grounded only in the data below.",
    "Do NOT invent new recommendations, events, mentors, or facts. Do NOT change the score.",
    "",
    "BUILDER:",
    `- Role: ${profile.role || "(unspecified)"}`,
    `- Goal: ${profile.goal || "(unspecified)"}`,
    `- Current skills: ${profile.currentSkills.join(", ") || "(none listed)"}`,
    `- Target skills (gaps to close): ${profile.targetSkills.join(", ") || "(none listed)"}`,
    "",
    "RECOMMENDATION (engine output — treat as ground truth):",
    `- Title: ${recommendation.title}`,
    `- Category: ${recommendation.category}`,
    `- Score: ${recommendation.score}/100`,
    `- Score breakdown: goalOverlap=${b.goalOverlap}, skillGapCoverage=${b.skillGapCoverage}, availabilityMatch=${b.availabilityMatch}, eventTimingRelevance=${b.eventTimingRelevance}`,
    `- Skills it covers for this builder: ${recommendation.matchedSkills.join(", ") || "(none)"}`,
    `- Detail: ${recommendation.detail}`,
    `- Engine version: ${recommendation.engineVersion}`,
    "",
    "Respond with ONLY a JSON object, no markdown fences, in this exact shape:",
    `{"explanation": "<2-3 sentence grounded explanation>", "nextSteps": ["<short step>", "<short step>", "<short step>"]}`
  ].join("\n");
}

type ParsedModel = { explanation?: unknown; nextSteps?: unknown };

/** Tolerant parse of the model's JSON; returns null if it isn't usable. */
function parseModelJson(text: string): { explanation: string; nextSteps: string[] } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as ParsedModel;
    if (typeof parsed.explanation !== "string" || !parsed.explanation.trim()) return null;
    const nextSteps = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((s): s is string => typeof s === "string")
      : [];
    return { explanation: parsed.explanation.trim(), nextSteps };
  } catch {
    return null;
  }
}

/**
 * Returns a Groq-grounded explanation when GROQ_API_KEY is set and the call +
 * parse succeed; otherwise the deterministic fallback. Never throws.
 */
export async function generateExplanation(
  recommendation: Recommendation,
  profile: BuilderProfile
): Promise<ExplainResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return buildFallback(recommendation);

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You ground every answer in the supplied builder profile and engine output. You never fabricate recommendations or facts. You reply with strict JSON only."
          },
          { role: "user", content: buildExplainPrompt(recommendation, profile) }
        ]
      })
    });

    if (!response.ok) return buildFallback(recommendation);

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseModelJson(text);
    if (!parsed) return buildFallback(recommendation);

    return {
      explanation: parsed.explanation,
      nextSteps: parsed.nextSteps.length ? parsed.nextSteps : recommendation.nextSteps,
      source: "groq"
    };
  } catch {
    return buildFallback(recommendation);
  }
}
