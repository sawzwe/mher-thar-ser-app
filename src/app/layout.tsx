import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { GtmScript } from "@/components/MarketingScripts";
import { getIntegrationsForLayout } from "@/lib/integrations/getGtmForLayout";

const pogonia = localFont({
  src: [
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-extralight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-extrabold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/pogonia-modern-font/pogonia-black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-pogonia",
  display: "swap",
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const FAVICON_BASE = "/assets/favicon_io";

const isProdDeployment = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  title: "Mher Thar Ser - Restaurant Booking",
  description: "Discover restaurants, find deals, and book tables instantly.",
  // Preview/local: avoid indexing WIP; production: allow (robots.txt also allows)
  robots: isProdDeployment
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
    : { index: false, follow: false },
  manifest: `${FAVICON_BASE}/site.webmanifest`,
  icons: {
    icon: [
      { url: `${FAVICON_BASE}/favicon.ico`, sizes: "48x48", type: "image/x-icon" },
      { url: `${FAVICON_BASE}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${FAVICON_BASE}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
    ],
    apple: `${FAVICON_BASE}/apple-touch-icon.png`,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { gtmContainerId: gtmId, customScripts } = await getIntegrationsForLayout();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem("mher_thar_ser:lang");if(l==="my"||l==="en")document.documentElement.lang=l;var t=localStorage.getItem("mher_thar_ser:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);else document.documentElement.setAttribute("data-theme","light");}catch(e){}`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${pogonia.variable} ${notoMyanmar.variable} antialiased`}
      >
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height={0}
              width={0}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        {gtmId && <GtmScript gtmContainerId={gtmId} />}
        {/* Custom scripts injected server-side — scripts in SSR HTML execute on load */}
        {customScripts && (
          <div dangerouslySetInnerHTML={{ __html: customScripts }} />
        )}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
