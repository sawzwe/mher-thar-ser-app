"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, UploadSimple, CaretDown, XCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableSkeleton } from "@/components/admin/AdminPageSkeleton";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  area: string;
  status: string;
  menu_item_count: number;
  has_menu: boolean;
};

export default function AdminRestaurantsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
  const q = search.trim().toLowerCase();
  const filteredRestaurants = useMemo(() => {
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const name = r.name.toLowerCase();
      const area = r.area.toLowerCase();
      const slug = (r.slug ?? "").toLowerCase();
      return name.includes(q) || area.includes(q) || slug.includes(q);
    });
  }, [restaurants, q]);

  const selectedCount = selected.size;
  const allFilteredSelected =
    filteredRestaurants.length > 0 &&
    filteredRestaurants.every((r) => selected.has(r.id));
  const withMenu = restaurants.filter((r) => r.has_menu).length;
  const withoutMenu = restaurants.length - withMenu;

  const toggleAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selected);
      filteredRestaurants.forEach((r) => next.delete(r.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filteredRestaurants.forEach((r) => next.add(r.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runBulk = async (action: "status" | "delete", status?: string) => {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    setBulkError(null);
    try {
      const res = await fetch("/api/admin/restaurants/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selected), status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSelected(new Set());
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
    } catch (e) {
      setBulkError((e as Error).message);
    } finally {
      setBulkLoading(false);
    }
  };

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
        subtitle="All restaurants. Menu column counts items in the database. Bulk actions when rows are selected."
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

      {!isLoading && restaurants.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full max-w-md flex-1 min-w-0">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-text-muted"
              size={18}
              weight="bold"
              aria-hidden
            />
            <input
              id="mts-admin-restaurants-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, area, or slug…"
              autoComplete="off"
              aria-label="Search restaurants"
              className="w-full h-11 pl-10 pr-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-border-strong focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
            />
          </div>
          {q ? (
            <span className="text-[13px] text-text-muted shrink-0 tabular-nums">
              {filteredRestaurants.length} of {restaurants.length} shown
            </span>
          ) : null}
        </div>
      )}

      {!isLoading && restaurants.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px]">
          <span className="text-text-secondary">
            <strong className="text-text-primary tabular-nums">{withMenu}</strong> with menu
            <span className="text-text-muted mx-1">·</span>
            <strong className="text-text-primary tabular-nums">{withoutMenu}</strong> no items
          </span>
          <span className="text-text-muted hidden sm:inline">
            (empty categories or missing import show as 0 items)
          </span>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {selectedCount} selected
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBulkOpen((o) => !o)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-card disabled:opacity-50"
            >
              Bulk actions
              <CaretDown size={14} weight="bold" />
            </button>
            {bulkOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setBulkOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] py-1 bg-card border border-border rounded-lg shadow-lg">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase">
                    Set status
                  </div>
                  {(["active", "paused", "archived", "draft"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => runBulk("status", s)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface capitalize"
                    >
                      Set to {s}
                    </button>
                  ))}
                  <div className="border-t border-border my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${selectedCount} restaurant(s)? This cannot be undone.`)) {
                        runBulk("delete");
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-danger hover:bg-danger-dim"
                  >
                    Delete selected
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Clear selection
          </button>
          {bulkError && (
            <span className="text-xs text-danger">{bulkError}</span>
          )}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : !restaurants.length ? (
        <div className="bg-card border border-border rounded-[14px] p-8 text-center text-text-muted text-[13px]">
          No restaurants.
        </div>
      ) : !filteredRestaurants.length ? (
        <div className="bg-card border border-border rounded-[14px] p-8 text-center text-[13px]">
          <p className="text-text-primary font-medium mb-1">No matches</p>
          <p className="text-text-muted">
            Nothing matches &ldquo;{search.trim()}&rdquo;. Try another name, area, or slug.
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 text-sm text-brand-light hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="rounded border-border"
                    title="Select all rows in current results"
                    aria-label="Select all restaurants in current search results"
                  />
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Area
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Menu
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
              {filteredRestaurants.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.area}</td>
                  <td className="px-4 py-3">
                    {r.has_menu ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success-dim text-success tabular-nums">
                          {r.menu_item_count}
                        </span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center size-8 shrink-0 rounded-full border border-border bg-surface text-text-muted"
                        title="No menu items"
                        aria-label="No menu items"
                      >
                        <XCircle size={18} weight="regular" className="opacity-50" />
                      </span>
                    )}
                  </td>
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
