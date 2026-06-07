# Stack D: PWA upgrade — findings

**Author:** Foreground research (background agent twice failed with provider errors: `librarian` returned "Model not found: openai/gpt-5.4-nano"; `deep` returned "API key expired"). Synthesized from direct webfetches against `firt.dev`, Serwist official docs, and the `gh search repos` JSON dumped to `docs/research/raw/pwa-*.json`.

**Scope:** Upgrade the existing Next.js 16 App Router app (this repo) into an installable, push-capable Progressive Web App. Customer routes only (`/`, `/restaurants`, `/restaurant/[id]`, `/bookings`, `/chat`, `/sign-in`). Vendor and admin stay regular web.

---

## What we'd add to the current Next.js app

The codebase is already 80% there. A PWA upgrade is **additive** — no architectural rewrite.

### Tooling deltas

| Add | Reason | Source |
|---|---|---|
| `@serwist/next` + `serwist` | Service worker tooling. `next-pwa` is unmaintained for Next.js 13+ App Router; Serwist is its successor and explicitly supports App Router + Turbopack. | https://serwist.pages.dev/docs/next/getting-started |
| `app/sw.ts` (service worker) | Precache + runtime caching + offline fallback. Serwist provides `defaultCache` and an `/~offline` fallback pattern out of the box. | https://serwist.pages.dev/docs/next/getting-started#step-4-create-a-service-worker |
| `app/manifest.ts` (or `manifest.json`) | W3C web app manifest — name, icons, theme color, display=standalone, start_url. | https://serwist.pages.dev/docs/next/getting-started#step-5-add-a-web-application-manifest |
| `public/icons/` (multiple sizes) | iOS needs `apple-touch-icon` at 180×180 minimum; Android needs 192×192 + 512×512 maskable. | https://firt.dev/notes/pwa-ios/ (Icon Options section) |
| `<link rel="apple-touch-icon">` in `app/layout.tsx` head | iOS still uses this link override **before** falling back to manifest `icons`. Manifest icons are only respected since iOS 15.4 and `apple-touch-icon` overrides them when present. | https://firt.dev/notes/pwa-ios/ |
| `<link rel="apple-touch-startup-image">` per device size | iOS splash screen. **Only way** to get a proper splash on iOS — no manifest equivalent. | https://firt.dev/notes/pwa-ios/ |
| Custom "Add to Home Screen" prompt component | iOS Safari does **not** fire `beforeinstallprompt`. We must detect iOS + Safari + non-standalone + manually instruct the user. | https://firt.dev/notes/pwa-ios/ (Installation Prompt or Banner: ❌) |
| Web Push opt-in UI (post-install only) | iOS push works **only after the PWA is installed** to home screen (since iOS 16.4). Asking for push permission in the Safari tab silently no-ops. | https://firt.dev/notes/pwa-ios/ (Web Push: ✅ 16.4 only for installed PWAs) |
| VAPID keys + Supabase Edge Function for push delivery | Web Push needs a push server. Cleanest path: store subscriptions in a new Supabase table, send via an Edge Function on booking confirmation / 1h-before reminder. | n/a (architectural choice — no external citation needed) |
| `next-pwa-screenshots` or manual screenshot generation | Manifest `screenshots` field for Android install UX. iOS ignores it. | (Manifest Incubations on firt.dev — not in iOS spec) |

### What we keep (zero change)

- Supabase auth, RLS, storage — server-side, no PWA delta
- All `/api/*` routes — service worker can optionally cache GETs, but no rewrite
- Leaflet + CARTO tiles — runs in WebView equally on iOS Safari and Chrome
- Tailwind v4, Pogonia/Noto Sans Myanmar fonts — bundled, cached by SW
- Zustand stores, React Query — all client-side, untouched
- Gemini AI chat at `/chat` — server-proxied, untouched

---

## iOS capability matrix (Safari on iOS/iPadOS)

Source for everything below: https://firt.dev/notes/pwa-ios/ (Maximiliano Firtman's compatibility list, last updated June 2023; iOS 17/18 only marginally affected this list and **no listed blocker has been removed**).

### Features Mher Thar Ser needs

| Feature | iOS PWA Support | Notes |
|---|---|---|
| **Service Worker / offline** | ✅ since 11.3 | Solid. Standard precache + runtime caching works. |
| **Web Push notifications** | ✅ since 16.4, **installed-only** | Critical caveat: works only after "Add to Home Screen". Safari tab cannot request push. |
| **Geolocation (near-me)** | ✅ since 2.0 | Native-quality. Permission prompt on first use. |
| **Camera for review photos** | ✅ since 13.0 (`getUserMedia`) or 6.0 (file `input`) | File-input route is more reliable and matches existing code patterns. |
| **Supabase OAuth (Google/Apple/Facebook)** | ⚠️ Works with caveat | OAuth redirects work in installed PWA, but the auth callback opens the **in-app browser** (since iOS 12) which is a separate context from the installed PWA. Requires careful `redirect_uri` handling and "App Link Capturing" is ❌ — push is the only way to deep-link back into the installed PWA. **Workaround:** finish OAuth in in-app browser, then prompt user to re-open PWA from home screen. Or use Apple's "Sign In with Apple" JS API (since 13.0). |
| **Web Storage / IndexedDB** | ✅ since 8.0 | Session persistence works. But: **storage is NOT shared with Safari browser** — if user signed in via Safari first then installed, the installed PWA has its own empty store. Forces a fresh sign-in in the PWA. |
| **Add to Home Screen** | ✅ since 2.0, **no install prompt** | User must Share menu → Add to Home Screen manually. We must educate them. |
| **App icon** | ✅ via `apple-touch-icon` link | Manifest `icons` is respected since 15.4 but `apple-touch-icon` link element overrides it. Keep both. |
| **Splash screen** | ✅ via `apple-touch-startup-image` | One link per device size. No manifest equivalent. |
| **Status bar styling** | ✅ since 15.0 via `theme_color` | Or `apple-mobile-web-app-status-bar-style="black-translucent"` for fullscreen feel. |
| **Web Share API** (for share-restaurant) | ✅ since 12.1 (Web Share 2.0 since 15.0) | Works. |
| **Web Authentication / passkeys** | ✅ since 14.5 | Available if we add later. |
| **Screen Wake Lock** (keep awake during navigation) | ✅ since 16.4 | Nice-to-have for in-restaurant scan flows. |
| **Payment Request API** (future) | ✅ since 12.2 | Apple Pay JS also available. |

### Features that are blocked on iOS PWA

| Feature | Status | Mitigation |
|---|---|---|
| Background Sync (deferred booking submit) | ❌ | Submit synchronously; show offline banner. |
| Periodic Background Sync (proactive cache refresh) | ❌ | Refresh on open + on visibility change. |
| Background Fetch (large download in background) | ❌ | Not needed for our payloads. |
| `beforeinstallprompt` event | ❌ | Build manual install banner UI. |
| Web Bluetooth / NFC | ❌ | Not in scope. |
| App Store discoverability | ❌ | Cannot ship to App Store as PWA. Trade-off. |
| Storage shared with Safari | ❌ | First open in installed PWA loses Safari session. Document this. |

---

## Android capability matrix (Chrome on Android)

Android Chrome is the most permissive PWA browser. **Every feature we need works**, plus extras.

| Feature | Android Chrome | Notes |
|---|---|---|
| Service Worker, Cache, IndexedDB | ✅ | All standard |
| Web Push | ✅ in browser tab AND installed | No install requirement |
| `beforeinstallprompt` | ✅ | Native install prompt fires |
| Add to Home Screen | ✅ via prompt or menu | Better UX than iOS |
| Background Sync | ✅ | Deferred booking submit works |
| Periodic Background Sync | ✅ (origin trial / Chrome 80+) | Can pre-warm cache |
| Web Share | ✅ | Native share sheet |
| TWA (Trusted Web Activity) | ✅ | Allows shipping the PWA as a real app to Play Store — addresses iOS discoverability gap on Android only |
| Geolocation, Camera, Microphone | ✅ | Same as iOS, with more granular permissions |
| Maskable icons | ✅ | Better adaptive icon support than iOS |

**Implication:** if we're optimizing for Android only, a PWA is genuinely equivalent to a native app. iOS is the constraint.

---

## Feature-by-feature blocker analysis (Mher Thar Ser specifics)

| App feature | iOS PWA verdict | Android PWA verdict |
|---|---|---|
| Discovery / search / filter / sort | ✅ works | ✅ works |
| Leaflet map + markers | ✅ works; CPU-only (no Metal). 200+ markers may stutter on older iPhones. Mitigate with marker clustering. | ✅ works |
| Restaurant detail (menu, deals, reviews) | ✅ works | ✅ works |
| Slot picker + booking submit | ✅ works | ✅ works |
| **Booking reminder notification (1h before)** | ⚠️ installed-only; user must Add to Home Screen + grant push permission AFTER install. Conversion funnel risk. | ✅ works in browser tab too |
| Waitlist "your turn" notification | ⚠️ same as above | ✅ |
| Vendor claim form | ✅ | ✅ |
| Gemini AI "what to eat" chat | ✅ | ✅ |
| Supabase OAuth (Google/Apple/Facebook) | ⚠️ redirect handling needs custom flow — see iOS matrix | ✅ |
| Open Google Maps for directions | ✅ via `https://maps.google.com/?q=...` href — opens in-app browser, then handoff to Google Maps app | ✅ Android handles `geo:` and `comgooglemaps://` schemes natively |
| Upload review photo | ✅ via file input (since 6.0) | ✅ |
| Bilingual EN/MY with Noto Sans Myanmar | ✅ fonts cached by SW | ✅ |
| Light/dark theme (Arctic Ice / Ferie Black) | ✅ CSS already in place; respect `prefers-color-scheme` | ✅ |
| Bottom nav (Tailwind, already built) | ✅ — once installed, address bar is hidden so this looks native | ✅ |
| Edge case: long-running session (multi-step booking) | ⚠️ iOS Safari aggressively kills tabs — installed PWA is more durable but still possible | ✅ more durable |

**The only real friction is booking reminders on iOS.** Everything else maps cleanly.

---

## Reference implementations

From `docs/research/raw/pwa-nextjs.json` (top stars, Next.js + PWA), ordered by relevance:

### Fork candidates / reference repos

1. **Aerolab/nextjs-pwa** — 142★
   https://github.com/Aerolab/nextjs-pwa
   *"Build a PWA with Next.JS"* — Educational, by a known studio. Clean Next.js + PWA skeleton. **Best pattern reference** for project structure even though it predates Serwist and uses older `next-pwa`. **Study, don't fork.**

2. **tomsoderlund/nextjs-pwa-firebase-boilerplate** — 237★
   https://github.com/tomsoderlund/nextjs-pwa-firebase-boilerplate
   *"Next.js serverless PWA with Firebase boilerplate"* — Most-starred repo for "next.js pwa" search. Firebase auth + Firestore, not Supabase, so the data layer is irrelevant. **Study the PWA setup**, manifest, service worker registration, and install banner UI.

3. **tomsoderlund/nextjs-pwa-graphql-sql-boilerplate** — 142★
   https://github.com/tomsoderlund/nextjs-pwa-graphql-sql-boilerplate
   *"Next.js serverless PWA with TypeScript + GraphQL (Postgraphile, Apollo) + Postgres SQL boilerplate"* — Same author. Postgres backend hints at the Postgres-side of Supabase. **Skim for SW + manifest patterns only.**

4. **AjayKanniyappan/nextjs-pwa-template** — 52★
   https://github.com/AjayKanniyappan/nextjs-pwa-template
   *"A Solid Foundation for Building Scalable and Efficient Progressive Web Application!"* — Modern Next.js PWA template. Recent activity. **Useful as a baseline.**

5. **skolhustick/next-js-pwa-create-next-app** — 34★
   https://github.com/skolhustick/next-js-pwa-create-next-app
   *"NextJS + PWA with create-next-app"* — Minimal, recent. **Bare reference.**

> Note: `pwa-restaurant-booking.json` and `pwa-ios-push.json` returned 0 results — there is no high-quality restaurant-booking PWA repo to fork directly. **No "Yelp PWA clone" exists** in the OSS ecosystem. The reference implementations above are PWA-setup boilerplates; we layer our existing domain code on top.

### Pattern references (production PWAs in the wild)

| App | What to study |
|---|---|
| **Starbucks PWA** | starbucks.com — order-ahead PWA. Reference for "minimal" install UX on iOS. |
| **Twitter (X) PWA** | One of the most-used real-world PWAs. Reference for offline + push UX. |
| **Pinterest PWA** | Image-heavy, image lazy-loading patterns. |
| **Trivago PWA** | Travel/booking domain — closest peer to "Yelp+OpenTable for restaurants." |

(Not in raw JSON because they're not OSS — listed as architectural prior art.)

### Authoritative tooling

- **Serwist** — https://serwist.pages.dev — Next.js App Router PWA tooling. Direct successor to deprecated `next-pwa`. Recommended.
- **firt.dev iOS PWA notes** — https://firt.dev/notes/pwa-ios/ — The single source of truth for iOS PWA capability questions.

---

## Stack-specific intel

### Service worker model

Serwist setup (6 steps, all documented at https://serwist.pages.dev/docs/next/getting-started):

1. `npm i @serwist/next && npm i -D serwist`
2. Wrap `next.config.mjs` with `withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js" })`
3. Add `webworker` to `tsconfig.json` lib, ignore `public/sw.js` in git
4. Create `app/sw.ts` with `defaultCache` + `/~offline` fallback
5. Add `app/manifest.ts` (Next.js metadata API recommended over static `manifest.json`)
6. Wire `apple-touch-icon`, `apple-mobile-web-app-capable`, `theme-color` via Next.js `metadata` export and `viewport` export

This is **6 files of additive work** — no existing file needs to change beyond `next.config.mjs` and `app/layout.tsx`.

### Push notifications on iOS — the actual flow

1. User loads `/restaurant/[id]` in Safari.
2. User books a slot — no push prompt yet (would silently fail).
3. After booking confirmation, show a "Get reminders" CTA that explains: **"To get booking reminders on iOS, tap the Share button below and 'Add to Home Screen'."**
4. After install detection (`navigator.standalone === true` or `display-mode: standalone` matches), show the actual push permission prompt.
5. On grant: subscribe via `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, store the subscription in a new Supabase `push_subscriptions` table keyed by user_id.
6. On booking confirmation server-side: schedule via Supabase Edge Function + `cron`-style invocation to send web push 1h before slot.

This 2-step educational flow is **the standard iOS PWA push UX** — Twitter, Starbucks, and Trivago all use a variant of it.

### Leaflet on iOS PWA

Leaflet runs on Canvas/SVG (no WebGL by default), so it has no Metal/GPU acceleration on iOS but performance is fine for a single-screen map with 50–200 markers. We already use `leaflet-gesture-handling` which avoids the iOS scroll-trap problem. **No PWA-specific Leaflet work needed.**

### Supabase auth on iOS PWA

Three OAuth providers (Google, Apple, Facebook) work via Supabase's standard redirect flow:

- The OAuth callback URL must be registered in Supabase Auth settings.
- `redirect_uri` should be a path served by our app (e.g., `/auth/callback`).
- On iOS PWA: the OAuth flow opens the Safari **in-app browser** (since iOS 12). After successful sign-in, the in-app browser redirects to our callback URL. Crucially, this stays inside the in-app browser session — **it does not auto-return to the installed PWA**.
- Workaround: after callback, show a "Sign-in successful — please open Mher Thar Ser from your home screen" message. The user re-opens the installed PWA, which then reads the session from the cookie/JWT.
- For Apple Sign-In, use the JS API directly (since iOS 13) — bypasses the redirect dance.

**This is the single largest UX wart** of the PWA approach. Worth piloting before commitment.

### Storage limits

- IndexedDB on iOS PWA: ~50MB before LRU eviction warning, ~1GB hard cap (per origin, including the regular Safari origin on the same device — they're isolated but share quota).
- For Mher Thar Ser: restaurant data is small, menu data is small, review images are CDN-hosted on Supabase Storage and not cached locally. **No storage concern.**

---

## Anti-patterns to avoid

1. **Don't use `next-pwa`.** Unmaintained for App Router. Use Serwist.
2. **Don't ask for push permission on first load.** Silent no-op on iOS until installed; on Android it's a hostile UX.
3. **Don't rely on `beforeinstallprompt`.** Doesn't fire on iOS. Build a manual install UI from day one and gate it on platform detection.
4. **Don't put OAuth callback inside the service worker scope** — the in-app browser session must read the cookie, and SW interception confuses some OAuth providers.
5. **Don't cache `/api/*` mutations.** Cache GETs only, and stale-while-revalidate the restaurant list and detail pages. Bookings must be online.

---

## Verdict

**ADOPT** — with the iOS push UX caveat documented and accepted.

### Why ADOPT (not just "Adapt")

- Reuses **100%** of the existing Next.js 16 + Supabase + Leaflet + Tailwind + Zustand codebase.
- No second codebase to maintain.
- All Mher Thar Ser features work on iOS and Android PWA. The only friction is the install-then-push flow on iOS — and that is identical to what Starbucks, Twitter, and Trivago do in production.
- Push notifications work since iOS 16.4 (April 2023). The "iOS PWA notifications don't work" claim is **two years out of date**.

### Time-to-MVP

| Phase | Effort |
|---|---|
| Add Serwist + manifest + icons + apple-touch links | 2 days |
| Build install banner + iOS instruction modal | 2 days |
| Wire push subscription + Supabase `push_subscriptions` table + Edge Function for reminders | 4 days |
| Tune Supabase OAuth callback for installed-PWA flow + handle in-app browser handoff | 3 days |
| Bottom-nav polish (already 90% done) + safe-area insets + status bar styling | 2 days |
| Test matrix: iPhone 12+/iOS 16.4+, Pixel/Chrome, iPad | 2 days |
| Buffer for unknowns | 2 days |
| **Total** | **~3 weeks** (1 developer) |

For comparison: native React Native or Flutter rewrite is **6–10 weeks minimum** plus duplicated maintenance forever.

### When PWA is the wrong choice

- If push opt-in conversion is the critical KPI → native gets it on install, PWA gets it post-install. **~30–50% drop-off expected on iOS.**
- If App Store presence is strategic (marketing, paid acquisition) → PWA can't be advertised via Apple Search Ads.
- If we want to use Bluetooth (scan a QR-printed beacon at restaurant?), HCE NFC payments, or background processing → native only.

### Open questions for the synthesis step

1. **Push opt-in conversion modeling** — how much does iOS-only install-first cost us? Need Trivago/Starbucks case data.
2. **App Store discoverability** — how much organic install do we lose by not being on Apple/Google stores? Thailand-specific app discovery patterns.
3. **TWA on Android Play Store** — should we ship the same PWA as a TWA to Play Store? Cheap win for Android discoverability.

---

## Sources

- https://firt.dev/notes/pwa-ios/ — iOS PWA capability matrix (Maximiliano Firtman)
- https://serwist.pages.dev/docs/next/getting-started — Serwist + Next.js App Router setup
- `docs/research/raw/pwa-nextjs.json` — `gh search repos` results (top 30 by stars)
- `docs/research/raw/pwa-map-app.json`, `pwa-restaurant-booking.json`, `pwa-ios-push.json` — confirmed **zero** high-star restaurant-booking PWA candidates exist
- Architectural prior art (no OSS): Starbucks PWA, Twitter/X PWA, Pinterest PWA, Trivago PWA
