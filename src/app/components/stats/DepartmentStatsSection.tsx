import { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, X, ChevronDown, ArrowRightLeft,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "../ui/utils";
import {
  DEPARTMENTS, TEAM_NARRATIVES, DEPT_GOALS,
  type Department, type DeptTeam, type TeamStatus, type InsightTrend,
} from "../../data/mockIntelligence";
import { StatusBanner } from "./IntelligenceSection";
import { GoalsSection } from "./GoalsSection";
import type { Timeframe } from "./StatsPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TeamStatus, { label: string; color: string; dot: string }> = {
  healthy: { label: "Healthy",  color: "#4ade80", dot: "bg-green-400"  },
  watch:   { label: "Watch",    color: "#facc15", dot: "bg-yellow-400" },
  at_risk: { label: "At risk",  color: "#f87171", dot: "bg-red-400"    },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} pts</p>
    </div>
  );
}

// ─── Department Selector ──────────────────────────────────────────────────────

function DeptSelector({
  selected, onSelect,
}: { selected: Department; onSelect: (d: Department) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-accent transition-colors"
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.color }} />
        {selected.name}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-popover border border-border rounded-lg shadow-lg py-1 z-20">
          {DEPARTMENTS.map((d) => (
            <button
              key={d.id}
              onClick={() => { onSelect(d); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                d.id === selected.id
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <div>
                <div>{d.name}</div>
                <div className="text-[10px] text-muted-foreground/60">{d.teamCount} teams · {d.memberCount} members</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Big KPI Stat ─────────────────────────────────────────────────────────────

function DeptBigStat({ value, label, sublabel, trend, accent }: {
  value: string | number; label: string; sublabel?: string;
  trend?: InsightTrend; accent?: boolean;
}) {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl px-4 py-4 text-center">
      <div className={cn("text-3xl font-black tabular-nums", accent ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      <div className="text-xs font-semibold text-foreground mt-1">{label}</div>
      {sublabel && (
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {trend === "improving" && <TrendingUp   className="h-3 w-3 text-green-400" />}
          {trend === "worsening" && <TrendingDown className="h-3 w-3 text-red-400"   />}
          {trend === "stable"    && <Minus        className="h-3 w-3 text-muted-foreground" />}
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Velocity Chart ───────────────────────────────────────────────────────────

function DeptVelocityChart({ dept }: { dept: Department }) {
  const data   = dept.velocityData;
  const first  = data[0].value;
  const last   = data[data.length - 1].value;
  const change = Math.round(((last - first) / first) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{dept.name} velocity trend</p>
          <p className="text-[11px] text-muted-foreground">Combined story points — last 8 sprints</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-foreground tabular-nums">{last} pts</div>
          <div className={cn(
            "text-[11px] font-medium flex items-center gap-1 justify-end",
            change > 0 ? "text-green-400" : "text-red-400",
          )}>
            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change > 0 ? "+" : ""}{change}% over 8 wks
          </div>
        </div>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id={`dept-vel-grad-${dept.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={dept.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={dept.color} stopOpacity={0}    />
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
              stroke={dept.color}
              strokeWidth={2.5}
              fill={`url(#dept-vel-grad-${dept.id})`}
              dot={false}
              activeDot={{ r: 4, fill: dept.color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team, onClick }: { team: DeptTeam; onClick: () => void }) {
  const cfg = STATUS_CONFIG[team.status];

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 text-left w-full hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{team.name}</h4>
          <p className="text-[11px] text-muted-foreground">{team.memberCount} members</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
          <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Rhythm bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-muted-foreground">Rhythm</span>
          <span className="font-semibold text-foreground">{team.rhythmScore}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${team.rhythmScore}%`, backgroundColor: cfg.color }}
          />
        </div>
      </div>

      {/* Velocity + burnout */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {team.velocityTrend === "up"   && <TrendingUp   className="h-3 w-3 text-green-400" />}
          {team.velocityTrend === "flat" && <Minus        className="h-3 w-3 text-muted-foreground" />}
          {team.velocityTrend === "down" && <TrendingDown className="h-3 w-3 text-red-400" />}
          <span className="text-muted-foreground capitalize">{team.velocityTrend}</span>
        </div>
        {team.burnoutAlerts > 0 ? (
          <span className="text-[10px] text-yellow-400">
            ⚠ {team.burnoutAlerts} signal{team.burnoutAlerts > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">no signals</span>
        )}
      </div>

      <p className="text-[9px] text-muted-foreground/30 text-right">tap for details →</p>
    </button>
  );
}

// ─── Team Detail Drawer ───────────────────────────────────────────────────────

function TeamDetailDrawer({
  team, onClose,
}: { team: DeptTeam | null; onClose: () => void }) {
  if (!team) return null;
  const narrative = TEAM_NARRATIVES[team.id];
  const cfg       = STATUS_CONFIG[team.status];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{team.name} team</h3>
              <p className="text-xs text-muted-foreground">{team.memberCount} members</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary narrative */}
          {narrative && (
            <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-foreground leading-snug">{narrative.highlight}</p>
              {narrative.summary && (
                <p className="text-[11px] text-muted-foreground mt-1.5">{narrative.summary}</p>
              )}
            </div>
          )}

          {/* Watch item */}
          {narrative?.watchItem && (
            <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl px-4 py-3">
              <p className="text-[11px] text-yellow-400/90 leading-relaxed">{narrative.watchItem}</p>
            </div>
          )}

          {/* Rhythm score */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Rhythm score</span>
              <span className="font-bold text-foreground">{team.rhythmScore} / 100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${team.rhythmScore}%`, backgroundColor: cfg.color }}
              />
            </div>
          </div>

          {/* Work items */}
          {narrative?.topWorkItems && narrative.topWorkItems.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                This sprint
              </p>
              <div className="space-y-2">
                {narrative.topWorkItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      item.status === "done"        ? "bg-green-400" :
                      item.status === "blocked"     ? "bg-red-400"   :
                      "bg-primary/60",
                    )} />
                    <span className={cn(
                      "flex-1",
                      item.status === "done" ? "text-muted-foreground" : "text-foreground",
                    )}>
                      {item.title}
                    </span>
                    <span className={cn(
                      "text-[10px] flex-shrink-0",
                      item.status === "done"    ? "text-green-400"  :
                      item.status === "blocked" ? "text-red-400"    :
                      "text-muted-foreground",
                    )}>
                      {item.status === "done" ? "Done" : item.status === "blocked" ? "Blocked" : "In progress"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="flex gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-black text-foreground tabular-nums">{team.rhythmScore}</div>
              <div className="text-[10px] text-muted-foreground">rhythm</div>
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className={cn(
                "text-2xl font-black tabular-nums",
                team.velocityTrend === "up"   ? "text-green-400" :
                team.velocityTrend === "down" ? "text-red-400"   :
                "text-foreground",
              )}>
                {team.velocityTrend === "up" ? "↑" : team.velocityTrend === "down" ? "↓" : "→"}
              </div>
              <div className="text-[10px] text-muted-foreground">velocity</div>
            </div>
            {team.burnoutAlerts > 0 ? (
              <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-center">
                <div className="text-2xl font-black text-yellow-400 tabular-nums">{team.burnoutAlerts}</div>
                <div className="text-[10px] text-muted-foreground">signals</div>
              </div>
            ) : (
              <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5 text-center">
                <div className="text-2xl font-black text-green-400">✓</div>
                <div className="text-[10px] text-muted-foreground">all clear</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Collaboration Links ──────────────────────────────────────────────────────

function CollaborationLinks({ dept }: { dept: Department }) {
  const sorted = [...dept.crossTeamLinks].sort((a, b) => b.strength - a.strength);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm font-semibold text-foreground mb-1">Cross-team collaboration</p>
      <p className="text-[11px] text-muted-foreground mb-4">Which teams work together most closely</p>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-3">No collaboration links recorded</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((link, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-44 flex-shrink-0 min-w-0">
                <span className="text-[11px] text-foreground font-medium truncate flex-1 text-right">{link.teamA}</span>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                <span className="text-[11px] text-foreground font-medium truncate flex-1">{link.teamB}</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${link.strength * 10}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right flex-shrink-0">
                {link.strength}/10
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DepartmentStatsSection({ timeframe: _timeframe }: { timeframe: Timeframe }) {
  const [selectedDept, setSelectedDept] = useState<Department>(DEPARTMENTS[0]);
  const [selectedTeam, setSelectedTeam] = useState<DeptTeam | null>(null);

  const velocityLast   = selectedDept.velocityData[selectedDept.velocityData.length - 1].value;
  const velocityFirst  = selectedDept.velocityData[0].value;
  const velocityChange = Math.round(((velocityLast - velocityFirst) / velocityFirst) * 100);
  const avgRhythm      = Math.round(
    selectedDept.teams.reduce((a, t) => a + t.rhythmScore, 0) / selectedDept.teams.length,
  );
  const watchSignals   = selectedDept.teams.filter((t) => t.status !== "healthy").length;
  const blockerCount   = selectedDept.topBlockers.length;

  const bannerVariant =
    velocityChange >= 20 ? "celebration" :
    watchSignals >= 2    ? "warning"     :
    "success";

  const bannerMessage =
    velocityChange >= 20
      ? `${selectedDept.name} velocity up ${velocityChange}% over 8 sprints — strong momentum across all teams. 🚀`
      : watchSignals >= 2
      ? `${watchSignals} teams need attention this sprint — worth reviewing workloads before Q2.`
      : `${selectedDept.name} is running steady. Velocity consistent, team rhythm on track.`;

  return (
    <>
      <div className="space-y-4 mb-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {selectedDept.name} · {selectedDept.teamCount} teams
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lead: {selectedDept.leadName} · {selectedDept.memberCount} members
            </p>
          </div>
          <DeptSelector
            selected={selectedDept}
            onSelect={(d) => { setSelectedDept(d); setSelectedTeam(null); }}
          />
        </div>

        {/* Banner */}
        <StatusBanner variant={bannerVariant} message={bannerMessage} />

        {/* Big 4 KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <DeptBigStat
            value={velocityLast}
            label="Velocity"
            sublabel={`${velocityChange > 0 ? "+" : ""}${velocityChange}% trend`}
            trend={velocityChange > 10 ? "improving" : velocityChange < -10 ? "worsening" : "stable"}
          />
          <DeptBigStat
            value={avgRhythm}
            label="Avg rhythm"
            sublabel="out of 100"
          />
          <DeptBigStat
            value={blockerCount}
            label="Cross-team blockers"
            sublabel="active"
            accent={blockerCount >= 3}
          />
          <DeptBigStat
            value={watchSignals > 0 ? watchSignals : "✅"}
            label="Teams watching"
            sublabel={watchSignals > 0 ? "need review" : "all healthy"}
            accent={watchSignals > 0}
          />
        </div>

        {/* Velocity chart */}
        <DeptVelocityChart dept={selectedDept} />

        {/* Team cards */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-foreground">Teams</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {selectedDept.teamCount} total
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {selectedDept.teams.map((team) => (
              <TeamCard key={team.id} team={team} onClick={() => setSelectedTeam(team)} />
            ))}
          </div>
        </div>

        {/* Cross-team blockers */}
        {selectedDept.topBlockers.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Cross-team blockers</p>
            <div className="space-y-2">
              {selectedDept.topBlockers.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/70 flex-shrink-0" />
                  <span className="text-foreground flex-1">{b.type}</span>
                  <span className="text-muted-foreground text-[10px]">{b.affectedTeams.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration heatmap */}
        {selectedDept.crossTeamLinks.length > 1 && (
          <CollaborationLinks dept={selectedDept} />
        )}

        {/* Goals */}
        <GoalsSection
          goals={DEPT_GOALS[selectedDept.id] ?? []}
          entityName={`${selectedDept.name} dept`}
        />

      </div>

      {/* Team detail drawer */}
      <TeamDetailDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} />
    </>
  );
}
