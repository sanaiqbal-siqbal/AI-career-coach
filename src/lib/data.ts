import { supabase } from "@/lib/supabase";

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
  target_role: string | null,
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
    // Update existing session — never creates duplicates
    const { error } = await db
      .from("interviews")
      .update({ conversation })
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) throw error;
  } else {
    // First save — insert new session
    const latestResume = await getLatestResumeRecord();
    const { error } = await db.from("interviews").insert({
      user_id: userId,
      resume_id: latestResume?.id ?? null,
      conversation,
    });

    if (error) throw error;
  }
}
export async function getInterviewsForUser(): Promise<InterviewRecord[]> {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db
  .from("interviews")
  .select("id, created_at, conversation, resume:resumes(id, target_role)")
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
) {
  const db = ensureClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await db.functions.invoke(AI_FUNCTION_NAME, {
    body: {
      action: "analyze_resume",
      payload: { pdfBase64, targetRole },
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

export async function tailorResumeAndGenerateCoverLetter(payload: {
  jobTitle: string;
  jobDescription: string;
  resumeId?: string;
  pdfBase64?: string;
  pdfText?: string;
}) {
  const db = ensureClient();

  const { data, error } = await db.functions.invoke(AI_FUNCTION_NAME, {
    body: {
      action: "tailor_resume",
      payload,
    },
  });

  interface CreditLimitError extends Error {
    code: "limit_reached";
    limit: number;
    price: string;
  }

  if (error) {
    const friendlyMessage = await extractEdgeFunctionErrorMessage(error);
    // Parse error context to see if it's a 403 credit wall trigger
    let isCreditLimit = false;
    let limit = 2;
    let price = "4.99";
    try {
      const errContext = (error as { context?: { text?: () => Promise<string> } }).context;
      if (errContext) {
        const bodyText = await errContext.text();
        const bodyObj = JSON.parse(bodyText);
        if (bodyObj.error === "limit_reached") {
          isCreditLimit = true;
          limit = bodyObj.limit;
          price = bodyObj.price;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    if (isCreditLimit) {
      const customErr = new Error(`Limit reached: ${limit} credits used.`) as CreditLimitError;
      customErr.code = "limit_reached";
      customErr.limit = limit;
      customErr.price = price;
      throw customErr;
    }

    throw new Error(friendlyMessage ?? getFunctionErrorMessage(error, AI_FUNCTION_NAME));
  }

  if (data?.error) {
    if (data.error === "limit_reached") {
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

