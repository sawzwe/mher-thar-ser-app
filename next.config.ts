import type { NextConfig } from "next";

/** Hostnames allowed for next/image (must match at build time for Vercel). */
function supabaseImageHosts(): { protocol: "https"; hostname: string }[] {
  const hosts = new Set<string>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      hosts.add(new URL(url).hostname);
    } catch {
      /* ignore */
    }
  }
  return [...hosts].map((hostname) => ({
    protocol: "https" as const,
    hostname,
  }));
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Explicit project host from env at build (Vercel must set NEXT_PUBLIC_SUPABASE_URL for builds).
      ...supabaseImageHosts(),
      // Any Supabase Storage public URL ({ref}.supabase.co) — pathname filter was too strict for some optimizers.
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
