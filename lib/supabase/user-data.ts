import type { User } from "@supabase/supabase-js";

import type { BuilderProfile, JourneyProgress, JourneyStatus, SavedAction } from "@/lib/types";
import { createClient } from "./server";

/**
 * Server-side access to per-user data (profile + saved actions).
 *
 * Every function is mock-safe: when Supabase is not configured `createClient()`
 * returns null and these helpers report "no user / no data" so callers fall
 * back to JSON fixtures + localStorage.
 */

type ProfileRow = {
  name: string | null;
  role: string | null;
  goal: string | null;
  current_skills: string[] | null;
  target_skills: string[] | null;
};

type SavedActionRow = {
  recommendation_id: string;
  title: string;
  category: string;
  action: string;
  saved_at: string;
};

type JourneyProgressRow = {
  phase: string;
  status: string;
  updated_at: string;
};

const VALID_STATUSES: JourneyStatus[] = ["not_started", "in_progress", "done", "blocked"];

function rowToJourneyProgress(row: JourneyProgressRow): JourneyProgress {
  const status = (VALID_STATUSES as string[]).includes(row.status)
    ? (row.status as JourneyStatus)
    : "not_started";
  return { phase: row.phase, status, updatedAt: row.updated_at };
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

function rowToProfile(row: ProfileRow): BuilderProfile {
  return {
    name: row.name ?? "",
    role: row.role ?? "",
    goal: row.goal ?? "",
    currentSkills: row.current_skills ?? [],
    targetSkills: row.target_skills ?? []
  };
}

/** A freshly seeded (empty) profile row should not override the demo fixture. */
function hasContent(profile: BuilderProfile): boolean {
  return Boolean(
    profile.goal.trim() ||
      profile.role.trim() ||
      profile.currentSkills.length ||
      profile.targetSkills.length
  );
}

/**
 * Returns the signed-in builder's saved profile, or null when not signed in,
 * no row exists, or the row is still empty (so the fixture demo stays visible).
 */
export async function getDbProfile(): Promise<BuilderProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("name, role, goal, current_skills, target_skills")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const profile = rowToProfile(data as ProfileRow);
  return hasContent(profile) ? profile : null;
}

/** Persists the profile for the signed-in user. No-op (false) in mock mode. */
export async function upsertDbProfile(profile: BuilderProfile): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      name: profile.name,
      role: profile.role,
      goal: profile.goal,
      current_skills: profile.currentSkills,
      target_skills: profile.targetSkills,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  return !error;
}

function rowToSavedAction(row: SavedActionRow): SavedAction {
  return {
    recommendationId: row.recommendation_id,
    title: row.title,
    category: row.category,
    action: row.action,
    savedAt: row.saved_at
  };
}

/** Lists the signed-in user's saved actions (newest first). [] in mock mode. */
export async function listSavedActions(): Promise<SavedAction[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_actions")
    .select("recommendation_id, title, category, action, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return (data as SavedActionRow[]).map(rowToSavedAction);
}

/**
 * Toggles a bookmark for the signed-in user and returns the updated list.
 * Returns null when there is no signed-in user (caller falls back to local).
 */
export async function toggleSavedAction(
  input: Omit<SavedAction, "savedAt">
): Promise<{ saved: boolean; actions: SavedAction[] } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("saved_actions")
    .select("id")
    .eq("user_id", user.id)
    .eq("recommendation_id", input.recommendationId)
    .maybeSingle();

  let saved: boolean;
  if (existing) {
    await supabase.from("saved_actions").delete().eq("id", (existing as { id: string }).id);
    saved = false;
  } else {
    await supabase.from("saved_actions").insert({
      user_id: user.id,
      recommendation_id: input.recommendationId,
      title: input.title,
      category: input.category,
      action: input.action
    });
    saved = true;
  }

  return { saved, actions: await listSavedActions() };
}

/** Lists the signed-in user's per-phase progress. [] in mock mode. */
export async function listJourneyProgress(): Promise<JourneyProgress[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("journey_progress")
    .select("phase, status, updated_at")
    .eq("user_id", user.id);

  if (error || !data) return [];
  return (data as JourneyProgressRow[]).map(rowToJourneyProgress);
}

/**
 * Upserts the status for one phase and returns the updated list.
 * Returns null when there is no signed-in user (caller falls back to local).
 */
export async function setJourneyStatus(
  phase: string,
  status: JourneyStatus
): Promise<{ progress: JourneyProgress[] } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase.from("journey_progress").upsert(
    {
      user_id: user.id,
      phase,
      status,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,phase" }
  );

  return { progress: await listJourneyProgress() };
}
