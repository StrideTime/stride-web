import { useState } from "react";
import {
  UserPlus, Shield, Search, Check, AlertCircle,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import type { ClockInBehavior } from "../workspace-admin/InviteMemberModal";
import { InviteMemberModal, type InviteData } from "../workspace-admin/InviteMemberModal";
import { EditMemberModal, type MemberEditData } from "../shared/EditMemberModal";
import {
  TEAMS, TEAM_MEMBERS, USERS, WORKSPACE_MEMBERSHIPS,
  type TeamRole,
} from "../../../data/mockData";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";

// ─── Extended team member with editable fields ──────────────────────────────

interface ExtendedTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  clockIn: ClockInBehavior;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamMembersSection() {
  const { activeWorkspace, myTeams, allWorkspaceTeams, workspaceRole, wsPermissions, selectedTeamId } = useApp();

  const isOrgAdmin = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const canInviteDirectly = isOrgAdmin || wsPermissions.teamAdminsInvite === "allowed";

  const team = TEAMS.find((t) => t.id === selectedTeamId);

  // Extended members with clock-in behavior
  const [localMembers, setLocalMembers] = useState<ExtendedTeamMember[]>(() => {
    const clockDefaults: ClockInBehavior[] = ["OPTIONAL", "REQUIRED", "OPTIONAL", "DISABLED", "REQUIRED", "OPTIONAL", "DISABLED"];
    return TEAM_MEMBERS
      .filter((tm) => allWorkspaceTeams.some((t) => t.id === tm.teamId))
      .map((tm, idx) => ({
        ...tm,
        clockIn: clockDefaults[idx % clockDefaults.length],
      }));
  });
  const teamMembers = localMembers.filter((tm) => tm.teamId === selectedTeamId);

  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ExtendedTeamMember | null>(null);

  function removeMember(memberId: string) {
    setLocalMembers((prev) => prev.filter((tm) => tm.id !== memberId));
  }

  function handleEditSave(data: MemberEditData) {
    if (!editingMember) return;
    setLocalMembers((prev) =>
      prev.map((tm) => {
        if (tm.id !== editingMember.id) return tm;
        return {
          ...tm,
          role: data.teamRole ?? tm.role,
          clockIn: data.clockIn ?? tm.clockIn,
        };
      })
    );
    setEditingMember(null);
  }

  function handleDirectInvite(data: InviteData) {
    // Simulates: invited to org + auto-added to this team
    const newMember: ExtendedTeamMember = {
      id: `tm-${Date.now()}`,
      teamId: selectedTeamId,
      userId: `u-${Date.now()}`,
      role: "STANDARD",
      clockIn: data.clockIn,
    };
    setLocalMembers((prev) => [...prev, newMember]);
    setInviteOpen(false);
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Select a team from the sidebar to manage members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${team.color}15` }}>
          <team.Icon className="h-4 w-4" style={{ color: team.color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
          <p className="text-xs text-muted-foreground">Members for this team</p>
        </div>
      </div>

      {/* Member list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <team.Icon className="h-3.5 w-3.5" style={{ color: team.color }} />
            <span className="text-sm font-semibold text-foreground">{team.name}</span>
            <span className="text-xs text-muted-foreground">{teamMembers.length} members</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Invite new person to org — only if permission allows */}
            {canInviteDirectly && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-all"
              >
                <UserPlus className="h-3 w-3" /> Invite to org
              </button>
            )}
            {/* Add from existing org members — always available */}
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 transition-all"
            >
              <UserPlus className="h-3 w-3" /> Add member
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {teamMembers.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">No members in this team yet.</p>
            </div>
          ) : (
            teamMembers.map((tm) => {
              const user = USERS.find((u) => u.id === tm.userId);
              if (!user) return null;

              return (
                <button
                  key={tm.id}
                  onClick={() => setEditingMember(tm)}
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
      </div>

      {/* Permission notice */}
      {!isOrgAdmin && !canInviteDirectly && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">Adding members</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              You can add existing organization members to your team. To invite someone new to the organization,
              contact a workspace admin.
            </p>
          </div>
        </div>
      )}

      {!isOrgAdmin && canInviteDirectly && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
          <UserPlus className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">Direct invite enabled</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Your organization allows team admins to invite new members directly.
              Invitees will be added to the organization and this team.
            </p>
          </div>
        </div>
      )}

      {/* ── Add member modal (from existing org members) ── */}
      <AddTeamMemberModal
        open={addOpen}
        onOpenChange={setAddOpen}
        teamId={selectedTeamId}
        teamName={team.name}
        existingMemberIds={teamMembers.map((tm) => tm.userId)}
        workspaceId={activeWorkspace.id}
        onAdd={(userId, role) => {
          setLocalMembers((prev) => [
            ...prev,
            { id: `tm-${Date.now()}`, teamId: selectedTeamId, userId, role, clockIn: "OPTIONAL" as ClockInBehavior },
          ]);
          setAddOpen(false);
        }}
      />

      {/* ── Direct invite modal (org admin or team admin with permission) ── */}
      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleDirectInvite}
        workspaceName={activeWorkspace.name}
        trackCompensation={isOrgAdmin ? wsPermissions.trackCompensation : false}
      />

      {/* ── Edit member modal ── */}
      {editingMember && (() => {
        const user = USERS.find((u) => u.id === editingMember.userId);
        if (!user) return null;
        return (
          <EditMemberModal
            open={!!editingMember}
            onOpenChange={(o) => { if (!o) setEditingMember(null); }}
            onSave={handleEditSave}
            memberName={user.name}
            memberEmail={user.email}
            memberInitials={user.initials}
            memberColor={user.color}
            context="team"
            teamName={team.name}
            teamRole={editingMember.role}
            clockIn={editingMember.clockIn}
            canEditRole={isOrgAdmin || myTeams.some((mt) => mt.team.id === selectedTeamId && mt.role === "ADMIN")}
            canEditCompensation={isOrgAdmin}
            canEditClockIn={isOrgAdmin}
            trackCompensation={wsPermissions.trackCompensation && isOrgAdmin}
          />
        );
      })()}
    </div>
  );
}

// ─── Add team member modal (from existing org members) ──────────────────────

function AddTeamMemberModal({ open, onOpenChange, teamId, teamName, existingMemberIds, workspaceId, onAdd }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  teamId: string;
  teamName: string;
  existingMemberIds: string[];
  workspaceId: string;
  onAdd: (userId: string, role: TeamRole) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [role, setRole] = useState<TeamRole>("STANDARD");

  const wsMembers = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === workspaceId);
  const available = wsMembers
    .filter((wm) => !existingMemberIds.includes(wm.userId))
    .map((wm) => USERS.find((u) => u.id === wm.userId))
    .filter(Boolean)
    .filter((u) => !search || u!.name.toLowerCase().includes(search.toLowerCase()) || u!.email.toLowerCase().includes(search.toLowerCase()));

  function handleAdd() {
    if (!selected) return;
    onAdd(selected, role);
    setSearch("");
    setSelected(null);
    setRole("STANDARD");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to {teamName}</DialogTitle>
          <DialogDescription>Select an organization member to add to this team.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full text-sm bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Member list */}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {available.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">No available members to add.</p>
              </div>
            ) : (
              available.map((user) => {
                if (!user) return null;
                const isSelected = selected === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelected(isSelected ? null : user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                      {user.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Role picker */}
          {selected && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team role</label>
              <div className="flex gap-2">
                {(["STANDARD", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                      role === r
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {r === "ADMIN" ? "Admin" : "Standard"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selected
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Add to team
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

