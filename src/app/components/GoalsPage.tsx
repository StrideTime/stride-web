import { useState } from "react";
import {
  Plus, Target, CheckCircle2, Circle, ChevronDown, ChevronUp,
  FolderOpen, Flame, Trophy, TrendingUp, Calendar, Flag,
  MoreHorizontal, Check, Zap, User, Users, Building2, Lock,
  Briefcase, BookOpen, Star, Heart,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { TEAMS, TEAM_MEMBERS, PROJECTS } from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalCategory = "work" | "learning" | "personal" | "health";
type GoalType     = "numeric" | "project" | "milestone";
type GoalStatus   = "on_track" | "at_risk" | "achieved" | "paused";
type GoalScope    = "personal" | "team" | "org";

interface Milestone { id: number; label: string; done: boolean; dueLabel?: string; }

interface Goal {
  id: number; title: string; description: string;
  category: GoalCategory; type: GoalType; status: GoalStatus; scope: GoalScope;
  teamId?: string; projectId?: string;
  progress: number; current?: number; target?: number; unit?: string;
  color: string; dueLabel: string; linkedProject?: string;
  milestones: Milestone[]; weeklyGain?: number; streak: number;
  createdBy: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_GOALS: Goal[] = [
  // Personal
  {
    id: 1, title: "Run 100km in March", description: "Log at least 100km of running across the month.",
    category: "health", type: "numeric", status: "at_risk", scope: "personal",
    progress: 43, current: 43, target: 100, unit: "km", color: "#98c379", dueLabel: "Mar 31", weeklyGain: 12, streak: 3, createdBy: "u1",
    milestones: [{ id: 1, label: "25 km", done: true }, { id: 2, label: "50 km", done: false }, { id: 3, label: "75 km", done: false }, { id: 4, label: "100 km", done: false }],
  },
  {
    id: 2, title: "Read 12 books this year", description: "One book per month minimum.",
    category: "learning", type: "numeric", status: "on_track", scope: "personal",
    progress: 33, current: 4, target: 12, unit: "books", color: "#e5c07b", dueLabel: "Dec 31", weeklyGain: 0, streak: 4, createdBy: "u1",
    milestones: [{ id: 1, label: "Q1 — 3 books", done: true }, { id: 2, label: "Q2 — 3 books", done: false }, { id: 3, label: "Q3 — 3 books", done: false }, { id: 4, label: "Q4 — 3 books", done: false }],
  },
  {
    id: 3, title: "Complete AWS Solutions Architect cert", description: "Pass the AWS SAA exam.",
    category: "learning", type: "milestone", status: "achieved", scope: "personal",
    progress: 100, color: "#56b6c2", dueLabel: "Feb 28", weeklyGain: 0, streak: 6, createdBy: "u1",
    milestones: [{ id: 1, label: "Complete Udemy course", done: true }, { id: 2, label: "Practice exams ×3", done: true }, { id: 3, label: "Pass the exam", done: true }],
  },
  // Team
  {
    id: 4, title: "Ship Stride v2.0 on schedule", description: "Complete all MVP features and launch by Apr 30.",
    category: "work", type: "project", status: "on_track", scope: "team", teamId: "t1", projectId: "p1",
    progress: 65, color: "#61afef", dueLabel: "Apr 30", linkedProject: "Stride v2.0", weeklyGain: 8, streak: 5, createdBy: "u1",
    milestones: [{ id: 1, label: "Auth redesign", done: true }, { id: 2, label: "Task & project pages", done: true }, { id: 3, label: "Timer & reports", done: false, dueLabel: "Apr 1" }, { id: 4, label: "Team admin features", done: false, dueLabel: "Apr 15" }, { id: 5, label: "Public beta", done: false, dueLabel: "Apr 30" }],
  },
  {
    id: 5, title: "Reduce open bug count to under 10", description: "Close or defer outstanding bugs from Q1.",
    category: "work", type: "numeric", status: "at_risk", scope: "team", teamId: "t1",
    progress: 50, current: 12, target: 10, unit: "open bugs", color: "#e06c75", dueLabel: "Mar 31", weeklyGain: 0, streak: 2, createdBy: "u2",
    milestones: [],
  },
  {
    id: 6, title: "Ship refreshed website", description: "Launch new brand refresh and site before Q2.",
    category: "work", type: "project", status: "at_risk", scope: "team", teamId: "t2", projectId: "p2",
    progress: 40, color: "#c678dd", dueLabel: "Mar 28", linkedProject: "Website Redesign", weeklyGain: 5, streak: 3, createdBy: "u6",
    milestones: [{ id: 1, label: "Design mockups approved", done: true }, { id: 2, label: "Dev handoff", done: true }, { id: 3, label: "Content finalized", done: false }, { id: 4, label: "Launch", done: false, dueLabel: "Mar 28" }],
  },
  // Org
  {
    id: 7, title: "Reach $2M ARR by end of Q2", description: "Cross-team revenue target tied to new product launches and marketing push.",
    category: "work", type: "numeric", status: "on_track", scope: "org",
    progress: 58, current: 1.16, target: 2, unit: "M ARR", color: "#e5c07b", dueLabel: "Jun 30", weeklyGain: 0, streak: 8, createdBy: "u1",
    milestones: [{ id: 1, label: "$500K milestone", done: true }, { id: 2, label: "$1M milestone", done: true }, { id: 3, label: "$1.5M milestone", done: false }, { id: 4, label: "$2M milestone", done: false, dueLabel: "Jun 30" }],
  },
  {
    id: 8, title: "Grow headcount to 20 by EOY", description: "Hire across Engineering, Design, and Marketing to hit 20 total headcount.",
    category: "work", type: "numeric", status: "on_track", scope: "org",
    progress: 65, current: 13, target: 20, unit: "people", color: "#98c379", dueLabel: "Dec 31", weeklyGain: 0, streak: 4, createdBy: "u1",
    milestones: [{ id: 1, label: "10 hires done", done: true }, { id: 2, label: "15 hires", done: false }, { id: 3, label: "20 hires", done: false, dueLabel: "Dec 31" }],
  },
];

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; Icon: typeof Target }> = {
  work: { label: "Work", Icon: Briefcase }, learning: { label: "Learning", Icon: BookOpen },
  personal: { label: "Personal", Icon: Star }, health: { label: "Health", Icon: Heart },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: "On track", color: "#98c379" }, at_risk: { label: "At risk", color: "#e06c75" },
  achieved: { label: "Achieved", color: "#56b6c2" }, paused: { label: "Paused", color: "#5c6370" },
};

const TYPE_ICONS: Record<GoalType, typeof Target> = {
  numeric: TrendingUp, project: FolderOpen, milestone: Flag,
};

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onToggleMilestone, onLogProgress, canEdit }: {
  goal: Goal;
  onToggleMilestone: (goalId: number, milestoneId: number) => void;
  onLogProgress: (goalId: number, value: number) => void;
  canEdit: boolean;
}) {
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logVal, setLogVal]   = useState(goal.current ?? 0);

  const cat       = CATEGORY_CONFIG[goal.category];
  const status    = STATUS_CONFIG[goal.status];
  const TypeIcon  = TYPE_ICONS[goal.type];
  const achieved  = goal.status === "achieved";
  const doneMilestones = goal.milestones.filter((m) => m.done).length;
  const teamName  = goal.teamId ? TEAMS.find((t) => t.id === goal.teamId)?.name : undefined;

  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden transition-all", achieved ? "border-border/50 opacity-75" : "border-border")}>
      <div className="h-0.5" style={{ backgroundColor: goal.color }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${goal.color}15` }}><cat.Icon className="h-4 w-4" style={{ color: goal.color }} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{goal.title}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                {achieved && <Trophy className="h-3.5 w-3.5 text-yellow-400" />}
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${status.color}15`, color: status.color }}>{status.label}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{goal.description}</p>
          </div>
          {canEdit ? (
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors flex-shrink-0">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex-shrink-0" title="Set by team admin">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/40 mt-1" />
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {goal.type === "numeric" && goal.current !== undefined ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{goal.current}</span> / {goal.target} {goal.unit}
                </span>
              ) : goal.type === "milestone" ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{doneMilestones}</span> / {goal.milestones.length} milestones
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{goal.linkedProject ?? "Project"}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!achieved && goal.weeklyGain !== undefined && goal.weeklyGain > 0 && (
                <span className="text-[11px] text-chart-2 flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />+{goal.weeklyGain}{goal.unit ?? "%"} this wk
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />{goal.dueLabel}
              </span>
              <span className="text-xs font-semibold" style={{ color: goal.color }}>{goal.progress}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{cat.label}</span>
          {teamName && (
            <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
              <Users className="h-2.5 w-2.5" />{teamName}
            </span>
          )}
          {goal.linkedProject && (
            <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
              <FolderOpen className="h-2.5 w-2.5" />{goal.linkedProject}
            </span>
          )}
          {goal.streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
              <Flame className="h-3 w-3" style={{ color: "#e5c07b" }} />{goal.streak}w
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          {goal.milestones.length > 0 && (
            <button onClick={() => { setMilestonesOpen((v) => !v); setLogOpen(false); }}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                milestonesOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Flag className="h-3 w-3" />
              {doneMilestones}/{goal.milestones.length}
              {milestonesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {!achieved && goal.type === "numeric" && (canEdit || goal.scope === "team") && (
            <button onClick={() => { setLogOpen((v) => !v); setMilestonesOpen(false); }}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                logOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Zap className="h-3 w-3" /> Log progress
            </button>
          )}
        </div>

        {/* Milestones */}
        {milestonesOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {goal.milestones.map((m) => (
              <button key={m.id}
                onClick={() => canEdit && onToggleMilestone(goal.id, m.id)}
                className={cn("w-full flex items-start gap-2.5 text-left", !canEdit && "cursor-default")}>
                {m.done
                  ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: goal.color }} />
                  : <Circle className={cn("h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground", canEdit && "group-hover:text-foreground transition-colors")} />}
                <span className={cn("text-xs flex-1 leading-snug", m.done ? "line-through text-muted-foreground" : "text-foreground")}>{m.label}</span>
                {m.dueLabel && <span className="text-[11px] text-muted-foreground flex-shrink-0">{m.dueLabel}</span>}
              </button>
            ))}
            {canEdit && (
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                <Plus className="h-3 w-3" /> Add milestone
              </button>
            )}
          </div>
        )}

        {/* Log progress */}
        {logOpen && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
                <button onClick={() => setLogVal((v) => Math.max(0, v - 1))} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground text-sm">−</button>
                <input type="number" value={logVal} onChange={(e) => setLogVal(Number(e.target.value))}
                  className="w-14 text-center text-sm text-foreground bg-transparent focus:outline-none" />
                <button onClick={() => setLogVal((v) => v + 1)} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground text-sm">+</button>
              </div>
              <span className="text-xs text-muted-foreground">{goal.unit}</span>
              <button onClick={() => { onLogProgress(goal.id, logVal); setLogOpen(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 ml-auto">
                <Check className="h-3 w-3" /> Save
              </button>
              <button onClick={() => setLogOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create goal form ─────────────────────────────────────────────────────────

function CreateGoalForm({ scope, onClose }: { scope: GoalScope; onClose: () => void }) {
  const [type, setType]         = useState<GoalType>("numeric");
  const [category, setCategory] = useState<GoalCategory>("work");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          New {scope === "personal" ? "personal" : scope === "team" ? "team" : "org"} goal
        </h2>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="p-5 space-y-4">
        <input className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          placeholder="What do you want to achieve?" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map((c) => {
                const CatIcon = CATEGORY_CONFIG[c].Icon;
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all",
                      category === c ? "border-primary/50 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                    <CatIcon className="h-3 w-3" /> {CATEGORY_CONFIG[c].label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
            <div className="space-y-1.5">
              {([
                { id: "numeric", label: "Numeric target", desc: "e.g. 100km" },
                { id: "milestone", label: "Milestone-based", desc: "e.g. ship a feature" },
                { id: "project", label: "Project completion", desc: "linked to a project" },
              ] as { id: GoalType; label: string; desc: string }[]).map((t) => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={cn("w-full flex items-start gap-2.5 px-3 py-2 rounded-lg border text-left transition-all",
                    type === t.id ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted")}>
                  <div className={cn("h-3.5 w-3.5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center",
                    type === t.id ? "border-primary" : "border-muted-foreground/40")}>
                    {type === t.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {type === "numeric" && (
          <div className="grid grid-cols-3 gap-3">
            {[{ label: "Current", placeholder: "0" }, { label: "Target", placeholder: "100" }, { label: "Unit", placeholder: "km, books…" }].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
                <input placeholder={f.placeholder} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            ))}
          </div>
        )}

        {scope === "team" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team</label>
            <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
              <option>Engineering</option>
              <option>Design</option>
            </select>
          </div>
        )}

        {type === "project" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Linked project</label>
            <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
              {PROJECTS.filter((p) => p.workspaceId === "ws3").map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target date</label>
          <input type="date" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
            <Check className="h-3.5 w-3.5" /> Create goal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type ScopeTab = "personal" | "team" | "org";

export function GoalsPage() {
  const { activeWorkspace, workspaceRole, myTeams } = useApp();
  const [goals, setGoals]           = useState<Goal[]>(ALL_GOALS);
  const [scopeTab, setScopeTab]     = useState<ScopeTab>("personal");
  const [statusFilter, setStatus]   = useState<GoalStatus | "all" | "active">("active");
  const [showForm, setShowForm]     = useState(false);

  const isOrgAdmin    = activeWorkspace.type === "ORGANIZATION" && (workspaceRole === "ADMIN" || workspaceRole === "OWNER");
  const adminTeamIds  = myTeams.filter((mt) => mt.role === "ADMIN").map((mt) => mt.team.id);
  const isTeamAdmin   = adminTeamIds.length > 0;
  const isInOrg       = activeWorkspace.type === "ORGANIZATION";

  // What tabs to show
  const tabs: { id: ScopeTab; label: string; icon: typeof User }[] = [
    { id: "personal", label: "Personal", icon: User },
    ...(isInOrg ? [{ id: "team" as ScopeTab, label: "Team",     icon: Users }] : []),
    ...(isInOrg ? [{ id: "org"  as ScopeTab, label: "Org",      icon: Building2 }] : []),
  ];

  const canCreate: Record<ScopeTab, boolean> = {
    personal: true,
    team:     isTeamAdmin,
    org:      isOrgAdmin,
  };

  const scopeGoals = goals.filter((g) => {
    if (g.scope !== scopeTab) return false;
    // Team tab: show goals from teams I'm in
    if (scopeTab === "team") {
      const myTeamIds = TEAM_MEMBERS.filter((tm) => tm.userId === "u1").map((tm) => tm.teamId);
      if (g.teamId && !myTeamIds.includes(g.teamId)) return false;
    }
    // Status filter
    if (statusFilter === "active" && (g.status === "achieved" || g.status === "paused")) return false;
    if (statusFilter !== "all" && statusFilter !== "active" && g.status !== statusFilter) return false;
    return true;
  });

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals((prev) => prev.map((g) => g.id !== goalId ? g : {
      ...g,
      milestones: g.milestones.map((m) => m.id !== milestoneId ? m : { ...m, done: !m.done }),
      progress: (() => {
        const newMs = g.milestones.map((m) => m.id !== milestoneId ? m : { ...m, done: !m.done });
        return Math.round(newMs.filter((m) => m.done).length / (newMs.length || 1) * 100);
      })(),
    }));
  };

  const logProgress = (goalId: number, value: number) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId || !g.target) return g;
      return { ...g, current: value, progress: Math.min(Math.round(value / g.target * 100), 100) };
    }));
  };

  // Stat counts for current scope
  const active   = scopeGoals.filter((g) => g.status !== "achieved" && g.status !== "paused").length;
  const achieved = scopeGoals.filter((g) => g.status === "achieved").length;
  const atRisk   = scopeGoals.filter((g) => g.status === "at_risk").length;

  const accessInfo: Record<ScopeTab, string> = {
    personal: "Goals you've set for yourself.",
    team:     isTeamAdmin ? "Goals for your teams. As a team admin, you can create and edit." : "Goals set by your team admins. You can track progress.",
    org:      isOrgAdmin  ? "Org-wide goals. As a workspace admin, you can create and edit." : "Goals set by org leadership. Visible to all members.",
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1">Goals</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{active} active</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-3 w-3 text-yellow-400" />{achieved} achieved</span>
            {atRisk > 0 && <span className="flex items-center gap-1.5 text-chart-5"><div className="h-1.5 w-1.5 rounded-full bg-chart-5" />{atRisk} at risk</span>}
          </div>
        </div>
        {canCreate[scopeTab] && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> New Goal
          </button>
        )}
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-1 mb-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setScopeTab(t.id); setShowForm(false); }}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              scopeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-5 mt-2">{accessInfo[scopeTab]}</p>

      {/* Create form */}
      {showForm && <CreateGoalForm scope={scopeTab} onClose={() => setShowForm(false)} />}

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border">
          {([{ id: "active", label: "Active" }, { id: "all", label: "All" }, { id: "achieved", label: "Achieved" }, { id: "paused", label: "Paused" }] as { id: typeof statusFilter; label: string }[]).map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                statusFilter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{scopeGoals.length} goal{scopeGoals.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Goal cards */}
      {scopeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No goals here yet.</p>
          {canCreate[scopeTab] && (
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-primary hover:opacity-80">Create one</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scopeGoals.map((goal) => (
            <GoalCard
              key={goal.id} goal={goal}
              onToggleMilestone={toggleMilestone}
              onLogProgress={logProgress}
              canEdit={
                goal.scope === "personal" ||
                (goal.scope === "team" && adminTeamIds.includes(goal.teamId ?? "")) ||
                (goal.scope === "org" && isOrgAdmin)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
