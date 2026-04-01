import { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, Users, X, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "../ui/utils";
import {
  TEAM_HEALTH, MEMBER_NARRATIVES,
  type InsightTrend,
} from "../../data/mockIntelligence";
import { TEAM_MEMBER_STATS, USERS } from "../../data/mockData";
import { StatusBanner } from "./IntelligenceSection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MemberStatus = "healthy" | "watch" | "at_risk";

const STATUS_CONFIG: Record<MemberStatus, { dot: string; label: string; labelClass: string; color: string }> = {
  healthy: { dot: "bg-green-400",  label: "Healthy",  labelClass: "text-green-400",  color: "#4ade80" },
  watch:   { dot: "bg-yellow-400", label: "Watch",    labelClass: "text-yellow-400", color: "#facc15" },
  at_risk: { dot: "bg-red-400",    label: "At risk",  labelClass: "text-red-400",    color: "#f87171" },
};

function getMemberStatus(risk: string, hours: number): MemberStatus {
  if (risk === "HIGH")                   return "at_risk";
  if (risk === "MEDIUM" || hours > 40)   return "watch";
  return "healthy";
}

function getUserName(userId: string): string {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return userId;
  const parts = user.name.split(" ");
  return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : user.name;
}

function getInitials(userId: string): string {
  const user = USERS.find((u) => u.id === userId);
  return user?.initials ?? "?";
}

function getUserColor(userId: string): string {
  return USERS.find((u) => u.id === userId)?.color ?? "#848b98";
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} pts</p>
    </div>
  );
}

// ─── Big KPI Stat ─────────────────────────────────────────────────────────────

function TeamBigStat({ value, label, sublabel, trend, accent }: {
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

function VelocityChart() {
  const h    = TEAM_HEALTH;
  const last = h.velocityData[h.velocityData.length - 1].value;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Velocity trend</p>
          <p className="text-[11px] text-muted-foreground">Story points completed — last 8 sprints</p>
        </div>
        <div className="text-2xl font-black text-foreground tabular-nums">{last} pts</div>
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={h.velocityData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="team-vel-grad" x1="0" y1="0" x2="0" y2="1">
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
              domain={[(dataMin: number) => Math.max(0, dataMin - 8), (dataMax: number) => dataMax + 6]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#61afef"
              strokeWidth={2.5}
              fill="url(#team-vel-grad)"
              dot={false}
              activeDot={{ r: 4, fill: "#61afef", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Member List Row ──────────────────────────────────────────────────────────

function MemberListRow({ userId, onSelect }: { userId: string; onSelect: () => void }) {
  const stats     = TEAM_MEMBER_STATS.find((s) => s.userId === userId);
  const narrative = MEMBER_NARRATIVES[userId];
  if (!stats) return null;

  const status   = getMemberStatus(stats.burnoutRisk, stats.hoursThisWeek);
  const cfg      = STATUS_CONFIG[status];
  const initials = getInitials(userId);
  const name     = getUserName(userId);
  const color    = getUserColor(userId);

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-accent/50 transition-colors"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: `${color}25`, color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <div className="flex items-center gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            <span className={cn("text-[10px] font-medium", cfg.labelClass)}>{cfg.label}</span>
          </div>
          {stats.streak >= 7 && (
            <span className="text-[10px] text-primary font-medium">🔥 {stats.streak}d</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <div className="text-xs font-semibold text-foreground tabular-nums">{stats.tasksCompletedThisWeek} tasks</div>
          <div className="text-[10px] text-muted-foreground tabular-nums">{stats.hoursThisWeek}h logged</div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
    </button>
  );
}

// ─── Member Detail Drawer ─────────────────────────────────────────────────────

function MemberDetailDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  if (!userId) return null;

  const stats     = TEAM_MEMBER_STATS.find((s) => s.userId === userId);
  const narrative = MEMBER_NARRATIVES[userId];
  const user      = USERS.find((u) => u.id === userId);
  if (!stats || !user) return null;

  const status   = getMemberStatus(stats.burnoutRisk, stats.hoursThisWeek);
  const cfg      = STATUS_CONFIG[status];
  const days     = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const maxHours = Math.max(...(narrative?.dailyHours ?? [1]));
  const maxTasks = Math.max(...(narrative?.sprintTrend.map((s) => s.tasks) ?? [1]));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: `${user.color}25`, color: user.color }}
              >
                {user.initials}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user.name}</h3>
                <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                  <span className={cn("text-[10px] font-medium", cfg.labelClass)}>{cfg.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Highlight card */}
          {narrative && (
            <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-foreground leading-snug">{narrative.highlight}</p>
            </div>
          )}

          {/* Wins */}
          {narrative?.wins && narrative.wins.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                This sprint
              </p>
              <ul className="space-y-2">
                {narrative.wins.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk reason */}
          {narrative?.riskReason && status !== "healthy" && (
            <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl px-4 py-3">
              <p className="text-[11px] text-yellow-400/90 leading-relaxed">{narrative.riskReason}</p>
            </div>
          )}

          {/* 4-sprint task trend */}
          {narrative?.sprintTrend && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                4-sprint task trend
              </p>
              <div className="space-y-2.5">
                {narrative.sprintTrend.map((sp) => (
                  <div key={sp.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0">{sp.label}</span>
                    <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all"
                        style={{
                          width: `${(sp.tasks / maxTasks) * 100}%`,
                          backgroundColor: user.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-foreground tabular-nums w-12 text-right flex-shrink-0">
                      {sp.tasks} tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily hours bar chart */}
          {narrative?.dailyHours && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Daily hours this week
              </p>
              <div className="flex items-end gap-2" style={{ height: 64 }}>
                {narrative.dailyHours.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${Math.max(6, (h / maxHours) * 52)}px`,
                        backgroundColor: h > 9 ? "#facc15" : "#61afef",
                        opacity: 0.75,
                      }}
                    />
                    <span className="text-[9px] text-muted-foreground">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className={cn(
                "text-2xl font-black tabular-nums",
                stats.hoursThisWeek > 40 ? "text-yellow-400" : "text-foreground",
              )}>
                {stats.hoursThisWeek}h
              </div>
              <div className="text-[10px] text-muted-foreground">this week</div>
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-black tabular-nums text-foreground">
                {stats.tasksCompletedThisWeek}
              </div>
              <div className="text-[10px] text-muted-foreground">tasks done</div>
            </div>
            {stats.streak >= 7 && (
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
                <div className="text-2xl font-black tabular-nums text-primary">{stats.streak}</div>
                <div className="text-[10px] text-muted-foreground">day streak</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function TeamHealthSection({ isAdmin: propIsAdmin }: { isAdmin: boolean }) {
  const h = TEAM_HEALTH;
  const [viewAsAdmin, setViewAsAdmin] = useState(propIsAdmin);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const teamUserIds    = TEAM_MEMBER_STATS.map((s) => s.userId);
  const burnoutCount   = TEAM_MEMBER_STATS.filter((s) => s.burnoutRisk !== "LOW").length;
  const velocityLast   = h.velocityData[h.velocityData.length - 1].value;
  const velocityFirst  = h.velocityData[0].value;
  const velocityChange = Math.round(((velocityLast - velocityFirst) / velocityFirst) * 100);

  const bannerVariant = velocityChange >= 30 ? "celebration" : velocityChange >= 10 ? "success" : "info";
  const bannerMessage =
    velocityChange >= 30
      ? `Team velocity up ${velocityChange}% — best sprint run in months. Keep the momentum! 🚀`
      : velocityChange >= 10
      ? `Velocity trending up ${velocityChange}% over 8 sprints. The team is finding its rhythm. 👏`
      : `Team is running at a steady pace this sprint. Velocity holding consistent.`;

  return (
    <>
      <div className="space-y-4 mb-8">

        {/* Header + toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{h.teamName} team</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">{h.teamNarrative}</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg text-xs">
            <button
              onClick={() => setViewAsAdmin(false)}
              className={cn(
                "px-3 py-1 rounded-md font-medium transition-colors",
                !viewAsAdmin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Member
            </button>
            <button
              onClick={() => setViewAsAdmin(true)}
              className={cn(
                "px-3 py-1 rounded-md font-medium transition-colors",
                viewAsAdmin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Lead
            </button>
          </div>
        </div>

        {/* Banner */}
        <StatusBanner variant={bannerVariant} message={bannerMessage} />

        {/* Big 4 KPIs */}
        <div className="flex gap-3">
          <TeamBigStat
            value={velocityLast}
            label="Velocity"
            sublabel={`${velocityChange > 0 ? "+" : ""}${velocityChange}% trend`}
            trend={velocityChange > 5 ? "improving" : velocityChange < -5 ? "worsening" : "stable"}
          />
          <TeamBigStat
            value={`${h.rhythmScore}`}
            label="Team rhythm"
            sublabel={h.rhythmTrend}
            trend={h.rhythmTrend}
          />
          <TeamBigStat
            value={h.topBlockers.reduce((a, b) => a + b.count, 0)}
            label="Active blockers"
            sublabel="open issues"
          />
          <TeamBigStat
            value={burnoutCount > 0 ? burnoutCount : "✅"}
            label="Watch signals"
            sublabel={burnoutCount > 0 ? "need check-in" : "all clear"}
            accent={burnoutCount > 0}
          />
        </div>

        {/* Velocity chart */}
        <VelocityChart />

        {/* Lead view: member list */}
        {viewAsAdmin && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Team members</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                lead view only
              </span>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {teamUserIds.map((uid) => (
                <MemberListRow key={uid} userId={uid} onSelect={() => setSelectedMemberId(uid)} />
              ))}
            </div>
          </div>
        )}

        {/* Burnout banner — lead view only */}
        {viewAsAdmin && burnoutCount > 0 && (
          <StatusBanner
            variant="warning"
            message={`${burnoutCount} team member${burnoutCount > 1 ? "s" : ""} may need a check-in this week. Consider scheduling a 1:1.`}
          />
        )}
        {viewAsAdmin && burnoutCount === 0 && (
          <StatusBanner variant="success" message="No burnout signals this week — the team looks healthy! 🙌" />
        )}

      </div>

      {/* Member detail drawer */}
      <MemberDetailDrawer
        userId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </>
  );
}
