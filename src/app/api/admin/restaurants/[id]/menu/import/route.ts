import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { fetchMenu, replaceMenu } from "@/lib/menu/menuApi";
import type { MenuCategoryInput } from "@/lib/menu/menuApi";
import {
  mapRowToMenuItem,
  validateMenuRow,
  type MenuImportRow,
  type MenuItemInsert,
  type MenuRowValidationError,
} from "@/lib/import/menuItemImporter";
import { reuploadExternalImage } from "@/lib/image/serverUpload";

type Params = { params: Promise<{ id: string }> };

type SseEvent =
  | { type: "parsed"; total: number }
  | { type: "progress"; phase: "images"; current: number; total: number; item: string }
  | { type: "saving" }
  | { type: "done"; imported: number; category: string }
  | { type: "validation_errors"; errors: MenuRowValidationError[] }
  | { type: "error"; message: string };

function sseChunk(event: SseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request, { params }: Params) {
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SseEvent) => controller.enqueue(sseChunk(event));
      const abort = (msg: string) => {
        send({ type: "error", message: msg });
        controller.close();
      };

      try {
        const { supabase } = await requireAdmin();
        const { id: restaurantId } = await params;

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const categoryName = (formData.get("category_name") as string) || "Menu";
        const reuploadImages = formData.get("reupload_images") !== "false";

        if (!file) return abort("No file uploaded");

        const { data: restaurant, error: restErr } = await supabase
          .from("restaurants")
          .select("id, slug")
          .eq("id", restaurantId)
          .single();

        if (restErr || !restaurant) return abort("Restaurant not found");

        const slug = restaurant.slug || restaurantId;

        // Parse file
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = (file.name || "").toLowerCase();
        const readOpts: { type: "buffer"; FS?: string } = { type: "buffer" };
        if (fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
          readOpts.FS = "\t";
        } else if (fileName.endsWith(".csv")) {
          const firstLine = buffer.subarray(0, 500).toString("utf8").split("\n")[0] ?? "";
          if (firstLine.includes("\t") && !firstLine.includes(",")) {
            readOpts.FS = "\t";
          } else if (firstLine.includes(";") && !firstLine.includes(",")) {
            readOpts.FS = ";";
          }
        }

        const workbook = XLSX.read(buffer, readOpts);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return abort("File has no sheets");

        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as MenuImportRow[];
        if (rows.length === 0) return abort("File contains no data rows");

        // Validate all rows up-front
        const allErrors: MenuRowValidationError[] = [];
        for (let i = 0; i < rows.length; i++) {
          allErrors.push(...validateMenuRow(rows[i], i));
        }
        if (allErrors.length > 0) {
          send({ type: "validation_errors", errors: allErrors });
          controller.close();
          return;
        }

        const inserts: MenuItemInsert[] = rows.map((row) => mapRowToMenuItem(row));
        send({ type: "parsed", total: inserts.length });

        // Download and save images with per-item progress
        if (reuploadImages) {
          const withImages = inserts.filter((i) => !!i.image_url);
          const total = withImages.length;
          let current = 0;
          const storagePrefix = `${slug}/menu`;

          for (const item of inserts) {
            if (!item.image_url) continue;
            current++;
            send({ type: "progress", phase: "images", current, total, item: item.name });
            const newUrl = await reuploadExternalImage(item.image_url, storagePrefix);
            if (newUrl) item.image_url = newUrl;
          }
        }

        // Save to DB
        send({ type: "saving" });
        const existingMenu = await fetchMenu(supabase, restaurantId);
        const newCategory: MenuCategoryInput = {
          name: categoryName,
          items: inserts.map((i) => ({
            name: i.name,
            description: i.description ?? undefined,
            price: i.price,
            image_url: i.image_url ?? undefined,
          })),
        };
        await replaceMenu(supabase, restaurantId, [...existingMenu, newCategory]);

        send({ type: "done", imported: inserts.length, category: categoryName });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
