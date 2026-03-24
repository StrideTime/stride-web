import type { LucideIcon } from "lucide-react";
import {
  User, Palette, Bell, CreditCard, Building2, Users, Plug,
  SlidersHorizontal, CalendarDays, BarChart2,
} from "lucide-react";
import type { WorkspaceType } from "../../data/mockData";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SettingsCategory = "personal" | "workspace-admin" | "team" | "my-workspace";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: SettingsCategory;
  requiresAdmin?: boolean;
  requiresTeamAdmin?: boolean;
  /** Only show when active workspace matches this type */
  workspaceType?: WorkspaceType;
  /** Hide when active workspace matches this type */
  hideForWorkspaceType?: WorkspaceType;
}

export interface CategoryMeta {
  label: string;
  /** Used when active workspace is an org — falls back to `label` if not set */
  orgLabel?: string;
  /** Used when active workspace is personal — falls back to `label` if not set */
  personalLabel?: string;
  description: string;
  icon: LucideIcon;
  accent: string;         // Tailwind text color class
  badgeBg: string;        // Tailwind bg color class for badge
}

// ─── Navigation items ───────────────────────────────────────────────────────

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // Personal
  { id: "account",        label: "Account",          icon: User,                category: "personal" },
  { id: "appearance",     label: "Appearance",        icon: Palette,             category: "personal" },
  { id: "notifications",  label: "Notifications",     icon: Bell,                category: "personal", hideForWorkspaceType: "ORGANIZATION" },
  { id: "billing",        label: "Billing",           icon: CreditCard,          category: "personal" },
  // Organization Admin
  { id: "ws-general",     label: "General",           icon: Building2,           category: "workspace-admin", requiresAdmin: true },
  { id: "ws-team",        label: "Teams & Members",   icon: Users,               category: "workspace-admin", requiresAdmin: true },
  { id: "ws-connections", label: "Connections",        icon: Plug,                category: "workspace-admin", requiresAdmin: true },
  { id: "ws-billing",     label: "Organization Plan", icon: CreditCard,          category: "workspace-admin", requiresAdmin: true },
  // Team
  { id: "team-general",  label: "General",            icon: Building2,           category: "team",            requiresTeamAdmin: true },
  { id: "team-workflow",  label: "Workflow",           icon: SlidersHorizontal,   category: "team",            requiresTeamAdmin: true },
  { id: "team-members",  label: "Members",            icon: Users,               category: "team",            requiresTeamAdmin: true },
  // My Workspace
  { id: "my-preferences", label: "Preferences",       icon: SlidersHorizontal,   category: "my-workspace" },
  { id: "my-schedule",    label: "Schedule",           icon: CalendarDays,        category: "my-workspace" },
  { id: "my-stats",       label: "Stats & Tracking",  icon: BarChart2,           category: "my-workspace" },
  { id: "my-notifications", label: "Notifications",   icon: Bell,                category: "my-workspace", workspaceType: "ORGANIZATION" },
];

// ─── Category metadata ──────────────────────────────────────────────────────

export const CATEGORY_META: Record<SettingsCategory, CategoryMeta> = {
  "personal": {
    label: "Personal",
    description: "Global app settings",
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
  "team": {
    label: "Team",
    description: "Team workflow and member settings",
    icon: Users,
    accent: "text-primary",
    badgeBg: "bg-primary/10 text-primary",
  },
  "my-workspace": {
    label: "My Settings",
    orgLabel: "My Settings",
    description: "Your preferences in this workspace",
    icon: SlidersHorizontal,
    accent: "text-chart-2",
    badgeBg: "bg-chart-2/10 text-chart-2",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Old section ID → new section ID migration map */
export const SECTION_ID_MIGRATION: Record<string, string> = {
  "time":        "my-preferences",
  "display":     "appearance",
  "schedule":    "my-schedule",
  "notif":       "notifications",
  "connections": "ws-connections",
  "team":        "team-workflow",
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
    if (item.requiresTeamAdmin && !isTeamAdmin) return false;
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
