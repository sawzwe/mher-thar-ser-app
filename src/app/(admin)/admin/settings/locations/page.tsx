"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

type LocationApiResponse = {
  summary: {
    restaurantsWithAddress: number;
    provinces: number;
    districts: number;
    subdistricts: number;
  };
  provinces: Array<{
    key: string;
    value: string;
    restaurantCount: number;
    districtCount: number;
  }>;
  districts: Array<{
    key: string;
    value: string;
    restaurantCount: number;
    subdistrictCount: number;
  }>;
  subdistricts: Array<{
    key: string;
    value: string;
    restaurantCount: number;
  }>;
  managedEnabled?: boolean;
  managed: {
    provinces: Array<{ id: string; name: string }>;
    districts: Array<{
      id: string;
      name: string;
      provinceId: string;
      provinceName: string;
    }>;
    subdistricts: Array<{
      id: string;
      name: string;
      districtId: string;
      districtName: string;
    }>;
  };
};

export default function AdminLocationsSettingsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<"province" | "district" | "subdistrict">("district");
  const [addName, setAddName] = useState("");
  const [addProvinceId, setAddProvinceId] = useState("");
  const [addDistrictId, setAddDistrictId] = useState("");
  const [expandedProvinceId, setExpandedProvinceId] = useState<string | null>(null);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>(null);
  const [newSubdistrictName, setNewSubdistrictName] = useState("");
  /** Avoid hydration mismatch: React Query `isLoading` differs server vs first client paint. */
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => {
    setClientReady(true);
  }, []);

  const { data, isLoading, error } = useQuery<LocationApiResponse>({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/locations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load locations");
      return json as LocationApiResponse;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: {
      level: "province" | "district" | "subdistrict";
      name: string;
      provinceId?: string;
      districtId?: string;
    }) => {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create location");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      setActionError(null);
    },
    onError: (e) => setActionError((e as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      level: "province" | "district" | "subdistrict";
      id: string;
      name: string;
    }) => {
      const res = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to rename location");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      setActionError(null);
    },
    onError: (e) => setActionError((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: {
      level: "province" | "district" | "subdistrict";
      id: string;
    }) => {
      const res = await fetch("/api/admin/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete location");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      setActionError(null);
    },
    onError: (e) => setActionError((e as Error).message),
  });

  const primeAddModalDefaults = (managed: LocationApiResponse["managed"]) => {
    const firstProvince = managed.provinces[0]?.id ?? "";
    setAddProvinceId(firstProvince);
    const firstDistrict =
      managed.districts.find((d) => d.provinceId === firstProvince)?.id ??
      managed.districts[0]?.id ??
      "";
    setAddDistrictId(firstDistrict);
  };

  const openAddModal = () => {
    setAddModalOpen(true);
    setAddType("district");
    setAddName("");
    if (data?.managedEnabled && data.managed.provinces.length > 0) {
      primeAddModalDefaults(data.managed);
    }
  };

  const resetAddModalForm = () => {
    setAddName("");
    setAddType("district");
    if (data?.managedEnabled && data.managed.provinces.length > 0) {
      primeAddModalDefaults(data.managed);
    }
  };

  const saveFromModal = () => {
    const name = addName.trim();
    if (!name) return;

    const onSuccess = () => {
      setAddModalOpen(false);
      resetAddModalForm();
    };

    if (addType === "province") {
      addMutation.mutate({ level: "province", name }, { onSuccess });
      return;
    }
    if (addType === "district") {
      if (!addProvinceId) return;
      addMutation.mutate(
        { level: "district", name, provinceId: addProvinceId },
        { onSuccess }
      );
      return;
    }
    if (!addDistrictId) return;
    addMutation.mutate(
      { level: "subdistrict", name, districtId: addDistrictId },
      { onSuccess }
    );
  };

  const addDistrictUnderProvince = (provinceId: string) => {
    if (!newDistrictName.trim() || !provinceId) return;
    addMutation.mutate({
      level: "district",
      name: newDistrictName,
      provinceId,
    });
    setNewDistrictName("");
    setExpandedProvinceId(null);
  };

  const addSubdistrictUnderDistrict = (districtId: string) => {
    if (!newSubdistrictName.trim() || !districtId) return;
    addMutation.mutate({
      level: "subdistrict",
      name: newSubdistrictName,
      districtId,
    });
    setNewSubdistrictName("");
    setExpandedDistrictId(null);
  };

  const renameItem = (
    level: "province" | "district" | "subdistrict",
    id: string,
    currentName: string
  ) => {
    const next = window.prompt(`Rename ${level}`, currentName)?.trim();
    if (!next || next === currentName) return;
    updateMutation.mutate({ level, id, name: next });
  };

  const deleteItem = (
    level: "province" | "district" | "subdistrict",
    id: string,
    name: string
  ) => {
    const ok = window.confirm(`Delete ${level} "${name}"?`);
    if (!ok) return;
    deleteMutation.mutate({ level, id });
  };

  return (
    <div className="p-6 sm:p-8 animate-admin-enter max-w-5xl w-full min-w-0">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/restaurants/new"
          className="text-[13px] text-text-muted hover:text-text-primary"
        >
          ← Back to new restaurant
        </Link>
      </div>

      <AdminPageHeader
        title="Location"
        titleEm="settings"
        subtitle="Edit the shared province → district → subdistrict tree. Restaurant forms read from this list."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={openAddModal} disabled={clientReady && isLoading}>
          Add location
        </Button>
      </div>

      {isLoading && (
        <div className="mt-6 bg-card border border-border rounded-[var(--radius-xl)] p-6">
          <p className="text-sm text-text-muted">Loading address data…</p>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-card border border-danger-border rounded-[var(--radius-xl)] p-6">
          <p className="text-sm text-danger">{(error as Error).message}</p>
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <p className="text-xs text-text-muted leading-relaxed max-w-xl">
                {data.managedEnabled ? (
                  <>
                    Child rows need a parent. Duplicate names under the same parent are blocked
                    (case-insensitive).
                  </>
                ) : (
                  <>
                    Managed taxonomy is off in this environment. Use restaurant forms for
                    province / district / subdistrict until tables are enabled.
                  </>
                )}
              </p>
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted tabular-nums shrink-0">
                <div>
                  <dt className="inline text-text-muted">Scanned </dt>
                  <dd className="inline font-medium text-text-secondary">
                    {data.summary.restaurantsWithAddress}
                  </dd>
                </div>
                <div>
                  <dt className="inline">Prov. </dt>
                  <dd className="inline font-medium text-text-secondary">
                    {data.summary.provinces}
                  </dd>
                </div>
                <div>
                  <dt className="inline">Dist. </dt>
                  <dd className="inline font-medium text-text-secondary">
                    {data.summary.districts}
                  </dd>
                </div>
                <div>
                  <dt className="inline">Subdist. </dt>
                  <dd className="inline font-medium text-text-secondary">
                    {data.summary.subdistricts}
                  </dd>
                </div>
              </dl>
            </div>
            {actionError && (
              <p className="mt-3 text-sm text-danger bg-danger-dim px-3 py-2 border border-danger-border rounded-[var(--radius-md)]">
                {actionError}
              </p>
            )}
          </div>

          {data.managedEnabled && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 min-w-0">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Address tree</h2>
              <div className="divide-y divide-border">
                {data.managed.provinces.map((province) => {
                  const districts = data.managed.districts.filter(
                    (d) => d.provinceId === province.id
                  );
                  return (
                    <div key={province.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <span className="text-[15px] font-semibold text-text-primary break-words">
                            {province.name}
                          </span>
                          <span className="text-xs text-text-muted ml-2">
                            {districts.length} district{districts.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setExpandedProvinceId((prev) =>
                                prev === province.id ? null : province.id
                              );
                              setNewDistrictName("");
                            }}
                          >
                            + District
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => renameItem("province", province.id, province.name)}
                          >
                            Rename
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem("province", province.id, province.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      {expandedProvinceId === province.id && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:max-w-xl">
                          <input
                            value={newDistrictName}
                            onChange={(e) => setNewDistrictName(e.target.value)}
                            placeholder={`New district under ${province.name}`}
                            className="min-w-0 flex-1 h-9 px-3 bg-bg text-[13px] text-text-primary placeholder:text-text-muted border border-border rounded-[var(--radius-md)] outline-none focus:border-brand"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addDistrictUnderProvince(province.id)}
                            disabled={addMutation.isPending || !newDistrictName.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      <div className="mt-3 ml-1 pl-3 border-l border-border space-y-3">
                        {districts.length === 0 && (
                          <p className="text-xs text-text-muted">No districts yet.</p>
                        )}
                        {districts.map((district) => {
                          const subdistricts = data.managed.subdistricts.filter(
                            (s) => s.districtId === district.id
                          );
                          return (
                            <div key={district.id} className="min-w-0">
                              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-text-primary break-words">
                                    {district.name}
                                  </span>
                                  <span className="text-xs text-text-muted ml-2">
                                    {subdistricts.length} subdist.
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 shrink-0">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setExpandedDistrictId((prev) =>
                                        prev === district.id ? null : district.id
                                      );
                                      setNewSubdistrictName("");
                                    }}
                                  >
                                    + Subdist.
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      renameItem("district", district.id, district.name)
                                    }
                                  >
                                    Rename
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      deleteItem("district", district.id, district.name)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              {expandedDistrictId === district.id && (
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:max-w-lg">
                                  <input
                                    value={newSubdistrictName}
                                    onChange={(e) => setNewSubdistrictName(e.target.value)}
                                    placeholder={`New subdistrict under ${district.name}`}
                                    className="min-w-0 flex-1 h-9 px-3 bg-bg text-[13px] text-text-primary placeholder:text-text-muted border border-border rounded-[var(--radius-md)] outline-none focus:border-brand"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addSubdistrictUnderDistrict(district.id)}
                                    disabled={addMutation.isPending || !newSubdistrictName.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              )}
                              {subdistricts.length > 0 && (
                                <ul className="mt-2 space-y-1 border-l border-border/80 pl-2.5 ml-0.5">
                                  {subdistricts.map((s) => (
                                    <li
                                      key={s.id}
                                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-[13px] text-text-secondary py-0.5"
                                    >
                                      <span className="break-words min-w-0 pr-2">{s.name}</span>
                                      <div className="flex flex-wrap gap-1 shrink-0">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            renameItem("subdistrict", s.id, s.name)
                                          }
                                        >
                                          Rename
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteItem("subdistrict", s.id, s.name)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {data.managed.provinces.length === 0 && (
                  <p className="text-sm text-text-muted py-2">No managed provinces yet.</p>
                )}
              </div>
            </div>
          )}

          <details className="rounded-[var(--radius-lg)] border border-border bg-card min-w-0 group">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-text-primary flex items-center justify-between gap-2 hover:bg-surface/50 rounded-[var(--radius-lg)] [&::-webkit-details-marker]:hidden">
              <span>In use on restaurant rows (audit)</span>
              <span className="text-xs font-normal text-text-muted shrink-0">
                {data.provinces.length + data.districts.length + data.subdistricts.length} values
              </span>
            </summary>
            <div className="px-4 pb-4 pt-0 border-t border-border space-y-4">
              <p className="text-[11px] text-text-muted pt-2">
                Read-only text values from restaurants; use to spot typos or duplicates.
              </p>
              <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Provinces
              </h3>
              <ul className="divide-y divide-border border border-border rounded-[var(--radius-md)] overflow-hidden">
                {data.provinces.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-[13px] px-3 py-2 bg-surface/40"
                  >
                    <span className="text-text-primary break-words min-w-0">{row.value}</span>
                    <span className="text-text-muted shrink-0 tabular-nums">
                      {row.districtCount} dist. · {row.restaurantCount} rest.
                    </span>
                  </li>
                ))}
                {data.provinces.length === 0 && (
                  <li className="px-3 py-2 text-sm text-text-muted">None yet.</li>
                )}
              </ul>
              </div>
              <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Districts
              </h3>
              <ul className="divide-y divide-border border border-border rounded-[var(--radius-md)] overflow-hidden">
                {data.districts.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-[13px] px-3 py-2 bg-surface/40"
                  >
                    <span className="text-text-primary break-words min-w-0">{row.value}</span>
                    <span className="text-text-muted shrink-0 tabular-nums">
                      {row.subdistrictCount} subdist. · {row.restaurantCount} rest.
                    </span>
                  </li>
                ))}
                {data.districts.length === 0 && (
                  <li className="px-3 py-2 text-sm text-text-muted">None yet.</li>
                )}
              </ul>
              </div>
              <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Subdistricts
              </h3>
              <ul className="divide-y divide-border border border-border rounded-[var(--radius-md)] overflow-hidden">
                {data.subdistricts.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-[13px] px-3 py-2 bg-surface/40"
                  >
                    <span className="text-text-primary break-words min-w-0">{row.value}</span>
                    <span className="text-text-muted shrink-0 tabular-nums">
                      {row.restaurantCount} rest.
                    </span>
                  </li>
                ))}
                {data.subdistricts.length === 0 && (
                  <li className="px-3 py-2 text-sm text-text-muted">None yet.</li>
                )}
              </ul>
              </div>
            </div>
          </details>
        </div>
      )}

      {data && addModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-surface border border-border rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">Add location</h3>
              <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
                Close
              </Button>
            </div>

            {!data.managedEnabled ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Managed location tables are not enabled in this environment yet, so this popup
                  cannot save shared location data.
                </p>
                <p className="text-sm text-text-muted">
                  For now, add new district/subdistrict from the restaurant form while creating or
                  editing a restaurant.
                </p>
                <Link href="/admin/restaurants/new">
                  <Button type="button">Open new restaurant form</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-text-secondary block mb-2">
                    Type
                  </label>
                  <select
                    value={addType}
                    onChange={(e) =>
                      setAddType(e.target.value as "province" | "district" | "subdistrict")
                    }
                    className="w-full h-11 pl-4 pr-10 bg-card border border-border-strong rounded-[var(--radius-md)] text-[13px] text-text-secondary outline-none focus:border-brand"
                  >
                    <option value="province">Province</option>
                    <option value="district">District</option>
                    <option value="subdistrict">Subdistrict</option>
                  </select>
                </div>

                {addType !== "province" && (
                  <div>
                    <label className="text-[13px] font-semibold text-text-secondary block mb-2">
                      Province
                    </label>
                    <select
                      value={addProvinceId}
                      onChange={(e) => {
                        const nextProvinceId = e.target.value;
                        setAddProvinceId(nextProvinceId);
                        const firstDistrictForProvince =
                          data.managed.districts.find((d) => d.provinceId === nextProvinceId)
                            ?.id ?? "";
                        setAddDistrictId(firstDistrictForProvince);
                      }}
                      className="w-full h-11 pl-4 pr-10 bg-card border border-border-strong rounded-[var(--radius-md)] text-[13px] text-text-secondary outline-none focus:border-brand"
                    >
                      <option value="">Select province</option>
                      {data.managed.provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {addType === "subdistrict" && (
                  <div>
                    <label className="text-[13px] font-semibold text-text-secondary block mb-2">
                      District
                    </label>
                    <select
                      value={addDistrictId}
                      onChange={(e) => setAddDistrictId(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 bg-card border border-border-strong rounded-[var(--radius-md)] text-[13px] text-text-secondary outline-none focus:border-brand"
                    >
                      <option value="">Select district</option>
                      {data.managed.districts
                        .filter((d) => !addProvinceId || d.provinceId === addProvinceId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[13px] font-semibold text-text-secondary block mb-2">
                    Name
                  </label>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder={
                      addType === "province"
                        ? "e.g. Chiang Mai"
                        : addType === "district"
                          ? "e.g. Mueang Chiang Mai"
                          : "e.g. Si Phum"
                    }
                    className="w-full h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={saveFromModal}
                    disabled={
                      addMutation.isPending ||
                      !addName.trim() ||
                      (addType !== "province" && !addProvinceId) ||
                      (addType === "subdistrict" && !addDistrictId)
                    }
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
