import { getRecommendationById } from "@/lib/buildmate-data";
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing recommendation id" }, { status: 400 });
  }

  const recommendation = getRecommendationById(id);

  if (!recommendation) {
    return NextResponse.json({ error: `Unknown recommendation id: ${id}` }, { status: 404 });
  }

  return NextResponse.json({
    id,
    engineVersion: recommendation.engineVersion,
    explanation: `${recommendation.title} is recommended because it scores ${recommendation.score}/100 across goal fit, skill-gap coverage, timing, and availability. ${recommendation.detail}`,
    nextSteps: recommendation.nextSteps
  });
}
