import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Upload, FileText, X, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  analyzeResumeAndPersist,
  deleteResume,
  getResumesForUser,
  uploadResumeFile,
  type ResumeRecord,
} from "@/lib/data";

function formatResumeDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function AtsBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-primary" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground">{score}</span>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function UploadResume() {
  const { loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetRole, setTargetRole] = useState("Frontend Engineer");
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingMultiple, setDeletingMultiple] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadResumes = useCallback(async () => {
    setLoadingHistory(true);
    try { setResumes(await getResumesForUser()); }
    catch (error) {
      toast({ title: "Could not load history", description: error instanceof Error ? error.message : "Please try again." });
    } finally { setLoadingHistory(false); }
  }, [toast]);

  useEffect(() => {
    if (authLoading) { setLoadingHistory(false); return; }
    void loadResumes();
  }, [authLoading, loadResumes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  }, []);

  const handleDelete = async (resumeId: string) => {
    setDeletingId(resumeId);
    try {
      await deleteResume(resumeId);
      toast({ title: "Resume deleted" });
      await loadResumes();
    } catch (error) {
      toast({ title: "Could not delete", description: error instanceof Error ? error.message : "Please try again." });
    } finally { setDeletingId(null); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === resumes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(resumes.map((r) => r.id)));
    }
  };

  const handleMultiDelete = async () => {
    setDeletingMultiple(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteResume(id)));
      toast({ title: `${selectedIds.size} resume${selectedIds.size > 1 ? "s" : ""} deleted` });
      setSelectedIds(new Set());
      setSelectMode(false);
      await loadResumes();
    } catch (error) {
      toast({ title: "Could not delete", description: error instanceof Error ? error.message : "Please try again." });
    } finally { setDeletingMultiple(false); }
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleAnalyze = async () => {
    if (!file || saving) return;
    try {
      setSaving(true);
      const pdfBase64 = await fileToBase64(file);
      const savedResume = await uploadResumeFile(file);
      await analyzeResumeAndPersist(savedResume.id, pdfBase64, targetRole);
      await loadResumes();
      toast({ title: "Resume analyzed ✓", description: "Your AI analysis is ready." });
      navigate("/analysis");
    } catch (error) {
      toast({ title: "Analysis failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Your Resume</h2>
        <p className="mt-1 text-muted-foreground">Upload a PDF and our AI will score, analyze, and coach you in seconds.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="target-role" className="text-sm font-medium text-foreground">Target role</label>
        <input id="target-role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
      </div>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)} onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
          dragging ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]"
        }`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 ${
          dragging ? "gradient-primary shadow-glow" : "bg-primary/10"
        }`}>
          <Upload className={`h-7 w-7 transition-colors ${dragging ? "text-white" : "text-primary"}`} />
        </div>
        <div>
          <p className="font-semibold text-foreground">Drag & drop your resume here</p>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse — PDF only, max 5MB</p>
        </div>
        <input type="file" accept=".pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          className="absolute inset-0 cursor-pointer opacity-0" />
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button disabled={!file || saving || !targetRole.trim()} onClick={() => void handleAnalyze()}
        className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3.5 text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40">
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your resume…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Analyze Resume</>
        )}
      </button>

      {/* Resume history */}
      <div className="space-y-3 border-t border-border pt-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Resume history</h3>
          <div className="flex items-center gap-2">
            {resumes.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {resumes.length} uploaded
              </span>
            )}
            {resumes.length > 1 && !selectMode && (
              <button onClick={() => setSelectMode(true)}
                className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                Select
              </button>
            )}
            {selectMode && (
              <button onClick={cancelSelectMode}
                className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Multi-select action bar */}
        {selectMode && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <input type="checkbox"
                checked={selectedIds.size === resumes.length && resumes.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-primary cursor-pointer" />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size === 0 ? "Select all" : `${selectedIds.size} selected`}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={deletingMultiple}
                    className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50">
                    {deletingMultiple
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
                      : <><Trash2 className="h-3.5 w-3.5" /> Delete {selectedIds.size}</>
                    }
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedIds.size} resume{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the selected resume{selectedIds.size > 1 ? "s" : ""} and all related career paths and interviews.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void handleMultiDelete()}>
                      Delete {selectedIds.size > 1 ? "all" : ""}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : resumes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No resumes uploaded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {resumes.map((resume) => {
              const feedback = resume.ai_feedback as { atsScore?: number } | null;
              const atsScore = typeof feedback?.atsScore === "number" ? feedback.atsScore : null;
              const isSelected = selectedIds.has(resume.id);

              return (
                <li key={resume.id}
                  onClick={() => selectMode && toggleSelect(resume.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 shadow-card transition-all ${
                    selectMode ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:shadow-elevated"
                  }`}>

                  {/* Checkbox in select mode */}
                  {selectMode && (
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleSelect(resume.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 shrink-0 rounded accent-primary cursor-pointer" />
                  )}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{resume.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatResumeDate(resume.uploaded_at)}</p>
                  </div>
                  {atsScore !== null ? <AtsBar score={atsScore} /> : (
                    <span className="text-xs text-muted-foreground">Not analyzed</span>
                  )}

                  {/* Single delete — hidden in select mode */}
                  {!selectMode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button type="button" disabled={deletingId === resume.id}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50">
                          {deletingId === resume.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the resume and all related career paths and interviews.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => void handleDelete(resume.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}