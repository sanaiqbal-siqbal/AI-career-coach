import {
  LayoutDashboard,
  LogOut,
  Upload,
  FileSearch,
  Route,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Upload Resume", url: "/app/upload", icon: Upload },
  { title: "Resume Analysis", url: "/app/analysis", icon: FileSearch },
  { title: "Career Paths", url: "/app/careers", icon: Route },
  { title: "Mock Interview", url: "/app/interview", icon: MessageSquare },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");

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
    await signOut();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  // Close mobile sidebar when a nav item is selected
  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
            <img src="/favicon.svg" alt="AI Career Coach" className="h-9 w-9" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                AI Career Coach
              </span>
              <span className="text-[10px] text-muted-foreground">Plan · Practice · Grow</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "gradient-primary text-primary-foreground shadow-card"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 min-w-0 px-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        )}
        <button
          onClick={() => void handleSignOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}