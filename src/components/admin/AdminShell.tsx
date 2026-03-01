"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import {
  ChartLine,
  Storefront,
  CalendarBlank,
  Star,
  ShieldCheck,
  UsersThree,
  SignOut,
} from "@phosphor-icons/react";

export type AdminShellUser = {
  id: string;
  name: string;
  email: string | null;
  type: "admin";
  accessLevel: string;
  department: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  apiPath: string;
  queryKey: string[];
};

const NAV_SECTIONS: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: ChartLine,
        apiPath: "/api/admin/overview",
        queryKey: ["admin-overview"],
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/admin/restaurants",
        label: "Restaurants",
        icon: Storefront,
        apiPath: "/api/admin/restaurants/list",
        queryKey: ["admin-restaurants"],
      },
      {
        href: "/admin/bookings",
        label: "Bookings",
        icon: CalendarBlank,
        apiPath: "/api/admin/bookings",
        queryKey: ["admin-bookings"],
      },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: Star,
        apiPath: "/api/admin/reviews",
        queryKey: ["admin-reviews"],
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        href: "/admin/vendors",
        label: "Vendor verification",
        icon: ShieldCheck,
        apiPath: "/api/admin/vendors",
        queryKey: ["admin-vendors"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/admin/users",
        label: "Users & roles",
        icon: UsersThree,
        apiPath: "/api/admin/users",
        queryKey: ["admin-users"],
      },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/vendors": "Vendor verification",
  "/admin/users": "Users & roles",
  "/admin/restaurants": "Restaurants",
  "/admin/bookings": "Bookings",
  "/admin/reviews": "Reviews",
};

function getPageTitle(path: string | null): string {
  if (!path) return "Overview";
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (path === prefix || (prefix !== "/admin" && path.startsWith(prefix))) return title;
  }
  return "Admin";
}

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

  const pageTitle = getPageTitle(path);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className="w-[220px] border-r border-border bg-surface flex flex-col shrink-0 relative">
        <div
          className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(232,66,26,0.08), transparent)",
          }}
        />
        <div className="relative p-4 pb-3 border-b border-border">
          <div className="text-[10px] font-bold text-brand uppercase tracking-[0.1em] mb-1.5">
            Admin
          </div>
          <div className="text-[15px] font-bold text-text-primary truncate mb-2">
            {user.name}
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-dim text-brand border border-brand-border">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            {user.accessLevel}
          </span>
        </div>
        <nav className="relative flex-1 py-3 px-2.5 overflow-y-auto space-y-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title ?? "overview"}>
              {section.title && (
                <div className="px-2 py-3 pb-1.5 text-[9.5px] font-extrabold text-text-disabled uppercase tracking-[0.1em]">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
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
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={prefetch}
                      onFocus={prefetch}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-brand-dim text-text-primary font-semibold border border-brand-border"
                          : "text-text-muted hover:bg-card-hover hover:text-text-secondary",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-brand" />
                      )}
                      <ItemIcon size={18} weight="regular" className="flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="relative p-2.5 border-t border-border">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium text-text-muted hover:bg-card-hover hover:text-danger transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <SignOut size={18} weight="regular" className="flex-shrink-0" />
            {signOutLoading ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-7 bg-bg/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-secondary">
              Mher Thar Ser
            </span>
            <span className="text-text-disabled">/</span>
            <span className="text-sm font-semibold text-text-primary">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              · {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
