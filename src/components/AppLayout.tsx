import { Route, Routes } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import Dashboard from "@/pages/Dashboard";
import UploadResume from "@/pages/UploadResume";
import ResumeAnalysis from "@/pages/ResumeAnalysis";
import CareerPaths from "@/pages/CareerPaths";
import MockInterview from "@/pages/MockInterview";
import NotFound from "@/pages/NotFound";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadResume />} />
              <Route path="/analysis" element={<ResumeAnalysis />} />
              <Route path="/careers" element={<CareerPaths />} />
              <Route path="/interview" element={<MockInterview />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
