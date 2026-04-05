import { ArrowRight, BookOpen, Target, TrendingUp } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";

const paths = [
  {
    title: "Senior Frontend Engineer",
    match: 85,
    description: "Strong alignment with your React and TypeScript skills. Bridge the gap with system design expertise.",
    skills: ["System Design", "Performance Optimization", "Mentoring"],
  },
  {
    title: "Full-Stack Developer",
    match: 72,
    description: "Leverage your frontend expertise and grow backend skills in Node.js and cloud infrastructure.",
    skills: ["Node.js", "PostgreSQL", "Docker", "CI/CD"],
  },
  {
    title: "Product Engineer",
    match: 68,
    description: "Combine technical skills with product thinking. Great for those interested in user-facing impact.",
    skills: ["Product Thinking", "Analytics", "A/B Testing"],
  },
];

const roadmap = [
  { phase: "Now", title: "Polish resume & portfolio", status: "done" as const },
  { phase: "Month 1", title: "Complete system design course", status: "current" as const },
  { phase: "Month 2", title: "Build 2 full-stack side projects", status: "upcoming" as const },
  { phase: "Month 3", title: "Mock interviews & networking", status: "upcoming" as const },
  { phase: "Month 4", title: "Apply to target companies", status: "upcoming" as const },
];

export default function CareerPaths() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Career Paths</h2>
        <p className="mt-1 text-muted-foreground">AI-recommended directions based on your profile.</p>
      </div>

      {/* Path cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {paths.map((p) => (
          <div key={p.title} className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-primary">{p.match}% match</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-card-foreground">{p.title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Skill gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
              Explore <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Skills gap */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Skills Gap Analysis</h3>
        </div>
        <div className="space-y-3">
          <ProgressBar value={85} label="React / TypeScript" />
          <ProgressBar value={60} label="System Design" variant="accent" />
          <ProgressBar value={45} label="Cloud & DevOps" variant="accent" />
          <ProgressBar value={70} label="Communication" />
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Learning Roadmap</h3>
        </div>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />
          <div className="space-y-5">
            {roadmap.map((step) => (
              <div key={step.phase} className="relative flex gap-4">
                <div
                  className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 ${
                    step.status === "done"
                      ? "border-emerald-500 bg-emerald-500"
                      : step.status === "current"
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  }`}
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{step.phase}</p>
                  <p className={`text-sm font-medium ${step.status === "done" ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
