# Mobile Architecture & Design — 2026-05-17

> **Decisions baked in**
> - Native stack: **React Native + Expo** only. PWA + Capacitor dropped.
> - Scale calibration: **MVP < 1k DAU with occasional spikes**, patterns chosen to survive 10x growth without rewrites.
> - Design refs: full sweep — OSS apps, Figma community, Dribbble/Behance, and production app breakdowns. Visuals re-created in Claude design; this doc is for inspiration + licensing clarity.
> - Scale priorities: **booking race conditions → auth/session abuse → discovery feed/map queries.** AI chat protection covered briefly.

## TL;DR
- **The mobile app should talk to Supabase via Postgres RPC functions (`.rpc()`), not through Next.js Route Handlers** — booking, discovery, and waitlist promotion all live in SQL with RLS doing auth. Route Handlers stay only for things needing secrets (Gemini proxy, Stripe). This is the single biggest scale + latency win.
- **Slot booking pattern**: `SELECT ... FOR UPDATE` inside an `SECURITY INVOKER` RPC + 5-minute `held_until` pending hold + idempotency-key table + `useMutation` `disabled={isPending}` guard. Code snippets in §1.1.
- **Auth pattern**: `signInWithIdToken` for native Google/Apple (no browser), hybrid `expo-secure-store` (encryption key) + `AsyncStorage` (encrypted blob) for sessions, anonymous browse upgraded to verified at booking time, Upstash sliding-window limiter in front of `/api/*`. Code in §1.2.
- **Discovery pattern**: `geography(Point, 4326)` column + GIST index + KNN `<->` for nearest-N, `ST_MakeEnvelope` + `&&` for map bounds, keyset pagination, TanStack Query with `keepPreviousData` so the map doesn't flash empty during pans. Code in §1.3.
- **Top design refs to mine**: clone the screen-file structure from [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native) (verify license — MIT version at [ZikaZaki/airbnb-mobile-app](https://github.com/ZikaZaki/airbnb-mobile-app)), liquid-glass nav from [Kumailthe1/liquid-glass-navigation](https://github.com/Kumailthe1/liquid-glass-navigation), Apple-Maps-style detents from [rit3zh/expo-apple-maps-sheet](https://github.com/rit3zh/expo-apple-maps-sheet), stackable filter sheets from [rit3zh/expo-stack-bottom-sheet](https://github.com/rit3zh/expo-stack-bottom-sheet), Figma starter [Restaurant Finder & Booking App](https://www.figma.com/community/file/1469355433280648854/restaurant-finder-booking-app) + [Glassmorphic UI Kit for iOS 26](https://www.figma.com/community/file/1514159272233131504/glassmorphic-ui-kit-for-ios-26-new-interface-design-with-blur-frosted-elements). MVP plan in §3.

---

## 1. Architecture Patterns (RN + Expo ↔ Supabase + Next.js `/api/*`)

### 1.1 Booking race conditions

**The risk**: Two customers tap "Book 19:00" within milliseconds; capacity-1 slot gets double-booked because both transactions read `status='available'` before either writes.

**Recommended pattern stack** (in order of importance):
1. **Stored procedure (RPC) called over PostgREST** — single round-trip, atomic, runs as the caller so RLS still applies on the underlying tables. ([Supabase RPC + RLS](https://supabase.com/docs/guides/api/securing-your-api), [Marmelab on transactions in Edge Functions](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html))
2. **`SELECT ... FOR UPDATE` on the specific slot row inside the RPC** — narrowest possible lock, automatically released at COMMIT/ROLLBACK. Prefer over `SERIALIZABLE` because it doesn't force a retry loop on `40001` serialization failures. ([Stormatics: SELECT FOR UPDATE](https://stormatics.tech/blogs/ensuring-safe-data-modifications-in-postgresql-with-select-for-update), [Developer's Coffee: airline booking locks](https://www.developerscoffee.com/blog/understanding-database-locking-in-an-airline-seat-booking-system/))
3. **Transactional advisory lock keyed by `(restaurant_id, slot_id)` ONLY when you need to coordinate cross-row work** (e.g. waitlist promotion). Avoid as primary mechanism because **PgBouncer/Supavisor transaction mode doesn't support session-scoped advisory locks**. ([Supabase pooler limitations](https://supabase.com/docs/guides/database/connecting-to-postgres), [OneUptime: advisory locks](https://oneuptime.com/blog/post/2026-01-25-use-advisory-locks-postgresql/view))
4. **Pending-hold pattern**: `status='pending'` + `held_until = now() + interval '5 min'`, swept by `pg_cron`. Lets the client capture payment/confirm before the seat is final. ([Reservation pattern](https://medium.com/@mmdGhanbari/avoid-race-conditions-with-reservation-pattern-bc4846602417), [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron))
5. **Idempotency key** (UUID v4 from client, stored server-side in `idempotency_keys` with `ON CONFLICT DO NOTHING`) — survives retries from flaky mobile networks. ([Brandur on Stripe-style idempotency](https://brandur.org/idempotency-keys), [Zuplo idempotency guide](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide))
6. **Client-side `useMutation` with `isPending` button disable + 600ms throttle on submit** — catches the double-tap before it hits the network. ([TanStack double-click discussion #10041](https://github.com/TanStack/query/discussions/10041))

**Implementation**:

```sql
-- 001_book_slot.sql
-- Slot reservation: pessimistic row lock + pending-hold + idempotency.
-- Called via PostgREST: supabase.rpc('book_slot', { ... })

create table if not exists idempotency_keys (
  key            uuid primary key,
  user_id        uuid not null,
  request_hash   text not null,
  response       jsonb,
  created_at     timestamptz not null default now()
);

alter table bookings
  add column if not exists held_until timestamptz,
  add column if not exists idempotency_key uuid references idempotency_keys(key);

create or replace function book_slot(
  p_slot_id      uuid,
  p_party_size   int,
  p_idem_key     uuid
) returns jsonb
language plpgsql
security invoker          -- RLS still applies on bookings/slots
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_slot      slots%rowtype;
  v_booking   bookings%rowtype;
  v_cached    jsonb;
begin
  if v_user_id is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  -- 1. Idempotency short-circuit. ON CONFLICT means the *second* identical
  --    request returns the cached response without re-running the booking.
  insert into idempotency_keys(key, user_id, request_hash)
  values (p_idem_key, v_user_id,
          md5(p_slot_id::text || ':' || p_party_size::text))
  on conflict (key) do update
    set key = excluded.key
  returning response into v_cached;

  if v_cached is not null then
    return v_cached;        -- replayed request
  end if;

  -- 2. Lock the slot row. SELECT FOR UPDATE blocks concurrent bookers
  --    on this slot only; other slots stay fully concurrent.
  select * into v_slot
    from slots
   where id = p_slot_id
   for update;

  if not found then
    raise exception 'slot not found' using errcode = 'P0002';
  end if;

  -- 3. Capacity check. Count active + pending (not-yet-expired) bookings.
  if (select count(*) from bookings
        where slot_id = p_slot_id
          and status in ('confirmed','pending')
          and (held_until is null or held_until > now())
     ) + p_party_size > v_slot.capacity then
    raise exception 'slot full' using errcode = 'P0001';
  end if;

  -- 4. Create the pending booking (5-minute hold).
  insert into bookings(slot_id, customer_id, party_size, status,
                       held_until, idempotency_key)
  values (p_slot_id, v_user_id, p_party_size, 'pending',
          now() + interval '5 minutes', p_idem_key)
  returning * into v_booking;

  -- 5. Cache the response for replays.
  update idempotency_keys
     set response = to_jsonb(v_booking)
   where key = p_idem_key;

  return to_jsonb(v_booking);
end $$;

revoke all on function book_slot(uuid,int,uuid) from public;
grant execute on function book_slot(uuid,int,uuid) to authenticated;
```

```sql
-- 002_sweep_expired_holds.sql -- runs via Supabase Cron (pg_cron)
create or replace function expire_pending_bookings() returns void
language sql as $$
  update bookings
     set status = 'expired'
   where status = 'pending'
     and held_until < now();
$$;

select cron.schedule('expire-pending', '* * * * *',
  $$ select expire_pending_bookings(); $$);
-- https://supabase.com/docs/guides/database/extensions/pg_cron
```

```sql
-- 003_waitlist_promote_trigger.sql
-- When a confirmed booking is cancelled, atomically promote the next
-- waitlist entry. Trigger keeps "free seat -> next person" in one txn.
create or replace function promote_waitlist() returns trigger
language plpgsql as $$
declare v_next waitlist_entries%rowtype;
begin
  if (old.status = 'confirmed' and new.status = 'cancelled') then
    -- SKIP LOCKED so two concurrent cancellations don't promote the same row.
    select * into v_next
      from waitlist_entries
     where restaurant_id = (select restaurant_id from slots where id = new.slot_id)
       and requested_date = (select starts_at::date from slots where id = new.slot_id)
       and status = 'waiting'
     order by position asc
     for update skip locked
     limit 1;

    if found then
      update waitlist_entries
         set status = 'promoted', promoted_at = now()
       where id = v_next.id;
      -- Push notification: handled by an Edge Function listening on the channel.
      -- Don't make HTTP calls inline from a trigger.
      perform pg_notify('waitlist_promoted', v_next.id::text);
    end if;
  end if;
  return new;
end $$;

create trigger trg_promote_waitlist
  after update of status on bookings
  for each row execute function promote_waitlist();
-- SKIP LOCKED rationale: https://www.cybertec-postgresql.com/en/skip-locked-one-of-my-favorite-9-5-features/
```

```ts
// mobile/src/features/booking/useBookSlot.ts
// TanStack Query mutation: idempotency key + isPending guard + throttle.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useRef } from 'react';
import { supabase } from '../../lib/supabase';

type Args = { slotId: string; partySize: number };

export function useBookSlot() {
  const qc = useQueryClient();
  // One idempotency key per *intent* (per button render), not per click.
  // Generated once and reused for retries — this is the whole point.
  const idemKey = useRef<string>(Crypto.randomUUID());

  return useMutation({
    mutationKey: ['bookSlot'],   // global key -> useIsMutating() can dedupe
    mutationFn: async ({ slotId, partySize }: Args) => {
      const { data, error } = await supabase.rpc('book_slot', {
        p_slot_id: slotId,
        p_party_size: partySize,
        p_idem_key: idemKey.current,
      });
      if (error) throw error;
      return data;            // booking row
    },
    onMutate: async ({ slotId }) => {
      await qc.cancelQueries({ queryKey: ['slot', slotId] });
      const prev = qc.getQueryData(['slot', slotId]);
      qc.setQueryData(['slot', slotId], (s: any) => ({ ...s, optimistic: true }));
      return { prev };
    },
    onError: (_e, { slotId }, ctx) => {
      qc.setQueryData(['slot', slotId], ctx?.prev);
      // Rotate the idempotency key on hard failures so user can retry cleanly.
      idemKey.current = Crypto.randomUUID();
    },
    onSettled: (_d, _e, { slotId }) => {
      qc.invalidateQueries({ queryKey: ['slot', slotId] });
      qc.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}

// In the component:
// const { mutate, isPending } = useBookSlot();
// <Pressable disabled={isPending} onPress={() => mutate({ slotId, partySize: 2 })}>
// `disabled={isPending}` is the FIRST line of defense — TanStack guidance:
// https://github.com/TanStack/query/discussions/10041
```

**Tradeoffs**:
- `SELECT FOR UPDATE` serializes bookings **for the same slot only**. Two slots can be booked in parallel — exactly what you want. The downside: a long transaction (e.g. payment) blocks every other booker on that slot. Keep the lock short — move payment **outside** the transaction by relying on the 5-min `held_until` hold ([Stormatics: reduce contention](https://stormatics.tech/blogs/select-for-update-in-postgresql)).
- **Advisory locks lose in transaction-mode pooling.** Supavisor/PgBouncer in transaction mode (port 6543, the Supabase default for serverless) does NOT support session-scoped advisory locks. Use `pg_advisory_xact_lock` (transaction-scoped) only, and only after `BEGIN`. For most slot bookings, just lock the row.
- **`SERIALIZABLE` isolation** is correct but forces the app to handle `40001 serialization_failure` with retry-with-backoff. Painful in mobile/serverless where each retry burns a new connection ([Supabase discussion #30334](https://github.com/orgs/supabase/discussions/30334)).
- **Optimistic concurrency** (`UPDATE slots SET status='held' WHERE id=$1 AND status='available'`) is simpler but doesn't extend to "check capacity across N existing bookings". Fine if every slot has capacity=1; not fine for restaurants with capacity=8.
- **Triggers for waitlist** keep the operation atomic with the cancellation but make the transaction longer. Acceptable below 10k DAU; above that, push promotion to a queue consumed by an Edge Function (use `pg_notify` from the trigger and an Edge Function listening).
- **Idempotency key storage** competes with bookings for write throughput. Irrelevant at MVP; over ~100 writes/sec, move the idempotency table to a separate Postgres schema or to Upstash Redis.

**Inflection points** (when to revisit):
- **>50 bookings/min sustained**: profile `pg_stat_activity` for lock waits on the `slots` table; consider partitioning `bookings` by `slot_starts_at` month.
- **>500 bookings/min** or any cross-restaurant atomic operation: move slot reservation to an in-memory atomic store (Redis `INCR`/`DECR` on a slot counter), back-write to Postgres asynchronously ([Dylan Lee: async reservation](https://medium.com/@inexpressible2510/how-i-design-a-reservation-system-for-race-conditions-with-async-processing-simple-and-practical-7ffb50798fb2)).
- **>10k DAU, multi-region**: switch the booking RPC out of Next.js Route Handlers onto a region-pinned Edge Function near your Supabase DB region; RTT to DB beats cold-start savings.
- **Connection pool starves**: bump compute tier or move long-lived workloads to a dedicated session-mode connection.

**Sources**:
- [PostgreSQL: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Stormatics: SELECT FOR UPDATE](https://stormatics.tech/blogs/select-for-update-in-postgresql)
- [Cybertec: SKIP LOCKED](https://www.cybertec-postgresql.com/en/skip-locked-one-of-my-favorite-9-5-features/)
- [Developer's Coffee: airline seat booking locks](https://www.developerscoffee.com/blog/understanding-database-locking-in-an-airline-seat-booking-system/)
- [Mohammad Ghanbari: Reservation pattern](https://medium.com/@mmdGhanbari/avoid-race-conditions-with-reservation-pattern-bc4846602417)
- [Supabase discussion #30334: SERIALIZABLE in Supabase](https://github.com/orgs/supabase/discussions/30334)
- [Brandur: Stripe-style idempotency keys](https://brandur.org/idempotency-keys)
- [Marmelab: Transactions and RLS in Supabase Edge Functions](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html)
- [Supabase: Securing your API (RLS + RPC)](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase: pg_cron extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase: connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [TanStack discussion #10041: prevent double clicks](https://github.com/TanStack/query/discussions/10041)
- [Zuplo: Idempotency keys in REST APIs](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide)

---

### 1.2 Auth + session abuse

**The risk**: Stolen refresh tokens grant indefinite access; signup/OTP endpoints get hammered to enumerate users or burn SMS credits; tokens leak from insecure mobile storage.

**Recommended pattern stack** (in order of importance):
1. **`signInWithIdToken` (native ID-token flow) for Google/Apple, never the web browser flow** — keeps the user in-app, gets the real Apple/Google nonce, avoids deep-link races. ([Supabase native mobile auth](https://supabase.com/blog/native-mobile-auth), [Supabase Apple guide](https://supabase.com/docs/guides/auth/social-login/auth-apple?platform=react-native))
2. **Hybrid storage** — `expo-secure-store` for an encryption key, encrypted session blob in AsyncStorage/MMKV. Supabase sessions exceed SecureStore's 2KB limit. ([Expo SecureStore docs](https://docs.expo.dev/versions/latest/sdk/securestore/), [Ignite Cookbook auth recipe](https://ignitecookbook.com/docs/recipes/Authentication/))
3. **Lean on Supabase's automatic refresh-token rotation** — every `refreshSession` returns a fresh refresh token; reuse of a revoked one revokes all descendants. Don't manually call `refreshSession`; just react to `onAuthStateChange`. ([Supabase sessions docs](https://supabase.com/docs/guides/auth/sessions))
4. **CAPTCHA (hCaptcha/Turnstile) on signup + anonymous + OTP endpoints** — Supabase's 30/hr/IP cap on anonymous is not enough on its own. ([Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [security guidance](https://supabase.com/docs/guides/troubleshooting/security-of-anonymous-sign-ins-iOrGCL))
5. **Upstash sliding-window rate limiter in front of `/api/*`** keyed by `(user_id || ip)` — Supabase covers GoTrue endpoints, not your own Route Handlers. ([Upstash Next.js rate limiting](https://upstash.com/blog/nextjs-ratelimiting), [Supabase rate limits docs](https://supabase.com/docs/guides/auth/rate-limits))
6. **Server-side device telemetry** from RN (`Device.osBuildId`, `Application.applicationId`, `Constants.installationId`) into a `user_devices` table; flag a new fingerprint mid-session. No third-party fingerprinting lib at MVP. ([Castle device fingerprinting model](https://docs.castle.io/docs/device-fingerprinting))
7. **Anonymous sessions for browse-only flows**, upgraded via `linkIdentity` at booking time. `is_anonymous` JWT claim drives RLS branching. ([Supabase anonymous sign-ins blog](https://supabase.com/blog/anonymous-sign-ins))

**Implementation**:

```ts
// mobile/src/lib/supabase.ts -- hybrid secure storage adapter
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createClient, SupportedStorage } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// SecureStore has a hard 2KB limit per value; Supabase sessions are larger.
// Pattern: keep a symmetric key in SecureStore, encrypted payload in AsyncStorage.
// https://docs.expo.dev/versions/latest/sdk/securestore/
// https://ignitecookbook.com/docs/recipes/Authentication/
const KEK_NAME = 'mts.sb.kek';

async function getOrCreateKek(): Promise<string> {
  let kek = await SecureStore.getItemAsync(KEK_NAME);
  if (!kek) {
    kek = (await Crypto.getRandomBytesAsync(32))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
    await SecureStore.setItemAsync(KEK_NAME, kek, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }
  return kek;
}

const encryptedStorage: SupportedStorage = {
  getItem: async (k) => {
    const blob = await AsyncStorage.getItem(k);
    if (!blob) return null;
    const kek = await getOrCreateKek();
    return decryptAesGcm(blob, kek);    // implement with @noble/ciphers
  },
  setItem: async (k, v) => {
    const kek = await getOrCreateKek();
    await AsyncStorage.setItem(k, await encryptAesGcm(v, kek));
  },
  removeItem: (k) => AsyncStorage.removeItem(k),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: encryptedStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,   // mobile, not browser
    },
  }
);

// Critical: without this, returning users hit an expired access token.
AppState.addEventListener('change', (s) => {
  if (s === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
// https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
```

```ts
// mobile/src/features/auth/signInWithApple.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';

// Native ID-token flow. No browser, no deep link, no nonce mismatch.
// https://supabase.com/docs/guides/auth/social-login/auth-apple?platform=react-native
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
  });
  if (!credential.identityToken) throw new Error('no identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    // Apple Sign In on iOS hashes a nonce server-side already.
    // For Google iOS, you DO need to pass the nonce you supplied to Google.
  });
  if (error) throw error;
  await recordDevice(data.session!.user.id);
  return data;
}
```

```ts
// mobile/src/features/auth/signInWithGoogle.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../../lib/supabase';

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const { idToken } = (await GoogleSignin.signIn()) as any;
  if (!idToken) throw new Error('no id token from google');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  await recordDevice(data.session!.user.id);
  return data;
}
```

```sql
-- 010_user_devices.sql -- suspicious-login detection
create table user_devices (
  user_id      uuid not null references auth.users(id) on delete cascade,
  install_id   text not null,
  os           text,
  model        text,
  app_version  text,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  flagged      boolean not null default false,
  primary key (user_id, install_id)
);

create or replace function flag_new_device() returns trigger
language plpgsql as $$
declare v_count int;
begin
  -- A user's *third* distinct install_id within 24h is suspicious.
  select count(*) into v_count
    from user_devices
   where user_id = new.user_id
     and first_seen > now() - interval '24 hours';
  if v_count > 2 then
    new.flagged := true;
    perform pg_notify('suspicious_login', new.user_id::text);
  end if;
  return new;
end $$;

create trigger trg_flag_new_device
  before insert on user_devices
  for each row execute function flag_new_device();
```

```ts
// app/api/_lib/rateLimit.ts -- Upstash sliding window in front of Next routes
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const authLimiter = new Ratelimit({
  redis,
  // 10 sensitive actions per 10 minutes, sliding window.
  // Supabase's own GoTrue limits cover /auth/v1/* but not your /api/*.
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  analytics: true,
  prefix: 'mts:auth',
});

export async function rateLimit(req: Request, key: string) {
  const id = key
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]
    ?? 'anon';
  const r = await authLimiter.limit(id);
  if (!r.success) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((r.reset - Date.now()) / 1000)) },
    });
  }
  return null;
}
```

```sql
-- 011_rls_anon_browsing.sql -- guest browses, members book.
-- auth.jwt() -> 'is_anonymous' separates anon users from full accounts.
alter table restaurants enable row level security;

create policy "anyone reads restaurants"
  on restaurants for select
  using (true);

create policy "only verified users can book"
  on bookings for insert
  with check (
    auth.uid() = customer_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::bool, false) = false
  );
```

**Tradeoffs**:
- **`signInWithIdToken` requires a development build** — Expo Go can't bundle the native Google/Apple SDKs. Accept this cost early; the OAuth UX win is large.
- **Refresh-token rotation has a small reuse window** (~10s, intentional to absorb network hiccups). If N parallel API calls hit right after foregrounding, two can race. The JS SDK already single-flights — don't override it.
- **Hybrid SecureStore + AsyncStorage** is more complex than plain AsyncStorage. The complexity is worth it: rooted/jailbroken devices can read plaintext AsyncStorage but not Keychain/Keystore-backed SecureStore.
- **Anonymous users count against MAU** — Supabase bills them like real users. If a press hit floods you with anon signups, the bill jumps. Only call `signInAnonymously()` when the user *attempts* a personalized action, not on cold start.
- **Server-side fingerprint from RN is weaker than browser FingerprintJS** — `install_id` rotates on reinstall. Good enough for "is this a new device?" but not "same physical phone across uninstalls". Castle/FingerprintJS Pro are the upgrade path.
- **Upstash adds external dependency**. At <1k DAU, a Postgres-based limiter (`rate_limit_buckets` table) works. Above ~50 req/s sustained, Postgres-based limiters cause lock contention.

**Inflection points** (when to revisit):
- **Any SMS-OTP cost spike**: tighten `rate_limit_sms_sent` in dashboard immediately; add Turnstile to the SMS endpoint.
- **>1 account takeover/month**: add step-up auth — re-verify by email before bookings/profile changes from a flagged device.
- **>10k DAU**: move device telemetry to a write-optimized store (ClickHouse / TimescaleDB).
- **Auth fraud (mass signups)**: enforce Turnstile on anonymous and email signup. Supabase's IP-based 30/hr on anon falls apart behind shared mobile carriers/NATs.

**Sources**:
- [Supabase: User sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase: Rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase blog: Native mobile auth for Google & Apple](https://supabase.com/blog/native-mobile-auth)
- [Supabase: Sign in with Apple (RN)](https://supabase.com/docs/guides/auth/social-login/auth-apple?platform=react-native)
- [Supabase: Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase blog: Anonymous Sign-Ins](https://supabase.com/blog/anonymous-sign-ins)
- [Supabase: Anonymous Sign-Ins docs](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase troubleshooting: Security of anonymous sign-ins](https://supabase.com/docs/guides/troubleshooting/security-of-anonymous-sign-ins-iOrGCL)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase auth GitHub README](https://github.com/supabase/auth)
- [Expo: SecureStore docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Ignite Cookbook: Authentication with Supabase](https://ignitecookbook.com/docs/recipes/Authentication/)
- [Naqeeb Shamsi: iOS Auth with RN + Supabase (nonce traps)](https://naqeebali-shamsi.medium.com/mastering-ios-auth-with-react-native-and-supabase-a6ffaf653f04)
- [Upstash blog: Rate limiting Next.js API routes](https://upstash.com/blog/nextjs-ratelimiting)
- [Castle: device fingerprinting model](https://docs.castle.io/docs/device-fingerprinting)

---

### 1.3 Discovery feed / map queries

**The risk**: A 10MB GeoJSON response when the user pans the map, runaway full-table scans, n+1 hero image fetches eating egress.

**Recommended pattern stack** (in order of importance):
1. **`geography(Point, 4326)` column + GIST index + KNN `<->` operator** for "nearest N to me". KNN is index-assisted; `ST_DWithin` alone often plans as a seq-scan when the radius is loose. Use `<->` for ordered results, `ST_DWithin` for boolean filter, `&&` with `ST_MakeEnvelope` for map-bounds. ([PostGIS KNN syntax](https://postgis.net/docs/geometry_distance_knn.html), [Crunchy Data on KNN](https://www.crunchydata.com/blog/a-deep-dive-into-postgis-nearest-neighbor-search))
2. **Map-bounds queries via `ST_MakeEnvelope` + `&&`** on every map idle event (debounced ~300ms client-side). Returns only what fits the viewport. ([Felt blog: PostGIS bounding boxes](https://felt.com/blog/postgis-bounding-boxes-for-maps))
3. **Keyset pagination, not offset**, for the list view — order by `(distance_m, id)` and pass the last `(distance, id)` tuple as cursor. Offset gets slower with depth; keyset is constant-time. ([Stacksync keyset pagination](https://www.stacksync.com/blog/keyset-cursors-postgres-pagination-fast-accurate-scalable))
4. **TanStack Query cache shape**: separate keys for `['restaurants', 'near', lat, lng, radius]` (staleTime 60s) and `['restaurant', id]` (staleTime 5min). Map-bounds queries use `placeholderData: keepPreviousData` so pan doesn't flash empty. ([TanStack important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults))
5. **Put the discovery query in Supabase via RPC + PostgREST, NOT a Next.js Route Handler** — PostgREST runs in the same network namespace as Postgres; Edge Functions and Routes both add a hop. Reserve Edge Functions/Routes for things needing secrets or cross-service aggregation. ([Supabase Edge Functions architecture](https://supabase.com/docs/guides/functions/architecture))
6. **Image transform via Supabase Storage CDN at MVP; front with Cloudflare/BunnyCDN above ~100k transformations/month**. ([Supabase image transformations](https://supabase.com/docs/guides/storage/serving/image-transformations), [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn))

**Implementation**:

```sql
-- 020_restaurants_geo.sql -- one column, one index, two query shapes.
alter table restaurants
  add column if not exists geom geography(Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored;

create index if not exists idx_restaurants_geom on restaurants using gist (geom);

-- "Nearest 20 to me, max 5km" -- KNN order + DWithin filter.
-- Uses the GIST index for BOTH ordering and filtering.
-- https://postgis.net/docs/geometry_distance_knn.html
create or replace function nearby_restaurants(
  p_lat  double precision,
  p_lng  double precision,
  p_radius_m int default 5000,
  p_limit    int default 20,
  p_cursor_distance_m double precision default null,
  p_cursor_id  uuid default null
) returns table (
  id uuid, name text, cuisine text,
  lat double precision, lng double precision,
  distance_m double precision
)
language sql stable as $$
  with me as (select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g)
  select r.id, r.name, r.cuisine,
         st_y(r.geom::geometry) as lat,
         st_x(r.geom::geometry) as lng,
         st_distance(r.geom, me.g) as distance_m
    from restaurants r, me
   where st_dwithin(r.geom, me.g, p_radius_m)
     and (
       p_cursor_distance_m is null
       or (st_distance(r.geom, me.g), r.id) > (p_cursor_distance_m, p_cursor_id)
     )
   order by r.geom <-> me.g, r.id
   limit p_limit;
$$;

grant execute on function nearby_restaurants(double precision, double precision, int, int, double precision, uuid) to anon, authenticated;
```

```sql
-- 021_restaurants_in_bounds.sql -- map viewport query
-- ST_MakeEnvelope + && (bbox overlap) is THE fast filter for map pans.
create or replace function restaurants_in_bounds(
  p_west  double precision, p_south double precision,
  p_east  double precision, p_north double precision,
  p_limit int default 200
) returns table (id uuid, name text, lat double precision, lng double precision)
language sql stable as $$
  select id, name,
         st_y(geom::geometry), st_x(geom::geometry)
    from restaurants
   where geom && st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::geography
   limit p_limit;
$$;
```

```ts
// mobile/src/features/discovery/useNearby.ts
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

type Page = {
  items: Array<{ id: string; name: string; distance_m: number }>;
  nextCursor: { d: number; id: string } | null;
};

export function useNearby(lat: number, lng: number, radius = 5000) {
  return useInfiniteQuery<Page>({
    queryKey: ['restaurants', 'near', lat.toFixed(3), lng.toFixed(3), radius],
    // quantize lat/lng to 3 decimals (~110m) so jitter doesn't refetch.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    initialPageParam: null as Page['nextCursor'],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('nearby_restaurants', {
        p_lat: lat,
        p_lng: lng,
        p_radius_m: radius,
        p_limit: 20,
        p_cursor_distance_m: pageParam?.d ?? null,
        p_cursor_id: pageParam?.id ?? null,
      });
      if (error) throw error;
      const items = data ?? [];
      const last = items[items.length - 1];
      return {
        items,
        nextCursor: items.length === 20 ? { d: last.distance_m, id: last.id } : null,
      };
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}
```

```ts
// mobile/src/features/discovery/useMapBounds.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Bounds = { west: number; south: number; east: number; north: number };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  const t = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), ms);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [value, ms]);
  return v;
}

export function useRestaurantsInView(bounds: Bounds | null) {
  const debounced = useDebounced(bounds, 300);
  return useQuery({
    queryKey: ['restaurants', 'bounds',
      debounced && [debounced.west.toFixed(3), debounced.south.toFixed(3),
                    debounced.east.toFixed(3), debounced.north.toFixed(3)]],
    enabled: !!debounced,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('restaurants_in_bounds', {
        p_west: debounced!.west, p_south: debounced!.south,
        p_east: debounced!.east, p_north: debounced!.north,
        p_limit: 200,
      });
      if (error) throw error;
      return data;
    },
  });
}
```

```ts
// mobile/src/components/RestaurantHero.tsx -- image transform via Storage CDN
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';

export function RestaurantHero({ path }: { path: string }) {
  // 100 transforms/project/month free, then $5/1000.
  // https://supabase.com/docs/guides/storage/serving/image-transformations
  const { data } = supabase.storage
    .from('restaurant-images')
    .getPublicUrl(path, {
      transform: { width: 800, height: 480, resize: 'cover', quality: 70 },
    });
  return (
    <Image
      source={{ uri: data.publicUrl }}
      style={{ width: '100%', aspectRatio: 5/3 }}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
    />
  );
}
```

**Tradeoffs**:
- **`<->` with `geography`** computes true spheroid distance — correct for global apps. `geometry` is faster but only planar — fine for Bangkok-only.
- **PostgREST RPC vs Edge Function**: RPC is fastest. Edge Function shines when you need to aggregate (reviews + deals + hours + open/closed) without exposing the joining logic in SQL. Cold-start: Edge Function p50 ~125ms hot, ~400ms cold ([Supabase persistent storage for cold starts](https://supabase.com/blog/persistent-storage-for-faster-edge-functions)).
- **Keyset pagination breaks if the sort key changes mid-scroll** (user moves, distances re-rank). Pin user lat/lng for the scroll duration, refresh on pull-to-refresh.
- **Map-bounds + list pagination compose awkwardly**. Pragmatic: map = bounds query (200 pins, no pagination); list = distance-sorted keyset feed. Different queries, shared cache key prefix.
- **Materialized views buy nothing at <1k DAU**. Worth it when >10k restaurants AND home feed does >5 joins. Refresh via `pg_cron` every 5 min.
- **Supabase Storage CDN is Cloudflare-fronted already.** Adding a second CDN is about per-transformation cost (crosses BunnyCDN around 200k transforms/mo), not perf.
- **Transaction-mode pooling (6543) drops named prepared statements** — PostgREST and the JS client are fine, but if you add Prisma later, use port 5432 or `pgbouncer=true`.

**Inflection points** (when to revisit):
- **>10k restaurants**: switch hero image hosting to Cloudflare Images/BunnyCDN; keep Storage as origin.
- **>1k DAU map-heavy**: materialized view of "popular restaurants per H3 hex" refreshed every 5 min.
- **Map-bounds query >100ms p95**: swap `geom` to `geometry(Point, 4326)` for Bangkok-only (planar distance is fine at that scale).
- **PostgREST p95 creeps up**: bump compute tier (Micro → Small) before adding read replicas.
- **Egress >250GB/mo on Pro**: front Storage with Cloudflare for edge caching.

**Sources**:
- [PostGIS docs: KNN distance operator <->](https://postgis.net/docs/geometry_distance_knn.html)
- [PostGIS workshop: Nearest-Neighbour Searching](https://postgis.net/workshops/postgis-intro/knn.html)
- [Crunchy Data: Deep dive into PostGIS nearest neighbor](https://www.crunchydata.com/blog/a-deep-dive-into-postgis-nearest-neighbor-search)
- [Paul Ramsey: PostGIS Nearest Neighbor Syntax](http://blog.cleverelephant.ca/2021/12/knn-syntax.html)
- [Felt blog: PostGIS bounding boxes for maps](https://felt.com/blog/postgis-bounding-boxes-for-maps)
- [Stacksync: keyset cursor vs offset](https://www.stacksync.com/blog/keyset-cursors-postgres-pagination-fast-accurate-scalable)
- [TanStack Query important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Supabase Edge Functions architecture](https://supabase.com/docs/guides/functions/architecture)
- [Supabase blog: Persistent storage and 97% faster cold starts](https://supabase.com/blog/persistent-storage-for-faster-edge-functions)
- [Supabase: Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Supabase: Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- [Supabase: connection pooling modes](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

### 1.4 Bonus: AI chat (`/api/chat`) cost protection (lightweight)

- **Per-user rate limit at the edge** keyed by `auth.uid()` (Upstash `slidingWindow(30, '1 h')`). Request-count is enough at MVP; move to token-budget once you see >$5/user/month, since one 100k-token prompt blows past any per-request limit. ([truefoundry: LLM rate limiting](https://www.truefoundry.com/blog/rate-limiting-ai-agents-preventing-llm-api-exhaustion))
- **Prompt length cap server-side** — reject `prompt.length > 4000` chars (or tokenizer-based check) with HTTP 413. Stops abuse AND "paste a whole PDF" mistakes before they leave your server. ([apxml: LLM rate limiting](https://apxml.com/courses/intro-llm-red-teaming/chapter-5-defenses-mitigation-strategies-llms/rate-limiting-access-controls-llm-apis))
- **Response cache by `hash(model + system_prompt + user_prompt)` in Upstash Redis, TTL 24h** — chatbot workloads see 30–60% hit rates, direct cost reduction. ([projectdiscovery: 59% cost cut via prompt caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching), [AWS: caching for LLM cost & latency](https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/))
- **Anomaly alert on per-user daily spend** — log token usage to `chat_usage(user_id, date, tokens, cost_cents)`; nightly `pg_cron` fires Slack/email when any user crosses `avg_daily_spend * 5` or `$2/day`. Catches bot-driven runaways before billing day. ([systemshardening: abuse detection](https://www.systemshardening.com/articles/kubernetes/llm-rate-limiting/))

---

## 2. Design References

### 2.A Open-source RN/Expo apps for visual reference

- **Galaxies-dev / airbnb-clone-react-native** — https://github.com/Galaxies-dev/airbnb-clone-react-native
  - License: verify (no LICENSE file — treat as visual reference; ask Simon Grimm before forking code)
  - Screen/component to study: `app/listing/[id].tsx` (parallax hero + sticky CTA), `components/ListingsMap.tsx` (MapView + clustering), `components/ListingsBottomSheet.tsx` (snap-points sheet wrapping the list), `components/ExploreHeader.tsx` (category chip strip + filter button), `app/(modals)/booking.tsx` style modal entry from `app/_layout.tsx`
  - What it teaches: Airbnb-style map+list with a bottom sheet that swaps the underlying list, plus near-pixel-perfect parallax detail with sticky "Reserve" CTA — the closest match to what we need.
  - Match for our needs: Discovery (map + sheet), Detail (hero parallax + sticky CTA), Nav, Filters.
  - Quality note: Most polished of the clones; Reanimated 3, Clerk auth, modal route group, screenshots in `/screenshots`.

- **ZikaZaki / airbnb-mobile-app** — https://github.com/ZikaZaki/airbnb-mobile-app
  - License: **MIT** (verified — `/blob/main/LICENSE`)
  - Screen/component to study: `components/ExploreHeader.tsx`, `components/ListingsMap.tsx`, `components/ListingsBottomSheet.tsx`, `app/listing/[id].tsx`, `app/(modals)/booking.tsx`, `app/(modals)/login.tsx`
  - What it teaches: Same architecture as Galaxies-dev but with MIT LICENSE — patterns you want to literally copy live here legally; also has an animated booking modal for our slot picker date step.
  - Match for our needs: Discovery, Detail, Booking, Auth, Filters.

- **adrianhajdin / react_native-restate** — https://github.com/adrianhajdin/react_native-restate
  - License: verify (JSM Mastery tutorial code; no LICENSE file)
  - Screen/component to study: `app/(root)/(tabs)/index.tsx`, `app/(root)/(tabs)/explore.tsx`, `app/(root)/properties/[id].tsx`, `components/Filters.tsx`, `components/Cards.tsx`, `components/Comment.tsx`, `components/Search.tsx`, `app/sign-in.tsx`
  - What it teaches: Card grid with overlay rating badge in gold, chip filter row, comment/review composer, section-headered detail with gallery + amenities + reviews.
  - Match for our needs: Discovery (cards), Detail, Reviews, Filters, Auth.
  - Quality note: Tailwind via NativeWind, Expo SDK 52, very clean decomposition — easiest codebase here to read.

- **PW-IOI-Tech / dine-time** — https://github.com/PW-IOI-Tech/dine-time
  - License: verify ("Add your Liscence here" placeholder — visual reference only)
  - Screen/component to study: `app/restaurant/[restaurant].tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/history.tsx`, `app/(auth)/*`, `components/parallax-scroll-view.tsx`, `components/haptic-tab.tsx`, `components/ui/collapsible.tsx`
  - What it teaches: Actual restaurant-booking domain model (not Airbnb proxy) — reservation history list, restaurant detail with parallax, haptic-feedback tab bar.
  - Match for our needs: Detail, Booking history, Nav, Auth.

- **rit3zh / expo-apple-maps-sheet** — https://github.com/rit3zh/expo-apple-maps-sheet
  - License: verify (no LICENSE file)
  - Screen/component to study: `app/maps.tsx`, `app/(tabs)/_layout.tsx`, `components/tab-bar/*`, `components/index.tsx`
  - What it teaches: Apple-Maps three-detent bottom sheet with the search bar living inside the sheet handle, and a tab bar that visually merges with the sheet — exact interaction we want for the map view.
  - Match for our needs: Discovery (map + sheet), Nav.
  - Quality note: Uses Expo SDK SwiftUI BottomSheet primitive, so iOS fidelity is very high; fall back to gorhom for cross-platform.

- **Kumailthe1 / liquid-glass-navigation** — https://github.com/Kumailthe1/liquid-glass-navigation
  - License: verify (no LICENSE file)
  - Screen/component to study: `app/(tabs)/_layout.tsx` (BlurView-backed tab bar wired into Expo Router), `app/modal.tsx`, `components/haptic-tab.tsx`, `components/parallax-scroll-view.tsx`
  - What it teaches: Floating-pill tab bar with expo-blur tint, detached FAB, smooth scroll-based opacity — drop-in for our glassmorphic bottom nav.
  - Match for our needs: Nav (glassmorphic tab bar).

- **rit3zh / expo-stack-bottom-sheet** — https://github.com/rit3zh/expo-stack-bottom-sheet
  - License: verify (no LICENSE file)
  - Screen/component to study: `components/*` (stackable sheet primitive), `app/index.tsx` (nested filter sheets demo), `context/*` (sheet stack state)
  - What it teaches: Stack a "Cuisine" sheet on top of a parent "Filters" sheet with iOS-style scale-back animation — perfect for filter drilldown (cuisine → price → distance) without losing context.
  - Match for our needs: Filters (multi-step bottom sheet).

- **EvanBacon / expo-ai** — https://github.com/EvanBacon/expo-ai
  - License: verify (Evan Bacon demo, no LICENSE file)
  - Screen/component to study: top-level Expo Router app; uses Universal React Server Components to stream native UI from an AI endpoint.
  - What it teaches: AI chat composer + streaming bubbles + tool-calling render-as-native pattern — direct fit for the AI chat tab.

### 2.B Production app design breakdowns

- **Design Critique: Resy (Mobile app) — IXD@Pratt** — https://www.ixd.prattsi.org/2026/02/design-critique-resy-mobile-app/
  - About: Resy iOS — bottom nav labels (Discover/Search/Account), filter active-state feedback, same-day reservation block error. Date: 2026-02.
  - Key insight to steal: Filter chips give immediate visual active-state + instant list refresh on the same screen — no "Apply" round-trip; bottom nav uses icon + text so first-time users don't have to learn it.

- **Design Critique: Resy (iOS App) — IXD@Pratt (2024)** — https://www.ixd.prattsi.org/2024/01/design-critique-resy-ios-app/
  - About: Earlier baseline critique of Resy's discovery, list, and detail. Date: 2024-01.
  - Key insight to steal: Hero-image-led cards (image fills most of card, overlay text bottom-left, price-tier dots top-right) — proven scannable at thumb distance.

- **Usability Redesign of the Resy App — Chantal Binda** — https://medium.com/@chantalbinda2015/usability-redesign-of-the-resy-app-1fda5331f464
  - About: Before/after of Resy mobile — cluttered visual hierarchy, inconsistent button styles, small fonts. Date: 2025-08.
  - Key insight to steal: Collapse type scale to 3 sizes max, snap CTAs to a consistent fill style. Use her "after" frames as a near-direct reference for layering brand color over an existing booking flow.

- **Redesigning OpenTable — Charlotte Passot (UX Collective)** — https://uxdesign.cc/opentable-a-ux-case-study-bf073f2e97bf
  - About: OpenTable iOS reservation flow validated against user data; four pain points addressed.
  - Key insight to steal: Surface "available NOW" as a first-class entry alongside "future reservation" — users overwhelmingly search now-intent. For us: top-level "Open now" chip on the discovery header.

- **Behind the Booking: OpenTable Usability Testing — Seetha Mahalakshmi Cheruvu** — https://medium.com/@seetha_does_ux/behind-the-booking-opentable-usability-testing-with-first-time-users-cdd30587ad42
  - About: Moderated tests of OpenTable's date/time/party-size selector and confirmation. Date: 2024.
  - Key insight to steal: Specific friction points users hit in OpenTable's slot picker (party-size stepper hidden, time chips too small) — directly informs our slot grid (44pt tap, label below time).

- **UI/UX Case Study: Zomato App Redesign — Shruti Parashar** — https://medium.com/@shparashar523/ui-ux-case-study-zomato-app-redesign-simplifying-the-food-ordering-experience-15b7c850eb46
  - About: Zomato restaurant detail screen breakdown — hero image, sectioned content, info icon → operational details/certifications. Date: 2024.
  - Key insight to steal: Bottom nav on detail screen replaces global nav (Overview / Menu / Reviews / Photos) — top has room to breathe; works for Burmese long titles needing horizontal headroom.

- **Exploring UI of map view in Yelp-like apps — Pavithra Aravindan** — https://medium.com/adventures-in-consumer-technology/exploring-ui-of-map-view-in-yelp-like-apps-6641b3bf292a
  - About: Side-by-side teardown of Yelp / Google Maps / Foursquare map pin density, card preview pattern, list-toggle UX.
  - Key insight to steal: When pins overlap (Bangkok density), switch from price-tag pins to numbered cluster bubbles ≥3 pins/cluster, reveal a card carousel along the bottom — the pattern Yelp moved to in 2022.

- **Introducing Swarm 6.0 — Foursquare on Medium** — https://medium.com/foursquare-direct/introducing-swarm-6-0-a-social-way-to-discover-new-places-82c42743f759
  - About: Foursquare's own writeup — rebuilt map, Saved Places, ratings + tips from check-in, redesigned place pages.
  - Key insight to steal: Time-aware "quick search pills" on the discovery map (breakfast in the morning, dinner at 6pm) — auto-rotate the filter chip header based on current hour.

### 2.C Figma community files (free to duplicate)

- **Restaurant Finder & Booking App** — https://www.figma.com/community/file/1469355433280648854/restaurant-finder-booking-app
  - License: Figma Community default (CC BY 4.0) — duplicatable.
  - Covers: Discovery / Search / Detail / Booking / Reservation flow.
  - Aesthetic match: Medium — wireframe-leaning but flows align with our discovery + slot booking spine.

- **Restaurant App (modern dark mode booking + ordering)** — https://www.figma.com/community/file/1469477811359379177/restaurant-app
  - License: Figma Community default (CC BY 4.0).
  - Covers: Discovery / Detail / Booking / Ordering.
  - Aesthetic match: Strong — dark mode maps to our "Ferie Black" theme.

- **User-Friendly Restaurant Booking System** — https://www.figma.com/community/file/1448502744983107005/user-friendly-restaurant-booking-system
  - License: Figma Community default (CC BY 4.0).
  - Covers: Reservation flow, date/time selection, lists, confirmation.
  - Aesthetic match: Medium — booking flow choreography (date → party size → slot → confirm).

- **Dishdash — Chinese Restaurant Reservation App** — https://www.figma.com/community/file/1326491052138997252/dishdash-chinese-restaurant-reservation-app
  - License: Figma Community default (CC BY 4.0).
  - Covers: Restaurant browse / detail / reservation / cuisine-specific theming.
  - Aesthetic match: Strong — Asian-cuisine-specific brand voice closest to our Burmese context.

- **Reserv.AI — Restaurant Reservation System** — https://www.figma.com/community/file/1237727679098708876/reserv-ai-restaurant-reservation-system
  - License: Figma Community default (CC BY 4.0).
  - Covers: Reservation flow, AI-assisted booking patterns.
  - Aesthetic match: Medium — useful for our AI chat pattern.

- **LocalEats — Community Driven Food Discovery App** — https://www.figma.com/community/file/1504754447548710556/localeats-community-driven-food-discovery-app
  - License: Figma Community default (CC BY 4.0).
  - Covers: Discovery / community / local gems / food cards.
  - Aesthetic match: Strong — "local discovery" matches Bangkok-Myanmar-niche use case.

- **iOS 18 and iPadOS 18 (Apple official)** — https://www.figma.com/community/file/1385659531316001292/ios-18-and-ipados-18
  - License: Apple Design Resources license — verify before commercial publish.
  - Covers: Native iOS controls, materials, text styles, layout guides.
  - Aesthetic match: Strong — the iOS-native baseline our glass nav and bottom sheets sit on top of.

- **Glassmorphic UI Kit for iOS 26** — https://www.figma.com/community/file/1514159272233131504/glassmorphic-ui-kit-for-ios-26-new-interface-design-with-blur-frosted-elements
  - License: Figma Community default (CC BY 4.0).
  - Covers: Blurred / frosted nav + sheet components, transparent layers.
  - Aesthetic match: Strong — exact match for our glass nav + bottom sheets.

- **Liquid Glass iOS 26 UI Kit | Icon + Button Components** — https://www.figma.com/community/file/1519606028357095528/liquid-glass-ios-26-ui-kit-icon-button-components
  - License: Figma Community default (CC BY 4.0).
  - Covers: Glass buttons (light + dark), scalable icons in iOS aesthetic.
  - Aesthetic match: Strong — covers both Arctic Ice and Ferie Black themes.

- **iOS 26 Arabic UI Kit (RTL adaptation of Apple official)** — https://www.figma.com/community/file/1551577091973826981/ios-26-arabic-ui-kit-based-on-apple-official-library
  - License: Figma Community default (CC BY 4.0), built on Apple Design Resources — verify before commercial use.
  - Covers: Full RTL iOS components, bilingual layouts, mirrored controls.
  - Aesthetic match: Medium — Burmese is LTR (not RTL), but this is the closest "Apple-derived non-Latin bilingual" pattern reference for type pairing and second-script density.

### 2.D Dribbble + Behance shots (visual inspiration)

- **GourmetGrove — Restaurant Mobile App UI** — https://dribbble.com/shots/24559430-GourmetGrove-UI-UX-Design-for-Restaurant-Mobile-App
  - Designer: Phenomenon Product / Phenomenon Studio.
  - Element to steal: High-polish restaurant detail with rich hero imagery + "tailored recommendations" card stack.

- **GourmetGrove (variant) — Reservation flow** — https://dribbble.com/shots/24995642-GourmetGrove-Mobile-App-UI-Design-for-Restaurant
  - Designer: Phenomenon Studio.
  - Element to steal: Reservation flow + interactive menu pattern.

- **Restaurant Screen — Zomato iOS** — https://dribbble.com/shots/1348096-Restaurant-Screen-Zomato-iOS-App
  - Designer: Juhi Chitra (for Zomato).
  - Element to steal: Restaurant detail header with rating chip, cuisine tags, action row layout.

- **Zomato widget for iOS — Srivathson Thyagarajan** — https://dribbble.com/shots/16248074-Zomato-s-widget-for-iOS
  - Element to steal: Compact restaurant card with rating in gold pill — exactly what our `#D4A853` rating chip should feel like.

- **Food delivery & discovery — Onboarding (Bien)** — https://dribbble.com/shots/3536327-Food-delivery-discovery-Onboarding-and-rating
  - Designer: Ivan Bjelajac (Bien Studio).
  - Element to steal: Full-bleed photo onboarding cards + restrained rating screen typography.

- **Food delivery & discovery — Meal ordering (Bien)** — https://dribbble.com/shots/3536336-Food-delivery-discovery-Meal-ordering-and-order-details
  - Designer: Ivan Bjelajac (Bien Studio).
  - Element to steal: Detail screen image-first composition, subtle UI overlay.

- **Hero Section with Parallax Effect — Seda Şen** — https://dribbble.com/shots/23913041-Hero-Section-with-Parallax-Effect
  - Element to steal: Hero parallax behavior pattern; the parallax curve and image-to-text transition.

- **Booking Success Screen (Hopper) — Pierre-Etienne Corriveau** — https://dribbble.com/shots/4952912-Booking-Success-Screen
  - Element to steal: Celebration moment — animated check + clean confirmation layout.

- **Plate — Restaurant Booking App (Behance, Design Monks)** — https://www.behance.net/gallery/225232049/Plate-Restaurant-Booking-App-UX-UI-Design
  - Designer: Design Monks.
  - Element to steal: End-to-end reservation choreography (search → slot → party size → confirm) and filter chip rows.

- **Restaurant Reservation Booking Platform (Behance) — Robert Sens** — https://www.behance.net/gallery/37330063/Restaurant-Reservation-Booking-Platform-UX-UI
  - Element to steal: Available-times slot grid (the canonical 18:00 · 18:30 · 19:00 chip grid) + reservation summary card.

### 2.E Aesthetic / brand inspiration (light+dark + glass + red+gold)

- **Muzli — 60+ Best Dark Mode UI/UX Inspiration (2026)** — https://muz.li/inspiration/dark-mode/
  - Why useful: Live-curated dark-mode references; filter for luxury/hospitality to match Ferie Black; validates near-black (`#0A0A0A`–`#161616`) over pure black.

- **Muzli — Dark Mode Design Systems: Patterns, Tokens, Hierarchy** — https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/
  - Why useful: Token strategy for paired light/dark systems — directly applicable to Arctic Ice + Ferie Black.

- **Mobivery — Liquid Glass effect in iOS 26** — https://mobivery.com/en/liquid-glass-effect/
  - Why useful: Documents exact iOS 18+/26 liquid-glass vocabulary (panel opacity, dark-mode rim treatment) for our glass nav + bottom sheets.

- **Madebyluddy — iOS 26 Liquid Glass: Comprehensive SwiftUI Reference** — https://medium.com/@madebyluddy/overview-37b3685227aa
  - Why useful: Detailed liquid-glass reference (light + dark behaviors, contrast handling, blur math) so our glassmorphism stays platform-native, not 2021 trend.

- **Figma resource library — 100 Color Combinations** — https://www.figma.com/resource-library/color-combinations/
  - Why useful: Curated red + gold + neutral pairings to stress-test `#E0052D` / `#D4A853` against accent and surface neutrals.

### 2.F Top 5 patterns most worth copying

1. **Parallax hero + sticky reserve CTA on restaurant detail** — image scales/blurs as you scroll up; "Reserve" pinned to bottom; section headers (About / Menu / Reviews / Photos) become sticky inner nav.
   - Best ref: `app/listing/[id].tsx` in [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native) + structural pattern from [Zomato redesign](https://medium.com/@shparashar523/ui-ux-case-study-zomato-app-redesign-simplifying-the-food-ordering-experience-15b7c850eb46).

2. **Map + bottom sheet swap (list view inside the sheet)** — map is the bottom layer; sheet has 3 detents (peek = chip strip, mid = card carousel, full = list); pulling the sheet down dims back to map.
   - Best ref: `components/ListingsMap.tsx` + `components/ListingsBottomSheet.tsx` in [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native) and Apple-style detents in `app/maps.tsx` of [rit3zh/expo-apple-maps-sheet](https://github.com/rit3zh/expo-apple-maps-sheet).

3. **Stackable filter sheet (cuisine → price → distance) with scale-back parent** — tapping a filter chip pushes a new sheet on top; parent scales down 0.95 and dims; back gesture pops.
   - Best ref: `components/*` + `context/*` in [rit3zh/expo-stack-bottom-sheet](https://github.com/rit3zh/expo-stack-bottom-sheet).

4. **Glassmorphic floating tab bar with BlurView + detached FAB** — tab bar floats above content with expo-blur and drop shadow; a separate AI chat FAB sits centered above it on a gradient.
   - Best ref: `app/(tabs)/_layout.tsx` in [Kumailthe1/liquid-glass-navigation](https://github.com/Kumailthe1/liquid-glass-navigation) + [Callstack on Liquid Glass in RN](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native).

5. **"Open now" chip + time-aware suggestion pills on the discovery header** — top of discovery has an "Open now" toggle and rotating chips that change with time-of-day (breakfast, lunch, dinner, late-night).
   - Best ref: [OpenTable UX case study](https://uxdesign.cc/opentable-a-ux-case-study-bf073f2e97bf) (validates "now" demand) + [Foursquare Swarm 6.0](https://medium.com/foursquare-direct/introducing-swarm-6-0-a-social-way-to-discover-new-places-82c42743f759) (validates the rotating pill pattern).

---

## 3. Recommended Implementation Order

Sequenced for an 8–10 week MVP with one full-stack engineer. Each week assumes ~4 days of focused work; tighten or loosen by your actual capacity.

| Week | Theme | Deliverable | Key files / patterns to clone |
|---|---|---|---|
| 1 | **Foundation** | Expo dev client with NativeWind + expo-router file structure; `src/lib/supabase.ts` hybrid storage adapter wired; theme tokens (Arctic Ice + Ferie Black) loaded | Fork the `app/` layout from [ZikaZaki/airbnb-mobile-app](https://github.com/ZikaZaki/airbnb-mobile-app) (MIT). Use [obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes) for env/EAS/Husky baseline. |
| 2 | **Auth** | `signInWithApple`, `signInWithGoogle`, anonymous browse, `user_devices` telemetry, sign-out + foreground-refresh | Code in §1.2. Reference auth screens: `app/(modals)/login.tsx` in [ZikaZaki](https://github.com/ZikaZaki/airbnb-mobile-app), `app/sign-in.tsx` in [react_native-restate](https://github.com/adrianhajdin/react_native-restate). |
| 3 | **Discovery — list** | `nearby_restaurants` RPC + `useNearby` infinite query + card grid with gold rating pills | SQL in §1.3. Card pattern: `components/Cards.tsx` in [react_native-restate](https://github.com/adrianhajdin/react_native-restate); design from [Resy 2024 critique](https://www.ixd.prattsi.org/2024/01/design-critique-resy-ios-app/). |
| 4 | **Discovery — map** | `restaurants_in_bounds` RPC + `useRestaurantsInView` debounced query + map + bottom sheet with 3 detents | SQL in §1.3. UI pattern: `components/ListingsMap.tsx` + `ListingsBottomSheet.tsx` from [Galaxies-dev](https://github.com/Galaxies-dev/airbnb-clone-react-native); detents from [rit3zh/expo-apple-maps-sheet](https://github.com/rit3zh/expo-apple-maps-sheet). |
| 5 | **Restaurant detail** | Parallax hero + section nav (Overview / Menu / Reviews / Photos) + sticky CTA | `app/listing/[id].tsx` in [Galaxies-dev](https://github.com/Galaxies-dev/airbnb-clone-react-native); inner-nav pattern from [Zomato redesign](https://medium.com/@shparashar523/ui-ux-case-study-zomato-app-redesign-simplifying-the-food-ordering-experience-15b7c850eb46). |
| 6 | **Booking** | `book_slot` RPC + `useBookSlot` mutation + slot grid (18:00 chip) + party-size stepper + confirmation screen + `pg_cron` sweep job | SQL in §1.1, TS in §1.1. Slot grid design: [Robert Sens — Behance](https://www.behance.net/gallery/37330063/Restaurant-Reservation-Booking-Platform-UX-UI). Success screen: [Hopper Booking Success on Dribbble](https://dribbble.com/shots/4952912-Booking-Success-Screen). |
| 7 | **Reviews + waitlist** | Review composer gated by completed booking + `promote_waitlist` trigger + waitlist tab in account | Trigger in §1.1. Review composer: `components/Comment.tsx` in [react_native-restate](https://github.com/adrianhajdin/react_native-restate). |
| 8 | **AI chat** | `/api/chat` proxied through Next.js with Upstash rate limit + response cache + token-length cap; mobile chat tab with streaming bubbles + inline restaurant cards | Code in §1.4. Streaming UI pattern: [EvanBacon/expo-ai](https://github.com/EvanBacon/expo-ai). |
| 9 | **i18n + push** | Burmese strings via `i18next` + Noto Sans Myanmar, line-height 1.9 swap; `expo-notifications` + EAS APNs for booking confirm/reminder + waitlist promotion | i18n wiring: [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template). Push: [Expo notifications docs](https://docs.expo.dev/push-notifications/overview/). |
| 10 | **Polish + store submission** | Glassmorphic tab bar polish, theme toggle, App Store screenshots, privacy nutrition labels, TestFlight | Tab bar: [Kumailthe1/liquid-glass-navigation](https://github.com/Kumailthe1/liquid-glass-navigation). Brand polish: [Muzli dark mode systems](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/). |

**Cross-cutting work (split across weeks 1–10):**
- **Observability**: Sentry for crash + perf, `pg_stat_statements` enabled, daily Postgres slow-query email. Cost <$30/mo at MVP.
- **CI/CD**: EAS Build for dev/prod profiles; OTA via `expo-updates` for JS-only fixes between store releases.
- **Backend hardening**: Upstash rate limiter on `/api/auth/*` and `/api/chat`, CAPTCHA on signup, daily `chat_usage` anomaly job.
- **Burmese QA** (recurring): test every screen in EN + Burmese on iOS 18 + Android 14 real devices — line-breaks, line-height, mixed-script runs.

**What we deliberately don't build in v1:**
- Materialized views for the home feed (revisit when >10k restaurants).
- Separate read replicas (revisit when PostgREST p95 creeps).
- ClickHouse/TimescaleDB for device telemetry (revisit at 10k DAU).
- FingerprintJS Pro (revisit at first account takeover).
- A dedicated mobile vendor portal (web stays the vendor surface).
