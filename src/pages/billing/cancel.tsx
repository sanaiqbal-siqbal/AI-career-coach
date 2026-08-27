import { Link } from "react-router-dom";
import { ArrowLeft, XCircle } from "lucide-react";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <XCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Checkout cancelled</h1>
          <p className="text-sm text-muted-foreground">
            No payment was taken. You can return to resume tailoring and upgrade whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/app/tailor"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resume Tailoring
          </Link>
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
