import { CircularProgress } from "@/components/CircularProgress";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircle2, XCircle, AlertTriangle, CloudUpload, Loader2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getLatestResumeRecord } from "@/lib/data";

type FeedbackData = {
  atsScore: number;
  jobMatch: number;
  keywordDensity: number;
  formatScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: { text: string; done: boolean }[];
  skills: { name: string; score: number }[];
};

function parseFeedback(raw: Record<string, unknown> | null): FeedbackData | null {
  if (!raw || typeof raw.atsScore !== "number") return null;
  return {
    atsScore: raw.atsScore,
    jobMatch: typeof raw.jobMatch === "number" ? raw.jobMatch : 0,
    keywordDensity: typeof raw.keywordDensity === "number" ? raw.keywordDensity : 0,
    formatScore: typeof raw.formatScore === "number" ? raw.formatScore : 0,
    strengths: Array.isArray(raw.strengths) ? raw.strengths.filter((i): i is string => typeof i === "string") : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses.filter((i): i is string => typeof i === "string") : [],
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.map((i) => {
          if (typeof i === "object" && i !== null && "text" in i && "done" in i &&
              typeof i.text === "string" && typeof i.done === "boolean") return { text: i.text, done: i.done };
          return null;
        }).filter((i): i is { text: string; done: boolean } => i !== null)
      : [],
    skills: Array.isArray(raw.skills)
      ? raw.skills.map((i) => {
          if (typeof i === "object" && i !== null && "name" in i && "score" in i &&
              typeof i.name === "string" && typeof i.score === "number") return { name: i.name, score: i.score };
          return null;
        }).filter((i): i is { name: string; score: number } => i !== null)
      : [],
  };
}

function ScoreGrade({ score }: { score: number }) {
  if (score >= 85) return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">Excellent</span>;
  if (score >= 70) return <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">Good</span>;
  if (score >= 50) return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">Fair</span>;
  return <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-500">Needs Work</span>;
}

export default function ResumeAnalysis() {
  const { loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        setLoading(true);
        const latestResume = await getLatestResumeRecord();
        setFeedback(parseFeedback((latestResume?.ai_feedback as Record<string, unknown> | null) ?? null));
      } catch (error) {
        toast({ title: "Could not load analysis", description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [authLoading, toast]);

  const scores = useMemo(() => feedback ? {
    atsScore: feedback.atsScore,
    jobMatch: feedback.jobMatch,
    keywordDensity: feedback.keywordDensity,
    formatScore: feedback.formatScore,
  } : null, [feedback]);

  const doneCount = useMemo(() => feedback?.improvements.filter(i => i.done).length ?? 0, [feedback]);
  const totalCount = feedback?.improvements.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resume Analysis</h2>
          <p className="mt-1 text-muted-foreground">
            {loading ? "Loading your analysis..." : feedback
              ? "Here's how your resume performs against ATS systems."
              : "Upload a resume to see your personalized results."}
          </p>
        </div>
        {feedback && scores && (
          <div className="hidden sm:flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <ScoreGrade score={scores.atsScore} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !feedback || !scores ? (
        <EmptyState icon={CloudUpload} title="No resume uploaded yet"
          description="Upload your resume to get your personalized ATS score, strengths, weaknesses, and skill analysis." />
      ) : (
        <>
          {/* Top scores */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* ATS Score — hero card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(135deg, hsl(245 70% 58% / 0.06), transparent 60%)" }} />
              <h3 className="relative text-sm font-medium text-muted-foreground">ATS Score</h3>
              <div className="relative mt-4 flex items-center justify-center">
                <CircularProgress value={scores.atsScore} size={148} strokeWidth={11} label="/ 100" />
              </div>
              <div className="relative mt-4 flex justify-center">
                <ScoreGrade score={scores.atsScore} />
              </div>
            </div>

            {/* Match bars */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-5 text-sm font-medium text-muted-foreground">Overall Match</h3>
              <div className="space-y-5">
                <ProgressBar value={scores.jobMatch} label="Job Match" />
                <ProgressBar value={scores.keywordDensity} label="Keyword Density" variant="accent" />
                <ProgressBar value={scores.formatScore} label="Format Score" />
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Strengths</h3>
                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                  {feedback.strengths.length}
                </span>
              </div>
              {feedback.strengths.length > 0 ? (
                <ul className="space-y-2.5">
                  {feedback.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-card-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No strengths listed.</p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Weaknesses</h3>
                <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                  {feedback.weaknesses.length}
                </span>
              </div>
              {feedback.weaknesses.length > 0 ? (
                <ul className="space-y-2.5">
                  {feedback.weaknesses.map((w) => (
                    <li key={w} className="flex items-start gap-2.5 text-sm text-card-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No weaknesses listed.</p>
              )}
            </div>
          </div>

          {/* Improvement checklist */}
          {feedback.improvements.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Improvement Checklist</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{doneCount}/{totalCount} done</span>
                  {/* Progress pill */}
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                      style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
              <ul className="space-y-2.5">
                {feedback.improvements.map((item) => (
                  <li key={item.text}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      item.done ? "bg-emerald-500/5" : "bg-muted/40"
                    }`}>
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className={item.done ? "text-muted-foreground line-through" : "text-card-foreground"}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skill keywords */}
          {feedback.skills.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Skill Keywords</h3>
                <span className="text-xs text-muted-foreground">{feedback.skills.length} skills found</span>
              </div>
              <div className="space-y-3.5">
                {feedback.skills
                  .sort((a, b) => b.score - a.score)
                  .map((skill) => (
                    <ProgressBar
                      key={skill.name}
                      value={skill.score}
                      label={skill.name}
                      variant={skill.score >= 80 ? "primary" : "accent"}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}