import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, getAuthRedirectUrl } from "@/lib/supabase";

type AuthError = { message: string };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  // email/password (optional)
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;

  // GOOGLE = PRIMARY AUTH
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;

  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthError(error: unknown): AuthError {
  if (error && typeof error === "object" && "message" in error) {
    return { message: String((error as { message: string }).message) };
  }
  return { message: "An unexpected error occurred." };
}

/** Create profile row */
async function ensureUserProfile(user: User) {
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from("users").insert({
    id: user.id,
    name: user.user_metadata?.name || "",
    email: user.email || "",
  });
}
//test
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const syncProfile = async (authUser: User) => {
      try {
        await ensureUserProfile(authUser);
      } catch (err) {
        console.error("Profile sync failed:", err);
      }
    };

    const { data: { subscription } } =
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
    
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    
      // IMPORTANT: always wait for session existence
      if (session?.user) {
        try {
          await ensureUserProfile(session.user);
        } catch (err) {
          console.error("Profile creation failed:", err);
        }
      }
    });

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);

      // if (data.session?.user) {
      //   void syncProfile(data.session.user);
      // }
      if (data.session?.user) {
        await ensureUserProfile(data.session.user);
      }
      setLoading(false);
    };

    void init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // EMAIL LOGIN (optional fallback)
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: toAuthError(error) };

    if (data.user) {
      await ensureUserProfile(data.user);
    }

    return { error: null };
  }, []);

  // GOOGLE AUTH (PRIMARY SIGNUP + LOGIN)
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl("/"),
      },
    });

    return { error: error ? toAuthError(error) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [user, session, loading, signIn, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}