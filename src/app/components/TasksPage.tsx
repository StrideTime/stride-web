import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, Plus, MoreHorizontal, Play, Search,
  ChevronDown, Tag as TagIcon, FolderOpen, X, ArrowRight,
  List, LayoutGrid, Users, User,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import {
  TASKS, PROJECTS, TAGS, USERS, TEAMS, TEAM_MEMBERS,
  type Task, type TaskStatus, type Difficulty, type Project, type Tag,
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

// ─── List task card ───────────────────────────────────────────────────────────

function TaskCard({
  task, tags, projectColor, assigneeName, assigneeInitials, assigneeColor, onToggle,
}: {
  task: Task; tags: Tag[]; projectColor: string;
  assigneeName: string; assigneeInitials: string; assigneeColor: string;
  onToggle: (id: number) => void;
}) {
  const done = task.status === "COMPLETED";
  const active = task.status === "IN_PROGRESS";

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3 transition-all group overflow-hidden",
        done ? "opacity-55" : "hover:border-border/80"
      )}
      style={{
        backgroundColor: active ? "rgba(97,175,239,0.05)" : "var(--card)",
        borderColor: active ? "#61afef40" : "var(--border)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg" style={{ backgroundColor: projectColor }} />
      <button onClick={() => onToggle(task.id)} className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform">
        {done ? (
          <CheckCircle2 className="h-4 w-4" style={{ color: "#98c379" }} />
        ) : active ? (
          <div className="h-4 w-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "#61afef" }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#61afef" }} />
          </div>
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
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
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLOR[task.difficulty] }} />
          <span className="text-xs text-muted-foreground capitalize">{task.difficulty.toLowerCase()}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
          {task.dueDate && (
            <><span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{task.dueDate}</span></>
          )}
        </div>
      </div>
      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${assigneeColor}20`, color: assigneeColor }} title={assigneeName}>
        {assigneeInitials}
      </div>
      {!done && (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-primary/15 transition-colors" title="Start timer">
            <Play className="h-3.5 w-3.5 text-primary" />
          </button>
          <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  const project = PROJECTS.find((p) => p.id === task.projectId);
  const assignee = USERS.find((u) => u.id === task.assigneeId);
  const tags = TAGS.filter((t) => task.tagIds.includes(t.id)).slice(0, 2);
  const done = task.status === "COMPLETED";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl overflow-hidden group cursor-pointer transition-all",
      done ? "opacity-50" : "hover:border-border/80 hover:shadow-sm"
    )}>
      <div className="h-0.5" style={{ backgroundColor: project?.color ?? "#abb2bf" }} />
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <button onClick={() => onToggle(task.id)} className="flex-shrink-0 mt-0.5">
            {done
              ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#98c379" }} />
              : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <p className={cn("text-xs leading-snug flex-1", done && "line-through text-muted-foreground")}>{task.title}</p>
          <button className="h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
            <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 pl-5">
            {tags.map((t) => (
              <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${t.color}18`, color: t.color }}>{t.name}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pl-5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLOR[task.difficulty] }} />
            <span className="text-[11px] text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!done && (
              <button className="h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                <Play className="h-2.5 w-2.5 text-primary" />
              </button>
            )}
            {assignee && (
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                style={{ backgroundColor: `${assignee.color}20`, color: assignee.color }} title={assignee.name}>
                {assignee.initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

const BOARD_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { status: "TODO",        label: "To Do",       color: "#abb2bf" },
  { status: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { status: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function BoardView({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: number) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
      {BOARD_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex-shrink-0 w-[272px] flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <span className="text-[11px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-full">
                {colTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {colTasks.map((task) => (
                <BoardCard key={task.id} task={task} onToggle={onToggle} />
              ))}
            </div>
            <button className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors w-full">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared task list renderer ────────────────────────────────────────────────

function TaskList({ tasks, onToggle, emptyMessage }: {
  tasks: Task[];
  onToggle: (id: number) => void;
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
        const tags = TAGS.filter((t) => task.tagIds.includes(t.id));
        return (
          <TaskCard
            key={task.id} task={task} tags={tags}
            projectColor={project?.color ?? "#abb2bf"}
            assigneeName={assignee?.name ?? "?"} assigneeInitials={assignee?.initials ?? "?"} assigneeColor={assignee?.color ?? "#abb2bf"}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}

// ─── Filter toolbar ───────────────────────────────────────────────────────────

function FilterBar({
  search, onSearch,
  statusFilter, onStatus,
  viewMode, onViewMode,
  wsProjects, projectFilter, onProject,
  wsTags, tagFilters, onToggleTag,
  rightSlot,
  filterCount, onClear,
}: {
  search: string; onSearch: (v: string) => void;
  statusFilter: TaskStatus | "ALL"; onStatus: (v: TaskStatus | "ALL") => void;
  viewMode: "list" | "board"; onViewMode: (v: "list" | "board") => void;
  wsProjects: Project[]; projectFilter: string | null; onProject: (v: string | null) => void;
  wsTags: Tag[]; tagFilters: string[]; onToggleTag: (id: string) => void;
  rightSlot?: React.ReactNode;
  filterCount: number; onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search…"
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
      </div>

      {/* Status */}
      <div className="relative">
        <select value={statusFilter} onChange={(e) => onStatus(e.target.value as any)}
          className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
          <option value="ALL">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="BACKLOG">Backlog</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Project */}
      <div className="relative">
        <select value={projectFilter ?? ""} onChange={(e) => onProject(e.target.value || null)}
          className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
          <option value="">All projects</option>
          {wsProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Tag chips */}
      {wsTags.slice(0, 4).map((tag) => {
        const active = tagFilters.includes(tag.id);
        return (
          <button key={tag.id} onClick={() => onToggleTag(tag.id)}
            className={cn("flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all",
              active ? "border-transparent font-medium" : "border-border text-muted-foreground hover:border-border/80")}
            style={active ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` } : {}}>
            <TagIcon className="h-2.5 w-2.5" />{tag.name}{active && <X className="h-2.5 w-2.5 ml-0.5" />}
          </button>
        );
      })}

      {filterCount > 0 && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> Clear
        </button>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {rightSlot}
        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border gap-0.5">
          <button onClick={() => onViewMode("list")}
            className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
              viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            title="List view"><List className="h-3.5 w-3.5" /></button>
          <button onClick={() => onViewMode("board")}
            className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
              viewMode === "board" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            title="Board view"><LayoutGrid className="h-3.5 w-3.5" /></button>
        </div>
      </div>
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

type TabType = "mine" | "team" | "projects";

export function TasksPage() {
  const { activeWorkspace, settings } = useApp();

  // My tasks filters
  const [mySearch, setMySearch] = useState("");
  const [myStatus, setMyStatus] = useState<TaskStatus | "ALL">("ALL");
  const [myProject, setMyProject] = useState<string | null>(null);
  const [myTags, setMyTags] = useState<string[]>([]);

  // Team tasks filters
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatus, setTeamStatus] = useState<TaskStatus | "ALL">("ALL");
  const [teamProject, setTeamProject] = useState<string | null>(null);
  const [teamTags, setTeamTags] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);  // null = all teams
  const [mineOnly, setMineOnly] = useState(false);

  // Shared state
  const [tab, setTab] = useState<TabType>("mine");
  // Default view from settings
  const [viewMode, setViewMode] = useState<"list" | "board">(settings.defaultView);

  const [tasks, setTasks] = useState(TASKS);

  const wsProjects = PROJECTS.filter((p) => p.workspaceId === activeWorkspace.id);
  const wsTags = TAGS.filter((t) => t.workspaceId === activeWorkspace.id);
  const wsTasks = tasks.filter((t) => t.workspaceId === activeWorkspace.id);

  // My teams
  const myTeamIds = TEAM_MEMBERS.filter((tm) => tm.userId === CURRENT_USER_ID).map((tm) => tm.teamId);
  const myTeams = TEAMS.filter((t) => myTeamIds.includes(t.id) && t.workspaceId === activeWorkspace.id);

  const toggleTask = (id: number) =>
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: t.status === "COMPLETED" ? "TODO" : "COMPLETED" } : t
    ));

  // ── My Tasks ──────────────────────────────────────────────────────────────
  const myTasks = useMemo(() =>
    wsTasks.filter((t) => {
      if (t.assigneeId !== CURRENT_USER_ID) return false;
      if (mySearch && !t.title.toLowerCase().includes(mySearch.toLowerCase())) return false;
      if (myStatus !== "ALL" && t.status !== myStatus) return false;
      if (myProject && t.projectId !== myProject) return false;
      if (myTags.length > 0 && !myTags.every((tid) => t.tagIds.includes(tid))) return false;
      return true;
    }),
    [wsTasks, mySearch, myStatus, myProject, myTags]
  );

  const myFilterCount = (myStatus !== "ALL" ? 1 : 0) + (myProject ? 1 : 0) + myTags.length;

  // ── Team Tasks ────────────────────────────────────────────────────────────
  const teamTasks = useMemo(() =>
    wsTasks.filter((t) => {
      if (!t.teamId) return false;
      const relevantTeams = teamFilter ? [teamFilter] : myTeamIds;
      if (!relevantTeams.includes(t.teamId)) return false;
      if (mineOnly && t.assigneeId !== CURRENT_USER_ID) return false;
      if (teamSearch && !t.title.toLowerCase().includes(teamSearch.toLowerCase())) return false;
      if (teamStatus !== "ALL" && t.status !== teamStatus) return false;
      if (teamProject && t.projectId !== teamProject) return false;
      if (teamTags.length > 0 && !teamTags.every((tid) => t.tagIds.includes(tid))) return false;
      return true;
    }),
    [wsTasks, teamFilter, myTeamIds, mineOnly, teamSearch, teamStatus, teamProject, teamTags]
  );

  const teamFilterCount = (teamStatus !== "ALL" ? 1 : 0) + (teamProject ? 1 : 0) + teamTags.length + (mineOnly ? 1 : 0);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const myTasksAll = wsTasks.filter((t) => t.assigneeId === CURRENT_USER_ID);
  const myInProgress = myTasksAll.filter((t) => t.status === "IN_PROGRESS").length;
  const myTodo = myTasksAll.filter((t) => t.status === "TODO").length;
  const myDone = myTasksAll.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1">Tasks</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#61afef" }} />
              {myInProgress} in progress
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#abb2bf" }} />
              {myTodo} to do
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#98c379" }} />
              {myDone} done
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {[
          { id: "mine",     label: "My Tasks",    icon: User },
          { id: "team",     label: "Team Tasks",  icon: Users },
          { id: "projects", label: "Projects",    icon: FolderOpen },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as TabType)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MY TASKS ── */}
      {tab === "mine" && (
        <>
          <FilterBar
            search={mySearch} onSearch={setMySearch}
            statusFilter={myStatus} onStatus={setMyStatus}
            viewMode={viewMode} onViewMode={setViewMode}
            wsProjects={wsProjects} projectFilter={myProject} onProject={setMyProject}
            wsTags={wsTags} tagFilters={myTags} onToggleTag={(id) => setMyTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
            filterCount={myFilterCount}
            onClear={() => { setMyStatus("ALL"); setMyProject(null); setMyTags([]); setMySearch(""); }}
            rightSlot={<span className="text-xs text-muted-foreground">{myTasks.length} tasks</span>}
          />
          {viewMode === "list"
            ? <TaskList tasks={myTasks} onToggle={toggleTask} emptyMessage="No tasks assigned to you." />
            : <BoardView tasks={myTasks} onToggle={toggleTask} />}
        </>
      )}

      {/* ── TEAM TASKS ── */}
      {tab === "team" && (
        <>
          {/* Team + mine-only filter row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Team selector */}
            <div className="relative">
              <select value={teamFilter ?? ""}
                onChange={(e) => setTeamFilter(e.target.value || null)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
                <option value="">All my teams</option>
                {myTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Mine only toggle */}
            <button
              onClick={() => setMineOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                mineOnly ? "border-primary/40 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <User className="h-3 w-3" />
              Mine only
            </button>
          </div>

          <FilterBar
            search={teamSearch} onSearch={setTeamSearch}
            statusFilter={teamStatus} onStatus={setTeamStatus}
            viewMode={viewMode} onViewMode={setViewMode}
            wsProjects={wsProjects} projectFilter={teamProject} onProject={setTeamProject}
            wsTags={wsTags} tagFilters={teamTags} onToggleTag={(id) => setTeamTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
            filterCount={teamFilterCount}
            onClear={() => { setTeamStatus("ALL"); setTeamProject(null); setTeamTags([]); setTeamSearch(""); setMineOnly(false); }}
            rightSlot={<span className="text-xs text-muted-foreground">{teamTasks.length} tasks</span>}
          />

          {viewMode === "list"
            ? <TaskList tasks={teamTasks} onToggle={toggleTask}
              emptyMessage={myTeams.length === 0 ? "You're not in any teams yet." : "No team tasks match your filters."} />
            : <BoardView tasks={teamTasks} onToggle={toggleTask} />}
        </>
      )}

      {/* ── PROJECTS ── */}
      {tab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wsProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
