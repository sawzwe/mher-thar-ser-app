import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const walone = localFont({
  src: [
    {
      path: "../../public/fonts/walone/Z06-Walone Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/walone/Z06-Walone Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/walone/Z06-Walone Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-walone",
  display: "swap",
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Mher Thar Ser - Restaurant Booking",
  description: "Discover restaurants, find deals, and book tables instantly.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        className={`${walone.variable} ${notoMyanmar.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
