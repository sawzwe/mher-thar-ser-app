# Hmar Thar Sar — Database Schema & Auth

This document defines the **database schema** and **auth strategy** for moving from local-only to a real backend: **signed-up users**, **guest users**, and **vendors** (restaurant owners).

---

## 1. Auth options (recommendation)

| Option | Pros | Cons |
|--------|------|------|
| **NextAuth.js** | Free, self-hosted, many providers (Google, credentials, magic link). Fits Next.js. Full control. | You build session/DB wiring and credential storage. |
| **Supabase Auth** | Built-in DB (Postgres), Auth + RLS, realtime. One stack for auth + DB. | Vendor lock-in; need Supabase for backend. |
| **Clerk** | Fastest to ship: hosted UI, users, orgs. Good for “vendors” as orgs. | Paid at scale; less control over data. |

**Recommendation for Hmar Thar Sar**

- **NextAuth.js** if you want to own the stack and keep auth + DB flexible (e.g. Postgres elsewhere).
- **Supabase (Auth + Postgres)** if you want one provider for both auth and database and are fine with Supabase.

Below schema is **provider-agnostic** (works with either). Auth “users” are stored in an `users` table; NextAuth or Supabase can write to it or we mirror by `user_id`.

---

## 2. User model: guest vs signed-up

- **Guest**
  - No account. Can browse, use chat, and **book with name + contact only**.
  - Bookings are stored with `user_id = NULL` and `customer_name` / `contact` on the booking.
  - Optional: store a **guest token** in a cookie/localStorage to show “their” bookings on a simple /bookings page without signup.

- **Signed-up user (customer)**
  - Has account (email/password or OAuth). `user_id` is set on bookings.
  - Can see full booking history, save preferences, write reviews (linked to identity).

- **Vendor**
  - Same identity system as “user” but with **role = vendor**. One user can be both customer and vendor (e.g. own a restaurant and also book elsewhere).
  - Vendors **manage** their own restaurants (CRUD restaurant, deals, slots, view bookings/waitlist for their venues).

---

## 3. Database schema

Assume **PostgreSQL** (or compatible). All `id` fields are **UUID** unless noted. Timestamps in **UTC**.

### 3.1 Core identity & auth

```sql
-- Auth users (from NextAuth / Supabase or your own)
-- NextAuth uses its own tables; if you use Supabase or custom, this is the canonical user.
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMPTZ,
  password_hash     TEXT,                    -- null if OAuth-only
  name              TEXT,
  image_url         TEXT,
  role              TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  locale            TEXT DEFAULT 'en',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

- **Guests**: no row in `users`; bookings reference `user_id = NULL`.
- **Vendors**: `users.role = 'vendor'`. Link to owned restaurants via `vendor_restaurants`.

---

### 3.2 Vendors & restaurants

```sql
-- Vendors own one or more restaurants (minaplunate = manage)
CREATE TABLE vendor_restaurants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role_at_venue  TEXT NOT NULL DEFAULT 'owner' CHECK (role_at_venue IN ('owner', 'manager', 'staff')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id)  -- one restaurant has one “owner” record; can add manager later
);

CREATE INDEX idx_vendor_restaurants_user ON vendor_restaurants(user_id);
CREATE INDEX idx_vendor_restaurants_restaurant ON vendor_restaurants(restaurant_id);
```

```sql
-- Restaurants (full schema; replaces seed/local data)
CREATE TABLE restaurants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE,              -- e.g. la-piazza-silom (for URLs)
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  area            TEXT NOT NULL,
  address         TEXT NOT NULL,
  lat             NUMERIC(10, 7) NOT NULL,
  lng             NUMERIC(10, 7) NOT NULL,
  cuisine_tags    TEXT[] NOT NULL DEFAULT '{}',
  price_tier      SMALLINT NOT NULL CHECK (price_tier BETWEEN 1 AND 4),
  image_url       TEXT,
  open_time       TIME,
  close_time      TIME,
  opening_hours   JSONB NOT NULL DEFAULT '[]',  -- [{ "day": "Monday", "intervals": [{ "open": "11:00", "close": "22:00" }], "closed": false }]
  transit_nearby  JSONB NOT NULL DEFAULT '[]', -- [{ "name": "Chong Nonsi", "type": "BTS", "walkingMinutes": 4 }]
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_area ON restaurants(area);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_cuisine ON restaurants USING GIN(cuisine_tags);
```

```sql
-- Deals (per restaurant, vendor-managed)
CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('discount', 'set_menu', 'buffet', 'free_item', 'combo')),
  description     TEXT NOT NULL,
  price           INTEGER,
  discount        INTEGER,
  conditions      TEXT,
  valid_from      DATE,
  valid_until      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_restaurant ON deals(restaurant_id);
```

```sql
-- Menu (vendor-managed)
CREATE TABLE menu_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);
```

---

### 3.3 Slots & capacity (vendor-configurable later)

```sql
-- Slots: availability per restaurant/date/time (vendor or system generated)
CREATE TABLE slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  capacity         INTEGER NOT NULL CHECK (capacity >= 0),
  remaining        INTEGER NOT NULL CHECK (remaining >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, date, time)
);

CREATE INDEX idx_slots_restaurant_date ON slots(restaurant_id, date);
```

---

### 3.4 Bookings (guests + signed-up users)

```sql
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref     TEXT NOT NULL UNIQUE,      -- e.g. TD-9F3K2
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = guest
  deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  party_size      SMALLINT NOT NULL CHECK (party_size > 0),
  customer_name   TEXT NOT NULL,
  contact         TEXT NOT NULL,             -- email or phone
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rescheduled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_restaurant ON bookings(restaurant_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date_status ON bookings(date, status);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
```

- **Guest**: `user_id = NULL`, `customer_name` and `contact` required.
- **Signed-up user**: `user_id` set; can still override display name/contact if you allow.

---

### 3.5 Waitlist

```sql
CREATE TABLE waitlist_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  party_size      SMALLINT NOT NULL CHECK (party_size > 0),
  name            TEXT NOT NULL,
  contact         TEXT NOT NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  notified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, date, time, contact)  -- one waitlist signup per slot per contact
);

CREATE INDEX idx_waitlist_restaurant_date ON waitlist_entries(restaurant_id, date);
CREATE INDEX idx_waitlist_notified ON waitlist_entries(notified_at) WHERE notified_at IS NULL;
```

---

### 3.6 Reviews (only for users with a completed booking)

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- may be null if booking was guest and we allow review by ref
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

- **Policy**: Allow review only if there is a **completed** (or past) booking for that restaurant for this user/guest (e.g. match by `booking_id` or `user_id` + restaurant).

---

## 4. Auth flows (summary)

| Actor    | How they “sign in”        | How we identify them |
|----------|---------------------------|------------------------|
| Guest    | No signup; just book      | `user_id = NULL` + booking_ref / guest token |
| Customer | Sign up (email/password or OAuth) | `users.id` + session |
| Vendor   | Same signup; role = vendor | `users.role = 'vendor'` + `vendor_restaurants` |

- **Sign up**: Register in `users` (NextAuth adapter or Supabase). Default `role = 'customer'`.
- **Vendor onboarding**: Admin or self-serve “Claim restaurant” → insert `vendor_restaurants` and set `users.role = 'vendor'` (or keep role and only check `vendor_restaurants`).
- **Guest booking**: Create booking with `user_id = NULL`; optionally set a **guest token** in cookie so /bookings can show “your” bookings by `booking_ref` or a temporary guest_id.

---

## 5. Implementation order (suggested)

1. **DB**: Create Postgres (or Supabase) and run the schema above (users, restaurants, deals, menu, slots, bookings, waitlist, reviews, vendor_restaurants).
2. **Auth**: Add NextAuth (or Supabase Auth) — credentials + one OAuth (e.g. Google). No UI for “Sign in” yet except link.
3. **Guest booking**: Keep current flow; when saving booking, pass `user_id = session?.user?.id ?? null`.
4. **My Bookings**: For guests, optional “View with ref” or guest token. For logged-in users, filter by `user_id`.
5. **Vendor dashboard**: Protected routes for `role = 'vendor'`; list restaurants by `vendor_restaurants`; CRUD restaurant, deals, menu, slots; view bookings/waitlist for their restaurants.

If you tell me your choice (NextAuth vs Supabase), I can add concrete steps and code pointers (e.g. NextAuth adapter schema or Supabase RLS) next.
