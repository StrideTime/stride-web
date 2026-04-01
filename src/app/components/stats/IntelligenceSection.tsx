import { useState, type ComponentType } from "react";
import {
  Star, AlertTriangle, Sparkles, X, ChevronRight,
  Clock, Lightbulb, CheckCircle2,
  CheckCheck, Flame, BrainCircuit, Bug, GitPullRequest,
  Zap, GitPullRequestArrow, CalendarCheck, Crosshair, Trophy,
} from "lucide-react";
import { cn } from "../ui/utils";
import {
  WEEKLY_NARRATIVE, ML_INSIGHTS, ACHIEVEMENTS, PEAK_HOUR_DATA, HOUR_LABELS,
  DAY_LABELS_FULL, COMING_WEEK,
  type MLInsight, type InsightType, type Achievement,
} from "../../data/mockIntelligence";

// ─── Icon Maps ────────────────────────────────────────────────────────────────

type Icon = ComponentType<{ className?: string; style?: React.CSSProperties }>;

const ACHIEVEMENT_ICON: Record<string, Icon> = {
  CheckCheck, Flame, BrainCircuit, Bug, GitPullRequest,
  Zap, GitPullRequestArrow, CalendarCheck, Crosshair, Trophy,
};

const INSIGHT_ICON: Record<InsightType, Icon> = {
  pattern:     Clock,
  achievement: Star,
  warning:     AlertTriangle,
  suggestion:  Lightbulb,
};

// ─── Reusable Banner ─────────────────────────────────────────────────────────

type BannerVariant = "celebration" | "success" | "warning" | "info";

const BANNER_STYLES: Record<BannerVariant, { bg: string; icon: string }> = {
  celebration: { bg: "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent border-primary/25", icon: "text-primary" },
  success:     { bg: "bg-green-500/10 border-green-500/25",  icon: "text-green-400"  },
  warning:     { bg: "bg-yellow-500/10 border-yellow-500/25", icon: "text-yellow-400" },
  info:        { bg: "bg-blue-500/10  border-blue-500/25",   icon: "text-blue-400"   },
};

const BANNER_ICON: Record<BannerVariant, ComponentType<{ className?: string }>> = {
  celebration: Flame,
  success:     CheckCircle2,
  warning:     AlertTriangle,
  info:        Lightbulb,
};

export function StatusBanner({ variant, message }: { variant: BannerVariant; message: string }) {
  const { bg, icon } = BANNER_STYLES[variant];
  const Icon = BANNER_ICON[variant];
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", bg)}>
      <Icon className={cn("h-4 w-4 flex-shrink-0", icon)} />
      <p className="text-sm font-medium text-foreground leading-snug">{message}</p>
    </div>
  );
}

// ─── Personal KPI Stat ────────────────────────────────────────────────────────

function BigStat({ value, label, sublabel, accent, onClick }: {
  value: string | number; label: string; sublabel?: string; accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 bg-card border border-border rounded-xl px-4 py-4 text-center",
        onClick && "hover:shadow-md hover:border-border/60 transition-all cursor-pointer",
      )}
    >
      <div className={cn("text-3xl font-black tabular-nums", accent ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      <div className="text-xs font-semibold text-foreground mt-1">{label}</div>
      {sublabel && <div className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</div>}
    </button>
  );
}

// ─── KPI Detail Drawer ────────────────────────────────────────────────────────

type KpiKey = "hours" | "tasks" | "focus" | "streak";

function PersonalKpiDrawer({ kpi, onClose }: { kpi: KpiKey | null; onClose: () => void }) {
  if (!kpi) return null;
  const n = WEEKLY_NARRATIVE;

  const titles: Record<KpiKey, string> = {
    hours: "Hours Logged",
    tasks: "Tasks Done",
    focus: "Avg Focus Session",
    streak: "Day Streak",
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{titles[kpi]}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {kpi === "hours" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">{n.metrics.hoursLogged}h</div>
                  <div className="text-[10px] text-muted-foreground">this week</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">36.1h</div>
                  <div className="text-[10px] text-muted-foreground">last week</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-green-400">+7%</div>
                  <div className="text-[10px] text-muted-foreground">vs 4-wk avg</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">This week by day</p>
                <div className="space-y-2">
                  {[
                    { day: "Mon", hours: 7.5 },
                    { day: "Tue", hours: 9.0 },
                    { day: "Wed", hours: 8.0 },
                    { day: "Thu", hours: 7.5 },
                    { day: "Fri", hours: 6.5 },
                  ].map(({ day, hours }) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-6">{day}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${(hours / 10) * 100}%`, backgroundColor: "#61afef", opacity: 0.7 }} />
                      </div>
                      <span className="text-xs text-foreground tabular-nums w-10 text-right">{hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {kpi === "tasks" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">{n.metrics.tasksCompleted}</div>
                  <div className="text-[10px] text-muted-foreground">this week</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">9</div>
                  <div className="text-[10px] text-muted-foreground">last week</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-green-400">+55%</div>
                  <div className="text-[10px] text-muted-foreground">wow</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">By type</p>
                <div className="space-y-2">
                  {[
                    { type: "Bug fix", count: 5, color: "#e06c75" },
                    { type: "Feature", count: 4, color: "#61afef" },
                    { type: "Chore",   count: 3, color: "#98c379" },
                    { type: "Review",  count: 2, color: "#c678dd" },
                  ].map(({ type, count, color }) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-14">{type}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${(count / 5) * 100}%`, backgroundColor: color, opacity: 0.7 }} />
                      </div>
                      <span className="text-xs text-foreground tabular-nums w-3 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {kpi === "focus" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">{n.metrics.avgSessionMins}m</div>
                  <div className="text-[10px] text-muted-foreground">avg length</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">{n.metrics.focusSessions}</div>
                  <div className="text-[10px] text-muted-foreground">sessions</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-green-400">+28%</div>
                  <div className="text-[10px] text-muted-foreground">vs avg</div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Session breakdown</p>
                <div className="space-y-2">
                  {[
                    { range: "< 15 min", count: 1, color: "#e06c75" },
                    { range: "15–30 m",  count: 2, color: "#e5c07b" },
                    { range: "30–60 m",  count: 5, color: "#61afef" },
                    { range: "> 60 min", count: 3, color: "#98c379" },
                  ].map(({ range, count, color }) => (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-16">{range}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${(count / 5) * 100}%`, backgroundColor: color, opacity: 0.7 }} />
                      </div>
                      <span className="text-xs text-foreground tabular-nums w-3 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {kpi === "streak" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-primary">{n.metrics.streakDays}</div>
                  <div className="text-[10px] text-muted-foreground">current</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">22</div>
                  <div className="text-[10px] text-muted-foreground">all-time best</div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-2xl font-black text-foreground">12</div>
                  <div className="text-[10px] text-muted-foreground">prev best</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've hit your morning routine 100% this week without missing a weekday. At 18 days, this is your second-longest streak — just 4 more to beat your record.
              </p>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Last 28 days</p>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} className={cn("w-6 h-6 rounded-sm", i >= 10 ? "bg-primary/80" : "bg-muted")} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ achievement, onClick }: { achievement: Achievement; onClick: () => void }) {
  const locked = !achievement.unlockedAt;
  const Icon = ACHIEVEMENT_ICON[achievement.icon] ?? Star;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-24 bg-card border border-border rounded-xl p-3 text-left hover:shadow-md transition-all",
        locked && "opacity-40",
      )}
    >
      <Icon className="h-5 w-5 mb-2.5" style={{ color: locked ? undefined : achievement.color }} />
      <div
        className="text-xl font-black tabular-nums leading-none"
        style={{ color: locked ? undefined : achievement.color }}
      >
        {achievement.metric.value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{achievement.metric.label}</div>
    </button>
  );
}

// ─── Achievement Detail Drawer ────────────────────────────────────────────────

function AchievementDrawer({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
  if (!achievement) return null;
  const locked = !achievement.unlockedAt;
  const Icon = ACHIEVEMENT_ICON[achievement.icon] ?? Star;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: locked ? undefined : `${achievement.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: locked ? undefined : achievement.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                  locked ? "bg-muted text-muted-foreground" : "bg-green-400/15 text-green-400",
                )}>
                  {locked ? "In progress" : `Earned ${achievement.unlockedAt}`}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-muted/50 rounded-lg px-4 py-4 text-center">
            <div
              className="text-4xl font-black tabular-nums"
              style={{ color: locked ? undefined : achievement.color }}
            >
              {achievement.metric.value}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{achievement.metric.label}</div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{achievement.description}</p>
        </div>
      </div>
    </>
  );
}

// ─── All Insights Drawer ──────────────────────────────────────────────────────

function InsightsAllDrawer({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (i: MLInsight) => void }) {
  if (!open) return null;
  const insights = ML_INSIGHTS.filter((i) => i.type !== "achievement");

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Insights</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-medium">AI-powered</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {insights.map((ins) => {
              const Icon = INSIGHT_ICON[ins.type];
              return (
                <button
                  key={ins.id}
                  onClick={() => { onClose(); onSelect(ins); }}
                  className="bg-muted/40 border border-border/50 rounded-xl p-3.5 flex flex-col gap-3 text-left hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ins.color}18` }}>
                      <Icon className="h-5 w-5" style={{ color: ins.color }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 capitalize bg-muted px-1.5 py-0.5 rounded">{ins.type}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-snug">{ins.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{ins.metric.value} {ins.metric.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── All Achievements Drawer ──────────────────────────────────────────────────

function AchievementsAllDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlockedAt);
  const locked   = ACHIEVEMENTS.filter((a) => !a.unlockedAt);

  function GalleryCard({ a }: { a: Achievement }) {
    const Icon = ACHIEVEMENT_ICON[a.icon] ?? Star;
    const isLocked = !a.unlockedAt;
    return (
      <div className={cn("bg-muted/40 border border-border/50 rounded-xl p-3.5 flex flex-col gap-3", isLocked && "opacity-45")}>
        <div className="flex items-start justify-between">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isLocked ? "transparent" : `${a.color}18` }}
          >
            <Icon className="h-5 w-5" style={{ color: isLocked ? undefined : a.color }} />
          </div>
          {!isLocked ? (
            <span className="text-[9px] text-green-400 font-semibold">{a.unlockedAt}</span>
          ) : (
            <span className="text-[9px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded font-medium">In progress</span>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground leading-snug">{a.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
            {String(a.metric.value)} {a.metric.label}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Achievements</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400/80 font-medium">
                {unlocked.length}/{ACHIEVEMENTS.length} earned
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Earned</p>
            <div className="grid grid-cols-2 gap-2.5">
              {unlocked.map((a) => <GalleryCard key={a.id} a={a} />)}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">In Progress</p>
            <div className="grid grid-cols-2 gap-2.5">
              {locked.map((a) => <GalleryCard key={a.id} a={a} />)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight, onClick }: { insight: MLInsight; onClick: () => void }) {
  const Icon = INSIGHT_ICON[insight.type];
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-24 bg-card border border-border rounded-xl p-3 text-left hover:shadow-md transition-all"
    >
      <Icon className="h-5 w-5 mb-2.5" style={{ color: insight.color }} />
      <div className="text-xl font-black tabular-nums leading-none" style={{ color: insight.color }}>
        {insight.metric.value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{insight.metric.label}</div>
    </button>
  );
}

// ─── Insight Detail Drawer ────────────────────────────────────────────────────

function InsightDrawer({ insight, onClose }: { insight: MLInsight | null; onClose: () => void }) {
  if (!insight) return null;
  const Icon = INSIGHT_ICON[insight.type];
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${insight.color}20` }}>
                <Icon className="h-5 w-5" style={{ color: insight.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{insight.title}</h3>
                <span className="text-[10px] text-muted-foreground capitalize">{insight.type}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-muted/50 rounded-lg px-4 py-4 text-center">
            <div className="text-4xl font-black tabular-nums" style={{ color: insight.color }}>
              {insight.metric.value}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{insight.metric.label}</div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>

          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
              <span>Confidence</span>
              <span>{Math.round(insight.confidence * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${insight.confidence * 100}%`, backgroundColor: insight.color }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Peak Hours ───────────────────────────────────────────────────────────────

function PeakHoursHeatmap() {
  const grid: Record<string, number> = {};
  PEAK_HOUR_DATA.forEach(([d, h, s]) => { grid[`${d}-${h}`] = s; });
  const N = HOUR_LABELS.length;

  const getPeakBlock = (dayIdx: number) => {
    // Find the contiguous window with the highest average score
    let best = { start: 0, len: 2, avg: 0 };
    for (let s = 0; s < N - 1; s++) {
      for (let l = 2; l <= 3; l++) {
        if (s + l > N) break;
        const avg = Array.from({ length: l }, (_, i) => grid[`${dayIdx}-${s+i}`] ?? 0)
          .reduce((a, b) => a + b, 0) / l;
        if (avg > best.avg) best = { start: s, len: l, avg };
      }
    }
    return best;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Peak hours</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Best focus windows this week</p>
        </div>
        <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">
          Tue 9–11am best
        </span>
      </div>

      <div className="space-y-3.5">
        {DAY_LABELS_FULL.slice(0, 5).map((day, dayIdx) => {
          const { start, len, avg } = getPeakBlock(dayIdx);
          const leftPct  = (start / N) * 100;
          const widthPct = (len   / N) * 100;
          const intensity = Math.min(1, 0.55 + (avg / 100) * 0.45);

          return (
            <div key={day} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-7 text-right flex-shrink-0">{day}</span>
              <div className="flex-1 relative h-5">
                {/* dim baseline */}
                <div className="absolute inset-0 rounded-md bg-muted/30" />
                {/* peak block */}
                <div
                  className="absolute top-0 bottom-0 rounded-md"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: `rgba(97,175,239,${intensity.toFixed(2)})`,
                    boxShadow: avg >= 88 ? "0 0 8px 1px rgba(97,175,239,0.35)" : undefined,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0 tabular-nums">
                {HOUR_LABELS[start]}–{HOUR_LABELS[Math.min(start + len, N - 1)]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-3 ml-10 pr-14">
        {HOUR_LABELS.filter((_, i) => i % 3 === 0).map(h => (
          <span key={h} className="text-[9px] text-muted-foreground/40">{h}</span>
        ))}
        <span className="text-[9px] text-muted-foreground/40">{HOUR_LABELS[N - 1]}</span>
      </div>
    </div>
  );
}

// ─── Coming Week ──────────────────────────────────────────────────────────────

function ComingWeekCard() {
  const w = COMING_WEEK;
  const heavy = w.meetingPct >= 25;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Coming week</p>
        <span className="text-[11px] text-muted-foreground">{w.weekOf}</span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-muted/50 rounded-lg px-2 py-2 text-center">
          <div className="text-xl font-black text-foreground">{w.estimatedHours}h</div>
          <div className="text-[10px] text-muted-foreground">total load</div>
        </div>
        <div className={cn("flex-1 rounded-lg px-2 py-2 text-center", heavy ? "bg-yellow-500/10" : "bg-muted/50")}>
          <div className={cn("text-xl font-black", heavy ? "text-yellow-400" : "text-foreground")}>{w.scheduledMeetingHours}h</div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            meetings{heavy && <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />}
          </div>
        </div>
        <div className="flex-1 bg-muted/50 rounded-lg px-2 py-2 text-center">
          <div className="text-xl font-black text-green-400">{w.focusWindows.length}</div>
          <div className="text-[10px] text-muted-foreground">focus slots</div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Best windows</p>
        <div className="space-y-1.5">
          {w.focusWindows.map((fw, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", fw.quality === "high" ? "bg-green-400" : "bg-yellow-400")} />
              <span className="text-muted-foreground w-7">{fw.day}</span>
              <span className="text-foreground">{fw.time}</span>
              <span className="text-muted-foreground/50 ml-auto">{fw.hours}h</span>
            </div>
          ))}
        </div>
      </div>

      {w.riskFlags.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          {w.riskFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className={cn("h-3 w-3 flex-shrink-0 mt-0.5", flag.type === "deadline" ? "text-red-400" : "text-yellow-400")} />
              <span className="text-muted-foreground">{flag.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function IntelligenceSection() {
  const n = WEEKLY_NARRATIVE;
  const [selectedKpi,          setSelectedKpi]          = useState<KpiKey | null>(null);
  const [selectedAchievement,  setSelectedAchievement]  = useState<Achievement | null>(null);
  const [selectedInsight,      setSelectedInsight]      = useState<MLInsight | null>(null);
  const [showAllAchievements,  setShowAllAchievements]  = useState(false);
  const [showAllInsights,      setShowAllInsights]      = useState(false);

  const insights      = ML_INSIGHTS.filter((i) => i.type !== "achievement");
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlockedAt).length;

  return (
    <>
      <div className="space-y-4 mb-8">

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary/60" />
            Stride Intelligence
          </div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <StatusBanner
          variant="celebration"
          message={`${n.headline} — ${n.metrics.tasksCompleted} tasks, ${n.metrics.hoursLogged}h logged. You're on a roll.`}
        />

        {/* Big 4 KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <BigStat value={n.metrics.hoursLogged}         label="Hours logged"  sublabel="this week"     onClick={() => setSelectedKpi("hours")} />
          <BigStat value={n.metrics.tasksCompleted}       label="Tasks done"    sublabel="this week"     onClick={() => setSelectedKpi("tasks")} />
          <BigStat value={`${n.metrics.avgSessionMins}m`} label="Avg focus"    sublabel="per session"   onClick={() => setSelectedKpi("focus")} />
          <BigStat value={n.metrics.streakDays}           label="Day streak"    sublabel="keep going" accent onClick={() => setSelectedKpi("streak")} />
        </div>

        {/* Achievements + Insights side by side */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* Achievements */}
          <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-yellow-400/70" />
                <span className="text-xs font-semibold text-foreground">Achievements</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400/80 font-medium">
                {unlockedCount}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.slice(0, 6).map((achievement) => {
                const Icon = ACHIEVEMENT_ICON[achievement.icon] ?? Star;
                const locked = !achievement.unlockedAt;
                return (
                  <button
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/40",
                      locked && "opacity-40",
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: locked ? "var(--color-muted)" : `${achievement.color}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: locked ? undefined : achievement.color }} />
                    </div>
                    <p className="text-xs font-medium text-foreground/80 text-center leading-tight line-clamp-2">{achievement.title}</p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAllAchievements(true)}
              className="mt-auto pt-2.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 pt-2 border-t border-border/50"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Insights */}
          <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary/60" />
                <span className="text-xs font-semibold text-foreground">Insights</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-medium">AI</span>
            </div>
            <div className="space-y-0.5">
              {insights.slice(0, 4).map((insight) => {
                const Icon = INSIGHT_ICON[insight.type];
                return (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedInsight(insight)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${insight.color}18` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: insight.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{insight.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{insight.type}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: insight.color }}>
                      {insight.metric.value}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAllInsights(true)}
              className="mt-auto pt-2.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 pt-2 border-t border-border/50"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Peak hours + coming week */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PeakHoursHeatmap />
          <ComingWeekCard />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3">Your metrics</span>
          <div className="flex-1 h-px bg-border" />
        </div>

      </div>

      {/* Drawers */}
      <PersonalKpiDrawer kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />
      <AchievementDrawer achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
      <InsightDrawer insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
      <AchievementsAllDrawer open={showAllAchievements} onClose={() => setShowAllAchievements(false)} />
      <InsightsAllDrawer open={showAllInsights} onClose={() => setShowAllInsights(false)} onSelect={(i) => { setSelectedInsight(i); }} />
    </>
  );
}
