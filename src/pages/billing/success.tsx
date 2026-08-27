import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  activateSubscriptionAfterCheckout,
  getUserSubscription,
} from "@/lib/data";

type SyncState = "syncing" | "active" | "waiting" | "signed_out" | "error";

export default function BillingSuccess() {
  const [state, setState] = useState<SyncState>("syncing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();

  const syncSubscription = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      setState("signed_out");
      return { ok: false };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState("signed_out");
      return { ok: false };
    }

    let subscription = await getUserSubscription();
    if (subscription?.status === "active") {
      setState("active");
      setErrorMessage(null);
      setTimeout(() => navigate("/app/tailor?upgraded=1"), 1200);
      return { ok: true };
    }

    try {
      subscription = await activateSubscriptionAfterCheckout();
      if (subscription?.status === "active") {
        setState("active");
        setErrorMessage(null);
        setTimeout(() => navigate("/app/tailor?upgraded=1"), 1200);
        return { ok: true };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not activate subscription.";
      setErrorMessage(message);
      return { ok: false, error: message };
    }

    return { ok: false };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      if (cancelled) return;

      const result = await syncSubscription();
      if (cancelled || result.ok) return;

      attempts += 1;
      if (attempts >= maxAttempts) {
        setState(result.error ? "error" : "waiting");
        return;
      }

      setState("syncing");
      setTimeout(() => {
        if (!cancelled) void poll();
      }, 2000);
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [syncSubscription]);

  const handleRetry = async () => {
    setRetrying(true);
    setState("syncing");
    setErrorMessage(null);
    const result = await syncSubscription();
    if (!result.ok) {
      setState(result.error ? "error" : "waiting");
    }
    setRetrying(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {state === "active" ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : state === "waiting" || state === "error" ? (
            <AlertCircle className="h-7 w-7" />
          ) : (
            <Loader2 className="h-7 w-7 animate-spin" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Payment successful</h1>
          {state === "syncing" && (
            <p className="text-sm text-muted-foreground">
              Thanks for your purchase. Activating your subscription now...
            </p>
          )}
          {state === "active" && (
            <p className="text-sm text-muted-foreground">
              Your plan is active. Redirecting you back to resume tailoring...
            </p>
          )}
          {state === "waiting" && (
            <p className="text-sm text-muted-foreground">
              Payment went through, but your plan is not visible yet. Try activating again below.
            </p>
          )}
          {state === "error" && (
            <p className="text-sm text-muted-foreground">
              {errorMessage ??
                "Activation failed. Run supabase/payment-schema.sql in Supabase, then retry."}
            </p>
          )}
          {state === "signed_out" && (
            <p className="text-sm text-muted-foreground">
              Please sign in again so we can link your purchase to your account.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {(state === "waiting" || state === "error") && (
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={retrying}
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {retrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Activate subscription
            </button>
          )}
          {(state === "waiting" || state === "signed_out" || state === "error") && (
            <Link
              to={state === "signed_out" ? "/login" : "/app/profile"}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              {state === "signed_out" ? "Sign in" : "Go to profile"}
            </Link>
          )}
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
