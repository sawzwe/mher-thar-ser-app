"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import Link from "next/link";

function SignInContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Sign in to continue
      </h1>
      <p className="text-sm text-text-muted mb-6">
        {next !== "/" ? (
          <>Redirecting to {next} after sign in.</>
        ) : (
          <>Sign in to access your account.</>
        )}
      </p>
      <AuthModal
        defaultMode="sign-in"
        onClose={() => window.history.back()}
        redirectTo={next}
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-[400px] h-24 animate-pulse bg-surface rounded" />
        }
      >
        <SignInContent />
      </Suspense>
      <Link
        href="/"
        className="mt-8 text-sm text-text-muted hover:text-brand-light transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
