/**
 * Central switch between "real" mode (Supabase-backed user data) and
 * "mock" mode (local JSON fixtures + localStorage).
 *
 * When the Supabase env vars are absent the whole app gracefully falls back
 * to the original hackathon demo behaviour, so the project always runs with
 * `npm run dev` even before any backend is provisioned.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Absolute site URL used to build OAuth / magic-link redirect targets.
 * Falls back to the request origin at runtime when not set.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
