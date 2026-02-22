import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import Link from "next/link";

export default async function AdminRestaurantsPage() {
  const supabase = await createClient();
  await UserFactory.fromSupabase(supabase);

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, status")
    .order("name");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
            Restaurants
          </h1>
          <p className="text-sm text-text-muted">
            All restaurants. Change status via API.
          </p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="px-4 py-2 rounded-[var(--radius-md)] bg-[#9B7CF5] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Add restaurant
        </Link>
      </div>

      {!restaurants?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          No restaurants.
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Area
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.area}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "active"
                          ? "bg-success-dim text-success"
                          : "bg-warning-dim text-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vendor/restaurants/${r.id}`}
                      className="text-sm text-brand-light hover:underline"
                    >
                      View in CMS
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
