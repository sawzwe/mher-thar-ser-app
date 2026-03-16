import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";

  // Prevent open redirect: next must be a relative path starting with exactly one slash.
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Resolve the base URL for the final redirect.
  // In production on Vercel, x-forwarded-host is set by the platform.
  // NEXT_PUBLIC_SITE_URL is the most reliable source.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const forwardedHost = (request as Request & { headers: Headers }).headers.get(
    "x-forwarded-host",
  );
  const baseUrl = siteUrl || (forwardedHost ? `https://${forwardedHost}` : origin);

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/error?code=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${baseUrl}/auth/error?code=exchange_failed`,
    );
  }

  return NextResponse.redirect(`${baseUrl}${safeNext}`);
}
