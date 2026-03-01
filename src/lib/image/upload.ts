import { createClient } from "@/lib/supabase/client";
import { resizeImage, imageFileName } from "./resize";

const BUCKET = "restaurant-images";

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Resize an image, upload it to Supabase Storage, and return its public URL.
 */
export async function uploadRestaurantImage(
  file: File,
  slug: string,
  suffix?: string,
): Promise<UploadResult> {
  const blob = await resizeImage(file);
  const path = imageFileName(slug, suffix);

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Delete an image from Supabase Storage by its path.
 */
export async function deleteRestaurantImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
