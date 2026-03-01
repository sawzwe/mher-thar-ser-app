import type { SupabaseClient } from "@supabase/supabase-js";

const LOCK_TIMEOUT_MS = 8000;
const VISIBILITY_TIMEOUT_MS = 4000;

/**
 * Wraps a promise with a timeout. If the operation exceeds the limit,
 * we reject so our code doesn't block. The underlying promise continues
 * (and will eventually release any lock), but we stop waiting.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

/**
 * Get the current user with a timeout to avoid holding the Navigator lock
 * indefinitely. If the call times out, returns null (treat as guest).
 */
export async function getUserWithTimeout(
  supabase: SupabaseClient,
  timeoutMs = LOCK_TIMEOUT_MS
) {
  try {
    const { data } = await withTimeout(
      supabase.auth.getUser(),
      timeoutMs,
      "getUser"
    );
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the session from storage (no server verification). Lighter than getUser,
 * holds the lock for less time. Use for cross-tab sync on visibilitychange.
 */
export async function getSessionWithTimeout(
  supabase: SupabaseClient,
  timeoutMs = VISIBILITY_TIMEOUT_MS
) {
  try {
    const { data } = await withTimeout(
      supabase.auth.getSession(),
      timeoutMs,
      "getSession"
    );
    return data?.session ?? null;
  } catch {
    return null;
  }
}
