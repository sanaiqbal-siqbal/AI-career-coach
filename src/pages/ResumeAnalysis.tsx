import { CircularProgress } from "@/components/CircularProgress";
import { ProgressBar } from "@/components/ProgressBar";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const strengths = ["Strong action verbs", "Quantified achievements", "Clean formatting", "Relevant experience"];
const weaknesses = ["Missing LinkedIn URL", "No portfolio link", "Vague job descriptions"];
const improvements = [
  { text: "Add measurable metrics to bullet points", done: true },
  { text: "Include industry-specific keywords", done: false },
  { text: "Shorten summary to 2-3 sentences", done: false },
  { text: "Add relevant certifications", done: true },
  { text: "Tailor skills section to target role", done: false },
];
const skills = [
  { name: "React", score: 92 },
  { name: "TypeScript", score: 85 },
  { name: "Node.js", score: 78 },
  { name: "Python", score: 65 },
  { name: "SQL", score: 72 },
  { name: "AWS", score: 55 },
];

export default function ResumeAnalysis() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Resume Analysis</h2>
        <p className="mt-1 text-muted-foreground">Here's how your resume performs against ATS systems.</p>
      </div>

      {/* Top metrics */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-medium text-muted-foreground">ATS Score</h3>
          <div className="relative">
            <CircularProgress value={78} size={140} strokeWidth={12} label="/ 100" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-medium text-muted-foreground">Overall Match</h3>
          <ProgressBar value={72} label="Job Match" />
          <ProgressBar value={85} label="Keyword Density" variant="accent" />
          <ProgressBar value={60} label="Format Score" />
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Strengths</h3>
          <ul className="space-y-2.5">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-card-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Weaknesses</h3>
          <ul className="space-y-2.5">
            {weaknesses.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-card-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Improvement checklist */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Improvement Checklist</h3>
        <ul className="space-y-3">
          {improvements.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "text-card-foreground"}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skill keywords */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Skill Keywords</h3>
        <div className="space-y-3">
          {skills.map((skill) => (
            <ProgressBar
              key={skill.name}
              value={skill.score}
              label={skill.name}
              variant={skill.score >= 80 ? "primary" : "accent"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
