import type { JourneyProgress, JourneyStatus } from "@/lib/types";

/**
 * Client-side journey-progress store with a transparent backend switch:
 *   - signed in → Supabase via /api/journey-progress
 *   - otherwise → browser localStorage (demo / signed-out)
 * A 401 from the API is the signal to fall back to localStorage.
 */

export const JOURNEY_PROGRESS_STORAGE_KEY = "buildmate-asg.journey-progress";

function readLocal(): JourneyProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOURNEY_PROGRESS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as JourneyProgress[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(progress: JourneyProgress[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function setLocal(phase: string, status: JourneyStatus): JourneyProgress[] {
  const current = readLocal().filter((p) => p.phase !== phase);
  const next = [{ phase, status, updatedAt: new Date().toISOString() }, ...current];
  writeLocal(next);
  return next;
}

export async function listJourneyProgress(): Promise<JourneyProgress[]> {
  try {
    const response = await fetch("/api/journey-progress");
    if (response.ok) {
      const data = (await response.json()) as { progress?: JourneyProgress[] };
      return data.progress ?? [];
    }
  } catch {
    // fall through to localStorage
  }
  return readLocal();
}

export async function setJourneyStatus(
  phase: string,
  status: JourneyStatus
): Promise<JourneyProgress[]> {
  try {
    const response = await fetch("/api/journey-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, status })
    });
    if (response.ok) {
      const data = (await response.json()) as { progress?: JourneyProgress[] };
      return data.progress ?? [];
    }
  } catch {
    // fall through to localStorage
  }
  return setLocal(phase, status);
}
