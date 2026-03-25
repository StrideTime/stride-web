import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
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
import { KeyboardShortcutsSection } from "./personal/KeyboardShortcutsSection";
import { PersonalBillingSection } from "./personal/PersonalBillingSection";
import { WorkspaceGeneralSection } from "./workspace-admin/WorkspaceGeneralSection";
import { WorkspaceTeamSection } from "./workspace-admin/WorkspaceTeamSection";
import { WorkspaceStatsSection } from "./workspace-admin/WorkspaceStatsSection";
import { WorkspaceConnectionsSection } from "./workspace-admin/WorkspaceConnectionsSection";
import { MyPreferencesSection } from "./my-workspace/MyPreferencesSection";
import { MyScheduleSection } from "./my-workspace/MyScheduleSection";

// ─── Section component map ──────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<string, React.FC> = {
  "account":          AccountSection,
  "appearance":       AppearanceSection,
  "notifications":    NotificationsSection,
  "shortcuts":        KeyboardShortcutsSection,
  "billing":          PersonalBillingSection,
  "ws-general":       WorkspaceGeneralSection,
  "ws-team":          WorkspaceTeamSection,
  "ws-stats":         WorkspaceStatsSection,
  "ws-connections":   WorkspaceConnectionsSection,
  "my-preferences":   MyPreferencesSection,
  "my-schedule":      MyScheduleSection,
};

// ─── Section descriptions ───────────────────────────────────────────────────

const SECTION_DESC: Record<string, string> = {
  "account":          "Manage your account credentials and security.",
  "appearance":       "Customize how the app looks and feels.",
  "notifications":    "Choose what you get notified about and how.",
  "shortcuts":        "View and customize keyboard shortcuts.",
  "billing":          "View and manage your plans and payment details.",
  "ws-general":       "Configure organization information, regional settings, and user statuses.",
  "ws-team":          "Manage teams, members, and seat usage for this organization.",
  "ws-stats":         "Configure what activities are tracked and who can see member statistics.",
  "ws-connections":   "Connect third-party tools to import tasks and sync calendars.",
  "my-preferences":   "Personalize your task views and quick actions for this workspace.",
  "my-schedule":      "Configure your working hours and breaks for this workspace.",
};

// ─── Main ───────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { section: urlSection } = useParams();
  const navigate = useNavigate();
  const {
    activeWorkspace, workspaceRole, myTeams,
  } = useApp();

  const isAdmin = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isTeamAdmin = myTeams.some((mt) => mt.role === "ADMIN");

  // Resolve current section from URL
  let sectionId = urlSection ?? "account";

  // Migrate old section IDs
  const migrated = SECTION_ID_MIGRATION[sectionId];
  if (migrated) {
    sectionId = migrated;
  }

  // Auto-redirect if section not visible or invalid
  const visibleItems = getVisibleNavItems(isAdmin, isTeamAdmin, activeWorkspace.type);
  const currentItem = SETTINGS_NAV_ITEMS.find((i) => i.id === sectionId);
  const isVisible = currentItem && visibleItems.some((i) => i.id === sectionId);

  useEffect(() => {
    if (migrated && migrated !== urlSection) {
      navigate(`/settings/${migrated}`, { replace: true });
    } else if (!isVisible) {
      navigate("/settings/account", { replace: true });
    }
  }, [isVisible, migrated, urlSection, navigate]);

  // ── Resolve current section ──
  const category = getCategoryForSection(sectionId);
  const categoryMeta = category ? CATEGORY_META[category] : null;
  const SectionComponent = SECTION_COMPONENTS[sectionId];
  const isOrgSection = category === "workspace-admin";
  const isWorkspaceScoped = currentItem?.workspaceScoped;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* ── Page header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            {currentItem && <currentItem.icon className="h-4 w-4 text-muted-foreground" />}
            <h1 className="text-foreground">{currentItem?.label ?? "Settings"}</h1>
            {isWorkspaceScoped && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-medium bg-chart-2/10 text-chart-2">
                {activeWorkspace.name}
              </span>
            )}
            {isOrgSection && categoryMeta && (
              <span className={cn("ml-1 text-xs px-2 py-0.5 rounded-full uppercase tracking-wide font-medium", categoryMeta.badgeBg)}>
                {activeWorkspace.type === "PERSONAL" && categoryMeta.personalLabel ? categoryMeta.personalLabel : categoryMeta.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {SECTION_DESC[sectionId] ?? ""}
          </p>
        </div>

        {/* ── Org context banner ── */}
        {isOrgSection && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-border bg-muted/30">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: `${activeWorkspace.color}15`, color: activeWorkspace.color }}>
              <activeWorkspace.Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activeWorkspace.name}</p>
              <p className="text-xs text-muted-foreground">Changes affect everyone in this organization</p>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
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
