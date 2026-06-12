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
      setResendError(error.message);
      return;
    }
    setResendMessage("Confirmation email sent again. Check your inbox and spam folder.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-card animate-fade-in text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {accountAlreadyExists ? "Account already exists" : "Check your email"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {accountAlreadyExists ? (
              <>
                <span className="font-medium text-foreground">{email}</span> is already registered.
                Signing up again does <strong className="text-foreground">not</strong> send another
                email from Supabase. Use the confirmation link from your first message (check spam),
                or click <strong className="text-foreground">Resend</strong> below — then sign in.
              </>
            ) : (
              <>
                A confirmation link was sent to{" "}
                <span className="font-medium text-foreground">{email}</span>. Open it to verify your
                account, then sign in with your email and password.
              </>
            )}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Not seeing a new email?</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Search Gmail for subject &quot;Confirm Your Signup&quot; from Supabase Auth.</li>
            <li>Check spam, promotions, and the Important tab.</li>
            <li>
              Default Supabase mail is limited to about <strong>2 emails per hour</strong> — wait,
              then use Resend once.
            </li>
            <li>
              Add <code className="text-foreground">{window.location.origin}/login</code> to{" "}
              <strong>Redirect URLs</strong> in Supabase.
            </li>
            <li>
              Check <strong>Logs → Auth</strong> in the Supabase dashboard for send errors.
            </li>
          </ul>
        </div>

        {resendMessage && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            {resendMessage}
          </p>
        )}
        {resendError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {resendError}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend confirmation email"
          )}
        </button>

        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated"
        >
          Go to sign in
        </Link>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
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
