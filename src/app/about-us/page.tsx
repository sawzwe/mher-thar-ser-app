import type { Metadata } from "next";
import { AboutUsClient } from "@/components/AboutUsClient";

export const metadata: Metadata = {
  title: "About Us — Mher Thar Ser",
  description:
    "Mher Thar Ser is a Myanmar restaurant directory built by Myanmar people in Thailand — making it easy to find a taste of home and helping restaurant owners grow their online presence.",
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}
