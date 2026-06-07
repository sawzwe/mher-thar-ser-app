# Research Brief: Mobile Clone Candidates for Mher Thar Ser

> **How to use this brief**
>
> 1. Open a fresh Claude / OpenCode / Cursor session in this repo.
> 2. Paste this entire file as the prompt (or say: "Execute the research defined in `docs/RESEARCH_MOBILE_CLONES.md`").
> 3. Claude will use its `librarian`, `explore`, `webfetch`, and GitHub-search tools to do the work.
> 4. Findings are written to `docs/research/MOBILE_CLONES_FINDINGS.md` so you can re-run / compare.
> 5. For a fast first pass, optionally run `scripts/research-mobile-clones.sh` first — it dumps raw GitHub repo lists so Claude can skip the discovery phase.

---

## 1. Mission

We are converting **Mher Thar Ser** (an existing Next.js 16 web app for Bangkok restaurant discovery + booking) into a **mobile app**. Before writing code, find:

- **Forkable starting points** — open-source mobile apps that ship 60%+ of our features and can be cloned + customized.
- **Pattern references** — high-quality screens / flows / components we should copy even if the rest of the repo is unusable.
- **Stack tradeoffs** — concrete data on React Native + Expo vs Flutter vs Capacitor wrap vs PWA for our specific feature set.

**Bias**: depth over breadth. Five well-analyzed repos beat fifty links.

---

## 2. Project Context (DO NOT skip — this drives every search)

### 2.1 Domain
A **Bangkok-focused restaurant discovery + reservation platform**, specifically for **Myanmar / Burmese restaurants**. Bilingual **English + မြန်မာ (Burmese)**. Two themes (Arctic Ice light / Ferie Black dark).

Closest analogues, ranked:
1. **OpenTable** — slot-based reservations
2. **Yelp** — discovery + reviews + map-first browse
3. **Zomato** — restaurant + menu + deals + reviews
4. **Foursquare (Swarm-lite)** — location/geolocation discovery
5. **NOT**: Grab / Uber Eats / DoorDash (no delivery / driver / dispatch features).

### 2.2 Consumer Feature Surface (the mobile target)

| Area | What it does |
|---|---|
| **Discovery** | Home with map ↔ list toggle, geolocation, radius filter, search, cuisine/area filters, "has deals" filter |
| **Restaurant detail** | Hero image, opening hours, transit (BTS/MRT/ARL), map, copy address, "Open in Google Maps", menu, deals, reviews |
| **Booking** | Slot-based table booking (date / time / party size), optional deal attached, waitlist when full |
| **Reviews** | Star rating + comment, gated by completed booking |
| **Auth** | Email/password + Google / Apple / Facebook OAuth (Supabase) |
| **AI chat** | "What should I eat?" Gemini-powered recommender with restaurant suggestions |
| **Account** | My bookings, my waitlist entries, profile, language toggle, theme toggle |
| **i18n** | EN + Burmese on every string; Burmese gets Noto Sans Myanmar at `line-height 1.9` |

**Out of mobile scope (stay on web)**: Vendor portal (`/vendor/*`), Admin CMS (`/admin/*`), SEO editor, slot generation tools, XLSX import, Swagger docs.

### 2.3 Current Tech Stack (mobile must talk to this)

- **Backend**: Supabase (Postgres + Auth + Storage + service-role admin). API exposed via Next.js Route Handlers at `/api/*` — mobile app will call these directly.
- **Frontend (web)**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack React Query.
- **Maps**: Leaflet + `leaflet-gesture-handling` + CARTO tiles. Google Maps used only as an outbound link.
- **AI**: Gemini API (server-side proxy at `/api/chat`).
- **Icons**: Phosphor.
- **Fonts**: Pogonia (Latin), Noto Sans Myanmar (Burmese).

### 2.4 Data Model (so you know what entities the mobile app must render)

`restaurants · cuisine_types · address_provinces/districts/subdistricts · slots · bookings · waitlist_entries · reviews · deals · menu_categories · menu_items · customer_profiles · vendor_profiles · roles/permissions`.

Full schema in `docs/SCHEMA_AND_AUTH.md`.

### 2.5 Design System (so you know what visual aesthetic to look for)

- Brand red `#E0052D`, gold `#D4A853` for ratings/price tiers.
- Glassmorphism nav + bottom sheets, rounded `--radius-lg 16px` cards, `--radius-2xl 28px` bottom sheets.
- Spacing on 4px grid. Mobile top bar 56px, safe-area-bottom respected.
- Light "Arctic Ice" + Dark "Ferie Black" themes, toggled via `data-theme` attribute.

Full system in `DESIGN.md` and `AGENT.md`.

---

## 3. Research Targets

Find candidates in **all four** mobile stacks so we can compare apples-to-apples.

### 3.1 Stack A — React Native + Expo *(most natural fit; shares React/TS/Zustand/React Query)*

**Must find at least:**
- 2 production-grade **restaurant booking / discovery** apps (Yelp / OpenTable / Zomato-style).
- 2 generic **map-first directory** apps with bottom sheets (good for Discovery screen patterns).
- 1 **Supabase-RN auth template** that handles email + Google + Apple + Facebook OAuth.
- 1 **i18n example** that handles non-Latin scripts (Burmese, Thai, Arabic, Tamil — any will teach the pattern).

**Keywords**: `restaurant booking react native`, `expo restaurant app`, `yelp clone react native`, `opentable clone expo`, `react native maps restaurant`, `expo bottom sheet map`, `react native supabase auth`.

### 3.2 Stack B — Flutter *(separate Dart stack; often higher-quality OSS clones in food/restaurant space)*

**Must find at least:**
- 2 production-grade restaurant booking / discovery apps.
- 1 food-app UI kit with reservation flow.
- 1 Supabase-Flutter auth template.

**Keywords**: `flutter restaurant app`, `flutter food delivery clone`, `flutter zomato clone`, `flutter opentable`, `flutter restaurant booking`, `flutter supabase auth`.

### 3.3 Stack C — Capacitor / Ionic wrap *(fastest path; wraps the existing Next.js)*

**Must find at least:**
- 1 reference for wrapping a Next.js App Router project with Capacitor.
- 1 reference / playbook on what mobile UX feels broken when wrapping vs going native (deep linking, push, keyboard handling, swipe-back, safe area).
- 1 production app that successfully ships as Capacitor-wrapped web (for credibility check).

**Keywords**: `capacitor nextjs`, `next.js capacitor app router`, `ionic capacitor restaurant`, `capacitor push notification supabase`.

### 3.4 Stack D — PWA upgrade *(cheapest; no app store)*

**Must find:**
- A current (2024–2026) reference on PWA viability on **iOS Safari** specifically: push notifications, install prompt, splash, status bar, file picker.
- 1 example of a map-first PWA that "feels" native on iOS.
- Honest pros/cons summary for our restaurant-booking use case (push for booking reminders matters a lot here).

**Keywords**: `pwa ios push notification 2024`, `nextjs pwa offline`, `pwa map app ios safari`, `pwa restaurant booking`.

---

## 4. Search Strategy (use in this order)

For each stack, run this loop. Parallelize aggressively — fire 3-5 `librarian` agents at once.

### 4.1 GitHub discovery (use `gh` CLI or `grep_app_searchGitHub` or web search)

```bash
# Examples — adapt per stack
gh search repos "restaurant booking" --language=typescript --sort=stars --limit 20
gh search repos "yelp clone" --language=dart --sort=stars --limit 20
gh search repos "expo restaurant" --sort=stars --limit 20
gh search repos "flutter food booking" --sort=stars --limit 20
```

Drop anything with:
- < 200 stars **unless** it's a recent, well-maintained Supabase example (templates are usually low-star).
- Last commit > 18 months ago.
- No README screenshots (mobile UX is visual — no screenshots = skip).
- License missing or non-permissive (we want MIT / Apache / BSD).

### 4.2 Web search for production / case studies

Look for blog posts, dev.to articles, Medium posts, talks, conference videos from 2024-2026 with phrases like:
- "We built our [Yelp/OpenTable/Zomato] clone in React Native"
- "Migrating Next.js to React Native"
- "Capacitor in production: lessons from [year]"

These give honest tradeoff data that READMEs hide.

### 4.3 Component / pattern references

Even if no full clone fits, find best-in-class implementations of these specific screens:
- **Map-with-bottom-sheet** (Yelp-style: drag sheet up reveals list)
- **Restaurant detail with sticky CTA** ("Book a table" pinned bottom)
- **Time-slot picker** (chip grid: 18:00 · 18:30 · 19:00 …, with disabled / full / available states)
- **Cuisine + filter bottom sheet** (multi-select chips, range slider for price tier)
- **Review composer with rating stars** (1-5, half-star optional)
- **Bilingual / RTL-aware text rendering** (line-height swap, font swap, label alignment)
- **AI chat with recommended-cards inline** (Gemini-style: message bubbles + cards)

### 4.4 Hard requirements check per candidate

For every shortlisted repo, verify ALL of:
- [ ] Has restaurant/listing detail page (not just a feed).
- [ ] Has bookings or appointment-slot UI (not just "favorite" / "save").
- [ ] Has map with markers AND list view toggle.
- [ ] Has working auth flow with at least one OAuth provider.
- [ ] Has dark mode.
- [ ] Architecture is recognizable / not a tutorial-only toy.

---

## 5. Output Format

Create the file `docs/research/MOBILE_CLONES_FINDINGS.md` with this exact structure. Be terse — bullet points, not prose.

```markdown
# Mobile Clone Findings — <ISO date>

## TL;DR (≤ 5 bullets)
- Recommended stack: <RN+Expo | Flutter | Capacitor | PWA> because <one sentence>.
- Top fork candidate: <repo URL> — <one sentence why>.
- Top runner-up: <repo URL> — <one sentence why>.
- Biggest risk: <one sentence>.
- Estimated effort to MVP: <weeks>.

## Stack Comparison Table
| Criterion | RN + Expo | Flutter | Capacitor wrap | PWA |
|---|---|---|---|---|
| Reuse of existing TS/React code | … | … | … | … |
| Maps quality (Leaflet/MapLibre/Google) | … | … | … | … |
| Supabase auth + OAuth maturity | … | … | … | … |
| Burmese font + i18n maturity | … | … | … | … |
| Push notifications (iOS) | … | … | … | … |
| OSS clone availability for our domain | … | … | … | … |
| Time-to-MVP (rough weeks) | … | … | … | … |
| Verdict for Mher Thar Ser | … | … | … | … |

## Per-Stack Findings

### Stack A: React Native + Expo

#### Fork candidates
For each (max 5):
- **<Repo name>** — <github URL>
  - Stars / last commit / license
  - What it does: <one line>
  - Feature overlap with us: <list — discovery / booking / map / reviews / auth / i18n / themes>
  - What's missing: <list>
  - Code quality signal: <e.g. "TS strict, hooks-based, good folder layout" or "JS, class components, monolithic">
  - Estimated effort to adapt: <S / M / L>
  - Why fork-worthy: <one line>

#### Pattern references
For each (max 5):
- **<Pattern name>** — `<repo>/path/to/file.tsx`
  - What pattern: <e.g. "Map + draggable bottom sheet with snap points">
  - Why it's good: <one line>

#### Verdict for this stack: <Adopt | Adapt | Avoid> — <reason>

### Stack B: Flutter
<same structure>

### Stack C: Capacitor wrap
<same structure>

### Stack D: PWA upgrade
<same structure>

## Cross-Stack Pattern Library
Patterns worth copying regardless of stack:
- **Yelp-style map + bottom sheet**: <best example> — <one-line description>
- **OpenTable slot picker**: <best example> — <one-line description>
- **Zomato menu category nav**: <best example> — <one-line description>
- **Foursquare nearby radius widget**: <best example> — <one-line description>
- **Restaurant detail sticky CTA**: <best example> — <one-line description>
- **Bilingual rendering (non-Latin)**: <best example> — <one-line description>

## Anti-Patterns Spotted
Document things to AVOID:
- <e.g. "Many RN restaurant clones use Redux + class components — skip those, they predate hooks era.">
- <e.g. "Flutter food apps often hardcode payment SDKs we don't need — extract just the screens.">

## Open Questions (for human decision)
- <e.g. "Do we want to keep Leaflet on mobile, or switch to MapLibre GL Native / Mapbox / Google?">
- <e.g. "Do we ship vendor portal on mobile or stay web-only?">
- <e.g. "Do we proxy /api/chat through Next.js or add a mobile-direct Gemini SDK?">

## Sources
Every claim links to a source: GitHub URL, blog post, docs page, video timestamp.
```

---

## 6. Search Stop Conditions

Stop researching a stack when ANY of:
- You've shortlisted 5 candidates that pass §4.4 hard requirements.
- 3 consecutive searches return only repos already on your list.
- You've burned more than ~30 minutes on the stack with < 2 candidates → flag it as "weak ecosystem for this domain".

Stop the whole research when all four stacks have a verdict.

---

## 7. Hard NO List (do not waste cycles)

- ❌ Generic "to-do list" or "boilerplate" repos. We need restaurant/listing/booking domain.
- ❌ Food **delivery** apps (Uber Eats clones). Different flow — driver, courier, cart, checkout — not what we need.
- ❌ E-commerce / marketplace clones (Etsy, Amazon clones). Wrong primitives.
- ❌ Dating apps. Profile-card swiping is the wrong UX.
- ❌ Repos older than 2 years with no recent commits.
- ❌ Repos without any screenshots — mobile UX is visual.
- ❌ Tutorial repos that are 1-screen demos.
- ❌ Anything Vue / Angular / Svelte mobile (Quasar, NativeScript-Vue). Off-stack for us.

---

## 8. Tools to Use (Claude / OpenCode)

Use these in parallel — never sequential:

- `librarian` background agents — for GitHub repos + official docs.
- `webfetch` — to read README + specific source files of candidates.
- `grep_app_searchGitHub` — to find specific code patterns across all of GitHub.
- `webfetch` again — for blog posts / case studies / dev.to / Medium.
- `mcp_Context7_query-docs` — for current React Native / Expo / Flutter / Capacitor official guidance.

For each candidate repo you shortlist, do at minimum:
1. `webfetch` the README.
2. `webfetch` 1-2 key source files (the main screen file, the navigation root, an auth file).
3. Note license, last-commit date, stars, open-issue count.

---

## 9. Out-of-Scope (do NOT do)

- Do not write any mobile code.
- Do not propose a final architecture — that's the next phase.
- Do not opine on backend changes (Supabase stays).
- Do not research vendor / admin mobile experience — those stay web.
- Do not benchmark performance numbers — qualitative is fine for this phase.

---

## 10. Acceptance Criteria for This Research

This research is **done** when `docs/research/MOBILE_CLONES_FINDINGS.md` exists AND:

- [ ] All four stacks have a verdict (`Adopt | Adapt | Avoid`).
- [ ] At least one fork candidate per stack OR a documented "no viable candidate" with reasoning.
- [ ] Stack comparison table is filled in (no blank cells).
- [ ] Cross-stack pattern library has at least 4 entries.
- [ ] At least 3 open questions surfaced for the human to decide.
- [ ] Every claim has a source URL.
- [ ] TL;DR fits in 5 bullets and is decision-grade.

If any box is unchecked, the research isn't done — keep going.
