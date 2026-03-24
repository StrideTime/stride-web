import { useState } from "react";
import { User, Shield, Clock, Banknote, Timer } from "lucide-react";
import { cn } from "../../ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";
import type { WorkspaceRole } from "../../../data/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PayType = "HOURLY" | "SALARY";
export type ClockInBehavior = "REQUIRED" | "OPTIONAL" | "DISABLED";

export interface InviteData {
  email: string;
  role: WorkspaceRole;
  payType: PayType;
  clockIn: ClockInBehavior;
  rate?: string;
}

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: InviteData) => void;
  workspaceName: string;
  trackCompensation: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InviteMemberModal({ open, onOpenChange, onInvite, workspaceName, trackCompensation }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const [payType, setPayType] = useState<PayType>("SALARY");
  const [clockIn, setClockIn] = useState<ClockInBehavior>("OPTIONAL");
  const [rate, setRate] = useState("");

  const isValidEmail = email.includes("@") && email.includes(".");

  function handleInvite() {
    if (!isValidEmail) return;
    onInvite({ email: email.trim(), role, payType, clockIn, rate: rate || undefined });
    setEmail("");
    setRole("MEMBER");
    setPayType("SALARY");
    setClockIn("OPTIONAL");
    setRate("");
    onOpenChange(false);
  }

  const roles: { value: WorkspaceRole; label: string; desc: string; Icon: typeof User }[] = [
    { value: "MEMBER", label: "Member",        desc: "Can view and complete tasks, track time, and manage their own settings.", Icon: User },
    { value: "ADMIN",  label: "Administrator",  desc: "Full access to organization settings, team management, and billing.", Icon: Shield },
  ];

  const clockOptions: { value: ClockInBehavior; label: string; desc: string }[] = [
    { value: "REQUIRED", label: "Required",  desc: "Must clock in/out daily" },
    { value: "OPTIONAL", label: "Optional",  desc: "Can clock in but not enforced" },
    { value: "DISABLED", label: "Disabled",  desc: "No clock-in tracking" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Send an invitation to join {workspaceName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              autoFocus
              className="w-full text-sm bg-input-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Role picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all",
                    role === r.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    role === r.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <r.Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", role === r.value ? "text-primary" : "text-foreground")}>
                      {r.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Compensation — only when org tracks it */}
          {trackCompensation && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Banknote className="h-3 w-3" /> Compensation type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["SALARY", "HOURLY"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPayType(p); if (p === "SALARY") setRate(""); }}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border text-left transition-all",
                      payType === p
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <p className={cn("text-xs font-medium", payType === p ? "text-primary" : "text-foreground")}>
                      {p === "SALARY" ? "Salary" : "Hourly"}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                      {p === "SALARY" ? "Fixed compensation" : "Paid per hour tracked"}
                    </p>
                  </button>
                ))}
              </div>

              {/* Rate input — hourly only */}
              {payType === "HOURLY" && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hourly rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm bg-input-background border border-border rounded-lg pl-7 pr-16 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/hour</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clock-in behavior */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Clock-in behavior
            </label>
            <div className="grid grid-cols-3 gap-2">
              {clockOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setClockIn(c.value)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg border text-left transition-all",
                    clockIn === c.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <p className={cn("text-xs font-medium", clockIn === c.value ? "text-primary" : "text-foreground")}>
                    {c.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
            {clockIn === "REQUIRED" && (
              <p className="text-[10px] text-chart-4 mt-1.5 flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Member will be prompted to clock in when they open the app.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!isValidEmail}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              isValidEmail
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Send invite
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
