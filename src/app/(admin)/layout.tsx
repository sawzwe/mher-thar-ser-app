import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { AdminUser } from "@/lib/auth/users/AdminUser";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await UserFactory.fromSupabase(supabase);

  if (user.type !== "admin") {
    redirect(user.isAuthenticated() ? "/" : `/sign-in?next=/admin`);
  }

  const admin = user as AdminUser;
  const userProps = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    type: "admin" as const,
    accessLevel: admin.accessLevel,
    department: admin.department,
  };

  return <AdminShell user={userProps}>{children}</AdminShell>;
}
