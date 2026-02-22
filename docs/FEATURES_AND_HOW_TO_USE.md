# Hmar Thar Sar — Features & How to Use

**Environment:** For full admin user management (list users, suspend, change roles), set `SUPABASE_SERVICE_ROLE_KEY` in your env (from Supabase Dashboard → Settings → API). Never expose this key to the client.

## Feature list

### For everyone (guests + signed-in)
- **Discover** — Browse active restaurants (homepage), filter by area/cuisine/price/deals.
- **Restaurant detail** — View info, opening hours, deals, menu, reviews; check availability; book a table.
- **Chat (“What to eat?”)** — Get restaurant recommendations (AI or keyword demo).
- **Bookings** — View upcoming and past bookings; cancel or reschedule (signed-in users).

### For signed-in customers
- **My Bookings** — See and manage your bookings.
- **Claim your restaurant** — Start the flow to become a vendor (see below).

### For vendors (after approval)
- **Vendor Dashboard** (`/vendor`) — Stats, links to your restaurants.
- **My Restaurants** (`/vendor/restaurants`) — List of restaurants you own.
- **Per-restaurant CMS** (`/vendor/restaurants/[id]`) — Info, Deals, Availability (slots), Bookings.
- **Claim another restaurant** — From vendor nav: “Claim Restaurant” (`/claim`).

### For admins
- **Admin Overview** (`/admin`) — Platform stats, quick links.
- **Vendor Verify** (`/admin/vendors`) — Approve or reject pending claims.
- **Users** (`/admin/users`) — List users; suspend/reactivate; change roles (superadmin).
- **Restaurants** (`/admin/restaurants`) — All restaurants; **Add restaurant**; change status.
- **All Bookings** (`/admin/bookings`) — Filter, export.
- **Reviews** (`/admin/reviews`) — Moderate; delete.

---

## One account: customer, vendor, and admin

One login can have **multiple roles**. The app decides what you see in this order:

1. **Admin** — If you have the `admin` role, you see “Admin Panel” and admin routes.
2. **Vendor** — If you have the `vendor` role (and not admin), you see “Vendor Dashboard” and vendor routes.
3. **Customer** — Otherwise you’re treated as a customer (bookings, claim, etc.).

So the same account can be:

- **Customer only** — Default after signup (customer role).
- **Customer + vendor** — After you claim and an admin approves; you keep customer abilities and gain vendor dashboard.
- **Customer + vendor + admin** — If an admin adds the admin role to your user; you then see “Admin Panel” and all admin features.

Role data lives in:

- `user_roles` — which roles this user has (customer, vendor, admin).
- `vendor_restaurants` + `vendor_profiles` — which restaurants the user owns / is linked to (and verification status).

---

## How to add restaurants and become a vendor

### 1. You have a customer account

- Sign up / sign in as usual. You’re a **customer**.
- In the nav, open your profile menu → **“Claim your restaurant”** (or go to `/claim`).

### 2. Claim an existing restaurant

- On **Claim your restaurant** (`/claim`):
  - Search by name (or slug).
  - Select a restaurant from the list.
  - Click **Submit claim**.
- This creates:
  - A row in `vendor_restaurants` (you ↔ restaurant) with `verified_at = null`.
  - Or updates `vendor_profiles` so this restaurant is in your `restaurant_ids`.
- You are **not** a vendor yet: you still don’t have the `vendor` role, so `/vendor` will redirect you until an admin approves.

### 3. If the restaurant doesn’t exist yet

- The app does **not** yet have an “Add new restaurant” form.
- Add the restaurant in **Supabase** (Table Editor → `restaurants`):
  - Fill required fields (e.g. name, description, area, address, lat, lng, cuisine_tags, price_tier, status, etc.).
  - Set `status = 'active'` when it’s ready to show on the site.
- Then in the app go to **Claim your restaurant**, search for it, select it, and **Submit claim** as above.

### 4. Admin approves the claim

- An **admin** signs in and goes to **Admin Panel** → **Vendor Verify** (`/admin/vendors`).
- Pending claims are listed (e.g. where `verified_at` is null).
- Admin clicks **Approve** for your claim.
- The approve action:
  - Sets `verified_at` on the vendor profile.
  - Adds the **vendor** role to your user in `user_roles`.
  - Sets the restaurant’s `status` to `'active'` if needed.
- After that, when you sign in you’ll see **“Vendor Dashboard”** in the menu and can use `/vendor` and all vendor pages.

### 5. Add more restaurants (as a vendor)

- With the vendor role, you can claim more restaurants:
  - Go to **Vendor Dashboard** → **Claim Restaurant** (`/claim`), or use the same link from the customer menu.
  - Search, select, **Submit claim**.
- Each new claim must again be **approved** in **Admin** → **Vendor Verify** before that restaurant appears in your vendor dashboard and is fully linked to you.

---

## Adding restaurants (admin)

Admins can create restaurants from the CMS:

1. Sign in as admin → **Admin Panel** → **Restaurants**.
2. Click **+ Add restaurant**.
3. Fill the form (name, area, address, cuisine tags, price tier, status, etc.). Use **Draft** to hide from the public until ready.
4. Click **Create restaurant**. The restaurant appears in the list; vendors can then **claim** it at `/claim`.

---

## Making someone an admin (for your team)

### Option A: Use the migration for admin@hmertharsar.com

1. Have the user **sign up** with **admin@hmertharsar.com** (or create the user in Supabase Auth → Authentication → Users).
2. In Supabase **SQL Editor**, run **`migrations/006_admin_user.sql`**. It grants the admin role and creates an `admin_profiles` row with `access_level = 'superadmin'` for that email.
3. That account can then sign in and see **Admin Panel**.

### Option B: Manual (any email)

Admins are managed in the database (no in-app “make admin” button yet):

1. In Supabase: **Table Editor** → `roles` → find the row where `slug = 'admin'` and copy its `id`.
2. **Table Editor** → `user_roles` → **Insert row**:
   - `user_id` = the auth user’s UUID (from Supabase Auth or `auth.users`).
   - `role_id` = the admin role id from step 1.
3. Ensure the user has a row in `admin_profiles` for `user_id` (optional; can add access_level/department later).

After that, that account will see **“Admin Panel”** and can use `/admin`, including **Vendor Verify** to approve claims and **Users** to manage roles (if superadmin).

---

## Quick reference

| I want to…                    | Do this… |
|------------------------------|----------|
| Browse and book as a guest   | Use Discover, open a restaurant, book (name + contact). |
| See my bookings              | Sign in → Bookings. |
| Become a vendor              | Sign in → Claim your restaurant → submit claim → wait for admin approval. |
| Add a new restaurant to the app | **Admin:** Restaurants → + Add restaurant. **Or** add in Supabase, then claim at `/claim`. |
| Manage my venues             | After approval: Vendor Dashboard → Restaurants → pick one → Info / Deals / Availability / Bookings. |
| Approve vendor claims        | Sign in as admin → Admin Panel → Vendor Verify → Approve. |
| Make someone an admin        | In Supabase: add `user_roles` row with admin `role_id` for their `user_id`. |
