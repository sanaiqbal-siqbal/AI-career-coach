import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  sender: "user" | "ai";
  timestamp?: string;
}

export function ChatBubble({ message, sender, timestamp }: ChatBubbleProps) {
  const isUser = sender === "user";

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "gradient-primary" : "gradient-accent"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-accent-foreground" />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "gradient-primary text-primary-foreground rounded-tr-md"
            : "bg-card border border-border text-card-foreground rounded-tl-md"
        }`}
      >
        <p>{message}</p>
        {timestamp && (
          <span className={`mt-1 block text-[10px] ${isUser ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
