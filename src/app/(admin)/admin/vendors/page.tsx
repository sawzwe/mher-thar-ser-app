"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Storefront } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CardListSkeleton } from "@/components/admin/AdminPageSkeleton";

type PendingVendor = {
  user_id: string;
  company_name: string;
  email: string | null;
  created_at: string;
  restaurant_count: number;
};

function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export default function AdminVendorsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json as { pending: PendingVendor[] };
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
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(139,108,245,0.12)] border border-[rgba(139,108,245,0.2)] flex items-center justify-center shrink-0">
                    <Storefront size={18} weight="regular" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary truncate">
                      {vp.company_name || vp.email || `User ${vp.user_id.slice(0, 8)}…`}
                    </div>
                    {vp.email && (
                      <div className="text-sm text-text-muted truncate mt-0.5">
                        {vp.email}
                      </div>
                    )}
                    <div className="text-xs text-text-disabled mt-1">
                      {vp.restaurant_count > 0
                        ? `${vp.restaurant_count} restaurant${vp.restaurant_count !== 1 ? "s" : ""} claimed`
                        : "No restaurants linked yet"}
                      {vp.created_at
                        ? ` · ${formatRelativeTime(vp.created_at)}`
                        : ""}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/vendors/${vp.user_id}`}
                  className="text-sm font-medium text-brand-light hover:underline shrink-0"
                >
                  Review →
                </Link>
              </div>
              <div className="text-xs text-text-muted pl-12">
                Click Review to see claimed restaurants and approve or reject.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
