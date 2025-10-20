import { type CSSProperties } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import ClaimsList from "@/pages/ClaimsList";
import NewClaim from "@/pages/NewClaim";
import ClaimDetail from "@/pages/ClaimDetail";
import ClaimAcceptance from "@/pages/ClaimAcceptance";
import AcceptanceList from "@/pages/AcceptanceList";
import ClaimCountermeasure from "@/pages/ClaimCountermeasure";
import CountermeasureList from "@/pages/CountermeasureList";
import TechnicalApprovalList from "@/pages/TechnicalApprovalList";
import TechnicalApproval from "@/pages/TechnicalApproval";
import Settings from "@/pages/Settings";
import NotificationSettings from "@/pages/NotificationSettings";
import NotFound from "@/pages/not-found";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import AdminUsers from "@/pages/AdminUsers";
import VersionInfo from "@/components/VersionInfo";

function Router() {
  const { t } = useTranslation();
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/acceptance" component={AcceptanceList} />
      <Route path="/claims" component={ClaimsList} />
      <Route path="/claims/new" component={NewClaim} />
      <Route path="/claims/acceptance/:id" component={ClaimAcceptance} />
      <Route path="/claims/countermeasure/:id" component={ClaimCountermeasure} />
      <Route path="/countermeasures" component={CountermeasureList} />
      <Route path="/approvals" component={TechnicalApprovalList} />
      <Route path="/approvals/:id" component={TechnicalApproval} />
      <Route path="/claims/:id" component={ClaimDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={NotificationSettings} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/analytics">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('nav.analytics')}</h1>
            <p className="text-muted-foreground">KPI・分析機能は今後実装予定です</p>
          </div>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <SidebarProvider style={style as CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="ml-auto">
              <VersionInfo />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
