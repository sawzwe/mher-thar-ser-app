"use client";

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  UploadSimple,
  FileXls,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  X,
  SpinnerGap,
} from "@phosphor-icons/react";
import Link from "next/link";

type PreviewRow = Record<string, unknown>;

type ImportResult = {
  imported: number;
  skipped: number;
  errors: { row: number; field?: string; message: string }[];
};

const COLUMN_MAP: Record<string, string> = {
  name: "Name",
  latitude: "Latitude",
  longitude: "Longitude",
  photo: "Image URL",
  state: "Province",
  District: "District",
  "Sub District": "Sub-district",
  street: "Address",
  postal_code: "Postal Code",
  phone: "Phone",
  website: "Website",
  email_1: "Email",
  facebook: "Facebook",
  instagram: "Instagram",
  type: "Restaurant Type",
  working_hours: "Working Hours",
  rating: "Google Rating",
  reviews: "Review Count",
  place_id: "Google Place ID",
};

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [reuploadImages, setReuploadImages] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          setParseError("No sheets found in file");
          return;
        }
        const rows: PreviewRow[] = XLSX.utils.sheet_to_json(sheet);
        setTotalRows(rows.length);
        setColumns(rows.length > 0 ? Object.keys(rows[0]) : []);
        setPreview(rows.slice(0, 5));
      } catch {
        setParseError("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (reuploadImages) formData.append("reupload_images", "true");
      const res = await fetch("/api/admin/restaurants/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok && json.error) {
        setResult({
          imported: 0,
          skipped: totalRows,
          errors: [{ row: 0, message: json.error }],
        });
      } else {
        setResult(json as ImportResult);
      }
    } catch (err) {
      setResult({
        imported: 0,
        skipped: totalRows,
        errors: [{ row: 0, message: (err as Error).message }],
      });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setColumns([]);
    setTotalRows(0);
    setResult(null);
    setParseError(null);
    setReuploadImages(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="p-8 animate-admin-enter">
      <AdminPageHeader
        title="Import Restaurants"
        subtitle="Upload a CSV or XLSX file to bulk import restaurant data."
        action={
          <Link
            href="/admin/restaurants"
            className="text-sm text-brand-light hover:underline"
          >
            Back to list
          </Link>
        }
      />

      {/* Upload zone */}
      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-card border-2 border-dashed border-border rounded-[14px] p-12 text-center hover:border-brand transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <UploadSimple
            size={48}
            weight="light"
            className="mx-auto mb-4 text-text-muted"
          />
          <p className="text-text-primary font-medium mb-1">
            Drop your file here or click to browse
          </p>
          <p className="text-text-muted text-sm">
            Supports .csv, .xlsx, .xls
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="bg-danger-dim border border-danger rounded-[14px] p-4 mt-4 flex items-center gap-3">
          <WarningCircle size={20} className="text-danger shrink-0" />
          <span className="text-danger text-sm">{parseError}</span>
        </div>
      )}

      {/* File info + preview */}
      {file && !result && (
        <div className="mt-6 space-y-6">
          {/* File card */}
          <div className="bg-card border border-border rounded-[14px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileXls
                size={32}
                weight="duotone"
                className="text-brand"
              />
              <div>
                <p className="font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-muted">
                  {totalRows} rows &middot;{" "}
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-lg hover:bg-surface transition-colors"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          {/* Column mapping */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Column Mapping
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {columns.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface"
                >
                  <span className="text-text-muted truncate">{col}</span>
                  {COLUMN_MAP[col] && (
                    <>
                      <ArrowRight
                        size={12}
                        className="text-text-muted shrink-0"
                      />
                      <span className="text-brand font-medium truncate">
                        {COLUMN_MAP[col]}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">
                  Preview (first {preview.length} rows)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface">
                      {["name", "latitude", "longitude", "type", "phone", "District"].map(
                        (col) =>
                          columns.includes(col) && (
                            <th
                              key={col}
                              className="text-left font-bold text-text-muted uppercase px-4 py-2.5"
                            >
                              {col}
                            </th>
                          ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-border"
                      >
                        {["name", "latitude", "longitude", "type", "phone", "District"].map(
                          (col) =>
                            columns.includes(col) && (
                              <td
                                key={col}
                                className="px-4 py-2 text-text-secondary max-w-[200px] truncate"
                              >
                                {String(row[col] ?? "")}
                              </td>
                            ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Options */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={reuploadImages}
              onChange={(e) => setReuploadImages(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-brand"
            />
            <span className="text-sm text-text-primary">
              Download &amp; store images in Supabase
            </span>
            <span className="text-xs text-text-muted">
              (copies external images to your storage)
            </span>
          </label>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {importing ? (
              <>
                <SpinnerGap size={18} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadSimple size={18} weight="bold" />
                Import {totalRows} restaurants
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Success summary */}
          {result.imported > 0 && (
            <div className="bg-success-dim border border-success rounded-[14px] p-4 flex items-center gap-3">
              <CheckCircle
                size={24}
                weight="fill"
                className="text-success shrink-0"
              />
              <div>
                <p className="font-semibold text-success">
                  Successfully imported {result.imported} restaurants
                </p>
                {result.skipped > 0 && (
                  <p className="text-success text-sm mt-0.5">
                    {result.skipped} skipped
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-danger-dim border border-danger rounded-[14px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <WarningCircle
                  size={20}
                  weight="fill"
                  className="text-danger"
                />
                <p className="font-semibold text-danger">
                  {result.errors.length} error
                  {result.errors.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ul className="space-y-1 text-sm text-danger max-h-60 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>
                    {err.row > 0 && (
                      <span className="font-medium">Row {err.row}: </span>
                    )}
                    {err.field && (
                      <span className="font-medium">[{err.field}] </span>
                    )}
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-surface border border-border text-text-primary hover:bg-card transition-colors"
            >
              Import another file
            </button>
            <Link
              href="/admin/restaurants"
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-hover transition-colors"
            >
              View restaurants
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
