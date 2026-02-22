"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: AuthMode;
}

export function AuthModal({ onClose, defaultMode = "sign-in" }: AuthModalProps) {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "sign-in") {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.code === "email_address_invalid"
          ? "That email format isn't accepted. Try one like you@example.com or yourname@gmail.com."
          : result.error);
      } else {
        onClose();
      }
    } else {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
      const result = await signUp(email, password, name);
      if (result.error) {
        setError(result.code === "email_address_invalid"
          ? "That email format isn't accepted. Try one like you@example.com or yourname@gmail.com."
          : result.error);
      } else {
        setSuccess(
          "Check your email for a confirmation link. You can close this window."
        );
      }
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setSuccess("");
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
                  : "text-text-muted hover:text-text-secondary"
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
                placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
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
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
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
