"use client";

export const LOGO_SRC = "/assets/logo/mher_that_ser_logo.png";

export interface LogoProps {
  /** Size in pixels. Default 30. */
  size?: number;
  /** Optional className for the wrapper. */
  className?: string;
}

export function Logo({ size = 30, className }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Mher Thar Ser"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
