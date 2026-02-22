import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function VendorDashboard() {
  const supabase = await createClient();
  const user = (await UserFactory.fromSupabase(supabase)) as VendorUser;
  const today = new Date().toISOString().split("T")[0];

  const [restaurantsRes, todayBookingsRes, pendingRes] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, status, slug")
      .in("id", user.restaurantIds),
    user.restaurantIds.length > 0
      ? supabase
          .from("bookings")
          .select("id, status, party_size, restaurant_id, date, time")
          .in("restaurant_id", user.restaurantIds)
          .eq("date", today)
          .eq("status", "confirmed")
      : { data: [] },
    user.restaurantIds.length > 0
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("restaurant_id", user.restaurantIds)
          .eq("status", "confirmed")
      : { count: 0 },
  ]);

  const restaurants = restaurantsRes.data ?? [];
  const todayBookings = todayBookingsRes.data ?? [];
  const pendingCount = pendingRes.count ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Good morning, {user.name} 👋
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Here's what's happening with your restaurants today.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Today&apos;s Bookings
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {todayBookings.length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Active Restaurants
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {restaurants.filter((r) => r.status === "active").length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Pending Confirmed
          </div>
          <div className="text-2xl font-bold text-text-primary">{pendingCount}</div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-text-primary mb-4">Your Restaurants</h2>
        {restaurants.length === 0 ? (
          <p className="text-text-muted text-sm">
            No restaurants yet.{" "}
            <a
              href="/claim"
              className="text-brand-light hover:underline font-medium"
            >
              Claim your restaurant
            </a>
          </p>
        ) : (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <a
                key={r.id}
                href={`/vendor/restaurants/${r.id}`}
                className="block bg-card border border-border rounded-[var(--radius-md)] p-4 hover:border-border-strong transition-colors"
              >
                <div className="font-medium text-text-primary">{r.name}</div>
                <div className="text-xs text-text-muted mt-1">
                  {r.slug} ·{" "}
                  <span
                    className={
                      r.status === "active" ? "text-success" : "text-warning"
                    }
                  >
                    {r.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
