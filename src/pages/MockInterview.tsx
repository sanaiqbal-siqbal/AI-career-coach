import { useState } from "react";
import { Send } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";

const initialMessages = [
  { sender: "ai" as const, message: "Hi Alex! I'm your AI interview coach. Let's practice for a Frontend Engineer role. Ready for your first question?", timestamp: "10:00 AM" },
  { sender: "user" as const, message: "Yes, let's go!", timestamp: "10:01 AM" },
  { sender: "ai" as const, message: "Great! Tell me about a challenging project you worked on recently. What was your role, and how did you handle obstacles?", timestamp: "10:01 AM" },
  { sender: "user" as const, message: "I led the frontend rebuild of our analytics dashboard using React and TypeScript. The main challenge was migrating from a legacy jQuery codebase while keeping the app live for 50k+ users.", timestamp: "10:03 AM" },
  { sender: "ai" as const, message: "Excellent answer! You demonstrated leadership, technical depth, and real-world impact. A suggestion: quantify the outcome — e.g., 'reduced load time by 40%' — to make it even stronger. Ready for the next question?", timestamp: "10:04 AM" },
];

export default function MockInterview() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { sender: "user", message: input.trim(), timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
    // Simulate AI reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          sender: "ai",
          message: "That's a thoughtful response. Let me follow up: how would you approach that situation differently if you had to do it again?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">Mock Interview</h2>
        <p className="mt-1 text-muted-foreground">Practice with your AI interviewer.</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 rounded-xl border border-border bg-card p-4 shadow-card">
        {messages.map((m, i) => (
          <ChatBubble key={i} sender={m.sender} message={m.message} timestamp={m.timestamp} />
        ))}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your answer..."
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={send}
          className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-card transition-all hover:shadow-elevated"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
