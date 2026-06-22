import { getCurrentUser, listJourneyProgress, setJourneyStatus } from "@/lib/supabase/user-data";
import type { JourneyStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * Per-phase builder journey progress for the signed-in user.
 * Returns 401 in mock mode / signed out so the client store falls back to
 * localStorage.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json({ progress: await listJourneyProgress() });
}

const VALID_STATUSES: JourneyStatus[] = ["not_started", "in_progress", "done", "blocked"];

function parseInput(body: unknown): { phase: string; status: JourneyStatus } | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (typeof value.phase !== "string" || !value.phase.trim()) return null;
  if (typeof value.status !== "string" || !(VALID_STATUSES as string[]).includes(value.status)) {
    return null;
  }
  return { phase: value.phase, status: value.status as JourneyStatus };
}

/** Sets the status for one phase and returns { progress }. */
export async function POST(request: NextRequest) {
  const input = parseInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Invalid journey-progress payload" }, { status: 400 });
  }

  const result = await setJourneyStatus(input.phase, input.status);
  if (!result) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json(result);
}
