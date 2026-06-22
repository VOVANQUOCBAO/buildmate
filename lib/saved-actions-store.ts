import type { SavedAction } from "@/lib/types";

/**
 * Client-side saved-actions store with a transparent backend switch:
 *   - signed in  → Supabase via /api/saved-actions
 *   - otherwise  → browser localStorage (demo / signed-out)
 *
 * The API returns 401 when not authenticated, which is the signal to fall back
 * to localStorage. Callers don't need to know which backend is active.
 */

export const SAVED_ACTIONS_STORAGE_KEY = "buildmate-asg.saved-actions";

type ToggleInput = Omit<SavedAction, "savedAt">;
type ToggleResult = { saved: boolean; actions: SavedAction[] };

function readLocal(): SavedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACTIONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as SavedAction[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(actions: SavedAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
}

function toggleLocal(input: ToggleInput): ToggleResult {
  const actions = readLocal();
  const exists = actions.some((action) => action.recommendationId === input.recommendationId);

  if (exists) {
    const next = actions.filter((action) => action.recommendationId !== input.recommendationId);
    writeLocal(next);
    return { saved: false, actions: next };
  }

  const next = [{ ...input, savedAt: new Date().toISOString() }, ...actions];
  writeLocal(next);
  return { saved: true, actions: next };
}

export async function listSavedActions(): Promise<SavedAction[]> {
  try {
    const response = await fetch("/api/saved-actions");
    if (response.ok) {
      const data = (await response.json()) as { actions?: SavedAction[] };
      return data.actions ?? [];
    }
  } catch {
    // fall through to localStorage
  }
  return readLocal();
}

export async function toggleSavedAction(input: ToggleInput): Promise<ToggleResult> {
  try {
    const response = await fetch("/api/saved-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (response.ok) {
      return (await response.json()) as ToggleResult;
    }
  } catch {
    // fall through to localStorage
  }
  return toggleLocal(input);
}
