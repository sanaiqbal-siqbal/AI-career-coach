import { supabase } from "@/lib/supabase";
import { getProPlanUsdFallback, SUBSCRIPTION_ENABLED } from "@/lib/pricing";
import { extractTextFromPdf } from "@/lib/pdf";

type InterviewMessage = {
  sender: "ai" | "user";
  message: string;
  timestamp: string;
};

export type CareerPath = {
  title: string;
  match: number;
  description: string;
  skills: string[];
};

type ResumeFeedback = {
  atsScore: number;
  jobMatch: number;
  keywordDensity: number;
  formatScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: { text: string; done: boolean }[];
  skills: { name: string; score: number }[];
};

type AnalyzeResumeResult = {
  feedback: ResumeFeedback;
  careerPaths: CareerPath[];
  interviewOpener: string;
};

export type InterviewRecord = {
  id: string;
  created_at: string;
  target_role: string | null;
  conversation: InterviewMessage[];
};

export type ResumeRecord = {
  id: string;
  file_name: string;
  uploaded_at: string;
  target_role: string | null;
  ai_feedback: ResumeFeedback | null;
};

const AI_FUNCTION_NAME =
  import.meta.env.VITE_SUPABASE_AI_FUNCTION_NAME || "ai-career-coach";
const STORAGE_BUCKET_NAME =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "resumes";

function getFunctionErrorMessage(error: unknown, functionName: string) {
  const message =
    error instanceof Error ? error.message : String(error || "Unknown function error");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to send a request") ||
    normalized.includes("fetch") ||
    normalized.includes("network")
  ) {
    return `Failed to reach Edge Function "${functionName}". Deploy it, ensure it is enabled, and restart the app if you changed env vars.`;
  }

  if (normalized.includes("404") || normalized.includes("not found")) {
    return `Edge Function "${functionName}" was not found. Deploy it with: supabase functions deploy ${functionName}`;
  }

  if (normalized.includes("401") || normalized.includes("403") || normalized.includes("jwt")) {
    return `Edge Function "${functionName}" denied the request. Verify Supabase keys and function auth settings.`;
  }

  return `Edge Function "${functionName}" error: ${message}`;
}

function ensureClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.",
    );
  }

  return supabase;
}

async function invokeAiCareerCoach<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const db = ensureClient();
  const {
    data: { session },
    error: sessionError,
  } = await db.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  // Flatten fields at the root for older deployed edge function versions.
  const requestBody = {
    action,
    ...payload,
    payload,
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/${AI_FUNCTION_NAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
    body: JSON.stringify(requestBody),
  });

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`Edge Function "${AI_FUNCTION_NAME}" returned an invalid response.`);
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : getFunctionErrorMessage(new Error(String(data.error ?? response.statusText)), AI_FUNCTION_NAME);

    interface FunctionError extends Error {
      code?: string;
      limit?: number;
      price?: string;
    }

    const err = new Error(message) as FunctionError;
    if (typeof data.error === "string") err.code = data.error;
    if (typeof data.limit === "number") err.limit = data.limit;
    if (typeof data.price === "string") err.price = data.price;
    throw err;
  }

  if (data.error) {
    throw new Error(
      typeof data.message === "string" ? data.message : String(data.error),
    );
  }

  return data as T;
}

async function getAuthenticatedUserId() {
  const db = ensureClient();
  const {
    data: { session },
    error,
  } = await db.auth.getSession();

  if (error) throw error;
  if (!session?.user) {
    throw new Error("Not authenticated. Please sign in again.");
  }
  return session.user.id;
}

function formatDbError(error: unknown, operation: string): Error {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: string }).message)
        : "Unknown database error";

  if (message.toLowerCase().includes("row-level security")) {
    return new Error(
      `${operation} blocked by Row Level Security. Run supabase/rls-policies.sql and supabase/storage-policies.sql in the Supabase SQL editor, then ensure you are signed in.`,
    );
  }

  return new Error(`${operation} failed: ${message}`);
}

function isStorageAccessDenied(uploadError: unknown): boolean {
  const message = String(
    uploadError instanceof Error ? uploadError.message : uploadError || "",
  ).toLowerCase();
  const statusCode = String(
    (uploadError as { statusCode?: string | number })?.statusCode || "",
  );
  return (
    statusCode === "403" ||
    message.includes("row-level security") ||
    message.includes("unauthorized") ||
    message.includes("not allowed")
  );
}

export async function getUserProfile() {
  const db = ensureClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await db.auth.getUser();

  if (authError) throw authError;
  if (!authUser) throw new Error("Not authenticated");

  const { data, error } = await db
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const name =
    typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : "User";
  const email = authUser.email ?? "";

  const { error: insertError } = await db.from("users").insert({
    id: authUser.id,
    name,
    email,
  });

  if (insertError) throw insertError;

  const { data: created, error: retryError } = await db
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (retryError) throw retryError;
  if (!created) throw new Error("Failed to load user profile.");

  return created;
}

export async function createResumeRecord(fileName: string) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("resumes")
    .insert({
      user_id: userId,
      file_name: fileName,
      file_path: `uploads/${Date.now()}-${fileName}`,
      ai_feedback: null,
    })
    .select("id, file_name, uploaded_at, ai_feedback")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadResumeFile(file: File, targetRole: string | null = null) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();
  const storagePath = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  let filePath = storagePath;
  let storageUploaded = true;

  const { error: uploadError } = await db.storage
    .from(STORAGE_BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type || "application/pdf",
    });

  if (uploadError) {
    const message = String(uploadError.message || "").toLowerCase();
    const errorText = String((uploadError as { error?: string }).error || "").toLowerCase();
    const statusCode = String((uploadError as { statusCode?: string | number }).statusCode || "");
    const isMissingBucket =
      message.includes("bucket not found") ||
      message.includes("does not exist") ||
      errorText.includes("bucket not found") ||
      statusCode === "404";

    if (!isMissingBucket && !isStorageAccessDenied(uploadError)) {
      throw uploadError;
    }

    storageUploaded = false;
    filePath = `local-only/${storagePath}`;
  }

  const { data, error } = await db
  .from("resumes")
  .insert({
    user_id: userId,
    file_name: file.name,
    file_path: filePath,
    target_role: targetRole,
    ai_feedback: null,
  })
  .select("id, file_name, uploaded_at, ai_feedback, target_role")
  .single();

  if (error) throw formatDbError(error, "Saving resume");
  return {
    ...data,
    storageUploaded,
  };
}

export async function getLatestResumeRecord() {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("resumes")
    .select("id, file_name, uploaded_at, ai_feedback")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getResumesForUser(): Promise<ResumeRecord[]> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("resumes")
    .select("id, file_name, uploaded_at, ai_feedback")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ResumeRecord[];
}

export async function deleteResume(resumeId: string) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { error: interviewsError } = await db
    .from("interviews")
    .delete()
    .eq("resume_id", resumeId)
    .eq("user_id", userId);

  if (interviewsError) throw interviewsError;

  const { error: pathsError } = await db
    .from("career_paths")
    .delete()
    .eq("resume_id", resumeId)
    .eq("user_id", userId);

  if (pathsError) throw pathsError;

  const { error: resumeError } = await db
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", userId);

  if (resumeError) throw resumeError;
}

export async function getResumeCount() {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { count, error } = await db
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}


export async function getCareerPathsForUser() {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  // Get latest resume first
  const { data: latestResume } = await db
    .from("resumes")
    .select("id")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestResume) return [];

  // Get career paths for that specific resume
  const { data, error } = await db
    .from("career_paths")
    .select("paths")
    .eq("user_id", userId)
    .eq("resume_id", latestResume.id)
    .maybeSingle();

  if (error) throw error;

  const paths = data?.paths as CareerPath[] | null;
  return paths ?? [];
}
export async function getCareerPathCount() {
  const paths = await getCareerPathsForUser();
  return paths.length;
}

export async function saveInterviewConversation(
  conversation: InterviewMessage[],
  interviewId: string | null,
): Promise<void> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  if (interviewId) {
    const { error } = await db
      .from("interviews")
      .update({ conversation })
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) throw error;
  } else {
    const latestResume = await getLatestResumeRecord();
    const { error } = await db.from("interviews").insert({
      user_id: userId,
      resume_id: latestResume?.id ?? null,
      conversation,
    });

    if (error) throw error;
  }
}
// export async function getInterviewsForUser(): Promise<InterviewRecord[]> {
//   const db = ensureClient();
//   const userId = await getAuthenticatedUserId();

//   const { data, error } = await db
//     .from("interviews")
//     .select("id, created_at, conversation")
//     .eq("user_id", userId)
//     .order("created_at", { ascending: false });

//   if (error) throw error;

//   return (data ?? []).map((row) => ({
//     id: row.id,
//     created_at: row.created_at,
//     conversation: (row.conversation as InterviewMessage[]) ?? [],
//   }));
// }
export async function getInterviewsForUser(): Promise<InterviewRecord[]> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("interviews")
    .select("id, created_at, conversation, resume:resumes(target_role)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    target_role: row.resume?.target_role ?? null,
    conversation: (row.conversation as InterviewMessage[]) ?? [],
  }));
}
export async function deleteInterview(interviewId: string) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await db
    .from("interviews")
    .delete()
    .eq("id", interviewId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getLatestInterviewConversation() {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("interviews")
    .select("conversation")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return (data?.conversation as InterviewMessage[] | null) ?? null;
}

export async function getInterviewCount() {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { count, error } = await db
    .from("interviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}


/**
 * Supabase's functions.invoke() wraps non-2xx Edge Function responses in a
 * FunctionsHttpError. The actual JSON body — our { error, message } shape —
 * is still readable from error.context. This safely extracts it across
 * different supabase-js versions.
 */
async function extractEdgeFunctionErrorMessage(error: unknown): Promise<string | null> {
  try {
    const err = error as {
      context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
    };

    if (err.context?.json) {
      const body = await err.context.json();
      if (body && typeof body === "object" && "message" in body) {
        const msg = (body as { message: unknown }).message;
        if (typeof msg === "string") return msg;
      }
    }

    if (err.context?.text) {
      const text = await err.context.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed?.message && typeof parsed.message === "string") {
          return parsed.message;
        }
      } catch {
        // not JSON, ignore
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function analyzeResumeAndPersist(
  resumeId: string,
  pdfBase64: string,
  targetRole: string,
  pdfText?: string,
) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db.functions.invoke(AI_FUNCTION_NAME, {
    body: {
      action: "analyze_resume",
      payload: {
        pdfBase64: pdfText ? undefined : pdfBase64,
        pdfText: pdfText?.slice(0, 12000),
        targetRole,
      },
    },
  });

  if (error) {
    const friendlyMessage = await extractEdgeFunctionErrorMessage(error);
    throw new Error(friendlyMessage ?? getFunctionErrorMessage(error, AI_FUNCTION_NAME));
  }

  // Defensive check — function may have returned our error shape even on 2xx
  if (data?.error) {
    throw new Error(data.message || "Could not analyze this resume. Please try again.");
  }

  const result = data as AnalyzeResumeResult;
  if (!result?.feedback || typeof result.feedback.atsScore !== "number") {
    throw new Error("AI analysis returned an unexpected response. Please try uploading again.");
  }

  const { error: updateResumeError } = await db
    .from("resumes")
    .update({ ai_feedback: result.feedback })
    .eq("id", resumeId)
    .eq("user_id", userId);

  if (updateResumeError) {
    throw formatDbError(updateResumeError, "Saving resume analysis");
  }

  const { error: insertPathError } = await db.from("career_paths").insert({
    user_id: userId,
    resume_id: resumeId,
    paths: result.careerPaths,
  });

  if (insertPathError) {
    throw formatDbError(insertPathError, "Saving career paths");
  }

  if (result.interviewOpener) {
    const interviewSeed: InterviewMessage[] = [
      {
        sender: "ai",
        message: result.interviewOpener,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    const { error: seedError } = await db.from("interviews").insert({
      user_id: userId,
      resume_id: resumeId,
      conversation: interviewSeed,
    });

    if (seedError) {
      throw formatDbError(seedError, "Saving interview starter");
    }
  }

  return result;
}

export async function getInterviewReply(
  conversation: InterviewMessage[],
  targetRole: string,
) {
  const db = ensureClient();

  const { data, error } = await db.functions.invoke(AI_FUNCTION_NAME, {
    body: {
      action: "interview_reply",
      payload: { conversation, targetRole },
    },
  });

  if (error) {
    const friendlyMessage = await extractEdgeFunctionErrorMessage(error);
    throw new Error(friendlyMessage ?? getFunctionErrorMessage(error, AI_FUNCTION_NAME));
  }

  if (data?.error) {
    throw new Error(data.message || "Could not get an interview reply. Please try again.");
  }

  const message = (data as { message?: string } | null)?.message;
  if (!message) {
    throw new Error("AI interview API returned an empty message.");
  }

  return message;
}

export type GeneratedDocument = {
  id: string;
  original_resume_id: string | null;
  job_title: string;
  generated_resume_path: string;
  generated_cover_letter: string;
  created_at: string;
};

export type UserSubscription = {
  status: string;
  quota_per_day: number;
  daily_used: number;
  current_period_end: string | null;
  current_period_start?: string | null;
  cancel_at_period_end?: boolean;
  plan_id?: string | null;
};

export type SubscriptionPlan = {
  name: string;
  slug: string;
  quota_per_day: number;
};

export type UserSubscriptionDetails = UserSubscription & {
  plan: SubscriptionPlan | null;
};

export type UserProfileRecord = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type ProfileSummary = {
  profile: UserProfileRecord;
  subscription: UserSubscriptionDetails | null;
  aiUsage: number;
  resumeCount: number;
  interviewCount: number;
  careerPathCount: number;
  tailoredDocCount: number;
  latestAtsScore: number | null;
  recentResumes: ResumeRecord[];
  recentInterviews: InterviewRecord[];
  recentDocuments: GeneratedDocument[];
};

export async function updateUserProfile(updates: { name: string }) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();
  const name = updates.name.trim();

  if (!name) {
    throw new Error("Name cannot be empty.");
  }

  const { data, error } = await db
    .from("users")
    .update({ name })
    .eq("id", userId)
    .select("id, name, email, created_at")
    .single();

  if (error) throw formatDbError(error, "Updating profile");
  return data as UserProfileRecord;
}

export async function getUserSubscriptionDetails(): Promise<UserSubscriptionDetails | null> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data: subscription, error } = await db
    .from("user_subscriptions")
    .select(
      "status, quota_per_day, daily_used, current_period_end, current_period_start, cancel_at_period_end, plan_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw formatDbError(error, "Fetching subscription");
  if (!subscription) return null;

  let plan: SubscriptionPlan | null = null;
  if (subscription.plan_id) {
    const { data: planData, error: planError } = await db
      .from("subscription_plans")
      .select("name, slug, quota_per_day")
      .eq("id", subscription.plan_id)
      .maybeSingle();

    if (planError) throw formatDbError(planError, "Fetching subscription plan");
    plan = planData;
  }

  return { ...subscription, plan };
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const [
    profile,
    subscription,
    aiUsage,
    resumeCount,
    interviewCount,
    careerPathCount,
    latestResume,
    resumes,
    interviews,
    documents,
  ] = await Promise.all([
    getUserProfile(),
    getUserSubscriptionDetails(),
    getAiUsage("resume_tailoring"),
    getResumeCount(),
    getInterviewCount(),
    getCareerPathCount(),
    getLatestResumeRecord(),
    getResumesForUser(),
    getInterviewsForUser(),
    getGeneratedDocuments(),
  ]);

  const feedback = latestResume?.ai_feedback as { atsScore?: number } | null;
  const latestAtsScore =
    typeof feedback?.atsScore === "number" ? feedback.atsScore : null;

  return {
    profile,
    subscription,
    aiUsage,
    resumeCount,
    interviewCount,
    careerPathCount,
    tailoredDocCount: documents.length,
    latestAtsScore,
    recentResumes: resumes.slice(0, 5),
    recentInterviews: interviews.slice(0, 5),
    recentDocuments: documents.slice(0, 5),
  };
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("user_subscriptions")
    .select("status, quota_per_day, daily_used, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw formatDbError(error, "Fetching subscription");
  return data;
}

export async function activateSubscriptionAfterCheckout(): Promise<UserSubscription | null> {
  const db = ensureClient();

  const { error: rpcError } = await db.rpc("activate_user_subscription", {
    p_plan_slug: "pro-monthly",
  });
  if (rpcError) throw formatDbError(rpcError, "Activating subscription");

  return getUserSubscription();
}

export async function getAiUsage(featureName: string): Promise<number> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("ai_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_name", featureName)
    .maybeSingle();

  if (error) throw formatDbError(error, "Fetching AI usage");
  return data?.usage_count ?? 0;
}

export type TailoringCredits = {
  used: number;
  limit: number;
  isPro: boolean;
};

export async function getTailoringCredits(): Promise<TailoringCredits> {
  // Billing paused — unlimited free tailoring until SUBSCRIPTION_ENABLED is true.
  if (!SUBSCRIPTION_ENABLED) {
    return { used: 0, limit: 9999, isPro: true };
  }

  const subscription = await getUserSubscription();
  const isPro = subscription?.status === "active";

  if (isPro) {
    return {
      used: subscription?.daily_used ?? 0,
      limit: subscription?.quota_per_day ?? 25,
      isPro: true,
    };
  }

  return {
    used: await getAiUsage("resume_tailoring"),
    limit: 2,
    isPro: false,
  };
}

function isLimitReachedCode(code: unknown): boolean {
  return typeof code === "string" && code.toLowerCase() === "limit_reached";
}

function truncateBase64(base64: string, maxChars = 500_000): string {
  if (base64.length <= maxChars) return base64;
  return base64.slice(0, maxChars);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Could not read resume file."));
    reader.readAsDataURL(blob);
  });
}

export async function saveResumeExtractedText(resumeId: string, pdfText: string): Promise<void> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();
  const trimmed = pdfText.trim().slice(0, 12000);
  if (!trimmed) return;

  const { data: existing, error: readError } = await db
    .from("resumes")
    .select("ai_feedback")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw formatDbError(readError, "Reading resume");

  const feedback =
    existing?.ai_feedback && typeof existing.ai_feedback === "object" && !Array.isArray(existing.ai_feedback)
      ? (existing.ai_feedback as Record<string, unknown>)
      : {};

  const { error: updateError } = await db
    .from("resumes")
    .update({
      ai_feedback: {
        ...feedback,
        extractedText: trimmed,
      },
    })
    .eq("id", resumeId)
    .eq("user_id", userId);

  if (updateError) throw formatDbError(updateError, "Saving resume text");
}

export async function fetchResumeContentForTailoring(resumeId: string): Promise<{
  pdfText: string;
  pdfBase64: string;
}> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data: resume, error } = await db
    .from("resumes")
    .select("file_path, file_name")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !resume) {
    throw new Error("Could not find the selected resume.");
  }

  if (resume.file_path.startsWith("local-only/")) {
    throw new Error("This resume was saved without storage access. Upload it again.");
  }

  const { data: blob, error: downloadError } = await db.storage
    .from(STORAGE_BUCKET_NAME)
    .download(resume.file_path);

  if (downloadError || !blob) {
    throw new Error("Could not download the resume file from storage.");
  }

  const file = new File([blob], resume.file_name, { type: "application/pdf" });
  const pdfText = await extractTextFromPdf(file);
  const pdfBase64 = truncateBase64(await blobToBase64(blob));
  return { pdfText, pdfBase64 };
}

export async function tailorResumeAndGenerateCoverLetter(payload: {
  jobTitle: string;
  jobDescription: string;
  resumeId?: string;
  pdfText?: string;
  pdfBase64?: string;
}) {
  const db = ensureClient();
  const pdfText = payload.pdfText?.trim().slice(0, 12000) ?? "";
  const pdfBase64 = payload.pdfBase64?.trim() ? truncateBase64(payload.pdfBase64.trim()) : "";

  // Deployed ai-career-coach reads `payload.file` — not pdfBase64/pdfText alone.
  const fileContent = pdfBase64 || pdfText;

  if (!fileContent) {
    throw new Error(
      "No resume content was extracted. Upload a text-based PDF (not a scanned image).",
    );
  }

  if (payload.resumeId && pdfText) {
    await saveResumeExtractedText(payload.resumeId, pdfText);
  }

  const invokePayload = {
    jobTitle: payload.jobTitle,
    jobDescription: payload.jobDescription,
    resumeId: payload.resumeId,
    file: fileContent,
    pdfBase64: pdfBase64 || undefined,
    pdfText: pdfText || undefined,
    resumeText: pdfText || undefined,
    fileBase64: pdfBase64 || undefined,
    resumeFile: fileContent,
  };

  interface CreditLimitError extends Error {
    code: "limit_reached";
    limit: number;
    price: string;
  }

  const { data, error } = await db.functions.invoke(AI_FUNCTION_NAME, {
    body: {
      action: "tailor_resume",
      ...invokePayload,
      payload: invokePayload,
    },
  });

  if (error) {
    const friendlyMessage = await extractEdgeFunctionErrorMessage(error);
    let isCreditLimit = false;
    let limit = 2;
    let price = getProPlanUsdFallback();
    let limitMessage = friendlyMessage;
    try {
      const errContext = (error as { context?: { text?: () => Promise<string> } }).context;
      if (errContext) {
        const bodyText = await errContext.text();
        const bodyObj = JSON.parse(bodyText) as {
          error?: string;
          limit?: number;
          price?: string;
          message?: string;
        };
        if (isLimitReachedCode(bodyObj.error)) {
          isCreditLimit = true;
          limit = bodyObj.limit ?? 2;
          price = bodyObj.price ?? getProPlanUsdFallback();
          limitMessage = bodyObj.message ?? limitMessage;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    if (isCreditLimit && SUBSCRIPTION_ENABLED) {
      const customErr = new Error(limitMessage ?? `Limit reached: ${limit} credits used.`) as CreditLimitError;
      customErr.code = "limit_reached";
      customErr.limit = limit;
      customErr.price = price;
      throw customErr;
    }

    throw new Error(friendlyMessage ?? getFunctionErrorMessage(error, AI_FUNCTION_NAME));
  }

  if (data?.error) {
    if (isLimitReachedCode(data.error) && SUBSCRIPTION_ENABLED) {
      const customErr = new Error(data.message) as CreditLimitError;
      customErr.code = "limit_reached";
      customErr.limit = data.limit;
      customErr.price = data.price;
      throw customErr;
    }
    throw new Error(data.message || "Failed to tailor resume.");
  }

  return data as {
    tailoredResume: string;
    coverLetter: string;
    usageCount: number;
    documentId: string;
  };
}

export async function getGeneratedDocuments(): Promise<GeneratedDocument[]> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
    .from("generated_documents")
    .select("id, original_resume_id, job_title, generated_resume_path, generated_cover_letter, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw formatDbError(error, "Fetching generated documents");
  return (data ?? []) as GeneratedDocument[];
}

export async function deleteGeneratedDocument(id: string, storagePath?: string): Promise<void> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  if (storagePath) {
    try {
      await db.storage.from("resumes").remove([storagePath]);
    } catch (storageErr) {
      console.error("Failed to remove tailored resume from storage:", storageErr);
    }
  }

  const { error } = await db
    .from("generated_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw formatDbError(error, "Deleting generated document");
}

