const NAMESPACE = "hmar_thar_sar";
const SCHEMA_VERSION = 2;
const VERSION_KEY = `${NAMESPACE}:schema_version`;

const memoryStore = new Map<string, string>();

function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function rawGet(key: string): string | null {
  if (!isBrowser()) return memoryStore.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function rawSet(key: string, value: string): void {
  if (!isBrowser()) {
    memoryStore.set(key, value);
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

function rawRemove(key: string): void {
  if (!isBrowser()) {
    memoryStore.delete(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}

export function getStorageVersion(): number {
  const v = rawGet(VERSION_KEY);
  return v ? parseInt(v, 10) : 0;
}

export function setStorageVersion(v: number): void {
  rawSet(VERSION_KEY, String(v));
}

export function runMigrations(): void {
  const current = getStorageVersion();

  if (current < 1) {
    setStorageVersion(1);
  }

  if (current < 2) {
    // v2: added reviews storage key, clear stale slots to regenerate with new restaurant data
    rawRemove(namespacedKey("slots"));
    const reviewsKey = namespacedKey("reviews");
    if (rawGet(reviewsKey) === null) {
      rawSet(reviewsKey, "[]");
    }
    setStorageVersion(2);
  }
}

export { SCHEMA_VERSION };

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = rawGet(namespacedKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    rawSet(namespacedKey(key), JSON.stringify(value));
  } catch {
    // silent fail
  }
}

export function storageRemove(key: string): void {
  rawRemove(namespacedKey(key));
}

export function storageClear(): void {
  if (isBrowser()) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(NAMESPACE + ":")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // fall through to memory cleanup
    }
  }
  for (const key of Array.from(memoryStore.keys())) {
    if (key.startsWith(NAMESPACE + ":")) {
      memoryStore.delete(key);
    }
  }
}
