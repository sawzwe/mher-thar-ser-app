export type AuthProvider = "google" | "apple" | "facebook";

// Env-driven: each provider can be toggled independently.
// Google: enabled by default — set NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false to disable.
// Apple:  disabled by default — set NEXT_PUBLIC_AUTH_APPLE_ENABLED=true when you have an Apple Developer account.
// Facebook: enabled by default — set NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED=false to disable.
const GOOGLE_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== "false";
const APPLE_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === "true";
const FACEBOOK_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED !== "false";

const PROVIDERS_MAP: Record<AuthProvider, boolean> = {
  google: GOOGLE_ENABLED,
  apple: APPLE_ENABLED,
  facebook: FACEBOOK_ENABLED,
};

const ALL_PROVIDERS: AuthProvider[] = ["google", "apple", "facebook"];

export const authConfig = {
  /**
   * Site base URL used when building OAuth redirect URLs.
   * Falls back to window.location.origin on client, localhost in dev.
   * No trailing slash.
   */
  siteUrl:
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),

  /** Relative path for the OAuth callback handler. */
  callbackPath: "/auth/callback",

  /** Map of provider → enabled flag. Read from env at startup. */
  providers: PROVIDERS_MAP,

  /** Ordered list of enabled provider IDs. Use this for rendering buttons. */
  enabledProviders: ALL_PROVIDERS.filter((p) => PROVIDERS_MAP[p]),

  /** Display labels for OAuth buttons. */
  providerLabels: {
    google: "Continue with Google",
    apple: "Continue with Apple",
    facebook: "Continue with Facebook",
  } satisfies Record<AuthProvider, string>,
};
