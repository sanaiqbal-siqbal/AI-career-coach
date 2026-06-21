import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  ChevronDown,
  CircleDot,
  Compass,
  FileText,
  Flag,
  Github,
  LineChart,
  Linkedin,
  MessageSquare,
  Mic,
  Moon,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Twitter,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import trophy from "@/assets/trophy.png";
/* ------------------------------------------------------------------ */
/*  Local animations                                                   */
/* ------------------------------------------------------------------ */
const LocalStyles = () => (
  <style>{`
    @keyframes lp-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    @keyframes lp-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
    @keyframes lp-float { 0%,100% { transform: translateY(0) translateX(0) } 50% { transform: translateY(-10px) translateX(4px) } }
    @keyframes lp-gradient-shift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
    @keyframes lp-pulse-dot { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
    @keyframes lp-grow-bar { from { transform: scaleX(0) } to { transform: scaleX(1) } }
    @keyframes lp-fade-up { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
    @keyframes lp-score { from { stroke-dashoffset: 327 } }
    .lp-marquee { animation: lp-marquee 35s linear infinite; }
    .lp-bob { animation: lp-bob 4s ease-in-out infinite; }
    .lp-float { animation: lp-float 6s ease-in-out infinite; }
    .lp-pulse-dot { animation: lp-pulse-dot 1.8s ease-in-out infinite; }
    .lp-animated-gradient { background-size: 200% 200%; animation: lp-gradient-shift 8s ease infinite; }
    .lp-mask-fade-x { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
    .lp-fade-up { animation: lp-fade-up 0.7s cubic-bezier(.2,.8,.2,1) both; }
    .lp-card { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s, border-color .35s; }
    .lp-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, #8b5cf6 45%, transparent); box-shadow: 0 30px 80px -30px rgba(139,92,246,.55); }
    .lp-mockup { transition: transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s; }
    .lp-mockup:hover { transform: translateY(-6px) rotate(-.25deg); box-shadow: 0 40px 100px -30px rgba(139,92,246,.5); }
    .lp-glow-btn { box-shadow: 0 20px 50px -15px rgba(139,92,246,.6); transition: transform .25s, box-shadow .25s, opacity .25s; }
    .lp-glow-btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 30px 70px -15px rgba(139,92,246,.8); }
    .lp-score-ring { animation: lp-score 1.4s cubic-bezier(.2,.8,.2,1) both; }
    .lp-grow-bar { animation: lp-grow-bar 1.1s cubic-bezier(.2,.8,.2,1) both; }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  Theme toggle                                                       */
/* ------------------------------------------------------------------ */
function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(d => !d)} className="rounded-full">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Background                                                         */
/* ------------------------------------------------------------------ */
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full bg-[#6366f1]/25 blur-[120px]" />
      <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#8b5cf6]/25 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-[#22d3ee]/15 blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{ backgroundImage: "linear-gradient(to right, rgba(120,120,160,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,160,.18) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                               */
/* ------------------------------------------------------------------ */
function WindowChrome({ url, live = true }: { url: string; live?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
      </div>
      <span className="text-[11px] text-muted-foreground">{url}</span>
      {live ? (
        <Badge variant="secondary" className="gap-1.5 text-[10px]">
          <span className="lp-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />Live
        </Badge>
      ) : <span className="w-8" />}
    </div>
  );
}

function Bar({ label, value, tone = "brand" }: { label: string; value: number; tone?: "brand" | "warn" | "good" }) {
  const cls = tone === "warn" ? "from-amber-400 to-rose-400" : tone === "good" ? "from-emerald-400 to-teal-400" : "from-[#6366f1] to-[#8b5cf6]";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
        <div className={`h-full origin-left rounded-full bg-gradient-to-r lp-grow-bar ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

function Sparkline({ points, className = "" }: { points: number[]; className?: string }) {
  const w = 120; const h = 32;
  const max = Math.max(...points); const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className}>
      <defs>
        <linearGradient id="sl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sl)" />
      <path d={d} fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature mockups (defined BEFORE features array)                   */
/* ------------------------------------------------------------------ */
function ResumeStudioMockup() {
  return (
    <Card className="lp-mockup overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <WindowChrome url="resume-studio / senior-pm.linear" />
      <div className="mt-4 grid grid-cols-5 gap-3">
        <div className="col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">AI rewrite — 3 lines</p>
            <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">+18 pts</Badge>
          </div>
          {[
            ["Led design system", "Shipped design system used by 40+ engineers, cutting build time 32%."],
            ["Worked on onboarding", "Redesigned onboarding, lifting D7 retention from 21% → 38%."],
            ["Helped with hiring", "Hired and mentored 4 designers; built rubric used company-wide."],
          ].map(([before, after]) => (
            <div key={before} className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs">
              <p className="text-muted-foreground line-through">{before}</p>
              <p className="mt-1 text-foreground">{after}</p>
            </div>
          ))}
        </div>
        <div className="col-span-2 space-y-3">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Keyword match</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[["roadmap",true],["B2B SaaS",true],["activation",true],["SQL",false],["growth loops",true],["A/B testing",false]].map(([k,hit]) => (
                <span key={k as string} className={`rounded-md border px-1.5 py-0.5 text-[10px] ${hit ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>{k}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Missing skills</p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              {[["SQL fundamentals","2h course"],["Experimentation","3 case studies"]].map(([s,t]) => (
                <li key={s} className="flex items-center justify-between"><span>{s}</span><span className="text-muted-foreground">{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CareerMatchMockup() {
  return (
    <Card className="lp-mockup overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <WindowChrome url="match / for-you" />
      <div className="mt-4 space-y-3">
        {[
          { role:"Staff Product Designer", meta:"Linear · Remote", score:98, salary:"$210–245k", why:"Strong systems + B2B SaaS background", gaps:["Mentorship at scale"] },
          { role:"Design Engineer", meta:"Vercel · Remote", score:94, salary:"$190–225k", why:"Ships in code, design system ownership", gaps:["Edge runtime exposure"] },
          { role:"Senior Designer, Growth", meta:"Notion · NYC", score:89, salary:"$175–205k", why:"Onboarding & activation experience", gaps:["Experimentation rigor"] },
        ].map(m => (
          <div key={m.role} className="rounded-lg border border-border/50 bg-background/40 p-3 transition hover:border-[#8b5cf6]/40">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-medium">{m.role}</p><p className="text-[11px] text-muted-foreground">{m.meta}</p></div>
              <div className="text-right"><p className="text-sm font-semibold text-[#a5b4fc]">{m.score}%</p><p className="text-[10px] text-muted-foreground">{m.salary}</p></div>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/40">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" style={{ width: `${m.score}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">{m.why}</span>
              {m.gaps.map(g => <span key={g} className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-300">gap: {g}</span>)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InterviewCoachMockup() {
  return (
    <Card className="lp-mockup overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <WindowChrome url="coach / behavioral · session 9" />
      <div className="mt-4 grid grid-cols-5 gap-3 text-xs">
        <div className="col-span-3 space-y-2">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Interviewer</p>
            <p className="mt-1">Tell me about a time you disagreed with a senior stakeholder.</p>
          </div>
          <div className="rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 p-3">
            <p className="text-[10px] uppercase tracking-wide text-[#a5b4fc]">You</p>
            <p className="mt-1">Our VP wanted to ship a redesign in 2 weeks. I pushed back with data from 8 user interviews and proposed a 4-week phased rollout…</p>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="secondary" className="text-[10px]">Structure 9/10</Badge>
              <Badge variant="secondary" className="text-[10px]">Impact 7/10</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400">Coach</p>
            <p className="mt-1 text-muted-foreground">Add the outcome: what happened after the phased rollout? Quantify the win.</p>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rubric</p>
            <div className="mt-2 space-y-1.5">
              <Bar label="Structure" value={90} tone="good" />
              <Bar label="Clarity" value={86} tone="good" />
              <Bar label="Impact" value={70} tone="warn" />
              <Bar label="Concision" value={78} />
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Progress</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold">8.4 / 10</span>
              <span className="text-[10px] text-emerald-400">↑ 1.2 vs last</span>
            </div>
            <Sparkline points={[5,5.4,6,6.2,7,7.2,8.4]} className="mt-1 h-8 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RoadmapMockup() {
  const milestones = [
    { label:"Resume v3 shipped", done:true },
    { label:"10 interview reps", done:true },
    { label:"5 onsites booked", done:false },
    { label:"Offer signed", done:false },
  ];
  return (
    <Card className="lp-mockup overflow-hidden border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <WindowChrome url="roadmap / week 6 of 12" />
      <div className="mt-4 grid grid-cols-5 gap-3">
        <div className="col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">This week's plan</p>
            <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">4 / 5 done</Badge>
          </div>
          {[["Mon","Tailor resume → Linear PM role",true],["Tue","Mock behavioral · 30 min",true],["Wed","Apply to 5 top matches",true],["Thu","System design rep · Stripe",true],["Fri","Review feedback + iterate",false]].map(([d,t,done]) => (
            <div key={d as string} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-xs transition hover:border-[#8b5cf6]/40">
              <span className="w-9 text-[10px] uppercase text-muted-foreground">{d as string}</span>
              <span className="flex-1">{t as string}</span>
              {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <CircleDot className="h-3.5 w-3.5 text-muted-foreground/60" />}
            </div>
          ))}
        </div>
        <div className="col-span-2 space-y-2">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Milestones</p>
            <ul className="mt-2 space-y-2 text-[11px]">
              {milestones.map(m => (
                <li key={m.label} className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${m.done ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400" : "border-border/60 text-muted-foreground"}`}>
                    {m.done ? <Check className="h-2.5 w-2.5" /> : <Flag className="h-2.5 w-2.5" />}
                  </span>
                  <span className={m.done ? "" : "text-muted-foreground"}>{m.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Progress</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold">62%</span>
              <span className="text-[10px] text-emerald-400">on track</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" style={{ width:"62%" }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero mockup                                                        */
/* ------------------------------------------------------------------ */
function HeroMockup() {
  const score = 92; const r = 52; const c = 2 * Math.PI * r; const dash = (score / 100) * c;
  return (
    <div className="relative">
      <Card className="lp-mockup relative overflow-hidden border-border/60 bg-card/60 p-5 shadow-2xl backdrop-blur-xl">
        <WindowChrome url="careercoach.ai / dashboard" />
        <div className="mt-5 grid grid-cols-5 gap-4">
          <div className="col-span-2 rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">ATS Resume Score</p>
            <div className="mt-2 flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r={r} stroke="currentColor" className="text-muted/30" strokeWidth="10" fill="none" />
                  <circle cx="60" cy="60" r={r} stroke="url(#g1)" strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={`${dash} ${c}`} className="lp-score-ring" />
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold">{score}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Bar label="Keywords" value={96} tone="good" />
              <Bar label="Format" value={88} />
              <Bar label="Impact" value={92} />
            </div>
          </div>
          <div className="col-span-3 rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Top job matches</p>
              <Badge className="bg-[#6366f1]/15 text-[10px] text-[#a5b4fc] hover:bg-[#6366f1]/15">AI ranked</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {[["Senior Product Designer","Linear · Remote","98%"],["Staff Frontend Engineer","Vercel · Remote","94%"],["Design Engineer","Stripe · NYC","91%"],["Product Engineer","Arc · SF","88%"]].map(([role,co,m]) => (
                <div key={role} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2 transition hover:border-[#8b5cf6]/40">
                  <div><p className="text-sm font-medium">{role}</p><p className="text-[11px] text-muted-foreground">{co}</p></div>
                  <span className="text-xs font-semibold text-[#a5b4fc]">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label:"Callbacks this week", value:"+12", trend:[3,4,6,5,7,9,12] },
            { label:"Applications", value:"37", trend:[10,14,18,22,28,33,37] },
            { label:"Interview reps", value:"9", trend:[1,2,3,4,6,7,9] },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-lg font-semibold">{s.value}</p>
                <Sparkline points={s.trend} className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating chat */}
      <Card className="lp-float absolute -bottom-8 -left-6 hidden w-64 border-border/60 bg-card/80 p-3 shadow-2xl backdrop-blur-xl sm:block">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]">
            <Mic className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-xs font-medium">Mock Interview</p>
          <span className="ml-auto lp-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          "Walk me through a product you shipped that didn't work — what did you learn?"
        </p>
        <div className="mt-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px]">STAR</Badge>
          <Badge variant="secondary" className="text-[10px]">Clarity 9/10</Badge>
        </div>
      </Card>

      {/* Floating offer card */}
      <Card className="lp-bob absolute -right-4 -top-6 hidden border-border/60 bg-card/80 p-3 shadow-2xl backdrop-blur-xl sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Offer signed</p>
            <p className="text-xs font-semibold">$12k base · Linear</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const problems = [
  { icon:FileText, title:"Resumes that get filtered out", body:"75% of resumes never reach a human. Generic templates and missing keywords kill your chances before page one.", stat:"75%", statLabel:"auto-rejected by ATS" },
  { icon:Target, title:"Spraying applications, hearing silence", body:"Hundreds of applications, dozens of tabs, zero feedback. You can't tell what's working — or why it isn't.", stat:"2%", statLabel:"average reply rate" },
  { icon:MessageSquare, title:"Interviews you couldn't rehearse for", body:"Behavioral, system design, take-home — no honest feedback loop, just a friend who says 'sounds great'.", stat:"1 in 6", statLabel:"onsites convert" },
  { icon:TrendingUp, title:"No idea where your career is headed", body:"Should you specialize? Switch domains? Negotiate? Generic advice from the internet doesn't know you.", stat:"0", statLabel:"personalized roadmap" },
];

const features = [
  { tag:"Resume Studio", title:"Resumes optimized for the exact job — not a template.", body:"Upload your PDF and get an instant ATS score, keyword breakdown, and a prioritized list of what to fix — backed by real AI analysis of your actual resume.", bullets:["ATS score with explainable breakdown","Quantified impact suggestions","Strength & weakness analysis"], mockup:<ResumeStudioMockup /> },
  { tag:"Career Match", title:"Discover the 3 roles you're best matched for.", body:"AI analyzes your resume and target role to show personalized career path recommendations with match percentages and skill gap analysis.", bullets:["3 AI-matched career paths","Match percentage visualization","Skill gap analysis per role"], mockup:<CareerMatchMockup /> },
  { tag:"Mock Interviews", title:"Realistic interview practice with honest feedback.", body:"Your AI interviewer asks questions tailored to your resume and target role. Conversations are saved — pick up right where you left off.", bullets:["Questions based on your real resume","Persistent conversation history","Multiple sessions, full history saved"], mockup:<InterviewCoachMockup /> },
  { tag:"Career Roadmap", title:"A weekly game plan that adapts as you progress.", body:"Milestones, weekly goals, and recommended actions calibrated to your timeline and target role.", bullets:["Weekly goals + progress tracker","Milestones tied to real outcomes","Recommended actions, ranked by impact"], mockup:<RoadmapMockup /> },
];

const compare = [
  ["Trained on your real career data",true,false],
  ["ATS-grade resume scoring",true,false],
  ["Live job matches with fit reasoning",true,false],
  ["Rubric-based interview feedback",true,false],
  ["Remembers your goals across sessions",true,false],
  ["Generic, one-size-fits-all answers",false,true],
];

const steps = [
  { n:"01", title:"Upload your resume", body:"Drop your PDF and tell us your target role. Takes 10 seconds. Works on every device including mobile." },
  { n:"02", title:"Get instant AI analysis", body:"Receive your ATS score, strengths, weaknesses, and personalized career path recommendations in under 15 seconds." },
  { n:"03", title:"Practice and improve", body:"Run mock interview sessions tailored to your resume, track your progress, and apply with confidence." },
];

const stats = [
  ["15s","average analysis time","⚡"],
  ["100%","private & secure","🔒"],
  ["3","career paths per upload","🎯"],
  ["24/7","AI interview practice","💬"],
];

const faqs = [
  { q:"How is this different from ChatGPT?", a:"ChatGPT is a general model with no memory of your career, no rubrics, and no structured output. AI Career Coach is purpose-built: it reads your actual resume, scores against real ATS criteria, generates interview questions specific to your experience, and remembers your history across sessions." },
  { q:"Is my data private?", a:"Yes. Your resume and conversations are tied to your account only. We use Row Level Security at the database level — no other user can ever access your data, even if there's a bug in application code." },
  { q:"What file formats are supported?", a:"PDF resumes up to 5MB. Make sure it's a text-based PDF (not a scanned image) for the most accurate analysis. PDFs from Word, Google Docs, or CV builders work perfectly." },
  { q:"How accurate is the ATS score?", a:"Our AI analyzes your resume the same way real ATS systems do — checking keyword density, formatting, structure, and role alignment to give a realistic compatibility score with specific improvement points." },
  { q:"Can I practice multiple interview sessions?", a:"Yes. Every session is saved separately so you can review your conversation history and track improvement over time. Conversations auto-save even if you close the tab." },
  { q:"Is it free to use?", a:"Getting started is completely free — upload your resume and get your full AI analysis, career paths, and a personalized mock interview session at no cost." },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <LocalStyles />
      <BackgroundOrbs />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
              <img src="/favicon.svg" alt="AI Career Coach" className="h-8 w-8" />
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Career Coach</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#different" className="hover:text-foreground transition-colors">Why us</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="lp-glow-btn bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-95" asChild>
              <Link to="/signup">Start free</Link>
            </Button>
            <button className="md:hidden" onClick={() => setOpen(o => !o)}>
              {open ? <X className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border/40 bg-background/95 px-6 py-4 md:hidden">
            {[["Features","#features"],["How it works","#how"],["Why us","#different"],["FAQ","#faq"]].map(([l,h]) => (
              <a key={l} href={h} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">{l}</a>
            ))}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/login">Sign in</Link></Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white" asChild><Link to="/signup">Get started</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-24 pt-20 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="lp-fade-up">
            <Badge variant="secondary" className="mb-5 rounded-full border border-border/60 bg-card/60 backdrop-blur">
              <Sparkles className="mr-1.5 h-3 w-3 text-[#a5b4fc]" /> AI-powered career toolkit
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Land the job you{" "}
              <span className="relative inline-block">
                <span className="lp-animated-gradient bg-gradient-to-r from-[#a5b4fc] via-[#c4b5fd] to-[#f0abfc] bg-clip-text text-transparent">
                  actually want.
                </span>
                <svg aria-hidden viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full text-[#8b5cf6]" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 2, 100 6 T 198 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              AI Career Coach analyzes your resume, shows your best career paths, and runs realistic mock interviews — all tailored to your actual experience. Not generic advice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="lp-glow-btn lp-animated-gradient bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white" asChild>
                <Link to="/signup"><Sparkles className="mr-2 h-4 w-4" />Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/60" asChild>
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {["No credit card","Free resume analysis","Your data stays private"].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 py-1">
                  <Check className="h-3 w-3 text-emerald-400" />{t}
                </span>
              ))}
            </div>
          </div>
          <HeroMockup />
        </div>

        {/* Marquee */}
        <div className="mt-24">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">Coached job seekers placed at</p>
          <div className="lp-mask-fade-x mt-6 overflow-hidden">
            <div className="lp-marquee flex w-max gap-12 text-lg font-semibold text-muted-foreground/70">
              {["Linear","Vercel","Stripe","Notion","Figma","Arc","Ramp","Loom","Raycast","Anthropic","Perplexity","Airtable","Linear","Vercel","Stripe","Notion","Figma","Arc","Ramp","Loom","Raycast","Anthropic","Perplexity","Airtable"].map((l,i) => (
                <span key={`${l}-${i}`} className="whitespace-nowrap opacity-80 transition hover:opacity-100">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="max-w-2xl">
            <Eyebrow>The job search is broken</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">You're not underqualified. You're under-tooled.</h2>
            <p className="mt-4 text-muted-foreground">The hiring stack got smarter. Your tools didn't. Here's what's actually slowing you down.</p>
          </div>
          <Card className="lp-card border-border/60 bg-card/40 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg. job search funnel</p>
              <Badge variant="secondary" className="text-[10px]">2025 cohort</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {[["Applications sent",100,"brand"],["Pass ATS",25,"warn"],["Recruiter reply",8,"warn"],["Onsite",3,"warn"],["Offer",1,"good"]].map(([l,v,t]) => (
                <Bar key={l as string} label={l as string} value={v as number} tone={t as "brand"|"warn"|"good"} />
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ icon:Icon, title, body, stat, statLabel }) => (
            <Card key={title} className="lp-card border-border/60 bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/40">
                  <Icon className="h-5 w-5 text-[#a5b4fc]" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[#a5b4fc]">{stat}</p>
                  <p className="text-[10px] text-muted-foreground">{statLabel}</p>
                </div>
              </div>
              <h3 className="mt-4 text-base font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/60 to-card/20 p-10 backdrop-blur-xl lg:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>The solution</Eyebrow>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">One toolkit. Built for the modern job search.</h2>
              <p className="mt-4 text-muted-foreground">Resume analysis, career path matching, and mock interviews — all in one place, all personalized to your actual resume.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Resume analysis that beats real ATS systems","Career path matching with skill gap breakdown","Mock interviews tailored to your resume","Persistent history across every session"].map(s => (
                  <li key={s} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-400" />{s}</li>
                ))}
              </ul>
              <Button className="mt-6 lp-glow-btn bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-95" asChild>
                <Link to="/signup">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="relative">
              <Card className="lp-mockup border-border/60 bg-background/40 p-5 backdrop-blur-xl">
                <WindowChrome url="today / focus" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-card/40 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">ATS Score</p>
                    <p className="mt-1 text-2xl font-semibold">92</p>
                    <Sparkline points={[62,68,72,75,80,85,92]} className="mt-1 h-8 w-full" />
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card/40 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sessions</p>
                    <p className="mt-1 text-2xl font-semibold">9</p>
                    <Bar label="" value={90} tone="good" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recommended next steps</p>
                  {[["Re-upload improved resume","+8 ATS pts"],["Mock behavioral · STAR","10 min"],["Review career paths","3 new matches"]].map(([a,m]) => (
                    <div key={a} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-xs transition hover:border-[#8b5cf6]/40">
                      <span className="flex items-center gap-2"><ArrowUpRight className="h-3.5 w-3.5 text-[#a5b4fc]" />{a}</span>
                      <span className="text-[10px] text-muted-foreground">{m}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="lp-float absolute -top-6 -right-4 hidden border-border/60 bg-card/80 p-3 shadow-2xl backdrop-blur-xl sm:block">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs"><span className="font-semibold">Sana</span> · ATS score 74 → 92</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Core product</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Four workflows. One unfair advantage.</h2>
          <p className="mt-4 text-muted-foreground">Every part of your job search rebuilt as a real AI product.</p>
        </div>
        <div className="mt-20 space-y-28">
          {features.map((f, i) => (
            <div key={f.tag} className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}>
              <div>
                <Badge variant="secondary" className="mb-4 bg-[#6366f1]/15 text-[#a5b4fc] hover:bg-[#6366f1]/15">{f.tag}</Badge>
                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{f.title}</h3>
                <p className="mt-3 text-muted-foreground">{f.body}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-400" />{b}</li>
                  ))}
                </ul>
                <Button className="mt-6 lp-glow-btn bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-95" asChild>
                  <Link to="/signup">Try it free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div>{f.mockup}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why different ── */}
      <section id="different" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Eyebrow>Why we're different</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ChatGPT is a tool. We're your coach.</h2>
            <p className="mt-4 text-muted-foreground">Generic LLMs don't remember your goals, don't see your resume, and don't grade against real hiring criteria. We do all three.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[{icon:Brain,label:"Career memory"},{icon:LineChart,label:"Live ATS scoring"},{icon:Compass,label:"Role matching"},{icon:Mic,label:"Rubric feedback"}].map(x => (
                <div key={x.label} className="lp-card flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm">
                  <x.icon className="h-4 w-4 text-[#a5b4fc]" />{x.label}
                </div>
              ))}
            </div>
          </div>
          <Card className="lp-mockup overflow-hidden border-border/60 bg-card/40 backdrop-blur-xl">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-border/60 bg-background/40 px-6 py-4 text-sm font-medium">
              <span className="text-muted-foreground">Capability</span>
              <span className="text-center">AI Career Coach</span>
              <span className="text-center text-muted-foreground">Generic LLMs</span>
            </div>
            {compare.map(([label,us,them]) => (
              <div key={label as string} className="grid grid-cols-[1.6fr_1fr_1fr] items-center border-b border-border/40 px-6 py-4 text-sm last:border-0">
                <span>{label}</span>
                <span className="flex justify-center">{us ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-muted-foreground/60" />}</span>
                <span className="flex justify-center">{them ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-muted-foreground/60" />}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From resume upload to interview-ready.</h2>
        </div>
        <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
          {steps.map(s => (
            <Card key={s.n} className="lp-card relative border-border/60 bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-sm font-semibold text-white">{s.n}</div>
              <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" className="lp-glow-btn bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-95" asChild>
            <Link to="/signup">Start free — takes 30 seconds <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <Card className="border-border/60 bg-gradient-to-br from-card/60 to-card/20 p-10 backdrop-blur-xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(([n,l,e]) => (
              <div key={l} className="group text-center">
                <div className="mb-2 inline-block text-2xl transition group-hover:scale-110">{e}</div>
                <p className="lp-animated-gradient bg-gradient-to-r from-[#a5b4fc] to-[#f0abfc] bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">{n}</p>
                <p className="mt-2 text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions, answered.</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-border/60">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline hover:text-[#a5b4fc] transition-colors">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── CTA ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] p-12 text-white lg:p-20">
          <div className="absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
            style={{ backgroundImage:"linear-gradient(to right, rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize:"44px 44px" }} />
          {/* Decorative trophy emoji */}
          <div className="lp-bob pointer-events-none absolute -top-4 right-8 hidden text-[120px] sm:block" aria-hidden>
          <img
            src={trophy}
            alt=""
            aria-hidden
            width={220}
            height={220}
            loading="lazy"/>
          </div>
          <div className="relative mx-auto max-w-2xl text-center">
            <Zap className="mx-auto h-8 w-8" />
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Your next offer is one upload away.</h2>
            <p className="mt-4 text-white/80">Start free. Get your ATS score, career paths, and first mock interview in under 5 minutes.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="lp-glow-btn bg-white text-[#4f46e5] hover:bg-white/90 font-semibold" asChild>
                <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" />No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" />100% private</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" />Ready in 15 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-border/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img src="/favicon.svg" alt="AI Career Coach" className="h-8 w-8" />
              </div>
              <span className="text-sm font-semibold">AI Career Coach</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Plan · Practice · Grow</p>
            <div className="flex gap-3 text-muted-foreground">
              <a href="https://www.linkedin.com/in/sana-iqbal05" aria-label="LinkedIn" className="hover:text-foreground transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="https://github.com/sanaiqbal-siqbal" aria-label="GitHub" className="hover:text-foreground transition-colors"><Github className="h-4 w-4" /></a>
            </div>
          </div>
          {[
            { title:"Product", links:[{l:"Features",h:"#features",a:true},{l:"How it works",h:"#how",a:true},{l:"FAQ",h:"#faq",a:true}] },
            { title:"Account", links:[{l:"Sign in",h:"/login",a:false},{l:"Sign up free",h:"/signup",a:false}] },
            { title:"Legal", links:[{l:"Privacy Policy",h:"#",a:false},{l:"Terms of Service",h:"#",a:false}] },
          ].map(section => (
            <div key={section.title}>
              <p className="text-sm font-semibold mb-3">{section.title}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.links.map(link => (
                  <li key={link.l}>
                    {link.a
                      ? <a href={link.h} className="hover:text-foreground transition-colors">{link.l}</a>
                      : <Link to={link.h} className="hover:text-foreground transition-colors">{link.l}</Link>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/40">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} AI Career Coach. All rights reserved.</p>
            <p>Built for job seekers who refuse to settle.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}