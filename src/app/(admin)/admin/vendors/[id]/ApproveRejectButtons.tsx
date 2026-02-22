"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveRejectButtons({ vendorUserId }: { vendorUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/vendors/${vendorUserId}/verify`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to approve");
      }
      router.refresh();
      router.push("/admin/vendors");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirm("Reject this vendor claim? They will need to submit a new claim.")) return;
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/vendors/${vendorUserId}/reject`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reject");
      }
      router.refresh();
      router.push("/admin/vendors");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={!!loading}
        className="px-4 py-2 rounded-[var(--radius-md)] bg-brand text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
      >
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={!!loading}
        className="px-4 py-2 rounded-[var(--radius-md)] border border-danger text-danger font-medium text-sm hover:bg-danger/10 disabled:opacity-50"
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  );
}
