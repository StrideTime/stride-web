import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area,
} from "recharts";
import {
  Clock, CheckCircle2, TrendingUp, TrendingDown, Zap, Flame,
  ChevronDown, FolderOpen, Calendar, Target, ArrowRight, BarChart2,
} from "lucide-react";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = "this_week" | "last_week" | "this_month" | "last_3_months";

const RANGE_LABELS: Record<Range, string> = {
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_3_months: "Last 3 months",
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const DAILY_HOURS_WEEK = [
  { day: "Mon", hours: 6.5, target: 8 },
  { day: "Tue", hours: 7.8, target: 8 },
  { day: "Wed", hours: 8.2, target: 8 },
  { day: "Thu", hours: 7.1, target: 8 },
  { day: "Fri", hours: 4.0, target: 8 },
  { day: "Sat", hours: 0,   target: 8 },
  { day: "Sun", hours: 0,   target: 8 },
];

const TASKS_BY_WEEK = [
  { week: "Feb 3",  completed: 9,  added: 11 },
  { week: "Feb 10", completed: 11, added: 8  },
  { week: "Feb 17", completed: 8,  added: 13 },
  { week: "Feb 24", completed: 13, added: 10 },
  { week: "Mar 3",  completed: 10, added: 9  },
  { week: "Mar 10", completed: 14, added: 12 },
  { week: "Mar 17", completed: 12, added: 11 },
  { week: "Mar 22", completed: 4,  added: 3  },
];

const PROJECT_TIME = [
  { name: "Stride v2.0",      hours: 18.5, color: "#61afef" },
  { name: "Website Redesign", hours: 9.2,  color: "#c678dd" },
  { name: "API Platform v3",  hours: 5.0,  color: "#98c379" },
  { name: "Side Project",     hours: 3.8,  color: "#e5c07b" },
  { name: "Other",            hours: 1.4,  color: "#5c6370" },
];

const ESTIMATE_VS_ACTUAL = [
  { label: "Review PRs",            est: 30,  actual: 22  },
  { label: "Fix nav bug",           est: 60,  actual: 71  },
  { label: "Standup notes",         est: 15,  actual: 12  },
  { label: "API docs",              est: 45,  actual: 38  },
  { label: "Dashboard redesign",    est: 120, actual: 145 },
  { label: "DB migration",          est: 90,  actual: 78  },
];

const TAG_BREAKDOWN = [
  { tag: "Frontend",   hours: 14.2, color: "#61afef" },
  { tag: "Backend",    hours: 8.5,  color: "#98c379" },
  { tag: "Design",     hours: 6.1,  color: "#c678dd" },
  { tag: "DevOps",     hours: 3.2,  color: "#e5c07b" },
  { tag: "Bug Fix",    hours: 2.8,  color: "#e06c75" },
  { tag: "Docs",       hours: 1.4,  color: "#abb2bf" },
];

const STREAK_CALENDAR = [
  { week: "Feb 24", days: [true, true, false, true, true] },
  { week: "Mar 3",  days: [true, true, true,  true, true] },
  { week: "Mar 10", days: [true, true, true,  true, false] },
  { week: "Mar 17", days: [true, true, true,  true, true] },
];

const FOCUS_BY_DAY = [
  { day: "Mon", sessions: 2, avgMins: 52 },
  { day: "Tue", sessions: 3, avgMins: 67 },
  { day: "Wed", sessions: 2, avgMins: 44 },
  { day: "Thu", sessions: 2, avgMins: 71 },
  { day: "Fri", sessions: 1, avgMins: 35 },
];

const GOALS_SUMMARY = [
  { title: "Ship Stride v2.0",     progress: 65, color: "#61afef", dueLabel: "Apr 30" },
  { title: "Run 100km in March",   progress: 43, color: "#98c379", dueLabel: "Mar 31", atRisk: true },
  { title: "Read 12 books / year", progress: 33, color: "#e5c07b", dueLabel: "Dec 31" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
          <span className="text-muted-foreground">{p.name ?? p.dataKey}:</span>
          <span className="text-foreground font-medium">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, trend, trendLabel }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  color: string; trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trendLabel && (
        <div className={cn("flex items-center gap-1 text-xs flex-shrink-0 mt-0.5",
          trend === "up" ? "text-chart-2" : trend === "down" ? "text-chart-5" : "text-muted-foreground")}>
          {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

function Section({ title, description, children, action }: {
  title: string; description?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Streak calendar ──────────────────────────────────────────────────────────

function StreakCalendar() {
  const DAY_LABELS = ["M", "T", "W", "T", "F"];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
        ))}
      </div>
      <div className="space-y-1">
        {STREAK_CALENDAR.map((row) => (
          <div key={row.week} className="flex items-center gap-1">
            <div className="flex gap-1 flex-1">
              {row.days.map((active, i) => (
                <div key={i} className="flex-1 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: active ? "#98c37920" : "var(--muted)" }}>
                  {active && <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "#98c379" }} />}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground w-12 text-right">{row.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Estimate accuracy ────────────────────────────────────────────────────────

function EstimateBar({ label, est, actual }: { label: string; est: number; actual: number }) {
  const max = Math.max(est, actual, 1);
  const diff = actual - est;
  const over = diff > 0;
  const pct = Math.round(Math.abs(diff) / est * 100);

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-muted-foreground truncate w-32 flex-shrink-0">{label}</p>
      <div className="flex-1 flex flex-col gap-0.5">
        {/* Estimate bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(est / max) * 100}%`, backgroundColor: "#abb2bf" }} />
        </div>
        {/* Actual bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(actual / max) * 100}%`, backgroundColor: over ? "#e06c75" : "#98c379" }} />
        </div>
      </div>
      <div className="flex-shrink-0 w-20 text-right">
        <span className={cn("text-[11px] font-medium", over ? "text-chart-5" : "text-chart-2")}>
          {over ? `+${pct}%` : pct === 0 ? "on target" : `-${pct}%`}
        </span>
        <p className="text-[10px] text-muted-foreground">{est}m → {actual}m</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReportsPage({ embedded }: { embedded?: boolean } = {}) {
  const [range, setRange] = useState<Range>("this_week");
  const totalHours = DAILY_HOURS_WEEK.reduce((s, d) => s + d.hours, 0);
  const totalProjectHours = PROJECT_TIME.reduce((s, p) => s + p.hours, 0);
  const totalTagHours = TAG_BREAKDOWN.reduce((s, t) => s + t.hours, 0);

  const currentStreak = 7; // consecutive days
  const bestStreak = 14;

  const content = (
    <>
      {/* Range selector */}
      <div className="flex items-center justify-end mb-5">
        <div className="relative">
          <select value={range} onChange={(e) => setRange(e.target.value as Range)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <option key={r} value={r}>{RANGE_LABELS[r]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Clock className="h-4 w-4" />}        label="Hours logged"    value={`${totalHours.toFixed(1)}h`} sub="Mon–Fri"       color="#61afef" trend="up"      trendLabel="+2.3h vs last wk" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Tasks completed" value="12"                          sub="of 19 started" color="#98c379" trend="down"    trendLabel="-2 vs last wk" />
        <StatCard icon={<Zap className="h-4 w-4" />}          label="Focus sessions"  value="10"                          sub="avg 54 min"    color="#c678dd" trend="up"      trendLabel="+1 session" />
        <StatCard icon={<Target className="h-4 w-4" />}       label="Completion rate" value="73%"                         sub="tasks finished" color="#e5c07b" trend="neutral" trendLabel="same as last wk" />
      </div>

      {/* ── Streak section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 mb-5">
        <Section title="Hours logged" description="Time tracked per day against your 8h daily target.">
          <div className="p-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_HOURS_WEEK} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip content={<ChartTooltip unit="h" />} cursor={{ fill: "var(--muted)", opacity: 0.5, radius: 4 }} />
                <Bar dataKey="hours" name="Logged" radius={[4, 4, 0, 0]}>
                  {DAILY_HOURS_WEEK.map((entry, i) => (
                    <Cell key={i} fill={entry.hours >= entry.target ? "#61afef" : entry.hours > 0 ? "#61afef80" : "#61afef18"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#61afef]" /> At or above target</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#61afef80]" /> Below target</div>
            <div className="ml-auto font-medium text-foreground">Target: 8h / day</div>
          </div>
        </Section>

        {/* Streak panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-0">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Flame className="h-4 w-4" style={{ color: "#e5c07b" }} />
            <h2 className="text-sm font-semibold text-foreground">Logging streak</h2>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-center flex-1">
                <p className="text-2xl font-semibold text-foreground">{currentStreak}</p>
                <p className="text-[11px] text-muted-foreground">current days</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center flex-1">
                <p className="text-2xl font-semibold text-foreground">{bestStreak}</p>
                <p className="text-[11px] text-muted-foreground">personal best</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Days with ≥ 30 min of tracked time</p>
            <StreakCalendar />
          </div>
        </div>
      </div>

      {/* ── Task velocity + Project time ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-5">
        <Section title="Task velocity" description="Tasks completed vs. added each week (last 8 weeks).">
          <div className="p-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TASKS_BY_WEEK} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="added"     name="Added"     stroke="#abb2bf" fill="#abb2bf18" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#98c379" fill="#98c37918" strokeWidth={2}   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2 w-5 rounded-sm" style={{ backgroundColor: "#98c37990" }} /> Completed</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-5 rounded-sm" style={{ backgroundColor: "#abb2bf60" }} /> Added</div>
          </div>
        </Section>

        <Section title="Time by project">
          <div className="p-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-[120px] w-[120px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PROJECT_TIME} dataKey="hours" cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={2}>
                      {PROJECT_TIME.map((p, i) => <Cell key={i} fill={p.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip unit="h" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-semibold text-foreground">{totalProjectHours.toFixed(0)}h</span>
                  <span className="text-[10px] text-muted-foreground">total</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {PROJECT_TIME.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-foreground flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{p.hours}h</span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 w-8 text-right">
                    {Math.round((p.hours / totalProjectHours) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ── Estimate accuracy ── */}
      <Section title="Estimate accuracy" description="How close your time estimates were to actual time spent this week.">
        <div className="p-5 space-y-3.5">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-xs text-muted-foreground w-32 flex-shrink-0"></p>
            <div className="flex-1 flex gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="h-1.5 w-4 rounded-full bg-[#abb2bf]" /> Estimated</div>
              <div className="flex items-center gap-1"><div className="h-1.5 w-4 rounded-full bg-[#98c379]" /> Actual (under)</div>
              <div className="flex items-center gap-1"><div className="h-1.5 w-4 rounded-full bg-[#e06c75]" /> Actual (over)</div>
            </div>
          </div>
          {ESTIMATE_VS_ACTUAL.map((item) => (
            <EstimateBar key={item.label} {...item} />
          ))}
        </div>
        <div className="px-5 pb-4 flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Overall accuracy:</span>
          <span className="font-semibold text-foreground">82%</span>
          <span className="text-muted-foreground">· avg overrun</span>
          <span className="font-semibold text-chart-5">+14 min / task</span>
        </div>
      </Section>

      {/* ── Focus sessions + Tag breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        <Section title="Focus sessions" description="Sessions and average duration by day.">
          <div className="p-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FOCUS_BY_DAY} barGap={4} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5, radius: 4 }} />
                <Bar dataKey="sessions" name="Sessions" fill="#c678dd"   radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="avgMins"  name="Avg min"  fill="#c678dd30" radius={[3, 3, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#c678dd]" /> Sessions</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#c678dd40]" /> Avg duration (min)</div>
          </div>
        </Section>

        {/* Time by tag */}
        <Section title="Time by tag" description="Breakdown of tracked hours across your labels.">
          <div className="p-5 space-y-3">
            {TAG_BREAKDOWN.map((t) => (
              <div key={t.tag} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-18 flex-shrink-0 truncate">{t.tag}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(t.hours / totalTagHours) * 100}%`, backgroundColor: t.color }} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-foreground w-8 text-right">{t.hours}h</span>
                  <span className="text-[11px] text-muted-foreground w-7 text-right">{Math.round(t.hours / totalTagHours * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Goals snapshot ── */}
      <Section title="Goals snapshot" description="Active goals and their progress this period."
        action={
          <button className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
            All goals <ArrowRight className="h-3 w-3" />
          </button>
        }>
        <div className="divide-y divide-border">
          {GOALS_SUMMARY.map((g) => (
            <div key={g.title} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <p className="text-sm text-foreground flex-1 min-w-0 truncate">{g.title}</p>
              <div className="flex items-center gap-3 flex-shrink-0">
                {g.atRisk && (
                  <span className="text-[11px] text-chart-5 bg-chart-5/10 px-1.5 py-0.5 rounded-full">At risk</span>
                )}
                <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: g.color }}>{g.progress}%</span>
                <span className="text-xs text-muted-foreground w-12 text-right">{g.dueLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );

  if (embedded) return <div className="space-y-5">{content}</div>;

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground mb-1">Stats</h1>
        <p className="text-sm text-muted-foreground">Your productivity snapshot — tracked time, task velocity, and focus patterns.</p>
      </div>
      {content}
    </div>
  );
}
