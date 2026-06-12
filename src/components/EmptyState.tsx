import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Upload } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel = "Upload resume",
  actionPath = "/upload",
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <button
        type="button"
        onClick={() => navigate(actionPath)}
        className="mt-8 inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated"
      >
        <Upload className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}
