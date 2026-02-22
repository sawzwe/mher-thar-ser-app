import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import { ClaimRestaurantForm } from "@/components/vendor/ClaimRestaurantForm";

export default async function ClaimPage() {
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);

  if (!user.isAuthenticated()) {
    redirect(`/sign-in?next=/claim`);
  }

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, slug, area")
    .order("name")
    .limit(100);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Claim your restaurant
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Search for your restaurant or add a new one. Your claim will be
        reviewed by our team.
      </p>
      <ClaimRestaurantForm
        userId={user.id}
        existingRestaurants={restaurants ?? []}
      />
    </div>
  );
}
