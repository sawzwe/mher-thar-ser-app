"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PROVINCES,
  BANGKOK_DISTRICTS,
  BANGKOK_SUBDISTRICTS_BY_DISTRICT,
} from "@/data/constants";

const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

type LocationApiResponse = {
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

/**
 * Province / district / subdistrict dropdowns for admin restaurant forms.
 * Uses managed taxonomy from DB when available; otherwise Bangkok static lists.
 */
export function useAdminLocationOptions() {
  const { data, isLoading, error } = useQuery<LocationApiResponse>({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/locations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load locations");
      return json as LocationApiResponse;
    },
    staleTime: 30_000,
  });

  const managedEnabled = Boolean(data?.managedEnabled);

  const provinceOptions = useMemo(() => {
    if (managedEnabled && data?.managed.provinces.length) {
      return [...data.managed.provinces.map((p) => p.name)].sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return [...PROVINCES];
  }, [data, managedEnabled]);

  const districtOptionsForProvince = (provinceName: string): string[] => {
    if (managedEnabled && data?.managed.districts.length) {
      const pn = norm(provinceName);
      return data.managed.districts
        .filter((d) => norm(d.provinceName) === pn)
        .map((d) => d.name)
        .sort((a, b) => a.localeCompare(b));
    }
    if (norm(provinceName) === norm("Bangkok")) return [...BANGKOK_DISTRICTS];
    return [];
  };

  const subdistrictOptionsFor = (
    provinceName: string,
    districtName: string,
  ): string[] => {
    if (managedEnabled && data?.managed) {
      const pn = norm(provinceName);
      const dn = norm(districtName);
      const districtRow = data.managed.districts.find(
        (d) => norm(d.provinceName) === pn && norm(d.name) === dn,
      );
      if (!districtRow) return [];
      return data.managed.subdistricts
        .filter((s) => s.districtId === districtRow.id)
        .map((s) => s.name)
        .sort((a, b) => a.localeCompare(b));
    }
    return [...(BANGKOK_SUBDISTRICTS_BY_DISTRICT[districtName] ?? [])];
  };

  return {
    isLoading,
    error,
    managedEnabled,
    provinceOptions,
    districtOptionsForProvince,
    subdistrictOptionsFor,
  };
}
