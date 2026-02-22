"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CardListSkeleton } from "@/components/admin/AdminPageSkeleton";

export default function AdminVendorsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json as { pending: { user_id: string }[] };
    },
  });

  const pending = data?.pending ?? [];

  if (error) {
    return (
      <div className="p-8 animate-admin-enter">
        <p className="text-danger">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-admin-enter">
      <AdminPageHeader
        title="Vendor"
        titleEm="Verification"
        subtitle="Approve or reject pending vendor claims."
      />

      {isLoading ? (
        <CardListSkeleton count={3} />
      ) : !pending.length ? (
        <div className="bg-card border border-border rounded-[14px] p-8 text-center text-text-muted text-[13px]">
          No pending verifications.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((vp) => (
            <div
              key={vp.user_id}
              className="bg-card border border-border rounded-[14px] p-5 hover:border-[rgba(255,255,255,0.1)] transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-text-primary">
                    User {vp.user_id.slice(0, 8)}…
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
