"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/vendors", label: "Vendor Verify", icon: "✅" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/admin/bookings", label: "All Bookings", icon: "📋" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
];

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = () => {
    signOut().then(() => router.push("/"));
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
            Admin Panel
          </div>
          <div className="text-sm font-semibold text-text-primary truncate">
            {user.name}
          </div>
          <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgba(155,124,245,0.15)] text-[#9B7CF5] border border-[rgba(155,124,245,0.3)]">
            {user.accessLevel}
          </span>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.href ||
              (item.href !== "/admin" && path?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium mb-0.5 transition-all duration-[var(--dur-fast)]",
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-text-secondary hover:bg-card hover:text-danger transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
