import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, MoreHorizontal, Play, Search,
  ChevronDown, Tag as TagIcon, FolderOpen, X, ArrowRight,
  List, LayoutGrid, Users, User, Check,
  Clock, Timer, CalendarDays, AlertTriangle, GitPullRequest, Ban, UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { TaskDetailModal, TASK_TYPE_META, PRIORITY_META } from "./TaskDetailModal";
import {
  TASKS, PROJECTS, TAGS, USERS, TEAMS, TEAM_MEMBERS,
  type Task, type TaskStatus, type TaskType, type Priority, type Difficulty, type Project, type Tag,
} from "../data/mockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = "u1";

const DIFF_COLOR: Record<Difficulty, string> = {
  EASY: "#98c379", MEDIUM: "#e5c07b", HARD: "#e06c75",
};

const PROJECT_STATUS_COLORS = {
  ACTIVE: "#98c379", AT_RISK: "#e06c75", ON_HOLD: "#e5c07b", COMPLETED: "#5c6370",
};
const PROJECT_STATUS_LABELS = {
  ACTIVE: "Active", AT_RISK: "At risk", ON_HOLD: "On hold", COMPLETED: "Done",
};

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h ${min}m` : `${h}h`;
}

// ─── Status options ──────────────────────────────────────────────────────────

const STATUS_OPTS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { value: "TODO",        label: "To Do",       color: "#abb2bf" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { value: "IN_REVIEW",   label: "In Review",   color: "#c678dd" },
  { value: "BLOCKED",     label: "Blocked",     color: "#e06c75" },
  { value: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function StatusPill({ status, onChange }: { status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opt = STATUS_OPTS.find((o) => o.value === status) ?? STATUS_OPTS[1];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all hover:opacity-80"
        style={{ backgroundColor: `${opt.color}15`, color: opt.color }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
        {opt.label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1 min-w-[140px]">
          {STATUS_OPTS.map((o) => (
            <button key={o.value}
              onClick={(e) => { e.stopPropagation(); onChange(o.value); setOpen(false); }}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-left",
                status === o.value && "bg-muted/60 font-medium")}>
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
              <span className="text-foreground">{o.label}</span>
              {status === o.value && <Check className="h-3 w-3 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task insight helper ─────────────────────────────────────────────────────
// Returns the single most important thing about this task right now

type InsightLevel = "normal" | "warn" | "danger" | "done";

function getTaskInsight(task: Task): { text: string; level: InsightLevel; Icon: typeof Clock } {
  const worked = task.actualMinutes ?? 0;
  const estimate = task.estimatedMinutes;
  const done = task.status === "COMPLETED";

  if (done) {
    return worked > 0
      ? { text: `Done in ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "done", Icon: Check }
      : { text: "Completed", level: "done", Icon: Check };
  }

  // Blocked is always highest priority
  if (task.status === "BLOCKED") {
    return { text: `Blocked \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "danger", Icon: Ban };
  }

  // In review — show as informational with time spent
  if (task.status === "IN_REVIEW") {
    return { text: `In review \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "normal", Icon: GitPullRequest };
  }

  // Check due date urgency — more actionable than time budget
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { text: `Overdue by ${Math.abs(daysLeft)}d \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "danger", Icon: AlertTriangle };
    }
    if (daysLeft === 0) {
      return { text: `Due today \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "danger", Icon: CalendarDays };
    }
    if (daysLeft <= 2) {
      return { text: `Due in ${daysLeft}d \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "warn", Icon: CalendarDays };
    }
  }

  // Time budget
  if (worked > estimate && estimate > 0) {
    const overBy = worked - estimate;
    return { text: `${formatMinutes(overBy)} over estimate \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "danger", Icon: AlertTriangle };
  }
  if (estimate > 0 && worked >= estimate * 0.8) {
    return { text: `${formatMinutes(worked)} of ${formatMinutes(estimate)} used`, level: "warn", Icon: Clock };
  }

  // Default
  if (worked > 0) {
    return { text: `${formatMinutes(worked)} of ${formatMinutes(estimate)} tracked`, level: "normal", Icon: Clock };
  }
  return { text: `${formatMinutes(estimate)} estimated`, level: "normal", Icon: Timer };
}

const INSIGHT_STYLES: Record<InsightLevel, string> = {
  normal: "text-muted-foreground",
  warn:   "text-chart-4",
  danger: "text-destructive",
  done:   "text-chart-2",
};

// ─── List task card ───────────────────────────────────────────────────────────

function TaskCard({
  task, projectColor, projectName, assigneeName, assigneeInitials, assigneeColor, onChangeStatus, onClick, onStartTimer,
}: {
  task: Task; projectColor: string; projectName: string;
  assigneeName: string; assigneeInitials: string; assigneeColor: string;
  onChangeStatus: (id: number, status: TaskStatus) => void;
  onClick: () => void;
  onStartTimer: () => void;
}) {
  const done = task.status === "COMPLETED";
  const active = task.status === "IN_PROGRESS";
  const statusOpt = STATUS_OPTS.find((o) => o.value === task.status) ?? STATUS_OPTS[1];
  const insight = getTaskInsight(task);
  const typeMeta = TASK_TYPE_META[task.type];
  const prioMeta = PRIORITY_META[task.priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border transition-all group text-left w-full",
        done ? "opacity-45" : "hover:shadow-md hover:border-border/60"
      )}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: projectColor }} />

      <div className="pl-5 pr-4 py-3">
        {/* Row 1: title + assignee */}
        <div className="flex items-start gap-3">
          <p className={cn("text-sm font-medium leading-snug flex-1 min-w-0", done && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!done && (
              <button onClick={(e) => { e.stopPropagation(); onStartTimer(); }} className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all" title="Start timer">
                <Play className="h-3.5 w-3.5 text-primary" />
              </button>
            )}
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{ backgroundColor: `${assigneeColor}15`, color: assigneeColor }} title={assigneeName}>
              {assigneeInitials}
            </div>
          </div>
        </div>

        {/* Row 2: pills + insight */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Jira badge */}
          {task.externalLink && (
            <span className="flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              <span className="h-3 w-3 rounded-sm bg-muted-foreground flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0">
                {task.externalLink.provider === "jira" ? "J" : task.externalLink.provider === "github" ? "G" : "L"}
              </span>
              {task.externalLink.id}
            </span>
          )}

          {/* Type pill */}
          <span className="flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: `${typeMeta.color}10`, color: typeMeta.color }}>
            <typeMeta.Icon className="h-2.5 w-2.5" />
            {typeMeta.label}
          </span>

          {/* Priority pill */}
          <span className={cn("flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
            task.priority === "URGENT" && "animate-pulse")}
            style={{ backgroundColor: `${prioMeta.color}10`, color: prioMeta.color }}>
            <prioMeta.Icon className="h-2.5 w-2.5" />
            {prioMeta.label}
          </span>

          {/* Status */}
          <StatusPill status={task.status} onChange={(s) => { onChangeStatus(task.id, s); }} />

          {/* Insight — pushed right */}
          <div className={cn("flex items-center gap-1.5 text-xs font-medium tabular-nums ml-auto", INSIGHT_STYLES[insight.level])}>
            <insight.Icon className="h-3 w-3 flex-shrink-0" />
            <span>{insight.text}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ task, onChangeStatus, onClick }: { task: Task; onChangeStatus: (id: number, status: TaskStatus) => void; onClick: () => void }) {
  const project = PROJECTS.find((p) => p.id === task.projectId);
  const assignee = USERS.find((u) => u.id === task.assigneeId);
  const done = task.status === "COMPLETED";
  const insight = getTaskInsight(task);
  const typeMeta = TASK_TYPE_META[task.type];
  const prioMeta = PRIORITY_META[task.priority];

  return (
    <button onClick={onClick} className={cn(
      "bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all text-left w-full",
      done ? "opacity-40" : "hover:shadow-md hover:border-border/60"
    )}>
      <div className="h-[3px]" style={{ backgroundColor: project?.color ?? "#abb2bf" }} />
      <div className="p-3 space-y-2">
        {/* Jira badge if linked */}
        {task.externalLink && (
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-muted-foreground flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
              {task.externalLink.provider === "jira" ? "J" : task.externalLink.provider === "github" ? "G" : "L"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">{task.externalLink.id}</span>
          </div>
        )}

        {/* Title */}
        <p className={cn("text-xs font-medium leading-snug", done && "line-through text-muted-foreground")}>{task.title}</p>

        {/* Insight */}
        <div className={cn("flex items-center gap-1.5 text-[11px] font-medium tabular-nums", INSIGHT_STYLES[insight.level])}>
          <insight.Icon className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{insight.text}</span>
        </div>

        {/* Footer: type + priority + assignee */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.5 rounded"
            style={{ backgroundColor: `${typeMeta.color}10`, color: typeMeta.color }}>
            <typeMeta.Icon className="h-2 w-2" />
            {typeMeta.label}
          </span>
          <prioMeta.Icon className={cn("h-3 w-3", task.priority === "URGENT" && "animate-pulse")}
            style={{ color: prioMeta.color }} />
          {assignee && (
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold ml-auto"
              style={{ backgroundColor: `${assignee.color}15`, color: assignee.color }} title={assignee.name}>
              {assignee.initials}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

const ALL_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { status: "TODO",        label: "To Do",       color: "#abb2bf" },
  { status: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { status: "IN_REVIEW",   label: "In Review",   color: "#c678dd" },
  { status: "BLOCKED",     label: "Blocked",     color: "#e06c75" },
  { status: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function BoardView({ tasks, onChangeStatus, onClickTask, visibleStatuses }: {
  tasks: Task[];
  onChangeStatus: (id: number, status: TaskStatus) => void;
  onClickTask: (task: Task) => void;
  visibleStatuses: TaskStatus[];
}) {
  const columns = ALL_COLUMNS.filter((col) => visibleStatuses.includes(col.status));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex-1 min-w-[260px] max-w-[360px] flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <span className="text-[11px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
                {colTasks.length}
              </span>
            </div>

            {/* Column body */}
            <div className="flex-1 rounded-xl bg-muted/20 border border-border/50 p-2 space-y-2 min-h-[120px]">
              {colTasks.map((task) => (
                <BoardCard key={task.id} task={task} onChangeStatus={onChangeStatus} onClick={() => onClickTask(task)} />
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                  No tasks
                </div>
              )}
            </div>

            <button className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors w-full">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared task list renderer ────────────────────────────────────────────────

function TaskList({ tasks, onChangeStatus, onClickTask, onStartTimer, emptyMessage }: {
  tasks: Task[];
  onChangeStatus: (id: number, status: TaskStatus) => void;
  onClickTask: (task: Task) => void;
  onStartTimer: (task: Task, project: { color: string; name: string }) => void;
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage ?? "No tasks match your filters."}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const project = PROJECTS.find((p) => p.id === task.projectId);
        const assignee = USERS.find((u) => u.id === task.assigneeId);
        return (
          <TaskCard
            key={task.id} task={task}
            projectColor={project?.color ?? "#abb2bf"}
            projectName={project?.name ?? "Unknown"}
            assigneeName={assignee?.name ?? "?"} assigneeInitials={assignee?.initials ?? "?"} assigneeColor={assignee?.color ?? "#abb2bf"}
            onChangeStatus={onChangeStatus}
            onClick={() => onClickTask(task)}
            onStartTimer={() => onStartTimer(task, { color: project?.color ?? "#abb2bf", name: project?.name ?? "Unknown" })}
          />
        );
      })}
    </div>
  );
}

// ─── Filter popover ──────────────────────────────────────────────────────────

function FilterPopover({
  wsProjects, projectFilter, onProject,
  wsTags, tagFilters, onToggleTag,
  teamFilter, onTeamFilter, teams,
  assigneeFilter, onAssignee, wsUsers,
  filterCount, onClear,
}: {
  wsProjects: Project[]; projectFilter: string | null; onProject: (v: string | null) => void;
  wsTags: Tag[]; tagFilters: string[]; onToggleTag: (id: string) => void;
  teamFilter: string | null; onTeamFilter: (v: string | null) => void;
  teams: typeof TEAMS;
  assigneeFilter: string | null; onAssignee: (v: string | null) => void;
  wsUsers: typeof USERS;
  filterCount: number; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all",
          filterCount > 0
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:bg-muted"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        Filters
        {filterCount > 0 && (
          <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-xl p-4 min-w-[280px] space-y-4">
          {/* Team */}
          {teams.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team</label>
              <div className="relative">
                <select value={teamFilter ?? ""} onChange={(e) => onTeamFilter(e.target.value || null)}
                  className="w-full appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground cursor-pointer">
                  <option value="">All teams</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Assignee */}
          {wsUsers.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned to</label>
              <div className="relative">
                <select value={assigneeFilter ?? ""} onChange={(e) => onAssignee(e.target.value || null)}
                  className="w-full appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground cursor-pointer">
                  <option value="">Anyone</option>
                  {wsUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Project */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project</label>
            <div className="relative">
              <select value={projectFilter ?? ""} onChange={(e) => onProject(e.target.value || null)}
                className="w-full appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground cursor-pointer">
                <option value="">All projects</option>
                {wsProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Tags */}
          {wsTags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {wsTags.map((tag) => {
                  const active = tagFilters.includes(tag.id);
                  return (
                    <button key={tag.id} onClick={() => onToggleTag(tag.id)}
                      className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all",
                        active ? "border-transparent font-medium" : "border-border text-muted-foreground")}
                      style={active ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` } : {}}>
                      <TagIcon className="h-2.5 w-2.5" />{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear */}
          {filterCount > 0 && (
            <button onClick={() => { onClear(); setOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors">
              <X className="h-3 w-3" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const statusColor = PROJECT_STATUS_COLORS[project.status];
  const statusLabel = PROJECT_STATUS_LABELS[project.status];
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${project.color}18` }}>
            <FolderOpen className="h-4 w-4" style={{ color: project.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{project.name}</p>
            <p className="text-xs text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>{statusLabel}</span>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
          <span className="text-xs text-muted-foreground">{project.openTaskCount} open · {project.deadline}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{project.taskCount} total tasks</span>
        <button className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
          View tasks <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type ScopeTab = "active" | "backlog" | "archive";

const SCOPE_TABS: { id: ScopeTab; label: string; statuses: TaskStatus[] }[] = [
  { id: "backlog", label: "Backlog", statuses: ["BACKLOG"] },
  { id: "active",  label: "Active",  statuses: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
  { id: "archive", label: "Archive", statuses: ["COMPLETED"] },
];

export function TasksPage() {
  const { activeWorkspace, settings, startSession } = useApp();
  const navigate = useNavigate();

  const [scope, setScope] = useState<ScopeTab>("active");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">(settings.defaultView);
  const [tasks, setTasks] = useState(TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const wsProjects = PROJECTS.filter((p) => p.workspaceId === activeWorkspace.id);
  const wsTags = TAGS.filter((t) => t.workspaceId === activeWorkspace.id);
  const wsTasks = tasks.filter((t) => t.workspaceId === activeWorkspace.id);
  const myTeamIds = TEAM_MEMBERS.filter((tm) => tm.userId === CURRENT_USER_ID).map((tm) => tm.teamId);
  const myTeams = TEAMS.filter((t) => myTeamIds.includes(t.id) && t.workspaceId === activeWorkspace.id);

  // All users who have tasks in this workspace (for assignee filter)
  const wsUserIds = [...new Set(wsTasks.map((t) => t.assigneeId))];
  const wsUsers = USERS.filter((u) => wsUserIds.includes(u.id));

  const changeTaskStatus = (id: number, status: TaskStatus) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));

  const scopeStatuses = SCOPE_TABS.find((s) => s.id === scope)!.statuses;

  const filtered = useMemo(() =>
    wsTasks.filter((t) => {
      if (!scopeStatuses.includes(t.status)) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (tagFilters.length > 0 && !tagFilters.every((tid) => t.tagIds.includes(tid))) return false;
      if (teamFilter && t.teamId !== teamFilter) return false;
      if (assigneeFilter && t.assigneeId !== assigneeFilter) return false;
      if (mineOnly && t.assigneeId !== CURRENT_USER_ID) return false;
      if (unassignedOnly && t.assigneeId) return false;
      return true;
    }),
    [wsTasks, scopeStatuses, search, projectFilter, tagFilters, teamFilter, assigneeFilter, mineOnly, unassignedOnly]
  );

  const filterCount = (projectFilter ? 1 : 0) + tagFilters.length + (teamFilter ? 1 : 0) + (assigneeFilter ? 1 : 0);

  // Counts for scope tabs
  const activeCount = wsTasks.filter((t) => ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"].includes(t.status)).length;
  const backlogCount = wsTasks.filter((t) => t.status === "BACKLOG").length;
  const archiveCount = wsTasks.filter((t) => t.status === "COMPLETED").length;
  const scopeCounts: Record<ScopeTab, number> = { active: activeCount, backlog: backlogCount, archive: archiveCount };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-foreground">Tasks</h1>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> New Task
        </button>
      </div>

      {/* Row 1: scope tabs + view toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border gap-0.5">
          {SCOPE_TABS.map((s) => (
            <button key={s.id} onClick={() => setScope(s.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                scope === s.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {s.label}
              <span className={cn(
                "text-[11px] tabular-nums",
                scope === s.id ? "text-foreground/60" : "text-muted-foreground/60"
              )}>{scopeCounts[s.id]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} tasks</span>
          {scope === "active" && (
            <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border gap-0.5">
              <button onClick={() => setViewMode("list")}
                className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                  viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                title="List view"><List className="h-3.5 w-3.5" /></button>
              <button onClick={() => setViewMode("board")}
                className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                  viewMode === "board" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                title="Board view"><LayoutGrid className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: search + toggles + filters */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>

        {/* Filter popover */}
        {/* Quick toggles */}
        <button
          onClick={() => { setMineOnly((v) => !v); if (!mineOnly) setUnassignedOnly(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
            mineOnly ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <User className="h-3.5 w-3.5" />
          My tasks
        </button>
        <button
          onClick={() => { setUnassignedOnly((v) => !v); if (!unassignedOnly) setMineOnly(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
            unassignedOnly ? "border-chart-4/30 bg-chart-4/5 text-chart-4" : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <UserCircle className="h-3.5 w-3.5" />
          Unassigned
        </button>

        {/* Filter popover */}
        <FilterPopover
          wsProjects={wsProjects} projectFilter={projectFilter} onProject={setProjectFilter}
          wsTags={wsTags} tagFilters={tagFilters} onToggleTag={(id) => setTagFilters((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
          teamFilter={teamFilter} onTeamFilter={setTeamFilter} teams={myTeams}
          assigneeFilter={assigneeFilter} onAssignee={setAssigneeFilter} wsUsers={wsUsers}
          filterCount={filterCount}
          onClear={() => { setProjectFilter(null); setTagFilters([]); setTeamFilter(null); setAssigneeFilter(null); }}
        />
      </div>

      {/* Task list / board */}
      {scope === "active" && viewMode === "board"
        ? <BoardView tasks={filtered} onChangeStatus={changeTaskStatus} onClickTask={setSelectedTask} visibleStatuses={scopeStatuses} />
        : <TaskList tasks={filtered} onChangeStatus={changeTaskStatus} onClickTask={setSelectedTask}
            onStartTimer={(task, project) => {
              startSession({ taskId: task.id, taskTitle: task.title, projectColor: project.color, projectName: project.name });
              navigate("/timer");
            }}
            emptyMessage={scope === "backlog" ? "No tasks in backlog." : scope === "archive" ? "No completed tasks." : "No active tasks."} />}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(o) => { if (!o) setSelectedTask(null); }}
          task={selectedTask}
          onChangeStatus={(s) => { changeTaskStatus(selectedTask.id, s); setSelectedTask({ ...selectedTask, status: s }); }}
          onChangePriority={(p) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, priority: p } : t)); setSelectedTask({ ...selectedTask, priority: p }); }}
          onChangeType={(tp) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, type: tp } : t)); setSelectedTask({ ...selectedTask, type: tp }); }}
          onChangeTask={(updates) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, ...updates } : t)); setSelectedTask({ ...selectedTask, ...updates }); }}
        />
      )}
    </div>
  );
}
