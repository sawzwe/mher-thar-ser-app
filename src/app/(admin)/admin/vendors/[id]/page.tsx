import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserFactory } from "@/lib/auth/UserFactory";
import Link from "next/link";
import { ApproveRejectButtons } from "@/app/(admin)/admin/vendors/[id]/ApproveRejectButtons";

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: vendorUserId } = await params;
  const supabase = await createClient();
  await UserFactory.fromSupabase(supabase);

  const [{ data: vp }, { data: authUser }] = await Promise.all([
    supabase
      .from("vendor_profiles")
      .select("user_id, company_name, restaurant_ids, verified_at")
      .eq("user_id", vendorUserId)
      .single(),
    createAdminClient().auth.admin.getUserById(vendorUserId),
  ]);

  if (!vp) {
    return (
      <div className="p-8">
        <p className="text-text-muted">Vendor not found or already verified.</p>
        <Link
          href="/admin/vendors"
          className="text-sm text-brand-light hover:underline mt-2 inline-block"
        >
          ← Back to vendors
        </Link>
      </div>
    );
  }

  const { data: vr } = await supabase
    .from("vendor_restaurants")
    .select("restaurant_id, role, restaurants(id, name, area, status)")
    .eq("vendor_id", vendorUserId);

  const email = authUser?.user?.email ?? null;
  const isPending = vp.verified_at == null;

  return (
    <div className="p-8">
      <Link
        href="/admin/vendors"
        className="text-sm text-brand-light hover:underline mb-6 inline-block"
      >
        ← Back to vendors
      </Link>
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Vendor Review
      </h1>

      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 space-y-6">
        <div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
            User
          </div>
          <div className="font-semibold text-text-primary">
            {email || `User ${String(vendorUserId).slice(0, 8)}…`}
          </div>
          <div className="text-sm text-text-muted mt-1">ID: {vendorUserId}</div>
        </div>

        {vp.company_name && (
          <div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Company
            </div>
            <div className="text-text-primary">{vp.company_name}</div>
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Claimed restaurants
          </div>
          {vr?.length ? (
            <ul className="space-y-2">
              {vr.map((row) => {
                const rest = Array.isArray(row.restaurants)
                  ? row.restaurants[0]
                  : row.restaurants;
                return (
                  <li
                    key={row.restaurant_id}
                    className="flex items-center justify-between py-2 px-3 rounded-[var(--radius-md)] bg-surface border border-border"
                  >
                    <div>
                      <span className="font-medium text-text-primary">
                        {rest?.name ?? "Unknown"}
                      </span>
                      <span className="text-sm text-text-muted ml-2">
                        {rest?.area ?? ""} · {rest?.status ?? "—"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">
              No claimed restaurants found.
            </p>
          )}
        </div>

        {isPending && <ApproveRejectButtons vendorUserId={vendorUserId} />}
      </div>
    </div>
  );
}
