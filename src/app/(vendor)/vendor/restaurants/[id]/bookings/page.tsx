import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);
  if (user.type !== "vendor")
    redirect(
      user.isAuthenticated() ? "/" : `/sign-in?next=/vendor/restaurants/${id}`,
    );
  const vendor = user as VendorUser;
  const owns =
    typeof vendor.ownsRestaurant === "function"
      ? vendor.ownsRestaurant(id)
      : (vendor.restaurantIds ?? []).includes(id);
  if (!owns) redirect("/vendor");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", id)
    .single();

  if (!restaurant) redirect("/vendor");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_ref, customer_name, contact, date, time, party_size, status",
    )
    .eq("restaurant_id", id)
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <Link
        href={`/vendor/restaurants/${id}`}
        className="text-sm text-text-muted hover:text-text-primary mb-4 inline-block"
      >
        ← {restaurant.name}
      </Link>
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Bookings
      </h1>
      <p className="text-sm text-text-muted mb-8">
        View and manage bookings for this restaurant.
      </p>
      {!bookings?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          No bookings yet.
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Ref
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Guest
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Date / Time
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Party
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 font-mono text-sm text-brand-light">
                    {b.booking_ref}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">
                      {b.customer_name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {b.contact ? `****${String(b.contact).slice(-4)}` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {b.date} {b.time}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {b.party_size}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === "confirmed"
                          ? "bg-success-dim text-success"
                          : b.status === "completed"
                            ? "bg-info-dim text-info"
                            : b.status === "cancelled"
                              ? "bg-danger-dim text-danger"
                              : "bg-[rgba(255,255,255,0.05)] text-text-muted"
                      }`}
                    >
                      {b.status}
                    </span>
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
