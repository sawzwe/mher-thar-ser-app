import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function SlotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);
  if (user.type !== "vendor") redirect(user.isAuthenticated() ? "/" : `/sign-in?next=/vendor/restaurants/${id}`);
  const vendor = user as VendorUser;
  const owns = typeof vendor.ownsRestaurant === "function" ? vendor.ownsRestaurant(id) : (vendor.restaurantIds ?? []).includes(id);
  if (!owns) redirect("/vendor");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", id)
    .single();

  if (!restaurant) redirect("/vendor");

  const today = new Date().toISOString().split("T")[0];
  const { data: slots } = await supabase
    .from("slots")
    .select("date, time, capacity, remaining")
    .eq("restaurant_id", id)
    .gte("date", today)
    .order("date")
    .order("time")
    .limit(50);

  return (
    <div className="p-8">
      <Link
        href={`/vendor/restaurants/${id}`}
        className="text-sm text-text-muted hover:text-text-primary mb-4 inline-block"
      >
        ← {restaurant.name}
      </Link>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Availability
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Set capacity by date and time. Use the SlotEditor component for weekly
        template.
      </p>
      {!slots?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          No slots generated. Use the generate API to create slots from a weekly
          template.
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Time
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Capacity
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 text-text-primary">{s.date}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.time}</td>
                  <td className="px-4 py-3 text-text-primary">{s.capacity}</td>
                  <td className="px-4 py-3 text-text-primary">{s.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
