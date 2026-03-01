import { create } from "zustand";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserFactory } from "@/lib/auth/UserFactory";
import { getSessionWithTimeout } from "@/lib/auth/supabaseAuth";
import type { IUser } from "@/lib/auth/types";

let authSubscription: { unsubscribe: () => void } | null = null;
let visibilityHandler: (() => void) | null = null;
let visibilityDebounceId: ReturnType<typeof setTimeout> | null = null;
let initializePromise: Promise<void> | null = null;

const VISIBILITY_DEBOUNCE_MS = 500;

interface AuthState {
  user: IUser | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; code?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error?: string; code?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      set({ loading: true });
      const supabase = createClient();

      const user = await UserFactory.fromSupabase(supabase);
      set({ user, loading: false, initialized: true });

      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          if (event === "SIGNED_OUT" || !session?.user) {
            set({ user: UserFactory.createGuest(), loading: false });
            return;
          }

          set({ loading: true });
          void (async () => {
            try {
              const resolved = await UserFactory.resolveUser(
                supabase,
                session.user,
              );
              set({ user: resolved, loading: false });
            } catch {
              set({ user: UserFactory.createGuest(), loading: false });
            }
          })();
        },
      );
      authSubscription = subscription;

      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
      visibilityHandler = () => {
        if (document.visibilityState !== "visible") return;
        if (visibilityDebounceId) clearTimeout(visibilityDebounceId);
        visibilityDebounceId = setTimeout(async () => {
          visibilityDebounceId = null;
          const session = await getSessionWithTimeout(supabase);
          const current = get().user;
          const newId = session?.user?.id ?? null;
          const oldId = current?.isAuthenticated() ? current.id : null;
          if (newId === oldId) return;

          if (!session?.user) {
            set({ user: UserFactory.createGuest() });
            return;
          }
          try {
            const resolved = await UserFactory.resolveUser(
              supabase,
              session.user,
            );
            set({ user: resolved });
          } catch {
            /* keep current */
          }
        }, VISIBILITY_DEBOUNCE_MS);
      };
      document.addEventListener("visibilitychange", visibilityHandler);
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ loading: false });
      return { error: error.message, code: error.code };
    }
    return {};
  },

  signUp: async (email, password, name) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) {
      set({ loading: false });
      return { error: error.message, code: error.code };
    }
    return {};
  },

  signOut: async () => {
    set({ loading: true });
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: UserFactory.createGuest(), loading: false });
  },
}));
