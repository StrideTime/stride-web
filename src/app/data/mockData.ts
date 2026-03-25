import type { LucideIcon } from "lucide-react";
import { Zap, Rocket, Building2, Lightbulb, Settings, Palette, Megaphone, Package } from "lucide-react";

// ─── Enum-style types ────────────────────────────────────────────────────────

export type WorkspaceType = "PERSONAL" | "ORGANIZATION";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type TeamRole = "ADMIN" | "STANDARD";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BACKLOG";
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

export interface Task {
  id: number;
  workspaceId: string;
  projectId?: string;
  teamId?: string;
  assigneeId: string;
  title: string;
  status: TaskStatus;
  difficulty: Difficulty;
  estimatedMinutes: number;
  actualMinutes?: number;
  tagIds: string[];
  dueDate?: string;
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
  // Today tasks (ws3 / Eng)
  { id: 1,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Review pull requests",             status: "COMPLETED",  difficulty: "EASY",   estimatedMinutes: 30,  actualMinutes: 22,  tagIds: ["tag5"],                dueDate: "today" },
  { id: 2,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Fix navigation bug",               status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: ["tag1", "tag6"],         dueDate: "today" },
  { id: 3,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Weekly standup notes",             status: "COMPLETED",  difficulty: "EASY",   estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [],                       dueDate: "today" },
  { id: 4,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Update API documentation",         status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 45,  actualMinutes: 38,  tagIds: ["tag5", "tag7"],         dueDate: "today" },
  { id: 5,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Redesign dashboard components",    status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 120,                     tagIds: ["tag2", "tag6", "tag3"], dueDate: "today" },
  { id: 6,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Database migration script",        status: "TODO",       difficulty: "HARD",   estimatedMinutes: 90,                      tagIds: ["tag5"],                 dueDate: "today" },
  { id: 7,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", title: "Team sync meeting prep",           status: "TODO",       difficulty: "EASY",   estimatedMinutes: 20,                      tagIds: [],                       dueDate: "today" },
  { id: 8,  workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u1", title: "Code review feedback",             status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 45,                      tagIds: ["tag5", "tag4"],         dueDate: "today" },
  // More team tasks (various assignees)
  { id: 9,  workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u2", title: "CI/CD pipeline upgrade",           status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 180,                     tagIds: ["tag5"],                 dueDate: "today" },
  { id: 10, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u3", title: "Write unit tests for auth module", status: "TODO",       difficulty: "MEDIUM", estimatedMinutes: 90,                      tagIds: ["tag5", "tag7"],         dueDate: "tomorrow" },
  { id: 11, workspaceId: "ws3", projectId: "p2", teamId: "t1", assigneeId: "u4", title: "Resolve TypeScript errors",        status: "COMPLETED",  difficulty: "MEDIUM", estimatedMinutes: 60,  actualMinutes: 55,  tagIds: ["tag1", "tag6"],         dueDate: "today" },
  { id: 12, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u5", title: "Implement dark mode toggle",       status: "TODO",       difficulty: "EASY",   estimatedMinutes: 45,                      tagIds: ["tag2", "tag6"],         dueDate: "today" },
  { id: 13, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u6", title: "Homepage hero redesign",           status: "IN_PROGRESS",difficulty: "HARD",   estimatedMinutes: 240,                     tagIds: ["tag3", "tag2"],         dueDate: "today" },
  { id: 14, workspaceId: "ws3", projectId: "p2", teamId: "t2", assigneeId: "u7", title: "Icon set updates",                 status: "TODO",       difficulty: "EASY",   estimatedMinutes: 60,                      tagIds: ["tag3"],                 dueDate: "this week" },
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
