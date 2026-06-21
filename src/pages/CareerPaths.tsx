import { ArrowRight, Compass, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getCareerPathsForUser, type CareerPath } from "@/lib/data";

// Arc match ring component
function MatchRing({ match, gradient }: { match: number; gradient: string }) {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (match / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={`url(#grad-${match})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id={`grad-${match}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient.split(",")[0]} />
            <stop offset="100%" stopColor={gradient.split(",")[1] ?? gradient.split(",")[0]} />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{match}%</span>
    </div>
  );
}

const PATH_STYLES = [
  { gradient: "hsl(245,70%,62%),hsl(270,65%,55%)", border: "border-primary/20", glow: "hover:shadow-[0_0_24px_hsl(245_70%_62%/0.2)]", tag: "bg-primary/10 text-primary" },
  { gradient: "hsl(158,64%,42%),hsl(170,60%,38%)", border: "border-emerald-500/20", glow: "hover:shadow-[0_0_24px_hsl(158_64%_42%/0.2)]", tag: "bg-emerald-500/10 text-emerald-500" },
  { gradient: "hsl(43,96%,56%),hsl(35,92%,50%)", border: "border-amber-500/20", glow: "hover:shadow-[0_0_24px_hsl(43_96%_56%/0.2)]", tag: "bg-amber-500/10 text-amber-500" },
];

export default function CareerPaths() {
  const { loading: authLoading } = useAuth();
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        setLoading(true);
        setPaths(await getCareerPathsForUser());
      } catch (error) {
        toast({ title: "Could not load career paths", description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [authLoading, toast]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Career Paths</h2>
          <p className="mt-1 text-muted-foreground">
            {loading ? "Generating recommendations…"
              : paths.length > 0 ? "AI-matched roles based on your resume."
              : "Analyze your resume to unlock personalized career paths."}
          </p>
        </div>
        {paths.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI matched</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paths.length === 0 ? (
        <EmptyState icon={Compass} title="No career paths generated yet"
          description="Upload and analyze your resume to discover personalized career path recommendations." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-3 stagger">
          {paths.map((p, i) => {
            const style = PATH_STYLES[i % PATH_STYLES.length];
            return (
              <div key={p.title}
                className={`animate-fade-in group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 ${style.border} ${style.glow}`}>

                {/* Match ring + rank */}
                <div className="flex items-center justify-between">
                  <MatchRing match={p.match} gradient={style.gradient} />
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.tag}`}>
                    #{i + 1} Match
                  </span>
                </div>

                {/* Title & desc */}
                <h3 className="mt-4 text-base font-bold text-card-foreground">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                {/* Skill gaps */}
                {Array.isArray(p.skills) && p.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Skill gaps
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${style.tag} border-current/20`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explore CTA */}
                {/* <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                  Explore path <ArrowRight className="h-3.5 w-3.5" />
                </div> */}

                {/* Subtle gradient background */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${style.gradient.split(",")[0]}08, transparent 60%)` }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}