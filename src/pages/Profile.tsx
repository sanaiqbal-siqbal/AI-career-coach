import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  Crown,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Route,
  Save,
  Shield,
  Sparkles,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProPlanPrice } from "@/hooks/use-pro-plan-price";
import { SUBSCRIPTION_ENABLED } from "@/lib/pricing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProfileSummary,
  updateUserProfile,
  type ProfileSummary,
} from "@/lib/data";

const FREE_TIER_CREDITS = 2;

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function getAuthProvider(user: ReturnType<typeof useAuth>["user"]) {
  const provider = user?.app_metadata?.provider;
  if (provider === "google") return "Google";
  if (provider === "email") return "Email";
  return provider ? String(provider) : "Email";
}

function planStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "cancelled" || status === "expired") return "destructive";
  return "secondary";
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ActivityRow({
  title,
  meta,
  icon: Icon,
}: {
  title: string;
  meta: string;
  icon: typeof FileText;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { priceDetail, loading: priceLoading } = useProPlanPrice();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
    (typeof user?.user_metadata?.picture === "string" && user.user_metadata.picture) ||
    undefined;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProfileSummary();
      setSummary(data);
      setNameDraft(data.profile.name || "");
    } catch (error) {
      toast({
        title: "Could not load profile",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadProfile();
  }, [authLoading, user, loadProfile]);

  const planInfo = useMemo(() => {
    const subscription = summary?.subscription;
    const isActive = subscription?.status === "active";

    if (isActive) {
      const used = subscription.daily_used ?? 0;
      const limit = subscription.quota_per_day ?? 25;
      return {
        label: subscription.plan?.name ?? "Pro Plan",
        status: subscription.status,
        usageLabel: "Daily tailoring usage",
        used,
        limit,
        usageHint: `${used} of ${limit} uses today`,
        renewsOn: subscription.current_period_end,
        isPro: true,
      };
    }

    const used = summary?.aiUsage ?? 0;
    return {
      label: "Free Plan",
      status: subscription?.status ?? "free",
      usageLabel: "Free tailoring credits",
      used,
      limit: FREE_TIER_CREDITS,
      usageHint: `${used} of ${FREE_TIER_CREDITS} free credits used`,
      renewsOn: null,
      isPro: false,
    };
  }, [summary]);

  const handleSaveName = async () => {
    if (!nameDraft.trim()) {
      toast({ title: "Name required", description: "Please enter your display name." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserProfile({ name: nameDraft.trim() });
      setSummary((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, name: updated.name } } : prev,
      );
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Profile data is unavailable right now.</p>
        <button
          onClick={() => void loadProfile()}
          className="mt-4 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const usagePercent = planInfo.limit
    ? Math.min((planInfo.used / planInfo.limit) * 100, 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-2xl border border-primary/10 p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, hsl(245 70% 58% / 0.12), hsl(280 70% 50% / 0.08))",
        }}
      >
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-card">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={summary.profile.name} /> : null}
              <AvatarFallback className="gradient-primary text-lg font-bold text-primary-foreground">
                {getInitials(summary.profile.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {summary.profile.name || "User"}
                </h1>
                {SUBSCRIPTION_ENABLED && (
                  <Badge variant={planStatusVariant(planInfo.status)}>
                    {planInfo.isPro ? planInfo.label : "Free"}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{summary.profile.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {formatDate(summary.profile.created_at)}
              </p>
            </div>
          </div>

          {SUBSCRIPTION_ENABLED && !planInfo.isPro && (
            <Link
              to="/app/tailor"
              className="inline-flex flex-col items-center justify-center gap-1 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card"
            >
              <span className="inline-flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </span>
              {!priceLoading && (
                <span className="text-[11px] font-medium opacity-90">{priceDetail}</span>
              )}
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Account Details
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={summary.profile.email}
                  disabled
                  className="bg-muted/40"
                />
              </div>
            </div>

            {/* <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Sign-in method
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{getAuthProvider(user)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Last sign in
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDateTime(user?.last_sign_in_at)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  User ID
                </div>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  {summary.profile.id}
                </p>
              </div>
            </div> */}

            <button
              onClick={() => void handleSaveName()}
              disabled={saving || nameDraft.trim() === summary.profile.name}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Activity Overview
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="ATS Score"
                value={summary.latestAtsScore != null ? String(summary.latestAtsScore) : "—"}
                sub={summary.latestAtsScore != null ? "/ 100 latest" : "Upload a resume"}
                color="text-primary"
              />
              <StatCard
                label="Resumes"
                value={String(summary.resumeCount)}
                sub="Uploaded"
                color="text-emerald-500"
              />
              <StatCard
                label="Interviews"
                value={String(summary.interviewCount)}
                sub="Sessions"
                color="text-rose-500"
              />
              <StatCard
                label="Tailored Docs"
                value={String(summary.tailoredDocCount)}
                sub="Generated"
                color="text-amber-500"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Activity
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Resumes</p>
                {summary.recentResumes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No resumes uploaded yet.</p>
                ) : (
                  summary.recentResumes.map((resume) => (
                    <ActivityRow
                      key={resume.id}
                      title={resume.file_name}
                      meta={formatDateTime(resume.uploaded_at)}
                      icon={Upload}
                    />
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Interviews</p>
                {summary.recentInterviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No interview sessions yet.</p>
                ) : (
                  summary.recentInterviews.map((interview) => (
                    <ActivityRow
                      key={interview.id}
                      title={interview.target_role || "Interview session"}
                      meta={formatDateTime(interview.created_at)}
                      icon={MessageSquare}
                    />
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Tailored resumes</p>
                {summary.recentDocuments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tailored documents yet.</p>
                ) : (
                  summary.recentDocuments.map((doc) => (
                    <ActivityRow
                      key={doc.id}
                      title={doc.job_title}
                      meta={formatDateTime(doc.created_at)}
                      icon={FileText}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {SUBSCRIPTION_ENABLED && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan & Usage
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">{planInfo.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {planInfo.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant={planStatusVariant(planInfo.status)}>
                    {planInfo.isPro ? "Pro" : "Free"}
                  </Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{planInfo.usageLabel}</span>
                    <span className="font-medium text-foreground">{planInfo.usageHint}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-700"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {planInfo.isPro ? (
                  <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily quota</span>
                      <span className="font-medium text-foreground">
                        {planInfo.limit} / day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renews on</span>
                      <span className="font-medium text-foreground">
                        {formatDate(planInfo.renewsOn)}
                      </span>
                    </div>
                    {summary.subscription?.cancel_at_period_end && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Cancellation scheduled at period end.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground space-y-1">
                    <p>Upgrade to unlock 25 resume tailoring and cover letter generations per day.</p>
                    {!priceLoading && (
                      <p className="font-medium text-foreground">{priceDetail}</p>
                    )}
                  </div>
                )}

                {!planInfo.isPro ? (
                  <button
                    onClick={() => navigate("/app/tailor")}
                    className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    {priceLoading ? "Upgrade plan" : `Upgrade plan · ${priceDetail}`}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/app/tailor")}
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60"
                  >
                    Manage tailoring
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Links
              </h2>
            </div>
            <div className="space-y-2">
              {[
                { label: "Upload resume", path: "/app/upload" },
                { label: "Resume analysis", path: "/app/analysis" },
                { label: "Career paths", path: "/app/careers" },
                { label: "Interview practice", path: "/app/interview" },
                { label: "Tailor resume", path: "/app/tailor" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
