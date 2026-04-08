import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

type LocationRow = {
  province: string | null;
  district: string | null;
  subdistrict: string | null;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function displayLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeName(value: string): string {
  const cleaned = displayLabel(value).toLowerCase();
  return cleaned
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("restaurants")
      .select("province, district, subdistrict");

    if (error) throw error;

    const rows = (data ?? []) as LocationRow[];

    const provincesMap = new Map<string, { value: string; count: number }>();
    const districtsMap = new Map<string, { value: string; count: number }>();
    const subdistrictsMap = new Map<string, { value: string; count: number }>();

    const districtsByProvinceMap = new Map<string, Set<string>>();
    const subdistrictsByDistrictMap = new Map<string, Set<string>>();

    for (const row of rows) {
      const provinceRaw = row.province?.trim() ?? "";
      const districtRaw = row.district?.trim() ?? "";
      const subdistrictRaw = row.subdistrict?.trim() ?? "";

      if (provinceRaw) {
        const key = normalizeKey(provinceRaw);
        const current = provincesMap.get(key);
        if (current) current.count += 1;
        else provincesMap.set(key, { value: displayLabel(provinceRaw), count: 1 });
      }

      if (districtRaw) {
        const key = normalizeKey(districtRaw);
        const current = districtsMap.get(key);
        if (current) current.count += 1;
        else districtsMap.set(key, { value: displayLabel(districtRaw), count: 1 });
      }

      if (subdistrictRaw) {
        const key = normalizeKey(subdistrictRaw);
        const current = subdistrictsMap.get(key);
        if (current) current.count += 1;
        else subdistrictsMap.set(key, { value: displayLabel(subdistrictRaw), count: 1 });
      }

      if (provinceRaw && districtRaw) {
        const provinceKey = normalizeKey(provinceRaw);
        const districtValue = displayLabel(districtRaw);
        const set = districtsByProvinceMap.get(provinceKey) ?? new Set<string>();
        set.add(districtValue);
        districtsByProvinceMap.set(provinceKey, set);
      }

      if (districtRaw && subdistrictRaw) {
        const districtKey = normalizeKey(districtRaw);
        const subdistrictValue = displayLabel(subdistrictRaw);
        const set = subdistrictsByDistrictMap.get(districtKey) ?? new Set<string>();
        set.add(subdistrictValue);
        subdistrictsByDistrictMap.set(districtKey, set);
      }
    }

    const provinces = [...provincesMap.entries()]
      .map(([key, item]) => ({
        key,
        value: item.value,
        restaurantCount: item.count,
        districtCount: (districtsByProvinceMap.get(key)?.size ?? 0),
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    const districts = [...districtsMap.entries()]
      .map(([key, item]) => ({
        key,
        value: item.value,
        restaurantCount: item.count,
        subdistrictCount: (subdistrictsByDistrictMap.get(key)?.size ?? 0),
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    const subdistricts = [...subdistrictsMap.entries()]
      .map(([key, item]) => ({
        key,
        value: item.value,
        restaurantCount: item.count,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    let managedEnabled = true;
    let managedProvinces: { id: string; name: string }[] = [];
    let managedDistricts: {
      id: string;
      name: string;
      provinceId: string;
      provinceName: string;
    }[] = [];
    let managedSubdistricts: {
      id: string;
      name: string;
      districtId: string;
      districtName: string;
    }[] = [];

    try {
      const { data: pData, error: pError } = await supabase
        .from("address_provinces")
        .select("id, name")
        .order("name");
      if (pError) throw pError;

      const { data: dData, error: dError } = await supabase
        .from("address_districts")
        .select("id, name, province_id")
        .order("name");
      if (dError) throw dError;

      const { data: sData, error: sError } = await supabase
        .from("address_subdistricts")
        .select("id, name, district_id")
        .order("name");
      if (sError) throw sError;

      const provinceNameById = new Map<string, string>();
      for (const row of pData ?? []) {
        const r = row as { id: string; name: string };
        provinceNameById.set(String(r.id), String(r.name ?? ""));
      }

      const districtNameById = new Map<string, string>();
      for (const row of dData ?? []) {
        const r = row as { id: string; name: string };
        districtNameById.set(String(r.id), String(r.name ?? ""));
      }

      managedProvinces = (pData ?? []).map((row) => {
        const r = row as { id: string; name: string };
        return { id: String(r.id), name: String(r.name ?? "") };
      });

      managedDistricts = (dData ?? []).map((row) => {
        const r = row as { id: string; name: string; province_id: string };
        const pid = String(r.province_id ?? "");
        return {
          id: String(r.id),
          name: String(r.name ?? ""),
          provinceId: pid,
          provinceName: provinceNameById.get(pid) ?? "",
        };
      });

      managedSubdistricts = (sData ?? []).map((row) => {
        const r = row as { id: string; name: string; district_id: string };
        const did = String(r.district_id ?? "");
        return {
          id: String(r.id),
          name: String(r.name ?? ""),
          districtId: did,
          districtName: districtNameById.get(did) ?? "",
        };
      });
    } catch {
      managedEnabled = false;
    }

    return NextResponse.json({
      summary: {
        restaurantsWithAddress: rows.length,
        provinces: provinces.length,
        districts: districts.length,
        subdistricts: subdistricts.length,
      },
      provinces,
      districts,
      subdistricts,
      managedEnabled,
      managed: {
        provinces: managedProvinces,
        districts: managedDistricts,
        subdistricts: managedSubdistricts,
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

type CreateLocationBody = {
  level: "province" | "district" | "subdistrict";
  name: string;
  provinceId?: string;
  districtId?: string;
};

export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await req.json()) as CreateLocationBody;

    const name = normalizeName(body.name ?? "");
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (body.level === "province") {
      const { data, error } = await supabase
        .from("address_provinces")
        .insert({ name })
        .select("id, name")
        .single();
      if (error) throw error;
      return NextResponse.json({ created: data });
    }

    if (body.level === "district") {
      if (!body.provinceId) {
        return NextResponse.json(
          { error: "provinceId is required for district." },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from("address_districts")
        .insert({ name, province_id: body.provinceId })
        .select("id, name, province_id")
        .single();
      if (error) throw error;
      return NextResponse.json({ created: data });
    }

    if (!body.districtId) {
      return NextResponse.json(
        { error: "districtId is required for subdistrict." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("address_subdistricts")
      .insert({ name, district_id: body.districtId })
      .select("id, name, district_id")
      .single();
    if (error) throw error;
    return NextResponse.json({ created: data });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (/address_(provinces|districts|subdistricts)/i.test(e.message)) {
      return NextResponse.json(
        {
          error:
            "Managed location tables are not enabled yet in this environment. Use restaurant form cascading add for now.",
        },
        { status: 400 }
      );
    }
    const message = /duplicate key/i.test(e.message)
      ? "This location already exists (case-insensitive) under the same parent."
      : e.message;
    return NextResponse.json({ error: message }, { status: e.status ?? 500 });
  }
}

type UpdateLocationBody = {
  level: "province" | "district" | "subdistrict";
  id: string;
  name: string;
};

export async function PATCH(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await req.json()) as UpdateLocationBody;

    const id = body.id?.trim();
    const name = normalizeName(body.name ?? "");
    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required." }, { status: 400 });
    }

    if (body.level === "province") {
      const { error } = await supabase.from("address_provinces").update({ name }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.level === "district") {
      const { error } = await supabase.from("address_districts").update({ name }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from("address_subdistricts").update({ name }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (/address_(provinces|districts|subdistricts)/i.test(e.message)) {
      return NextResponse.json(
        { error: "Managed location tables are not enabled in this environment." },
        { status: 400 }
      );
    }
    const message = /duplicate key/i.test(e.message)
      ? "A location with this name already exists under the same parent."
      : e.message;
    return NextResponse.json({ error: message }, { status: e.status ?? 500 });
  }
}

type DeleteLocationBody = {
  level: "province" | "district" | "subdistrict";
  id: string;
};

export async function DELETE(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await req.json()) as DeleteLocationBody;
    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    if (body.level === "province") {
      const { data: province, error: pErr } = await supabase
        .from("address_provinces")
        .select("name")
        .eq("id", id)
        .single();
      if (pErr) throw pErr;

      const { count: childCount, error: cErr } = await supabase
        .from("address_districts")
        .select("id", { count: "exact", head: true })
        .eq("province_id", id);
      if (cErr) throw cErr;
      if ((childCount ?? 0) > 0) {
        return NextResponse.json(
          { error: "Cannot delete province with districts. Delete/move districts first." },
          { status: 400 }
        );
      }

      const { count: usageCount, error: uErr } = await supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .ilike("province", province.name);
      if (uErr) throw uErr;
      if ((usageCount ?? 0) > 0) {
        return NextResponse.json(
          { error: "Cannot delete province used by restaurants." },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("address_provinces").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.level === "district") {
      const { data: district, error: dErr } = await supabase
        .from("address_districts")
        .select("name")
        .eq("id", id)
        .single();
      if (dErr) throw dErr;

      const { count: childCount, error: cErr } = await supabase
        .from("address_subdistricts")
        .select("id", { count: "exact", head: true })
        .eq("district_id", id);
      if (cErr) throw cErr;
      if ((childCount ?? 0) > 0) {
        return NextResponse.json(
          { error: "Cannot delete district with subdistricts. Delete subdistricts first." },
          { status: 400 }
        );
      }

      const { count: usageCount, error: uErr } = await supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .ilike("district", district.name);
      if (uErr) throw uErr;
      if ((usageCount ?? 0) > 0) {
        return NextResponse.json(
          { error: "Cannot delete district used by restaurants." },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("address_districts").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const { data: subdistrict, error: sErr } = await supabase
      .from("address_subdistricts")
      .select("name")
      .eq("id", id)
      .single();
    if (sErr) throw sErr;

    const { count: usageCount, error: uErr } = await supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .ilike("subdistrict", subdistrict.name);
    if (uErr) throw uErr;
    if ((usageCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete subdistrict used by restaurants." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("address_subdistricts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (/address_(provinces|districts|subdistricts)/i.test(e.message)) {
      return NextResponse.json(
        { error: "Managed location tables are not enabled in this environment." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
