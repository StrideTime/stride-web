import { useState, useMemo } from "react";
import {
  Users, UserPlus, Shield, Trash2, Plus, Edit2, ChevronDown, ChevronUp,
  Clock, Banknote, Check, X,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import {
  TEAMS, TEAM_MEMBERS, USERS, WORKSPACE_MEMBERSHIPS,
  type Team, type TeamRole, type WorkspaceRole,
} from "../../../data/mockData";
import { CreateTeamModal, type NewTeamData } from "./CreateTeamModal";
import { InviteMemberModal, type InviteData, type PayType, type ClockInBehavior } from "./InviteMemberModal";
import { PurchaseSeatsModal } from "./PurchaseSeatsModal";
import { EditMemberModal, type MemberEditData } from "../shared/EditMemberModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocalMember {
  userId: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: WorkspaceRole;
  payType: PayType;
  clockIn: ClockInBehavior;
  rate?: string;
}

interface LocalTeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WorkspaceTeamSection() {
  const { activeWorkspace, workspaceRole, wsPermissions } = useApp();
  const isOwner = workspaceRole === "OWNER";

  // ── Mutable state ──
  const [localTeams, setLocalTeams] = useState<Team[]>(() =>
    TEAMS.filter((t) => t.workspaceId === activeWorkspace.id)
  );
  const [localTeamMembers, setLocalTeamMembers] = useState<LocalTeamMember[]>(() =>
    TEAM_MEMBERS.filter((tm) => localTeams.some((t) => t.id === tm.teamId))
  );
  const [localMembers, setLocalMembers] = useState<LocalMember[]>(() => {
    const wsMemberships = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === activeWorkspace.id);
    return wsMemberships.map((wm) => {
      const user = USERS.find((u) => u.id === wm.userId);
      if (!user) return null;
      // Deterministic mock pay/clock based on user index
      const idx = USERS.indexOf(user);
      const payTypes: PayType[] = ["SALARY", "HOURLY", "SALARY", "HOURLY", "HOURLY", "SALARY", "SALARY"];
      const clockIns: ClockInBehavior[] = ["DISABLED", "REQUIRED", "OPTIONAL", "OPTIONAL", "REQUIRED", "DISABLED", "OPTIONAL"];
      return {
        userId: user.id, name: user.name, email: user.email, initials: user.initials, color: user.color, role: wm.role,
        payType: wm.role === "OWNER" ? "SALARY" as PayType : payTypes[idx % payTypes.length],
        clockIn: wm.role === "OWNER" ? "DISABLED" as ClockInBehavior : clockIns[idx % clockIns.length],
        rate: payTypes[idx % payTypes.length] === "HOURLY" ? "45" : undefined,
      };
    }).filter(Boolean) as LocalMember[];
  });

  const [totalSeats, setTotalSeats] = useState(10);
  const usedSeats = localMembers.length;
  const seatPercent = (usedSeats / totalSeats) * 100;

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<"teams" | "members">("teams");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LocalMember | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<{ tm: LocalTeamMember; teamName: string } | null>(null);

  // ── Handlers ──
  function handleCreateTeam(data: NewTeamData) {
    const newTeam: Team = {
      id: `t-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name: data.name,
      Icon: data.Icon,
      color: data.color,
      description: data.description,
    };
    setLocalTeams((prev) => [...prev, newTeam]);
  }

  function handleInvite(data: InviteData) {
    const newMember: LocalMember = {
      userId: `u-${Date.now()}`,
      name: data.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: data.email,
      initials: data.email.slice(0, 2).toUpperCase(),
      color: "#61afef",
      role: data.role,
      payType: data.payType,
      clockIn: data.clockIn,
      rate: data.rate,
    };
    setLocalMembers((prev) => [...prev, newMember]);
  }

  function handleDeleteTeam(teamId: string) {
    setLocalTeams((prev) => prev.filter((t) => t.id !== teamId));
    setLocalTeamMembers((prev) => prev.filter((tm) => tm.teamId !== teamId));
    if (expandedTeamId === teamId) setExpandedTeamId(null);
  }

  function toggleTeamMemberRole(memberId: string) {
    setLocalTeamMembers((prev) =>
      prev.map((tm) => tm.id === memberId ? { ...tm, role: tm.role === "ADMIN" ? "STANDARD" : "ADMIN" } : tm)
    );
  }

  function handleEditSave(data: MemberEditData) {
    if (!editingMember) return;
    setLocalMembers((prev) =>
      prev.map((m) => {
        if (m.userId !== editingMember.userId) return m;
        return {
          ...m,
          role: data.workspaceRole ?? m.role,
          payType: data.payType ?? m.payType,
          rate: data.rate !== undefined ? data.rate : m.rate,
          clockIn: data.clockIn ?? m.clockIn,
        };
      })
    );
    setEditingMember(null);
  }

  function handleTeamMemberEditSave(data: MemberEditData) {
    if (!editingTeamMember) return;
    setLocalTeamMembers((prev) =>
      prev.map((tm) => {
        if (tm.id !== editingTeamMember.tm.id) return tm;
        return { ...tm, role: data.teamRole ?? tm.role };
      })
    );
    setEditingTeamMember(null);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Seat management ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Organization seats</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Using {usedSeats} of {totalSeats} seats</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-foreground">{totalSeats - usedSeats}</span>
            <span className="text-xs text-muted-foreground ml-1">available</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(seatPercent, 100)}%` }} />
          </div>
          <button
            onClick={() => setPurchaseOpen(true)}
            className="w-full text-center text-xs text-primary hover:opacity-80 transition-opacity"
          >
            Purchase additional seats &middot; $10/seat/mo
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button onClick={() => setActiveTab("teams")}
          className={cn("flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === "teams" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Teams ({localTeams.length})
        </button>
        <button onClick={() => setActiveTab("members")}
          className={cn("flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === "members" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Members ({localMembers.length})
        </button>
      </div>

      {/* ── Teams tab ── */}
      {activeTab === "teams" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setCreateTeamOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Create team
            </button>
          </div>

          {localTeams.map((team) => {
            const members = localTeamMembers.filter((tm) => tm.teamId === team.id);
            const isExpanded = expandedTeamId === team.id;

            return (
              <div key={team.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Team header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${team.color}15` }}>
                      <team.Icon className="h-4 w-4" style={{ color: team.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{members.length} members</p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                    </button>
                  </div>
                </div>

                {/* Expanded member list */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {members.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-xs text-muted-foreground">No members yet.</p>
                      </div>
                    ) : (
                      members.map((tm) => {
                        const user = USERS.find((u) => u.id === tm.userId);
                        if (!user) return null;
                        return (
                          <button
                            key={tm.id}
                            onClick={() => setEditingTeamMember({ tm, teamName: team.name })}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                              style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                              {user.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{user.name}</p>
                              <p className="text-[11px] text-muted-foreground">{user.email}</p>
                            </div>
                            <span className={cn(
                              "text-[11px] px-2 py-0.5 rounded-full font-medium",
                              tm.role === "ADMIN" ? "bg-chart-4/10 text-chart-4" : "bg-muted text-muted-foreground"
                            )}>
                              {tm.role === "ADMIN" ? "Admin" : "Standard"}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {localTeams.length === 0 && (
            <div className="text-center py-12 border border-border rounded-xl bg-muted/20">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No teams yet. Create your first team.</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Members tab ── */
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite member
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {localMembers.map((member) => {
              const isEditable = isOwner || (workspaceRole === "ADMIN" && member.role !== "OWNER");
              return (
                <div key={member.userId} className="flex items-center gap-4 px-5 py-3 group">
                  <button
                    onClick={() => isEditable && setEditingMember(member)}
                    className={cn(
                      "flex items-center gap-4 flex-1 min-w-0 text-left",
                      isEditable && "hover:opacity-80 transition-opacity cursor-pointer"
                    )}
                    disabled={!isEditable}
                  >
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: `${member.color}20`, color: member.color }}>
                      {member.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                        {member.role === "OWNER" && <Shield className="h-3.5 w-3.5 text-chart-3" />}
                        {member.role === "ADMIN" && <Shield className="h-3.5 w-3.5 text-chart-4" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                        {wsPermissions.trackCompensation && (
                          <>
                            <span className="text-[10px] text-muted-foreground/60">|</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Banknote className="h-2.5 w-2.5" />
                              {member.payType === "HOURLY" ? `Hourly${member.rate ? ` ($${member.rate}/hr)` : ""}` : "Salary"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                  <span className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                    member.role === "OWNER" ? "bg-chart-3/10 text-chart-3"
                      : member.role === "ADMIN" ? "bg-chart-4/10 text-chart-4"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <CreateTeamModal
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        onCreateTeam={handleCreateTeam}
        workspaceName={activeWorkspace.name}
      />
      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
        workspaceName={activeWorkspace.name}
        trackCompensation={wsPermissions.trackCompensation}
      />
      <PurchaseSeatsModal
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        currentSeats={totalSeats}
        usedSeats={usedSeats}
        pricePerSeat={10}
        onConfirm={setTotalSeats}
      />

      {/* Edit member modal */}
      {editingMember && (
        <EditMemberModal
          open={!!editingMember}
          onOpenChange={(o) => { if (!o) setEditingMember(null); }}
          onSave={handleEditSave}
          memberName={editingMember.name}
          memberEmail={editingMember.email}
          memberInitials={editingMember.initials}
          memberColor={editingMember.color}
          context="workspace"
          workspaceRole={editingMember.role}
          payType={editingMember.payType}
          rate={editingMember.rate}
          clockIn={editingMember.clockIn}
          canEditRole={isOwner}
          canEditCompensation={isOwner || workspaceRole === "ADMIN"}
          canEditClockIn={isOwner || workspaceRole === "ADMIN"}
          trackCompensation={wsPermissions.trackCompensation}
          isCurrentUserOwner={isOwner}
          onTransferOwnership={() => {
            // Transfer: make target OWNER, make current user ADMIN
            setLocalMembers((prev) => prev.map((m) => {
              if (m.userId === editingMember.userId) return { ...m, role: "OWNER" as const };
              if (m.role === "OWNER") return { ...m, role: "ADMIN" as const };
              return m;
            }));
            setEditingMember(null);
          }}
        />
      )}

      {/* Edit team member modal (from expanded team view) */}
      {editingTeamMember && (() => {
        const user = USERS.find((u) => u.id === editingTeamMember.tm.userId);
        if (!user) return null;
        return (
          <EditMemberModal
            open={!!editingTeamMember}
            onOpenChange={(o) => { if (!o) setEditingTeamMember(null); }}
            onSave={handleTeamMemberEditSave}
            memberName={user.name}
            memberEmail={user.email}
            memberInitials={user.initials}
            memberColor={user.color}
            context="team"
            teamName={editingTeamMember.teamName}
            teamRole={editingTeamMember.tm.role}
            clockIn="OPTIONAL"
            canEditRole={isOwner || workspaceRole === "ADMIN"}
            canEditCompensation={isOwner || workspaceRole === "ADMIN"}
            canEditClockIn={isOwner || workspaceRole === "ADMIN"}
            trackCompensation={wsPermissions.trackCompensation}
          />
        );
      })()}
    </div>
  );
}
