"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export type AdminShellUser = {
  id: string;
  name: string;
  email: string | null;
  type: "admin";
  accessLevel: string;
  department: string | null;
};

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: "📊",
    apiPath: "/api/admin/stats",
    queryKey: ["admin-stats"],
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    icon: "✅",
    apiPath: "/api/admin/vendors",
    queryKey: ["admin-vendors"],
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: "👥",
    apiPath: "/api/admin/users",
    queryKey: ["admin-users"],
  },
  {
    href: "/admin/restaurants",
    label: "Restaurants",
    icon: "🏪",
    apiPath: "/api/admin/restaurants/list",
    queryKey: ["admin-restaurants"],
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: "📋",
    apiPath: "/api/admin/bookings",
    queryKey: ["admin-bookings"],
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: "⭐",
    apiPath: "/api/admin/reviews",
    queryKey: ["admin-reviews"],
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      window.location.href = "/";
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className="w-48 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
            Admin
          </div>
          <div className="text-xs font-semibold text-text-primary truncate">
            {user.name}
          </div>
          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[rgba(155,124,245,0.15)] text-[#9B7CF5] border border-[rgba(155,124,245,0.3)]">
            {user.accessLevel}
          </span>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.href ||
              (item.href !== "/admin" && path?.startsWith(item.href));
            const prefetch = () => {
              queryClient.prefetchQuery({
                queryKey:
                  item.queryKey[0] === "admin-users"
                    ? ["admin-users", ""]
                    : item.queryKey,
                queryFn: async () => {
                  const res = await fetch(item.apiPath);
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error);
                  return json;
                },
              });
            };
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={prefetch}
                onFocus={prefetch}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)] text-[13px] font-medium mb-0.5 transition-all duration-[var(--dur-fast)]",
                  isActive
                    ? "bg-[rgba(155,124,245,0.12)] text-[#9B7CF5] border border-[rgba(155,124,245,0.25)]"
                    : "text-text-secondary hover:bg-card hover:text-text-primary",
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)] text-[13px] font-medium text-text-secondary hover:bg-card hover:text-danger transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {signOutLoading ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
