import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, FileText, Plus, BarChart3, Settings, Bell, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import DarkModeToggle from "./DarkModeToggle";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";

export default function AppSidebar() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const acceptanceTitle = t("acceptance.listTitle");
  const lang = i18n.resolvedLanguage || i18n.language || "ja";

  const L = (ja: string, en: string, th: string) =>
    lang.startsWith("en") ? en : lang.startsWith("th") ? th : ja;

  const mainMenuItems = [
    {
      title: t("nav.dashboard"),
      url: "/",
      icon: Home,
    },
    {
      title: t("nav.claimsList"),
      url: "/claims",
      icon: FileText,
    },
    {
      title: t("nav.newClaim"),
      url: "/claims/new",
      icon: Plus,
    },
    {
      title: acceptanceTitle,
      url: "/acceptance",
      icon: Plus,
    },
    {
      title: t("nav.countermeasureRegister"),
      url: "/countermeasures",
      icon: Plus,
    },
    {
      title: t("nav.techApproval"),
      url: "/approvals",
      icon: Plus,
    },
  ];

  const analyticsItems = [
    {
      title: t("nav.analytics"),
      url: "/analytics",
      icon: BarChart3,
    },
  ];

  const settingsItems = [
    {
      title: t("nav.settings"),
      url: "/settings",
      icon: Settings,
    },
    {
      title: t("nav.notificationSettings"),
      url: "/notifications",
      icon: Bell,
    },
  ];

  const adminSettingsItems =
    user?.role === "admin"
      ? [
          {
            title: t("nav.userManagement"),
            url: "/admin/users",
            icon: Users,
          },
          ...settingsItems,
        ]
      : settingsItems;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <div className="font-bold text-base">
              {L("TSBクレーム管理", "TSB Claim Management", "TSB Claim Management")}
            </div>
            <div className="text-xs text-muted-foreground">
              {L("クレーム管理", "Claim Management", "Claim Management")}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {L("メインメニュー", "Main Menu", "Main Menu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link
                      href={item.url}
                      data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {L("分析", "Analytics", "Analytics")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid="link-analytics">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {L("システム", "System", "System")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminSettingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link
                      href={item.url}
                      data-testid={`link-${item.url.replace("/", "")}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground leading-tight">
            {user ? (
              <div>
                <div>
                  {user.role === "admin"
                    ? t("adminUsers.role.admin")
                    : t("adminUsers.role.general")}
                </div>
                <div className="font-semibold text-foreground">{user.name}</div>
              </div>
            ) : (
              L("ログインしてください", "Please log in", "Please log in")
            )}
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <DarkModeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}