import type { LucideIcon } from "lucide-react";
import { Zap, Rocket, Building2, Lightbulb, Settings, Palette, Megaphone, Package } from "lucide-react";

// ─── Enum-style types ────────────────────────────────────────────────────────

export type WorkspaceType = "PERSONAL" | "ORGANIZATION";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type TeamRole = "ADMIN" | "STANDARD";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "BACKLOG";
export type TaskType = "FEATURE" | "BUG" | "CHORE" | "RESEARCH";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProjectStatus = "ACTIVE" | "AT_RISK" | "ON_HOLD" | "COMPLETED";
export type BurnoutRisk = "LOW" | "MEDIUM" | "HIGH";

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  Icon: LucideIcon;
  color: string;
}

export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  Icon: LucideIcon;
  color: string;
  description: string;
}

/** role is ADMIN or STANDARD — no leadId on Team */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  teamId?: string;
  name: string;
  color: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  taskCount: number;
  openTaskCount: number;
  deadline: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface TaskHistoryEntry {
  action: string;
  userId: string;
  createdAt: string;
}

export interface Task {
  id: number;
  workspaceId: string;
  projectId?: string;
  teamId?: string;
  assigneeId?: string;
  createdBy: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  difficulty: Difficulty;
  estimatedMinutes: number;
  maxMinutes?: number;
  actualMinutes?: number;
  tagIds: string[];
  dueDate?: string;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  history?: TaskHistoryEntry[];
  externalLink?: { provider: "jira" | "github" | "linear"; id: string; url: string };
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "document" | "file";
  uploadedBy: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  color: string;
  jobTitle?: string;
}

/** Detailed member stats used in team admin views */
export interface TeamMemberStats {
  userId: string;
  role: TeamRole;
  hoursThisWeek: number;
  tasksCompletedThisWeek: number;
  tasksInProgress: number;
  streak: number;
  burnoutRisk: BurnoutRisk;
  /** Hours per day for last 7 days (Mon→Sun) */
  dailyHours: number[];
  /** Tasks completed per week for last 4 weeks */
  weeklyTaskCount: number[];
}

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const CURRENT_USER_ID = "u1";

export const USERS: User[] = [
  { id: "u1", name: "Alex Chen",      initials: "AC", email: "alex@acme.com",   color: "#61afef", jobTitle: "Engineering Lead" },
  { id: "u2", name: "Maya Rodriguez", initials: "MR", email: "maya@acme.com",   color: "#c678dd", jobTitle: "Product Designer" },
  { id: "u3", name: "Liam Park",      initials: "LP", email: "liam@acme.com",   color: "#98c379", jobTitle: "Frontend Developer" },
  { id: "u4", name: "Priya Nair",     initials: "PN", email: "priya@acme.com",  color: "#e5c07b", jobTitle: "Backend Developer" },
  { id: "u5", name: "Jordan Kim",     initials: "JK", email: "jordan@acme.com", color: "#e06c75", jobTitle: "QA Engineer" },
  { id: "u6", name: "Sam Torres",     initials: "ST", email: "sam@acme.com",    color: "#56b6c2", jobTitle: "DevOps Engineer" },
  { id: "u7", name: "Nina Walsh",     initials: "NW", email: "nina@acme.com",   color: "#d19a66", jobTitle: "Project Manager" },
];

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const WORKSPACES: Workspace[] = [
  { id: "ws1", name: "Personal",     type: "PERSONAL",     Icon: Zap,       color: "#61afef" },
  { id: "ws2", name: "Side Project", type: "PERSONAL",     Icon: Rocket,    color: "#98c379" },
  { id: "ws3", name: "Acme Corp",    type: "ORGANIZATION", Icon: Building2, color: "#c678dd" },
  { id: "ws4", name: "Velocity Inc", type: "ORGANIZATION", Icon: Lightbulb, color: "#e5c07b" },
];

export const WORKSPACE_MEMBERSHIPS: WorkspaceMembership[] = [
  // Personal workspaces
  { workspaceId: "ws1", userId: "u1", role: "OWNER" },
  { workspaceId: "ws2", userId: "u1", role: "OWNER" },
  // Acme Corp — full org with multiple roles
  { workspaceId: "ws3", userId: "u1", role: "OWNER" },   // Alex is the owner
  { workspaceId: "ws3", userId: "u2", role: "ADMIN" },   // Maya is an admin
  { workspaceId: "ws3", userId: "u3", role: "MEMBER" },  // Liam
  { workspaceId: "ws3", userId: "u4", role: "MEMBER" },  // Priya
  { workspaceId: "ws3", userId: "u5", role: "ADMIN" },   // Jordan is an admin
  { workspaceId: "ws3", userId: "u6", role: "MEMBER" },  // Sam
  { workspaceId: "ws3", userId: "u7", role: "MEMBER" },  // Nina
  // Velocity Inc
  { workspaceId: "ws4", userId: "u1", role: "MEMBER" },
];

// ─── Teams ────────────────────────────────────────────────────────────────────

export const TEAMS: Team[] = [
  { id: "t1", workspaceId: "ws3", name: "Engineering", Icon: Settings,  color: "#61afef",  description: "Core product and infrastructure" },
  { id: "t2", workspaceId: "ws3", name: "Design",      Icon: Palette,   color: "#c678dd",  description: "Product design and brand" },
  { id: "t3", workspaceId: "ws3", name: "Marketing",   Icon: Megaphone, color: "#e5c07b",  description: "Growth and campaigns" },
  { id: "t4", workspaceId: "ws4", name: "Product",     Icon: Package,   color: "#98c379",  description: "Product management" },
];

export const TEAM_MEMBERS: TeamMember[] = [
  // Engineering (t1)
  { id: "tm1",  teamId: "t1", userId: "u1", role: "ADMIN" },    // Alex = admin
  { id: "tm2",  teamId: "t1", userId: "u2", role: "ADMIN" },    // Maya = admin
  { id: "tm3",  teamId: "t1", userId: "u3", role: "STANDARD" },
  { id: "tm4",  teamId: "t1", userId: "u4", role: "STANDARD" },
  { id: "tm5",  teamId: "t1", userId: "u5", role: "STANDARD" },
  // Design (t2)
  { id: "tm6",  teamId: "t2", userId: "u1", role: "STANDARD" }, // Alex = standard
  { id: "tm7",  teamId: "t2", userId: "u6", role: "ADMIN" },
  { id: "tm8",  teamId: "t2", userId: "u7", role: "STANDARD" },
  // Marketing (t3) — Alex is NOT a member
  { id: "tm9",  teamId: "t3", userId: "u5", role: "ADMIN" },
  { id: "tm10", teamId: "t3", userId: "u6", role: "STANDARD" },
];

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const TAGS: Tag[] = [
  { id: "tag1", workspaceId: "ws3", name: "bug",      color: "#e06c75" },
  { id: "tag2", workspaceId: "ws3", name: "feature",  color: "#98c379" },
  { id: "tag3", workspaceId: "ws3", name: "design",   color: "#c678dd" },
  { id: "tag4", workspaceId: "ws3", name: "urgent",   color: "#e5c07b" },
  { id: "tag5", workspaceId: "ws3", name: "backend",  color: "#61afef" },
  { id: "tag6", workspaceId: "ws3", name: "frontend", color: "#56b6c2" },
  { id: "tag7", workspaceId: "ws3", name: "dx",       color: "#d19a66" },
  { id: "tag8", workspaceId: "ws1", name: "personal", color: "#98c379" },
  { id: "tag9", workspaceId: "ws2", name: "mvp",      color: "#e5c07b" },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
  { id: "p1", workspaceId: "ws3", teamId: "t1", name: "Stride v2.0",            color: "#61afef", description: "Core app rebuild",             status: "ACTIVE",    progress: 65, taskCount: 28, openTaskCount: 10, deadline: "Apr 30" },
  { id: "p2", workspaceId: "ws3", teamId: "t2", name: "Website Redesign",        color: "#c678dd", description: "Brand refresh and new site",    status: "AT_RISK",   progress: 40, taskCount: 19, openTaskCount: 11, deadline: "Mar 28" },
  { id: "p3", workspaceId: "ws3", teamId: "t3", name: "Q2 Campaign",             color: "#e5c07b", description: "Q2 growth initiatives",         status: "ACTIVE",    progress: 25, taskCount: 12, openTaskCount:  9, deadline: "Jun 30" },
  { id: "p4", workspaceId: "ws3",               name: "API Platform v3",          color: "#98c379", description: "Cross-team API overhaul",       status: "ON_HOLD",   progress: 15, taskCount:  8, openTaskCount:  8, deadline: "TBD" },
  { id: "p5", workspaceId: "ws3", teamId: "t1", name: "Auth Refactor",            color: "#e06c75", description: "SSO and session improvements",  status: "COMPLETED", progress: 100,taskCount: 14, openTaskCount:  0, deadline: "Mar 10" },
  { id: "p6", workspaceId: "ws2",               name: "Indie App",                color: "#98c379", description: "Personal side project",         status: "ACTIVE",    progress: 30, taskCount: 10, openTaskCount:  7, deadline: "May 15" },
  { id: "p7", workspaceId: "ws1",               name: "Learning Goals",           color: "#e5c07b", description: "Courses and reading",           status: "ACTIVE",    progress: 50, taskCount:  6, openTaskCount:  3, deadline: "Dec 31" },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const TASKS: Task[] = [
  // My tasks — varied states
  { id: 1,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Review pull requests",             type: "CHORE",    priority: "MEDIUM", status: "COMPLETED",  difficulty: "EASY",   estimatedMinutes: 30,  actualMinutes: 22,  tagIds: ["tag5"],                dueDate: "2026-03-24" },
  { id: 2,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u2", title: "Fix navigation bug",               type: "BUG",      priority: "HIGH",   status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: ["tag1", "tag6"],         dueDate: "2026-03-23", externalLink: { provider: "jira", id: "ENG-131", url: "https://acme.atlassian.net/browse/ENG-131" }, description: "The sidebar navigation collapses unexpectedly on route changes. Users lose their scroll position and expanded sections reset.\n\nSteps to reproduce:\n1. Expand a team section in the sidebar\n2. Navigate to a different page\n3. Navigate back — sidebar is fully collapsed\n\nExpected: sidebar state should persist across route changes.", comments: [{ id: "c1", userId: "u2", text: "I can reproduce this on Firefox too. Looks like the router unmounts the sidebar on every transition. Checked the React DevTools — the entire sidebar component tree gets destroyed and recreated.", createdAt: "2026-03-22T10:30:00Z" }, { id: "c2", userId: "u4", text: "Same issue on Safari. Also noticed it resets the scroll position in the sidebar which is really annoying for long team lists.", createdAt: "2026-03-22T11:15:00Z" }, { id: "c3", userId: "u1", text: "Found the root cause — the Layout component had a key prop tied to the route pathname, so every navigation caused a full remount. Removing the key and using a stable wrapper fixes it.", createdAt: "2026-03-23T14:15:00Z" }, { id: "c4", userId: "u2", text: "Confirmed fix works. Sidebar state persists now. Nice catch @Alex Chen", createdAt: "2026-03-23T15:30:00Z" }], history: [{ action: "Created task", userId: "u2", createdAt: "2026-03-20T09:00:00Z" }, { action: "Assigned to Alex Chen", userId: "u2", createdAt: "2026-03-20T09:01:00Z" }, { action: "Added tag: bug", userId: "u2", createdAt: "2026-03-20T09:01:00Z" }, { action: "Added tag: frontend", userId: "u2", createdAt: "2026-03-20T09:02:00Z" }, { action: "Changed status to In Progress", userId: "u1", createdAt: "2026-03-22T08:00:00Z" }, { action: "Logged 45m of work", userId: "u1", createdAt: "2026-03-22T12:00:00Z" }, { action: "Changed priority from Medium to High", userId: "u2", createdAt: "2026-03-22T10:35:00Z" }, { action: "Changed difficulty from Easy to Medium", userId: "u1", createdAt: "2026-03-22T14:00:00Z" }, { action: "Logged 26m of work", userId: "u1", createdAt: "2026-03-23T15:00:00Z" }, { action: "Changed status to Completed", userId: "u1", createdAt: "2026-03-23T15:00:00Z" }] },
  { id: 3,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Weekly standup notes",             type: "CHORE",    priority: "LOW",    status: "COMPLETED",  difficulty: "EASY",   estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [],                       dueDate: "2026-03-24" },
  { id: 4,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Update API documentation",         type: "CHORE",    priority: "MEDIUM", status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 45,  actualMinutes: 38,  tagIds: ["tag5", "tag7"],         dueDate: "2026-03-22" },
  { id: 5,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Redesign dashboard components",    type: "FEATURE",  priority: "HIGH",   status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 120, maxMinutes: 150, actualMinutes: 105, tagIds: ["tag2", "tag6", "tag3"], dueDate: "2026-03-25", externalLink: { provider: "jira", id: "ENG-156", url: "https://acme.atlassian.net/browse/ENG-156" }, description: "Overhaul the dashboard task cards, stat widgets, and schedule view to match the new design system. Includes new time tracking insights and status-based color coding.\n\nScope:\n- Task card redesign with type/priority pills\n- Smart insight line (time tracking, due date urgency)\n- Board view column improvements\n- Completed section as collapsible\n- Detail modal with comments and activity", attachments: [{ id: "a1", name: "dashboard-mockup-v3.png", size: "2.4 MB", type: "image", uploadedBy: "u1", uploadedAt: "2026-03-23T14:00:00Z" }, { id: "a2", name: "design-spec.pdf", size: "840 KB", type: "document", uploadedBy: "u6", uploadedAt: "2026-03-22T09:30:00Z" }], comments: [{ id: "c10", userId: "u6", text: "Uploaded the latest mockups. The card layout uses a two-row approach — title on top, metadata pills below. Let me know if the spacing looks right.", createdAt: "2026-03-22T09:45:00Z" }, { id: "c11", userId: "u1", text: "Looks great @Nina Walsh. I think the status pill should be the first element in the metadata row since that's what people scan for first. Also the board cards need the same treatment.", createdAt: "2026-03-22T10:30:00Z" }, { id: "c12", userId: "u6", text: "Good call. Updated the spec — status pill is now first, followed by type and priority. Board cards have a simplified version.", createdAt: "2026-03-22T14:00:00Z" }, { id: "c13", userId: "u3", text: "The insight line is a really nice touch. One question — should we show the due date separately when the insight already mentions it? Feels redundant.", createdAt: "2026-03-23T09:00:00Z" }, { id: "c14", userId: "u1", text: "@Liam Park yeah we only show the due date on the right when the insight level is 'normal'. If the due date is urgent, it's baked into the insight text already.", createdAt: "2026-03-23T09:15:00Z" }], history: [{ action: "Created task", userId: "u1", createdAt: "2026-03-18T10:00:00Z" }, { action: "Assigned to Alex Chen", userId: "u1", createdAt: "2026-03-18T10:00:00Z" }, { action: "Changed title from 'Update dashboard UI' to 'Redesign dashboard components'", userId: "u1", createdAt: "2026-03-19T08:00:00Z" }, { action: "Changed difficulty from Medium to Hard", userId: "u1", createdAt: "2026-03-19T08:05:00Z" }, { action: "Changed estimate from 90m to 120m", userId: "u1", createdAt: "2026-03-19T08:05:00Z" }, { action: "Set time cap to 150m", userId: "u1", createdAt: "2026-03-19T08:10:00Z" }, { action: "Added tag: feature", userId: "u1", createdAt: "2026-03-19T08:10:00Z" }, { action: "Added tag: frontend", userId: "u1", createdAt: "2026-03-19T08:10:00Z" }, { action: "Added tag: design", userId: "u6", createdAt: "2026-03-22T09:30:00Z" }, { action: "Changed status to In Progress", userId: "u1", createdAt: "2026-03-20T09:00:00Z" }, { action: "Logged 2h of work", userId: "u1", createdAt: "2026-03-20T17:00:00Z" }, { action: "Logged 1h 30m of work", userId: "u1", createdAt: "2026-03-21T17:00:00Z" }, { action: "Changed priority from Medium to High", userId: "u2", createdAt: "2026-03-22T11:00:00Z" }, { action: "Logged 1h 45m of work", userId: "u1", createdAt: "2026-03-23T17:00:00Z" }] },
  { id: 6,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Database migration script",        type: "CHORE",    priority: "HIGH",   status: "TODO",       difficulty: "HARD",   estimatedMinutes: 90,                      tagIds: ["tag5"],                 dueDate: "2026-03-26", externalLink: { provider: "github", id: "Issue #54", url: "https://github.com/acme/stride/issues/54" } },
  { id: 7,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Team sync meeting prep",           type: "CHORE",    priority: "LOW",    status: "TODO",       difficulty: "EASY",   estimatedMinutes: 20,                      tagIds: [],                       dueDate: "2026-03-24", externalLink: { provider: "jira", id: "ENG-144", url: "https://acme.atlassian.net/browse/ENG-144" } },
  { id: 8,  workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Code review feedback",             type: "CHORE",    priority: "MEDIUM", status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 45,                      tagIds: ["tag5", "tag4"],         dueDate: "2026-03-28" },
  { id: 15, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u2", title: "Refactor auth service",            type: "FEATURE",  priority: "URGENT", status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 180, maxMinutes: 200, actualMinutes: 210, tagIds: ["tag5"],                 dueDate: "2026-03-22", externalLink: { provider: "jira", id: "ENG-128", url: "https://acme.atlassian.net/browse/ENG-128" }, description: "Migrate the auth service from session-based to JWT tokens. Need to update all middleware, refresh token flow, and session invalidation logic.\n\nBlocking issues:\n- Refresh token rotation needs to handle concurrent requests\n- Session invalidation webhook needs to notify all connected clients\n- Legacy mobile app still uses cookie-based auth (v2.1 and below)", attachments: [{ id: "a3", name: "auth-flow-diagram.png", size: "1.1 MB", type: "image", uploadedBy: "u1", uploadedAt: "2026-03-20T11:00:00Z" }, { id: "a4", name: "jwt-migration-notes.md", size: "12 KB", type: "document", uploadedBy: "u1", uploadedAt: "2026-03-20T11:05:00Z" }, { id: "a5", name: "session-audit-results.csv", size: "340 KB", type: "file", uploadedBy: "u3", uploadedAt: "2026-03-21T08:00:00Z" }], comments: [{ id: "c20", userId: "u2", text: "This needs to be our top priority this sprint. The session store is hitting memory limits in production and we've had two incidents this week.", createdAt: "2026-03-19T08:00:00Z" }, { id: "c21", userId: "u1", text: "Agreed. I've mapped out the migration path — we can do it in 3 phases: 1) JWT issuing alongside sessions, 2) migrate all endpoints to accept both, 3) deprecate session store. Uploaded the flow diagram.", createdAt: "2026-03-20T11:10:00Z" }, { id: "c22", userId: "u3", text: "Are we keeping backwards compatibility with existing sessions during migration? We have some long-lived sessions from the mobile app.", createdAt: "2026-03-21T09:00:00Z" }, { id: "c23", userId: "u1", text: "Yes, we'll run both in parallel for 2 weeks then cut over. @Liam Park can you run the session audit to see how many active sessions we'd need to migrate? I attached a template CSV format.", createdAt: "2026-03-21T09:30:00Z" }, { id: "c24", userId: "u3", text: "Done — uploaded the audit results. We have 2,847 active sessions, 340 from mobile v2.1 or below. Those will need special handling.", createdAt: "2026-03-21T14:00:00Z" }, { id: "c25", userId: "u2", text: "Good findings. @Alex Chen we're over estimate on this one — what's the revised timeline? Can we still ship phase 1 this week?", createdAt: "2026-03-22T09:00:00Z" }, { id: "c26", userId: "u1", text: "Phase 1 is done, phase 2 is about 80% through. The concurrent refresh token issue took longer than expected. I think we need 2 more days for phases 2+3.", createdAt: "2026-03-22T09:30:00Z" }], history: [{ action: "Created task", userId: "u2", createdAt: "2026-03-18T14:00:00Z" }, { action: "Assigned to Alex Chen", userId: "u2", createdAt: "2026-03-18T14:00:00Z" }, { action: "Changed title from 'JWT migration' to 'Refactor auth service'", userId: "u2", createdAt: "2026-03-18T14:05:00Z" }, { action: "Set due date to 2026-03-22", userId: "u2", createdAt: "2026-03-18T14:05:00Z" }, { action: "Changed status to In Progress", userId: "u1", createdAt: "2026-03-19T08:00:00Z" }, { action: "Changed estimate from 120m to 180m", userId: "u1", createdAt: "2026-03-19T10:00:00Z" }, { action: "Set time cap to 200m", userId: "u2", createdAt: "2026-03-19T10:30:00Z" }, { action: "Logged 1h 30m of work", userId: "u1", createdAt: "2026-03-19T17:00:00Z" }, { action: "Changed priority from High to Urgent", userId: "u2", createdAt: "2026-03-20T08:00:00Z" }, { action: "Logged 1h 45m of work", userId: "u1", createdAt: "2026-03-20T17:00:00Z" }, { action: "Logged 30m of work", userId: "u3", createdAt: "2026-03-21T14:30:00Z" }, { action: "Exceeded time estimate (180m)", userId: "u1", createdAt: "2026-03-22T11:00:00Z" }, { action: "Exceeded time cap (200m)", userId: "u1", createdAt: "2026-03-22T15:00:00Z" }] },
  { id: 16, workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Add loading skeletons",            type: "FEATURE",  priority: "LOW",    status: "IN_PROGRESS",difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 25,  tagIds: ["tag2"],                 dueDate: "2026-04-01", externalLink: { provider: "jira", id: "ENG-163", url: "https://acme.atlassian.net/browse/ENG-163" } },
  { id: 17, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Write API integration tests",      type: "CHORE",    priority: "MEDIUM", status: "BACKLOG",    difficulty: "MEDIUM", estimatedMinutes: 120,                     tagIds: ["tag5", "tag7"] },
  { id: 18, workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Research caching strategies",      type: "RESEARCH", priority: "LOW",    status: "BACKLOG",    difficulty: "EASY",   estimatedMinutes: 60,                      tagIds: [], description: "Investigate Redis vs in-memory caching for the API layer. Compare latency, cost, and complexity trade-offs." },
  { id: 19, workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Set up error monitoring",          type: "CHORE",    priority: "MEDIUM", status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 75,                      tagIds: ["tag5"],                 dueDate: "2026-03-30" },
  { id: 20, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Migrate to new router API",        type: "FEATURE",  priority: "MEDIUM", status: "TODO",       difficulty: "HARD",   estimatedMinutes: 150,                     tagIds: ["tag1", "tag5"],         dueDate: "2026-04-02" },
  { id: 21, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u1", createdBy: "u1", title: "Design settings wireframes",       type: "FEATURE",  priority: "HIGH",   status: "IN_PROGRESS",difficulty: "MEDIUM", estimatedMinutes: 90,  actualMinutes: 45,  tagIds: ["tag3"],                 dueDate: "2026-03-28", externalLink: { provider: "linear", id: "DES-42", url: "https://linear.app/acme/issue/DES-42" } },
  // Team tasks
  { id: 9,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u2", createdBy: "u1", title: "CI/CD pipeline upgrade",           type: "CHORE",    priority: "HIGH",   status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 180, maxMinutes: 220, actualMinutes: 140, tagIds: ["tag5"],                 dueDate: "2026-03-25", externalLink: { provider: "jira", id: "ENG-142", url: "https://acme.atlassian.net/browse/ENG-142" }, description: "Migrate from Jenkins to GitHub Actions. Need to replicate all existing pipelines: build, test, lint, deploy-staging, deploy-prod.\n\nPhases:\n1. Set up GH Actions workflows (done)\n2. Mirror existing Jenkins jobs (in progress)\n3. Parallel run both systems for 1 week\n4. Cut over and decommission Jenkins", comments: [{ id: "c40", userId: "u2", text: "Phase 1 is done — all workflow files are in .github/workflows/. The build+test pipeline runs in about 4 minutes which is 3x faster than Jenkins.", createdAt: "2026-03-22T16:00:00Z" }, { id: "c41", userId: "u1", text: "Nice speedup. Make sure we have the same branch protection rules. Also need to set up the deploy keys for staging and prod.", createdAt: "2026-03-22T16:30:00Z" }, { id: "c42", userId: "u2", text: "Deploy keys are set up. Working on the staging deploy workflow now — the tricky part is the Docker image tagging strategy. Jenkins uses a different convention.", createdAt: "2026-03-23T10:00:00Z" }], history: [{ action: "Created task", userId: "u1", createdAt: "2026-03-19T09:00:00Z" }, { action: "Assigned to Maya Rodriguez", userId: "u1", createdAt: "2026-03-19T09:00:00Z" }, { action: "Changed status to In Progress", userId: "u2", createdAt: "2026-03-20T08:00:00Z" }, { action: "Logged 2h of work", userId: "u2", createdAt: "2026-03-20T17:00:00Z" }, { action: "Logged 1h 30m of work", userId: "u2", createdAt: "2026-03-21T17:00:00Z" }, { action: "Changed difficulty from Medium to Hard", userId: "u2", createdAt: "2026-03-22T09:00:00Z" }, { action: "Changed estimate from 120m to 180m", userId: "u2", createdAt: "2026-03-22T09:00:00Z" }, { action: "Set time cap to 220m", userId: "u1", createdAt: "2026-03-22T09:30:00Z" }, { action: "Logged 2h of work", userId: "u2", createdAt: "2026-03-23T17:00:00Z" }] },
  { id: 10, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u3", createdBy: "u2", title: "Write unit tests for auth module", type: "CHORE",    priority: "MEDIUM", status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 90,                      tagIds: ["tag5", "tag7"],         dueDate: "2026-03-27" },
  { id: 11, workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u4", createdBy: "u1", title: "Resolve TypeScript errors",        type: "BUG",      priority: "HIGH",   status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 55,  tagIds: ["tag1", "tag6"],         dueDate: "2026-03-24" },
  { id: 12, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u5", createdBy: "u3", title: "Implement dark mode toggle",       type: "FEATURE",  priority: "LOW",    status: "TODO",       difficulty: "EASY",   estimatedMinutes: 45,                      tagIds: ["tag2", "tag6"],         dueDate: "2026-03-29" },
  { id: 13, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u6", createdBy: "u1", title: "Homepage hero redesign",           type: "FEATURE",  priority: "URGENT", status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 240, maxMinutes: 300, actualMinutes: 180, tagIds: ["tag3", "tag2"],         dueDate: "2026-03-26" },
  { id: 14, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u7", createdBy: "u2", title: "Icon set updates",                 type: "CHORE",    priority: "LOW",    status: "TODO",       difficulty: "EASY",   estimatedMinutes: 60,                      tagIds: ["tag3"],                 dueDate: "2026-04-02" },
  { id: 22, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u2", createdBy: "u1", title: "Add rate limiting middleware",     type: "FEATURE",  priority: "HIGH",   status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 120,                     tagIds: ["tag5"],                 dueDate: "2026-03-31" },
  { id: 23, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u6", createdBy: "u1", title: "Responsive nav breakpoints",       type: "BUG",      priority: "MEDIUM", status: "IN_PROGRESS",difficulty: "EASY",   estimatedMinutes: 45,  actualMinutes: 20,  tagIds: ["tag2", "tag3"],         dueDate: "2026-03-27" },
  { id: 24, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u3", createdBy: "u2", title: "Database index optimization",      type: "CHORE",    priority: "HIGH",   status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 90,  actualMinutes: 60,  tagIds: ["tag5"],                 dueDate: "2026-03-26" },
  { id: 25, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u7", createdBy: "u2", title: "Accessibility audit fixes",        type: "BUG",      priority: "MEDIUM", status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 180,                     tagIds: ["tag2"],                 dueDate: "2026-04-05" },
  // In review
  { id: 30, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "Add WebSocket reconnection logic",  type: "FEATURE",  priority: "HIGH",   status: "IN_REVIEW",  difficulty: "HARD",   estimatedMinutes: 120, actualMinutes: 95,  tagIds: ["tag5"],                 dueDate: "2026-03-26", externalLink: { provider: "github", id: "PR #287", url: "https://github.com/acme/stride/pull/287" }, description: "Implement automatic WebSocket reconnection with exponential backoff. Currently when the connection drops, the user has to manually refresh the page to get real-time updates back.", comments: [{ id: "c50", userId: "u1", text: "PR is up: #287. Uses exponential backoff starting at 1s, max 30s, with jitter. Also added a visual indicator in the status bar when the connection is reconnecting.", createdAt: "2026-03-24T14:00:00Z" }, { id: "c51", userId: "u2", text: "Reviewed — looks solid overall. Two things: 1) the max retry count should be configurable, 2) we should emit an event when reconnection fails permanently so the UI can show a proper error state instead of just spinning.", createdAt: "2026-03-24T16:00:00Z" }, { id: "c52", userId: "u1", text: "Good points. Pushed updates — max retries is now configurable via env var (default 10), and there's a 'connection_failed' event the UI subscribes to. Updated the status bar component to show an error banner.", createdAt: "2026-03-24T17:00:00Z" }, { id: "c53", userId: "u3", text: "Tested on flaky wifi — reconnects cleanly after drops up to ~2 minutes. Beyond that it hits the retry limit and shows the error banner. LGTM from my side.", createdAt: "2026-03-24T18:00:00Z" }], history: [{ action: "Created task", userId: "u1", createdAt: "2026-03-21T09:00:00Z" }, { action: "Changed status to In Progress", userId: "u1", createdAt: "2026-03-22T08:00:00Z" }, { action: "Logged 1h of work", userId: "u1", createdAt: "2026-03-22T17:00:00Z" }, { action: "Logged 35m of work", userId: "u1", createdAt: "2026-03-23T17:00:00Z" }, { action: "Changed status to In Review", userId: "u1", createdAt: "2026-03-24T14:00:00Z" }, { action: "Requested review from Maya Rodriguez", userId: "u1", createdAt: "2026-03-24T14:05:00Z" }] },
  { id: 31, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u6", createdBy: "u1", title: "Notification toast component",      type: "FEATURE",  priority: "MEDIUM", status: "IN_REVIEW",  difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 50,  tagIds: ["tag2", "tag3"],         dueDate: "2026-03-27" },
  { id: 32, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u3", createdBy: "u2", title: "Rate limiter unit tests",           type: "CHORE",    priority: "LOW",    status: "IN_REVIEW",  difficulty: "EASY",   estimatedMinutes: 45,  actualMinutes: 40,  tagIds: ["tag5", "tag7"],         dueDate: "2026-03-28" },
  // Blocked
  { id: 33, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u2", title: "Deploy to production",              type: "CHORE",    priority: "URGENT", status: "BLOCKED",    difficulty: "MEDIUM", estimatedMinutes: 30,  actualMinutes: 10,  tagIds: ["tag5"],                 dueDate: "2026-03-25", externalLink: { provider: "jira", id: "ENG-170", url: "https://acme.atlassian.net/browse/ENG-170" }, description: "Deploy the auth refactor and dashboard redesign to production. Blocked on SSL cert renewal for the staging environment — need staging green before we can promote.\n\nDependencies:\n- Auth refactor (task #15) — in progress\n- Staging SSL cert — DevOps ticket #4521", comments: [{ id: "c30", userId: "u1", text: "Staging deploy script is ready. Just waiting on the SSL cert to validate.", createdAt: "2026-03-24T10:00:00Z" }, { id: "c31", userId: "u2", text: "I pinged the DevOps team, they said ETA is end of day tomorrow. The cert authority is slow this week apparently.", createdAt: "2026-03-24T16:00:00Z" }, { id: "c32", userId: "u5", text: "Just got word from DevOps — cert was issued but needs DNS propagation. Should be live within 4 hours.", createdAt: "2026-03-24T17:30:00Z" }, { id: "c33", userId: "u1", text: "Thanks @Sam Torres. I'll monitor and kick off the deploy as soon as staging is accessible.", createdAt: "2026-03-24T17:35:00Z" }], history: [{ action: "Created task", userId: "u2", createdAt: "2026-03-24T08:00:00Z" }, { action: "Assigned to Alex Chen", userId: "u2", createdAt: "2026-03-24T08:00:00Z" }, { action: "Changed status to In Progress", userId: "u1", createdAt: "2026-03-24T09:00:00Z" }, { action: "Logged 10m of work", userId: "u1", createdAt: "2026-03-24T10:00:00Z" }, { action: "Changed status to Blocked", userId: "u1", createdAt: "2026-03-24T10:05:00Z" }, { action: "Changed priority from High to Urgent", userId: "u2", createdAt: "2026-03-24T14:00:00Z" }] },
  { id: 34, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u7", createdBy: "u2", title: "SSO integration",                   type: "FEATURE",  priority: "HIGH",   status: "BLOCKED",    difficulty: "HARD",   estimatedMinutes: 180, actualMinutes: 60,  tagIds: ["tag1"],                 dueDate: "2026-03-28" },
  // Backlog
  { id: 26, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1", title: "GraphQL schema migration",         type: "FEATURE",  priority: "LOW",    status: "BACKLOG",    difficulty: "HARD",   estimatedMinutes: 240,                     tagIds: ["tag5"] },
  { id: 27, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u6", createdBy: "u1", title: "Component library documentation",  type: "CHORE",    priority: "LOW",    status: "BACKLOG",    difficulty: "MEDIUM", estimatedMinutes: 120,                     tagIds: ["tag3", "tag7"] },
  // Archive
  { id: 28, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u2", createdBy: "u1", title: "Set up staging environment",       type: "CHORE",    priority: "HIGH",   status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 90,  actualMinutes: 85,  tagIds: ["tag5"],                 dueDate: "2026-03-20" },
  { id: 29, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u7", createdBy: "u2", title: "Design system color tokens",       type: "FEATURE",  priority: "MEDIUM", status: "COMPLETED",  difficulty: "EASY",   estimatedMinutes: 45,  actualMinutes: 30,  tagIds: ["tag3"],                 dueDate: "2026-03-19" },
];

// ─── Team member stats (for admin views) ─────────────────────────────────────

export const TEAM_MEMBER_STATS: TeamMemberStats[] = [
  { userId: "u1", role: "ADMIN",    hoursThisWeek: 32, tasksCompletedThisWeek: 4,  tasksInProgress: 1, streak: 7,  burnoutRisk: "LOW",    dailyHours: [6,7,8,7,4,0,0], weeklyTaskCount: [9,11,8,13] },
  { userId: "u2", role: "ADMIN",    hoursThisWeek: 41, tasksCompletedThisWeek: 6,  tasksInProgress: 1, streak: 14, burnoutRisk: "MEDIUM", dailyHours: [9,10,8,9,5,0,0], weeklyTaskCount: [10,12,14,16] },
  { userId: "u3", role: "STANDARD", hoursThisWeek: 28, tasksCompletedThisWeek: 3,  tasksInProgress: 0, streak: 3,  burnoutRisk: "LOW",    dailyHours: [5,6,7,6,4,0,0], weeklyTaskCount: [7,8,6,9] },
  { userId: "u4", role: "STANDARD", hoursThisWeek: 38, tasksCompletedThisWeek: 5,  tasksInProgress: 1, streak: 9,  burnoutRisk: "LOW",    dailyHours: [8,8,7,8,7,0,0], weeklyTaskCount: [8,10,9,12] },
  { userId: "u5", role: "STANDARD", hoursThisWeek: 47, tasksCompletedThisWeek: 2,  tasksInProgress: 0, streak: 2,  burnoutRisk: "HIGH",   dailyHours: [10,11,9,10,7,0,0], weeklyTaskCount: [14,13,15,11] },
];

// ─── Org-level aggregate stats ────────────────────────────────────────────────

export const ORG_TEAM_STATS = [
  { teamId: "t1", memberCount: 5, tasksCompletedThisWeek: 20, hoursLoggedThisWeek: 186, activeProjects: 3, openIssues: 12 },
  { teamId: "t2", memberCount: 3, tasksCompletedThisWeek: 8,  hoursLoggedThisWeek: 94,  activeProjects: 1, openIssues: 11 },
  { teamId: "t3", memberCount: 2, tasksCompletedThisWeek: 4,  hoursLoggedThisWeek: 52,  activeProjects: 1, openIssues: 9 },
];
