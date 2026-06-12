import { useEffect, useState } from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const metadataName =
      typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
    setDisplayEmail(user?.email ?? "");
    setDisplayName(metadataName);

    if (!isSupabaseConfigured || !user) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        setDisplayName(profile.name);
        setDisplayEmail(profile.email);
      } catch {
        setDisplayName(metadataName || "User");
        setDisplayEmail(user.email ?? "");
      }
    };

    void loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    queryClient.clear();
    navigate("/login", { replace: true });
    setSigningOut(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-foreground">AI Career Coach</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-foreground">{displayName || "User"}</p>
          <p className="text-xs text-muted-foreground">{displayEmail}</p>
        </div>
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
