import type { SupabaseClient } from "@supabase/supabase-js";
import type { Action, IUser, Permission, Resource } from "./types";
import { AdminUser } from "./users/AdminUser";
import { CustomerUser } from "./users/CustomerUser";
import { GuestUser } from "./users/GuestUser";
import { VendorUser } from "./users/VendorUser";

interface RolePermissionRow {
  scope: string | null;
  // Supabase returns nested single-row joins as objects, but TS infers them as arrays
  permissions:
    | { action: string; resource: string }
    | { action: string; resource: string }[]
    | null;
}

interface RoleRow {
  slug: string;
  role_permissions: RolePermissionRow[];
}

interface UserRoleRow {
  roles: RoleRow | RoleRow[] | null;
}

function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class UserFactory {
  /**
   * Resolve the current user from a Supabase client instance.
   * Returns GuestUser if unauthenticated, otherwise fetches roles
   * and profile data and creates the appropriate typed user.
   */
  static async fromSupabase(supabase: SupabaseClient): Promise<IUser> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return UserFactory.createGuest();

    const name =
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "User";

    const locale = (user.user_metadata?.locale as string | undefined) || "en";

    // Fetch roles + permissions in a single join query
    const { data: userRolesData } = await supabase
      .from("user_roles")
      .select(
        `roles (
          slug,
          role_permissions (
            scope,
            permissions (action, resource)
          )
        )`,
      )
      .eq("user_id", user.id);

    const rawRows = (userRolesData ?? []) as unknown as UserRoleRow[];

    const roles: RoleRow[] = rawRows
      .flatMap((ur) =>
        Array.isArray(ur.roles) ? ur.roles : ur.roles ? [ur.roles] : [],
      )
      .filter(Boolean);

    const roleSlugs = roles.map((r) => r.slug);

    const permissions: Permission[] = roles.flatMap((role) =>
      (role.role_permissions ?? []).flatMap((rp) => {
        if (!rp.permissions) return [];
        const perms = Array.isArray(rp.permissions)
          ? rp.permissions
          : [rp.permissions];
        return perms.map((p) => ({
          action: p.action as Action,
          resource: p.resource as Resource,
          scope: (rp.scope ?? "own") as "own" | "all",
        }));
      }),
    );

    const base = {
      id: user.id,
      email: user.email ?? null,
      name,
      locale,
      permissions,
    };

    if (roleSlugs.includes("admin")) {
      const { data: ap } = await supabase
        .from("admin_profiles")
        .select("access_level, department")
        .eq("user_id", user.id)
        .single();

      return new AdminUser({
        ...base,
        accessLevel: ap?.access_level ?? "moderator",
        department: ap?.department ?? undefined,
      });
    }

    if (roleSlugs.includes("vendor")) {
      const [{ data: vr }, { data: vp }] = await Promise.all([
        supabase
          .from("vendor_restaurants")
          .select("restaurant_id")
          .eq("vendor_id", user.id),
        supabase
          .from("vendor_profiles")
          .select("company_name, verified_at")
          .eq("user_id", user.id)
          .single(),
      ]);

      return new VendorUser({
        ...base,
        restaurantIds: (vr ?? []).map(
          (r: { restaurant_id: string }) => r.restaurant_id,
        ),
        companyName: vp?.company_name ?? undefined,
        verifiedAt: vp?.verified_at ?? null,
      });
    }

    const { data: cp } = await supabase
      .from("customer_profiles")
      .select(
        "preferred_cuisines, preferred_areas, dietary_restrictions, default_party_size",
      )
      .eq("user_id", user.id)
      .single();

    return new CustomerUser({
      ...base,
      preferredCuisines: cp?.preferred_cuisines ?? [],
      preferredAreas: cp?.preferred_areas ?? [],
      dietaryRestrictions: cp?.dietary_restrictions ?? [],
      defaultPartySize: cp?.default_party_size ?? 2,
    });
  }

  /** Create an anonymous guest — no DB query needed */
  static createGuest(token?: string): GuestUser {
    const guestToken = token ?? generateGuestId();
    return new GuestUser({
      id: guestToken,
      name: "Guest",
      email: null,
      guestToken,
    });
  }
}
