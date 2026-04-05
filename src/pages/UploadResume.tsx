import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";

export default function UploadResume() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Your Resume</h2>
        <p className="mt-1 text-muted-foreground">Upload a PDF and our AI will analyze it for you.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drag & drop your resume here</p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse — PDF only, max 5MB</p>
        </div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card animate-scale-in">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        disabled={!file}
        className="w-full rounded-lg gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Analyze Resume
      </button>
    </div>
  );
}
