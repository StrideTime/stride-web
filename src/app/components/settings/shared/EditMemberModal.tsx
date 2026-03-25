import { useState, useEffect } from "react";
import { Shield, User, Banknote, Clock, Timer, AlertCircle, ArrowRightLeft } from "lucide-react";
import { cn } from "../../ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";
import type { PayType, ClockInBehavior } from "../workspace-admin/InviteMemberModal";
import type { WorkspaceRole, TeamRole } from "../../../data/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemberEditData {
  // Workspace-level fields
  workspaceRole?: WorkspaceRole;
  // Team-level fields
  teamRole?: TeamRole;
  // Shared fields
  payType?: PayType;
  rate?: string;
  clockIn?: ClockInBehavior;
}

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MemberEditData) => void;

  // Member info
  memberName: string;
  memberEmail: string;
  memberInitials: string;
  memberColor: string;
  memberJobTitle?: string;
  /** Teams the member belongs to, with role + color + icon */
  memberTeams?: { name: string; role: string; color: string }[];

  // Context: "workspace" or "team"
  context: "workspace" | "team";
  teamName?: string;

  // Current values
  workspaceRole?: WorkspaceRole;
  teamRole?: TeamRole;
  payType?: PayType;
  rate?: string;
  clockIn?: ClockInBehavior;

  // Permission flags
  canEditRole: boolean;
  canEditCompensation: boolean;
  canEditClockIn: boolean;
  trackCompensation: boolean;

  // Ownership transfer (workspace context only)
  isCurrentUserOwner?: boolean;
  onTransferOwnership?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditMemberModal({
  open, onOpenChange, onSave,
  memberName, memberEmail, memberInitials, memberColor, memberJobTitle, memberTeams,
  context, teamName,
  workspaceRole: initWsRole, teamRole: initTeamRole,
  payType: initPayType, rate: initRate, clockIn: initClockIn,
  isCurrentUserOwner, onTransferOwnership,
  canEditRole, canEditCompensation, canEditClockIn, trackCompensation,
}: EditMemberModalProps) {
  const [wsRole, setWsRole] = useState(initWsRole ?? "MEMBER");
  const [tRole, setTRole] = useState(initTeamRole ?? "STANDARD");
  const [payType, setPayType] = useState(initPayType ?? "SALARY");
  const [rate, setRate] = useState(initRate ?? "");
  const [clockIn, setClockIn] = useState(initClockIn ?? "OPTIONAL");

  // Reset when modal opens with new values
  useEffect(() => {
    if (open) {
      setWsRole(initWsRole ?? "MEMBER");
      setTRole(initTeamRole ?? "STANDARD");
      setPayType(initPayType ?? "SALARY");
      setRate(initRate ?? "");
      setClockIn(initClockIn ?? "OPTIONAL");
    }
  }, [open, initWsRole, initTeamRole, initPayType, initRate, initClockIn]);

  function handleSave() {
    onSave({
      workspaceRole: context === "workspace" ? wsRole : undefined,
      teamRole: context === "team" ? tRole : undefined,
      payType: trackCompensation ? payType : undefined,
      rate: trackCompensation && payType === "HOURLY" ? rate : undefined,
      clockIn,
    });
    onOpenChange(false);
  }

  const isOwnerRole = initWsRole === "OWNER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
          <DialogDescription>
            {context === "team" && teamName
              ? `Update settings for this member on ${teamName}.`
              : "Update member settings for this organization."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Member info header */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${memberColor}20`, color: memberColor }}>
              {memberInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{memberName}</p>
              {memberJobTitle && (
                <p className="text-xs text-muted-foreground">{memberJobTitle}</p>
              )}
              <p className="text-xs text-muted-foreground">{memberEmail}</p>
              {memberTeams && memberTeams.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {memberTeams.map((t) => (
                    <span key={t.name} className={cn(
                      "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border",
                      t.role === "ADMIN" ? "border-chart-4/20 bg-chart-4/5 text-chart-4" : "border-border bg-muted/30 text-muted-foreground"
                    )}>
                      {t.name}
                      {t.role === "ADMIN" && <Shield className="h-2.5 w-2.5" />}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role */}
          {context === "workspace" && !isOwnerRole && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Organization role
              </label>
              {canEditRole ? (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "MEMBER" as const, label: "Member", desc: "Standard access", Icon: User },
                    { value: "ADMIN" as const, label: "Admin", desc: "Full org management", Icon: Shield },
                  ]).map((r) => (
                    <button key={r.value} onClick={() => setWsRole(r.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                        wsRole === r.value ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      )}>
                      <r.Icon className={cn("h-4 w-4", wsRole === r.value ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <p className={cn("text-xs font-medium", wsRole === r.value ? "text-primary" : "text-foreground")}>{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {initWsRole === "ADMIN" ? "Admin" : "Member"} — only workspace owners can change organization roles.
                </p>
              )}
            </div>
          )}

          {context === "team" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Team role
              </label>
              {canEditRole ? (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "STANDARD" as const, label: "Standard", desc: "Regular team member" },
                    { value: "ADMIN" as const, label: "Team admin", desc: "Can manage team settings" },
                  ]).map((r) => (
                    <button key={r.value} onClick={() => setTRole(r.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                        tRole === r.value ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      )}>
                      <Shield className={cn("h-4 w-4", tRole === r.value ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <p className={cn("text-xs font-medium", tRole === r.value ? "text-primary" : "text-foreground")}>{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {initTeamRole === "ADMIN" ? "Team admin" : "Standard"} — only team admins or workspace admins can change team roles.
                </p>
              )}
            </div>
          )}

          {isOwnerRole && context === "workspace" && (
            <div className="space-y-2">
              <div className="rounded-lg bg-chart-3/5 border border-chart-3/20 px-3 py-2.5 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-chart-3 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Workspace owner</p>
                  <p className="text-[10px] text-muted-foreground">This person owns the workspace. Every workspace must have exactly one owner.</p>
                </div>
              </div>
              {isCurrentUserOwner && onTransferOwnership && (
                <button
                  onClick={onTransferOwnership}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/20 text-left hover:bg-destructive/5 transition-colors"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-destructive/70 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive/80">Transfer ownership</p>
                    <p className="text-[10px] text-muted-foreground">Make this person the new workspace owner. You will become an admin.</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Transfer ownership option for non-owner members (only visible to current owner) */}
          {!isOwnerRole && context === "workspace" && isCurrentUserOwner && onTransferOwnership && (
            <button
              onClick={onTransferOwnership}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-left hover:bg-muted/30 transition-colors"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Transfer ownership to this member</p>
                <p className="text-[10px] text-muted-foreground">They will become the workspace owner. You will be downgraded to admin.</p>
              </div>
            </button>
          )}

          {/* Divider */}
          {(trackCompensation || true) && <div className="h-px bg-border" />}

          {/* Compensation */}
          {trackCompensation && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Banknote className="h-3 w-3" /> Compensation
              </label>
              {canEditCompensation ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {(["SALARY", "HOURLY"] as const).map((t) => (
                      <button key={t}
                        onClick={() => { setPayType(t); if (t === "SALARY") setRate(""); }}
                        className={cn(
                          "px-3 py-2.5 rounded-lg border text-left transition-all",
                          payType === t ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        )}>
                        <p className={cn("text-xs font-medium", payType === t ? "text-primary" : "text-foreground")}>
                          {t === "SALARY" ? "Salary" : "Hourly"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {t === "SALARY" ? "Fixed compensation" : "Paid per hour tracked"}
                        </p>
                      </button>
                    ))}
                  </div>
                  {payType === "HOURLY" && (
                    <div className="mt-2.5 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" placeholder="0.00"
                        className="w-full text-sm bg-input-background border border-border rounded-lg pl-7 pr-16 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/hour</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {initPayType === "HOURLY" ? `Hourly${initRate ? ` ($${initRate}/hr)` : ""}` : "Salary"} — you don't have permission to edit compensation.
                </p>
              )}
            </div>
          )}

          {/* Clock-in behavior */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Clock-in behavior
            </label>
            {canEditClockIn ? (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "REQUIRED" as const, label: "Required", desc: "Must clock in daily" },
                  { value: "OPTIONAL" as const, label: "Optional", desc: "Not enforced" },
                  { value: "DISABLED" as const, label: "Disabled", desc: "No clock-in" },
                ]).map((c) => (
                  <button key={c.value} onClick={() => setClockIn(c.value)}
                    className={cn(
                      "px-2.5 py-2 rounded-lg border text-left transition-all",
                      clockIn === c.value ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    )}>
                    <p className={cn("text-[11px] font-medium", clockIn === c.value ? "text-primary" : "text-foreground")}>{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {initClockIn === "REQUIRED" ? "Required" : initClockIn === "OPTIONAL" ? "Optional" : "Disabled"} — you don't have permission to edit clock-in settings.
              </p>
            )}
            {canEditClockIn && clockIn === "REQUIRED" && (
              <p className="text-[10px] text-chart-4 mt-1.5 flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Member will be prompted to clock in when they open the app.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all">
            Save changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
