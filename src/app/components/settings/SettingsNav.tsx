import type { LucideIcon } from "lucide-react";
import {
  User, Palette, Bell, CreditCard, Building2, Users, Plug,
  SlidersHorizontal, CalendarDays, BarChart2, Keyboard,
} from "lucide-react";
import type { WorkspaceType } from "../../data/mockData";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SettingsCategory = "personal" | "workspace-admin";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: SettingsCategory;
  requiresAdmin?: boolean;
  /** Show if user is org admin OR team admin */
  requiresAdminOrTeamAdmin?: boolean;
  /** Only show when active workspace matches this type */
  workspaceType?: WorkspaceType;
  /** Hide when active workspace matches this type */
  hideForWorkspaceType?: WorkspaceType;
  /** Indicates this setting is scoped per-workspace (shown with workspace indicator) */
  workspaceScoped?: boolean;
}

export interface CategoryMeta {
  label: string;
  orgLabel?: string;
  personalLabel?: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  badgeBg: string;
}

// ─── Navigation items ───────────────────────────────────────────────────────

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // Personal — global
  { id: "account",          label: "Account",          icon: User,                category: "personal" },
  { id: "appearance",       label: "Appearance",        icon: Palette,             category: "personal" },
  // Personal — workspace-scoped
  { id: "my-preferences",   label: "Preferences",       icon: SlidersHorizontal,   category: "personal", workspaceScoped: true },
  { id: "my-schedule",      label: "Schedule",           icon: CalendarDays,        category: "personal", workspaceScoped: true },
  { id: "notifications",    label: "Notifications",      icon: Bell,                category: "personal" },
  { id: "shortcuts",        label: "Keyboard Shortcuts", icon: Keyboard,            category: "personal" },
  // Organization (admin sees all, team admin sees only Teams & Members)
  { id: "ws-general",       label: "General",            icon: Building2,           category: "workspace-admin", requiresAdmin: true },
  { id: "ws-team",          label: "Teams & Members",    icon: Users,               category: "workspace-admin", requiresAdminOrTeamAdmin: true },
  { id: "ws-stats",         label: "Stats & Tracking",   icon: BarChart2,           category: "workspace-admin", requiresAdmin: true },
  { id: "ws-connections",   label: "Connections",         icon: Plug,                category: "workspace-admin", requiresAdmin: true },
  { id: "billing",          label: "Billing",            icon: CreditCard,          category: "workspace-admin", requiresAdmin: true },
];

// ─── Category metadata ──────────────────────────────────────────────────────

export const CATEGORY_META: Record<SettingsCategory, CategoryMeta> = {
  "personal": {
    label: "Personal",
    description: "Your account and preferences",
    icon: User,
    accent: "text-muted-foreground",
    badgeBg: "bg-muted text-muted-foreground",
  },
  "workspace-admin": {
    label: "Organization",
    personalLabel: "Workspace",
    description: "Settings for everyone in this organization",
    icon: Building2,
    accent: "text-chart-4",
    badgeBg: "bg-chart-4/10 text-chart-4",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Old section ID → new section ID migration map */
export const SECTION_ID_MIGRATION: Record<string, string> = {
  "time":             "my-preferences",
  "display":          "appearance",
  "schedule":         "my-schedule",
  "notif":            "notifications",
  "connections":      "ws-connections",
  "team":             "ws-team",
  "team-general":     "ws-team",
  "team-workflow":    "ws-team",
  "team-members":     "ws-team",
  "my-notifications": "notifications",
  "ws-billing":       "billing",
  "my-stats":         "ws-stats",
};

/** Get the category for a given section ID */
export function getCategoryForSection(sectionId: string): SettingsCategory | null {
  const item = SETTINGS_NAV_ITEMS.find((i) => i.id === sectionId);
  return item?.category ?? null;
}

/** Get visible nav items based on user's role and active workspace type */
export function getVisibleNavItems(
  isAdmin: boolean,
  isTeamAdmin: boolean,
  workspaceType: WorkspaceType = "PERSONAL",
): SettingsNavItem[] {
  return SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresAdminOrTeamAdmin && !isAdmin && !isTeamAdmin) return false;
    if (item.workspaceType && item.workspaceType !== workspaceType) return false;
    if (item.hideForWorkspaceType && item.hideForWorkspaceType === workspaceType) return false;
    return true;
  });
}

/** Group items by category, preserving order */
export function groupByCategory(items: SettingsNavItem[]): { category: SettingsCategory; items: SettingsNavItem[] }[] {
  const groups: { category: SettingsCategory; items: SettingsNavItem[] }[] = [];
  const seen = new Set<SettingsCategory>();

  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      groups.push({ category: item.category, items: [] });
    }
    groups.find((g) => g.category === item.category)!.items.push(item);
  }

  return groups;
}
