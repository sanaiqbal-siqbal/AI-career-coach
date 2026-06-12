import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function EmailPendingScreen({
  email,
  onBack,
  accountAlreadyExists = false,
}: {
  email: string;
  onBack: () => void;
  accountAlreadyExists?: boolean;
}) {
  const { resendConfirmationEmail } = useAuth();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResendMessage(null);
    setResendError(null);
    setResending(true);
    const { error } = await resendConfirmationEmail(email);
    setResending(false);
    if (error) {
      setResendError("Could not resend email. Please try again in a few minutes.");
      return;
    }
    setResendMessage("Confirmation email sent! Check your inbox and spam folder.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card animate-fade-in text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {accountAlreadyExists ? "Already registered" : "Check your inbox"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {accountAlreadyExists ? (
              <>
                <span className="font-medium text-foreground">{email}</span> already has an account.
                Check your inbox for the confirmation link or resend it below.
              </>
            ) : (
              <>
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to verify your account, then sign in.
              </>
            )}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Can't find it? Check your spam or promotions folder.
        </p>

        {resendMessage && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-500">
            {resendMessage}
          </p>
        )}
        {resendError && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {resendError}
          </p>
        )}

        <div className="space-y-3">
          <Link to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow">
            Go to sign in
          </Link>
          <button type="button" onClick={() => void handleResend()} disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
            {resending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Resend confirmation email"}
          </button>
          <button type="button" onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const { user, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingExistingAccount, setPendingExistingAccount] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const trimmedEmail = email.trim();
    const { error: signUpError, needsEmailConfirmation, accountAlreadyExists } = await signUp(
      trimmedEmail,
      password,
      name.trim(),
    );
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (needsEmailConfirmation || accountAlreadyExists) {
      setPendingEmail(trimmedEmail);
      setPendingExistingAccount(accountAlreadyExists);
      return;
    }

    navigate("/", { replace: true });
  };

  if (pendingEmail) {
    return (
      <EmailPendingScreen
        email={pendingEmail}
        accountAlreadyExists={pendingExistingAccount}
        onBack={() => {
          setPendingEmail(null);
          setPendingExistingAccount(false);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-card animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start your AI-powered career journey</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              className="border-border bg-background"
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={6}
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

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
