import { Upload, FileSearch, Route, MessageSquare, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getCareerPathCount,
  getUserProfile,
  getInterviewCount,
  getLatestResumeRecord,
  getResumeCount,
} from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const tools = [
  {
    title: "Upload Resume",
    description: "Drop your PDF and get instant AI-powered ATS analysis and improvement tips.",
    icon: Upload,
    path: "/upload",
    gradient: "from-violet-500 to-indigo-600",
    glow: "group-hover:shadow-[0_0_28px_hsl(245_70%_62%/0.35)]",
    tag: "Start here",
  },
  {
    title: "Resume Analysis",
    description: "Deep-dive into your ATS score, keyword gaps, strengths, and a prioritized fix list.",
    icon: FileSearch,
    path: "/analysis",
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-[0_0_28px_hsl(158_64%_42%/0.35)]",
    tag: "AI scored",
  },
  {
    title: "Career Paths",
    description: "See the 3 roles you're best matched for, with skill gap maps and growth roadmaps.",
    icon: Route,
    path: "/careers",
    gradient: "from-amber-500 to-orange-500",
    glow: "group-hover:shadow-[0_0_28px_hsl(43_96%_56%/0.35)]",
    tag: "Personalized",
  },
  {
    title: "Mock Interview",
    description: "Practice live with your AI interviewer — questions tailored to your actual resume.",
    icon: MessageSquare,
    path: "/interview",
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-[0_0_28px_hsl(350_89%_60%/0.35)]",
    tag: "Real-time AI",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userName, setUserName] = useState("there");
  const [stats, setStats] = useState([
    { label: "ATS Score", value: "--", sub: "No data yet", color: "text-primary" },
    { label: "Resumes", value: "0", sub: "Uploaded", color: "text-emerald-500" },
    { label: "Interviews", value: "0", sub: "Sessions", color: "text-rose-500" },
    { label: "Career Paths", value: "0", sub: "Generated", color: "text-amber-500" },
  ]);

  useEffect(() => {
    if (authLoading) return;
    const loadDashboard = async () => {
      try {
        const [userProfile, latestResume, resumeCount, interviewCount, careerPathCount] =
          await Promise.all([
            getUserProfile(),
            getLatestResumeRecord(),
            getResumeCount(),
            getInterviewCount(),
            getCareerPathCount(),
          ]);
        const feedback = latestResume?.ai_feedback as { atsScore?: number } | null;
        const atsScore = typeof feedback?.atsScore === "number" ? `${feedback.atsScore}` : "--";
        setUserName(userProfile?.name?.split(" ")[0] || "there");
        setStats([
          { label: "ATS Score", value: atsScore, sub: atsScore === "--" ? "Upload resume" : "/ 100", color: "text-primary" },
          { label: "Resumes", value: String(resumeCount), sub: "Uploaded", color: "text-emerald-500" },
          { label: "Interviews", value: String(interviewCount), sub: "Sessions", color: "text-rose-500" },
          { label: "Career Paths", value: String(careerPathCount), sub: "Generated", color: "text-amber-500" },
        ]);
      } catch (error) {
        toast({ title: "Could not load dashboard", description: error instanceof Error ? error.message : "Please try again." });
      }
    };
    void loadDashboard();
  }, [authLoading, toast]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, hsl(245 70% 58% / 0.12), hsl(280 70% 50% / 0.08))" }}>
        <div className="absolute inset-0 rounded-2xl border border-primary/10" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{greeting}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Welcome back, <span className="text-primary">{userName}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your AI-powered career toolkit. Everything you need to land your next role.
          </p>
        </div>
        {/* Decorative orb */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(245 70% 62%), transparent 70%)" }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger">
        {stats.map((stat) => (
          <div key={stat.label}
            className="animate-fade-in rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-elevated">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className={`mt-1.5 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tools</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 stagger">
          {tools.map((tool) => (
            <button key={tool.title} onClick={() => navigate(tool.path)}
              className={`group animate-fade-in relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-1 ${tool.glow}`}>
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradient} shadow-sm`}>
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {tool.tag}
                </span>
              </div>
              {/* Content */}
              <div className="mt-4">
                <h3 className="text-base font-semibold text-card-foreground">{tool.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
              </div>
              {/* CTA */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
              {/* Subtle gradient overlay on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-200 group-hover:opacity-[0.03]`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}