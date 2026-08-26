import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client factory (design §10, design §2.1).
 *
 * Lazy singleton: the client is constructed on first call, not at module
 * top-level import time. This keeps the "fail fast on missing env vars"
 * guarantee for actual request-time usage (server boot / first request)
 * without breaking `next build`, where Route Handler modules can be loaded
 * for static analysis without ever being invoked.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) {
    return cached;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cached;
}
