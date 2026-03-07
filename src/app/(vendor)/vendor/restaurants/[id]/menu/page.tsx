import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";
import { MenuEditorClient } from "./MenuEditorClient";

export default async function VendorMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);

  if (user.type !== "vendor") {
    redirect(
      user.isAuthenticated() ? "/" : `/sign-in?next=/vendor/restaurants/${id}/menu`,
    );
  }

  const vendor = user as VendorUser;
  const owns = typeof vendor.ownsRestaurant === "function"
    ? vendor.ownsRestaurant(id)
    : (vendor.restaurantIds ?? []).includes(id);
  if (!owns) redirect("/vendor");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug")
    .eq("id", id)
    .single();

  if (!restaurant) redirect("/vendor");

  const tabs = [
    { href: `/vendor/restaurants/${id}`, label: "Info" },
    { href: `/vendor/restaurants/${id}/menu`, label: "Menu" },
    { href: `/vendor/restaurants/${id}/deals`, label: "Deals" },
    { href: `/vendor/restaurants/${id}/slots`, label: "Availability" },
    { href: `/vendor/restaurants/${id}/bookings`, label: "Bookings" },
  ];

  return (
    <div className="p-8">
      <Link
        href={`/vendor/restaurants/${id}`}
        className="text-sm text-text-muted hover:text-text-primary mb-4 inline-block"
      >
        ← {restaurant.name}
      </Link>
      <h1 className="text-2xl font-bold text-text-primary mb-1">{restaurant.name}</h1>
      <p className="text-sm text-text-muted mb-6">Edit your menu. Changes are saved instantly.</p>

      <nav className="flex gap-1 border-b border-border mb-8">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab.href === `/vendor/restaurants/${id}/menu`
                ? "border-brand text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-brand"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <MenuEditorClient
        restaurantId={id}
        restaurantSlug={restaurant.slug ?? id}
        apiPath={`/api/vendor/restaurants/${id}/menu`}
      />
    </div>
  );
}
