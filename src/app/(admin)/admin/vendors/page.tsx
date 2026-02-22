import { createClient } from "@/lib/supabase/server";
import { UserFactory } from "@/lib/auth/UserFactory";
import Link from "next/link";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  await UserFactory.fromSupabase(supabase); // layout already guards

  const { data: pending } = await supabase
    .from("vendor_profiles")
    .select("user_id")
    .is("verified_at", null);

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Vendor Verification
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Approve or reject pending vendor claims.
      </p>

      {!pending?.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          No pending verifications.
        </div>
      ) : (
        <div className="space-y-6">
          {pending.map((vp: Record<string, unknown>) => (
            <div
              key={String(vp.user_id)}
              className="bg-card border border-border rounded-[var(--radius-lg)] p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-text-primary">
                    User {String(vp.user_id).slice(0, 8)}…
                  </div>
                </div>
                <Link
                  href={`/admin/vendors/${vp.user_id}`}
                  className="text-sm font-medium text-brand-light hover:underline"
                >
                  Review →
                </Link>
              </div>
              <div className="text-xs text-text-muted">
                Click Review to see claimed restaurants and approve or reject.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
