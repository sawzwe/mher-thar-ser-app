"use client";

import Image from "next/image";

/** Vertical wordmark + mascot — primary brand mark for desktop nav and footer. */
export const LOGO_VERTICAL_SRC = "/assets/logo/logo_mascot_text_vertical.png";

/** Horizontal wordmark — best for narrow mobile top bars (legible at small height). */
export const LOGO_HORIZONTAL_SRC = "/assets/logo/logo_mascot_text_horizontal.png";

/** Circle mascot mark — optional (favicons, compact icon-only slots). */
export const LOGO_CIRCLE_SRC = "/assets/logo/logo_mascot_circle.png";

/** Same as vertical wordmark — for `import { LOGO_SRC }` */
export const LOGO_SRC = LOGO_VERTICAL_SRC;

export interface LogoProps {
  /** Max box size in pixels (square). Default 30. Vertical artwork is letterboxed with object-contain. */
  size?: number;
  /** Optional className for the wrapper. */
  className?: string;
  /** Use "cover" to fill container and crop padding; "contain" preserves aspect. */
  objectFit?: "contain" | "cover";
}

export function Logo({ size = 30, className, objectFit = "contain" }: LogoProps) {
  return (
    <Image
      src={LOGO_VERTICAL_SRC}
      alt="Mher Thar Ser"
      width={size}
      height={size}
      className={className}
      style={{ objectFit, display: "block" }}
    />
  );
}
