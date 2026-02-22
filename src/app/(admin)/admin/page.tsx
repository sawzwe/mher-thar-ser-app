"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  UsersThree,
  User,
  Storefront,
  CalendarBlank,
  Plus,
  ShieldCheck,
  ChartLineUp,
  Storefront as StoreIcon,
} from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type OverviewData = {
  stats: {
    totalUsers: number;
    customers: number;
    vendors: number;
    admins: number;
    pendingVendors: number;
    todayBookings: number;
  };
  restaurantCount: number;
  topRestaurants: Array<{
    id: string;
    name: string;
    slug: string | null;
    area: string;
    image_url: string | null;
    status: string;
    bookingCount: number;
  }>;
  activity: Array<{
    type: "vendor_claim";
    user_id: string;
    company_name: string;
    email: string;
    created_at: string;
  }>;
};

function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load overview");
      return json;
    },
  });

  if (error) {
    return (
      <div className="p-8 animate-admin-enter">
        <p className="text-danger">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  const stats = data?.stats;
  const pendingCount = stats?.pendingVendors ?? 0;

  return (
    <div className="p-8 animate-admin-enter">
      <AdminPageHeader
        title="Platform"
        titleEm="Overview"
        subtitle="All data live from Supabase"
        action={
          <Link
            href="/admin/restaurants/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-colors shrink-0"
          >
            <Plus size={16} weight="bold" />
            Add Restaurant
          </Link>
        }
      />

      {/* Health strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <HealthItem
          icon={<ChartLineUp size={20} weight="regular" />}
          label="API Status"
          value="Healthy"
          status="good"
          statusLabel="Live"
        />
        <HealthItem
          icon={<StoreIcon size={20} weight="regular" />}
          label="Pending verifications"
          value={String(pendingCount)}
          status={pendingCount > 0 ? "warn" : "good"}
          statusLabel={pendingCount > 0 ? "Action needed" : "Clear"}
        />
        <HealthItem
          icon={<User size={20} weight="regular" />}
          label="Total users"
          value={String(stats?.totalUsers ?? 0)}
          status="good"
          statusLabel="Active"
        />
        <HealthItem
          icon={<CalendarBlank size={20} weight="regular" />}
          label="Today's bookings"
          value={String(stats?.todayBookings ?? 0)}
          status="good"
          statusLabel="—"
        />
      </div>

      {/* Stat cards row - 4 cols */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-[14px] p-5 animate-pulse"
            >
              <div className="h-9 w-9 rounded-lg bg-surface mb-4" />
              <div className="h-3 bg-surface rounded w-20 mb-2" />
              <div className="h-9 bg-surface rounded w-12 mb-4" />
              <div className="h-9 bg-surface rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            sub={`${stats?.customers ?? 0} customer · ${stats?.vendors ?? 0} vendor`}
            icon={<UsersThree size={18} weight="regular" />}
            color="blue"
          />
          <StatCard
            label="Customers"
            value={stats?.customers ?? 0}
            sub="registered diners"
            icon={<User size={18} weight="regular" />}
            color="green"
          />
          <StatCard
            label="Active Vendors"
            value={stats?.vendors ?? 0}
            sub={`${stats?.vendors ?? 0} verified · ${stats?.pendingVendors ?? 0} pending`}
            icon={<Storefront size={18} weight="regular" />}
            color="purple"
          />
          <StatCard
            label="Bookings Today"
            value={stats?.todayBookings ?? 0}
            sub="confirmed · cancelled · completed"
            icon={<CalendarBlank size={18} weight="regular" />}
            color="brand"
          />
        </div>
      )}

      {/* Second row: Activity + Top Restaurants + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="text-[13px] font-bold text-text-primary">
                Recent Activity
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Platform events
              </div>
            </div>
            <Link
              href="/admin/vendors"
              className="text-[11px] font-semibold text-brand-light hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex gap-3 animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-surface shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface rounded w-3/4 mb-2" />
                    <div className="h-2 bg-surface rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (data?.activity ?? []).length > 0 ? (
              (data?.activity ?? []).slice(0, 5).map((a) => (
                <div
                  key={a.user_id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-card-hover/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[rgba(139,108,245,0.12)] border border-[rgba(139,108,245,0.2)] flex items-center justify-center shrink-0">
                    <Storefront size={14} weight="regular" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-text-secondary leading-snug">
                      <strong className="text-text-primary">New vendor claim</strong>
                      {" — "}
                      {a.company_name || a.email || "Unknown"} requested verification
                    </div>
                    <div className="text-[11px] text-text-disabled mt-1">
                      {formatRelativeTime(a.created_at)} · Pending approval
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-[12px] text-text-muted">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="text-[13px] font-bold text-text-primary">
                Top Restaurants
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                By booking count
              </div>
            </div>
            <Link
              href="/admin/restaurants"
              className="text-[11px] font-semibold text-brand-light hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-md bg-surface shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface rounded w-24 mb-1" />
                    <div className="h-2 bg-surface rounded w-16" />
                  </div>
                </div>
              ))
            ) : (data?.topRestaurants ?? []).length > 0 ? (
              (data?.topRestaurants ?? []).map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-card-hover/50 transition-colors"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                      i === 0
                        ? "bg-[rgba(212,168,83,0.12)] text-[#D4A853]"
                        : "bg-[rgba(255,255,255,0.04)] text-text-muted"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm bg-gradient-to-br from-brand to-brand-light"
                    style={
                      r.image_url
                        ? { backgroundImage: `url(${r.image_url})`, backgroundSize: "cover" }
                        : {}
                    }
                  >
                    {!r.image_url && "🍽"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-text-primary truncate">
                      {r.name}
                    </div>
                    <div className="text-[11px] text-text-muted">{r.area}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-text-primary">
                      {r.bookingCount > 0 ? r.bookingCount : "—"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {r.bookingCount > 0 ? "bookings" : "No bookings"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-[12px] text-text-muted">
                No restaurants yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-[13px] font-bold text-text-primary">
              Quick Actions
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              Most frequent tasks
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              href="/admin/vendors"
              className="flex items-center gap-2.5 p-3 rounded-[10px] bg-card-hover border border-border hover:border-[rgba(255,255,255,0.1)] hover:bg-card-active transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(139,108,245,0.12)] border border-[rgba(139,108,245,0.2)] flex items-center justify-center shrink-0">
                <ShieldCheck size={16} weight="regular" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">
                  Verify vendors
                </div>
                <div className="text-[11px] text-text-muted">
                  {pendingCount} pending
                </div>
              </div>
              <span className="text-text-disabled group-hover:text-text-muted transition-colors">
                →
              </span>
            </Link>
            <Link
              href="/admin/restaurants/new"
              className="flex items-center gap-2.5 p-3 rounded-[10px] bg-card-hover border border-border hover:border-[rgba(255,255,255,0.1)] hover:bg-card-active transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(61,170,110,0.12)] border border-[rgba(61,170,110,0.2)] flex items-center justify-center shrink-0">
                <Storefront size={16} weight="regular" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">
                  Add restaurant
                </div>
                <div className="text-[11px] text-text-muted">Seed catalog</div>
              </div>
              <span className="text-text-disabled group-hover:text-text-muted transition-colors">
                →
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2.5 p-3 rounded-[10px] bg-card-hover border border-border hover:border-[rgba(255,255,255,0.1)] hover:bg-card-active transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(74,159,212,0.12)] border border-[rgba(74,159,212,0.2)] flex items-center justify-center shrink-0">
                <UsersThree size={16} weight="regular" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">
                  Manage users
                </div>
                <div className="text-[11px] text-text-muted">
                  {stats?.totalUsers ?? 0} total
                </div>
              </div>
              <span className="text-text-disabled group-hover:text-text-muted transition-colors">
                →
              </span>
            </Link>
            <Link
              href="/admin/restaurants"
              className="flex items-center gap-2.5 p-3 rounded-[10px] bg-card-hover border border-border hover:border-[rgba(255,255,255,0.1)] hover:bg-card-active transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(232,66,26,0.10)] border border-[rgba(232,66,26,0.22)] flex items-center justify-center shrink-0">
                <StoreIcon size={16} weight="regular" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary">
                  Restaurants
                </div>
                <div className="text-[11px] text-text-muted">
                  {data?.restaurantCount ?? 0} total
                </div>
              </div>
              <span className="text-text-disabled group-hover:text-text-muted transition-colors">
                →
              </span>
            </Link>
          </div>

          {/* Next milestone */}
          <div className="mx-4 mb-4 p-4 rounded-[10px] bg-gradient-to-br from-[rgba(232,66,26,0.08)] to-[rgba(139,108,245,0.08)] border border-[rgba(232,66,26,0.22)]">
            <div className="text-[10px] font-extrabold text-brand-light uppercase tracking-wider mb-1.5">
              Next milestone
            </div>
            <div className="text-[13px] font-bold text-text-primary mb-1">
              First 10 restaurants
            </div>
            <div className="text-[11px] text-text-secondary mb-3">
              Add {Math.max(0, 10 - (data?.restaurantCount ?? 0))} more to grow your catalog
            </div>
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((data?.restaurantCount ?? 0) / 10) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1.5">
              <span>
                {data?.restaurantCount ?? 0} / 10 restaurants
              </span>
              <span>{Math.min(100, Math.round(((data?.restaurantCount ?? 0) / 10) * 100))}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthItem({
  icon,
  label,
  value,
  status,
  statusLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "warn" | "bad";
  statusLabel: string;
}) {
  const statusClasses = {
    good: "bg-[rgba(61,170,110,0.12)] text-[#3DAA6E]",
    warn: "bg-[rgba(224,155,45,0.12)] text-[#E09B2D]",
    bad: "bg-[rgba(232,64,64,0.12)] text-[#E84040]",
  };
  return (
    <div className="flex items-center gap-3 p-4 rounded-[10px] bg-card border border-border">
      <div className="text-text-muted shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
          {label}
        </div>
        <div className="text-[17px] font-extrabold text-text-primary tracking-tight">
          {value}
        </div>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusClasses[status]}`}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "brand";
}) {
  const colors = {
    blue: {
      bg: "bg-[rgba(74,159,212,0.12)]",
      border: "border-[rgba(74,159,212,0.2)]",
      stroke: "#4A9FD4",
    },
    green: {
      bg: "bg-[rgba(61,170,110,0.12)]",
      border: "border-[rgba(61,170,110,0.2)]",
      stroke: "#3DAA6E",
    },
    purple: {
      bg: "bg-[rgba(139,108,245,0.12)]",
      border: "border-[rgba(139,108,245,0.2)]",
      stroke: "#8B6CF5",
    },
    brand: {
      bg: "bg-[rgba(232,66,26,0.10)]",
      border: "border-[rgba(232,66,26,0.22)]",
      stroke: "#E8421A",
    },
  };
  const c = colors[color];
  return (
    <div className="bg-card border border-border rounded-[14px] p-5 relative overflow-hidden transition-all duration-200 hover:border-[rgba(255,255,255,0.1)] hover:shadow-lg hover:shadow-black/40 hover:-translate-y-px">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--tw-gradient-from)] to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${c.bg} ${c.border}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[36px] font-extrabold text-text-primary tracking-tight leading-none mb-2">
        {value}
      </div>
      <div className="text-[11px] text-text-muted mb-3">{sub}</div>
      {/* Sparkline placeholder */}
      <div className="h-9 -mb-1">
        <svg viewBox="0 0 100 36" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient
              id={`spark-${color}-${label.replace(/\s/g, "-")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={c.stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d="M0,30 L25,28 L50,24 L75,18 L100,10"
            fill="none"
            stroke={c.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M0,30 L25,28 L50,24 L75,18 L100,10 L100,36 L0,36Z"
            fill={`url(#spark-${color}-${label.replace(/\s/g, "-")})`}
          />
        </svg>
      </div>
    </div>
  );
}
