# Stack C: Capacitor wrap

### Fork/reference candidates
- **Casa Angus Beef Bar** — https://github.com/Ben102/casa-angus-app
  - Public restaurant app repo; stack pins Next.js 16.2.0 + React 19.2.4 + Capacitor 8.2.x, and the Capacitor shell points `webDir` at `out`. This is the closest real Next 16 + Capacitor wrap I found. Sources: https://github.com/Ben102/casa-angus-app/blob/5a7417a085f8a5c8ec065384a94f81b86169e160/package.json#L5-L17 and https://github.com/Ben102/casa-angus-app/blob/5a7417a085f8a5c8ec065384a94f81b86169e160/package.json#L36-L42 and https://github.com/Ben102/casa-angus-app/blob/5a7417a085f8a5c8ec065384a94f81b86169e160/capacitor.config.ts#L3-L14.
- **capacitor-nextjs-tailwind-starter** — https://raw.githubusercontent.com/byunghyun/capacitor-nextjs-tailwind-starter/main/README.md
  - Clean shell reference for Next.js 16 App Router + static export + Capacitor 8 + `out/` output. Good for wrapping mechanics, not a production app.

### Known pain points & workarounds
- **Server-only Next features** — blocker if they stay in the mobile bundle. Next static export supports Server Components at build time, but unsupported features include dynamic routes without `generateStaticParams()`, Request-dependent route handlers, cookies, rewrites, redirects, headers, proxy, ISR, draft mode, server actions, and intercepting routes. Sources: https://nextjs.org/docs/app/guides/static-exports.
- **App Router dynamic params** — blocker unless every path is statically enumerated. A current Next issue shows `output: export` + App Router dynamic params/useParams still causes hard failures; Capacitor is explicitly mentioned in the thread. Source: https://github.com/vercel/next.js/issues/54393.
- **`/api/chat` and any POST route handler** — blocker in a pure wrap. Static export only emits static GET route handlers, so server-side proxy endpoints do not survive unchanged. Source: https://nextjs.org/docs/app/guides/static-exports.
- **OAuth callbacks (Supabase Google/Apple/Facebook)** — workaround, not blocker. Use Capacitor Browser for the sign-in page, then catch the return with App `appUrlOpen`; Supabase explicitly documents mobile deep-linking URIs like `com.supabase://login-callback/`. Sources: https://capacitorjs.com/docs/apis/browser, https://capacitorjs.com/docs/apis/app, https://capacitorjs.com/docs/guides/deep-links, https://supabase.com/docs/guides/auth/native-mobile-deep-linking, https://supabase.com/docs/guides/auth/redirect-urls.
- **Leaflet map UX** — workable, but still a web map. `leaflet-gesture-handling` is designed to prevent one-finger drag / scroll-wheel traps and is the right mitigation inside a WebView. Source: https://raw.githubusercontent.com/elmarquis/Leaflet.GestureHandling/master/README.md.
- **Keyboard + safe area polish** — workaround. Capacitor has a Keyboard plugin with iOS resize modes and an Android `resizeOnFullScreen` workaround; safe-area spacing is plain CSS via `env(safe-area-inset-bottom)`. Sources: https://capacitorjs.com/docs/apis/keyboard and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env.
- **Status bar / splash polish** — fine, but platform limits remain. Capacitor has first-party plugins for both; Status Bar config options lose some effect on Android 15+ / 16+ edge-to-edge behavior. Sources: https://capacitorjs.com/docs/apis/status-bar and https://capacitorjs.com/docs/apis/splash-screen.
- **Burmese fonts (Noto Sans Myanmar)** — fine. No Capacitor-specific blocker found; Capacitor is meant to drop into any modern web app, so bundled web fonts behave like normal web assets inside the WebView. Source: https://capacitorjs.com/docs/getting-started.
- **Swipe-back / history feel** — workaround. Capacitor gives Android back-button handling via App, but iOS swipe-back is mainly router/WebView behavior; I found an iOS/Next.js navigation failure on the `capacitor://` scheme that had to be patched at the router layer. Sources: https://capacitorjs.com/docs/apis/app and https://github.com/ionic-team/capacitor/issues/3664.

### Plugin coverage matrix for our features
| Feature | Plugin status | Core/community | Fit |
|---|---|---:|---|
| Geolocation | `@capacitor/geolocation` | core | good |
| Push notifications | `@capacitor/push-notifications` | core | good (APNs + FCM, with platform setup) |
| Camera | `@capacitor/camera` | core | good |
| Browser for OAuth | `@capacitor/browser` | core | good |
| App / deep links | `@capacitor/app` | core | good |
| Status Bar | `@capacitor/status-bar` | core | good |
| Splash Screen | `@capacitor/splash-screen` | core | good |
| Network | `@capacitor/network` | core | good |
| Keyboard | `@capacitor/keyboard` | core | good |
| Safe area | none | n/a | CSS `env()` + layout work |

Sources: https://capacitorjs.com/docs/apis/geolocation, https://capacitorjs.com/docs/apis/push-notifications, https://capacitorjs.com/docs/apis/camera, https://capacitorjs.com/docs/apis/browser, https://capacitorjs.com/docs/apis/app, https://capacitorjs.com/docs/apis/status-bar, https://capacitorjs.com/docs/apis/splash-screen, https://capacitorjs.com/docs/apis/network, https://capacitorjs.com/docs/apis/keyboard, https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env.

### Production credibility check
- Best real-world signal: `Ben102/casa-angus-app` is a public restaurant app repo that already combines Next.js 16 + Capacitor 8 and uses `out/` as the native web bundle. That is the exact thin-shell pattern we want, even though it is not an app-store review trail. Sources: https://github.com/Ben102/casa-angus-app/blob/5a7417a085f8a5c8ec065384a94f81b86169e160/package.json#L5-L17 and https://github.com/Ben102/casa-angus-app/blob/5a7417a085f8a5c8ec065384a94f81b86169e160/capacitor.config.ts#L3-L14.
- Secondary signal: the starter above shows that App Router + static export + Capacitor 8 is a documented pattern, but it is still only a starter. Source: https://raw.githubusercontent.com/byunghyun/capacitor-nextjs-tailwind-starter/main/README.md.
- I did not find a large, review-rich public restaurant/discovery app with obvious Next.js + Capacitor proof. Ecosystem is thin, so confidence is decent but not high.

### Verdict (Adopt | Adapt | Avoid) with reasoning
- **Adapt** — this is the fastest path if we accept a static-export mobile shell and keep server-only Next features out of the mobile bundle. Capacitor can reuse most of the current React/TS UI and the native plugin surface covers the gaps we care about.
- Hard requirement check for *our* app: the wrap works only if restaurant detail, bookings, map/list toggle, auth, dark mode, and i18n are all client-rendered or build-time static; anything that depends on `/api/chat`, middleware, dynamic App Router params, or server actions is a blocker under `output: export`. Sources: https://nextjs.org/docs/app/guides/static-exports and https://github.com/vercel/next.js/issues/54393.
- **Estimated time-to-MVP:** 2–4 weeks.
