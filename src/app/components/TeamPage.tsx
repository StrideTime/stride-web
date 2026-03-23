import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Star, Trophy,
  Flame, Info, UserPlus, X, Check, Shield,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import {
  TEAMS, TEAM_MEMBERS, TEAM_MEMBER_STATS, USERS, WORKSPACE_MEMBERSHIPS,
  type TeamMember, type TeamMemberStats, type BurnoutRisk, type User,
} from "../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK = {
  LOW:    { label: "Low risk",  color: "#98c379", icon: TrendingDown },
  MEDIUM: { label: "Caution",   color: "#e5c07b", icon: Minus },
  HIGH:   { label: "At risk",   color: "#e06c75", icon: AlertTriangle },
} satisfies Record<BurnoutRisk, { label: string; color: string; icon: typeof AlertTriangle }>;

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-5">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm min-h-[2px]"
          style={{ height: `${(v / max) * 100}%`, backgroundColor: i === values.length - 1 ? color : `${color}50` }} />
      ))}
    </div>
  );
}

// ─── Add member modal ─────────────────────────────────────────────────────────

function AddMemberModal({ team, currentIds, workspaceId, onAdd, onClose }: {
  team: { name: string; color: string };
  currentIds: string[];
  workspaceId: string;
  onAdd: (userId: string, role: "ADMIN" | "STANDARD") => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [role, setRole] = useState<"ADMIN" | "STANDARD">("STANDARD");
  const [search, setSearch] = useState("");

  // All workspace members not already in the team
  const available = WORKSPACE_MEMBERSHIPS
    .filter((wm) => wm.workspaceId === workspaceId)
    .map((wm) => USERS.find((u) => u.id === wm.userId))
    .filter((u): u is User => !!u && !currentIds.includes(u.id));

  const shown = available.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Add member to {team.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select an org member to invite to this team.</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {/* Member list */}
        <div className="px-5 pb-3 space-y-1 max-h-52 overflow-y-auto">
          {shown.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {available.length === 0 ? "All org members are already on this team." : "No members match your search."}
            </p>
          ) : shown.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(selected === user.id ? null : user.id)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                selected === user.id ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted"
              )}
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                {user.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {selected === user.id && <Check className="h-4 w-4 flex-shrink-0 text-primary" />}
            </button>
          ))}
        </div>

        {/* Role picker + action */}
        <div className="px-5 pb-5 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Role</p>
          <div className="flex gap-2 mb-4">
            {(["STANDARD", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all",
                  role === r ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {r === "ADMIN"
                  ? <Shield className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#61afef" }} />
                  : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />}
                <div className="text-left">
                  <p className="text-xs font-medium leading-none">{r === "ADMIN" ? "Admin" : "Member"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {r === "ADMIN" ? "Full access + configure" : "Can view & complete tasks"}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => { if (selected) { onAdd(selected, role); onClose(); } }}
            disabled={!selected}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              selected ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <UserPlus className="h-4 w-4" /> Add to team
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member, stats, onRemove, canEdit }: {
  member: TeamMember;
  stats?: TeamMemberStats;
  onRemove: () => void;
  canEdit: boolean;
}) {
  const user = USERS.find((u) => u.id === member.userId);
  if (!user) return null;
  const risk = stats ? RISK[stats.burnoutRisk] : null;
  const RiskIcon = risk?.icon;

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: `${user.color}20`, color: user.color }}>
        {user.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ backgroundColor: member.role === "ADMIN" ? "#61afef15" : "#abb2bf15", color: member.role === "ADMIN" ? "#61afef" : "#abb2bf" }}>
            {member.role === "ADMIN" ? "Admin" : "Member"}
          </span>
          {member.userId === "u1" && (
            <span className="text-[10px] text-muted-foreground/60">(you)</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {stats && (
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <span>{stats.tasksCompletedThisWeek} done</span>
          <span>{stats.hoursThisWeek}h</span>
          {risk && RiskIcon && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px]"
              style={{ backgroundColor: `${risk.color}12`, color: risk.color }}>
              <RiskIcon className="h-2.5 w-2.5" />{risk.label}
            </span>
          )}
        </div>
      )}
      {canEdit && member.userId !== "u1" && (
        <button onClick={onRemove} title="Remove from team"
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors flex-shrink-0">
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { teamId }   = useParams<{ teamId: string }>();
  const navigate     = useNavigate();
  const { activeWorkspace } = useApp();

  const team         = TEAMS.find((t) => t.id === teamId);
  const myMembership = TEAM_MEMBERS.find((tm) => tm.teamId === teamId && tm.userId === "u1");
  const isAdmin      = myMembership?.role === "ADMIN";

  // Local member state (seeded from mock, allows add/remove)
  const [members, setMembers] = useState<TeamMember[]>(
    () => TEAM_MEMBERS.filter((tm) => tm.teamId === teamId)
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [shoutoutUser, setShoutoutUser] = useState<string | null>(null);

  const stats = useMemo(() =>
    members.map((m) => TEAM_MEMBER_STATS.find((s) => s.userId === m.userId)).filter(Boolean) as TeamMemberStats[],
    [members]
  );

  const addMember = (userId: string, role: "ADMIN" | "STANDARD") => {
    const newId = `tm_new_${Date.now()}`;
    setMembers((prev) => [...prev, { id: newId, teamId: teamId!, userId, role }]);
  };

  const removeMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  if (!team || !myMembership) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground text-sm">Team not found or you're not a member.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-primary hover:opacity-80">Go back</button>
      </div>
    );
  }

  // Non-admins: show members overview only
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${team.color}20` }}>
            {team.icon}
          </div>
          <div>
            <h1 className="text-foreground">{team.name}</h1>
            <p className="text-sm text-muted-foreground">{team.description} · {members.length} members</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} stats={TEAM_MEMBER_STATS.find((s) => s.userId === m.userId)} onRemove={() => {}} canEdit={false} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          View and work on tasks via <button onClick={() => navigate(`/team/${teamId}/tasks`)} className="text-primary hover:underline">Team Tasks</button>.
        </p>
      </div>
    );
  }

  const sorted = [...stats].sort((a, b) => b.tasksCompletedThisWeek - a.tasksCompletedThisWeek);
  const highRisk = stats.filter((s) => s.burnoutRisk === "HIGH");
  const medRisk  = stats.filter((s) => s.burnoutRisk === "MEDIUM");

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${team.color}20` }}>
            {team.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground">{team.name} Insights</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: `${team.color}20`, color: team.color }}>Admin</span>
            </div>
            <p className="text-sm text-muted-foreground">{team.description} · {members.length} members</p>
          </div>
        </div>
        <button onClick={() => navigate(`/team/${teamId}/tasks`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          View Tasks →
        </button>
      </div>

      {/* ── MEMBERS ────────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{members.length} people on this team</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors border border-primary/20">
            <UserPlus className="h-3.5 w-3.5" /> Add member
          </button>
        </div>
        <div className="divide-y divide-border">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} stats={TEAM_MEMBER_STATS.find((s) => s.userId === m.userId)}
              onRemove={() => removeMember(m.id)} canEdit={isAdmin} />
          ))}
        </div>
      </div>

      {/* ── PERFORMANCE ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground px-0.5">Performance · This week</h2>

        <div className="flex items-start gap-2 p-3 rounded-xl border border-border bg-muted/30">
          <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The <span className="text-foreground">🔥 logging streak</span> reflects consecutive days each member has tracked at least 30 min of work — consistent engagement, not output.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-chart-3" />
            <span className="text-sm font-semibold text-foreground">Leaderboard</span>
            <span className="ml-auto text-xs text-muted-foreground">by tasks completed</span>
          </div>
          <div className="divide-y divide-border">
            {sorted.map((s, i) => {
              const user = USERS.find((u) => u.id === s.userId);
              if (!user) return null;
              const risk = RISK[s.burnoutRisk];
              return (
                <div key={s.userId} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn("text-sm font-bold w-5 text-center flex-shrink-0",
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground")}>
                    {i + 1}
                  </span>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{s.hoursThisWeek}h logged</span>
                      <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5" style={{ color: "#e5c07b" }} />{s.streak}d</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-3">
                    <p className="text-sm font-semibold text-foreground">{s.tasksCompletedThisWeek}</p>
                    <p className="text-[11px] text-muted-foreground">tasks</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${risk.color}10`, color: risk.color }}>
                    {risk.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TRENDS ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground px-0.5">Trends</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Burnout risk */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-chart-5" />
              <span className="text-sm font-semibold text-foreground">Burnout risk</span>
            </div>
            {highRisk.length === 0 && medRisk.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xl mb-1">🎉</p>
                <p className="text-xs text-muted-foreground">All clear — no signals this week.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {[...highRisk, ...medRisk].map((s) => {
                  const user = USERS.find((u) => u.id === s.userId);
                  if (!user) return null;
                  const risk = RISK[s.burnoutRisk];
                  const RiskIcon = risk.icon;
                  return (
                    <div key={s.userId} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${user.color}20`, color: user.color }}>{user.initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{s.hoursThisWeek}h this week</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${risk.color}15`, color: risk.color }}>
                        <RiskIcon className="h-3 w-3" />{risk.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4-week task trend */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">4-week completion</span>
            </div>
            <div className="p-4 space-y-3.5">
              {stats.map((s) => {
                const user = USERS.find((u) => u.id === s.userId);
                if (!user) return null;
                const trend = s.weeklyTaskCount[3] - s.weeklyTaskCount[2];
                return (
                  <div key={s.userId} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: `${user.color}20`, color: user.color }}>{user.initials}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{user.name}</span>
                        <span className={cn("text-[11px] flex items-center gap-0.5",
                          trend > 0 ? "text-chart-2" : trend < 0 ? "text-chart-5" : "text-muted-foreground")}>
                          {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : trend < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                          {Math.abs(trend)} vs last wk
                        </span>
                      </div>
                      <MiniBar values={s.weeklyTaskCount} color={user.color} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between px-4 pb-3">
              {["3w ago","2w ago","Last wk","This wk"].map((l, i) => (
                <span key={i} className="text-[10px] text-muted-foreground flex-1 text-center">{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Shoutout */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">Give a shoutout</span>
          </div>
          <div className="p-5">
            <p className="text-xs text-muted-foreground mb-3">Recognize exceptional work from a team member this week.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.map((s) => {
                const user = USERS.find((u) => u.id === s.userId);
                if (!user || user.id === "u1") return null;
                return (
                  <button key={s.userId} onClick={() => setShoutoutUser(shoutoutUser === user.id ? null : user.id)}
                    className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                      shoutoutUser === user.id ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400" : "border-border text-muted-foreground hover:bg-muted")}>
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                      style={{ backgroundColor: `${user.color}20`, color: user.color }}>{user.initials}</div>
                    {user.name}
                  </button>
                );
              })}
            </div>
            {shoutoutUser && (
              <div className="space-y-3">
                <textarea rows={3}
                  className="w-full bg-muted border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                  placeholder={`What did ${USERS.find(u => u.id === shoutoutUser)?.name} do that stood out?`} />
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/15 text-yellow-400 text-sm hover:bg-yellow-400/25 transition-colors border border-yellow-400/30">
                  <Star className="h-3.5 w-3.5" /> Send shoutout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings link */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-xl px-5 py-3.5 bg-muted/20">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          <span>To configure task types, ticket statuses, and team preferences, go to </span>
          <button onClick={() => navigate("/settings")} className="text-primary hover:underline font-medium">
            Settings → Team
          </button>
        </div>
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <AddMemberModal
          team={team}
          currentIds={members.map((m) => m.userId)}
          workspaceId={team.workspaceId}
          onAdd={addMember}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
