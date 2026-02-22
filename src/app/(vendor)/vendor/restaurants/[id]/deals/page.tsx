import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function DealsPage({
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

  const [{ data: restaurant }, { data: deals }] = await Promise.all([
    supabase.from("restaurants").select("name").eq("id", id).single(),
    supabase
      .from("deals")
      .select("id, title, type, description, price, status")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!restaurant) redirect("/vendor");

  return (
    <div className="p-8">
      <Link
        href={`/vendor/restaurants/${id}`}
        className="text-sm text-text-muted hover:text-text-primary mb-4 inline-block"
      >
        ← {restaurant.name}
      </Link>
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Deals
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Create and manage deals for this restaurant.
      </p>
      {!deals?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          No deals yet. Add your first deal via the API or DealForm component.
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Title
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {d.title}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{d.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        d.status === "active"
                          ? "bg-success-dim text-success"
                          : "bg-[rgba(255,255,255,0.05)] text-text-muted"
                      }`}
                    >
                      {d.status}
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
