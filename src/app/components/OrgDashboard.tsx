import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Building2, Users, CheckCircle2, Clock, FolderOpen, TrendingUp,
  AlertTriangle, ArrowRight, BarChart2, UserPlus, Shield, X, Check,
  UserMinus, Mail, Search,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import {
  TEAMS, TEAM_MEMBERS, PROJECTS, USERS, ORG_TEAM_STATS, TEAM_MEMBER_STATS,
  WORKSPACE_MEMBERSHIPS,
  type ProjectStatus, type User,
} from "../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  ACTIVE: "#98c379", AT_RISK: "#e06c75", ON_HOLD: "#e5c07b", COMPLETED: "#5c6370",
};
const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "Active", AT_RISK: "At risk", ON_HOLD: "On hold", COMPLETED: "Completed",
};
const WORKSPACE_ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member",
};
const WORKSPACE_ROLE_COLOR: Record<string, string> = {
  OWNER: "#e5c07b", ADMIN: "#61afef", MEMBER: "#abb2bf",
};

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Team summary card ────────────────────────────────────────────────────────

function TeamSummaryCard({ teamId }: { teamId: string }) {
  const navigate = useNavigate();
  const team     = TEAMS.find((t) => t.id === teamId);
  const orgStats = ORG_TEAM_STATS.find((s) => s.teamId === teamId);
  if (!team || !orgStats) return null;

  const members = TEAM_MEMBERS.filter((tm) => tm.teamId === teamId);
  const memberDetails = members
    .map((tm) => ({ user: USERS.find((u) => u.id === tm.userId), stats: TEAM_MEMBER_STATS.find((s) => s.userId === tm.userId) }))
    .filter((m) => m.user && m.stats);
  const highRisk = memberDetails.filter((m) => m.stats?.burnoutRisk === "HIGH").length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: team.color }} />
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base"
            style={{ backgroundColor: `${team.color}18` }}>{team.icon}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{team.name}</p>
            <p className="text-xs text-muted-foreground">{orgStats.memberCount} members · {team.description}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/team/${teamId}`)}
          className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
          Insights <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        {[
          { val: orgStats.tasksCompletedThisWeek, label: "tasks done" },
          { val: `${orgStats.hoursLoggedThisWeek}h`, label: "logged" },
          { val: orgStats.openIssues, label: "open tasks" },
        ].map((item) => (
          <div key={item.label} className="px-4 py-3 text-center">
            <p className="text-base font-semibold text-foreground">{item.val}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {memberDetails.slice(0, 5).map(({ user }) => user && (
            <div key={user.id} className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold border-2 border-card"
              style={{ backgroundColor: `${user.color}25`, color: user.color }} title={user.name}>
              {user.initials}
            </div>
          ))}
          {memberDetails.length > 5 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border-2 border-card">
              +{memberDetails.length - 5}
            </div>
          )}
        </div>
        {highRisk > 0 && (
          <div className="flex items-center gap-1 text-xs text-chart-5">
            <AlertTriangle className="h-3 w-3" />{highRisk} at risk
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

interface OrgMember {
  user: User;
  workspaceRole: string;
  teams: { id: string; name: string; icon: string; color: string; role: string }[];
}

function MembersTab({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate();
  const orgTeams = TEAMS.filter((t) => t.workspaceId === workspaceId);

  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  // Build merged member list
  const orgMembers: OrgMember[] = useMemo(() => {
    const wsMembers = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === workspaceId);
    return wsMembers.map((wm) => {
      const user = USERS.find((u) => u.id === wm.userId)!;
      const teams = TEAM_MEMBERS
        .filter((tm) => tm.userId === wm.userId && orgTeams.some((t) => t.id === tm.teamId))
        .map((tm) => {
          const team = orgTeams.find((t) => t.id === tm.teamId)!;
          return { id: team.id, name: team.name, icon: team.icon, color: team.color, role: tm.role };
        });
      return { user, workspaceRole: wm.role, teams };
    }).filter((m) => m.user);
  }, [workspaceId, orgTeams]);

  const filtered = orgMembers.filter((m) => {
    if (search && !m.user.name.toLowerCase().includes(search.toLowerCase()) && !m.user.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTeam !== "all" && !m.teams.some((t) => t.id === filterTeam)) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>
        <div className="relative">
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
            <option value="all">All teams</option>
            {orgTeams.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} members</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_120px_1fr_auto] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
        <span>Member</span>
        <span>Org role</span>
        <span>Teams</span>
        <span></span>
      </div>

      {/* Member rows */}
      <div className="space-y-1.5">
        {filtered.map(({ user, workspaceRole, teams }) => (
          <div key={user.id} className="grid grid-cols-[1fr_120px_1fr_auto] gap-4 items-center bg-card border border-border rounded-xl px-4 py-3 hover:border-border/80 transition-colors">
            {/* User */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                {user.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  {user.id === "u1" && <span className="text-[10px] text-muted-foreground/60">(you)</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Org role */}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide w-fit"
              style={{ backgroundColor: `${WORKSPACE_ROLE_COLOR[workspaceRole]}15`, color: WORKSPACE_ROLE_COLOR[workspaceRole] }}>
              {WORKSPACE_ROLE_LABEL[workspaceRole]}
            </span>

            {/* Teams */}
            <div className="flex flex-wrap gap-1.5">
              {teams.length === 0 ? (
                <span className="text-xs text-muted-foreground/50 italic">No teams</span>
              ) : teams.map((t) => (
                <button key={t.id} onClick={() => navigate(`/team/${t.id}`)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                  <span>{t.icon}</span>{t.name}
                  {t.role === "ADMIN" && <Shield className="h-2.5 w-2.5 ml-0.5" />}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button title={`Email ${user.name}`}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {user.id !== "u1" && (
                <button title={`Remove ${user.name} from org`}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors">
                  <UserMinus className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type OrgTab = "overview" | "members" | "projects";

export function OrgDashboard() {
  const { activeWorkspace, workspaceRole } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive tab from URL
  const activeTab: OrgTab = location.pathname.endsWith("/members") ? "members" : "overview";
  const [localTab, setLocalTab] = useState<"overview" | "projects">("overview");

  const isAdmin = workspaceRole === "ADMIN" || workspaceRole === "OWNER";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Building2 className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">You need workspace admin access to view this page.</p>
      </div>
    );
  }

  const orgTeams   = TEAMS.filter((t) => t.workspaceId === activeWorkspace.id);
  const orgProjects = PROJECTS.filter((p) => p.workspaceId === activeWorkspace.id);
  const orgStats   = ORG_TEAM_STATS.filter((s) => orgTeams.some((t) => t.id === s.teamId));

  const totalMembers  = new Set(WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === activeWorkspace.id).map((wm) => wm.userId)).size;
  const totalTasksDone = orgStats.reduce((s, o) => s + o.tasksCompletedThisWeek, 0);
  const totalHours    = orgStats.reduce((s, o) => s + o.hoursLoggedThisWeek, 0);
  const activeProjects = orgProjects.filter((p) => p.status === "ACTIVE" || p.status === "AT_RISK").length;
  const atRiskProjects = orgProjects.filter((p) => p.status === "AT_RISK").length;

  const allOrgUserIds = new Set(TEAM_MEMBERS.filter((tm) => orgTeams.some((t) => t.id === tm.teamId)).map((tm) => tm.userId));
  const allOrgStats   = TEAM_MEMBER_STATS.filter((s) => allOrgUserIds.has(s.userId));
  const totalHighRisk = allOrgStats.filter((s) => s.burnoutRisk === "HIGH").length;
  const totalMedRisk  = allOrgStats.filter((s) => s.burnoutRisk === "MEDIUM").length;

  const TABS = [
    { id: "overview" as const, label: "Overview", path: "/org" },
    { id: "members"  as const, label: "Members",  path: "/org/members" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${activeWorkspace.color}20` }}>
            {activeWorkspace.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground">{activeWorkspace.name}</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-primary/10 text-primary">Admin</span>
            </div>
            <p className="text-sm text-muted-foreground">{orgTeams.length} teams · {totalMembers} members</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users className="h-4 w-4" />}         label="Total members"   value={String(totalMembers)}   sub="in org"               color="#61afef" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />}  label="Tasks done"       value={String(totalTasksDone)} sub="this week"            color="#98c379" />
        <StatCard icon={<Clock className="h-4 w-4" />}         label="Hours logged"     value={`${totalHours}h`}       sub="this week"            color="#e5c07b" />
        <StatCard icon={<FolderOpen className="h-4 w-4" />}    label="Active projects"  value={String(activeProjects)} sub={atRiskProjects > 0 ? `${atRiskProjects} at risk` : "All on track"} color={atRiskProjects > 0 ? "#e06c75" : "#98c379"} />
      </div>

      {/* Burnout banner */}
      {totalHighRisk > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border mb-5"
          style={{ backgroundColor: "rgba(224,108,117,0.07)", borderColor: "#e06c7530" }}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#e06c75" }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {totalHighRisk} member{totalHighRisk !== 1 ? "s" : ""} showing high burnout risk
              {totalMedRisk > 0 && ` · ${totalMedRisk} at caution`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Review team Insights pages and consider task redistribution.</p>
          </div>
        </div>
      )}

      {/* Tab bar — Overview/Members derived from URL, Projects is local sub-tab */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => navigate(t.path)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
        {activeTab === "overview" && (
          <>
            <button onClick={() => setLocalTab("overview")}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                localTab === "overview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              Teams
            </button>
            <button onClick={() => setLocalTab("projects")}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                localTab === "projects" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              Projects
            </button>
          </>
        )}
      </div>

      {/* Members tab */}
      {activeTab === "members" && <MembersTab workspaceId={activeWorkspace.id} />}

      {/* Overview: Teams grid */}
      {activeTab === "overview" && localTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgTeams.map((team) => <TeamSummaryCard key={team.id} teamId={team.id} />)}
        </div>
      )}

      {/* Overview: Projects list */}
      {activeTab === "overview" && localTab === "projects" && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_100px_80px_100px_120px] gap-4 px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <span>Project</span><span className="text-center">Status</span><span className="text-center">Team</span><span className="text-right">Progress</span><span className="text-right">Deadline</span>
          </div>
          {orgProjects.map((project) => {
            const team = TEAMS.find((t) => t.id === project.teamId);
            const sc = PROJECT_STATUS_COLOR[project.status];
            return (
              <div key={project.id} className="grid grid-cols-[1fr_100px_80px_100px_120px] gap-4 items-center bg-card border border-border rounded-lg px-4 py-3 hover:border-border/80 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${project.color}18` }}>
                    <FolderOpen className="h-3.5 w-3.5" style={{ color: project.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${sc}15`, color: sc }}>{PROJECT_STATUS_LABEL[project.status]}</span>
                </div>
                <div className="flex justify-center">
                  {team ? <span className="text-lg">{team.icon}</span> : <span className="text-xs text-muted-foreground">—</span>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium text-foreground">{project.progress}%</span>
                  <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("text-xs", project.status === "AT_RISK" ? "text-chart-5 font-medium" : "text-muted-foreground")}>{project.deadline}</span>
                  <p className="text-[11px] text-muted-foreground">{project.openTaskCount} open</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
