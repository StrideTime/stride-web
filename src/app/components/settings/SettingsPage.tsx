import { useEffect } from "react";
import { Users } from "lucide-react";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import {
  SETTINGS_NAV_ITEMS,
  CATEGORY_META,
  SECTION_ID_MIGRATION,
  getCategoryForSection,
  getVisibleNavItems,
} from "./SettingsNav";

// Section components
import { AccountSection } from "./personal/AccountSection";
import { AppearanceSection } from "./personal/AppearanceSection";
import { NotificationsSection } from "./personal/NotificationsSection";
import { PersonalBillingSection } from "./personal/PersonalBillingSection";
import { WorkspaceGeneralSection } from "./workspace-admin/WorkspaceGeneralSection";
import { WorkspaceTeamSection } from "./workspace-admin/WorkspaceTeamSection";
import { WorkspaceConnectionsSection } from "./workspace-admin/WorkspaceConnectionsSection";
import { WorkspaceBillingSection } from "./workspace-admin/WorkspaceBillingSection";
import { TeamGeneralSection } from "./team/TeamGeneralSection";
import { TeamWorkflowSection } from "./team/TeamWorkflowSection";
import { TeamMembersSection } from "./team/TeamMembersSection";
import { MyPreferencesSection } from "./my-workspace/MyPreferencesSection";
import { MyScheduleSection } from "./my-workspace/MyScheduleSection";
import { MyStatsSection } from "./my-workspace/MyStatsSection";

// ─── Section component map ──────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<string, React.FC> = {
  "account":          AccountSection,
  "appearance":       AppearanceSection,
  "notifications":    NotificationsSection,
  "billing":          PersonalBillingSection,
  "ws-general":       WorkspaceGeneralSection,
  "ws-team":          WorkspaceTeamSection,
  "ws-connections":   WorkspaceConnectionsSection,
  "ws-billing":       WorkspaceBillingSection,
  "team-general":     TeamGeneralSection,
  "team-workflow":    TeamWorkflowSection,
  "team-members":     TeamMembersSection,
  "my-preferences":   MyPreferencesSection,
  "my-schedule":      MyScheduleSection,
  "my-stats":         MyStatsSection,
  "my-notifications": NotificationsSection,
};

// ─── Section descriptions ───────────────────────────────────────────────────

const SECTION_DESC: Record<string, string> = {
  "account":          "Manage your account credentials and security.",
  "appearance":       "Customize how the app looks and feels.",
  "notifications":    "Choose what you get notified about and how.",
  "billing":          "View and manage your personal plan and payment details.",
  "ws-general":       "Configure organization information, regional settings, and user statuses.",
  "ws-team":          "Manage teams, members, and seat usage for this organization.",
  "ws-connections":   "Connect third-party tools to import tasks and sync calendars.",
  "ws-billing":       "View and manage the organization plan and seats.",
  "team-general":     "Manage team identity, visibility, and access settings.",
  "team-workflow":    "Configure task statuses, types, and team workflow.",
  "team-members":     "Manage members and roles for your team.",
  "my-preferences":   "Personalize your experience in this workspace.",
  "my-schedule":      "Configure your working hours and breaks for this workspace.",
  "my-stats":         "Choose what stats to track and who can see them.",
  "my-notifications": "Notification preferences for this organization.",
};

// ─── Main ───────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const {
    settingsSection, setSettingsSection,
    activeWorkspace, workspaceRole, myTeams,
  } = useApp();

  const isAdmin = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isTeamAdmin = myTeams.some((mt) => mt.role === "ADMIN");

  // ── Migrate old section IDs ──
  useEffect(() => {
    const migrated = SECTION_ID_MIGRATION[settingsSection];
    if (migrated) {
      setSettingsSection(migrated);
    }
  }, [settingsSection, setSettingsSection]);

  // ── Auto-redirect if section not visible ──
  const visibleItems = getVisibleNavItems(isAdmin, isTeamAdmin, activeWorkspace.type);
  const currentItem = SETTINGS_NAV_ITEMS.find((i) => i.id === settingsSection);
  const isVisible = visibleItems.some((i) => i.id === settingsSection);

  useEffect(() => {
    if (currentItem && !isVisible) {
      // Smart redirect: swap between personal/workspace notifications
      if (settingsSection === "notifications") {
        setSettingsSection("my-notifications");
      } else if (settingsSection === "my-notifications") {
        setSettingsSection("notifications");
      } else {
        setSettingsSection("account");
      }
    }
  }, [isVisible, currentItem, settingsSection, setSettingsSection]);

  // ── Resolve current section ──
  const category = getCategoryForSection(settingsSection);
  const categoryMeta = category ? CATEGORY_META[category] : null;
  const SectionComponent = SECTION_COMPONENTS[settingsSection];

  const isWorkspaceScoped = category === "workspace-admin" || category === "my-workspace" || category === "team";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* ── Page header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            {currentItem && <currentItem.icon className="h-4 w-4 text-muted-foreground" />}
            <h1 className="text-foreground">{currentItem?.label ?? "Settings"}</h1>
            {categoryMeta && (
              <span className={cn("ml-1 text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium", categoryMeta.badgeBg)}>
                {categoryMeta.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{SECTION_DESC[settingsSection] ?? ""}</p>
        </div>

        {/* ── Workspace context banner ── */}
        {isWorkspaceScoped && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-border bg-muted/30">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: `${activeWorkspace.color}15`, color: activeWorkspace.color }}>
              <activeWorkspace.Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activeWorkspace.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {category === "workspace-admin"
                  ? "Changes affect everyone in this organization"
                  : category === "team"
                    ? "Changes affect this team's workflow"
                    : "Your personal settings for this workspace"}
              </p>
            </div>
            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              workspaceRole === "OWNER" ? "bg-chart-4/10 text-chart-4"
                : workspaceRole === "ADMIN" ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}>
              {workspaceRole === "OWNER" ? "Owner" : workspaceRole === "ADMIN" ? "Admin" : "Member"}
            </span>
          </div>
        )}

        {/* ── Section content ── */}
        {SectionComponent ? (
          <SectionComponent />
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">This section is not available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
