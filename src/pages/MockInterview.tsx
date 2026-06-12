import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2, Bot, User, Mic } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteInterview, getInterviewReply, getInterviewsForUser,
  saveInterviewConversation, type InterviewRecord,
} from "@/lib/data";

type ChatMessage = {
  sender: "ai" | "user";
  message: string;
  timestamp: string;
};

function formatInterviewDate(iso: string) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function previewMessage(conversation: ChatMessage[]) {
  const last = conversation[conversation.length - 1];
  if (!last) return "Empty conversation";
  const text = last.message.slice(0, 55);
  return text.length < last.message.length ? `${text}…` : text;
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isAI = m.sender === "ai";
  return (
    <div className={`flex gap-3 ${isAI ? "items-start" : "items-start flex-row-reverse"}`}>
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
        isAI ? "gradient-primary" : "bg-gradient-to-br from-slate-500 to-slate-600"
      }`}>
        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={`group relative max-w-[78%] ${isAI ? "" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isAI
            ? "rounded-tl-sm bg-card border border-border text-card-foreground"
            : "rounded-tr-sm gradient-primary text-white"
        }`}>
          {m.message}
        </div>
        <p className={`mt-1 text-[10px] text-muted-foreground ${isAI ? "ml-1" : "mr-1 text-right"}`}>
          {m.timestamp}
        </p>
      </div>
    </div>
  );
}

export default function MockInterview() {
  const { loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("Frontend Engineer");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const activeInterviewIdRef = useRef<string | null>(activeInterviewId);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeInterviewIdRef.current = activeInterviewId; }, [activeInterviewId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadInterviews = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await getInterviewsForUser();
      setInterviews(list);
      if (list.length > 0) {
        const latest = list[0];
        setActiveInterviewId(latest.id);
        setMessages(latest.conversation.length > 0 ? latest.conversation : []);
      } else {
        setActiveInterviewId(null);
        setMessages([]);
      }
    } catch (error) {
      toast({ title: "Could not load interviews", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    void loadInterviews();
  }, [authLoading, loadInterviews]);

  // Auto-save on tab hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && messagesRef.current.length > 0 && activeInterviewIdRef.current) {
        void saveInterviewConversation(messagesRef.current, activeInterviewIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Auto-save on tab close via beacon
  useEffect(() => {
    const handleBeforeUnload = () => {
      const msgs = messagesRef.current;
      const interviewId = activeInterviewIdRef.current;
      if (msgs.length > 0 && interviewId) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-career-coach`,
          new Blob([JSON.stringify({ action: "save_conversation", payload: { conversation: msgs, interview_id: interviewId } })],
            { type: "application/json" }),
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const selectInterview = (record: InterviewRecord) => {
    setActiveInterviewId(record.id);
    setMessages(record.conversation);
  };

  const handleDelete = async (interviewId: string) => {
    setDeletingId(interviewId);
    try {
      await deleteInterview(interviewId);
      toast({ title: "Interview deleted" });
      if (activeInterviewId === interviewId) { setActiveInterviewId(null); setMessages([]); }
      await loadInterviews();
    } catch (error) {
      toast({ title: "Could not delete", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setDeletingId(null);
    }
  };

  const send = async () => {
    if (!input.trim() || sending || messages.length === 0) return;
    const userMessage: ChatMessage = {
      sender: "user",
      message: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setInput("");
    setSending(true);
    try {
      const aiReply = await getInterviewReply(updatedWithUser.slice(-10), targetRole);
      const updatedConversation: ChatMessage[] = [
        ...updatedWithUser,
        { sender: "ai", message: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ];
      setMessages(updatedConversation);
      await saveInterviewConversation(updatedConversation, activeInterviewId);
      setInterviews((prev) => prev.map((item) =>
        item.id === activeInterviewId ? { ...item, conversation: updatedConversation } : item));
    } catch (error) {
      toast({ title: "Could not get reply", description: error instanceof Error ? error.message : "Please check your AI setup." });
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingList) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mock Interview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Practice with your AI interviewer after analyzing your resume.</p>
        </div>
        <EmptyState icon={MessageSquare} title="No interview sessions yet"
          description="Upload your resume to generate a personalized mock interview starter." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 animate-fade-in flex-col lg:flex-row">

      {/* Sidebar */}
      <div className="flex w-full flex-col gap-3 lg:w-64 lg:shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mock Interview</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Past sessions</p>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-card">
          {interviews.map((item) => (
            <div key={item.id}
              className={`flex items-start gap-1 rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                activeInterviewId === item.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:bg-muted/40"
              }`}>
              <button type="button" onClick={() => selectInterview(item)} className="min-w-0 flex-1 text-left">
                <p className="text-[11px] font-semibold text-foreground">{formatInterviewDate(item.created_at)}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{previewMessage(item.conversation)}</p>
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" disabled={deletingId === item.id}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50">
                    {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
                    <AlertDialogDescription>This conversation will be permanently removed.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void handleDelete(item.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Interviewer</p>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </p>
            </div>
          </div>
          {/* Editable target role */}
          {/* <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target role"
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-48" /> */}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">This session has no messages yet.</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
              {sending && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((d) => (
                        <span key={d} className="inline-block h-1.5 w-1.5 rounded-full bg-primary opacity-60"
                          style={{ animation: `pulse 1.2s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
              placeholder={messages.length === 0 ? "Upload a resume to start your interview…" : "Type your answer…"}
              disabled={messages.length === 0 || sending}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50" />
            <button onClick={() => void send()} disabled={sending || messages.length === 0 || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary text-white shadow-sm transition-all hover:shadow-glow disabled:opacity-40">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Press Enter to send · Conversations auto-saved
          </p>
        </div>
      </div>
    </div>
  );
}