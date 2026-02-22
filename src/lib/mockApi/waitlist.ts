import { WaitlistEntry } from "@/types";
import { storageGet, storageSet } from "../storage";

const WAITLIST_KEY = "waitlist";

function delay(ms: number = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(): string {
  return `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getWaitlist(): WaitlistEntry[] {
  return storageGet<WaitlistEntry[]>(WAITLIST_KEY, []);
}

function saveWaitlist(entries: WaitlistEntry[]): void {
  storageSet(WAITLIST_KEY, entries);
}

export async function joinWaitlist(
  params: Omit<WaitlistEntry, "id" | "createdAt" | "notified">
): Promise<WaitlistEntry> {
  await delay();
  const entry: WaitlistEntry = {
    ...params,
    id: generateId(),
    createdAt: new Date().toISOString(),
    notified: false,
  };
  const list = getWaitlist();
  list.push(entry);
  saveWaitlist(list);
  return entry;
}

export async function fetchWaitlist(): Promise<WaitlistEntry[]> {
  await delay();
  return getWaitlist();
}

export async function getEarliestWaitlistEntry(
  restaurantId: string,
  date: string,
  time: string
): Promise<WaitlistEntry | null> {
  await delay();
  const entries = getWaitlist().filter(
    (e) =>
      e.restaurantId === restaurantId &&
      e.date === date &&
      e.time === time &&
      !e.notified
  );
  if (entries.length === 0) return null;
  entries.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return entries[0];
}

export async function markWaitlistNotified(id: string): Promise<void> {
  await delay();
  const list = getWaitlist();
  const idx = list.findIndex((e) => e.id === id);
  if (idx !== -1) {
    list[idx].notified = true;
    saveWaitlist(list);
  }
}

export async function removeWaitlistEntry(id: string): Promise<void> {
  await delay();
  const list = getWaitlist();
  saveWaitlist(list.filter((e) => e.id !== id));
}
