import { useState } from "react";
import {
  Users, CheckCircle2, Rocket, Flame, TrendingUp, TrendingDown,
  Minus, GitMerge, Zap, Clock, ExternalLink, ChevronDown, ChevronUp,
  CircleDot,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import { TEAM_MEMBERS, USERS, PROJECTS } from "../../data/mockData";
import type { Timeframe } from "./StatsPage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamGoal {
  metric: string;
  label: string;
  weeklyTarget: number;
  unit: string;
  color: string;
}

interface ProjectMilestone {
  id: number;
  label: string;
  done: boolean;
  dueLabel?: string;
  completedOnTime?: boolean;
}

interface ProjectMilestones {
  projectId: string;
  projectName: string;
  projectColor: string;
  dueLabel: string;
  status: "on_track" | "at_risk" | "behind";
  milestones: ProjectMilestone[];
  myContributionPct: number; // % of work on this project attributed to the current user
  myTasksCompleted: number;  // approx tasks current user completed toward milestones
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TF_WEEKS: Record<Timeframe, number> = {
  this_week: 1, this_month: 4, last_3months: 13, last_6months: 26, this_year: 52,
};

const WEEK_LABELS = ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13",
  "W14","W15","W16","W17","W18","W19","W20","W21","W22","W23","W24","W25","W26"];

function genSeries(base: number, variance: number, weeks = 26): number[] {
  return Array.from({ length: weeks }, (_, i) => {
    const seed = ((i * 1664525 + 1013904223) >>> 0) % 100;
    return Math.max(0, Math.round(base + (seed / 100 - 0.5) * variance * 2));
  });
}

// Team aggregate weekly series
const TEAM_SERIES: Record<string, number[]> = {
  tasks:    genSeries(32, 10),
  commits:  genSeries(68, 20),
  deploys:  genSeries(2,  1),
  velocity: genSeries(74, 12),
};

// Your personal contribution as % of team total
const MY_PCT: Record<string, number> = {
  tasks: 28, commits: 24, deploys: 35, velocity: 22,
};

// Team goals (admin-set, locked)
const TEAM_GOALS: TeamGoal[] = [
  { metric: "tasks",    label: "Tasks completed",    weeklyTarget: 50,  unit: "tasks",   color: "#61afef" },
  { metric: "commits",  label: "Commits",            weeklyTarget: 80,  unit: "commits", color: "#c678dd" },
  { metric: "deploys",  label: "Deployments",        weeklyTarget: 2,   unit: "deploys", color: "#98c379" },
  { metric: "velocity", label: "Sprint velocity",    weeklyTarget: 80,  unit: "%",       color: "#e5c07b" },
];

// Project milestones — clearly separate from metrics
const PROJECT_MILESTONES: ProjectMilestones[] = [
  {
    projectId: "p1",
    projectName: "Stride v2.0",
    projectColor: "#61afef",
    dueLabel: "Apr 30",
    status: "on_track",
    myContributionPct: 31,
    myTasksCompleted: 18,
    milestones: [
      { id: 1, label: "Auth redesign",     done: true,  dueLabel: "Mar 5",  completedOnTime: true  },
      { id: 2, label: "Tasks & calendar",  done: true,  dueLabel: "Mar 20", completedOnTime: true  },
      { id: 3, label: "Timer & reports",   done: false, dueLabel: "Apr 5"                          },
      { id: 4, label: "Team admin",        done: false, dueLabel: "Apr 18"                         },
      { id: 5, label: "Public beta",       done: false, dueLabel: "Apr 30"                         },
    ],
  },
  {
    projectId: "p2",
    projectName: "API Platform v3",
    projectColor: "#98c379",
    dueLabel: "Jun 15",
    status: "at_risk",
    myContributionPct: 22,
    myTasksCompleted: 7,
    milestones: [
      { id: 1, label: "Schema design",     done: true,  dueLabel: "Feb 28", completedOnTime: false },
      { id: 2, label: "Core endpoints",    done: false, dueLabel: "Apr 10"                         },
      { id: 3, label: "Auth & rate limit", done: false, dueLabel: "May 15"                         },
      { id: 4, label: "Docs & SDK",        done: false, dueLabel: "Jun 15"                         },
    ],
  },
  {
    projectId: "p3",
    projectName: "Website Redesign",
    projectColor: "#c678dd",
    dueLabel: "May 1",
    status: "on_track",
    myContributionPct: 44,
    myTasksCompleted: 12,
    milestones: [
      { id: 1, label: "Design system",     done: true,  dueLabel: "Mar 1",  completedOnTime: true  },
      { id: 2, label: "Landing page",      done: true,  dueLabel: "Mar 22", completedOnTime: true  },
      { id: 3, label: "Blog & docs",       done: false, dueLabel: "Apr 20"                         },
    ],
  },
];

function getSeriesForTf(metric: string, tf: Timeframe) {
  const weeks = TF_WEEKS[tf];
  const raw   = TEAM_SERIES[metric].slice(-weeks);
  return raw.map((v, i) => ({ label: WEEK_LABELS[i], value: v }));
}

function totalForTf(metric: string, tf: Timeframe): number {
  const weeks = TF_WEEKS[tf];
  return TEAM_SERIES[metric].slice(-weeks).reduce((a, b) => a + b, 0);
}

function scaledGoal(weekly: number, tf: Timeframe): number {
  return weekly * TF_WEEKS[tf];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground font-medium">{payload[0].value}{unit}</p>
    </div>
  );
}

function TrendChip({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> flat</span>;
  const up = pct > 0;
  return (
    <span className={cn("text-xs font-medium flex items-center gap-0.5", up ? "text-green-400" : "text-destructive")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// Team goal card: aggregate progress + personal contribution
function TeamGoalCard({ goal, tf }: { goal: TeamGoal; tf: Timeframe }) {
  const total    = totalForTf(goal.metric, tf);
  const target   = scaledGoal(goal.weeklyTarget, tf);
  const pct      = Math.min(Math.round((total / target) * 100), 100);
  const myCount  = Math.round(total * (MY_PCT[goal.metric] / 100));
  const myPct    = MY_PCT[goal.metric];
  const data     = getSeriesForTf(goal.metric, tf);
  const prevData = TEAM_SERIES[goal.metric].slice(-TF_WEEKS[tf] * 2, -TF_WEEKS[tf]);
  const prevTotal = prevData.reduce((a, b) => a + b, 0);
  const trendPct  = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
  const onTrack   = pct >= 85;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{goal.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">team goal</span>
        </div>
        <TrendChip pct={trendPct} />
      </div>

      {/* Aggregate progress */}
      <div className="mb-3">
        <div className="flex items-end gap-2 mb-1.5">
          <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
          <span className="text-sm text-muted-foreground mb-0.5">/ {target} {goal.unit}</span>
          <span className={cn("text-sm font-medium mb-0.5 ml-auto", onTrack ? "text-green-400" : "text-orange-400")}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: goal.color }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-16 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -32 }}>
            <defs>
              <linearGradient id={`tg-${goal.metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={goal.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={goal.color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Tooltip content={<ChartTooltip unit={` ${goal.unit}`} />} />
            <ReferenceLine y={goal.weeklyTarget} stroke={goal.color} strokeDasharray="4 3" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="value" stroke={goal.color} strokeWidth={1.5}
              fill={`url(#tg-${goal.metric})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Your contribution — framed as impact, not comparison */}
      <div className="pt-3 border-t border-border">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your contribution</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground tabular-nums">{myCount}</span>
            <span className="text-xs text-muted-foreground ml-1">{goal.unit}</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold" style={{ color: goal.color }}>{myPct}%</div>
            <div className="text-[10px] text-muted-foreground">of team total</div>
          </div>
        </div>
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${myPct}%`, backgroundColor: goal.color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Project milestones section ───────────────────────────────────────────────
// Clearly separated — this is about what ships, not metric targets

const STATUS_CONFIG = {
  on_track: { label: "On track", color: "#98c379" },
  at_risk:  { label: "At risk",  color: "#e5c07b" },
  behind:   { label: "Behind",   color: "#e06c75" },
};

function MilestoneTrack({ milestones }: { milestones: ProjectMilestone[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {milestones.map((m, i) => (
        <div key={m.id} className="flex items-center gap-1">
          {i > 0 && (
            <div className={cn("h-px w-4 flex-shrink-0", m.done ? "bg-primary/60" : "bg-border")} />
          )}
          <div className="flex flex-col items-center gap-0.5">
            <div className={cn(
              "h-3 w-3 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              m.done
                ? m.completedOnTime === false
                  ? "border-orange-400 bg-orange-400"
                  : "border-primary bg-primary"
                : "border-border bg-transparent",
            )} />
            <span className="text-[9px] text-muted-foreground/70 max-w-[48px] text-center leading-tight truncate" title={m.label}>
              {m.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectMilestoneCard({ project }: { project: ProjectMilestones }) {
  const [expanded, setExpanded] = useState(false);
  const done  = project.milestones.filter((m) => m.done).length;
  const total = project.milestones.length;
  const pct   = Math.round((done / total) * 100);
  const cfg   = STATUS_CONFIG[project.status];

  return (
    <div className="bg-muted/40 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.projectColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground">{project.projectName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{done}/{total} milestones</span>
            <span>Due {project.dueLabel}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-semibold text-foreground">{pct}%</span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <MilestoneTrack milestones={project.milestones} />
          <div className="mt-3 space-y-1.5">
            {project.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <div className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  m.done ? "bg-primary" : "bg-border",
                )} />
                <span className={cn("flex-1", m.done ? "text-muted-foreground line-through" : "text-foreground")}>
                  {m.label}
                </span>
                {m.dueLabel && (
                  <span className={cn(
                    "text-[10px]",
                    m.done
                      ? m.completedOnTime === false ? "text-orange-400" : "text-green-400"
                      : "text-muted-foreground",
                  )}>
                    {m.done ? (m.completedOnTime === false ? "late" : "on time") : m.dueLabel}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Your contribution to this project's milestones */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your contribution</p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {project.myTasksCompleted} tasks completed across milestones
              </span>
              <span className="text-xs font-semibold" style={{ color: project.projectColor }}>
                {project.myContributionPct}% of team work
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${project.myContributionPct}%`, backgroundColor: project.projectColor }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function TeamStatsSection({ timeframe }: { timeframe: Timeframe }) {
  const { myTeams } = useApp();
  const isAdmin = myTeams.some((mt) => mt.role === "ADMIN");

  return (
    <div className="space-y-8">

      {/* ── Team goals ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Team goals</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregate progress toward team targets — and your contribution.
            </p>
          </div>
          {isAdmin && (
            <button className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
              Edit goals
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TEAM_GOALS.map((goal) => (
            <TeamGoalCard key={goal.metric} goal={goal} tf={timeframe} />
          ))}
        </div>
      </div>

      {/* ── Divider with label making the separation explicit ─────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
          <Rocket className="h-3 w-3" />
          Project milestones
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Milestone progress is managed on each project — shown here as a read-only overview.
        {isAdmin && (
          <span className="ml-1 text-primary/70 cursor-pointer hover:text-primary">Edit on project →</span>
        )}
      </p>

      {/* ── Project milestones ────────────────────────────────────────── */}
      <div className="space-y-3 -mt-4">
        {PROJECT_MILESTONES.map((project) => (
          <ProjectMilestoneCard key={project.projectId} project={project} />
        ))}
      </div>

    </div>
  );
}
