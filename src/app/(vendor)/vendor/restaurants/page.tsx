import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function VendorRestaurantsPage() {
  const supabase = await createClient();
  const user = (await UserFactory.fromSupabase(supabase)) as VendorUser;

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, slug, status, area")
    .in("id", user.restaurantIds)
    .order("name");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        My Restaurants
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Manage your restaurant listings, deals, slots, and bookings.
      </p>

      {!restaurants?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-text-muted mb-4">No restaurants yet.</p>
            <Link
              href="/claim"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-brand text-white font-medium hover:bg-brand-hover transition-colors"
          >
            Claim your restaurant
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">
                  Area
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-text-muted uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-card transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.area}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "active"
                          ? "bg-success-dim text-success"
                          : r.status === "draft"
                            ? "bg-warning-dim text-warning"
                            : "bg-[rgba(255,255,255,0.05)] text-text-muted"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vendor/restaurants/${r.id}`}
                      className="text-sm font-medium text-brand-light hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
