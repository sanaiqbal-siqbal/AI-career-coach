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

type SignUpResult = {
  error: AuthError | null;
  needsEmailConfirmation: boolean;
  /** True when email is already registered — Supabase will not send another signup email. */
  accountAlreadyExists: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthError(error: unknown): AuthError {
  if (error && typeof error === "object" && "message" in error) {
    return { message: String((error as { message: string }).message) };
  }
  return { message: "An unexpected error occurred." };
}

function mapAuthEmailError(error: { message: string; code?: string }): AuthError {
  const message = error.message.toLowerCase();
  if (
    error.code === "over_email_send_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return {
      message:
        "Email rate limit reached (about 2 emails per hour on Supabase’s default mailer). Wait up to an hour, use “Resend” once, or open the confirmation link from your first email.",
    };
  }
  if (
    message.includes("error sending confirmation") ||
    message.includes("error sending magic link") ||
    message.includes("error sending email")
  ) {
    return {
      message:
        "Supabase could not send the email. Check Logs → Auth in your dashboard, or configure custom SMTP under Authentication → SMTP Settings.",
    };
  }
  return { message: error.message };
}

function mapSignInError(error: { message: string; code?: string }): AuthError {
  const message = error.message.toLowerCase();
  if (
    error.code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("not confirmed")
  ) {
    return {
      message:
        "Please confirm your email using the link we sent you, then sign in with your email and password.",
    };
  }
  return { message: error.message };
}

const confirmationRedirectOptions = () => ({
  emailRedirectTo: getAuthRedirectUrl("/login?confirmed=1"),
});

/** Ensures public.users row exists; only call when the client has an active session. */
async function ensureUserProfile(user: User, name: string, email: string) {
  if (!supabase) return;

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return;

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    name: name || (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : ""),
    email: email || user.email || "",
  });

  if (insertError) throw insertError;
}

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

    const syncProfile = async (authUser: User, emailHint = "") => {
      try {
        await ensureUserProfile(authUser, "", emailHint || authUser.email || "");
      } catch (profileError) {
        console.error("Failed to sync user profile:", profileError);
      }
    };

    // Register listener before getSession — async callbacks here can deadlock getSession().
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (
        nextSession?.user &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")
      ) {
        void syncProfile(nextSession.user);
      }
    });

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error("Failed to load session:", error.message);
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          void syncProfile(data.session.user);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Supabase is not configured." } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: mapSignInError(error) };
    }
    if (data.user) {
      try {
        await ensureUserProfile(data.user, "", email.trim());
      } catch (profileError) {
        return { error: toAuthError(profileError) };
      }
    }
    return { error: null };
  }, []);
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      return { error: { message: "Supabase is not configured." } };
    }
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl("/"),
      },
    });
  
    return {
      error: error ? toAuthError(error) : null,
    };
  }, []);
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!supabase) {
      return {
        error: { message: "Supabase is not configured." },
        needsEmailConfirmation: false,
        accountAlreadyExists: false,
      };
    }

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: trimmedName },
        ...confirmationRedirectOptions(),
      },
    });

    if (error) {
      return {
        error: mapAuthEmailError(error),
        needsEmailConfirmation: false,
        accountAlreadyExists: false,
      };
    }

    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      return {
        error: null,
        needsEmailConfirmation: false,
        accountAlreadyExists: true,
      };
    }

    const needsEmailConfirmation = !data.session;

    if (data.session && data.user) {
      try {
        await ensureUserProfile(data.user, trimmedName, trimmedEmail);
      } catch (profileError) {
        return {
          error: toAuthError(profileError),
          needsEmailConfirmation: false,
          accountAlreadyExists: false,
        };
      }
    }

    return { error: null, needsEmailConfirmation, accountAlreadyExists: false };
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: { message: "Supabase is not configured." } };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: confirmationRedirectOptions(),
    });

    if (error) {
      return { error: mapAuthEmailError(error) };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out failed:", error.message);
    }
    setSession(null);
    setUser(null);
  }, []);

  // const value = useMemo(
  //   () => ({ user, session, loading, signIn, signUp, resendConfirmationEmail, signOut }),
  //   [user, session, loading, signIn, signUp, resendConfirmationEmail, signOut],
  // );
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmationEmail,
      signOut,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      resendConfirmationEmail,
      signOut,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
