import { useState, useMemo } from "react";
import {
  Users, Clock, CheckCircle2, TrendingUp, AlertCircle, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import {
  TEAMS, TEAM_MEMBERS, USERS, TEAM_MEMBER_STATS,
} from "../../data/mockData";

// ─── Mock team data ──────────────────────────────────────────────────────────

const TEAM_VELOCITY = [
  { week: "Feb 3",  completed: 22, added: 25 },
  { week: "Feb 10", completed: 28, added: 20 },
  { week: "Feb 17", completed: 19, added: 27 },
  { week: "Feb 24", completed: 31, added: 24 },
  { week: "Mar 3",  completed: 25, added: 22 },
  { week: "Mar 10", completed: 33, added: 28 },
  { week: "Mar 17", completed: 27, added: 23 },
  { week: "Mar 22", completed: 12, added: 8  },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="text-foreground font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamInsightsSection() {
  const { myTeams, allWorkspaceTeams, workspaceRole } = useApp();
  const isOrgAdmin = workspaceRole === "OWNER" || workspaceRole === "ADMIN";

  const teams = isOrgAdmin ? allWorkspaceTeams : myTeams.map((mt) => mt.team);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const team = teams.find((t) => t.id === selectedTeamId);

  const teamMemberIds = TEAM_MEMBERS.filter((tm) => tm.teamId === selectedTeamId).map((tm) => tm.userId);
  const teamUsers = USERS.filter((u) => teamMemberIds.includes(u.id));
  const teamStats = TEAM_MEMBER_STATS.filter((s) => teamMemberIds.includes(s.userId));

  // Compute stats
  const totalHours = teamStats.reduce((s, m) => s + m.hoursThisWeek, 0);
  const totalTasks = teamStats.reduce((s, m) => s + m.tasksCompletedThisWeek, 0);
  const avgHours = teamStats.length > 0 ? totalHours / teamStats.length : 0;
  const burnoutCount = teamStats.filter((s) => s.burnoutRisk === "HIGH").length;

  // Member hours for bar chart
  const memberHoursData = teamStats.map((s) => {
    const user = USERS.find((u) => u.id === s.userId);
    return { name: user?.name.split(" ")[0] ?? "?", hours: s.hoursThisWeek, color: user?.color ?? "#abb2bf" };
  }).sort((a, b) => b.hours - a.hours);

  if (!team || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-8 w-8 mx-auto text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">No teams available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Team selector */}
      {teams.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
          {teams.map((t) => (
            <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                selectedTeamId === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <t.Icon className="h-3 w-3" style={{ color: t.color }} />
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Members", value: `${teamStats.length}`, icon: Users, color: team.color },
          { label: "Avg hours/member", value: `${avgHours.toFixed(1)}h`, icon: Clock, color: "#61afef" },
          { label: "Tasks completed", value: `${totalTasks}`, icon: CheckCircle2, color: "#98c379" },
          { label: "Burnout risk", value: burnoutCount > 0 ? `${burnoutCount} member${burnoutCount > 1 ? "s" : ""}` : "None", icon: AlertCircle, color: burnoutCount > 0 ? "#e06c75" : "#98c379" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className="h-3 w-3" style={{ color: stat.color }} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Velocity chart */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Team velocity</h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><div className="h-2 w-5 rounded-sm" style={{ backgroundColor: "#98c37990" }} /> Completed</div>
            <div className="flex items-center gap-1"><div className="h-2 w-5 rounded-sm" style={{ backgroundColor: "#abb2bf60" }} /> Added</div>
          </div>
        </div>
        <div className="p-5 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TEAM_VELOCITY} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="added"     name="Added"     stroke="#abb2bf" fill="#abb2bf18" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#98c379" fill="#98c37918" strokeWidth={2}   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member workload */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Member workload</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Hours logged this week by team member.</p>
        </div>
        <div className="p-5 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberHoursData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="h" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Bar dataKey="hours" name="Hours" radius={[0, 4, 4, 0]}>
                {memberHoursData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Team members</h3>
        </div>
        <div className="divide-y divide-border">
          {teamStats.map((s) => {
            const user = USERS.find((u) => u.id === s.userId);
            if (!user) return null;
            return (
              <div key={s.userId} className="flex items-center gap-3 px-5 py-3">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                  style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.tasksInProgress} in progress</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">{s.hoursThisWeek}h</p>
                  <p className="text-[10px] text-muted-foreground">{s.tasksCompletedThisWeek} tasks</p>
                </div>
                <div className="w-12 text-right">
                  <p className="text-[10px] text-muted-foreground">{s.streak}d</p>
                  {s.burnoutRisk === "HIGH" && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Risk</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
