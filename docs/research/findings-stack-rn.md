## Stack A: React Native + Expo

### Fork candidates
- No repo clears the §4.4 bar cleanly; the closest near-forks all fail on at least 2 hard requirements.
- **pricklyy/Booking-Restaurant-App-ReactNativeExpo** — 0★, updated 2024-04-17, no license — https://github.com/pricklyy/Booking-Restaurant-App-ReactNativeExpo
  - Has: restaurant detail, slot booking modal, Google OAuth via Clerk.
  - Rejected: no map/list toggle, no dark mode. Sources: https://raw.githubusercontent.com/pricklyy/Booking-Restaurant-App-ReactNativeExpo/main/src/screens/DetailScreen.jsx, https://raw.githubusercontent.com/pricklyy/Booking-Restaurant-App-ReactNativeExpo/main/src/components/BookingModal.jsx, https://raw.githubusercontent.com/pricklyy/Booking-Restaurant-App-ReactNativeExpo/main/src/screens/LoginScreen.jsx
- **Ishini-Edirisinghe/restaurant-app-react-native-expo** — 0★, updated 2025-01-16, no license — https://github.com/Ishini-Edirisinghe/restaurant-app-react-native-expo
  - Has: Expo Router shell, restaurant detail, login screen, theme scaffolding.
  - Rejected: no booking-slot UI, no map/list toggle. Sources: https://raw.githubusercontent.com/Ishini-Edirisinghe/restaurant-app-react-native-expo/main/README.md, https://raw.githubusercontent.com/Ishini-Edirisinghe/restaurant-app-react-native-expo/main/app/_layout.tsx, https://raw.githubusercontent.com/Ishini-Edirisinghe/restaurant-app-react-native-expo/main/app/restaurant.tsx, https://raw.githubusercontent.com/Ishini-Edirisinghe/restaurant-app-react-native-expo/main/app/login.tsx
- **msell/expo-router-supabase-auth** — 0★, updated 2025-02-26, no license — https://github.com/msell/expo-router-supabase-auth
  - Has: Expo Router + Supabase auth + i18n/theme bootstrap.
  - Rejected: no restaurant/listing domain screens. Sources: https://raw.githubusercontent.com/msell/expo-router-supabase-auth/main/README.md, https://raw.githubusercontent.com/msell/expo-router-supabase-auth/main/src/app/_layout.tsx, https://raw.githubusercontent.com/msell/expo-router-supabase-auth/main/src/app/sign-in.tsx

### Pattern references
- **Map + draggable bottom sheet** — `notJust-dev/DEVember/src/app/(days)/day5/airbnb.tsx`
  - MapView markers + Gorhom bottom sheet list; best Yelp-style map/list primitive. Source: https://raw.githubusercontent.com/notJust-dev/DEVember/main/src/app/(days)/day5/airbnb.tsx
- **Restaurant detail with gallery + address** — `cartond/yelp-clone-react-native/src/screens/RestaurantShowScreen.js`
  - Strong restaurant detail shape: photos, rating, categories, address lines. Source: https://raw.githubusercontent.com/cartond/yelp-clone-react-native/master/src/screens/RestaurantShowScreen.js
- **Search + price-bucket discovery** — `Rashigarg-gif/foodies-app/src/screens/SearchScreen.js`
  - Clean discovery list grouped by price tier for a Yelp-like home screen. Source: https://raw.githubusercontent.com/Rashigarg-gif/foodies-app/main/src/screens/SearchScreen.js
- **Booking slot picker modal** — `pricklyy/Booking-Restaurant-App-ReactNativeExpo/src/components/BookingModal.jsx`
  - Calendar date picker + horizontal time chips + note input; directly maps to reservations. Source: https://raw.githubusercontent.com/pricklyy/Booking-Restaurant-App-ReactNativeExpo/main/src/components/BookingModal.jsx
- **Bottom sheet list primitive** — `gorhom/react-native-bottom-sheet/website/docs/components/bottomsheetflatlist.md`
  - `BottomSheetFlatList` + snap points + navigation-aware scrolling. Source: https://raw.githubusercontent.com/gorhom/react-native-bottom-sheet/master/website/docs/components/bottomsheetflatlist.md

### Stack-specific intel
- Expo Router is mature enough for this app shape: file-based routes, typed/deep-linkable screens, protected routes, and auth-gated stacks. Sources: https://docs.expo.dev/router/introduction/ and https://docs.expo.dev/router/advanced/authentication/
- Supabase OAuth is ready for RN, but provider setup is non-trivial: Google supports native iOS/Android ID-token flows, Apple should prefer native on iOS/Expo, and Facebook requires `email` + `public_profile` plus the Supabase callback URL. Sources: https://supabase.com/docs/guides/auth/social-login/auth-google, https://supabase.com/docs/guides/auth/social-login/auth-apple, https://supabase.com/docs/guides/auth/social-login/auth-facebook
- `react-native-maps` is the safer Leaflet replacement for this project because it already covers markers, callouts, local tiles, and animated regions; MapLibre RN is the better choice only if we later need vector tiles / style control. Sources: https://github.com/react-native-maps/react-native-maps/blob/master/README.md, https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/README.md
- Gorhom’s bottom sheet is the better Yelp-style sheet: current v5, Expo-compatible, typed, with FlatList helpers and dynamic sizing; the older `reanimated-bottom-sheet` README literally says it is “not finished”. Sources: https://raw.githubusercontent.com/gorhom/react-native-bottom-sheet/master/README.md, https://raw.githubusercontent.com/gorhom/react-native-bottom-sheet/master/website/docs/components/bottomsheetflatlist.md, https://raw.githubusercontent.com/osdnk/react-native-reanimated-bottom-sheet/master/README.md
- `react-i18next` + Expo Font is viable for Burmese: hooks-based i18n is standard, Expo can load bundled/runtime fonts, and Noto Sans Myanmar is available with 400/700 cuts and Myanmar Unicode coverage. Sources: https://react.i18next.com/latest/using-with-hooks, https://docs.expo.dev/versions/latest/sdk/font/, https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;700&display=swap

### Verdict
**Adapt** — RN + Expo is the best lane for our React/TypeScript stack, but no single OSS repo covers restaurant detail + slot booking + map/list + OAuth + dark mode cleanly, so this should be built by composing patterns rather than cloning one app. Sources: https://docs.expo.dev/router/introduction/, https://supabase.com/docs/guides/auth/social-login/auth-google, https://raw.githubusercontent.com/gorhom/react-native-bottom-sheet/master/README.md, https://github.com/react-native-maps/react-native-maps/blob/master/README.md

Estimated time-to-MVP: 8–12 weeks.
