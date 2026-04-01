import {
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import { WORKSPACE_MEMBERSHIPS } from "../../data/mockData";
import { ORG_GOALS } from "../../data/mockIntelligence";
import { StatusBanner } from "./IntelligenceSection";
import { GoalsSection } from "./GoalsSection";
import type { Timeframe } from "./StatsPage";

// ─── Mock series data ──────────────────────────────────────────────────────────

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

const WEEK_LABELS = [
  "W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13",
  "W14","W15","W16","W17","W18","W19","W20","W21","W22","W23","W24","W25","W26",
];

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

// ─── ChartTooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground font-medium">{payload[0].value.toLocaleString()}{unit}</p>
    </div>
  );
}

// ─── Big KPI Stat ─────────────────────────────────────────────────────────────

function OrgBigStat({ value, label, sublabel, trend, accent, color }: {
  value: string | number; label: string; sublabel?: string;
  trend?: "up" | "down" | "flat"; accent?: boolean; color?: string;
}) {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl px-4 py-4 text-center">
      <div
        className={cn("text-3xl font-black tabular-nums", accent ? "text-primary" : "text-foreground")}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="text-xs font-semibold text-foreground mt-1">{label}</div>
      {sublabel && (
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {trend === "up"   && <TrendingUp   className="h-3 w-3 text-green-400" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-red-400"   />}
          {trend === "flat" && <Minus        className="h-3 w-3 text-muted-foreground" />}
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Velocity Sparkline ───────────────────────────────────────────────────────

function OrgVelocityChart({ timeframe }: { timeframe: Timeframe }) {
  const data = getSeriesForTf("tasks", timeframe);
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Organisation throughput</p>
          <p className="text-[11px] text-muted-foreground">Tasks completed across all teams</p>
        </div>
        <div className="text-2xl font-black text-foreground tabular-nums">
          {data[data.length - 1]?.value ?? "—"}
        </div>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="org-throughput-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#61afef" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#61afef" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              hide
              domain={[(dataMin: number) => Math.max(0, dataMin - 15), (dataMax: number) => dataMax + 10]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#61afef"
              strokeWidth={2.5}
              fill="url(#org-throughput-grad)"
              dot={false}
              activeDot={{ r: 4, fill: "#61afef", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function OrgStatsSection({ timeframe }: { timeframe: Timeframe }) {
  const { activeWorkspace, allWorkspaceTeams } = useApp();

  const wsMembers  = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === activeWorkspace.id);
  const atRisk     = ORG_GOALS.filter((g) => g.status === "at_risk").length;

  const taskTotal  = totalForTf("tasks",   timeframe);
  const taskPrev   = prevTotalForTf("tasks",   timeframe);
  const hoursTotal = totalForTf("hours",   timeframe);
  const hoursPrev  = prevTotalForTf("hours",   timeframe);
  const velTotal   = Math.round(totalForTf("velocity", timeframe) / TF_WEEKS[timeframe]);

  const taskChange  = taskPrev  ? Math.round(((taskTotal  - taskPrev)  / taskPrev)  * 100) : 0;
  const hoursChange = hoursPrev ? Math.round(((hoursTotal - hoursPrev) / hoursPrev) * 100) : 0;

  const bannerVariant = taskChange >= 15 ? "celebration" : atRisk > 0 ? "warning" : "success";
  const bannerMessage =
    taskChange >= 15
      ? `Org output up ${taskChange}% — ${wsMembers.length} members shipped ${taskTotal} tasks. Best period in months.`
      : atRisk > 0
      ? `${atRisk} goal${atRisk > 1 ? "s" : ""} flagged at risk — review blockers before end of sprint.`
      : `Organisation is running at a healthy pace. ${wsMembers.length} members, ${allWorkspaceTeams.length} teams, all on track.`;

  return (
    <div className="space-y-4 mb-8">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">{activeWorkspace.name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {wsMembers.length} members · {allWorkspaceTeams.length} teams · {ORG_GOALS.length} goals
        </p>
      </div>

      {/* Banner */}
      <StatusBanner variant={bannerVariant} message={bannerMessage} />

      {/* Big 4 KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <OrgBigStat
          value={taskTotal.toLocaleString()}
          label="Tasks completed"
          sublabel={`${taskChange > 0 ? "+" : ""}${taskChange}% vs prior`}
          trend={taskChange > 5 ? "up" : taskChange < -5 ? "down" : "flat"}
        />
        <OrgBigStat
          value={`${hoursTotal.toLocaleString()}h`}
          label="Hours logged"
          sublabel={`${hoursChange > 0 ? "+" : ""}${hoursChange}% vs prior`}
          trend={hoursChange > 5 ? "up" : hoursChange < -5 ? "down" : "flat"}
        />
        <OrgBigStat
          value={`${velTotal}%`}
          label="Sprint velocity"
          sublabel="avg capacity used"
        />
        <OrgBigStat
          value={atRisk > 0 ? atRisk : "0"}
          label="At-risk goals"
          sublabel={atRisk > 0 ? "need attention" : "all on track"}
          accent={atRisk > 0}
        />
      </div>

      {/* Throughput chart */}
      <OrgVelocityChart timeframe={timeframe} />

      {/* Goals */}
      <GoalsSection goals={ORG_GOALS} entityName={activeWorkspace.name} />

    </div>
  );
}
