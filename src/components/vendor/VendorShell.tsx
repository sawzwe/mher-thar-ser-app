"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type VendorShellUser = {
  id: string;
  name: string;
  email: string | null;
  type: "vendor";
  companyName?: string | null;
  verifiedAt: string | null;
};

const NAV_ITEMS = [
  { href: "/vendor", label: "Dashboard", icon: "⚡" },
  { href: "/vendor/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/claim", label: "Claim Restaurant", icon: "📋" },
];

export function VendorShell({
  user,
  children,
}: {
  user: VendorShellUser;
  children: React.ReactNode;
}) {
  const path = usePathname();

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
            Vendor CMS
          </div>
          <div className="text-sm font-semibold text-text-primary truncate">
            {user.name}
          </div>
          {user.companyName && (
            <div className="text-xs text-text-muted mt-0.5 truncate">
              {user.companyName}
            </div>
          )}
          {!user.verifiedAt && (
            <div className="mt-2 text-xs text-warning bg-warning-dim border border-warning-border rounded-[var(--radius-sm)] px-2 py-1">
              ⚠ Pending verification
            </div>
          )}
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.href ||
              (item.href !== "/vendor" && path?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium mb-0.5 transition-all duration-[var(--dur-fast)]",
                  isActive
                    ? "bg-brand-dim text-brand-light border border-brand-border"
                    : "text-text-secondary hover:bg-card hover:text-text-primary",
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
