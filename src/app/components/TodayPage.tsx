import { useState, useRef, useEffect } from "react";
import type { FC, CSSProperties, ReactNode } from "react";
import {
  CheckCircle2, ChevronDown, Clock, Star, Plus, MoreHorizontal,
  Coffee, Video, Zap, ArrowRight, Timer, AlertTriangle,
  CalendarClock, Play, Sunrise, LogIn, LogOut, Flame, Check,
  ClipboardList, ListChecks,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { TAGS, type Task as FullTask, type TaskStatus as FullTaskStatus, type TaskType as FullTaskType, type Priority as FullPriority } from "../data/mockData";
import { TaskDetailModal, TASK_TYPE_META, PRIORITY_META } from "./TaskDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "TODO";
type TaskType = "FEATURE" | "BUG" | "CHORE" | "RESEARCH";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Task {
  id: number;
  title: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  difficulty: Difficulty;
  project: string;
  projectColor: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  tagIds: string[];
}

interface ScheduleEvent {
  id: number;
  label: string;
  startTime: string;
  durationMinutes: number;
  type: "MEETING" | "FOCUS_BLOCK" | "BREAK" | "TASK";
  source?: string;
  isNow?: boolean;
}

interface TimeEntry {
  id: number;
  label: string;
  startTime: string;
  durationMinutes: number;
  project: string;
  projectColor: string;
  taskTitle?: string;
}

interface Goal {
  id: number;
  title: string;
  progress: number;
  current?: number;
  target?: number;
  unit?: string;
  color: string;
  dueLabel: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TODAY = new Date();
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const todayFormatted = `${DAY_NAMES[TODAY.getDay()]}, ${MONTH_NAMES[TODAY.getMonth()]} ${TODAY.getDate()}`;

const INITIAL_TASKS: Task[] = [
  { id: 1,  title: "Review pull requests",          type: "CHORE",    priority: "MEDIUM", status: "COMPLETED",  difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 30,  actualMinutes: 22,  tagIds: ["tag5"] },
  { id: 2,  title: "Fix navigation bug",             type: "BUG",      priority: "HIGH",   status: "COMPLETED",  difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: ["tag1","tag6"] },
  { id: 3,  title: "Weekly standup notes",           type: "CHORE",    priority: "LOW",    status: "COMPLETED",  difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [] },
  { id: 9,  title: "Refactor auth service",           type: "FEATURE",  priority: "URGENT", status: "IN_PROGRESS",difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 180, actualMinutes: 210, tagIds: ["tag5"] },
  { id: 5,  title: "Redesign dashboard components",  type: "FEATURE",  priority: "HIGH",   status: "IN_PROGRESS",difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 120, actualMinutes: 105, tagIds: ["tag2","tag6","tag3"] },
  { id: 10, title: "Add loading skeletons",          type: "FEATURE",  priority: "LOW",    status: "IN_PROGRESS",difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 25,  tagIds: ["tag2"] },
  { id: 6,  title: "Database migration script",      type: "CHORE",    priority: "HIGH",   status: "TODO",       difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 90,                      tagIds: ["tag5"] },
  { id: 7,  title: "Team sync meeting prep",         type: "CHORE",    priority: "LOW",    status: "TODO",       difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 20,                      tagIds: [] },
  { id: 8,  title: "Code review feedback",           type: "CHORE",    priority: "MEDIUM", status: "TODO",       difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 45,                      tagIds: ["tag5","tag4"] },
];

const SCHEDULE: ScheduleEvent[] = [
  { id: 1, label: "Team standup",       startTime: "09:00", durationMinutes: 30,  type: "MEETING",     source: "Google Calendar" },
  { id: 2, label: "Deep work block",    startTime: "10:00", durationMinutes: 120, type: "FOCUS_BLOCK" },
  { id: 3, label: "Lunch",              startTime: "12:30", durationMinutes: 60,  type: "BREAK" },
  { id: 4, label: "1:1 with Sarah",     startTime: "14:00", durationMinutes: 30,  type: "MEETING",     source: "Google Calendar", isNow: true },
  { id: 5, label: "Code review block",  startTime: "15:00", durationMinutes: 60,  type: "TASK" },
  { id: 6, label: "End-of-day review",  startTime: "17:00", durationMinutes: 20,  type: "FOCUS_BLOCK" },
];

const TIME_ENTRIES: TimeEntry[] = [
  { id: 1, label: "Team standup",                startTime: "09:05", durationMinutes: 25,  project: "Stride",       projectColor: "#c678dd" },
  { id: 2, label: "Fix navigation bug",          startTime: "09:35", durationMinutes: 45,  project: "Stride",       projectColor: "#c678dd", taskTitle: "Fix navigation bug" },
  { id: 3, label: "Redesign dashboard components",startTime: "10:20", durationMinutes: 95,  project: "Side Project", projectColor: "#61afef", taskTitle: "Redesign dashboard components" },
  { id: 4, label: "Lunch",                       startTime: "12:00", durationMinutes: 50,  project: "Break",        projectColor: "#98c379" },
  { id: 5, label: "1:1 with Sarah",              startTime: "13:55", durationMinutes: 35,  project: "Stride",       projectColor: "#c678dd" },
  { id: 6, label: "Refactor auth service",       startTime: "14:35", durationMinutes: 70,  project: "Stride",       projectColor: "#c678dd", taskTitle: "Refactor auth service" },
  { id: 7, label: "Code review feedback",        startTime: "15:50", durationMinutes: 30,  project: "Stride",       projectColor: "#c678dd", taskTitle: "Code review feedback" },
];

const GOALS: Goal[] = [
  { id: 1, title: "Ship Stride v2.0",       progress: 65,                               color: "#61afef", dueLabel: "Apr 30" },
  { id: 2, title: "Run 100km in March",      progress: 43, current: 43, target: 100, unit: "km",    color: "#98c379", dueLabel: "Mar 31" },
  { id: 3, title: "Read 12 books this year", progress: 33, current: 4,  target: 12,  unit: "books", color: "#e5c07b", dueLabel: "Dec 31" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  EASY: "#98c379", MEDIUM: "#e5c07b", HARD: "#e06c75",
};

const EVENT_STYLES: Record<string, { bg: string; border: string; icon: FC<{ className?: string; style?: CSSProperties }> }> = {
  MEETING:     { bg: "rgba(198,120,221,0.10)", border: "#c678dd40", icon: Video },
  FOCUS_BLOCK: { bg: "rgba(97,175,239,0.10)",  border: "#61afef40", icon: Zap },
  BREAK:       { bg: "rgba(152,195,121,0.08)", border: "#98c37940", icon: Coffee },
  TASK:        { bg: "rgba(229,192,123,0.08)", border: "#e5c07b40", icon: CheckCircle2 },
};

// ─── Status pill ─────────────────────────────────────────────────────────────

const TODAY_STATUS_OPTS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "TODO",        label: "To Do",       color: "#abb2bf" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { value: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function StatusPill({ status, onChange }: { status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opt = TODAY_STATUS_OPTS.find((o) => o.value === status) ?? TODAY_STATUS_OPTS[0];

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
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1 min-w-[140px]">
          {TODAY_STATUS_OPTS.map((o) => (
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

// ─── Task Card ────────────────────────────────────────────────────────────────

// ─── Task insight (same logic as TasksPage) ─────────────────────────────────

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

  if (worked > estimate && estimate > 0) {
    const overBy = worked - estimate;
    return { text: `${formatMinutes(overBy)} over estimate \u00B7 ${formatMinutes(worked)} of ${formatMinutes(estimate)}`, level: "danger", Icon: AlertTriangle };
  }
  if (estimate > 0 && worked >= estimate * 0.8) {
    return { text: `${formatMinutes(worked)} of ${formatMinutes(estimate)} used`, level: "warn", Icon: Clock };
  }
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

function TaskCard({ task, onChangeStatus, onClick }: { task: Task; onChangeStatus: (id: number, status: TaskStatus) => void; onClick?: () => void }) {
  const done = task.status === "COMPLETED";
  const active = task.status === "IN_PROGRESS";
  const statusOpt = TODAY_STATUS_OPTS.find((o) => o.value === task.status) ?? TODAY_STATUS_OPTS[0];
  const insight = getTaskInsight(task);
  const typeMeta = TASK_TYPE_META[task.type];
  const prioMeta = PRIORITY_META[task.priority];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border transition-all group cursor-pointer",
        done ? "opacity-45" : "hover:shadow-md hover:border-border/60"
      )}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: task.projectColor }} />

      <div className="pl-5 pr-4 py-3">
        {/* Row 1: title + play */}
        <div className="flex items-start gap-3">
          <p className={cn("text-sm font-medium leading-snug flex-1 min-w-0", done && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          {!done && (
            <button className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all flex-shrink-0" title="Start timer">
              <Play className="h-3.5 w-3.5 text-primary" />
            </button>
          )}
        </div>

        {/* Row 2: pills + insight + project */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: `${typeMeta.color}10`, color: typeMeta.color }}>
            <typeMeta.Icon className="h-2.5 w-2.5" />
            {typeMeta.label}
          </span>
          <span className={cn("flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
            task.priority === "URGENT" && "animate-pulse")}
            style={{ backgroundColor: `${prioMeta.color}10`, color: prioMeta.color }}>
            <prioMeta.Icon className="h-2.5 w-2.5" />
            {prioMeta.label}
          </span>
          <StatusPill status={task.status} onChange={(s) => onChangeStatus(task.id, s)} />

          <div className={cn("flex items-center gap-1.5 text-xs font-medium tabular-nums ml-auto", INSIGHT_STYLES[insight.level])}>
            <insight.Icon className="h-3 w-3 flex-shrink-0" />
            <span>{insight.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Completed section ───────────────────────────────────────────────────────

function CompletedSection({ tasks, onChangeStatus, onClickTask }: { tasks: Task[]; onChangeStatus: (id: number, status: TaskStatus) => void; onClickTask: (task: Task) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
        <span className="text-xs font-medium text-foreground">{tasks.length} completed</span>
        <div className="flex-1" />
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {tasks.map((task) => <TaskCard key={task.id} task={task} onChangeStatus={onChangeStatus} onClick={() => onClickTask(task)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Schedule card (Plan vs Actual) ──────────────────────────────────────────

const GRID_START = 0;  // 12am
const GRID_END = 24;   // 11:59pm
const HOUR_HEIGHT = 52; // px per hour

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(h: number) {
  if (h === 0 || h === 12) return `${h === 0 ? 12 : 12}pm`;
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function ScheduleCard() {
  const [view, setView] = useState<"plan" | "actual">("plan");
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalPlanned = SCHEDULE.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalActual = TIME_ENTRIES.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalHours = GRID_END - GRID_START;
  const gridHeight = totalHours * HOUR_HEIGHT;

  // Current time position
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const gridStartMin = GRID_START * 60;
  const gridEndMin = GRID_END * 60;
  const nowTop = ((nowMinutes - gridStartMin) / 60) * HOUR_HEIGHT;
  const nowLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  // Auto-scroll to center current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const containerHeight = scrollRef.current.clientHeight;
      scrollRef.current.scrollTop = Math.max(0, nowTop - containerHeight / 2);
    }
  }, []);

  function getBlockStyle(startTime: string, durationMinutes: number) {
    const startMin = timeToMinutes(startTime);
    const gridStartMin = GRID_START * 60;
    const topPx = ((startMin - gridStartMin) / 60) * HOUR_HEIGHT;
    const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;
    return { top: `${topPx}px`, height: `${Math.max(heightPx, 20)}px` };
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
          <button onClick={() => setView("plan")}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              view === "plan" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <ClipboardList className="h-3 w-3" />
            Plan
          </button>
          <button onClick={() => setView("actual")}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              view === "actual" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <ListChecks className="h-3 w-3" />
            Actual
          </button>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {view === "plan" ? formatMinutes(totalPlanned) : formatMinutes(totalActual)} total
        </span>
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0">
        <div className="relative" style={{ height: `${gridHeight}px` }}>
          {/* Hour lines */}
          {Array.from({ length: totalHours + 1 }, (_, i) => (
            <div key={i} className="absolute left-0 right-0 flex items-start" style={{ top: `${i * HOUR_HEIGHT}px` }}>
              <span className="text-[10px] text-muted-foreground/50 w-10 text-right pr-2 -mt-1.5 tabular-nums flex-shrink-0">
                {formatHour(GRID_START + i)}
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>
          ))}

          {/* Blocks */}
          {/* Now line */}
          <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: `${nowTop}px` }}>
            <span className="text-[9px] font-semibold text-primary w-10 text-right pr-1.5 tabular-nums flex-shrink-0 -mt-px">
              {nowLabel}
            </span>
            <div className="h-[2px] flex-1 bg-primary rounded-full" />
            <div className="h-2 w-2 rounded-full bg-primary -ml-0.5 flex-shrink-0" />
          </div>

          <div className="absolute left-10 right-3 top-0 bottom-0">
            {view === "plan" ? (
              SCHEDULE.map((event) => {
                const style = EVENT_STYLES[event.type];
                const Icon = style.icon;
                const pos = getBlockStyle(event.startTime, event.durationMinutes);
                const eventEnd = timeToMinutes(event.startTime) + event.durationMinutes;
                const isPast = eventEnd < nowMinutes;
                return (
                  <div key={event.id}
                    className={cn("absolute left-0 right-0 rounded-lg border px-2.5 py-1.5 overflow-hidden transition-all",
                      isPast && "opacity-40", event.isNow && "ring-1 ring-primary/40")}
                    style={{ ...pos, backgroundColor: style.bg, borderColor: style.border }}>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 flex-shrink-0" style={{ color: style.border.replace("40", "bb") }} />
                      <span className="text-xs font-medium text-foreground truncate">{event.label}</span>
                      {event.isNow && <span className="text-[10px] px-1 py-0.5 rounded bg-primary/15 text-primary flex-shrink-0 ml-auto">Now</span>}
                    </div>
                    {event.durationMinutes >= 40 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {event.startTime} · {formatMinutes(event.durationMinutes)}
                        {event.source && ` · ${event.source}`}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              TIME_ENTRIES.map((entry) => {
                const pos = getBlockStyle(entry.startTime, entry.durationMinutes);
                return (
                  <div key={entry.id}
                    className="absolute left-0 right-0 rounded-lg border border-border px-2.5 py-1.5 overflow-hidden hover:border-border/80 transition-colors"
                    style={{ ...pos, backgroundColor: `${entry.projectColor}08` }}>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.projectColor }} />
                      <span className="text-xs font-medium text-foreground truncate">{entry.label}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0 ml-auto">{formatMinutes(entry.durationMinutes)}</span>
                    </div>
                    {entry.durationMinutes >= 40 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {entry.startTime} · <span style={{ color: entry.projectColor }}>{entry.project}</span>
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> {view === "plan" ? "Add event" : "Log time"}
        </button>
        {view === "actual" && totalActual !== totalPlanned && (
          <span className={cn("text-xs tabular-nums", totalActual > totalPlanned ? "text-chart-4" : "text-muted-foreground")}>
            {totalActual > totalPlanned ? "+" : ""}{formatMinutes(totalActual - totalPlanned)} vs plan
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 min-w-0">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TodayPage() {
  const { settings, clockedIn, clockInTime, clockIn, clockOut } = useApp();
  const isDailyMode = settings.timeTrackingMode === "daily";

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const doneTasks = tasks.filter((t) => t.status === "COMPLETED");

  const changeTaskStatus = (id: number, status: TaskStatus) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Convert local Task to full Task shape for the modal
  function toFullTask(t: Task): FullTask {
    return {
      id: t.id, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1",
      title: t.title, type: t.type as FullTaskType, priority: t.priority as FullPriority,
      status: t.status as FullTaskStatus, difficulty: t.difficulty as any,
      estimatedMinutes: t.estimatedMinutes, actualMinutes: t.actualMinutes,
      tagIds: t.tagIds,
    };
  }

  const showClockInPrompt = isDailyMode && !clockedIn;

  const clockInTimeStr = clockInTime
    ? clockInTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  return (
    <div className="p-6 max-w-[1160px] mx-auto">

      {/* Clock-in prompt (daily mode only) */}
      {showClockInPrompt && (
        <div className="mb-5 flex items-center gap-4 p-4 rounded-xl border"
          style={{ backgroundColor: "rgba(229,192,123,0.06)", borderColor: "#e5c07b30" }}>
          <Sunrise className="h-5 w-5 flex-shrink-0" style={{ color: "#e5c07b" }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Start your day</p>
            <p className="text-xs text-muted-foreground mt-0.5">Daily tracking mode is on. Clock in to start recording your work hours.</p>
          </div>
          <button onClick={clockIn}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: "#e5c07b15", color: "#e5c07b", border: "1px solid #e5c07b30" }}>
            <LogIn className="h-3.5 w-3.5" /> Clock In
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1">Good morning, Alex</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            {todayFormatted}
            {isDailyMode && clockedIn && clockInTimeStr && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-chart-2/30 text-chart-2 bg-chart-2/10">
                <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                Clocked in {clockInTimeStr}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDailyMode && clockedIn && (
            <button onClick={clockOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm hover:bg-destructive/20 transition-colors">
              <LogOut className="h-3.5 w-3.5" /> End Day
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Clock className="h-4 w-4" />}        label="Focus Time" value="1h 23m" sub="today"            color="#61afef" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Tasks"      value={`${completedCount} / ${tasks.length}`} sub="completed" color="#98c379" />
        <StatCard icon={<Star className="h-4 w-4" />}         label="Points"     value="340"    sub="+85 this session" color="#e5c07b" />
        <StatCard icon={<Flame className="h-4 w-4" />}        label="Streak"     value="7 days" sub="keep it going!"   color="#e06c75" />
      </div>

      {/* Main 2-column grid */}
      <div className="flex gap-5 mb-5">

        {/* Tasks */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground">Today's Tasks</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{completedCount}/{tasks.length}</span>
            </div>
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-3 space-y-2">
            {pendingTasks.length === 0 && doneTasks.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No tasks for today. Add one to get started.</p>
              </div>
            )}
            {pendingTasks.map((task) => <TaskCard key={task.id} task={task} onChangeStatus={changeTaskStatus} onClick={() => setSelectedTask(task)} />)}
          </div>
          {doneTasks.length > 0 && (
            <CompletedSection tasks={doneTasks} onChangeStatus={changeTaskStatus} onClickTask={setSelectedTask} />
          )}

          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
            <button className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Schedule — Plan vs Actual: relative wrapper so the card doesn't affect flex row height */}
        <div className="w-[320px] flex-shrink-0 relative">
          <div className="absolute inset-0">
            <ScheduleCard />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">Goals</h2>
            <span className="text-xs text-muted-foreground">{GOALS.length} active</span>
          </div>
          <button className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="px-4 py-2 divide-y divide-border">
          {GOALS.map((goal) => (
            <div key={goal.id} className="flex items-center gap-3 py-3">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: goal.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm text-foreground truncate">{goal.title}</p>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{goal.dueLabel}</span>
                    <span className="text-xs font-medium" style={{ color: goal.color }}>{goal.progress}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
                </div>
                {goal.current !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">{goal.current} / {goal.target} {goal.unit}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-8" />

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(o) => { if (!o) setSelectedTask(null); }}
          task={toFullTask(selectedTask)}
          onChangeStatus={(s) => { changeTaskStatus(selectedTask.id, s as TaskStatus); setSelectedTask({ ...selectedTask, status: s as TaskStatus }); }}
          onChangePriority={(p) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, priority: p as Priority } : t)); setSelectedTask({ ...selectedTask, priority: p as Priority }); }}
          onChangeType={(tp) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, type: tp as TaskType } : t)); setSelectedTask({ ...selectedTask, type: tp as TaskType }); }}
          onChangeTask={(updates) => { setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, ...updates as any } : t)); setSelectedTask({ ...selectedTask, ...updates as any }); }}
        />
      )}
    </div>
  );
}