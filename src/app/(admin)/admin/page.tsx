"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Stats = {
  totalUsers: number;
  customers: number;
  vendors: number;
  admins: number;
  pendingVendors: number;
  todayBookings: number;
};

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load stats");
      return json;
    },
  });

  if (error) {
    return (
      <div className="p-8 animate-admin-enter">
        <p className="text-danger">Failed to load stats: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-admin-enter">
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Admin Overview
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Platform-wide stats and activity.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-[var(--radius-lg)] p-5 animate-pulse"
            >
              <div className="h-3 bg-surface rounded w-24 mb-2" />
              <div className="h-8 bg-surface rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
          <StatCard label="Customers" value={stats?.customers ?? 0} />
          <StatCard label="Vendors" value={stats?.vendors ?? 0} />
          <StatCard label="Admins" value={stats?.admins ?? 0} />
          <StatCard
            label="Pending Vendors"
            value={stats?.pendingVendors ?? 0}
            href="/admin/vendors"
            linkLabel="Review →"
          />
          <StatCard label="Today's Bookings" value={stats?.todayBookings ?? 0} />
        </div>
      )}

      <div className="text-sm text-text-muted">
        Quick links:{" "}
        <Link href="/admin/vendors" className="text-brand-light hover:underline">
          Vendors
        </Link>
        {" · "}
        <Link href="/admin/users" className="text-brand-light hover:underline">
          Users
        </Link>
        {" · "}
        <Link href="/admin/restaurants" className="text-brand-light hover:underline">
          Restaurants
        </Link>
        {" · "}
        <Link href="/admin/bookings" className="text-brand-light hover:underline">
          Bookings
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  linkLabel,
}: {
  label: string;
  value: number;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      {href && linkLabel && value > 0 && (
        <Link href={href} className="mt-2 text-sm text-brand-light hover:underline block">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
