import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Server Supabase client (Server Components, Route Handlers, Server Actions).
 * Returns null in mock mode so callers fall back to JSON fixtures.
 *
 * The cookie `setAll` is wrapped in try/catch: it throws when invoked from a
 * Server Component (cookies are read-only there). That is safe to ignore
 * because `middleware.ts` refreshes the session cookie on every request.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware handles the refresh.
        }
      }
    }
  });
}
