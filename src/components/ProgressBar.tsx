interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "primary" | "accent";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = "primary",
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full space-y-1.5">
      {(label || showValue) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && <span className="font-medium text-foreground">{value}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            variant === "accent" ? "gradient-accent" : "gradient-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
