import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import * as XLSX from "xlsx";
import {
  mapRowToRestaurant,
  validateRow,
  type ImportRow,
  type RowValidationError,
  type RestaurantInsert,
} from "@/lib/import/restaurantImporter";
import { reuploadExternalImage } from "@/lib/image/serverUpload";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reuploadImages = formData.get("reupload_images") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "Spreadsheet has no sheets" },
        { status: 400 },
      );
    }

    const rows: ImportRow[] = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "File contains no data rows" },
        { status: 400 },
      );
    }

    const allErrors: RowValidationError[] = [];
    for (let i = 0; i < rows.length; i++) {
      const errs = validateRow(rows[i], i);
      allErrors.push(...errs);
    }

    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          imported: 0,
          skipped: rows.length,
          errors: allErrors,
        },
        { status: 422 },
      );
    }

    const inserts: RestaurantInsert[] = rows.map((row) =>
      mapRowToRestaurant(row),
    );

    if (reuploadImages) {
      for (const row of inserts) {
        if (row.image_url) {
          const newUrl = await reuploadExternalImage(row.image_url, row.slug);
          if (newUrl) row.image_url = newUrl;
        }
        if (row.logo_url) {
          const newUrl = await reuploadExternalImage(row.logo_url, row.slug);
          if (newUrl) row.logo_url = newUrl;
        }
      }
    }

    const BATCH_SIZE = 50;
    let imported = 0;
    const upsertErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
      const batch = inserts.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("restaurants")
        .upsert(batch, { onConflict: "slug" })
        .select("id");

      if (error) {
        upsertErrors.push({
          row: i + 2,
          message: `Batch starting at row ${i + 2}: ${error.message}`,
        });
      } else {
        imported += data?.length ?? batch.length;
      }
    }

    return NextResponse.json({
      imported,
      skipped: inserts.length - imported,
      errors: upsertErrors,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 },
    );
  }
}
