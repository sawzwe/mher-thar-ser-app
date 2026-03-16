"use client";

import Image from "next/image";

export const LOGO_SRC = "/assets/logo/mher_that_ser_logo.png";

export interface LogoProps {
  /** Size in pixels. Default 30. */
  size?: number;
  /** Optional className for the wrapper. */
  className?: string;
  /** Use "cover" to fill container and crop padding; "contain" preserves aspect. */
  objectFit?: "contain" | "cover";
}

export function Logo({ size = 30, className, objectFit = "contain" }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Mher Thar Ser"
      width={size}
      height={size}
      className={className}
      style={{ objectFit, display: "block" }}
    />
  );
}
