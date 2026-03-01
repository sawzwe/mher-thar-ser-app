const MAX_WIDTH = 1200;
const MAX_HEIGHT = 900;
const QUALITY = 0.82;
const OUTPUT_TYPE = "image/webp";

/**
 * Resize and compress an image file client-side using Canvas.
 * Returns a WebP Blob capped at MAX_WIDTH x MAX_HEIGHT.
 * Falls back to JPEG if WebP isn't supported.
 */
export async function resizeImage(
  file: File,
  opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<Blob> {
  const maxW = opts?.maxWidth ?? MAX_WIDTH;
  const maxH = opts?.maxHeight ?? MAX_HEIGHT;
  const q = opts?.quality ?? QUALITY;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxW || height > maxH) {
    const ratio = Math.min(maxW / width, maxH / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvas.convertToBlob({ type: OUTPUT_TYPE, quality: q });

  if (blob.type !== OUTPUT_TYPE) {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality: q });
  }

  return blob;
}

/**
 * Generate a unique filename for an uploaded restaurant image.
 */
export function imageFileName(restaurantSlug: string, suffix = ""): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  const ext = "webp";
  return `${restaurantSlug}/${ts}-${rand}${suffix ? `-${suffix}` : ""}.${ext}`;
}
