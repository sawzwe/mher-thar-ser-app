"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Invalid sign-in link. Please try again.",
  exchange_failed:
    "Sign-in failed. The link may have expired or already been used. Please try again.",
  provider_disabled:
    "This sign-in method is temporarily unavailable. Please try another method.",
  default: "Something went wrong during sign-in. Please try again.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "default";
  const message =
    ERROR_MESSAGES[code] ?? ERROR_MESSAGES.default;

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-[var(--radius-lg)] bg-surface border border-border p-8 text-center space-y-5">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-danger-dim border border-danger-border flex items-center justify-center mx-auto">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 6v4M10 14h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-danger"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-[18px] font-bold text-text-primary mb-2">
            Sign-in error
          </h1>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            Try again
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "md" }), "w-full")}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-[400px] h-40 animate-pulse bg-surface rounded-[var(--radius-lg)]" />
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
