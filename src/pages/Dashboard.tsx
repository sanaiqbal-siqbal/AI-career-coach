import { Upload, FileSearch, Route, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    title: "Upload Resume",
    description: "Upload your resume in PDF format and let our AI analyze it for ATS compatibility and improvements.",
    icon: Upload,
    path: "/upload",
    color: "from-primary to-primary/80",
  },
  {
    title: "Resume Analysis",
    description: "Get detailed ATS scoring, keyword analysis, strength/weakness breakdown, and actionable improvements.",
    icon: FileSearch,
    path: "/analysis",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Career Paths",
    description: "Discover recommended career directions based on your skills, with gap analysis and learning roadmaps.",
    icon: Route,
    path: "/careers",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Mock Interview",
    description: "Practice with our AI interviewer. Get real-time feedback on answers, tone, and confidence.",
    icon: MessageSquare,
    path: "/interview",
    color: "from-rose-500 to-pink-500",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back, Alex 👋</h2>
        <p className="mt-1 text-muted-foreground">Your AI-powered career toolkit. Pick a tool to get started.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "ATS Score", value: "78/100", change: "+5" },
          { label: "Skills Matched", value: "12/18", change: "+2" },
          { label: "Interviews Done", value: "4", change: "+1" },
          { label: "Career Paths", value: "3", change: "New" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{stat.value}</p>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Tool cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => (
          <button
            key={tool.title}
            onClick={() => navigate(tool.path)}
            className="group flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 text-left shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color}`}>
              <tool.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-card-foreground">{tool.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
