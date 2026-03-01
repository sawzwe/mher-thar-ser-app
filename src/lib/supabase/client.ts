import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Custom Navigator lock implementation.
 *
 * The default Supabase lock waits up to 10 s and throws if another tab holds
 * the lock — causing "timed out waiting 10000ms" errors in multi-tab setups.
 *
 * Using `ifAvailable: true` means: if the lock is free, take it; if not,
 * `lock` is null but we still run `fn()`. Two tabs may occasionally refresh
 * the token concurrently, but Supabase stores the latest token atomically in
 * localStorage so the outcome is always correct.
 */
async function customLock<T>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return fn();
  }
  return navigator.locks.request(name, { ifAvailable: true }, async () => fn());
}

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { lock: customLock } },
    );
  }

  return browserClient;
}
