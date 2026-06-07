# Mobile Clone Findings — 2026-05-17

## TL;DR (≤ 5 bullets)
- **Recommended primary stack: PWA upgrade first, RN + Expo as v2** — PWA ships in 2–3 weeks with 100% code reuse and is the only path that doesn't fork the codebase; RN + Expo (8–10 weeks) earns app-store presence and reliable push once the mobile UX shape is proven.
- **Top fork candidate (when we do go native): [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native)** — cleanest map + bottom-sheet + OAuth + sticky-CTA detail pattern in the RN ecosystem; structurally 1:1 with our Discovery / Restaurant detail / Booking modal shape.
- **Top runner-up: [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)** — Next.js web + Expo mobile sharing one Supabase backend with i18n and theming; mirrors our exact relationship so it's the best "wiring" reference even if not the visual spine.
- **Biggest risks**: (1) iOS web push silently drops subscriptions after ~1–2 weeks of inactivity, so PWA reminders need an email/SMS fallback; (2) `Capacitor + Next.js App Router` requires moving `/api/*` off the Next server because `output: 'export'` drops Route Handlers — non-trivial backend re-plumbing.
- **Estimated effort to MVP**: PWA 2–3 weeks · Capacitor 4–6 weeks · RN+Expo 8–10 weeks · Flutter 10–14 weeks.

## Stack Comparison Table
| Criterion | RN + Expo | Flutter | Capacitor wrap | PWA |
|---|---|---|---|---|
| Reuse of existing TS/React code | High — share types, hooks, Zod, Supabase client; UI rewritten in RN primitives | None — full Dart rewrite | Very high — UI components reused, but `/api/*` must move off Next server | 100% — same Next.js 16 codebase |
| Maps quality | Solid — `react-native-maps` + `react-native-map-clustering` (native iOS/Android markers) | `flutter_map` (OSM, matches our Leaflet/CARTO model) or `google_maps_flutter` | Leaflet survives but feels web-ish on iOS (double-click quirk); production wants `@capacitor/google-maps` swap | Unchanged — Leaflet + CARTO works identically |
| Supabase auth + OAuth maturity | Workable but DIY — Apple/Google native via `signInWithIdToken`, Facebook brittle via `expo-auth-session`; no single high-quality OSS starter | Mature — `supabase_flutter` v2 + `supabase_auth_ui`'s `SupaSocialsAuth` widget covers Google+Apple+Facebook | Fragile via WebView PKCE on iOS (code-verifier loss); production answer is `@capgo/capacitor-social-login` + `signInWithIdToken` | Mature, BUT iOS standalone webview doesn't share Safari's auth session — needs OTP/PKCE workaround after Add-to-Home-Screen |
| Burmese font + i18n maturity | Adequate — `@expo-google-fonts/noto-sans-myanmar` + `expo-localization` + `i18next`; bespoke (no high-star reference app uses Burmese) | Workable but shaping risks — `flutter_localizations` + Noto Sans Myanmar asset; [flutter/flutter#118344](https://github.com/flutter/flutter/issues/118344) documents complex-script issues, plan on-device QA | Inherits from web verbatim — Noto + Tailwind line-height carry into WKWebView/Android WebView | Unchanged from current web; no regressions |
| Push notifications (iOS) | Mature — `expo-notifications` + EAS APNs is the most ergonomic cross-platform DX | Standard — `firebase_messaging` or Supabase + APNs, no Flutter-specific gotcha | Solid via `@capacitor-firebase/messaging`; APNs requires physical-device testing | Works iOS 16.4+ outside EU, install + permission gated, subscriptions decay after ~1–2 weeks of inactivity — **unreliable as sole channel** |
| OSS clone availability for our domain | Poor for restaurants directly; Good for Airbnb-style structural surrogates (Galaxies-dev, ZikaZaki) | Weak — Suffixdigital is closest stack match but missing booking/map/reviews; no single repo covers full surface | None close — Burger King is the nearest restaurant-vertical Capacitor reference (closed source) | Strong — first-party Next.js PWA guide + Serwist + Leaflet PWA examples + iOS install-prompt libs |
| Time-to-MVP (rough weeks) | 8–10 | 10–14 | 4–6 | 2–3 |
| Verdict for Mher Thar Ser | **Adapt** — fork Galaxies-dev pattern, swap Clerk→Supabase, upgrade SDK | **Adapt** — Suffixdigital skeleton + YelpExplorer architecture, hand-build booking/map | **Adapt** — shippable only if `/api/*` rehosted, OAuth goes native, Ionic shell adopted | **Adopt** (as v1) — fastest path; pair web push with email/SMS fallback |

## Per-Stack Findings

### Stack A: React Native + Expo

#### Fork candidates
- **Galaxies-dev/airbnb-clone-react-native** — https://github.com/Galaxies-dev/airbnb-clone-react-native
  - Stars: 336 · Last commit: 2023-10 · License: not declared (no LICENSE file visible — flag for legal review)
  - What it does: Full Airbnb mobile clone — Expo Router, Clerk OAuth (Apple + Google), map with clustering, bottom sheets, parallax detail, Reanimated.
  - Feature overlap with us: discovery (map+list), listing detail, booking-style date picker, auth (OAuth), bottom sheets, expo-router architecture, expo-location, react-native-maps + react-native-map-clustering.
  - What's missing: Supabase (uses Clerk), reviews, dark mode, i18n, Burmese fonts, AI chat, deal/waitlist screens; Expo SDK 49 (old).
  - Code quality signal: TS, expo-router file-based routes, clean separation `app/(tabs)/`, `components/`, `assets/`; opinionated by a respected RN educator (Simon Grimm).
  - Estimated effort to adapt: M — swap Clerk→Supabase, restaurants for listings, add reviews/deals/waitlist, upgrade SDK 49→54.
  - Why fork-worthy: cleanest map+sheet+detail+OAuth pattern in the ecosystem for our exact UX shape.
  - Source: https://github.com/Galaxies-dev/airbnb-clone-react-native · https://www.youtube.com/watch?v=iWzUZiVoiR0

- **ZikaZaki/airbnb-mobile-app** — https://github.com/ZikaZaki/airbnb-mobile-app
  - Stars: 15 · Last commit: 2024-06 · License: MIT
  - What it does: Airbnb clone with Clerk (Apple + Google + Facebook + phone), React Native Maps + clustering, bottom-sheet navigation for property detail/reviews/booking.
  - Feature overlap with us: map+list, marker clustering, bottom-sheet detail, OAuth incl. Facebook, reviews, booking flow.
  - What's missing: Supabase (uses Clerk), dark mode, i18n, Burmese fonts, slot reservation UI.
  - Code quality signal: JS-leaning, MIT licensed; README has screenshots; lower star count but feature-complete on paper.
  - Estimated effort to adapt: M–L — same swaps as Galaxies-dev plus more cleanup.
  - Why fork-worthy: only candidate with all four OAuth providers wired through one auth layer plus reviews and clustering.
  - Source: https://github.com/ZikaZaki/airbnb-mobile-app

- **adrianhajdin/react_native-restate** (JSMastery) — https://github.com/adrianhajdin/react_native-restate
  - Stars: 670 · Last commit: 2025-08 · License: not declared (flag)
  - What it does: Real estate listing app — Expo SDK 52, Expo Router v4, NativeWind/Tailwind, Appwrite, Google OAuth, listing/detail/search/filter/profile.
  - Feature overlap with us: discovery+search+filter, listing detail, profile, Google OAuth, expo-router v4, NativeWind theming, modern SDK.
  - What's missing: **no map** (fails hard requirement), no booking slot UI, Appwrite not Supabase, no reviews, no i18n.
  - Code quality signal: TS, NativeWind, Expo SDK 52, JSMastery-grade tutorial code with clean folder layout.
  - Estimated effort to adapt: L.
  - Why fork-worthy: best modern TS+NativeWind+expo-router-v4 baseline; cite as the architecture spine even if not the map spine.
  - Source: https://github.com/adrianhajdin/react_native-restate

- **hypergalois/AirbnbClone** — https://github.com/hypergalois/AirbnbClone
  - Stars: 0 (fails star bar — listed for transparency) · Last commit: 2025-02 · License: not declared
  - What it does: Fresh Airbnb clone with Expo, Clerk, Reanimated, map clustering, advanced filters.
  - Feature overlap with us: map+list+clustering, filters, detail, bottom sheet, Clerk auth, Reanimated, recent SDK.
  - What's missing: Clerk not Supabase, no reviews/booking slots/i18n/dark mode.
  - Code quality signal: refactored fork of Galaxies-dev pattern, more modern SDK but unproven.
  - Estimated effort to adapt: M.
  - Why fork-worthy: tie-breaker only — fresher SDK than Galaxies-dev if you want a 2025-vintage baseline.
  - Source: https://github.com/hypergalois/AirbnbClone

- *No 5th candidate meets hard requirements.* **No viable restaurant-reservation RN clone exists** — DineTime, imabhinavdev/zomato-app-clone, amrsekilly/restaurant-table-resercation-app, Bozos2/Food-Order-mobile-app, VijayMakkad/FoodOrdering-App, Abel-Slk/restaurant-app-reactNative are all 0–15 stars, Firebase-backed, delivery-flavored, or missing map/OAuth/booking-slots. Airbnb and real-estate clones are the structural surrogates.

#### Pattern references
- **Map + draggable bottom sheet with snap points + marker→sheet sync** — `gorhom/react-native-bottom-sheet/example/src/screens/integrations/map/MapExample.tsx`
  - What pattern: canonical map-with-POI-list bottom sheet using `BottomSheetModal`; `pointerEvents: "box-none"` trick so pan gestures pass through to MapView.
  - Why it's good: lives in the de-facto bottom-sheet library (8.9k stars, maintained May 2026); exactly the discovery interaction we need.
  - Source: https://github.com/gorhom/react-native-bottom-sheet/blob/master/example/src/screens/integrations/map/MapExample.tsx

- **Apple-Maps-style liquid-glass sheet** — `rit3zh/expo-apple-maps-sheet`
  - What pattern: iOS 18 Apple Maps-style sheet with proper detents, blur/glass background, native gestures — drop-in for Discovery.
  - Why it's good: 193 stars, last commit 2025-11; matches our glassmorphism brand.
  - Source: https://github.com/rit3zh/expo-apple-maps-sheet · https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets

- **Stackable bottom sheet (for nested detail flows)** — `rit3zh/expo-stack-bottom-sheet`
  - What pattern: stack multiple bottom sheets with iOS-style scale transitions — useful for restaurant → menu item → reservation modal flow.
  - Why it's good: 119 stars, last commit 2025-08; saves writing modal stack logic by hand.
  - Source: https://github.com/rit3zh/expo-stack-bottom-sheet

- **Expo Router file-based routing for protected booking + tabs** — `Galaxies-dev/airbnb-clone-react-native` app folder
  - What pattern: `app/(tabs)/_layout.tsx` for bottom tabs, `app/listing/[id].tsx` for detail, `app/(modals)/booking.tsx` for modal-presented booking flow, parallax header + sticky CTA.
  - Why it's good: maps 1:1 onto our Discovery / Restaurant detail / Booking modal structure.
  - Source: https://github.com/Galaxies-dev/airbnb-clone-react-native

- **Supabase + Expo SaaS template with EN/PL/ZH i18n and light/dark themes** — `Razikus/supabase-nextjs-template`
  - What pattern: monorepo with a Next.js web app + RN Expo mobile app sharing one Supabase backend, i18n, and themes — mirrors our Next.js↔mobile relationship.
  - Why it's good: 311 stars, last commit 2025-12; reference the mobile half (`README_MOBILE.md`) for theme/i18n wiring.
  - Source: https://github.com/Razikus/supabase-nextjs-template

- *Bonus infra reference*: **obytes/react-native-template-obytes** — 4171 stars, last commit 2026-02 — production-ready Expo+TS+TailwindCSS+expo-router+react-query+i18next template. Use for env vars, EAS, Husky, GitHub Actions. https://github.com/obytes/react-native-template-obytes

#### Stack A verdict: **Adapt** — no drop-in restaurant clone exists, but Airbnb-clone patterns + Galaxies-dev architecture + gorhom map-sheet example + Razikus i18n/theme wiring give a confident path from web stack to mobile MVP.

### Stack B: Flutter

#### Fork candidates
- **Suffixdigital/Zomato-Style-Food-Delivery-App** — https://github.com/Suffixdigital/Zomato-Style-Food-Delivery-App
  - Stars: low (recent; exact count unverified) · Last commit: 2025 (active) · License: unverified — confirm before forking
  - What it does: Zomato-inspired Flutter food/restaurant app with Supabase backend, Riverpod state, Retrofit API client, magic-link + email + social OAuth (Google/Facebook/Twitter), profile management, dynamic categories from Supabase tables.
  - Feature overlap with us: discovery (categories+listings), auth (Supabase + Google/Facebook), profile, image/content loading — the only Flutter food/restaurant repo found that already uses Supabase + Riverpod.
  - What's missing: no slot-based table booking UI, no map-with-markers, no review submission flow, no Burmese/i18n, no Apple OAuth in evidence.
  - Code quality signal: Riverpod + Retrofit + `persistent_bottom_nav_bar_v2` + `flutter_screenutil` — modern, layered, null-safe Dart with separate API/Supabase/deep-link services.
  - Estimated effort to adapt: M — backend stack matches, must add discovery-map, booking slots, reviews.
  - Why fork-worthy: project skeleton with the exact backend wiring we'd ship.
  - Source: https://github.com/Suffixdigital/Zomato-Style-Food-Delivery-App

- **matthieucoisne/YelpExplorer-Flutter** — https://github.com/matthieucoisne/YelpExplorer-Flutter
  - Stars: low-medium (unverified) · License: Apache-2.0
  - What it does: Yelp Fusion API client showing business list, business detail, and latest reviews. Built explicitly to demonstrate REST-vs-GraphQL data layers behind a stable domain layer.
  - Feature overlap with us: discovery list, restaurant detail, reviews list, search.
  - What's missing: no booking/reservation, no map+markers, no auth, no i18n, no Supabase.
  - Code quality signal: Clean Architecture (domain/data/presentation), `get_it` service locator, unit tests — strongest *architectural* reference of the candidates.
  - Estimated effort to adapt: L as a full fork; S–M as a pattern reference for layering Supabase behind a repository interface.
  - Why fork-worthy: the cleanest Flutter Yelp-style discovery+reviews architecture available — copy the domain/data split when wiring Supabase repositories.
  - Source: https://github.com/matthieucoisne/YelpExplorer-Flutter

- **ahmedgulabkhan/Foodspace** — https://github.com/ahmedgulabkhan/Foodspace
  - Stars: low · Last commit: > 18 months ago (borderline on freshness rule) · License: unverified
  - What it does: Restaurant discovery — Flutter + Firebase auth, dead Zomato API for data, `flutter_map` markers, reviews, favorites.
  - Feature overlap with us: discovery, detail, reviews, **map with markers** (uses `flutter_map`/OSM — exact parallel to our Leaflet+CARTO stack), favorites.
  - What's missing: no booking slots, no OAuth (email/password only), no dark mode, no i18n, Zomato API dead.
  - Code quality signal: Provider state, Firestore-coupled — older pattern.
  - Estimated effort to adapt: L.
  - Why fork-worthy: marginal — keep ONLY as a `flutter_map` + restaurant-marker pattern reference, do not fork the project.
  - Source: https://github.com/ahmedgulabkhan/Foodspace

- **atornel/RestaurantAppUIKit** — https://github.com/atornel/RestaurantAppUIKit
  - Stars: well-known UI kit (unverified) · Last commit: likely > 18 months · License: unverified
  - What it does: Restaurant app UI kit — home, listings, detail, menu, ordering screens, purely UI.
  - Feature overlap with us: visual reference for detail, menu, listings.
  - What's missing: no booking slot UI, no map, no auth, no reviews submission, no real backend, age concern.
  - Code quality signal: design-only, pre-null-safety likely.
  - Estimated effort to adapt: L as a fork, S as widget/styling reference.
  - Why fork-worthy: marginal — listed because the brief asks for a "food-app UI kit with reservation flow"; no permissively-licensed Flutter UI kit ships a real slot-reservation flow.
  - Source: https://github.com/atornel/RestaurantAppUIKit

#### Pattern references
- **Supabase social OAuth widget (Google+Apple+Facebook)** — `supabase-community/flutter-auth-ui` — `SupaSocialsAuth`
  - What pattern: drop-in widget with `socialProviders: [google, apple, facebook]` plus deep-link callback wiring; native iOS Google+Apple flows.
  - Why it's good: official Supabase community lib (~144 stars), Apache-2.0 style permissive.
  - Source: https://github.com/supabase-community/flutter-auth-ui · https://pub.dev/packages/supabase_auth_ui

- **End-to-end Supabase auth example (magic link + OAuth + phone + email)** — `FatumaA/supa_auth_flutter`
  - What pattern: small, readable starter that wires every Supabase auth method including OAuth callback and deep-link config.
  - Why it's good: copy-paste-able auth scaffolding (`AuthGate`, redirect handling, session restore).
  - Source: https://github.com/FatumaA/supa_auth_flutter

- **Clean Architecture data-layer swap (REST ↔ GraphQL behind a repository)** — `matthieucoisne/YelpExplorer-Flutter`
  - What pattern: business/review repository in `domain/`, swappable REST and GraphQL implementations in `data/` — same shape we need to keep Supabase + Next.js `/api/*` behind one repository interface.
  - Why it's good: production-quality layering, service locator via `get_it`, tested.
  - Source: https://github.com/matthieucoisne/YelpExplorer-Flutter

- **`flutter_map` with restaurant markers (OSM, not Google)** — `ahmedgulabkhan/Foodspace`
  - What pattern: `flutter_map` + tile layer + per-restaurant `Marker` from a list of coords, with tap-to-detail.
  - Why it's good: no Google Maps SDK key, no Google billing, OSS tiles — same conceptual model as our Leaflet code.
  - Source: https://github.com/ahmedgulabkhan/Foodspace · https://docs.fleaflet.dev/

- **Riverpod + Supabase + Retrofit project layout** — `Suffixdigital/Zomato-Style-Food-Delivery-App`
  - What pattern: `SupabaseService`, `ApiService` (Retrofit), `DeepLinkService` as singletons consumed via Riverpod; `persistent_bottom_nav_bar_v2` for tab shell; `flutter_screenutil` for responsive sizing.
  - Why it's good: closest existing skeleton to the stack we'd actually ship.
  - Source: https://github.com/Suffixdigital/Zomato-Style-Food-Delivery-App

#### Stack B verdict: **Adapt** — fork the Suffixdigital skeleton for Supabase+Riverpod plumbing, borrow YelpExplorer's clean-architecture layering, hand-build the slot-booking and map-toggle screens (no OSS Flutter clone ships them together).

### Stack C: Capacitor wrap

#### Fork candidates / reference repos
- **mlynch/nextjs-tailwind-ionic-capacitor-starter** — https://github.com/mlynch/nextjs-tailwind-ionic-capacitor-starter
  - What it shows: starter combining Next.js + Tailwind + Ionic UI + Capacitor for iOS/Android/PWA from one codebase. Authored by Ionic/Capacitor co-creator Max Lynch.
  - Coverage: Next.js wrap / Tailwind / Ionic UI shell (swipe-back, native transitions). Does NOT cover Supabase, deep links, push, or maps.
  - What's missing: App Router specifics, Supabase OAuth, push.
  - Why useful: the canonical "shell" template — bolts Ionic on top of Next so you inherit Ionic's swipe-back/transition layer.
  - Source: https://github.com/mlynch/nextjs-tailwind-ionic-capacitor-starter

- **Capgo: "Convert Your Next.js App to iOS & Android with Capacitor 8"** — https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/
  - Date / freshness: 2026
  - What it shows: end-to-end Next.js → Capacitor wrap with `output: 'export'`, `images.unoptimized`, trailing slash, sync to iOS/Android.
  - Why useful: most current step-by-step against modern Next; calls out the exact next.config flags.

- **Capgo: "Build a Next.js Mobile App from Scratch with Capacitor 8"** — https://capgo.app/blog/nextjs-mobile-app-capacitor-from-scratch/
  - Why useful: cleaner config snippets to diff against your existing Next 16 config.

- **Tharun Goud: "Convert Existing Next JS web app into mobile app using Capacitor"** — https://medium.com/@tharungoud_91948/to-convert-existing-next-js-web-app-into-mobile-app-using-capacitor-1466ac31e7c2
  - Why useful: retrofit playbook for converting an already-built Next.js App Router app — matches your exact situation.

- **Capgo: Supabase + Capacitor Social Login Plugin** — https://capgo.app/blog/setup-supabase-with-capacitor-social-login/ + https://github.com/Cap-go/capacitor-supabase
  - What it shows: native social login (Google/Apple/Facebook) bridged to Supabase via `@capgo/capacitor-social-login` — sidesteps WebView OAuth entirely.
  - Why useful: PKCE-on-WebView is famously fragile on iOS; native is what production apps end up doing.

#### Pattern references / playbooks
- **Supabase official: Native Mobile Deep Linking** — https://supabase.com/docs/guides/auth/native-mobile-deep-linking
  - Teaches: custom scheme `com.supabase://**`, Capacitor `App.addListener('appUrlOpen', ...)` → `supabase.auth.setSession`.

- **Venkat Podugu: "Supabase PKCE OAuth in Capacitor iOS: why your code_verifier disappears"** — https://medium.com/@vpodugu/supabase-pkce-oauth-in-capacitor-ios-why-your-code-verifier-disappears-and-how-to-fix-it-29a4747dce9e
  - Teaches: why PKCE breaks on iOS (code_verifier lost between SFSafariViewController and app) and the HTTPS-bridge fix (Supabase → https endpoint → 302 → custom scheme).

- **Supabase Discussion #11548: OAuth redirects in Capacitor / iOS / Android / Next.js** — https://github.com/orgs/supabase/discussions/11548
  - Teaches: community-curated bridge-redirect pattern, custom-scheme pitfalls, universal-links alternative.

- **"The Complete Guide to Capacitor Push Notifications: iOS, Android & Firebase"** — https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4
  - Teaches: use `@capacitor-firebase/messaging` (community) instead of legacy plugin; bump iOS Podfile to 15+; APNs requires a physical device.

- **Capacitor docs: Deep Links (Universal/App Links)** — https://capacitorjs.com/docs/guides/deep-links
  - Teaches: Universal Links (iOS) and App Links (Android) configuration vs custom URL scheme.

#### Honest tradeoff summary (the playbook)
- **App Router compatibility**: Next.js App Router with `output: 'export'` does not run Route Handlers (`/api/*`) and Server Components can't fetch at runtime. You must rehost `/api/*` (Supabase Edge Functions or external Node) and call from the client. Sources: https://nextjs.org/docs/app/guides/static-exports · https://github.com/vercel/next.js/discussions/64660 · https://github.com/vercel/next.js/discussions/55393
- **Deep linking**: custom schemes work via `App.addListener('appUrlOpen', ...)`, but iOS SFSafariViewController doesn't always fire deep links from a direct custom-scheme redirect — route through an HTTPS endpoint that 302s to the custom scheme. Sources: https://medium.com/@vpodugu/supabase-pkce-oauth-in-capacitor-ios-why-your-code-verifier-disappears-and-how-to-fix-it-29a4747dce9e · https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- **Push notifications**: use `@capacitor-firebase/messaging`; iOS Podfile platform 15+; APNs cannot be tested on simulator (physical device only). Source: https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4
- **Keyboard handling**: iOS does not auto-scroll focused inputs into view; bottom inputs hide under keyboard; viewport jumps when switching inputs. Workarounds: Keyboard plugin "body" resize mode, or Ionic input components. Sources: https://github.com/ionic-team/capacitor/issues/5635 · https://github.com/ionic-team/capacitor/issues/6642 · https://github.com/ionic-team/capacitor/issues/1366
- **Swipe-back gesture**: not provided by Capacitor itself — real native-feel swipe-back only if you adopt Ionic's `IonNav`/`IonRouterOutlet` page stack. Ionic React has had swipe-back regressions (`swipeBackEnabled: false` ignored, double-trigger animations). Sources: https://github.com/ionic-team/ionic-framework/issues/26058 · https://github.com/ionic-team/ionic-framework/issues/20904 · https://github.com/ionic-team/capacitor/discussions/3137
- **Safe-area insets**: WKWebView doesn't inherit safe area unless configured. Working recipe: `viewport-fit=cover` + `overlaysWebView: false` in StatusBar config + `env(safe-area-inset-*)` CSS, sometimes plus `@capacitor-community/safe-area`. Android has its own status-bar-overlay bug. Sources: https://www.tutorialpedia.org/blog/ios-webview-with-capacitor-set-safe-areas/ · https://github.com/ionic-team/capacitor/issues/7648
- **Status bar / splash**: must set `overlaysWebView: false` and provide dark/light splash assets; splash flash and status-bar color flicker between launch and first paint are common because WebView boot is slower than native. Sources: https://medium.com/@hamza.ahtsham1/how-i-fixed-the-ios-status-bar-overlapping-header-content-issue-in-my-ionic-angular-app-f0e9928c5ede · https://www.tutorialpedia.org/blog/ios-webview-with-capacitor-set-safe-areas/
- **App Store / Play review risk**: Apple Guideline 4.2 ("Minimum Functionality") routinely rejects WebView wrappers that mirror a mobile website. Must add native features (push, geolocation, share, biometrics) and clearly app-like nav — a v1 that just loads the website inside Capacitor will not pass. Sources: https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper · https://forum.ionicframework.com/t/app-store-rejection-4-2-design-minimum-functionality-my-first-after-2-years-of-ionic/200908
- **OAuth callback**: WebView PKCE flow is brittle on iOS (code_verifier loss). Pragmatic answer in 2026: skip WebView OAuth and use `@capgo/capacitor-social-login` → `supabase.auth.signInWithIdToken`. Apple requires Sign in with Apple if you offer Google/Facebook anyway. Sources: https://medium.com/@vpodugu/supabase-pkce-oauth-in-capacitor-ios-why-your-code-verifier-disappears-and-how-to-fix-it-29a4747dce9e · https://capgo.app/blog/setup-supabase-with-capacitor-social-login/

**Production credibility check**: Burger King (Restaurant Brands International, same vertical) ships Capacitor at scale specifically to keep their web UI library across web and mobile. Sworkit (fitness, millions of users) is another long-standing Capacitor shipper. Sources: https://ionic.io/resources/articles/burger-king-design-system · https://ionicframework.com/enterprise/resources/case-studies/sworkit

**Maps note**: Leaflet works inside Capacitor (lower RAM than NativeScript per community bench, ~240MB vs ~380MB) but on iOS has known touch quirks (double-click under iOS WebView). For our map↔list toggle and pan/zoom heaviness, Leaflet survives the wrap but `@capacitor/google-maps` (native SDK) will feel materially better. Sources: https://medium.com/@vicentedeluca_80072/leaflet-on-mobile-capacitor-vs-nativescript-bbaad4ee4ba6 · https://github.com/Leaflet/Leaflet/issues/7419 · https://ionic.io/blog/all-the-layers-of-capacitor-google-maps

#### Stack C verdict: **Adapt** — Capacitor is shippable for this app, but only if you (1) move Route Handlers off `/api/*` to a hosted backend or Supabase Edge Functions, (2) swap WebView OAuth for native social-login plugins, and (3) bolt Ionic's UI shell on top of Next so swipe-back/transitions/safe-area aren't bespoke; expect 4–6 weeks of mobile-UX polish on top of the wrap.

### Stack D: PWA upgrade

#### Reference candidates
- **Do Progressive Web Apps Work on iOS? The Complete Guide for 2026** — https://www.mobiloud.com/blog/progressive-web-apps-ios
  - Date / freshness: 2026
  - What it shows: end-to-end inventory of what iOS PWAs can and cannot do today, with explicit callouts for push, install, splash, and the EU DMA carve-out.
  - Quality signal: vendor blog, well-cited and dated 2026; one of the most current consolidated overviews.

- **PWA iOS Limitations and Safari Support [2026]** — https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
  - Date / freshness: 2026
  - What it shows: detailed list of iOS-PWA gaps vs Android, including the EU DMA standalone-PWA removal and "must be installed for push" behavior.
  - Quality signal: vendor doc with bias, but underlying facts match Apple/MDN behavior.

- **PWA Push Notifications on iOS in 2026: What Really Works** — https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en
  - Date / freshness: 2026
  - What it shows: field report on iOS 16.4 → 18 web push — subscriptions silently dropping after 1–2 weeks of inactivity, no data-only notifications, no background updates.
  - Quality signal: practitioner blog (anecdotal) but corroborated by Apple developer forum threads.
  - Why useful: directly answers the decision-critical question — iOS web push is not reliable enough to be the only channel.

- **Next.js Guides: Progressive Web Apps (official docs)** — https://nextjs.org/docs/app/guides/progressive-web-apps
  - Date / freshness: current (Next.js 16, 2026)
  - What it shows: first-party recipe for PWA on App Router: `app/manifest.ts`, service worker registration, Web Push with VAPID, install prompt patterns.
  - Quality signal: first-party Vercel docs.

- **How I Set Up a PWA in Next.js (App Router + TypeScript) with Serwist** — https://rajesh-biswas.medium.com/how-i-set-up-a-pwa-in-next-js-app-router-typescript-with-serwist-50f55e698ad5
  - Date / freshness: 2026-04
  - What it shows: working Serwist setup against Next.js 16, including the Turbopack-vs-Webpack gotcha (`next build --webpack` required).

#### Pattern references
- **m.uber — Uber's PWA for emerging markets** — https://www.uber.com/us/en/blog/m-uber/
  - What pattern: map-first PWA that "feels native" on iOS — 50kB core, full-screen, smooth transitions.
  - Why it's good: best-documented map+sheet PWA shipping at scale to iOS users; same concerns we have (geolocation, map, booking flow, low-end devices in SEA).

- **react-ios-pwa-prompt** — https://github.com/chrisdancee/react-ios-pwa-prompt
  - What pattern: native-styled "Add to Home Screen" coach-mark for iOS (Safari refuses to surface an automatic install prompt).
  - Why it's good: drop-in React component matching iOS visual language.

- **leaflet-example-pwa** — https://github.com/nickpeihl/leaflet-example-pwa
  - What pattern: Leaflet-based PWA with service worker offline tile caching.
  - Why it's good: same map library we already use; shows the precaching pattern that lets the app feel native offline.

- **The comprehensive guide to making your web app feel native** — https://www.gfor.rest/blog/making-pwas-feel-native
  - What pattern: status bar styling, safe-area insets, no-bounce scroll, splash, tap highlights — checklist-style.

- **6 Tips To Make Your iOS PWA Feel Like a Native App** — https://www.netguru.com/blog/pwa-ios
  - What pattern: iOS-specific polish — `apple-mobile-web-app-capable`, status bar, splash images, `viewport-fit=cover` for the notch.

#### Honest pros/cons summary for our restaurant-booking use case
- **iOS push reliability**: supported from iOS 16.4 but ONLY after install to Home Screen + permission grant; subscriptions silently drop after ~1–2 weeks of inactivity; no data-only/background updates; lower delivery rate than native APNs. Web push is best-effort — pair with email/SMS for confirmations and T-2h reminders. Sources: https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en · https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- **Install/A2HS friction on iOS**: no `beforeinstallprompt` on Safari — users must Share → Add to Home Screen manually. Need custom coach-marks (react-ios-pwa-prompt). iOS 26 defaults Home Screen entries to open as web apps. Sources: https://www.mobiloud.com/blog/progressive-web-apps-ios · https://github.com/chrisdancee/react-ios-pwa-prompt
- **Geolocation + map**: Standard Geolocation API works in iOS Safari + standalone PWAs; accuracy/battery comparable to web. Leaflet + CARTO continues unchanged. Source: https://www.mobiloud.com/blog/progressive-web-apps-ios
- **Supabase OAuth in PWA mode**: known issue — after A2HS, iOS standalone webview does NOT share Safari's auth session, users appear logged out post-install. Workaround: Supabase OTP (magic code, not magic link) or PKCE in-app so the redirect lands inside the standalone context. Sources: https://github.com/orgs/supabase/discussions/12227 · https://supabase.com/docs/guides/auth/social-login
- **Background sync / offline**: Background Sync API not supported in WebKit; offline POSTs must be queued in IndexedDB and replayed on next foreground. Service-worker precaching of shell + Leaflet tiles works fine. Sources: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- **Apple-vs-rest-of-world DMA**: since iOS 17.4 (Mar 2024), EU users get no standalone PWAs — Home Screen icons open in a Safari tab, no push, no install. As of May 2026 this has NOT been restored. Bangkok is unaffected (primary market) but EU travelers/expats get degraded UX. Sources: https://developer.apple.com/support/dma-and-apps-in-the-eu/ · https://medium.com/@hojny.adrian/the-end-of-pwa-era-in-eu-apple-dma-and-the-open-web-dilemma-807c089f14df
- **App-store discoverability**: PWA-only means zero presence in App Store / Play Store search. Restaurant discovery users tend to find via Google/web/social, but losing app-store organic + review surface is a real cost.
- **Reach in Bangkok / SEA**: Thailand Q1 2026 mobile OS share — Android ~67.7%, iOS ~32.1% nationally (iOS concentrated in Bangkok premium segment). PWA push works for ~all Android users + ~all non-EU iOS 16.4+ users; iOS push reach is bounded by the "install + grant" funnel, not raw OS share. Source: https://gs.statcounter.com/os-market-share/mobile/thailand

#### Stack D verdict: **Adopt** (as v1) — 100% code reuse, fits the discovery+map+bilingual stack natively; the only real wound is iOS web-push reliability, mitigated by an email/SMS fallback for booking confirmations and reminders.

## Cross-Stack Pattern Library
Patterns worth copying regardless of stack:
- **Yelp-style map + bottom sheet**: [gorhom/react-native-bottom-sheet — MapExample](https://github.com/gorhom/react-native-bottom-sheet/blob/master/example/src/screens/integrations/map/MapExample.tsx) — canonical map + draggable sheet + marker→sheet sync; the `pointerEvents: "box-none"` pattern translates to any stack.
- **Airbnb-style detail with parallax header + sticky CTA**: [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native) — `app/listing/[id].tsx` shows the exact "sticky Book button at bottom" layout we need for the restaurant detail screen.
- **Apple-Maps-style liquid-glass sheet (glassmorphism brand)**: [rit3zh/expo-apple-maps-sheet](https://github.com/rit3zh/expo-apple-maps-sheet) — matches our Arctic Ice / Ferie Black theme aesthetics.
- **Map with marker clustering on OSM tiles**: [ahmedgulabkhan/Foodspace](https://github.com/ahmedgulabkhan/Foodspace) (Flutter) + our existing Leaflet+CARTO implementation — both work without Google Maps SDK billing.
- **Shared Supabase backend across Next.js web + Expo mobile**: [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template) — i18n + light/dark themes wired in a monorepo; mirrors our exact relationship.
- **Bilingual rendering with non-Latin font**: [notofonts/myanmar (Noto Sans Myanmar)](https://github.com/notofonts/myanmar) — same TTF works for web (current), RN (`@expo-google-fonts/noto-sans-myanmar`), Flutter (asset bundle), and Capacitor (inherits from web CSS).
- **iOS Add-to-Home-Screen coach-mark**: [chrisdancee/react-ios-pwa-prompt](https://github.com/chrisdancee/react-ios-pwa-prompt) — required because Safari has no `beforeinstallprompt`; component is React-only but the pattern (banner + Share-icon mock + step illustration) carries to Capacitor and even native ad placements.
- **Supabase OAuth via native social-login (skip WebView PKCE)**: [Cap-go/capacitor-supabase + @capgo/capacitor-social-login](https://github.com/Cap-go/capacitor-supabase) + [supabase-community/flutter-auth-ui SupaSocialsAuth](https://github.com/supabase-community/flutter-auth-ui) — both stacks converge on the "use native plugin, hand the ID token to `signInWithIdToken`" pattern.

**Gaps we did not find good open references for** (worth knowing, since these are highest-value patterns we'll be building bespoke):
- **OpenTable-style time-slot chip picker** (18:00 · 18:30 · 19:00 … with available/full/disabled states + waitlist handoff). No OSS clone surfaced — design as bespoke component, source visual reference from OpenTable/Yelp Reservations directly.
- **Zomato-style horizontal menu category nav with sticky section headers**. No OSS surfaced — build from `SectionList` (RN) / `CustomScrollView` + `SliverPersistentHeader` (Flutter).
- **Foursquare-style nearby-radius widget** (slider that visually expands the map circle). No OSS surfaced — bespoke.
- **AI chat with inline restaurant cards** (Gemini-style: text bubbles interleaved with selectable restaurant cards). No OSS surfaced — bespoke.

## Anti-Patterns Spotted
- ❌ **Many RN/Flutter "restaurant" clones are actually delivery clones** (cart, driver, dispatch). Skip anything with "checkout", "rider", "courier" in the README — wrong flow entirely.
- ❌ **Older Airbnb-clone repos use Clerk + Expo SDK 49** (e.g. Galaxies-dev). Plan a Clerk→Supabase swap and SDK 49→54 upgrade as part of any fork — these are not 1-week tasks.
- ❌ **Capacitor + WebView PKCE for OAuth on iOS is fragile** (code_verifier loss in SFSafariViewController). Go native social-login from day one — don't try the WebView path first.
- ❌ **Wrapping Next.js App Router with `output: 'export'` silently drops Route Handlers** (`/api/*` won't ship). Plan an `/api/*` rehost (Supabase Edge Functions or external Node) BEFORE choosing Capacitor.
- ❌ **iOS web push as a sole reminder channel** — subscriptions decay after ~1–2 weeks of inactivity. Always pair PWA push with email/SMS for booking confirmations and T-2h reminders.
- ❌ **Flutter Noto/Myanmar shaping has known issues** ([flutter#118344](https://github.com/flutter/flutter/issues/118344)). Budget on-device QA time if Stack B; do not assume "Burmese works" from a desktop preview.
- ❌ **Pure `output: 'export'` Capacitor wrap without native nav features** likely fails Apple Guideline 4.2 ("Minimum Functionality"). Native push + native geolocation + native share are the minimum to clear review.
- ❌ **Leaflet on iOS WebView has a long-standing double-click quirk** ([Leaflet#7419](https://github.com/Leaflet/Leaflet/issues/7419)) — survives basic use but feels web-ish; consider native maps if iOS feel is critical.
- ❌ **GetX-heavy Flutter food apps** mix responsibilities — prefer Riverpod/Bloc patterns (Suffixdigital, YelpExplorer) for any code you actually keep.
- ❌ **JSMastery-style "react_native-restate" tutorial repos lack maps and booking** — great architecture reference (file layout, NativeWind, expo-router v4), poor feature reference. Don't conflate.

## Open Questions (for human decision)
1. **Two-track strategy or single-track commit?** Recommended path is PWA-first (2–3 weeks, validates mobile shape with zero fork cost) then RN+Expo as v2 once we know what the mobile users actually do. Alternative is to skip PWA and commit to RN+Expo now (8–10 weeks) for the app-store presence and reliable push from day one. Which?
2. **Map vendor on native mobile**: keep Leaflet's spirit by going `flutter_map`/MapLibre Native on RN+Expo (no Google billing, parity with web), or swap to `react-native-maps`/`google_maps_flutter`/`@capacitor/google-maps` for the more polished native feel? This affects budget (Google Maps SDK billing) and brand consistency.
3. **`/api/*` layer destination if Capacitor is chosen**: must move off the Next server because `output: 'export'` drops Route Handlers. Options: (a) Supabase Edge Functions, (b) standalone Node service on Vercel/Fly, (c) keep `/api/*` on a separate Next deployment and have the wrapped app call it as remote endpoints. Each has different ops cost.
4. **AI chat (`/api/chat`) on mobile**: proxy through the existing Next.js Route Handler (keeps Gemini key server-side) or call the Gemini SDK directly from mobile with a public/scoped API key? Affects security model and offline behavior.
5. **Apple Sign-In coverage**: Apple App Store Review Guideline 4.8 requires Sign in with Apple if you offer any third-party login (Google/Facebook) on iOS. Are we OK adding Apple OAuth to the Supabase flow specifically for the mobile build? (Web doesn't strictly need it.)
6. **Burmese QA budget**: Flutter has documented complex-script shaping issues; even RN/Capacitor will need real-device QA on Burmese line-breaks, line-height, and emoji-mixed runs. Who owns this and on what device matrix (iOS 18/19/26 + Android 14/15)?
7. **Vendor portal + admin CMS on mobile**: brief says "stay on web." Do vendors specifically need a mobile booking-management view (accept/reject/waitlist actions), or are they OK opening the web portal on mobile Safari? This is the most common mobile-product-extension request we'd hear in production.

## Sources

All sources are linked inline in the sections above. The principal repositories and references:

**Stack A**
- [Galaxies-dev/airbnb-clone-react-native](https://github.com/Galaxies-dev/airbnb-clone-react-native)
- [ZikaZaki/airbnb-mobile-app](https://github.com/ZikaZaki/airbnb-mobile-app)
- [adrianhajdin/react_native-restate](https://github.com/adrianhajdin/react_native-restate)
- [hypergalois/AirbnbClone](https://github.com/hypergalois/AirbnbClone)
- [gorhom/react-native-bottom-sheet — MapExample](https://github.com/gorhom/react-native-bottom-sheet/blob/master/example/src/screens/integrations/map/MapExample.tsx)
- [rit3zh/expo-apple-maps-sheet](https://github.com/rit3zh/expo-apple-maps-sheet)
- [rit3zh/expo-stack-bottom-sheet](https://github.com/rit3zh/expo-stack-bottom-sheet)
- [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)
- [obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes)
- [Expo blog — Apple Maps-style liquid-glass sheets](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)

**Stack B**
- [Suffixdigital/Zomato-Style-Food-Delivery-App](https://github.com/Suffixdigital/Zomato-Style-Food-Delivery-App)
- [matthieucoisne/YelpExplorer-Flutter](https://github.com/matthieucoisne/YelpExplorer-Flutter)
- [ahmedgulabkhan/Foodspace](https://github.com/ahmedgulabkhan/Foodspace)
- [atornel/RestaurantAppUIKit](https://github.com/atornel/RestaurantAppUIKit)
- [supabase-community/flutter-auth-ui](https://github.com/supabase-community/flutter-auth-ui) · [pub.dev/supabase_auth_ui](https://pub.dev/packages/supabase_auth_ui)
- [FatumaA/supa_auth_flutter](https://github.com/FatumaA/supa_auth_flutter)
- [supabase_flutter Auth Reference](https://supabase.com/docs/reference/dart/auth-signinwithidtoken)
- [flutter_map docs](https://docs.fleaflet.dev/) · [google_maps_flutter](https://pub.dev/packages/google_maps_flutter)
- [notofonts/myanmar (Noto Sans Myanmar)](https://github.com/notofonts/myanmar)
- [flutter/flutter issue #118344 — complex-script shaping](https://github.com/flutter/flutter/issues/118344)
- [Apple Sign-In with Flutter and Supabase (2026)](https://apparencekit.dev/blog/flutter-supabase-apple-sign-in/)

**Stack C**
- [mlynch/nextjs-tailwind-ionic-capacitor-starter](https://github.com/mlynch/nextjs-tailwind-ionic-capacitor-starter)
- [Capgo — Convert Next.js with Capacitor 8](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/)
- [Capgo — Build a Next.js Mobile App from Scratch with Capacitor 8](https://capgo.app/blog/nextjs-mobile-app-capacitor-from-scratch/)
- [Tharun Goud — Convert existing Next.js app with Capacitor](https://medium.com/@tharungoud_91948/to-convert-existing-next-js-web-app-into-mobile-app-using-capacitor-1466ac31e7c2)
- [Cap-go/capacitor-supabase](https://github.com/Cap-go/capacitor-supabase) · [Capgo — Supabase + Social Login](https://capgo.app/blog/setup-supabase-with-capacitor-social-login/)
- [Supabase docs — Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Venkat Podugu — Supabase PKCE OAuth in Capacitor iOS](https://medium.com/@vpodugu/supabase-pkce-oauth-in-capacitor-ios-why-your-code-verifier-disappears-and-how-to-fix-it-29a4747dce9e)
- [Supabase discussion #11548 — OAuth + Capacitor + Next.js](https://github.com/orgs/supabase/discussions/11548)
- [DEV.to — Capacitor push notifications (iOS, Android, Firebase)](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4)
- [Capacitor docs — Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [vercel/next.js#64660](https://github.com/vercel/next.js/discussions/64660) · [#55393](https://github.com/vercel/next.js/discussions/55393) · [#59437](https://github.com/vercel/next.js/discussions/59437)
- [Ionic safe-area + Capacitor issues #5635, #6642, #1366, #7648, #26058, #20904, #24273, #3137, #3487](https://github.com/ionic-team/capacitor)
- [Mobiloud — App Store Review Guidelines for WebView wrappers](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)
- [Ionic forum — 4.2 Minimum Functionality rejection thread](https://forum.ionicframework.com/t/app-store-rejection-4-2-design-minimum-functionality-my-first-after-2-years-of-ionic/200908)
- [Vicente De Luca — Leaflet on mobile: Capacitor vs NativeScript](https://medium.com/@vicentedeluca_80072/leaflet-on-mobile-capacitor-vs-nativescript-bbaad4ee4ba6)
- [Leaflet #7419 — iOS double-click](https://github.com/Leaflet/Leaflet/issues/7419)
- [Ionic blog — Capacitor Google Maps](https://ionic.io/blog/all-the-layers-of-capacitor-google-maps)
- [Burger King design system case study](https://ionic.io/resources/articles/burger-king-design-system)
- [Sworkit case study](https://ionicframework.com/enterprise/resources/case-studies/sworkit)

**Stack D**
- [Mobiloud — PWA iOS 2026 complete guide](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Magicbell — PWA iOS limitations & Safari support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Webscraft — PWA push on iOS in 2026: what really works](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en)
- [Next.js docs — Progressive Web Apps](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Rajesh Biswas — Serwist + Next.js 16 + TS PWA setup](https://rajesh-biswas.medium.com/how-i-set-up-a-pwa-in-next-js-app-router-typescript-with-serwist-50f55e698ad5)
- [Uber blog — Building m.uber](https://www.uber.com/us/en/blog/m-uber/)
- [chrisdancee/react-ios-pwa-prompt](https://github.com/chrisdancee/react-ios-pwa-prompt)
- [nickpeihl/leaflet-example-pwa](https://github.com/nickpeihl/leaflet-example-pwa)
- [gfor.rest — Making PWAs feel native](https://www.gfor.rest/blog/making-pwas-feel-native)
- [Netguru — 6 tips to make iOS PWA feel native](https://www.netguru.com/blog/pwa-ios)
- [Supabase discussion #12227 — OAuth in iOS standalone PWA](https://github.com/orgs/supabase/discussions/12227)
- [Apple — DMA and apps in the EU](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
- [The End of PWA Era in EU](https://medium.com/@hojny.adrian/the-end-of-pwa-era-in-eu-apple-dma-and-the-open-web-dilemma-807c089f14df)
- [Statcounter — Thailand mobile OS share](https://gs.statcounter.com/os-market-share/mobile/thailand)
