## Stack B: Flutter

### Fork candidates
- **Paprika — https://github.com/alihaidar0/paprika-flutter**
  - Stars / last commit / license: 0 stars, updated 2026-03-16, no license detected. Sources: https://github.com/alihaidar0/paprika-flutter, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md
  - What it does: production-grade customer app for discover · reserve · order · track · experience, with discovery, restaurant/map views, table reservations, Google/Facebook OAuth, RTL EN/Arabic, and restaurant detail tabs. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/app.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurants_list_screen.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurant_screen.dart
  - Feature overlap with us: discovery, restaurant detail, map, booking, reviews, auth, i18n/themes. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/app.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurants_list_screen.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurant_screen.dart
  - What's missing: confirmed dark mode in the root app shell, Supabase backend, Burmese strings/fonts, and a Flutter 3-era codebase. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/app.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md
  - Code quality signal: feature-first layered structure, generated REST client, separate module/package split, and clear routing/theme/locale entrypoint. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/app.dart
  - Estimated effort to adapt: M
  - Why fork-worthy: closest Flutter OSS match to the domain; the missing pieces are mostly backend/auth/theming swaps, not screen invention. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/app.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurants_list_screen.dart, https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurant_screen.dart

### Pattern references
- **Map + draggable filter sheet** — `Paprika/lib/src/screens/restaurants_list_screen.dart`
  - What pattern: list-first discovery with a map action and `DraggableScrollableSheet`-based filter UI.
  - Why it's good: directly matches the Yelp-style browse/filter interaction we need. Source: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurants_list_screen.dart, https://api.flutter.dev/flutter/widgets/DraggableScrollableSheet-class.html
- **Restaurant detail with sticky CTA** — `Paprika/lib/src/screens/restaurant_screen.dart`
  - What pattern: hero header + tabs + sticky bottom action that switches between reserve / pickup / delivery.
  - Why it's good: the bottom CTA is the right shape for our "Book a table" flow. Source: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/lib/src/screens/restaurant_screen.dart
- **Map-first discovery with markers** — `TheDiningAtlas/lib/screens/map/map_search_screen.dart`
  - What pattern: `flutter_map` canvas with markers, location fallback, and category filters over a map screen.
  - Why it's good: closest open-source analog to our Leaflet-style map browse screen. Source: https://raw.githubusercontent.com/Xart3mis/TheDiningAtlas/main/lib/screens/map/map_search_screen.dart
- **Time-slot + table configuration UI** — `Restaurant-Reservation-App/lib/features/restaurants/presentation/pages/vendor_restaurant_form_page_new.dart`
  - What pattern: reusable `TimeSlotPicker` and table config form for reservation setup.
  - Why it's good: clean reference for slot-grid / availability editing patterns, even though it's vendor-side. Source: https://raw.githubusercontent.com/Mo-Alsagheer/Restaurant-Reservation-App/main/lib/features/restaurants/presentation/pages/vendor_restaurant_form_page_new.dart
- **Theme toggle pattern** — `NyamNyam/lib/providers/theme_provider.dart`
  - What pattern: persisted `ThemeMode` provider with light/dark/system switching.
  - Why it's good: small, readable theme-state pattern we can reuse mentally for our Arctic Ice / Ferie Black split. Source: https://raw.githubusercontent.com/RivaldoPardede/nyamnyam/main/lib/providers/theme_provider.dart, https://raw.githubusercontent.com/RivaldoPardede/nyamnyam/main/README.md

### Stack-specific intel
- **Supabase-Flutter OAuth maturity is good enough for production**: `supabase_flutter` v2 exposes `signInWithOAuth`, `signInWithIdToken`, PKCE/deep-link handling, and provider-specific guidance for Google, Apple, and Facebook. Sources: https://supabase.com/docs/reference/dart/auth-signinwithoauth, https://supabase.com/docs/guides/auth/social-login/auth-google, https://supabase.com/docs/guides/auth/social-login/auth-apple, https://supabase.com/docs/guides/auth/social-login/auth-facebook, https://supabase.com/docs/reference/dart/auth-signinwithoauth
- **Google OAuth is the most mature of the three**: Flutter can do native Google sign-in on Android/iOS with ID tokens, and web/desktop with OAuth + deep links; Supabase documents current Flutter-native and OAuth flows. Sources: https://supabase.com/docs/guides/auth/social-login/auth-google, https://supabase.com/docs/reference/dart/auth-signinwithoauth
- **Apple OAuth is also production-ready, but requires more ops discipline**: Flutter supports native iOS/macOS sign-in with `signInWithIdToken`, while non-native platforms use OAuth; Apple secret keys need 6-month rotation. Sources: https://supabase.com/docs/guides/auth/social-login/auth-apple, https://supabase.com/docs/reference/dart/auth-signinwithoauth
- **Facebook OAuth is supported, but the app-review burden is real**: Supabase requires Facebook app setup, `public_profile` + `email`, and the callback URI; Flutter can use `signInWithOAuth` or a native SDK + `signInWithIdToken`. Sources: https://supabase.com/docs/guides/auth/social-login/auth-facebook, https://supabase.com/docs/reference/dart/auth-signinwithoauth
- **`flutter_map` is the better Leaflet replacement**: it is vendor-free, fully cross-platform, and 100% pure Flutter; `google_maps_flutter` is the Google Maps plugin and needs API keys + platform setup. For our Leaflet/CARTO-like discovery map, `flutter_map` is the closer fit. Sources: https://pub.dev/packages/flutter_map, https://pub.dev/packages/google_maps_flutter
- **Burmese i18n is fine in Flutter**: Flutter docs cover internationalization and custom fonts; the practical approach is ARB/intl for strings plus a bundled Burmese font (Noto Sans Myanmar) via the app font config. Sources: https://docs.flutter.dev/ui/internationalization, https://docs.flutter.dev/cookbook/design/fonts
- **Material 3 should be the base theme**: Flutter's Material theming is the right default for our brand palette, cards, bottom sheets, and toggles; Cupertino is best left for a few platform-native controls, not the whole design system. Sources: https://docs.flutter.dev/ui/design/material, https://docs.flutter.dev/ui/widgets/cupertino
- **`DraggableScrollableSheet` beats `solid_bottom_sheet` for this app**: the framework widget is maintained, integrates with a scroll controller, and supports snap sizes; `solid_bottom_sheet` is a package with older docs and less current ecosystem weight. Sources: https://api.flutter.dev/flutter/widgets/DraggableScrollableSheet-class.html, https://pub.dev/packages/solid_bottom_sheet

### Verdict
**Adapt** — Flutter has the right UI primitives for our map + sheet + slot-picker UX, and Paprika is the closest OSS starting point, but there is no perfect Flutter clone that already matches our exact Supabase-backed, Burmese-first, dark-mode customer app. We should adapt the Paprika-style screen structure and pattern refs rather than expect a drop-in fork. Sources: https://raw.githubusercontent.com/alihaidar0/paprika-flutter/main/README.md, https://pub.dev/packages/flutter_map, https://supabase.com/docs/reference/dart/auth-signinwithoauth

**Estimated time-to-MVP:** 8-10 weeks
