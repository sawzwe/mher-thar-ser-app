# Mher Thar Ser — Agent Guide

This file tells AI agents how to navigate and contribute to this codebase. Read `design.md` alongside this for visual/design decisions.

---

## Project Overview

**What it is:** Next.js 16 (App Router) restaurant discovery & booking app for Bangkok.  
**Stack:** Next.js · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) · Zustand · Leaflet maps · Phosphor Icons.  
**Languages:** English + Burmese (မြန်မာ) — both must always be supported.  
**Themes:** Light (Arctic Ice) + Dark (Ferie Black) — both must always work.

---

## Repository Layout

```
src/
├── app/                    Next.js App Router pages
│   ├── (admin)/admin/      Admin CMS (restaurant CRUD, users, reviews, bookings)
│   ├── (vendor)/vendor/    Vendor portal (manage own restaurant)
│   ├── api/                Route handlers (REST API)
│   ├── layout.tsx          Root layout — fonts, AppShell, theme init
│   ├── globals.css         All design tokens + global CSS classes
│   └── page.tsx            Home page
├── components/
│   ├── ui/                 Primitive components (Button, Card, Input, Badge, …)
│   ├── admin/              Admin-specific layout components
│   ├── vendor/             Vendor-specific layout components
│   ├── mobile/             Mobile-only components (MobileTopBar, MobileBottomSheet, …)
│   ├── Logo/               Logo component + asset path constants
│   └── AppShell.tsx        Main shell: desktop nav, mobile topbar wrapper, footer
├── stores/                 Zustand stores (auth, restaurants, language, theme, booking, …)
├── lib/
│   ├── i18n/               translations.ts + en.json + my.json
│   ├── auth/               Auth guard, Supabase auth, user classes
│   ├── supabase/           client.ts · server.ts · admin.ts
│   ├── restaurants/        transform.ts (DB row → Restaurant type), url.ts
│   ├── image/              upload, resize, serverUpload
│   ├── map/                distance, tiles, cuisine helpers
│   └── utils.ts            cn() and other tiny helpers
├── types/
│   └── index.ts            Core types: Restaurant, Deal, MenuItem, Booking, etc.
public/
├── assets/logo/            Logo PNGs (circle, horizontal, vertical, mascot, text)
├── fonts/
│   ├── walone/             Walone Thin/Regular/Bold .ttf
│   └── pogonia-modern-font/ Pogonia (Demo license — not for production)
migrations/                 SQL migration files for Supabase
```

---

## Shells & Routing

| Route pattern | Shell used | Notes |
|---------------|-----------|-------|
| `/` · `/restaurants` · `/restaurant/[id]` · `/bookings` · `/chat` | `AppShell` | Public consumer pages |
| `/sign-in` · `/auth/*` · `/claim` | `AppShell` | Auth pages |
| `/admin/**` | `AdminShell` | Admin only — auth-guarded |
| `/vendor/**` | `VendorShell` | Vendor only — auth-guarded |
| `isCms` flag in AppShell | Skips nav/footer | Admin + Vendor layouts render their own shells |

---

## State Management

All state is in Zustand stores in `src/stores/`:

| Store | What it holds |
|-------|--------------|
| `restaurantStore` | All restaurants (loaded once on mount) |
| `authStore` | Current user, session, sign-in/out |
| `languageStore` | Active lang (`"en" | "my"`), persisted to localStorage |
| `themeStore` | Active theme (`"light" | "dark"`), persisted to localStorage |
| `bookingStore` | Booking flow state, pending offer |
| `reviewStore` | All reviews |
| `mobileHomeViewStore` | Map vs list toggle on mobile home |
| `waitlistStore` | Waitlist entries |

Stores are accessed with selector functions: `useAuthStore((s) => s.user)`.

---

## Data Flow

```
Supabase DB
  → API Route Handlers (src/app/api/)
    → transform.ts (DB row → Restaurant type)
      → restaurantStore (Zustand)
        → Components
```

- Public restaurant data is fetched server-side and cached (`revalidate: 60`).
- Booking / review mutations go through API routes, not direct Supabase calls from the client.
- Admin / Vendor routes use `apiGuard()` which checks the user's role from Supabase.

---

## Key Conventions

### TypeScript
- Prefer explicit types over `any`. Use types from `src/types/index.ts`.
- API route bodies: validate manually or with a simple check — no schema library is used.
- Use `async/await`, not `.then()` chains.

### React / Next.js
- Add `"use client"` to any component that uses hooks, events, or browser APIs.
- Server components only for pages that fetch data and have no interactivity.
- One component per file unless it is a small, closely related helper.
- Prefer `next/image` with explicit `width`/`height` for all images.
- Prefer `next/link` for navigation.

### Styling
- **Tailwind utility classes first.** Add a class to `globals.css` only when:
  - The same pattern appears in ≥3 places, OR
  - It needs complex pseudo-selectors / child combinators, OR
  - It is a layout wrapper with multiple responsive overrides.
- Use `cn()` from `@/lib/utils` for conditional classNames.
- Use `cva` (class-variance-authority) for variant-based primitive components.
- Always use CSS variables for colours/spacing — never hardcode hex values.

```tsx
// ✅
<div className={cn("bg-card border border-border rounded-[var(--radius-lg)]", isActive && "border-brand")} />

// ❌
<div style={{ background: "#242424", borderRadius: 16 }} />
```

### CSS class naming
- `kebab-case`, prefixed by feature area: `topbar-*`, `hero-*`, `list-*`, `admin-*`, `lc-*` (list-card).

### Icons
- Library: `@phosphor-icons/react`. Default weight `regular`. Use `fill` for active/selected states.
- Sizes: `14` inline text · `16` badge · `18` nav · `20` action · `24` prominent.

---

## Bilingual Rules

Every user-visible string must have both an English and Burmese version.

1. Add the key + English value to `src/lib/i18n/en.json`.
2. Add the same key + Burmese translation to `src/lib/i18n/my.json`.
3. Use `t(lang, "key")` in components; never hardcode English-only strings.
4. Apply `.my` CSS class or `font-my` Tailwind alias to Burmese text nodes.
5. Use `labelMy` prop on `<Input>`, `<Select>`, `<Textarea>` for bilingual form labels.

```tsx
const lang = useLanguageStore((s) => s.lang);
<span>{t(lang, "discover")}</span>
<span className="my">{burmeseString}</span>
```

---

## Theming Rules

- Theme is set by `data-theme="light|dark"` on `<html>` (initialized from localStorage in a blocking inline script in `layout.tsx` to prevent flash).
- Never hardcode a colour that maps to a design token — use `var(--token-name)` or its Tailwind alias.
- When building a new component, toggle both themes and check contrast before considering it done.

---

## Logo Rules

- Always use `LOGO_SRC` (circle) or `LOGO_HORIZONTAL_SRC` (horizontal) from `@/components/Logo`.
- **Never** place the PNG inside a container that has a background colour.
- **Never** clip the logo with `overflow: hidden` or add a border ring around it.
- Desktop nav → circle icon (`size={30}`). Mobile top bar → horizontal wordmark (`height: 36px, width: auto`).

---

## UI Primitives — use these, don't reinvent

| Need | Component | Import path |
|------|-----------|-------------|
| Button | `<Button variant size loading>` | `@/components/ui/button` |
| Card layout | `<Card> <CardHeader> <CardContent> <CardFooter>` | `@/components/ui/card` |
| Text input | `<Input label labelMy error hint>` | `@/components/ui/input` |
| Select | `<Select label labelMy>` | `@/components/ui/input` |
| Textarea | `<Textarea label labelMy error hint>` | `@/components/ui/input` |
| Status pill | `<Badge variant> + <BadgeDot>` | `@/components/ui/badge` |
| Tabs | `<Tabs>` | `@/components/ui/tabs` |
| Modal | `<Modal>` | `@/components/ui/modal` |
| Star rating | `<Rating>` | `@/components/ui/rating` |

---

## Adding a New Page

1. Create the file in `src/app/<route>/page.tsx`.
2. If it is a consumer-facing page, it is automatically wrapped by `AppShell` via `layout.tsx`.
3. If it needs admin auth: place it under `src/app/(admin)/` and use `apiGuard()` in any API routes it calls.
4. Fetch data server-side where possible; keep client state in Zustand or local `useState`.
5. Add bilingual strings to both `en.json` and `my.json`.
6. Test mobile (375px), dark mode, and Burmese language.

---

## Adding a New UI Component

1. Check `src/components/ui/` first — avoid duplicating existing primitives.
2. Place it in `src/components/<ComponentName>/index.tsx` or directly in `src/components/` if it is a single file.
3. Add `"use client"` only if needed.
4. Style with Tailwind + CSS tokens only.
5. If Burmese text is involved, use `.my` / `font-my` and add translations.
6. Run `npm run build` — it must pass before committing.

---

## Development Checklist (before every commit)

- [ ] Token-first: new colours/spacing added to `:root` in `globals.css`, not inline.
- [ ] No hardcoded hex values that duplicate a design token.
- [ ] Both EN and MY strings present for any new user-visible text.
- [ ] Tested at 375px (mobile) and 1280px (desktop).
- [ ] Tested in light mode and dark mode.
- [ ] Tested with language set to မြန်မာ.
- [ ] `npm run build` passes with no errors.

---

## What NOT to do

- Do not import a colour from a constant — use CSS variables.
- Do not use `any` types without a comment explaining why.
- Do not hardcode English strings — always use `t(lang, "key")`.
- Do not add background colours or borders to logo containers.
- Do not use Pogonia font in production (Demo license only).
- Do not call Supabase directly from a client component — go through an API route.
- Do not skip the bilingual or dark mode checks before committing.
