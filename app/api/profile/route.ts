import { getProfile } from "@/lib/buildmate-data";
import { getCurrentUser, getDbProfile, upsertDbProfile } from "@/lib/supabase/user-data";
import type { BuilderProfile } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/** Returns the signed-in user's saved profile, or the demo fixture. */
export async function GET() {
  const profile = (await getDbProfile()) ?? getProfile();
  return NextResponse.json(profile);
}

/** Validates an unknown body into a BuilderProfile, or null. */
function parseProfile(body: unknown): BuilderProfile | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Partial<BuilderProfile>;

  if (
    typeof value.name !== "string" ||
    typeof value.role !== "string" ||
    typeof value.goal !== "string" ||
    !Array.isArray(value.currentSkills) ||
    !Array.isArray(value.targetSkills)
  ) {
    return null;
  }

  return {
    name: value.name,
    role: value.role,
    goal: value.goal,
    currentSkills: value.currentSkills.filter((skill): skill is string => typeof skill === "string"),
    targetSkills: value.targetSkills.filter((skill): skill is string => typeof skill === "string")
  };
}

/**
 * Persists the builder profile for the signed-in user. In mock mode (no auth)
 * `saved` is false and the client keeps relying on localStorage.
 */
export async function PUT(request: NextRequest) {
  const profile = parseProfile(await request.json().catch(() => null));
  if (!profile) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  // Name is the account identity, taken from the session — not the client body.
  // This keeps a placeholder like "Maya Chen" from ever being persisted.
  const user = await getCurrentUser();
  const authName = user
    ? (typeof user.user_metadata?.name === "string" && user.user_metadata.name) || user.email || profile.name
    : profile.name;

  const saved = await upsertDbProfile({ ...profile, name: authName });
  return NextResponse.json({ saved });
}
