import { useMemo } from "react";
import {
  Users, CheckCircle2, FolderOpen, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Rocket, ShieldAlert,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import {
  TEAM_MEMBERS, PROJECTS, TEAM_MEMBER_STATS, ORG_TEAM_STATS,
  WORKSPACE_MEMBERSHIPS,
} from "../../data/mockData";
import type { Timeframe } from "./StatsPage";

// ─── Mock series data ─────────────────────────────────────────────────────────

function genSeries(base: number, variance: number, weeks = 26): number[] {
  return Array.from({ length: weeks }, (_, i) => {
    const seed = ((i * 1664525 + 1013904223) >>> 0) % 100;
    return Math.max(0, Math.round(base + (seed / 100 - 0.5) * variance * 2));
  });
}

const ORG_SERIES: Record<string, number[]> = {
  tasks:    genSeries(140, 30),
  hours:    genSeries(520, 80),
  deploys:  genSeries(5,   2),
  velocity: genSeries(76,  10),
};

const TF_WEEKS: Record<Timeframe, number> = {
  this_week: 1, this_month: 4, last_3months: 13, last_6months: 26, this_year: 26,
};

const WEEK_LABELS = ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13",
  "W14","W15","W16","W17","W18","W19","W20","W21","W22","W23","W24","W25","W26"];

function getSeriesForTf(metric: string, tf: Timeframe) {
  const weeks = TF_WEEKS[tf];
  return ORG_SERIES[metric].slice(-weeks).map((v, i) => ({ label: WEEK_LABELS[i], value: v }));
}

function totalForTf(metric: string, tf: Timeframe): number {
  const weeks = TF_WEEKS[tf];
  return ORG_SERIES[metric].slice(-weeks).reduce((a, b) => a + b, 0);
}

function prevTotalForTf(metric: string, tf: Timeframe): number {
  const weeks = TF_WEEKS[tf];
  return ORG_SERIES[metric].slice(-weeks * 2, -weeks).reduce((a, b) => a + b, 0);
}

// ─── Org-level milestones ────────────────────────────────────────────────────

interface OrgMilestone {
  id: number; label: string; done: boolean;
  dueLabel?: string; completedOnTime?: boolean;
}

interface OrgProjectRow {
  projectId: string; projectName: string; projectColor: string;
  dueLabel: string; status: "on_track" | "at_risk" | "behind";
  teamName: string;
  milestones: OrgMilestone[];
}

const ORG_PROJECTS: OrgProjectRow[] = [
  {
    projectId: "p1", projectName: "Stride v2.0", projectColor: "#61afef",
    dueLabel: "Apr 30", status: "on_track", teamName: "Core",
    milestones: [
      { id: 1, label: "Auth redesign",    done: true,  dueLabel: "Mar 5",  completedOnTime: true  },
      { id: 2, label: "Tasks & calendar", done: true,  dueLabel: "Mar 20", completedOnTime: true  },
      { id: 3, label: "Timer & reports",  done: false, dueLabel: "Apr 5"                          },
      { id: 4, label: "Team admin",       done: false, dueLabel: "Apr 18"                         },
      { id: 5, label: "Public beta",      done: false, dueLabel: "Apr 30"                         },
    ],
  },
  {
    projectId: "p2", projectName: "API Platform v3", projectColor: "#98c379",
    dueLabel: "Jun 15", status: "at_risk", teamName: "Platform",
    milestones: [
      { id: 1, label: "Schema design",    done: true,  dueLabel: "Feb 28", completedOnTime: false },
      { id: 2, label: "Core endpoints",   done: false, dueLabel: "Apr 10"                         },
      { id: 3, label: "Auth & rate limit",done: false, dueLabel: "May 15"                         },
      { id: 4, label: "Docs & SDK",       done: false, dueLabel: "Jun 15"                         },
    ],
  },
  {
    projectId: "p3", projectName: "Website Redesign", projectColor: "#c678dd",
    dueLabel: "May 1", status: "on_track", teamName: "Growth",
    milestones: [
      { id: 1, label: "Design system",    done: true,  dueLabel: "Mar 1",  completedOnTime: true  },
      { id: 2, label: "Landing page",     done: true,  dueLabel: "Mar 22", completedOnTime: true  },
      { id: 3, label: "Blog & docs",      done: false, dueLabel: "Apr 20"                         },
    ],
  },
  {
    projectId: "p4", projectName: "Data Pipeline", projectColor: "#e5c07b",
    dueLabel: "Jul 30", status: "on_track", teamName: "Infra",
    milestones: [
      { id: 1, label: "Architecture",     done: true,  dueLabel: "Mar 10", completedOnTime: true  },
      { id: 2, label: "Ingestion layer",  done: false, dueLabel: "Apr 30"                         },
      { id: 3, label: "Transform layer",  done: false, dueLabel: "Jun 15"                         },
      { id: 4, label: "Dashboard output", done: false, dueLabel: "Jul 30"                         },
    ],
  },
];

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

function TrendChip({ current, prev }: { current: number; prev: number }) {
  if (!prev) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> flat</span>;
  const up = pct > 0;
  return (
    <span className={cn("text-xs font-medium flex items-center gap-0.5", up ? "text-green-400" : "text-destructive")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// KPI + sparkline card
function OrgKpiCard({
  label, value, unit, prev, color, data, icon: Icon, weeklyTarget,
}: {
  label: string; value: number; unit: string; prev: number;
  color: string; data: { label: string; value: number }[];
  icon: typeof Users; weeklyTarget?: number;
}) {
  const pct = weeklyTarget ? Math.min(Math.round((value / weeklyTarget) * 100), 100) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <TrendChip current={value} prev={prev} />
      </div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>
      </div>
      {/* Sparkline */}
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -32 }}>
            <defs>
              <linearGradient id={`org-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Tooltip content={<ChartTooltip unit={` ${unit}`} />} />
            {weeklyTarget && <ReferenceLine y={weeklyTarget} stroke={color} strokeDasharray="4 2" strokeOpacity={0.5} />}
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
              fill={`url(#org-${label})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {pct !== null && (
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

// ─── Project milestone row (org view) ─────────────────────────────────────────

const STATUS_CONFIG = {
  on_track: { label: "On track", color: "#98c379" },
  at_risk:  { label: "At risk",  color: "#e5c07b" },
  behind:   { label: "Behind",   color: "#e06c75" },
};

function OrgMilestoneRow({ project }: { project: OrgProjectRow }) {
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{project.projectName}</span>
            <span className="text-[10px] text-muted-foreground">· {project.teamName} team</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{done}/{total} milestones</span>
            <span>·</span>
            <span>Due {project.dueLabel}</span>
          </div>
        </div>
        {/* Mini milestone dots */}
        <div className="hidden sm:flex items-center gap-1">
          {project.milestones.map((m) => (
            <div
              key={m.id}
              title={m.label}
              className={cn(
                "h-2 w-2 rounded-full",
                m.done
                  ? m.completedOnTime === false ? "bg-orange-400" : "bg-primary"
                  : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-2">{pct}%</span>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-1.5">
          {project.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <div className={cn("h-2 w-2 rounded-full flex-shrink-0", m.done ? "bg-primary" : "bg-border")} />
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
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function OrgStatsSection({ timeframe }: { timeframe: Timeframe }) {
  const { activeWorkspace, allWorkspaceTeams } = useApp();

  const wsMembers = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === activeWorkspace.id);
  const atRisk    = ORG_PROJECTS.filter((p) => p.status === "at_risk").length;

  const metrics = [
    { key: "tasks",    label: "Tasks completed",  unit: "tasks",   color: "#61afef", icon: CheckCircle2, weeklyTarget: 150 },
    { key: "hours",    label: "Hours logged",      unit: "hrs",     color: "#98c379", icon: Users,        weeklyTarget: 600 },
    { key: "deploys",  label: "Deployments",       unit: "deploys", color: "#c678dd", icon: Rocket,       weeklyTarget: 4   },
    { key: "velocity", label: "Sprint velocity",   unit: "%",       color: "#e5c07b", icon: TrendingUp,   weeklyTarget: 80  },
  ];

  return (
    <div className="space-y-8">

      {/* ── Org metrics ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Organisation metrics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wsMembers.length} members across {allWorkspaceTeams.length} teams.
              {atRisk > 0 && (
                <span className="text-orange-400 ml-1.5 flex items-center gap-1 inline-flex">
                  <AlertTriangle className="h-3 w-3" /> {atRisk} project{atRisk > 1 ? "s" : ""} at risk
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m) => {
            const total = totalForTf(m.key, timeframe);
            const prev  = prevTotalForTf(m.key, timeframe);
            const data  = getSeriesForTf(m.key, timeframe);
            return (
              <OrgKpiCard
                key={m.key}
                label={m.label}
                value={total}
                unit={m.unit}
                prev={prev}
                color={m.color}
                data={data}
                icon={m.icon}
                weeklyTarget={m.weeklyTarget * TF_WEEKS[timeframe]}
              />
            );
          })}
        </div>
      </div>

      {/* ── Divider — clear separation ───────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
          <Rocket className="h-3 w-3" />
          Project milestones
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Milestone progress is managed on each project — shown here as an org-wide read-only overview.
      </p>

      {/* ── Project milestones ─────────────────────────────────────────── */}
      <div className="space-y-3 -mt-4">
        {ORG_PROJECTS.map((project) => (
          <OrgMilestoneRow key={project.projectId} project={project} />
        ))}
      </div>

    </div>
  );
}
