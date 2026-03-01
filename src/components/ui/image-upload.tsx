"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { uploadRestaurantImage } from "@/lib/image/upload";
import {
  UploadSimple,
  SpinnerGap,
  Trash,
  ImageSquare,
} from "@phosphor-icons/react";

interface ImageUploadProps {
  value: string;
  slug: string;
  onChange: (url: string) => void;
  label?: string;
  suffix?: string;
}

export function ImageUpload({
  value,
  slug,
  onChange,
  label = "Image",
  suffix,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("File too large (max 20 MB before resize)");
        return;
      }

      setError(null);
      setUploading(true);
      try {
        const targetSlug = slug || "restaurant";
        const result = await uploadRestaurantImage(file, targetSlug, suffix);
        onChange(result.url);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [slug, suffix, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile],
  );

  const handleRemove = () => {
    onChange("");
    setError(null);
  };

  return (
    <div>
      {label && (
        <label className="text-[13px] font-semibold text-text-secondary block mb-1.5">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group rounded-[var(--radius-lg)] overflow-hidden border border-border bg-surface">
          <div className="relative aspect-[16/9]">
            <Image
              src={value}
              alt="Restaurant"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors flex items-center gap-1.5"
            >
              <UploadSimple size={14} weight="bold" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500/30 backdrop-blur rounded-lg text-white text-xs font-medium hover:bg-red-500/50 transition-colors flex items-center gap-1.5"
            >
              <Trash size={14} weight="bold" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-brand bg-brand-dim"
              : "border-border hover:border-brand-border"
          } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <SpinnerGap
                size={32}
                weight="bold"
                className="animate-spin text-brand"
              />
              <p className="text-sm text-text-muted">
                Resizing &amp; uploading...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageSquare
                size={36}
                weight="light"
                className="text-text-muted"
              />
              <p className="text-sm text-text-primary font-medium">
                Drop image or click to browse
              </p>
              <p className="text-xs text-text-muted">
                Auto-resized to 1200px &middot; WebP &middot; max 5 MB output
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && (
        <p className="text-xs text-danger mt-1.5">{error}</p>
      )}
    </div>
  );
}
