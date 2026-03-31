import { useState } from "react";
import {
  Plus, Target, CheckCircle2, Circle, ChevronDown,
  FolderOpen, Flame, Trophy, TrendingUp, TrendingDown, Calendar, Flag,
  MoreHorizontal, Check, Zap, User, Users, Building2, Lock,
  Briefcase, Star, Heart, Activity,
  ArrowRight, UserCheck, BarChart2, AlignJustify, Layers,
  Clock, Bug, Rocket, Upload, GitMerge,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { TEAMS, TEAM_MEMBERS, PROJECTS, USERS } from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalCategory = "work" | "learning" | "personal" | "health";
type GoalType     = "numeric" | "project" | "milestone";
type GoalStatus   = "on_track" | "at_risk" | "achieved" | "paused";
type GoalScope    = "personal" | "team" | "org";
type CardVariant  = "metric" | "quest" | "list";
type Panel        = null | "milestones" | "activity" | "aligned";

// What data source drives this goal's metric.
// Determines what activity events are shown and whether auto-tracking applies.
type MetricSource =
  | "tasks_completed"      // count of tasks closed (filtered by project / type)
  | "focus_minutes"        // total focus time logged
  | "bugs_open"            // count of open bugs — lower is better
  | "project_progress"     // % of project milestones complete
  | "sprint_velocity"      // % of story points completed each sprint
  | "deployments_per_week" // production deploys per week
  | "milestones_shipped"   // major product milestones launched
  | "manual";              // no auto-tracking — logged manually (revenue, headcount, etc.)

// Activity events that drove progress — auto-tracked, not free-text comments.
type ContributionType =
  | "task_completed"
  | "focus_session"
  | "bug_closed"
  | "milestone_shipped"
  | "deployment"
  | "sprint_closed"
  | "pr_merged"
  | "progress_logged";  // manual entry (for revenue, headcount, etc.)

type Contribution = {
  id: number;
  userId: string;
  type: ContributionType;
  label: string;    // e.g. "Completed: Refactor auth service"
  value: number;    // amount contributed toward the goal metric
  timestamp: string;
};

interface Milestone {
  id: number;
  label: string;
  done: boolean;
  dueLabel?: string;
  ownerId?: string;
  completedOnTime?: boolean; // true = on/before due; false = late; undefined = no due date
}

type ProgressLog = {
  periodLabel: string;
  value: number;
};

interface Goal {
  id: number;
  title: string;
  description: string;
  category: GoalCategory;
  type: GoalType;
  status: GoalStatus;
  scope: GoalScope;
  teamId?: string;
  projectId?: string;
  metricSource: MetricSource;
  progress: number;
  current?: number;
  target?: number;
  unit?: string;
  expectedProgress?: number;
  color: string;
  dueLabel: string;
  linkedProject?: string;
  milestones: Milestone[];
  progressLogs?: ProgressLog[];
  periodPace?: number;
  createdBy: string;
  ownerId: string;
  contributions: Contribution[];
  linkedGoalIds?: number[];
}

type StreakInfo = {
  count: number;
  label: string;
  type: "milestone" | "pace" | "none";
};

// ─── Streak logic ─────────────────────────────────────────────────────────────

function computeStreakInfo(goal: Goal): StreakInfo {
  const doneMilestones = goal.milestones.filter((m) => m.done);
  const hasTimedMilestones = doneMilestones.some(
    (m) => m.dueLabel !== undefined || m.completedOnTime !== undefined,
  );

  if (hasTimedMilestones) {
    let count = 0;
    for (let i = doneMilestones.length - 1; i >= 0; i--) {
      const m = doneMilestones[i];
      if (m.completedOnTime === true)  { count++; continue; }
      if (m.completedOnTime === false) { break; }
    }
    return {
      count,
      label: count === 1 ? "milestone on time" : "milestones on time",
      type: "milestone",
    };
  }

  if (goal.progressLogs && goal.progressLogs.length > 0 && goal.periodPace !== undefined) {
    let count = 0;
    for (let i = goal.progressLogs.length - 1; i >= 0; i--) {
      if (goal.progressLogs[i].value >= goal.periodPace) count++;
      else break;
    }
    return {
      count,
      label: count === 1 ? "period on pace" : "periods on pace",
      type: "pace",
    };
  }

  return { count: 0, label: "", type: "none" };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Goals are structured around what a dev team at a SaaS org actually tracks:
// • Individual: task throughput, focus time
// • Project: milestone progress, P1 bug count
// • Team: sprint velocity, deploy frequency
// • Org: revenue milestones, product launches

const CURRENT_USER_ID = "u1";

const ALL_GOALS: Goal[] = [
  // ── Personal ──────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "Complete 30 tasks in Q2",
    description: "Maintain consistent task throughput — at least 5 tasks closed per week across the quarter.",
    category: "work", type: "numeric", status: "on_track", scope: "personal",
    metricSource: "tasks_completed",
    progress: 60, current: 18, target: 30, unit: "tasks",
    expectedProgress: 50,
    color: "#61afef", dueLabel: "Jun 30",
    createdBy: "u1", ownerId: "u1",
    milestones: [],
    progressLogs: [
      { periodLabel: "Apr W1", value: 6 },
      { periodLabel: "Apr W2", value: 5 },
      { periodLabel: "Apr W3", value: 7 },
      { periodLabel: "Apr W4", value: 4 }, // missed pace
    ],
    periodPace: 5,
    contributions: [
      { id: 1, userId: "u1", type: "task_completed", label: "Completed: Add rate limiting to API",       value: 1, timestamp: "2 hrs ago"   },
      { id: 2, userId: "u1", type: "task_completed", label: "Completed: Fix navigation overflow bug",    value: 1, timestamp: "1 day ago"   },
      { id: 3, userId: "u1", type: "task_completed", label: "Completed: Write unit tests for GoalService",value: 1, timestamp: "2 days ago"  },
      { id: 4, userId: "u1", type: "task_completed", label: "Completed: Refactor auth service",          value: 1, timestamp: "4 days ago"  },
      { id: 5, userId: "u1", type: "task_completed", label: "Completed: Update onboarding flow copy",    value: 1, timestamp: "6 days ago"  },
    ],
  },
  {
    id: 2,
    title: "Log 40 hours focus time in April",
    description: "Deep work sessions tracked via the Stride focus timer — keeps shallow distractions in check.",
    category: "personal", type: "numeric", status: "on_track", scope: "personal",
    metricSource: "focus_minutes",
    progress: 91, current: 36.5, target: 40, unit: "hrs",
    expectedProgress: 75,
    color: "#56b6c2", dueLabel: "Apr 30",
    createdBy: "u1", ownerId: "u1",
    milestones: [],
    progressLogs: [
      { periodLabel: "Apr W1", value: 11   },
      { periodLabel: "Apr W2", value: 9    },
      { periodLabel: "Apr W3", value: 10   },
      { periodLabel: "Apr W4", value: 6.5  }, // missed 10hr pace this week
    ],
    periodPace: 10,
    contributions: [
      { id: 1, userId: "u1", type: "focus_session", label: "2h 30m — Stripe billing integration",      value: 2.5, timestamp: "today"      },
      { id: 2, userId: "u1", type: "focus_session", label: "1h 45m — Code review & PR comments",        value: 1.75, timestamp: "yesterday" },
      { id: 3, userId: "u1", type: "focus_session", label: "3h — Auth redesign deep work",              value: 3,   timestamp: "2 days ago" },
      { id: 4, userId: "u1", type: "focus_session", label: "2h — Timer & reports architecture",         value: 2,   timestamp: "4 days ago" },
    ],
  },
  // ── Project ───────────────────────────────────────────────────────────────
  {
    id: 3,
    title: "Ship Stride v2.0 by Apr 30",
    description: "All MVP features complete and stable. Milestone-driven — each shipped feature moves the bar.",
    category: "work", type: "project", status: "on_track", scope: "team",
    teamId: "t1", projectId: "p1",
    metricSource: "project_progress",
    progress: 65, expectedProgress: 41,
    color: "#98c379", dueLabel: "Apr 30", linkedProject: "Stride v2.0",
    createdBy: "u1", ownerId: "u1",
    milestones: [
      { id: 1, label: "Auth redesign",    done: true,  dueLabel: "Feb 28", completedOnTime: true,  ownerId: "u3" },
      { id: 2, label: "Tasks & projects", done: true,  dueLabel: "Mar 15", completedOnTime: true,  ownerId: "u1" },
      { id: 3, label: "Timer & reports",  done: false, dueLabel: "Apr 1",                          ownerId: "u2" },
      { id: 4, label: "Team admin",       done: false, dueLabel: "Apr 15",                         ownerId: "u1" },
      { id: 5, label: "Public beta",      done: false, dueLabel: "Apr 30",                         ownerId: "u1" },
    ],
    contributions: [
      { id: 1, userId: "u1", type: "pr_merged",         label: "Merged: Timer component refactor (14 files)", value: 0, timestamp: "1 day ago"  },
      { id: 2, userId: "u2", type: "pr_merged",         label: "Merged: Report date range picker fix",        value: 0, timestamp: "3 days ago" },
      { id: 3, userId: "u3", type: "milestone_shipped", label: "Shipped: Auth redesign ✓",                    value: 20, timestamp: "3 wks ago" },
      { id: 4, userId: "u1", type: "milestone_shipped", label: "Shipped: Task & project pages ✓",             value: 20, timestamp: "4 wks ago" },
    ],
    linkedGoalIds: [7],
  },
  {
    id: 4,
    title: "Zero P1 bugs before v2.0 launch",
    description: "All P1 severity bugs must be resolved or deferred before the public beta. Started Q2 with 12.",
    category: "work", type: "numeric", status: "at_risk", scope: "team",
    teamId: "t1",
    metricSource: "bugs_open",
    progress: 75, current: 3, target: 0, unit: "P1 bugs open",
    expectedProgress: 92, // should be nearly done by now
    color: "#e06c75", dueLabel: "Apr 30",
    createdBy: "u2", ownerId: "u2",
    milestones: [],
    progressLogs: [
      { periodLabel: "Apr W1", value: 4 }, // closed 4 bugs
      { periodLabel: "Apr W2", value: 3 },
      { periodLabel: "Apr W3", value: 2 },
      { periodLabel: "Apr W4", value: 0 }, // no bugs closed this week
    ],
    periodPace: 2,
    contributions: [
      { id: 1, userId: "u2", type: "bug_closed", label: "Closed P1: Auth token not refreshing on mobile",  value: 1, timestamp: "1 wk ago"  },
      { id: 2, userId: "u1", type: "bug_closed", label: "Closed P1: Timer data lost on force-quit",         value: 1, timestamp: "2 wks ago" },
      { id: 3, userId: "u3", type: "bug_closed", label: "Closed P1: Dashboard blank on first load",         value: 1, timestamp: "2 wks ago" },
    ],
  },
  // ── Team ──────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: "Maintain ≥80% sprint velocity",
    description: "Story points completed vs planned each sprint. Consistently below 80% signals scope creep or blockers.",
    category: "work", type: "numeric", status: "at_risk", scope: "team",
    teamId: "t1",
    metricSource: "sprint_velocity",
    progress: 93, current: 74, target: 80, unit: "%",
    expectedProgress: 100,
    color: "#e5c07b", dueLabel: "Ongoing",
    createdBy: "u1", ownerId: "u1",
    milestones: [],
    progressLogs: [
      { periodLabel: "Sprint 8", value: 82 }, // on pace
      { periodLabel: "Sprint 9", value: 78 }, // missed
      { periodLabel: "Sprint 10", value: 74 }, // missed
    ],
    periodPace: 80,
    contributions: [
      { id: 1, userId: "u1", type: "sprint_closed", label: "Sprint 10 closed — 37/50 pts completed (74%)",  value: 74, timestamp: "4 days ago" },
      { id: 2, userId: "u1", type: "sprint_closed", label: "Sprint 9 closed — 39/50 pts completed (78%)",   value: 78, timestamp: "2 wks ago"  },
      { id: 3, userId: "u1", type: "sprint_closed", label: "Sprint 8 closed — 41/50 pts completed (82%)",   value: 82, timestamp: "4 wks ago"  },
    ],
  },
  {
    id: 6,
    title: "Deploy to production 2× per week",
    description: "Small, frequent deploys reduce risk and keep the team in a shipping rhythm. Target: Tuesday & Friday.",
    category: "work", type: "numeric", status: "at_risk", scope: "team",
    teamId: "t1",
    metricSource: "deployments_per_week",
    progress: 60, current: 1.2, target: 2, unit: "deploys/wk",
    expectedProgress: 100,
    color: "#c678dd", dueLabel: "Ongoing",
    createdBy: "u1", ownerId: "u1",
    milestones: [],
    progressLogs: [
      { periodLabel: "W1", value: 2 },
      { periodLabel: "W2", value: 1 },
      { periodLabel: "W3", value: 1 },
      { periodLabel: "W4", value: 2 },
      { periodLabel: "W5", value: 1 },
      { periodLabel: "W6", value: 1 }, // last 2 weeks missed
    ],
    periodPace: 2,
    contributions: [
      { id: 1, userId: "u3", type: "deployment", label: "Deployed v2.0.4 — timer fixes + perf improvements",  value: 1, timestamp: "3 days ago" },
      { id: 2, userId: "u1", type: "deployment", label: "Deployed hotfix/auth-token-refresh to production",    value: 1, timestamp: "1 wk ago"  },
      { id: 3, userId: "u3", type: "deployment", label: "Deployed v2.0.3 — dashboard + report updates",        value: 1, timestamp: "2 wks ago" },
    ],
  },
  // ── Org ───────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: "Reach $2M ARR by end of Q2",
    description: "Cross-team revenue target. Driven by new enterprise deals, product-led growth, and the v2.0 launch.",
    category: "work", type: "numeric", status: "on_track", scope: "org",
    metricSource: "manual",
    progress: 58, current: 1.16, target: 2, unit: "M ARR",
    expectedProgress: 47,
    color: "#e5c07b", dueLabel: "Jun 30",
    createdBy: "u1", ownerId: "u1",
    milestones: [
      { id: 1, label: "$500K",  done: true,  dueLabel: "Jan 31", completedOnTime: true  },
      { id: 2, label: "$1M",    done: true,  dueLabel: "Feb 28", completedOnTime: true  },
      { id: 3, label: "$1.5M",  done: false, dueLabel: "Apr 30" },
      { id: 4, label: "$2M",    done: false, dueLabel: "Jun 30" },
    ],
    linkedGoalIds: [3, 6],
    contributions: [
      { id: 1, userId: "u4", type: "progress_logged", label: "Closed Acme Corp — $50K ARR enterprise deal",    value: 0.05, timestamp: "2 days ago" },
      { id: 2, userId: "u1", type: "progress_logged", label: "Enterprise tier launch — $80K new ARR in Apr",   value: 0.08, timestamp: "1 wk ago"  },
      { id: 3, userId: "u4", type: "progress_logged", label: "Q1 final recorded: $1.16M ARR",                  value: 1.16, timestamp: "3 wks ago" },
    ],
  },
  {
    id: 8,
    title: "Launch 3 major product milestones in H1",
    description: "Public-facing feature launches that drive retention and press coverage. Each must ship to all users.",
    category: "work", type: "milestone", status: "on_track", scope: "org",
    metricSource: "milestones_shipped",
    progress: 33,
    color: "#98c379", dueLabel: "Jun 30",
    createdBy: "u1", ownerId: "u1",
    milestones: [
      { id: 1, label: "Focus timer",  done: true,  dueLabel: "Feb 15", completedOnTime: true  },
      { id: 2, label: "Stride v2.0",  done: false, dueLabel: "Apr 30" },
      { id: 3, label: "Public API",   done: false, dueLabel: "Jun 30" },
    ],
    contributions: [
      { id: 1, userId: "u1", type: "milestone_shipped", label: "Launched: Stride v1.5 — Focus timer (2.4K signups)", value: 1, timestamp: "6 wks ago" },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; Icon: typeof Target }> = {
  work:     { label: "Work",     Icon: Briefcase },
  learning: { label: "Learning", Icon: Target    },
  personal: { label: "Personal", Icon: Star      },
  health:   { label: "Health",   Icon: Heart     },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: "On track", color: "#98c379" },
  at_risk:  { label: "At risk",  color: "#e06c75" },
  achieved: { label: "Achieved", color: "#56b6c2" },
  paused:   { label: "Paused",   color: "#5c6370" },
};

const METRIC_SOURCE_CONFIG: Record<MetricSource, { label: string; Icon: typeof Target }> = {
  tasks_completed:      { label: "task completions",   Icon: CheckCircle2 },
  focus_minutes:        { label: "focus sessions",     Icon: Clock        },
  bugs_open:            { label: "bug closures",       Icon: Bug          },
  project_progress:     { label: "project milestones", Icon: FolderOpen   },
  sprint_velocity:      { label: "sprint data",        Icon: BarChart2    },
  deployments_per_week: { label: "deployments",        Icon: Upload       },
  milestones_shipped:   { label: "product launches",   Icon: Rocket       },
  manual:               { label: "manual logs",        Icon: Zap          },
};

const CONTRIBUTION_CONFIG: Record<ContributionType, { Icon: typeof Target; color: string }> = {
  task_completed:    { Icon: CheckCircle2, color: "#98c379" },
  focus_session:     { Icon: Clock,        color: "#61afef" },
  bug_closed:        { Icon: Bug,          color: "#e06c75" },
  milestone_shipped: { Icon: Rocket,       color: "#56b6c2" },
  deployment:        { Icon: Upload,       color: "#c678dd" },
  sprint_closed:     { Icon: BarChart2,    color: "#e5c07b" },
  pr_merged:         { Icon: GitMerge,     color: "#abb2bf" },
  progress_logged:   { Icon: Zap,          color: "#e5c07b" },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function MiniAvatar({ userId }: { userId: string }) {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return null;
  return (
    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0 ring-1 ring-card"
      style={{ backgroundColor: `${user.color}30`, color: user.color }}>
      {user.initials}
    </div>
  );
}

function PaceTag({ goal }: { goal: Goal }) {
  if (goal.type !== "numeric" || goal.expectedProgress === undefined || goal.status === "achieved") return null;
  const diff = goal.progress - goal.expectedProgress;
  if (diff >= 8) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-chart-2/10 text-chart-2 font-medium flex items-center gap-0.5 whitespace-nowrap">
      <TrendingUp className="h-2.5 w-2.5" /> Ahead
    </span>
  );
  if (diff >= -8) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium whitespace-nowrap">
      On pace
    </span>
  );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium flex items-center gap-0.5 whitespace-nowrap">
      <TrendingDown className="h-2.5 w-2.5" /> Behind
    </span>
  );
}

// Small inline tag showing what data source drives this goal
function MetricSourceTag({ source }: { source: MetricSource }) {
  if (source === "project_progress") return null; // obvious from milestones
  const { label, Icon } = METRIC_SOURCE_CONFIG[source];
  return (
    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 whitespace-nowrap">
      <Icon className="h-2.5 w-2.5" />
      via {label}
    </span>
  );
}

function MilestoneTrack({ milestones, color, compact = false }: {
  milestones: Milestone[];
  color: string;
  compact?: boolean;
}) {
  if (milestones.length === 0) return null;
  return (
    <div className="flex items-start w-full">
      {milestones.map((m, i) => (
        <div key={m.id} className="flex items-center flex-1 min-w-0">
          {i > 0 && (
            <div className="flex-1 h-px min-w-[6px]"
              style={{ backgroundColor: m.done ? color : "#3e4451" }} />
          )}
          <div className={cn("flex flex-col items-center", !compact && "gap-1.5")}>
            <div className={cn("rounded-full border-2 flex items-center justify-center flex-shrink-0",
              compact ? "h-2 w-2" : "h-3.5 w-3.5")}
              style={{ borderColor: m.done ? color : "#3e4451", backgroundColor: m.done ? color : "transparent" }}>
              {m.done && !compact && <Check className="h-2 w-2 text-background" strokeWidth={3} />}
            </div>
            {!compact && (
              <span className="text-[9px] text-muted-foreground text-center leading-tight px-0.5 max-w-[52px] truncate" title={m.label}>
                {m.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StreakBadge({ streak }: { streak: StreakInfo }) {
  if (streak.count === 0 || streak.type === "none") return null;
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: "rgba(229,192,123,0.08)", borderColor: "rgba(229,192,123,0.2)" }}>
      <Flame className="h-3 w-3 text-amber-400" />
      <span className="text-xs font-bold text-amber-400">{streak.count}</span>
      <span className="text-[10px] text-muted-foreground">{streak.label}</span>
    </div>
  );
}

function CircularProgress({ progress, color, size = 64 }: { progress: number; color: string; size?: number }) {
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;
  const c = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

// ─── Panel sub-components ─────────────────────────────────────────────────────

function MilestoneList({ goal, onToggle, canEdit }: {
  goal: Goal;
  onToggle: (milestoneId: number) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-2">
      {goal.milestones.map((m) => {
        const owner = m.ownerId ? USERS.find((u) => u.id === m.ownerId) : null;
        return (
          <div key={m.id} className="flex items-center gap-2">
            <button onClick={() => canEdit && onToggle(m.id)}
              className={cn("flex items-center gap-2 flex-1 text-left min-w-0", !canEdit && "cursor-default")}>
              {m.done
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: goal.color }} />
                : <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              <span className={cn("text-xs flex-1 min-w-0 truncate leading-snug",
                m.done ? "line-through text-muted-foreground" : "text-foreground")}>
                {m.label}
              </span>
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {m.completedOnTime === false && m.done && (
                <span className="text-[9px] text-destructive">late</span>
              )}
              {m.dueLabel && !m.done && <span className="text-[10px] text-muted-foreground">{m.dueLabel}</span>}
              {owner && (
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-semibold"
                  style={{ backgroundColor: `${owner.color}25`, color: owner.color }} title={owner.name}>
                  {owner.initials}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {canEdit && (
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5">
          <Plus className="h-3 w-3" /> Add milestone
        </button>
      )}
    </div>
  );
}

// Activity feed — read-only, shows auto-tracked contribution events
function ActivityFeed({ goal }: { goal: Goal }) {
  if (goal.contributions.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No activity recorded yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {goal.contributions.map((c) => {
        const user  = USERS.find((u) => u.id === c.userId);
        const conf  = CONTRIBUTION_CONFIG[c.type];
        const showValue = c.value !== 0 && goal.unit;
        return (
          <div key={c.id} className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${conf.color}15` }}>
              <conf.Icon className="h-3 w-3" style={{ color: conf.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {user && <span className="text-xs font-medium text-foreground">{user.name.split(" ")[0]}</span>}
                <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{c.label}</span>
                {showValue && (
                  <span className="text-[11px] font-semibold tabular-nums flex-shrink-0" style={{ color: conf.color }}>
                    +{c.value} {goal.unit}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{c.timestamp}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlignedGoals({ goalIds, allGoals }: { goalIds: number[]; allGoals: Goal[] }) {
  const linked = allGoals.filter((g) => goalIds.includes(g.id));
  if (linked.length === 0) return <p className="text-xs text-muted-foreground italic">No goals linked yet.</p>;
  return (
    <div className="space-y-2">
      {linked.map((g) => {
        const team = g.teamId ? TEAMS.find((t) => t.id === g.teamId) : null;
        const contributorIds = [...new Set(g.contributions.map((c) => c.userId))];
        return (
          <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{g.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {team && <span className="text-[10px] text-muted-foreground">{team.name}</span>}
                {contributorIds.length > 0 && (
                  <div className="flex -space-x-0.5">
                    {contributorIds.slice(0, 3).map((uid) => <MiniAvatar key={uid} userId={uid} />)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">{g.progress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardPanels({ goal, allGoals, panel, onToggle, canEdit }: {
  goal: Goal;
  allGoals: Goal[];
  panel: Panel;
  onToggle: (milestoneId: number) => void;
  canEdit: boolean;
}) {
  if (panel === "milestones") return (
    <div className="mt-3 pt-3 border-t border-border">
      <MilestoneList goal={goal} onToggle={onToggle} canEdit={canEdit} />
    </div>
  );
  if (panel === "activity") return (
    <div className="mt-3 pt-3 border-t border-border">
      <ActivityFeed goal={goal} />
    </div>
  );
  if (panel === "aligned" && goal.linkedGoalIds) return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2.5">Contributing goals</p>
      <AlignedGoals goalIds={goal.linkedGoalIds} allGoals={allGoals} />
    </div>
  );
  return null;
}

// ─── Card action bar ──────────────────────────────────────────────────────────

type CardActionsProps = {
  goal: Goal;
  panel: Panel;
  logOpen: boolean;
  logVal: number;
  onPanelToggle: (p: NonNullable<Panel>) => void;
  onLogToggle: () => void;
  onLogVal: (v: number) => void;
  onLogSave: (v: number) => void;
  onLogCancel: () => void;
  canEdit: boolean;
};

function CardActions({
  goal, panel, logOpen, logVal,
  onPanelToggle, onLogToggle, onLogVal, onLogSave, onLogCancel, canEdit,
}: CardActionsProps) {
  const achieved = goal.status === "achieved";
  const doneMilestones = goal.milestones.filter((m) => m.done).length;
  // Manual log only available for goals not auto-tracked from project/sprint data
  const canLog = !achieved && goal.type === "numeric" && canEdit &&
    !["project_progress", "sprint_velocity"].includes(goal.metricSource);

  return (
    <>
      <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-border flex-wrap">
        {goal.milestones.length > 0 && (
          <button onClick={() => onPanelToggle("milestones")}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
              panel === "milestones" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Flag className="h-3 w-3" />
            {doneMilestones}/{goal.milestones.length}
            <ChevronDown className={cn("h-3 w-3 transition-transform", panel === "milestones" && "rotate-180")} />
          </button>
        )}
        <button onClick={() => onPanelToggle("activity")}
          className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
            panel === "activity" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
          <Activity className="h-3 w-3" />
          {goal.contributions.length > 0 ? goal.contributions.length : "Activity"}
          <ChevronDown className={cn("h-3 w-3 transition-transform", panel === "activity" && "rotate-180")} />
        </button>
        {(goal.linkedGoalIds?.length ?? 0) > 0 && (
          <button onClick={() => onPanelToggle("aligned")}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
              panel === "aligned" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <ArrowRight className="h-3 w-3" />
            {goal.linkedGoalIds!.length} linked
            <ChevronDown className={cn("h-3 w-3 transition-transform", panel === "aligned" && "rotate-180")} />
          </button>
        )}
        {canLog && (
          <button onClick={onLogToggle}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ml-auto",
              logOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Zap className="h-3 w-3" /> Log
          </button>
        )}
      </div>

      {logOpen && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <input type="number" value={logVal} onChange={(e) => onLogVal(Number(e.target.value))}
              className="w-24 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus />
            <span className="text-xs text-muted-foreground">{goal.unit}</span>
            <button onClick={() => onLogSave(logVal)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 ml-auto">
              <Check className="h-3 w-3" /> Save
            </button>
            <button onClick={onLogCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Card state hook ──────────────────────────────────────────────────────────

type GoalCardProps = {
  goal: Goal;
  allGoals: Goal[];
  onToggleMilestone: (goalId: number, milestoneId: number) => void;
  onLogProgress: (goalId: number, value: number) => void;
  canEdit: boolean;
};

function useCardState(goal: Goal) {
  const [panel, setPanel]     = useState<Panel>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logVal, setLogVal]   = useState(goal.current ?? 0);

  const togglePanel = (p: NonNullable<Panel>) => {
    setPanel((cur) => cur === p ? null : p);
    setLogOpen(false);
  };
  const toggleLog = () => { setLogOpen((v) => !v); setPanel(null); };

  return { panel, logOpen, logVal, setLogVal, togglePanel, toggleLog };
}

// ─── Variant A: Metric-first ──────────────────────────────────────────────────

function GoalCardMetric({ goal, allGoals, onToggleMilestone, onLogProgress, canEdit }: GoalCardProps) {
  const { panel, logOpen, logVal, setLogVal, togglePanel, toggleLog } = useCardState(goal);
  const streak   = computeStreakInfo(goal);
  const cat      = CATEGORY_CONFIG[goal.category];
  const status   = STATUS_CONFIG[goal.status];
  const achieved = goal.status === "achieved";
  const recentContributors = [...new Set(goal.contributions.map((c) => c.userId))].slice(0, 4);

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", achieved && "opacity-75")}>
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <CircularProgress progress={goal.progress} color={goal.color} size={68} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {achieved
                ? <Trophy className="h-5 w-5 text-yellow-400" />
                : <span className="text-sm font-bold text-foreground leading-none">{goal.progress}%</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground leading-snug flex-1">{goal.title}</p>
              {canEdit
                ? <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted flex-shrink-0"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></button>
                : <Lock className="h-3 w-3 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap mb-1.5">
              <cat.Icon className="h-3 w-3" />
              <span>{cat.label}</span>
              <span className="opacity-30">·</span>
              <Calendar className="h-3 w-3" />
              <span>{goal.dueLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${status.color}15`, color: status.color }}>{status.label}</span>
            </div>
            {goal.type === "numeric" && goal.current !== undefined && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-bold leading-none" style={{ color: goal.color }}>{goal.current}</span>
                <span className="text-xs text-muted-foreground">/ {goal.target} {goal.unit}</span>
                <PaceTag goal={goal} />
              </div>
            )}
            {goal.type === "milestone" && (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold leading-none" style={{ color: goal.color }}>
                  {goal.milestones.filter((m) => m.done).length}
                </span>
                <span className="text-xs text-muted-foreground">/ {goal.milestones.length} done</span>
              </div>
            )}
            {goal.type === "project" && goal.linkedProject && (
              <div className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" style={{ color: goal.color }} />
                <span className="text-xs font-medium text-foreground">{goal.linkedProject}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
        </div>

        {goal.milestones.length > 0 && (
          <div className="mb-3 px-0.5">
            <MilestoneTrack milestones={goal.milestones} color={goal.color} />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <MetricSourceTag source={goal.metricSource} />
          <StreakBadge streak={streak} />
          {recentContributors.length > 0 && (goal.scope === "team" || goal.scope === "org") && (
            <div className="flex -space-x-1 ml-auto">
              {recentContributors.map((uid) => <MiniAvatar key={uid} userId={uid} />)}
            </div>
          )}
        </div>

        <CardActions
          goal={goal} panel={panel} logOpen={logOpen} logVal={logVal}
          onPanelToggle={togglePanel} onLogToggle={toggleLog} onLogVal={setLogVal}
          onLogSave={(v) => onLogProgress(goal.id, v)} onLogCancel={toggleLog} canEdit={canEdit}
        />
        <CardPanels
          goal={goal} allGoals={allGoals} panel={panel}
          onToggle={(mid) => onToggleMilestone(goal.id, mid)} canEdit={canEdit}
        />
      </div>
    </div>
  );
}

// ─── Variant B: Quest card ────────────────────────────────────────────────────

function GoalCardQuest({ goal, allGoals, onToggleMilestone, onLogProgress, canEdit }: GoalCardProps) {
  const { panel, logOpen, logVal, setLogVal, togglePanel, toggleLog } = useCardState(goal);
  const streak   = computeStreakInfo(goal);
  const cat      = CATEGORY_CONFIG[goal.category];
  const status   = STATUS_CONFIG[goal.status];
  const achieved = goal.status === "achieved";
  const doneMilestones = goal.milestones.filter((m) => m.done).length;
  const recentContributors = [...new Set(goal.contributions.map((c) => c.userId))].slice(0, 4);

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden group", achieved && "opacity-75")}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${goal.color}18` }}>
            <cat.Icon className="h-5 w-5" style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{goal.title}</p>
              {achieved && <Trophy className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
              {canEdit && (
                <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{goal.description}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {goal.type === "numeric" && goal.current !== undefined ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{goal.current}</span>
                  {" / "}{goal.target} {goal.unit}
                </span>
              ) : goal.type === "milestone" ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{doneMilestones}</span> / {goal.milestones.length} milestones
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />{goal.linkedProject}
                </span>
              )}
              <PaceTag goal={goal} />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${status.color}15`, color: status.color }}>{status.label}</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: goal.color }}>{goal.progress}%</span>
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${goal.progress}%`, background: `linear-gradient(90deg, ${goal.color}99, ${goal.color})` }} />
          </div>
        </div>

        {goal.milestones.length > 0 && (
          <div className="mb-4 px-0.5">
            <MilestoneTrack milestones={goal.milestones} color={goal.color} />
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />{goal.dueLabel}
          </span>
          <MetricSourceTag source={goal.metricSource} />
          <div className="ml-auto flex items-center gap-2">
            <StreakBadge streak={streak} />
            {recentContributors.length > 0 && (goal.scope === "team" || goal.scope === "org") && (
              <div className="flex -space-x-1">
                {recentContributors.map((uid) => <MiniAvatar key={uid} userId={uid} />)}
              </div>
            )}
          </div>
        </div>

        <CardActions
          goal={goal} panel={panel} logOpen={logOpen} logVal={logVal}
          onPanelToggle={togglePanel} onLogToggle={toggleLog} onLogVal={setLogVal}
          onLogSave={(v) => onLogProgress(goal.id, v)} onLogCancel={toggleLog} canEdit={canEdit}
        />
        <CardPanels
          goal={goal} allGoals={allGoals} panel={panel}
          onToggle={(mid) => onToggleMilestone(goal.id, mid)} canEdit={canEdit}
        />
      </div>
    </div>
  );
}

// ─── Variant C: List row ──────────────────────────────────────────────────────

function GoalCardList({ goal, allGoals, onToggleMilestone, onLogProgress, canEdit }: GoalCardProps) {
  const { panel, logOpen, logVal, setLogVal, togglePanel, toggleLog } = useCardState(goal);
  const [expanded, setExpanded] = useState(false);
  const streak   = computeStreakInfo(goal);
  const cat      = CATEGORY_CONFIG[goal.category];
  const status   = STATUS_CONFIG[goal.status];
  const achieved = goal.status === "achieved";

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", achieved && "opacity-75")}>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${goal.color}15` }}>
          <cat.Icon className="h-4 w-4" style={{ color: goal.color }} />
        </div>
        <p className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">{goal.title}</p>
        {goal.milestones.length > 0 && (
          <div className="w-20 flex-shrink-0 hidden sm:flex items-center">
            <MilestoneTrack milestones={goal.milestones} color={goal.color} compact />
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
          </div>
          <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: goal.color }}>{goal.progress}%</span>
        </div>
        {streak.count > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Flame className="h-3 w-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{streak.count}</span>
          </div>
        )}
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 hidden sm:block"
          style={{ backgroundColor: `${status.color}15`, color: status.color }}>{status.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-3 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{goal.description}</p>
            {goal.milestones.length > 0 && (
              <div className="px-0.5">
                <MilestoneTrack milestones={goal.milestones} color={goal.color} />
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />{goal.dueLabel}
              </span>
              <PaceTag goal={goal} />
              <MetricSourceTag source={goal.metricSource} />
              <StreakBadge streak={streak} />
            </div>
            <CardActions
              goal={goal} panel={panel} logOpen={logOpen} logVal={logVal}
              onPanelToggle={togglePanel} onLogToggle={toggleLog} onLogVal={setLogVal}
              onLogSave={(v) => onLogProgress(goal.id, v)} onLogCancel={toggleLog} canEdit={canEdit}
            />
            <CardPanels
              goal={goal} allGoals={allGoals} panel={panel}
              onToggle={(mid) => onToggleMilestone(goal.id, mid)} canEdit={canEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create goal form ─────────────────────────────────────────────────────────

function CreateGoalForm({ scope, onClose }: { scope: GoalScope; onClose: () => void }) {
  const [type, setType]         = useState<GoalType>("numeric");
  const [metricSource, setMetricSource] = useState<MetricSource>("tasks_completed");

  const metricOptions: { id: MetricSource; label: string; desc: string; forScope: GoalScope[] }[] = [
    { id: "tasks_completed",      label: "Task completions",    desc: "count of tasks you close",            forScope: ["personal", "team"] },
    { id: "focus_minutes",        label: "Focus time",          desc: "hours tracked via the focus timer",   forScope: ["personal"]         },
    { id: "bugs_open",            label: "Open bugs",           desc: "P1/P2 bugs remaining (lower = better)", forScope: ["team", "org"]    },
    { id: "project_progress",     label: "Project progress",    desc: "milestone completion %",              forScope: ["team"]             },
    { id: "sprint_velocity",      label: "Sprint velocity",     desc: "story points completed vs planned",   forScope: ["team"]             },
    { id: "deployments_per_week", label: "Deploy frequency",    desc: "production deploys per week",         forScope: ["team"]             },
    { id: "milestones_shipped",   label: "Product milestones",  desc: "major features launched",             forScope: ["org"]              },
    { id: "manual",               label: "Manual",              desc: "log it yourself (revenue, hires, etc.)", forScope: ["personal", "team", "org"] },
  ].filter((o) => o.forScope.includes(scope));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            New {scope === "personal" ? "personal" : scope === "team" ? "team" : "org"} goal
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Fewer, measurable goals beat a long list of vague ones.</p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground mt-0.5">Cancel</button>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <input className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="What do you want to achieve?" />
          <textarea className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            rows={2} placeholder="Why does this matter? (optional)" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What drives progress?</label>
          <div className="grid grid-cols-2 gap-1.5">
            {metricOptions.map((o) => {
              const { Icon } = METRIC_SOURCE_CONFIG[o.id];
              return (
                <button key={o.id} onClick={() => setMetricSource(o.id)}
                  className={cn("flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left transition-all",
                    metricSource === o.id ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted")}>
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", metricSource === o.id ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="text-xs font-medium text-foreground">{o.label}</p>
                    <p className="text-[10px] text-muted-foreground">{o.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {(metricSource === "manual" || metricSource === "tasks_completed" || metricSource === "focus_minutes" || metricSource === "bugs_open") && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Starting value", placeholder: "0"             },
              { label: "Target",         placeholder: "100"            },
              { label: "Unit",           placeholder: "tasks, hrs, …"  },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
                <input placeholder={f.placeholder}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {scope === "team" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team</label>
              <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {metricSource === "project_progress" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Linked project</label>
              <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                {PROJECTS.filter((p) => p.workspaceId === "ws3").map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target date</label>
            <input type="date"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
            <Check className="h-3.5 w-3.5" /> Create goal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ScopeTab = "personal" | "team" | "org";

export function GoalsPage() {
  const { activeWorkspace, workspaceRole, myTeams } = useApp();
  const [goals, setGoals]         = useState<Goal[]>(ALL_GOALS);
  const [scopeTab, setScopeTab]   = useState<ScopeTab>("personal");
  const [statusFilter, setStatus] = useState<GoalStatus | "all" | "active">("active");
  const [showForm, setShowForm]   = useState(false);
  const [variant, setVariant]     = useState<CardVariant>("quest");

  const isOrgAdmin   = activeWorkspace.type === "ORGANIZATION" && (workspaceRole === "ADMIN" || workspaceRole === "OWNER");
  const adminTeamIds = myTeams.filter((mt) => mt.role === "ADMIN").map((mt) => mt.team.id);
  const isTeamAdmin  = adminTeamIds.length > 0;
  const isInOrg      = activeWorkspace.type === "ORGANIZATION";

  const tabs: { id: ScopeTab; label: string; icon: typeof User }[] = [
    { id: "personal", label: "Personal",     icon: User      },
    ...(isInOrg ? [{ id: "team" as ScopeTab, label: "Team",         icon: Users     }] : []),
    ...(isInOrg ? [{ id: "org"  as ScopeTab, label: "Organization", icon: Building2 }] : []),
  ];

  const canCreate: Record<ScopeTab, boolean> = {
    personal: true,
    team:     isTeamAdmin,
    org:      isOrgAdmin,
  };

  const myTeamIds = TEAM_MEMBERS.filter((tm) => tm.userId === CURRENT_USER_ID).map((tm) => tm.teamId);
  const applyTeamFilter = (g: Goal) => scopeTab !== "team" || !g.teamId || myTeamIds.includes(g.teamId);
  const allScopeGoals = goals.filter((g) => g.scope === scopeTab && applyTeamFilter(g));
  const scopeGoals = allScopeGoals.filter((g) => {
    if (statusFilter === "active") return g.status !== "achieved" && g.status !== "paused";
    if (statusFilter === "all")    return true;
    return g.status === statusFilter;
  });

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId) return g;
      const newMs = g.milestones.map((m) => m.id !== milestoneId ? m : { ...m, done: !m.done });
      return { ...g, milestones: newMs, progress: Math.round(newMs.filter((m) => m.done).length / (newMs.length || 1) * 100) };
    }));
  };

  const logProgress = (goalId: number, value: number) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId || !g.target) return g;
      const newContrib: Contribution = {
        id: Date.now(), userId: CURRENT_USER_ID,
        type: "progress_logged", label: `Logged: ${value} ${g.unit ?? ""}`.trim(),
        value, timestamp: "just now",
      };
      return {
        ...g,
        current: value,
        progress: Math.min(Math.round((value / g.target) * 100), 100),
        contributions: [newContrib, ...g.contributions],
      };
    }));
  };

  const active   = allScopeGoals.filter((g) => g.status !== "achieved" && g.status !== "paused").length;
  const achieved = allScopeGoals.filter((g) => g.status === "achieved").length;
  const atRisk   = allScopeGoals.filter((g) => g.status === "at_risk").length;

  // Team participation: who contributed activity this period
  const participationData = scopeTab === "team" ? (() => {
    const memberIds = [...new Set(TEAM_MEMBERS.filter((tm) => myTeamIds.includes(tm.teamId)).map((tm) => tm.userId))];
    return memberIds.map((uid) => {
      const user  = USERS.find((u) => u.id === uid);
      const count = allScopeGoals.flatMap((g) => g.contributions.filter((c) => c.userId === uid)).length;
      return { uid, user, count };
    }).filter((m) => !!m.user);
  })() : [];

  const CardComponent = variant === "metric" ? GoalCardMetric : variant === "quest" ? GoalCardQuest : GoalCardList;

  return (
    <div className="p-6 max-w-[1000px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-foreground mb-1">Goals</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {active   > 0 && <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{active} active</span>}
            {achieved > 0 && <span className="flex items-center gap-1.5"><Trophy className="h-3 w-3 text-yellow-400" />{achieved} achieved</span>}
            {atRisk   > 0 && <span className="flex items-center gap-1.5 text-destructive"><div className="h-1.5 w-1.5 rounded-full bg-destructive" />{atRisk} at risk</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border">
            {([
              { id: "metric" as CardVariant, Icon: BarChart2,    label: "Metric" },
              { id: "quest"  as CardVariant, Icon: Layers,       label: "Quest"  },
              { id: "list"   as CardVariant, Icon: AlignJustify, label: "List"   },
            ]).map((v) => (
              <button key={v.id} onClick={() => setVariant(v.id)} title={v.label}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  variant === v.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <v.Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          {canCreate[scopeTab] && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> New goal
            </button>
          )}
        </div>
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setScopeTab(t.id); setShowForm(false); }}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              scopeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-5 mt-2">
        {{
          personal: "Your own goals — progress is tracked automatically from your activity.",
          team:     isTeamAdmin ? "Team goals — progress is pulled from task, sprint, and deployment data." : "Team goals set by your leads. Progress updates automatically from team activity.",
          org:      isOrgAdmin  ? "Org-wide goals. Create and manage targets that span all teams." : "Company targets set by leadership. Visible to all members.",
        }[scopeTab]}
      </p>

      {showForm && <CreateGoalForm scope={scopeTab} onClose={() => setShowForm(false)} />}

      {/* Team participation */}
      {scopeTab === "team" && participationData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Team activity this period
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {participationData.map(({ uid, user, count }) => {
              if (!user) return null;
              return (
                <div key={uid} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${user.color}25`, color: user.color }}>
                    {user.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{user.name.split(" ")[0]}</p>
                    <p className={cn("text-[10px]", count > 0 ? "text-chart-2" : "text-muted-foreground/50")}>
                      {count > 0 ? `${count} contribution${count > 1 ? "s" : ""}` : "No activity yet"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border">
          {([
            { id: "active",   label: "Active"   },
            { id: "all",      label: "All"       },
            { id: "achieved", label: "Achieved"  },
            { id: "paused",   label: "Paused"    },
          ] as { id: typeof statusFilter; label: string }[]).map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                statusFilter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {scopeGoals.length} goal{scopeGoals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      {scopeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No goals here yet.</p>
          {canCreate[scopeTab] && (
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-primary hover:opacity-80">Create one</button>
          )}
        </div>
      ) : (
        <div className={cn(
          variant === "list" ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-4",
        )}>
          {scopeGoals.map((goal) => (
            <CardComponent
              key={goal.id}
              goal={goal}
              allGoals={goals}
              onToggleMilestone={toggleMilestone}
              onLogProgress={logProgress}
              canEdit={
                goal.scope === "personal" ||
                (goal.scope === "team" && adminTeamIds.includes(goal.teamId ?? "")) ||
                (goal.scope === "org" && isOrgAdmin)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
