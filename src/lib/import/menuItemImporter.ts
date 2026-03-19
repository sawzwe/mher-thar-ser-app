/**
 * Menu item CSV import: Name, Price, Description, Image URL
 * Supports flexible column names (case-insensitive, with/without spaces).
 */

export interface MenuImportRow {
  [key: string]: unknown;
}

export interface MenuItemInsert {
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export interface MenuRowValidationError {
  row: number;
  field: string;
  message: string;
}

const BOM = "\uFEFF";

/** Normalize column key: trim, strip BOM, lowercase, collapse spaces */
function normKey(k: string): string {
  return k
    .replace(BOM, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Map normalized column key -> value from row */
function getCol(row: Record<string, unknown>, ...keys: string[]): unknown {
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [normKey(k), v]),
  );
  for (const key of keys) {
    const k = normKey(key);
    if (lower[k] !== undefined) return lower[k];
  }
  return undefined;
}

function str(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

/** Thai numerals ๐-๙ -> 0-9 */
const THAI_NUM = "๐๑๒๓๔๕๖๗๘๙";
function replaceThaiNumerals(s: string): string {
  return s.replace(/[๐๑๒๓๔๕๖๗๘๙]/g, (c) =>
    String(THAI_NUM.indexOf(c)),
  );
}

/**
 * Parse price: "฿37", "37", "37.50", "37,50", "๓๗", "1,250.50" -> number.
 * Strips all non-digit/decimal characters so encoding differences in currency
 * symbols (฿, $, etc.) don't cause failures.
 */
function parsePrice(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0)
    return raw;
  let s = String(raw).trim();
  if (!s) return null;
  s = replaceThaiNumerals(s);
  // Keep only digits, dot, and comma — everything else (currency symbols, spaces) is stripped
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const commas = (s.match(/,/g) ?? []).length;
  const dots = (s.match(/\./g) ?? []).length;
  if (commas > 0 && dots > 0) {
    // "1,250.50" → comma is thousands separator
    s = s.replace(/,/g, "");
  } else if (commas === 1 && dots === 0) {
    const afterComma = s.split(",")[1] ?? "";
    if (afterComma.length <= 2) {
      // "37,50" → decimal comma
      s = s.replace(",", ".");
    } else {
      // "1,250" → thousands comma
      s = s.replace(",", "");
    }
  }
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function mapRowToMenuItem(row: MenuImportRow): MenuItemInsert {
  const name =
    str(getCol(row, "Name", "name", "Item", "item", "Dish", "dish")) ??
    "Unnamed item";
  const description =
    str(getCol(row, "Description", "description", "Desc", "desc")) ?? null;
  const price =
    parsePrice(
      getCol(row, "Price", "price", "Prices", "Cost", "cost", "Amount", "amount"),
    ) ?? 0;
  const imageUrl =
    str(
      getCol(
        row,
        "Image URL",
        "image url",
        "imageurl",
        "image_url",
        "Image",
        "image",
        "Photo",
        "photo",
      ),
    ) ?? null;

  return {
    name,
    description,
    price,
    image_url: imageUrl,
  };
}

export function validateMenuRow(
  row: MenuImportRow,
  index: number,
): MenuRowValidationError[] {
  const errs: MenuRowValidationError[] = [];

  const name = str(
    getCol(row, "Name", "name", "Item", "item", "Dish", "dish"),
  );
  if (!name) {
    errs.push({ row: index + 2, field: "Name", message: "Name is required" });
  }

  const priceRaw = getCol(
    row,
    "Price",
    "price",
    "Prices",
    "Cost",
    "cost",
    "Amount",
    "amount",
  );
  const price = parsePrice(priceRaw);
  if (priceRaw != null && str(priceRaw) && price === null) {
    errs.push({ row: index + 2, field: "Price", message: "Invalid price" });
  }
  if (price !== null && price < 0) {
    errs.push({ row: index + 2, field: "Price", message: "Price must be >= 0" });
  }

  return errs;
}
