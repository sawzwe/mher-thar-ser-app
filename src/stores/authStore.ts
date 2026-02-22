import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { UserFactory } from "@/lib/auth/UserFactory";
import type { IUser } from "@/lib/auth/types";

interface AuthState {
  user: IUser | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    set({ loading: true });
    const supabase = createClient();

    // Resolve initial user
    const user = await UserFactory.fromSupabase(supabase);
    set({ user, loading: false, initialized: true });

    // Listen for auth state changes (sign in, sign out, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        set({ loading: true });
        const resolved = await UserFactory.fromSupabase(supabase);
        set({ user: resolved, loading: false });
      } else {
        set({ user: UserFactory.createGuest(), loading: false });
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }
    // onAuthStateChange will update the user
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
      return { error: error.message };
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
