import { getDashboardData } from "@/lib/buildmate-data";
import { decodeProfile } from "@/lib/profile-storage";
import { getDbProfile } from "@/lib/supabase/user-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Precedence: explicit query profile (demo/localStorage) > saved DB profile > fixture.
  const queryProfile = decodeProfile(request.nextUrl.searchParams.get("profile"));
  const profile = queryProfile ?? (await getDbProfile()) ?? undefined;
  return NextResponse.json(getDashboardData(profile));
}
