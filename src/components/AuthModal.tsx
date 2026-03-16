"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { authConfig, type AuthProvider } from "@/lib/auth/config";

type AuthMode = "sign-in" | "sign-up";

function formatAuthError(code?: string, fallback?: string): string {
  if (code === "email_address_invalid") {
    return "That email format isn't accepted. Try one like you@example.com or yourname@gmail.com.";
  }
  if (code === "over_email_send_rate_limit") {
    return 'Too many sign-up emails sent. Wait an hour or, in development, turn off "Confirm email" in Supabase → Authentication.';
  }
  return fallback ?? "Something went wrong.";
}

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: AuthMode;
  /** When set, redirect here after successful sign-in (e.g. from /sign-in?next=/vendor) */
  redirectTo?: string;
}

// Per-provider SVG icons (minimal, brand-safe)
const ProviderIcon = ({ provider }: { provider: AuthProvider }) => {
  if (provider === "google") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
      </svg>
    );
  }
  if (provider === "apple") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M12.52 0c.07.9-.26 1.8-.77 2.49-.5.68-1.3 1.2-2.12 1.14-.09-.87.27-1.77.75-2.41C10.87.57 11.72.07 12.52 0ZM15.5 12.37c-.31.72-.46 1.04-.86 1.68-.56.85-1.35 1.91-2.33 1.92-.87.01-1.09-.56-2.27-.55-1.18.01-1.42.56-2.3.55-.98-.01-1.73-.97-2.29-1.82C3.5 11.87 3.14 8.6 4.43 6.6c.9-1.4 2.32-2.22 3.67-2.22 1.37 0 1.78.56 2.65.56.85 0 1.37-.56 2.6-.56 1.21 0 2.49.66 3.4 1.8-2.98 1.64-2.5 5.91.75 6.19Z" fill="currentColor" />
      </svg>
    );
  }
  // Facebook
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M18 9a9 9 0 1 0-10.406 8.893V11.6H5.297V9h2.297V7.016c0-2.268 1.35-3.52 3.418-3.52.99 0 2.025.177 2.025.177v2.226h-1.14c-1.124 0-1.474.697-1.474 1.413V9h2.508l-.4 2.6H10.42v6.293A9.003 9.003 0 0 0 18 9Z" fill="#1877F2" />
    </svg>
  );
};

export function AuthModal({
  onClose,
  defaultMode = "sign-in",
  redirectTo,
}: AuthModalProps) {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const loading = useAuthStore((s) => s.loading);

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oauthLoading, setOauthLoading] = useState<AuthProvider | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "sign-in") {
      const result = await signIn(email, password);
      if (result.error) {
        setError(formatAuthError(result.code, result.error));
      } else {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          onClose();
        }
      }
    } else {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
      const result = await signUp(email, password, name);
      if (result.error) {
        setError(formatAuthError(result.code, result.error));
      } else {
        setSuccess(
          "Check your email for a confirmation link. You can close this window.",
        );
      }
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setSuccess("");
  };

  const handleOAuth = async (provider: AuthProvider) => {
    setError("");
    setOauthLoading(provider);
    const result = await signInWithOAuth(provider, redirectTo);
    if (result.error) {
      setError(result.error);
      setOauthLoading(null);
    }
    // On success Supabase redirects the browser — no further action needed.
  };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader
        title={mode === "sign-in" ? "Welcome back" : "Create account"}
        titleMy={mode === "sign-in" ? "ပြန်လာပါ" : "အကောင့်ဖွင့်ပါ"}
        onClose={onClose}
      />

      {/* Mode toggle tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-[rgba(0,0,0,0.3)] rounded-[var(--radius-md)] p-1">
          {(["sign-in", "sign-up"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-2 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-all duration-[var(--dur-fast)] cursor-pointer",
                mode === m
                  ? "bg-brand text-white shadow-[var(--shadow-sm)]"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {m === "sign-in" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {success ? (
            <div className="rounded-[var(--radius-md)] bg-success-dim border border-success-border px-4 py-4 text-[13px] text-success leading-relaxed">
              {success}
            </div>
          ) : (
            <>
              {/* OAuth buttons */}
              {authConfig.enabledProviders.length > 0 && (
                <div className="space-y-2">
                  {authConfig.enabledProviders.map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      disabled={loading || oauthLoading !== null}
                      onClick={() => handleOAuth(provider)}
                      aria-label={authConfig.providerLabels[provider]}
                      className={cn(
                        "w-full flex items-center justify-center gap-2.5 h-11 px-4 rounded-[var(--radius-md)]",
                        "bg-card border border-border-strong text-[13px] font-semibold text-text-primary",
                        "transition-all duration-[var(--dur-fast)] cursor-pointer",
                        "hover:bg-card-hover hover:border-text-muted",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        oauthLoading === provider && "pointer-events-none",
                      )}
                    >
                      {oauthLoading === provider ? (
                        <span className="w-4 h-4 rounded-full border-2 border-border-strong border-t-text-primary animate-spin" />
                      ) : (
                        <ProviderIcon provider={provider} />
                      )}
                      {authConfig.providerLabels[provider]}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="relative pt-1 pb-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-surface px-3 text-[11px] text-text-muted uppercase tracking-wider">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>
              )}
            
              {mode === "sign-up" && (
                <Input
                  label="Name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete={mode === "sign-in" ? "email" : "email"}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder={
                  mode === "sign-up" ? "At least 8 characters" : "Your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "sign-up" ? 8 : undefined}
              />

              {error && (
                <div className="rounded-[var(--radius-md)] bg-danger-dim border border-danger-border px-4 py-3 text-[12.5px] text-danger leading-relaxed">
                  {error}
                </div>
              )}

              {mode === "sign-in" && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-[12px] text-text-muted hover:text-brand-light transition-colors duration-[var(--dur-fast)] cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}
        </ModalBody>

        {!success && (
          <ModalFooter className="flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || oauthLoading !== null}
            >
              {loading
                ? "Please wait…"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </Button>

            <p className="text-[12px] text-text-muted text-center">
              {mode === "sign-in" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="text-brand-light hover:underline cursor-pointer bg-transparent border-none p-0 font-semibold"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="text-brand-light hover:underline cursor-pointer bg-transparent border-none p-0 font-semibold"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </ModalFooter>
        )}
      </form>
    </Modal>
  );
}
