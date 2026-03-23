import { useState } from "react";
import type { FC, CSSProperties, ReactNode } from "react";
import {
  CheckCircle2, Circle, Clock, Star, Plus, MoreHorizontal,
  Coffee, Video, Zap, ArrowRight,
  CalendarClock, Play, Sunrise, LogIn, LogOut, Flame,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { TAGS } from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "TODO";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Task {
  id: number;
  title: string;
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
  { id: 1, title: "Review pull requests",          status: "COMPLETED",  difficulty: "EASY",   project: "Work",         projectColor: "#c678dd", estimatedMinutes: 30,  actualMinutes: 22,  tagIds: ["tag5"] },
  { id: 2, title: "Fix navigation bug",             status: "COMPLETED",  difficulty: "MEDIUM", project: "Work",         projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: ["tag1","tag6"] },
  { id: 3, title: "Weekly standup notes",           status: "COMPLETED",  difficulty: "EASY",   project: "Work",         projectColor: "#c678dd", estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [] },
  { id: 4, title: "Update API documentation",       status: "COMPLETED",  difficulty: "MEDIUM", project: "Side Project", projectColor: "#61afef", estimatedMinutes: 45,  actualMinutes: 38,  tagIds: ["tag5","tag7"] },
  { id: 5, title: "Redesign dashboard components",  status: "IN_PROGRESS",difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 120,                     tagIds: ["tag2","tag6","tag3"] },
  { id: 6, title: "Database migration script",      status: "TODO",       difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 90,                      tagIds: ["tag5"] },
  { id: 7, title: "Team sync meeting prep",         status: "TODO",       difficulty: "EASY",   project: "Work",         projectColor: "#c678dd", estimatedMinutes: 20,                      tagIds: [] },
  { id: 8, title: "Code review feedback",           status: "TODO",       difficulty: "MEDIUM", project: "Work",         projectColor: "#c678dd", estimatedMinutes: 45,                      tagIds: ["tag5","tag4"] },
];

const SCHEDULE: ScheduleEvent[] = [
  { id: 1, label: "Team standup",       startTime: "09:00", durationMinutes: 30,  type: "MEETING",     source: "Google Calendar" },
  { id: 2, label: "Deep work block",    startTime: "10:00", durationMinutes: 120, type: "FOCUS_BLOCK" },
  { id: 3, label: "Lunch",              startTime: "12:30", durationMinutes: 60,  type: "BREAK" },
  { id: 4, label: "1:1 with Sarah",     startTime: "14:00", durationMinutes: 30,  type: "MEETING",     source: "Google Calendar", isNow: true },
  { id: 5, label: "Code review block",  startTime: "15:00", durationMinutes: 60,  type: "TASK" },
  { id: 6, label: "End-of-day review",  startTime: "17:00", durationMinutes: 20,  type: "FOCUS_BLOCK" },
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

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  const done = task.status === "COMPLETED";
  const active = task.status === "IN_PROGRESS";
  const taskTags = TAGS.filter((t) => task.tagIds.includes(t.id));

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3 transition-all group overflow-hidden",
        done ? "opacity-60" : "hover:border-border/80"
      )}
      style={{
        backgroundColor: active ? "rgba(97,175,239,0.05)" : "var(--card)",
        borderColor: active ? "#61afef40" : "var(--border)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg" style={{ backgroundColor: task.projectColor }} />

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
        <p className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}>
          {task.title}
        </p>

        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {taskTags.map((t) => (
              <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${t.color}18`, color: t.color }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs" style={{ color: `${task.projectColor}cc` }}>{task.project}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFFICULTY_DOT[task.difficulty] }} />
          <span className="text-xs text-muted-foreground capitalize">{task.difficulty.toLowerCase()}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
          {done && task.actualMinutes && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">actual {formatMinutes(task.actualMinutes)}</span>
            </>
          )}
        </div>
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

  const toggleTask = (id: number) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "COMPLETED" ? "TODO" : "COMPLETED" } : t));

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
          <h1 className="text-foreground mb-1">Good morning, Alex 👋</h1>
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-5">

        {/* Tasks */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
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
            {pendingTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)}
            {doneTasks.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{doneTasks.length} completed</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {doneTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)}
          </div>

          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
            <button className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Schedule</h2>
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-3 space-y-1.5">
            {SCHEDULE.map((event) => {
              const style = EVENT_STYLES[event.type];
              const Icon = style.icon;
              const isPast = ["09:00","10:00","12:30"].includes(event.startTime);
              return (
                <div key={event.id}
                  className={cn("relative flex items-start gap-2.5 p-2.5 rounded-lg border transition-all", isPast && "opacity-45", event.isNow && "ring-1 ring-primary/30")}
                  style={{ backgroundColor: event.isNow ? "rgba(97,175,239,0.08)" : style.bg, borderColor: event.isNow ? "#61afef50" : style.border }}>
                  {event.isNow && <div className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-5/6 rounded-r" style={{ backgroundColor: "#61afef" }} />}
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: style.border.replace("40","bb") }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium leading-snug", isPast ? "text-muted-foreground" : "text-foreground")}>
                        {event.label}
                      </p>
                      {event.isNow && <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">Now</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.startTime} · {formatMinutes(event.durationMinutes)}
                      {event.source && ` · ${event.source}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" /> Schedule event
            </button>
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
    </div>
  );
}