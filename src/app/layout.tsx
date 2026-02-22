import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  style: ["normal", "italic"],
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Hmar Thar Sar - Restaurant Booking",
  description: "Discover restaurants, find deals, and book tables instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${notoMyanmar.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
