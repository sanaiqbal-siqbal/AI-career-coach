import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <Mail className="h-8 w-8 text-white" />
        </div>

        {/* Message */}
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

        {/* Hint */}
        <p className="text-xs text-muted-foreground">
          Can't find it? Check your spam or promotions folder.
        </p>

        {/* Feedback messages */}
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

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow"
          >
            Go to sign in
          </Link>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {resending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              "Resend confirmation email"
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}