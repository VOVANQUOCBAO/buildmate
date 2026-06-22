import { getCurrentUser, listSavedActions, toggleSavedAction } from "@/lib/supabase/user-data";
import type { SavedAction } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * Saved (bookmarked) recommendations for the signed-in user.
 *
 * Returns 401 when there is no authenticated user (mock mode or signed out) so
 * the client store transparently falls back to localStorage.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json({ actions: await listSavedActions() });
}

function parseInput(body: unknown): Omit<SavedAction, "savedAt"> | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;

  if (
    typeof value.recommendationId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.category !== "string"
  ) {
    return null;
  }

  return {
    recommendationId: value.recommendationId,
    title: value.title,
    category: value.category,
    action: typeof value.action === "string" ? value.action : ""
  };
}

/** Toggles a bookmark on/off and returns { saved, actions }. */
export async function POST(request: NextRequest) {
  const input = parseInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Invalid saved-action payload" }, { status: 400 });
  }

  const result = await toggleSavedAction(input);
  if (!result) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json(result);
}
