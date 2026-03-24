import { useState } from "react";
import {
  Users, CheckCircle2, Clock, FolderOpen, AlertTriangle, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import {
  TEAMS, TEAM_MEMBERS, PROJECTS, USERS, ORG_TEAM_STATS, TEAM_MEMBER_STATS,
  WORKSPACE_MEMBERSHIPS,
  type ProjectStatus,
} from "../../data/mockData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ProjectStatus, string> = {
  ACTIVE: "#98c379", AT_RISK: "#e06c75", ON_HOLD: "#e5c07b", COMPLETED: "#5c6370",
};
const STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "Active", AT_RISK: "At risk", ON_HOLD: "On hold", COMPLETED: "Completed",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="text-foreground font-medium">{p.value}{p.unit ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrgStatsSection() {
  const { activeWorkspace, allWorkspaceTeams } = useApp();

  const wsMembers = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === activeWorkspace.id);
  const wsTeams = allWorkspaceTeams;
  const wsProjects = PROJECTS.filter((p) => p.workspaceId === activeWorkspace.id);

  const totalMembers = wsMembers.length;
  const totalTasks = ORG_TEAM_STATS.reduce((s, t) => s + t.tasksDoneThisWeek, 0);
  const totalHours = ORG_TEAM_STATS.reduce((s, t) => s + t.hoursLoggedThisWeek, 0);
  const activeProjects = wsProjects.filter((p) => p.status === "ACTIVE" || p.status === "AT_RISK").length;
  const atRisk = wsProjects.filter((p) => p.status === "AT_RISK").length;

  const burnoutMembers = TEAM_MEMBER_STATS.filter((s) => s.burnoutRisk === "HIGH").length;

  // Team hours comparison
  const teamHoursData = ORG_TEAM_STATS.map((ts) => {
    const team = TEAMS.find((t) => t.id === ts.teamId);
    return { name: team?.name ?? "?", hours: ts.hoursLoggedThisWeek, tasks: ts.tasksDoneThisWeek, color: team?.color ?? "#abb2bf" };
  });

  return (
    <div className="space-y-5">
      {/* Org stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Members", value: `${totalMembers}`, icon: Users, color: "#61afef" },
          { label: "Tasks this week", value: `${totalTasks}`, icon: CheckCircle2, color: "#98c379" },
          { label: "Hours this week", value: `${totalHours}h`, icon: Clock, color: "#c678dd" },
          { label: "Active projects", value: `${activeProjects}`, icon: FolderOpen, color: "#e5c07b", sub: atRisk > 0 ? `${atRisk} at risk` : undefined },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className="h-3 w-3" style={{ color: stat.color }} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            {stat.sub && <p className="text-[10px] text-destructive mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Burnout warning */}
      {burnoutMembers > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-medium">{burnoutMembers} member{burnoutMembers > 1 ? "s" : ""}</span> showing high burnout risk this week.
          </p>
        </div>
      )}

      {/* Team hours comparison */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Hours by team</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Total hours logged this week per team.</p>
        </div>
        <div className="p-5 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamHoursData} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Bar dataKey="hours" name="Hours" radius={[4, 4, 0, 0]}>
                {teamHoursData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ORG_TEAM_STATS.map((ts) => {
          const team = TEAMS.find((t) => t.id === ts.teamId);
          if (!team) return null;
          const memberCount = TEAM_MEMBERS.filter((tm) => tm.teamId === ts.teamId).length;
          return (
            <div key={ts.teamId} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${team.color}15` }}>
                  <team.Icon className="h-4 w-4" style={{ color: team.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{team.name}</p>
                  <p className="text-[10px] text-muted-foreground">{memberCount} members</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground tabular-nums">{ts.tasksDoneThisWeek}</p>
                  <p className="text-[10px] text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground tabular-nums">{ts.hoursLoggedThisWeek}h</p>
                  <p className="text-[10px] text-muted-foreground">Hours</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground tabular-nums">{ts.openTasks}</p>
                  <p className="text-[10px] text-muted-foreground">Open</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project status */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Project status</h3>
        </div>
        <div className="divide-y divide-border">
          {wsProjects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[p.status] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{p.name}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${STATUS_COLOR[p.status]}15`, color: STATUS_COLOR[p.status] }}>
                {STATUS_LABEL[p.status]}
              </span>
              <div className="w-20">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: STATUS_COLOR[p.status] }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{p.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
