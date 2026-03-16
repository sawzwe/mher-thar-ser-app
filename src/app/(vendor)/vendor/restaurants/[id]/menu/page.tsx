import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { VendorUser } from "@/lib/auth/users/VendorUser";
import { MenuEditorClient } from "./MenuEditorClient";
import { VendorRestaurantTabs } from "@/components/vendor/VendorRestaurantTabs";

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

      <VendorRestaurantTabs restaurantId={id} />

      <MenuEditorClient
        restaurantId={id}
        restaurantSlug={restaurant.slug ?? id}
        apiPath={`/api/vendor/restaurants/${id}/menu`}
      />
    </div>
  );
}
