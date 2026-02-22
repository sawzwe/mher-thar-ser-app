import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import { VendorShell } from "@/components/vendor/VendorShell";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export default async function VendorLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);

  if (user.type !== "vendor") {
    redirect(user.isAuthenticated() ? "/" : `/sign-in?next=/vendor`);
  }

  const vendor = user as VendorUser;
  const userProps = {
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    type: "vendor" as const,
    companyName: vendor.companyName,
    verifiedAt: vendor.verifiedAt,
  };

  return <VendorShell user={userProps}>{children}</VendorShell>;
}
