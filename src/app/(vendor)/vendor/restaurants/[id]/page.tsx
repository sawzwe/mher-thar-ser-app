import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";
import { VendorContactForm } from "@/components/vendor/VendorContactForm";

export default async function RestaurantEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);

  if (user.type !== "vendor") {
    redirect(
      user.isAuthenticated() ? "/" : `/sign-in?next=/vendor/restaurants/${id}`,
    );
  }

  const vendor = user as VendorUser;
  const ownsRestaurant =
    typeof vendor.ownsRestaurant === "function"
      ? vendor.ownsRestaurant(id)
      : (vendor.restaurantIds ?? []).includes(id);
  if (!ownsRestaurant) {
    redirect("/vendor");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (!restaurant) {
    redirect("/vendor");
  }

  const tabs = [
    { href: `/vendor/restaurants/${id}`, label: "Info" },
    { href: `/vendor/restaurants/${id}/menu`, label: "Menu" },
    { href: `/vendor/restaurants/${id}/deals`, label: "Deals" },
    { href: `/vendor/restaurants/${id}/slots`, label: "Availability" },
    { href: `/vendor/restaurants/${id}/bookings`, label: "Bookings" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/vendor/restaurants"
          className="text-sm text-text-muted hover:text-text-primary"
        >
          ← Restaurants
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {restaurant.name}
      </h1>

      <nav className="flex gap-1 border-b border-border mb-8">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border-b-2 border-transparent -mb-px hover:border-brand"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6">
        <h2 className="font-semibold text-text-primary mb-4">
          Restaurant Info
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-text-muted">Name</dt>
            <dd className="text-text-primary font-medium">{restaurant.name}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Area</dt>
            <dd className="text-text-primary">{restaurant.area}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-text-muted">Full address</dt>
            <dd className="text-text-primary">
              {[
                restaurant.address,
                restaurant.subdistrict,
                restaurant.district,
                restaurant.province,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Status</dt>
            <dd>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  restaurant.status === "active"
                    ? "bg-success-dim text-success"
                    : "bg-warning-dim text-warning"
                }`}
              >
                {restaurant.status}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <VendorContactForm
        restaurantId={id}
        slug={restaurant.slug ?? id}
        initial={{
          phone: restaurant.phone ?? "",
          website: restaurant.website ?? "",
          email: restaurant.email ?? "",
          facebook_url: restaurant.facebook_url ?? "",
          instagram_url: restaurant.instagram_url ?? "",
          twitter_url: restaurant.twitter_url ?? "",
          tiktok_url: restaurant.tiktok_url ?? "",
          logo_url: restaurant.logo_url ?? "",
          restaurant_type: restaurant.restaurant_type ?? "",
        }}
      />
    </div>
  );
}
