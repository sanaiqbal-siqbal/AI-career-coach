import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, Loader2, Upload, Copy, Check, FileText, 
  CheckCircle2, Trash2, Download, Briefcase, 
  ArrowLeft, Lock, ArrowRight, RefreshCw 
} from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getResumesForUser, 
  getTailoringCredits,
  fetchResumeContentForTailoring,
  tailorResumeAndGenerateCoverLetter,
  getGeneratedDocuments,
  deleteGeneratedDocument,
  uploadResumeFile,
  type ResumeRecord,
  type GeneratedDocument
} from "@/lib/data";
import { extractTextFromPdf } from "@/lib/pdf";
import { supabase } from "@/lib/supabase";
import { SUBSCRIPTION_ENABLED } from "@/lib/pricing";
import { useProPlanPrice } from "@/hooks/use-pro-plan-price";

type Step = "input" | "resume" | "generating" | "results" | "limit_wall";

function markdownToHtml(md: string): string {
  let html = md;
  // Clean headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  const lines = html.split('\n');
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul>\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = '</ul>\n' + lines[i];
        inList = false;
      }
    }
  }
  if (inList) {
    lines.push('</ul>');
  }
  html = lines.join('\n');

  // Paragraphs
  html = html.split('\n\n').map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul') || trimmed.startsWith('<p')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

export default function TailorResume() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [uploadedResumes, setUploadedResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [loadingResumes, setLoadingResumes] = useState(false);

  // New upload file states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Credits & Pricing states (subscription UI paused — see SUBSCRIPTION_ENABLED)
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditLimit, setCreditLimit] = useState(9999);
  const [isPro, setIsPro] = useState(true);
  const [checkingCredits, setCheckingCredits] = useState(true);
  const { priceLabel, priceDetail, pkrPrice, loading: priceLoading } = useProPlanPrice();

  // Generated document states
  const [documentId, setDocumentId] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "cover_letter">("resume");
  const [copied, setCopied] = useState(false);

  // Generation progress messages
  const [progressMsg, setProgressMsg] = useState("");
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Upgrade simulated flow
  const [unlocking, setUnlocking] = useState(false);

  const loadCreditsAndHistory = useCallback(async () => {
    if (!user) return;
    try {
      setCheckingCredits(true);

      if (SUBSCRIPTION_ENABLED) {
        const credits = await getTailoringCredits();
        setCreditsUsed(credits.used);
        setCreditLimit(credits.limit);
        setIsPro(credits.isPro);

        if (!credits.isPro && credits.used >= credits.limit) {
          setStep("limit_wall");
        }
      } else {
        setCreditsUsed(0);
        setCreditLimit(9999);
        setIsPro(true);
      }

      setLoadingHistory(true);
      const docs = await getGeneratedDocuments();
      setHistory(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingCredits(false);
      setLoadingHistory(false);
    }
  }, [user]);

  /*
  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      toast({
        title: "Upgrade active",
        description: "Your resume tailoring plan is now unlocked.",
      });
      searchParams.delete("upgraded");
      setSearchParams(searchParams, { replace: true });
      void loadCreditsAndHistory().then(() => setStep("input"));
    }
  }, [searchParams, setSearchParams, toast, loadCreditsAndHistory]);
  */

  useEffect(() => {
    if (authLoading) return;
    void loadCreditsAndHistory();
  }, [authLoading, loadCreditsAndHistory]);

  const loadResumesList = async () => {
    try {
      setLoadingResumes(true);
      const list = await getResumesForUser();
      setUploadedResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch (err) {
      toast({
        title: "Could not load resumes",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleNextToResume = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter both the Job Title and Job Description.",
      });
      return;
    }
    
    if (SUBSCRIPTION_ENABLED && !isPro && creditsUsed >= creditLimit) {
      setStep("limit_wall");
      return;
    }

    void loadResumesList();
    setStep("resume");
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        toast({ title: "Invalid File", description: "Only PDF resumes are supported." });
        return;
      }
      setUploadFile(file);
      setSelectedResumeId("NEW_UPLOAD");
    }
  };

  const handleTailor = async () => {
    if (!selectedResumeId) {
      toast({ title: "Resume Required", description: "Please select an existing resume or upload a new one." });
      return;
    }

    if (selectedResumeId === "NEW_UPLOAD" && !uploadFile) {
      toast({ title: "Resume Required", description: "Please select a PDF file to upload." });
      return;
    }

    setStep("generating");
    setProgressMsg("Extracting resume content...");

    try {
      let pdfBase64 = "";
      let pdfText = "";
      let finalResumeId = selectedResumeId;

      if (selectedResumeId === "NEW_UPLOAD" && uploadFile) {
        setProgressMsg("Parsing PDF text locally...");
        pdfText = await extractTextFromPdf(uploadFile);
        if (!pdfText.trim()) {
          throw new Error(
            "Could not extract text from this PDF. Use a text-based PDF, not a scanned image.",
          );
        }

        setProgressMsg("Reading PDF for upload...");
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64 || "");
          };
          reader.onerror = () => reject(new Error("Could not read the PDF file."));
          reader.readAsDataURL(uploadFile);
        });

        setProgressMsg("Uploading new resume...");
        const savedRow = await uploadResumeFile(uploadFile, jobTitle);
        finalResumeId = savedRow.id;
      } else if (selectedResumeId !== "NEW_UPLOAD") {
        setProgressMsg("Loading selected resume...");
        const content = await fetchResumeContentForTailoring(selectedResumeId);
        pdfText = content.pdfText;
        pdfBase64 = content.pdfBase64;
        finalResumeId = selectedResumeId;
      }

      if (finalResumeId === "NEW_UPLOAD") {
        throw new Error("Resume upload did not complete. Please select your PDF again.");
      }

      if (!pdfText.trim() && !pdfBase64.trim()) {
        throw new Error(
          "Could not read resume content. Upload a text-based PDF or choose another file.",
        );
      }

      setProgressMsg("Analyzing job details...");
      // Simulate micro steps for better visual UI experience
      setTimeout(() => setProgressMsg("Mapping required skills & keyword optimization..."), 2000);
      setTimeout(() => setProgressMsg("Tailoring resume bullet points factually..."), 4500);
      setTimeout(() => setProgressMsg("Generating formal cover letter (300-450 words)..."), 7000);

      const result = await tailorResumeAndGenerateCoverLetter({
        jobTitle,
        jobDescription,
        resumeId: finalResumeId,
        pdfText: pdfText.trim() || undefined,
        pdfBase64: pdfBase64.trim() || undefined,
      });

      setTailoredResume(result.tailoredResume);
      setCoverLetter(result.coverLetter);
      setDocumentId(result.documentId);
      setCreditsUsed(result.usageCount);

      toast({ title: "Documents Ready", description: "Successfully tailored your resume and cover letter!" });
      setStep("results");
      setActiveTab("resume");
      void loadCreditsAndHistory();
    } catch (error: unknown) {
      console.error(error);
      const err = error as { code?: string; limit?: number; message?: string };
      if (SUBSCRIPTION_ENABLED && err.code === "limit_reached") {
        setCreditLimit(err.limit ?? 2);
        setStep("limit_wall");
      } else {
        toast({
          title: "Tailoring Failed",
          description: error instanceof Error ? error.message : "Something went wrong during generation.",
        });
        setStep("resume");
      }
    }
  };

  const handleCopy = () => {
    const textToCopy = activeTab === "resume" ? tailoredResume : coverLetter;
    void navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ title: "Copied to Clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDoc = () => {
    const content = activeTab === "resume" ? tailoredResume : coverLetter;
    const title = activeTab === "resume" ? `${jobTitle} Tailored Resume` : `${jobTitle} Cover Letter`;
    const htmlContent = markdownToHtml(content);
    
    // Download as HTML-based .doc
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-gradient:office:office' xmlns:w='urn:schemas-microsoft-gradient:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; margin: 1in; color: #000; }
        h1 { font-size: 18pt; margin-bottom: 8pt; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 4pt; }
        h2 { font-size: 13pt; margin-top: 14pt; margin-bottom: 4pt; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2pt; }
        h3 { font-size: 11pt; margin-top: 10pt; margin-bottom: 2pt; color: #334155; }
        p { margin-bottom: 6pt; }
        ul { margin-top: 0; margin-bottom: 6pt; padding-left: 20px; }
        li { margin-bottom: 2pt; }
        strong { font-weight: bold; }
      </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const content = activeTab === "resume" ? tailoredResume : coverLetter;
    const title = activeTab === "resume" ? `${jobTitle} Tailored Resume` : `${jobTitle} Cover Letter`;
    const htmlContent = markdownToHtml(content);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please enable popups to download PDF." });
      return;
    }
    
    printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 1in; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          h1 { font-size: 18pt; margin-bottom: 8pt; color: #000; text-align: center; font-weight: bold; text-transform: uppercase; }
          h2 { font-size: 12pt; margin-top: 14pt; margin-bottom: 6pt; color: #000; border-bottom: 1px solid #111; font-weight: bold; text-transform: uppercase; }
          h3 { font-size: 11pt; margin-top: 10pt; margin-bottom: 2pt; font-weight: bold; }
          p { margin-bottom: 8pt; }
          ul { margin-top: 0; margin-bottom: 8pt; padding-left: 20px; }
          li { margin-bottom: 3pt; }
          .no-print { display: flex; justify-content: flex-end; margin-bottom: 20px; font-family: sans-serif; }
          .btn { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 10pt; cursor: pointer; font-weight: bold; }
          .btn:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">Print / Save PDF</button>
        </div>
        <div>
          ${htmlContent}
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  /* Subscription checkout — re-enable when SUBSCRIPTION_ENABLED is true
  const handleStartCheckout = async () => {
    setUnlocking(true);
  
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
  
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("You must be signed in.");

      const origin = window.location.origin;
  
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            variantId: import.meta.env.VITE_LEMON_VARIANT_ID,
            planName: "pro-monthly",
            successUrl: `${origin}/billing/success`,
            cancelUrl: `${origin}/billing/cancel`,
          }),
        }
      );
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.message || "Could not start checkout.");
      }
  
      if (!data.checkoutUrl) {
        throw new Error("Missing checkout URL.");
      }
  
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUnlocking(false);
    }
  };
  */

  const handleStartCheckout = async () => {
    // Subscription checkout paused — uncomment block above when SUBSCRIPTION_ENABLED is true.
  };

  const handleDeleteHistory = async (id: string, storagePath: string) => {
    try {
      await deleteGeneratedDocument(id, storagePath);
      toast({ title: "Document deleted" });
      void loadCreditsAndHistory();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const viewHistoryItem = (doc: GeneratedDocument) => {
    // Open historical generation
    // Since we save the cover letter as string in DB, we can load it.
    // The resume is stored in Supabase storage generated_resume_path. We can fetch it or just display cover letter and notify.
    // Let's retrieve the resume text from storage!
    const fetchDocText = async () => {
      try {
        setStep("generating");
        setProgressMsg("Retrieving tailored documents...");
        
        const supabase = (await import("@/lib/supabase")).supabase!;
        const { data, error } = await supabase.storage.from("resumes").download(doc.generated_resume_path);
        if (error) throw error;
        
        const text = await data.text();
        setTailoredResume(text);
        setCoverLetter(doc.generated_cover_letter);
        setJobTitle(doc.job_title);
        setStep("results");
        setActiveTab("resume");
      } catch (err: unknown) {
        toast({ title: "Error retrieving documents", description: err instanceof Error ? err.message : String(err) });
        setStep("input");
      }
    };
    void fetchDocText();
  };

  if (checkingCredits) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking tailoring credits...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            Tailor Resume for Job
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optimize your resume keywords and generate a high-converting cover letter.
          </p>
        </div>
        
        {SUBSCRIPTION_ENABLED && (
        <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Credits Used:</span>
          <span className="text-sm font-bold text-foreground">{creditsUsed} / {creditLimit}</span>
        </div>
        )}
      </div>

      {/* ── Step 1: Input Job Details ────────────────────────────────────────── */}
      {step === "input" && (
        <div className="space-y-6 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              1. Job Details
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste the target job description to match skills and keywords perfectly.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="job-title" className="text-sm font-medium text-foreground">
                Job Title <span className="text-destructive">*</span>
              </label>
              <input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Marketing Manager, Operations Lead, Product Designer"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="job-desc" className="text-sm font-medium text-foreground">
                Job Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="job-desc"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description or requirements here..."
                rows={8}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextToResume}
              className="group flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-card hover:opacity-95 transition-all"
            >
              Continue
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="mt-8 border-t border-border pt-6 space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Tailoring History</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {history.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/30 transition-all">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => viewHistoryItem(doc)}
                    >
                      <p className="text-sm font-semibold text-foreground truncate">{doc.job_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => void handleDeleteHistory(doc.id, doc.generated_resume_path)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Choose Resume ─────────────────────────────────────────── */}
      {step === "resume" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("input")}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-card border border-border"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground">2. Select Resume to Tailor</h3>
          </div>

          {/* Upload New Resume */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-card text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Upload a New Resume PDF</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a different PDF resume for this role.</p>
              </div>
              
              <label className="cursor-pointer rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors">
                Select File
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileUploadChange}
                />
              </label>

              {uploadFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-medium">
                  <FileText className="h-3.5 w-3.5" />
                  {uploadFile.name}
                </div>
              )}
            </div>

            {/* List existing resumes */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Choose from Your Resumes</p>
              {loadingResumes ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : uploadedResumes.length === 0 ? (
                <div className="p-8 border border-border bg-card rounded-2xl text-center text-sm text-muted-foreground">
                  No resumes uploaded yet. Please upload a new one.
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {uploadedResumes.map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => {
                        setSelectedResumeId(r.id);
                        setUploadFile(null);
                      }}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedResumeId === r.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${selectedResumeId === r.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{r.file_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        selectedResumeId === r.id ? "border-primary bg-primary" : "border-muted"
                      }`}>
                        {selectedResumeId === r.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep("input")}
              className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50"
            >
              Back
            </button>
            <button
              onClick={() => void handleTailor()}
              className="flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-card hover:opacity-95 transition-all"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Tailor Resume
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Loading / Generating ───────────────────────────────────── */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-2xl text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-bold text-foreground animate-pulse">Tailoring Your Resume</h3>
            <p className="text-sm text-muted-foreground">{progressMsg}</p>
          </div>
          <div className="w-full max-w-xs h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary animate-progress rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* ── Step 4: Results Workspace ───────────────────────────────────────── */}
      {step === "results" && (
        <div className="space-y-6">
          {/* Workspace Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "resume"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Tailored Resume
              </button>
              <button
                onClick={() => setActiveTab("cover_letter")}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "cover_letter"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Cover Letter
              </button>
            </div>

            <div className="flex items-center gap-2 pb-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
              
              <button
                onClick={handleDownloadDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors"
                title="Download as DOCX Word file"
              >
                <Download className="h-3.5 w-3.5 text-blue-500" />
                Word (.doc)
              </button>
              
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors"
                title="Print or Save PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-500" />
                PDF
              </button>
            </div>
          </div>

          {/* Editors */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
            {activeTab === "resume" ? (
              <div className="flex flex-col h-[550px]">
                <div className="bg-muted/40 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Markdown Editor (Factual & ATS Optimized)</span>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <textarea
                  value={tailoredResume}
                  onChange={(e) => setTailoredResume(e.target.value)}
                  className="flex-1 w-full p-6 text-sm font-mono text-foreground bg-transparent focus:outline-none resize-none overflow-y-auto leading-relaxed"
                />
              </div>
            ) : (
              <div className="flex flex-col h-[550px]">
                <div className="bg-muted/40 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Cover Letter Editor</span>
                  <span className="text-[10px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">300-450 Words</span>
                </div>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="flex-1 w-full p-6 text-sm text-foreground bg-transparent focus:outline-none resize-none overflow-y-auto leading-relaxed"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("input")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Tailor Another
            </button>
            
            <button
              onClick={() => navigate("/app/dashboard")}
              className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-card"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Subscription paywall — re-enable when SUBSCRIPTION_ENABLED is true */}
      {SUBSCRIPTION_ENABLED && step === "limit_wall" && (
        <div className="space-y-6">
          <div className="mx-auto max-w-md bg-card border-2 border-primary/20 rounded-3xl p-8 text-center space-y-6 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Free plan limit
            </div>

            <div className="p-4 bg-primary/10 rounded-full text-primary w-fit mx-auto">
              <Lock className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">Upgrade Your Plan</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ve used all {creditLimit} free resume tailoring credits. Upgrade to Pro to keep tailoring resumes and generating cover letters.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resume tailoring</span>
                <span className="font-semibold text-foreground">25 / day</span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2.5">
                <span className="text-muted-foreground">Cover letter generation</span>
                <span className="font-semibold text-foreground">25 / day</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1">
                <span className="text-foreground">Pro plan</span>
                <span className="text-primary">
                  {priceLoading ? "Loading price..." : priceLabel}
                </span>
              </div>
              {!priceLoading && (
                <p className="text-xs text-muted-foreground">
                  Billed at Rs. {pkrPrice.toLocaleString()} on checkout · USD estimate based on today&apos;s rate
                </p>
              )}
            </div>

            <button
              onClick={() => void handleStartCheckout()}
              disabled={unlocking}
              className="w-full flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground py-3.5 text-sm font-bold shadow-card hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {unlocking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to secure checkout...
                </>
              ) : (
                <>
                  Upgrade Your Plan
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>

            <Link
              to="/app/profile"
              className="block text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              View plan details on profile
            </Link>
          </div>

          {history.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Your tailored documents
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {history.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/30 transition-all"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => viewHistoryItem(doc)}
                    >
                      <p className="text-sm font-semibold text-foreground truncate">{doc.job_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleDeleteHistory(doc.id, doc.generated_resume_path)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
