import { generateExplanation } from "@/lib/ai/explain";
import { getProfile, getRecommendationById } from "@/lib/buildmate-data";
import { getDbProfile } from "@/lib/supabase/user-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing recommendation id" }, { status: 400 });
  }

  const recommendation = getRecommendationById(id);

  if (!recommendation) {
    return NextResponse.json({ error: `Unknown recommendation id: ${id}` }, { status: 404 });
  }

  // Ground in the signed-in builder's DB profile when available, else fixture.
  const profile = (await getDbProfile()) ?? getProfile();
  const result = await generateExplanation(recommendation, profile);

  return NextResponse.json({
    id,
    engineVersion: recommendation.engineVersion,
    explanation: result.explanation,
    nextSteps: result.nextSteps,
    source: result.source
  });
}
