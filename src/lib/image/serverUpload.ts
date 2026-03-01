import { createClient } from "@supabase/supabase-js";

const BUCKET = "restaurant-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Download an external image URL and reupload it to Supabase Storage.
 * Returns the new public URL, or null if download/upload fails.
 * Skips images already hosted on our Supabase instance.
 */
export async function reuploadExternalImage(
  externalUrl: string,
  slug: string,
): Promise<string | null> {
  if (!externalUrl) return null;

  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  try {
    const parsed = new URL(externalUrl);
    if (parsed.hostname === supabaseHost) return externalUrl;
  } catch {
    return null;
  }

  try {
    const res = await fetch(externalUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) return null;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    const path = `${slug}/${ts}-${rand}.${ext}`;

    const supabase = getServiceClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, Buffer.from(buffer), {
        contentType,
        upsert: false,
      });

    if (error) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
