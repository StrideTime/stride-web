import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  CheckCircle2, Circle, Plus, Play, Search, ChevronDown,
  List, LayoutGrid, User, Users, MoreHorizontal, Tag as TagIcon, X,
  Check,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import {
  TASKS, PROJECTS, TAGS, USERS, TEAMS, TEAM_MEMBERS,
  type Task, type TaskStatus, type Tag,
} from "../data/mockData";

const CURRENT_USER_ID = "u1";

const DIFF_COLOR: Record<string, string> = {
  EASY: "#98c379", MEDIUM: "#e5c07b", HARD: "#e06c75",
};

function fmtMin(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h ${min}m` : `${h}h`;
}

const COLS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { status: "TODO",        label: "To Do",       color: "#abb2bf" },
  { status: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { status: "IN_REVIEW",   label: "In Review",   color: "#c678dd" },
  { status: "BLOCKED",     label: "Blocked",     color: "#e06c75" },
  { status: "COMPLETED",   label: "Done",        color: "#98c379" },
];

// ─── List task card ───────────────────────────────────────────────────────────

function TaskCard({ task, onChangeStatus }: { task: Task; onChangeStatus: (id: number, s: TaskStatus) => void }) {
  const project  = PROJECTS.find((p) => p.id === task.projectId);
  const assignee = USERS.find((u) => u.id === task.assigneeId);
  const tags     = TAGS.filter((t) => task.tagIds.includes(t.id));
  const done     = task.status === "COMPLETED";
  const active   = task.status === "IN_PROGRESS";
  const isMe     = task.assigneeId === CURRENT_USER_ID;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3 transition-all group overflow-hidden",
        done ? "opacity-50" : "hover:border-border/80",
      )}
      style={{
        backgroundColor: active ? "rgba(97,175,239,0.04)" : "var(--card)",
        borderColor: active ? "#61afef35" : "var(--border)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
        style={{ backgroundColor: project?.color ?? "#abb2bf" }} />
      {/* Status dot */}
      <div className="flex-shrink-0 mt-1">
        <StatusDot status={task.status} onChange={(s) => onChangeStatus(task.id, s)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}>{task.title}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.map((t) => (
              <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${t.color}18`, color: t.color }}>{t.name}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLOR[task.difficulty] }} />
          <span className="capitalize">{task.difficulty.toLowerCase()}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{fmtMin(task.estimatedMinutes)}</span>
          {task.dueDate && <><span className="text-muted-foreground/40">·</span><span>{task.dueDate}</span></>}
        </div>
      </div>
      {/* Assignee */}
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5 ring-2",
        isMe ? "ring-primary/30" : "ring-transparent"
      )} style={{ backgroundColor: `${assignee?.color ?? "#abb2bf"}20`, color: assignee?.color ?? "#abb2bf" }}
        title={assignee?.name ?? "?"}>
        {assignee?.initials ?? "?"}
      </div>
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!done && (
          <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-primary/15 transition-colors" title="Start timer">
            <Play className="h-3.5 w-3.5 text-primary" />
          </button>
        )}
        <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

function BoardView({ tasks, onChangeStatus }: { tasks: Task[]; onChangeStatus: (id: number, s: TaskStatus) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex-shrink-0 w-[260px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <span className="text-[11px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((task) => {
                const project  = PROJECTS.find((p) => p.id === task.projectId);
                const assignee = USERS.find((u) => u.id === task.assigneeId);
                const done = task.status === "COMPLETED";
                return (
                  <div key={task.id} className={cn("bg-card border border-border rounded-xl overflow-hidden group hover:border-border/80 transition-all", done && "opacity-50")}>
                    <div className="h-0.5" style={{ backgroundColor: project?.color ?? "#abb2bf" }} />
                    <div className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <StatusDot status={task.status} onChange={(s) => onChangeStatus(task.id, s)} />
                        <p className={cn("text-xs leading-snug flex-1", done && "line-through text-muted-foreground")}>{task.title}</p>
                        <button className="h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pl-5">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLOR[task.difficulty] }} />
                          {fmtMin(task.estimatedMinutes)}
                        </div>
                        <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                          style={{ backgroundColor: `${assignee?.color ?? "#abb2bf"}20`, color: assignee?.color ?? "#abb2bf" }}>
                          {assignee?.initials ?? "?"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors w-full">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status dot + picker ──────────────────────────────────────────────────────

const STATUS_OPTS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { value: "TODO",        label: "To Do",       color: "#abb2bf" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { value: "IN_REVIEW",   label: "In Review",   color: "#c678dd" },
  { value: "BLOCKED",     label: "Blocked",     color: "#e06c75" },
  { value: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function StatusDot({ status, onChange }: { status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = STATUS_OPTS.find((o) => o.value === status)?.color ?? "#abb2bf";

  // Close on outside click
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
        className="h-3 w-3 rounded-full ring-2 ring-transparent hover:ring-offset-1 hover:ring-border/60 transition-all mt-0.5"
        style={{ backgroundColor: color }}
        title={`Status: ${STATUS_OPTS.find((o) => o.value === status)?.label}`}
      />
      {open && (
        <div className="absolute left-0 top-5 z-30 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1 min-w-[130px]">
          {STATUS_OPTS.map((opt) => (
            <button key={opt.value}
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-left",
                status === opt.value && "bg-muted/60 font-medium")}>
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              <span className="text-foreground">{opt.label}</span>
              {status === opt.value && <Check className="h-3 w-3 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamTasksPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate   = useNavigate();
  const { settings } = useApp();

  const team        = TEAMS.find((t) => t.id === teamId);
  const myMembership = TEAM_MEMBERS.find((tm) => tm.teamId === teamId && tm.userId === CURRENT_USER_ID);
  const isAdmin     = myMembership?.role === "ADMIN";

  const [tasks, setTasks]           = useState(TASKS);
  const [mineOnly, setMineOnly]     = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<TaskStatus | "ALL">("ALL");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [viewMode, setViewMode]     = useState<"list" | "board">(settings.defaultView);

  const changeStatus = (id: number, status: TaskStatus) =>
    setTasks((prev) => prev.map((t) => t.id !== id ? t : { ...t, status }));

  const teamTags  = TAGS.filter((t) => t.workspaceId === team?.workspaceId);
  const members   = TEAM_MEMBERS.filter((tm) => tm.teamId === teamId);

  const filtered = useMemo(() =>
    tasks.filter((t) => {
      if (t.teamId !== teamId) return false;
      if (mineOnly && t.assigneeId !== CURRENT_USER_ID) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (tagFilters.length > 0 && !tagFilters.every((tid) => t.tagIds.includes(tid))) return false;
      return true;
    }),
    [tasks, teamId, mineOnly, search, statusFilter, tagFilters]
  );

  const todo       = filtered.filter((t) => t.status === "TODO").length;
  const inProgress = filtered.filter((t) => t.status === "IN_PROGRESS").length;

  if (!team || !myMembership) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Team not found or you're not a member.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${team.color}18` }}><team.Icon className="h-4 w-4" style={{ color: team.color }} /></div>
            <h1 className="text-foreground">{team.name} Tasks</h1>
            {isAdmin && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: `${team.color}20`, color: team.color }}>Admin</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pl-10">
            <span>{members.length} members</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#61afef" }} />
              {inProgress} in progress
            </span>
            <span className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#abb2bf" }} />
              {todo} to do
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => navigate(`/team/${teamId}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
              Insights
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> New Task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>

        {/* Mine only */}
        <button onClick={() => setMineOnly((v) => !v)}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
            mineOnly ? "border-primary/40 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
          <User className="h-3 w-3" /> Assigned to me
        </button>

        {/* Status */}
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Done</option>
            <option value="BACKLOG">Backlog</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Tag chips */}
        {teamTags.slice(0, 5).map((tag) => {
          const active = tagFilters.includes(tag.id);
          return (
            <button key={tag.id} onClick={() => setTagFilters((p) => active ? p.filter((x) => x !== tag.id) : [...p, tag.id])}
              className={cn("flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all",
                active ? "border-transparent font-medium" : "border-border text-muted-foreground hover:border-border/80")}
              style={active ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` } : {}}>
              <TagIcon className="h-2.5 w-2.5" />{tag.name}{active && <X className="h-2.5 w-2.5 ml-0.5" />}
            </button>
          );
        })}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} tasks</span>
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
        </div>
      </div>

      {/* Task list / board */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {mineOnly ? "No tasks assigned to you on this team." : "No tasks match your filters."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filtered.map((task) => <TaskCard key={task.id} task={task} onChangeStatus={changeStatus} />)}
        </div>
      ) : (
        <BoardView tasks={filtered} onChangeStatus={changeStatus} />
      )}
    </div>
  );
}