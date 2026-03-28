# Mher Thar Ser — Design System

Restaurant discovery & booking · Bangkok · EN + မြန်မာ (Burmese)

---

## Brand

| Token | Value | Use |
|-------|-------|-----|
| `--brand` | `#E0052D` | Primary CTA, active states, all accents |
| `--brand-hover` | `#C00528` | Button hover |
| `--brand-light` | `#FF1A45` | Brand text on dark surfaces |
| `--brand-dim` | `rgba(224,5,45,0.10)` | Ghost button fills, soft highlights |
| `--brand-border` | `rgba(224,5,45,0.30)` | Ghost button borders |
| `--gold` | `#D4A853` | Star ratings, price tiers only |

Semantic colours (theme-independent):

| Token | Hex | Use |
|-------|-----|-----|
| `--success` | `#3DAA6E` | Open, confirmed |
| `--warning` | `#E09B2D` | Alerts, caution |
| `--danger` | `#E84040` | Error, closed, delete |
| `--info` | `#4A9FD4` | Informational |

Each semantic token has `-dim` (alpha background) and `-border` (alpha border) variants.

---

## Themes

Two themes on `data-theme="light|dark"` attribute on `<html>`.

### Light — Arctic Ice

| Token | Value |
|-------|-------|
| `--bg` | `#F5FBFF` |
| `--surface` | `#FFFFFF` |
| `--card` | `#EEF8FF` |
| `--card-hover` | `#E4F4FF` |
| `--card-active` | `#DAEfFD` |
| `--text-primary` | `#0A0A08` |
| `--text-secondary` | `#3A3933` |
| `--text-muted` | `#5C5B54` |
| `--text-disabled` | `#8A8982` |
| `--text-inverse` | `#FFFFFF` |
| `--border` | `rgba(0,0,0,0.08)` |
| `--border-strong` | `rgba(0,0,0,0.14)` |

### Dark — Ferie Black

| Token | Value |
|-------|-------|
| `--bg` | `#1A1A1A` |
| `--surface` | `#222222` |
| `--card` | `#242424` |
| `--card-hover` | `#2A2A2A` |
| `--card-active` | `#2E2E2E` |
| `--text-primary` | `#F5F4EF` |
| `--text-secondary` | `#A09F97` |
| `--text-muted` | `#5C5B54` |
| `--text-disabled` | `#3A3933` |
| `--text-inverse` | `#1A1A1A` |
| `--border` | `rgba(255,255,255,0.07)` |
| `--border-strong` | `rgba(255,255,255,0.12)` |

**Rule:** always use CSS variables, never hardcode colour values.

---

## Typography

| Font | CSS variable | Weights | Purpose |
|------|-------------|---------|---------|
| **Pogonia** | `--font-sans` | 100–900 (9 weights) | All Latin/English text (primary font) |
| **Noto Sans Myanmar** | `--font-my` | 400–700 | All Burmese (မြန်မာ) text |

Body defaults: `font-size: 15px; line-height: 1.6`.  
Burmese text always gets `line-height: 1.9; letter-spacing: 0.01em` via the `.my` CSS class.

### Type scale

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Hero H1 | `clamp(42px, 7vw, 72px)` | 900 | `-2px` |
| Hero H2 | `clamp(32px, 5.5vw, 48px)` | 700 | `-1px` |
| Page heading | `20–24px` | 700 | `-0.5px` |
| Card title | `15px` | 600–700 | `-0.2px` |
| Body | `15px` | 400 | `0` |
| Meta / caption | `12–13px` | 400–600 | `0` |
| Badge / label | `11px` | 600–700 | `+0.02em` |
| Burmese body | `15px` | 400 | `+0.01em` |

---

## Spacing

Base unit: **4px**. Use consistent multiples only: `4 8 12 16 20 24 32 40 48 64 80`.

| Context | Value |
|---------|-------|
| Inline gap (icon + label) | `6–8px` |
| Component inner padding | `16px` |
| Card padding | `20px` (`px-5 py-5`) |
| Section gap | `24–32px` |
| Page horizontal — mobile | `16px` |
| Page horizontal — desktop | `24–32px` |
| Mobile top bar height | `56px` |
| Desktop nav height | `64px` |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | `6px` | Tags, small chips, icon buttons |
| `--radius-md` | `10px` | Inputs, buttons, small cards |
| `--radius-lg` | `16px` | Cards, panels, modals |
| `--radius-xl` | `20px` | Large surfaces |
| `--radius-2xl` | `28px` | Bottom sheets, hero blocks |
| `--radius-full` | `9999px` | Pills, avatars, badge chips |

---

## Shadows

| Token | Use |
|-------|-----|
| `--shadow-sm` | Micro-interactions, subtle lift |
| `--shadow-md` | Cards at rest |
| `--shadow-lg` | Cards on hover, dropdowns |
| `--shadow-xl` | Modals, overlays |
| `--shadow-brand` | Brand CTA button hover |

---

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--dur-fast` | `150ms` | Colour, opacity, border changes |
| `--dur-base` | `220ms` | Card lift, standard transitions |
| `--dur-slow` | `350ms` | Page-level enter animations |
| `--ease-out` | `cubic-bezier(0.25,0.46,0.45,0.94)` | Standard easing |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Bouncy entrances |

Pre-defined keyframes in `globals.css`: `fadeIn · fadeUp · slideUp · slideDown · overlayShow · pulse · spin · shimmer · blink · adminPageEnter`

Utility classes: `.animate-fade-in · .animate-slide-up · .animate-slide-down · .animate-overlay · .animate-spin`

---

## Z-Index Layers

| Token | Value | What lives here |
|-------|-------|-----------------|
| `--z-base` | `0` | Normal flow |
| `--z-raised` | `10` | Floating chips, sticky headers |
| `--z-overlay` | `100` | Dropdowns, tooltips |
| `--z-modal` | `200` | Modals, drawers |
| `--z-toast` | `300` | Notification toasts |
| `--z-nav` | `400` | Top navigation bar |

---

## Logo

| Asset | File | Placement |
|-------|------|-----------|
| **Vertical wordmark** | `logo_mascot_text_vertical.png` | Shown with horizontal on desktop/laptop nav & footers (`LOGO_VERTICAL_SRC`) |
| **Horizontal wordmark** | `logo_mascot_text_horizontal.png` | Shown with vertical on desktop/laptop; mobile top bar only (`LOGO_HORIZONTAL_SRC`) |
| Circle | `logo_mascot_circle.png` | Optional icon-only / favicon (`LOGO_CIRCLE_SRC`) |
| Other marks | `logo_mascot_text_horizontal.png`, `logo_macot.png`, `logo_text.png` | Available if needed for marketing |

**Rules:**
- Never place a logo PNG on a coloured background container — the assets have correct transparent backgrounds.
- Never clip with `overflow: hidden` or add a border ring around the logo.
- Import from `@/components/Logo`: `LOGO_VERTICAL_SRC` or `LOGO_SRC` (same vertical asset).

---

## UI Component Reference

### Button
Variants: `primary · secondary · ghost · brandGhost · danger`  
Sizes: `xs · sm · md · lg · xl · icon · icon-sm · icon-lg`  
Props: `loading` (spinner + blocked click)

```tsx
<Button variant="primary" size="md">Book Now</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" size="sm" loading>Deleting…</Button>
```

### Card
```tsx
<Card interactive>
  <CardHeader>Title area</CardHeader>
  <CardContent>Body content</CardContent>
  <CardFooter>Actions row</CardFooter>
</Card>
```
`interactive` → hover lift (`-translate-y-0.5`) + shadow.

### Input / Select / Textarea
```tsx
<Input label="Name" labelMy="နာမည်" hint="Full name" error="Required" />
<Select label="Cuisine"><option>Thai</option></Select>
<Textarea label="Notes" rows={4} />
```
All: height `h-11`, `bg-card`, `border-border-strong`, brand focus ring.

### Badge + BadgeDot
Variants: `default · brand · brandSoft · success · warning · danger · info · gold · bts · mrt · arl`

```tsx
<Badge variant="success"><BadgeDot /> Open</Badge>
<Badge variant="brandSoft">3 Deals</Badge>
<Badge variant="gold">★ 4.8</Badge>
```

---

## Common Interaction Patterns

```tsx
// Card hover lift
"hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] active:translate-y-0 active:shadow-[var(--shadow-sm)]"

// Keyboard focus ring
"focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"

// Glassmorphism panel (nav, bottom sheets)
// In CSS:
background: color-mix(in srgb, var(--bg) 85%, transparent);
backdrop-filter: blur(16px);
border-bottom: 1px solid var(--border);
```

---

## Layout

```
Desktop nav    — fixed, top: 16px, height 64px, rounded-2xl, z-nav (400)
Mobile topbar  — fixed, top: 0, height 56px, z-nav (400), hidden on desktop
Main content   — pt-20 to clear nav
Footer         — border-t, py-6, logo + copyright
```

Mobile breakpoint: `max-width: 768px`.  
Always add `env(safe-area-inset-bottom)` to anything touching the bottom of the screen on mobile.

---

## Bilingual

- Every user-visible string needs English **and** Burmese.
- Use `t(lang, "key")` from `@/lib/i18n/translations`.
- Add new keys to both `en.json` and `my.json` in `src/lib/i18n/`.
- Apply `.my` class or `font-my` Tailwind alias to any Burmese string to get correct font and line-height.
- Inputs expose `labelMy` prop for the Burmese sub-label.
