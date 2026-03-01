import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/apiGuard";
import type { VendorUser } from "@/lib/auth/users/VendorUser";

export async function GET() {
  try {
    const { user, supabase } = await requireVendor();

    if (user.type === "admin") {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("name");
      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    const ids = (user as VendorUser).restaurantIds;
    if (ids.length === 0) {
      return NextResponse.json([]);
    }
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .in("id", ids);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
