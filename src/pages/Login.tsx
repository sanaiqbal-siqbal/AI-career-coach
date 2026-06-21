import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  // const { user, loading: authLoading, signIn, resendConfirmationEmail } = useAuth();
  const {
    user,
    loading: authLoading,
    signIn,
    signInWithGoogle,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const showResend =
    Boolean(error?.toLowerCase().includes("confirm")) && email.trim().length > 0;

  useEffect(() => {
    if (searchParams.get("confirmed") === "1") {
      setEmailConfirmed(true);
      const next = new URLSearchParams(searchParams);
      next.delete("confirmed");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate("/app", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-card animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your AI Career Coach account</p>
          </div>
        </div>

        {emailConfirmed && (
          <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm text-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            <p>
              Your email is confirmed. Sign in below with the email and password you used when signing up.
            </p>
          </div>
        )}
<button
  type="button"
  onClick={async () => {
    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
    }
  }}
  className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="h-5 w-5"
  >
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.2l-6.3-5.3C29.4 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.2C9.4 39.5 15.9 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.3-3.9 5.5l6.3 5.3C37.2 38.4 44 33 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>

  Continue with Google
</button>

<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-border" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">
      Or continue with email
    </span>
  </div>
</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border-border bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-border bg-background"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {resendMessage && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
              {resendMessage}
            </p>
          )}

          {/* {showResend && (
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                setResendMessage(null);
                setResending(true);
                const { error: resendError } = await resendConfirmationEmail(email.trim());
                setResending(false);
                if (resendError) {
                  setError(resendError.message);
                  return;
                }
                setResendMessage("Confirmation email sent. Check inbox and spam.");
              }}
              className="w-full text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend confirmation email"}
            </button>
          )} */}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
