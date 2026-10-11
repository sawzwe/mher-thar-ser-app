import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDishTags } from "@/lib/dishTags";

/**
 * Public list of active dish tags, used to render the filter pills and the
 * admin tag checkboxes. `dish_tags` is world-readable (migration 019);
 * before that migration runs this returns the built-in defaults so the
 * filter still appears.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const tags = await resolveDishTags(supabase);
    return NextResponse.json(tags);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
