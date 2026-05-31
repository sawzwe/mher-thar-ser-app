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
    // Serve images directly from source (Supabase Storage) instead of routing
    // them through Vercel's Image Optimization. Our source images are already
    // small WebP files, so optimization adds little benefit — and the Vercel
    // optimizer quota was being exhausted (HTTP 402), which broke image display
    // sitewide. Disabling optimization loads images straight from storage.
    // `next/image` still handles lazy-loading, sizing, and layout stability.
    unoptimized: true,
    // Cache hint for any environment that still proxies images.
    minimumCacheTTL: 31536000,
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
