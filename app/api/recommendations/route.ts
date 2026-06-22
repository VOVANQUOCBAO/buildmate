import { getRecommendations } from "@/lib/buildmate-data";
import type { RecommendationFilter } from "@/lib/recommendation-engine";
import { decodeProfile } from "@/lib/profile-storage";
import { getDbProfile } from "@/lib/supabase/user-data";
import { NextRequest, NextResponse } from "next/server";

const filters: Record<string, RecommendationFilter> = {
  all: "All",
  workshop: "Workshop",
  "team-match": "Team Match",
  mentor: "Mentor",
  sponsor: "Sponsor"
};

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "all";
  const filter = filters[type.toLowerCase()];

  if (!filter) {
    return NextResponse.json({ error: `Unsupported recommendation type: ${type}` }, { status: 400 });
  }

  // Precedence: explicit query profile (demo/localStorage) > saved DB profile > fixture.
  const queryProfile = decodeProfile(request.nextUrl.searchParams.get("profile"));
  const profile = queryProfile ?? (await getDbProfile()) ?? undefined;

  return NextResponse.json(getRecommendations(filter, profile));
}
