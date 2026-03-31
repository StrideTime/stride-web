import { useState, useCallback, useRef } from "react";
import {
  Flame, Plus, X, GripVertical, Check, GitCommit,
  GitPullRequest, GitMerge, Rocket, Bug, Zap,
  CheckCircle2, Clock, Star, TrendingUp, Link2,
  BarChart2, Settings2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { cn } from "../ui/utils";
import { TIMEFRAME_LABELS } from "./StatsPage";
import type { Timeframe } from "./StatsPage";

// ─── Types ────────────────────────────────────────────────────────────────────

type MetricId =
  | "tasks_completed" | "hours_clocked"  | "focus_sessions"
  | "points_earned"   | "active_streak"
  | "commits"         | "prs_merged"     | "pr_reviews"    | "code_additions"
  | "issues_closed"   | "story_points"
  | "deploys"         | "build_success";

type Integration = "GitHub" | "Jira" | "Linear" | "GitHub Actions" | null;
type WidgetDisplay = "snapshot" | "line" | "heatmap";

interface MetricDef {
  id: MetricId;
  label: string;
  unit: string;
  category: string;
  integration: Integration;
  icon: typeof Flame;
  color: string;
  displays: WidgetDisplay[];
  supportsTarget: boolean;
}

interface Widget {
  id: string;
  metric: MetricId;
  display: WidgetDisplay;
  goalTarget?: number; // weekly target
  size: 1 | 2 | 4; // col-span in 4-col grid
}

// ─── Metric definitions ───────────────────────────────────────────────────────

const METRICS: Record<MetricId, MetricDef> = {
  tasks_completed: { id: "tasks_completed", label: "Tasks completed",   unit: "tasks",   category: "Productivity", integration: null,             icon: CheckCircle2,  color: "#61afef", displays: ["snapshot","line","heatmap"], supportsTarget: true  },
  hours_clocked:   { id: "hours_clocked",   label: "Hours worked",      unit: "hrs",     category: "Productivity", integration: null,             icon: Clock,         color: "#98c379", displays: ["snapshot","line"],           supportsTarget: true  },
  focus_sessions:  { id: "focus_sessions",  label: "Focus sessions",    unit: "sessions",category: "Productivity", integration: null,             icon: Zap,           color: "#e5c07b", displays: ["snapshot","line","heatmap"], supportsTarget: true  },
  points_earned:   { id: "points_earned",   label: "Points earned",     unit: "pts",     category: "Productivity", integration: null,             icon: Star,          color: "#56b6c2", displays: ["snapshot","line"],           supportsTarget: true  },
  active_streak:   { id: "active_streak",   label: "Active day streak", unit: "days",    category: "Productivity", integration: null,             icon: Flame,         color: "#e06c75", displays: ["snapshot"],                  supportsTarget: false },
  commits:         { id: "commits",         label: "Commits",           unit: "commits", category: "Code",         integration: "GitHub",         icon: GitCommit,     color: "#c678dd", displays: ["snapshot","line","heatmap"], supportsTarget: true  },
  prs_merged:      { id: "prs_merged",      label: "PRs merged",        unit: "PRs",     category: "Code",         integration: "GitHub",         icon: GitMerge,      color: "#61afef", displays: ["snapshot","line"],           supportsTarget: true  },
  pr_reviews:      { id: "pr_reviews",      label: "PR reviews",        unit: "reviews", category: "Code",         integration: "GitHub",         icon: GitPullRequest,color: "#98c379", displays: ["snapshot","line"],           supportsTarget: true  },
  code_additions:  { id: "code_additions",  label: "Lines added",       unit: "lines",   category: "Code",         integration: "GitHub",         icon: TrendingUp,    color: "#e5c07b", displays: ["snapshot","line"],           supportsTarget: false },
  issues_closed:   { id: "issues_closed",   label: "Issues closed",     unit: "issues",  category: "Project",      integration: "Jira",           icon: Bug,           color: "#e06c75", displays: ["snapshot","line","heatmap"], supportsTarget: true  },
  story_points:    { id: "story_points",    label: "Story points",      unit: "pts",     category: "Project",      integration: "Jira",           icon: CheckCircle2,  color: "#56b6c2", displays: ["snapshot","line"],           supportsTarget: true  },
  deploys:         { id: "deploys",         label: "Deployments",       unit: "deploys", category: "Deployment",   integration: "GitHub Actions", icon: Rocket,        color: "#98c379", displays: ["snapshot","line"],           supportsTarget: true  },
  build_success:   { id: "build_success",   label: "Build success rate",unit: "%",       category: "Deployment",   integration: "GitHub Actions", icon: Check,         color: "#61afef", displays: ["snapshot","line"],           supportsTarget: true  },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

function genSeries(base: number, variance: number, weeks = 26): number[] {
  return Array.from({ length: weeks }, (_, i) => {
    const seed = ((i * 2654435761) >>> 0) % 100;
    const v = base + (seed / 100 - 0.5) * variance * 2;
    return Math.max(0, Math.round(v * 10) / 10);
  });
}

const WEEKLY_DATA: Record<MetricId, number[]> = {
  tasks_completed: genSeries(9,   4),
  hours_clocked:   genSeries(36,  6),
  focus_sessions:  genSeries(11,  4),
  points_earned:   genSeries(420, 120),
  active_streak:   genSeries(5,   2),
  commits:         genSeries(18,  8),
  prs_merged:      genSeries(3.5, 2),
  pr_reviews:      genSeries(6,   3),
  code_additions:  genSeries(820, 300),
  issues_closed:   genSeries(7,   3),
  story_points:    genSeries(28,  10),
  deploys:         genSeries(2.2, 1),
  build_success:   genSeries(94,  6),
};

function genHeatmap(): number[][] {
  return Array.from({ length: 26 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const seed = ((w * 7 + d) * 2654435761) >>> 0;
      const base = d >= 5 ? 3 : 10;
      const pct  = (seed % 100) / 100;
      if (pct < 0.12) return 0;
      return Math.round(pct * base);
    }),
  );
}
const HEATMAP_DATA = genHeatmap();

const TF_WEEKS: Record<Timeframe, number> = {
  this_week: 1, this_month: 4, last_3months: 13, last_6months: 26, this_year: 26,
};

const TF_MULTIPLIER: Record<Timeframe, number> = {
  this_week: 1, this_month: 4, last_3months: 13, last_6months: 26, this_year: 52,
};

const WEEK_LABELS = [
  "W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13",
  "W14","W15","W16","W17","W18","W19","W20","W21","W22","W23","W24","W25","W26",
];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const CHART_DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function genDailySeries(base: number, variance: number) {
  return CHART_DAYS.map((label, i) => {
    const seed = ((i * 1234567891) >>> 0) % 100;
    const v = base + (seed / 100 - 0.5) * variance * 2;
    return { label, value: Math.max(0, Math.round(v * 10) / 10) };
  });
}

const DAILY_DATA: Record<MetricId, { label: string; value: number }[]> = {
  tasks_completed: genDailySeries(2.5,  1.5),
  hours_clocked:   genDailySeries(7.2,  2),
  focus_sessions:  genDailySeries(3,    1.5),
  points_earned:   genDailySeries(95,   30),
  active_streak:   genDailySeries(5,    2),
  commits:         genDailySeries(4,    2),
  prs_merged:      genDailySeries(0.8,  0.5),
  pr_reviews:      genDailySeries(1.5,  1),
  code_additions:  genDailySeries(200,  80),
  issues_closed:   genDailySeries(1.5,  1),
  story_points:    genDailySeries(6,    3),
  deploys:         genDailySeries(0.5,  0.3),
  build_success:   genDailySeries(92,   6),
};

function getSeriesForTimeframe(metric: MetricId, tf: Timeframe) {
  if (tf === "this_week") return DAILY_DATA[metric];
  const weeks = TF_WEEKS[tf];
  const raw   = WEEKLY_DATA[metric].slice(-weeks);
  return raw.map((v, i) => ({ label: WEEK_LABELS[i], value: v }));
}

function getCurrentValue(metric: MetricId, tf: Timeframe): number {
  const weeks = TF_WEEKS[tf];
  const slice = WEEKLY_DATA[metric].slice(-weeks);
  const sum   = slice.reduce((a, b) => a + b, 0);
  if (metric === "build_success") return Math.round(slice[slice.length - 1]);
  if (metric === "active_streak" || metric === "hours_clocked") return Math.round(sum * 10) / 10;
  return Math.round(sum);
}

function scaledGoal(weeklyGoal: number, tf: Timeframe): number {
  return Math.round(weeklyGoal * TF_MULTIPLIER[tf]);
}

function heatColor(v: number, max = 10): string {
  if (v === 0) return "bg-muted";
  const pct = Math.min(v / max, 1);
  if (pct < 0.25) return "bg-primary/20";
  if (pct < 0.5)  return "bg-primary/40";
  if (pct < 0.75) return "bg-primary/65";
  return "bg-primary";
}

type GoalStatus = "met" | "close" | "behind" | "none";

function getGoalStatus(current: number, scaled: number | undefined): GoalStatus {
  if (!scaled) return "none";
  if (current >= scaled) return "met";
  if (current >= scaled * 0.75) return "close";
  return "behind";
}

function goalNumberClass(status: GoalStatus): string {
  if (status === "met")   return "text-green-400";
  if (status === "close") return "text-amber-400";
  return "text-foreground";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function IntegrationBadge({ name }: { name: NonNullable<Integration> }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
      <Link2 className="h-2.5 w-2.5" /> {name}
    </span>
  );
}

function ChartTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-medium">{payload[0].value}{unit}</p>
    </div>
  );
}

function GoalEditor({
  current, unit, onSave, onCancel,
}: {
  current?: number; unit: string;
  onSave: (v: number | undefined) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(String(current ?? ""));
  const save = () => {
    const n = parseFloat(draft);
    onSave(isNaN(n) || n <= 0 ? undefined : n);
  };
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
        placeholder="Weekly target"
        autoFocus
        className="w-24 bg-muted border border-primary/50 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none"
      />
      <span className="text-[10px] text-muted-foreground">{unit}/wk</span>
      <button onClick={save} className="h-5 w-5 flex items-center justify-center rounded bg-primary text-primary-foreground">
        <Check className="h-3 w-3" />
      </button>
      <button onClick={onCancel} className="h-5 w-5 flex items-center justify-center rounded bg-muted text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Widget: Snapshot tile ────────────────────────────────────────────────────

function SnapshotWidget({
  metric, tf, goalTarget, onSetGoal, onRemove, size,
}: {
  metric: MetricId; tf: Timeframe;
  goalTarget?: number;
  onSetGoal: (v: number | undefined) => void;
  onRemove: () => void;
  size: 1 | 2 | 4;
}) {
  const def     = METRICS[metric];
  const current = getCurrentValue(metric, tf);
  const scaled  = goalTarget ? scaledGoal(goalTarget, tf) : undefined;
  const status  = getGoalStatus(current, scaled);
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 relative group/snap hover:shadow-md transition-shadow h-full">
      {/* iOS-style remove button — top-left corner */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -left-2 z-30 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover/snap:opacity-100 transition-opacity hover:bg-destructive/80"
        title="Remove widget"
      >
        <X className="h-2.5 w-2.5 stroke-[3]" />
      </button>

      <GripVertical className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover/snap:opacity-30 transition-opacity pointer-events-none" />

      {/* Settings gear — top-right, on hover */}
      {def.supportsTarget && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground/0 group-hover/snap:text-muted-foreground/50 hover:!text-muted-foreground transition-colors z-10"
          title="Edit weekly target"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      )}

      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2.5 pl-3 min-w-0">
        <def.icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: def.color }} />
        <span className="text-xs text-muted-foreground font-medium truncate">{def.label}</span>
        {def.integration && size > 1 && <IntegrationBadge name={def.integration} />}
      </div>

      {/* Primary number + inline target */}
      <div className="flex items-baseline gap-2 pl-3">
        <span className={cn("text-4xl font-black leading-none tabular-nums", goalNumberClass(status))}>
          {current}
        </span>
        {scaled && (
          <span className="text-lg text-muted-foreground font-medium">/ {scaled}</span>
        )}
      </div>

      {/* Context line: unit · timeframe · per-week goal */}
      {!editing ? (
        <p className="text-xs text-muted-foreground/70 mt-1.5 pl-3">
          {def.unit} · {TIMEFRAME_LABELS[tf]}
          {goalTarget ? ` · ${goalTarget}/wk target` : ""}
        </p>
      ) : (
        <div className="pl-3">
          <GoalEditor
            current={goalTarget}
            unit={def.unit}
            onSave={(v) => { onSetGoal(v); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Widget: Line chart ───────────────────────────────────────────────────────

function LineWidget({
  metric, tf, goalTarget, onSetGoal, onRemove, size,
}: {
  metric: MetricId; tf: Timeframe;
  goalTarget?: number;
  onSetGoal: (v: number | undefined) => void;
  onRemove: () => void;
  size: 1 | 2 | 4;
}) {
  const def     = METRICS[metric];
  const data    = getSeriesForTimeframe(metric, tf);
  const current = getCurrentValue(metric, tf);
  const scaled  = goalTarget ? scaledGoal(goalTarget, tf) : undefined;
  const status  = getGoalStatus(current, scaled);
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 relative group/line hover:shadow-md transition-shadow h-full">
      {/* iOS-style remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -left-2 z-30 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover/line:opacity-100 transition-opacity hover:bg-destructive/80"
        title="Remove widget"
      >
        <X className="h-2.5 w-2.5 stroke-[3]" />
      </button>

      <GripVertical className="absolute left-2 top-4 h-4 w-4 text-muted-foreground opacity-0 group-hover/line:opacity-30 transition-opacity pointer-events-none" />

      {def.supportsTarget && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground/0 group-hover/line:text-muted-foreground/50 hover:!text-muted-foreground transition-colors z-10"
          title="Edit weekly target"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pl-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <def.icon className="h-4 w-4" style={{ color: def.color }} />
            <span className="text-sm font-medium text-foreground">{def.label}</span>
            {def.integration && <IntegrationBadge name={def.integration} />}
          </div>
          <p className="text-[11px] text-muted-foreground/60 ml-6">{TIMEFRAME_LABELS[tf]}</p>
        </div>
        <div className="flex items-baseline gap-1.5 mr-16">
          <span className={cn("text-2xl font-black tabular-nums", goalNumberClass(status))}>{current}</span>
          {scaled
            ? <span className="text-sm text-muted-foreground">/ {scaled} {def.unit}</span>
            : <span className="text-sm text-muted-foreground">{def.unit}</span>
          }
        </div>
      </div>

      {editing && (
        <div className="flex items-center gap-1.5 mb-3 pl-5">
          <input
            type="number"
            defaultValue={goalTarget ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseFloat((e.target as HTMLInputElement).value);
                onSetGoal(isNaN(n) || n <= 0 ? undefined : n);
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="Weekly target"
            autoFocus
            className="w-32 bg-muted border border-primary/50 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none"
          />
          <span className="text-[10px] text-muted-foreground">{def.unit}/wk</span>
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      )}

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={def.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={def.color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#636d83" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#636d83" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip unit={` ${def.unit}`} />} />
            {goalTarget && (
              <ReferenceLine
                y={goalTarget}
                stroke={def.color}
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{ value: `${goalTarget}/wk`, fill: def.color, fontSize: 10, position: "insideTopRight" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={def.color}
              strokeWidth={2}
              fill={`url(#grad-${metric})`}
              dot={false}
              activeDot={{ r: 3, fill: def.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Widget: Heatmap (full-width fill) ───────────────────────────────────────

function HeatmapWidget({ metric, onRemove, size }: { metric: MetricId; onRemove: () => void; size: 1 | 2 | 4 }) {
  const def = METRICS[metric];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden p-4 relative group/heat hover:shadow-md transition-shadow h-full">
      {/* iOS-style remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -left-2 z-30 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover/heat:opacity-100 transition-opacity hover:bg-destructive/80"
        title="Remove widget"
      >
        <X className="h-2.5 w-2.5 stroke-[3]" />
      </button>

      <GripVertical className="absolute left-2 top-3 h-4 w-4 text-muted-foreground opacity-0 group-hover/heat:opacity-30 transition-opacity pointer-events-none" />

      <div className="flex items-center gap-1.5 mb-2 pl-5">
        <def.icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: def.color }} />
        <span className="text-xs font-medium text-muted-foreground">{def.label}</span>
        <span className="text-[10px] text-muted-foreground/50">— last 6 months</span>
      </div>

      {/* Grid */}
      <div className="flex gap-[2px]">
        {/* Day-of-week labels */}
        <div className="flex flex-col justify-around w-5 flex-shrink-0 mr-1">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="text-[8px] text-muted-foreground/50 leading-none">{d}</span>
          ))}
        </div>
        {/* Week columns */}
        <div className="flex-1 flex gap-[2px]">
          {HEATMAP_DATA.map((week, wi) => (
            <div key={wi} className="flex-1 flex flex-col gap-[2px]">
              {week.map((val, di) => (
                <div
                  key={di}
                  title={`${val} ${def.unit}`}
                  className={cn("w-full rounded-[2px]", heatColor(val))}
                  style={{ aspectRatio: "1 / 1" }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend — uses same Tailwind classes as heatColor() */}
      <div className="flex items-center gap-1.5 mt-2 justify-end flex-shrink-0">
        <span className="text-[9px] text-muted-foreground/50">Less</span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-muted ring-1 ring-border/40" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/20" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/40" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/65" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
        <span className="text-[9px] text-muted-foreground/50">More</span>
      </div>
    </div>
  );
}

// ─── Widget catalog modal — with live preview ─────────────────────────────────

const CATEGORIES = ["Productivity", "Code", "Project", "Deployment"] as const;

const INTEGRATION_COLORS: Record<NonNullable<Integration>, string> = {
  "GitHub":         "bg-neutral-700 text-white",
  "GitHub Actions": "bg-neutral-700 text-white",
  "Jira":           "bg-blue-600 text-white",
  "Linear":         "bg-violet-600 text-white",
};

const DISPLAY_OPTIONS: { id: WidgetDisplay; label: string; desc: string }[] = [
  { id: "snapshot", label: "Snapshot", desc: "Big number at a glance"   },
  { id: "line",     label: "Trend",    desc: "Smooth chart over time"   },
  { id: "heatmap",  label: "Heatmap",  desc: "GitHub-style activity grid" },
];


function WidgetCatalogModal({
  activeMetrics,
  onAdd,
  onClose,
}: {
  activeMetrics: Set<MetricId>;
  onAdd: (metric: MetricId, display: WidgetDisplay, target?: number) => void;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [selectedMetric,  setSelectedMetric]  = useState<MetricId | null>(null);
  const [selectedDisplay, setSelectedDisplay] = useState<WidgetDisplay | null>(null);
  const [targetDraft, setTargetDraft] = useState("");
  const [showTarget,  setShowTarget]  = useState(false);

  const metric     = selectedMetric ? METRICS[selectedMetric] : null;
  const MetricIcon = metric?.icon ?? null;
  const step       = selectedMetric ? "configure" : "pick_metric";

  const metricsInCategory = Object.values(METRICS).filter((m) => m.category === activeCategory);

  const handleAdd = () => {
    if (!selectedMetric || !selectedDisplay) return;
    const n = parseFloat(targetDraft);
    onAdd(selectedMetric, selectedDisplay, !isNaN(n) && n > 0 ? n : undefined);
  };

  const goBack = () => {
    setSelectedMetric(null);
    setSelectedDisplay(null);
    setTargetDraft("");
    setShowTarget(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-xl w-[580px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === "configure" && (
              <button onClick={goBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {step === "pick_metric" ? "Add widget" : `Configure: ${metric?.label}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "pick_metric" ? (
          <div className="flex flex-1 min-h-0">
            {/* Category sidebar */}
            <div className="w-36 border-r border-border flex-shrink-0 py-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    activeCategory === cat
                      ? "text-foreground bg-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Metrics list */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {metricsInCategory.map((m) => {
                const added = activeMetrics.has(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={added}
                    onClick={() => { setSelectedMetric(m.id); setSelectedDisplay(null); setTargetDraft(""); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      added ? "opacity-40 cursor-not-allowed" : "hover:bg-muted",
                    )}
                  >
                    <m.icon className="h-4 w-4 flex-shrink-0" style={{ color: m.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground">{m.unit}</p>
                    </div>
                    {m.integration && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0", INTEGRATION_COLORS[m.integration])}>
                        {m.integration}
                      </span>
                    )}
                    {added && <span className="text-[10px] text-muted-foreground flex-shrink-0">added</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Selected metric header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {MetricIcon && <MetricIcon className="h-4 w-4" style={{ color: metric?.color }} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{metric?.label}</p>
                <p className="text-[11px] text-muted-foreground">{metric?.unit}{metric?.integration ? ` · ${metric.integration}` : ""}</p>
              </div>
            </div>

            {/* Display type — large clean buttons */}
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Display as</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(metric?.displays ?? []).map((d) => {
                const opt = DISPLAY_OPTIONS.find((o) => o.id === d)!;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDisplay(d)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl border-2 transition-all",
                      selectedDisplay === d
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/40",
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-full h-12 flex items-center justify-center overflow-hidden px-2">
                      {d === "snapshot" && (
                        <span className="text-3xl font-black text-foreground/70 tabular-nums leading-none">42</span>
                      )}
                      {d === "line" && (
                        <svg viewBox="0 0 60 28" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="thumb-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M2,22 L8,18 L14,20 L20,12 L26,14 L32,8 L38,10 L44,5 L50,8 L58,4"
                            stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2,22 L8,18 L14,20 L20,12 L26,14 L32,8 L38,10 L44,5 L50,8 L58,4 L58,28 L2,28 Z"
                            fill="url(#thumb-grad)" />
                        </svg>
                      )}
                      {d === "heatmap" && (
                        <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "repeat(4, 1fr)", width: "100%", height: "100%" }}>
                          {Array.from({ length: 40 }, (_, i) => {
                            const v = ((i * 2654435761) >>> 0) % 5;
                            const cols = ["hsl(var(--muted-foreground)/0.12)","hsl(var(--primary)/0.2)","hsl(var(--primary)/0.45)","hsl(var(--primary)/0.7)","hsl(var(--primary))"];
                            return <div key={i} className="rounded-[1px]" style={{ background: cols[v] }} />;
                          })}
                        </div>
                      )}
                    </div>
                    <p className={cn("text-sm font-semibold", selectedDisplay === d ? "text-primary" : "text-foreground/80")}>{opt.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Optional weekly target — collapsible, only once display is chosen */}
            {selectedDisplay && selectedDisplay !== "heatmap" && metric?.supportsTarget && (
              <div className="border-t border-border pt-4">
                {!showTarget ? (
                  <button
                    onClick={() => setShowTarget(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Set a weekly goal <span className="text-xs text-muted-foreground/50">— optional</span>
                  </button>
                ) : (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Weekly goal</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={targetDraft}
                        onChange={(e) => setTargetDraft(e.target.value)}
                        placeholder="e.g. 10"
                        autoFocus
                        className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      />
                      <span className="text-sm text-muted-foreground">{metric?.unit} / week</span>
                      <button onClick={() => { setShowTarget(false); setTargetDraft(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 mt-1.5">Scales automatically across timeframes.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer — step 2 only */}
        {step === "configure" && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              disabled={!selectedDisplay}
              onClick={handleAdd}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedDisplay
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              <Plus className="h-4 w-4" /> Add to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty dashboard state ────────────────────────────────────────────────────

function EmptyDashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BarChart2 className="h-10 w-10 text-muted-foreground/20 mb-4" />
      <h3 className="text-sm font-semibold text-foreground mb-1">Your dashboard is empty</h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-[260px]">
        Add widgets to start tracking the metrics that matter most to you.
      </p>
      <button
        onClick={onOpen}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add your first widget
      </button>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function PersonalStatsSection({ timeframe }: { timeframe: Timeframe }) {
  const [widgets, setWidgets]   = useState<Widget[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [dragId, setDragId]     = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const gridRef       = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const activeMetrics = new Set(widgets.map((w) => w.metric));

  const addWidget = useCallback((metric: MetricId, display: WidgetDisplay, target?: number) => {
    const defaultSize: 1 | 2 | 4 = display === "line" ? 4 : display === "heatmap" ? 2 : 1;
    setWidgets((prev) => [...prev, { id: `w${Date.now()}`, metric, display, goalTarget: target, size: defaultSize }]);
    setShowCatalog(false);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const setGoal = useCallback((id: string, target: number | undefined) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, goalTarget: target } : w));
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>, id: string, currentSize: 1 | 2 | 4, display: WidgetDisplay) => {
    e.preventDefault();
    e.stopPropagation();
    // Capture pointer so move/up events fire even when pointer leaves the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isResizingRef.current = true;
    const startX  = e.clientX;
    const minSize: 1 | 2 | 4 = display === "heatmap" ? 2 : 1;

    const onPointerMove = (pe: PointerEvent) => {
      if (!gridRef.current) return;
      const containerWidth = gridRef.current.getBoundingClientRect().width;
      // 3 gaps × gap-4 (16px) = 48px
      const colWidth = (containerWidth - 48) / 4;
      const delta = pe.clientX - startX;
      const targetCols = currentSize + delta / colWidth;

      let newSize: 1 | 2 | 4;
      if (targetCols >= 3)   newSize = 4;
      else if (targetCols >= 1.5) newSize = 2;
      else                   newSize = 1;

      const clamped = Math.max(minSize, newSize) as 1 | 2 | 4;
      setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size: clamped } : w));
    };

    const onPointerUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
    };

    document.body.style.cursor = "ew-resize";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }, []);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    setWidgets((prev) => {
      const arr  = [...prev];
      const from = arr.findIndex((w) => w.id === dragId);
      const to   = arr.findIndex((w) => w.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div>
      {widgets.length === 0 ? (
        <EmptyDashboard onOpen={() => setShowCatalog(true)} />
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-4 gap-4 mb-4">
            {widgets.map((w) => {
              const isDragging = dragId === w.id;
              const isTarget   = dragOverId === w.id && dragId !== w.id;
              return (
                <div
                  key={w.id}
                  draggable
                  onDragStart={(e) => {
                    // Block HTML5 drag when a resize is in progress
                    if (isResizingRef.current) { e.preventDefault(); return; }
                    setDragId(w.id);
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(w.id); }}
                  onDrop={() => handleDrop(w.id)}
                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  className={cn(
                    w.size === 1 ? "col-span-1" : w.size === 2 ? "col-span-2" : "col-span-4",
                    "relative group/card transition-all cursor-grab active:cursor-grabbing",
                    isDragging && "opacity-40",
                    isTarget   && "ring-2 ring-primary/50 rounded-xl",
                  )}
                >
                  {/* ── Resize handle — Apple-style, half on / half off ── */}
                  <div
                    className="absolute z-20 cursor-se-resize opacity-0 group-hover/card:opacity-100 transition-opacity"
                    style={{ bottom: '-5px', right: '-5px' }}
                    onPointerDown={(e) => handleResizeStart(e, w.id, w.size, w.display)}
                  >
                    {/*
                      Arms run along the card's right and bottom edges (half inside,
                      half outside). Corner arc sits right at the card's rounded corner.
                      SVG (31,31) = card's bottom-right corner point.
                    */}
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <path
                        d="M 31,13 L 31,18 C 31,25 25,31 18,31 L 13,31"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        className="text-foreground/40"
                      />
                    </svg>
                  </div>
                  {w.display === "snapshot" && (
                    <SnapshotWidget
                      metric={w.metric} tf={timeframe}
                      goalTarget={w.goalTarget}
                      onSetGoal={(v) => setGoal(w.id, v)}
                      onRemove={() => removeWidget(w.id)}
                      size={w.size}
                    />
                  )}
                  {w.display === "line" && (
                    <LineWidget
                      metric={w.metric} tf={timeframe}
                      goalTarget={w.goalTarget}
                      onSetGoal={(v) => setGoal(w.id, v)}
                      onRemove={() => removeWidget(w.id)}
                      size={w.size}
                    />
                  )}
                  {w.display === "heatmap" && (
                    <HeatmapWidget
                      metric={w.metric}
                      onRemove={() => removeWidget(w.id)}
                      size={w.size}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowCatalog(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> Add widget
          </button>
        </>
      )}

      {showCatalog && (
        <WidgetCatalogModal
          activeMetrics={activeMetrics}
          onAdd={addWidget}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
