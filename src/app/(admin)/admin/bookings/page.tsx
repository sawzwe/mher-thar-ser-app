"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableSkeleton } from "@/components/admin/AdminPageSkeleton";

type Booking = {
  id: string;
  booking_ref: string;
  customer_name: string;
  date: string;
  time: string;
  status: string;
  restaurant_id: string;
};

export default function AdminBookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bookings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json as { bookings: Booking[] };
    },
  });

  const bookings = data?.bookings ?? [];

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
        title="Bookings"
        subtitle="Cross-restaurant view. Filter and export via API."
      />

      {isLoading ? (
        <TableSkeleton rows={10} cols={4} />
      ) : !bookings.length ? (
        <div className="bg-card border border-border rounded-[14px] p-8 text-center text-text-muted text-[13px]">
          No bookings.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[14px] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Ref
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Guest
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Date / Time
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 font-mono text-sm text-brand-light">
                    {b.booking_ref}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{b.customer_name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {b.date} {b.time}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === "confirmed"
                          ? "bg-success-dim text-success"
                          : b.status === "completed"
                            ? "bg-info-dim text-info"
                            : "bg-[rgba(255,255,255,0.05)] text-text-muted"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
