"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, UploadSimple } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableSkeleton } from "@/components/admin/AdminPageSkeleton";

type Restaurant = { id: string; name: string; slug: string | null; area: string; status: string };

export default function AdminRestaurantsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/admin/restaurants/list");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json as { restaurants: Restaurant[] };
    },
  });

  const restaurants = data?.restaurants ?? [];

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
        title="Restaurants"
        subtitle="All restaurants. Change status via API."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/restaurants/import"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-card transition-colors"
            >
              <UploadSimple size={16} weight="bold" />
              Import
            </Link>
            <Link
              href="/admin/restaurants/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-colors"
            >
              <Plus size={16} weight="bold" />
              Add restaurant
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : !restaurants.length ? (
        <div className="bg-card border border-border rounded-[14px] p-8 text-center text-text-muted text-[13px]">
          No restaurants.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Area
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.area}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "active"
                          ? "bg-success-dim text-success"
                          : "bg-warning-dim text-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="text-sm text-brand-light hover:underline"
                    >
                      Edit
                    </Link>
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
