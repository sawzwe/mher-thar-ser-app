import type { Metadata } from "next";
import { PrivacyPolicyClient } from "@/components/PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy — Mher Thar Ser",
  description:
    "How Mher Thar Ser collects, uses, and protects your information when you discover and book Myanmar restaurants in Bangkok.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
