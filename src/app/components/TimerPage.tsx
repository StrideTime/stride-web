import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, Square, Timer, Plus,
  ArrowRightLeft, Pencil, X, Check,
  Calendar, Target, Coffee, ExternalLink,
  CheckCircle2, Circle, ChevronRight, LogOut, Moon,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp, type ActiveSession } from "../context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "TODO" | "IN_PROGRESS";
type DifficultyMode = "categorical" | "story_points";
type CategoricalDifficulty = "trivial" | "easy" | "medium" | "hard" | "extreme";
type StoryPoints = 1 | 2 | 3 | 5 | 8 | 13;
type DifficultyValue = CategoricalDifficulty | StoryPoints;

type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

type FocusTask = {
  id: number;
  title: string;
  project: string;
  projectColor: string;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes?: number;
  dueDate?: string;
  difficulty?: DifficultyValue;
  subtasks?: Subtask[];
};

type EndedSession = {
  session: ActiveSession;
  task: FocusTask | undefined;
  sessionMinutes: number;
};

type TimeEntry = {
  id: number;
  taskTitle: string;
  project: string;
  projectColor: string;
  date: string;
  startTime: string;
  durationMinutes: number;
};

type HistoryFilter = "today" | "week" | "month";
type TabId = "upcoming" | "history";

type ScheduledEventType = "task" | "meeting" | "focus_block" | "break" | "calendar_event";
type ExternalSource = "google_calendar" | "outlook" | "apple_calendar";

type ScheduledEvent = {
  id: string;
  taskId: string | null;
  userId: string;
  startTime: string;       // ISO datetime "2026-03-25T09:00:00"
  durationMinutes: number;
  label: string;
  type: ScheduledEventType;
  externalId: string | null;
  externalSource: ExternalSource | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const FOCUS_TASKS: FocusTask[] = [
  {
    id: 9, title: "Refactor auth service", project: "Side Project", projectColor: "#61afef",
    status: "IN_PROGRESS", estimatedMinutes: 180, actualMinutes: 210,
    dueDate: "2026-03-27", difficulty: "hard" as CategoricalDifficulty,
    subtasks: [
      { id: 1, title: "Extract token validation logic", completed: true },
      { id: 2, title: "Add refresh token support", completed: false },
      { id: 3, title: "Write integration tests", completed: false },
    ],
  },
  {
    id: 5, title: "Redesign dashboard components", project: "Stride v2.0", projectColor: "#c678dd",
    status: "IN_PROGRESS", estimatedMinutes: 120, actualMinutes: 105,
    dueDate: "2026-03-25", difficulty: "medium" as CategoricalDifficulty,
    subtasks: [
      { id: 4, title: "Update card component", completed: true },
      { id: 5, title: "Redesign stats widgets", completed: false },
      { id: 6, title: "Dark mode adjustments", completed: false },
    ],
  },
  {
    id: 10, title: "Add loading skeletons", project: "Stride v2.0", projectColor: "#c678dd",
    status: "IN_PROGRESS", estimatedMinutes: 60, actualMinutes: 25,
    // no difficulty — will show "score it" UI in wrap-up
  },
  {
    id: 6, title: "Database migration script", project: "Side Project", projectColor: "#61afef",
    status: "TODO", estimatedMinutes: 90,
    dueDate: "2026-03-28", difficulty: "hard" as CategoricalDifficulty,
    subtasks: [
      { id: 7, title: "Write migration SQL", completed: false },
      { id: 8, title: "Test on staging", completed: false },
    ],
  },
  {
    id: 7, title: "Team sync meeting prep", project: "Stride v2.0", projectColor: "#c678dd",
    status: "TODO", estimatedMinutes: 20,
    dueDate: "2026-03-25", difficulty: "easy",
  },
  {
    id: 8, title: "Code review feedback", project: "Stride v2.0", projectColor: "#c678dd",
    status: "TODO", estimatedMinutes: 45,
    difficulty: "medium" as CategoricalDifficulty,
  },
  {
    id: 11, title: "Write unit tests for API layer", project: "Side Project", projectColor: "#61afef",
    status: "TODO", estimatedMinutes: 75,
    difficulty: "medium" as CategoricalDifficulty,
  },
];

// ── Workspace difficulty config (mock — would come from workspace settings) ──
const WORKSPACE_DIFFICULTY_MODE: DifficultyMode = "categorical"; // toggle to "story_points" to demo
const WORKSPACE_CLOCK_MODE = true; // toggle to false to demo without clock-in/out
const TODAY_WORKED_MINUTES = 263;  // mock: 4h 23m logged today

const CATEGORICAL_ORDER: CategoricalDifficulty[] = ["trivial", "easy", "medium", "hard", "extreme"];
const CATEGORICAL_LABELS: Record<CategoricalDifficulty, string> = {
  trivial: "Trivial", easy: "Easy", medium: "Medium", hard: "Hard", extreme: "Extreme",
};
const STORY_POINTS: StoryPoints[] = [1, 2, 3, 5, 8, 13];

const ACCURACY_STEPS = [
  { delta: -2, label: "Much easier" },
  { delta: -1, label: "A bit easier" },
  { delta:  0, label: "As expected" },
  { delta:  1, label: "A bit harder" },
  { delta:  2, label: "Much harder" },
] as const;

function getDifficultyAtDelta(current: DifficultyValue, delta: number, mode: DifficultyMode): DifficultyValue {
  if (mode === "categorical") {
    const idx = CATEGORICAL_ORDER.indexOf(current as CategoricalDifficulty);
    return CATEGORICAL_ORDER[Math.max(0, Math.min(CATEGORICAL_ORDER.length - 1, idx + delta))];
  }
  const idx = STORY_POINTS.indexOf(current as StoryPoints);
  return STORY_POINTS[Math.max(0, Math.min(STORY_POINTS.length - 1, idx + delta))];
}

function formatDifficultyValue(value: DifficultyValue, mode: DifficultyMode): string {
  if (mode === "categorical") return CATEGORICAL_LABELS[value as CategoricalDifficulty];
  return `${value} pts`;
}

const SCHEDULED_EVENTS: ScheduledEvent[] = [
  {
    id: "evt-1", taskId: null, userId: "u1",
    startTime: "2026-03-25T09:00:00", durationMinutes: 30,
    label: "Morning standup", type: "meeting",
    externalId: "gcal-001", externalSource: "google_calendar",
    metadata: null, createdAt: "2026-03-24T08:00:00", updatedAt: "2026-03-24T08:00:00", deleted: false,
  },
  {
    id: "evt-2", taskId: "5", userId: "u1",
    startTime: "2026-03-25T10:00:00", durationMinutes: 90,
    label: "Focus: Redesign dashboard components", type: "focus_block",
    externalId: null, externalSource: null,
    metadata: null, createdAt: "2026-03-25T07:00:00", updatedAt: "2026-03-25T07:00:00", deleted: false,
  },
  {
    id: "evt-3", taskId: null, userId: "u1",
    startTime: "2026-03-25T12:00:00", durationMinutes: 60,
    label: "Lunch break", type: "break",
    externalId: null, externalSource: null,
    metadata: null, createdAt: "2026-03-25T07:00:00", updatedAt: "2026-03-25T07:00:00", deleted: false,
  },
  {
    id: "evt-4", taskId: "9", userId: "u1",
    startTime: "2026-03-25T14:00:00", durationMinutes: 120,
    label: "Focus: Refactor auth service", type: "focus_block",
    externalId: null, externalSource: null,
    metadata: null, createdAt: "2026-03-25T07:00:00", updatedAt: "2026-03-25T07:00:00", deleted: false,
  },
  {
    id: "evt-5", taskId: null, userId: "u1",
    startTime: "2026-03-25T16:00:00", durationMinutes: 45,
    label: "Design review call", type: "meeting",
    externalId: "gcal-002", externalSource: "google_calendar",
    metadata: null, createdAt: "2026-03-24T08:00:00", updatedAt: "2026-03-24T08:00:00", deleted: false,
  },
  {
    id: "evt-6", taskId: "8", userId: "u1",
    startTime: "2026-03-25T17:00:00", durationMinutes: 45,
    label: "Focus: Code review feedback", type: "focus_block",
    externalId: null, externalSource: null,
    metadata: null, createdAt: "2026-03-25T07:00:00", updatedAt: "2026-03-25T07:00:00", deleted: false,
  },
];

const BASE_ENTRIES: TimeEntry[] = [
  { id: 1,  taskTitle: "Fix navigation bug",              project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-25", startTime: "09:35", durationMinutes: 45  },
  { id: 2,  taskTitle: "Redesign dashboard components",   project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-25", startTime: "10:20", durationMinutes: 95  },
  { id: 3,  taskTitle: "Refactor auth service",           project: "Side Project", projectColor: "#61afef", date: "2026-03-25", startTime: "14:35", durationMinutes: 70  },
  { id: 4,  taskTitle: "Add loading skeletons",           project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-24", startTime: "09:10", durationMinutes: 55  },
  { id: 5,  taskTitle: "Code review feedback",            project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-24", startTime: "10:30", durationMinutes: 30  },
  { id: 6,  taskTitle: "Database migration script",       project: "Side Project", projectColor: "#61afef", date: "2026-03-24", startTime: "14:00", durationMinutes: 90  },
  { id: 7,  taskTitle: "Refactor auth service",           project: "Side Project", projectColor: "#61afef", date: "2026-03-24", startTime: "15:45", durationMinutes: 65  },
  { id: 8,  taskTitle: "Write unit tests for API layer",  project: "Side Project", projectColor: "#61afef", date: "2026-03-23", startTime: "10:00", durationMinutes: 80  },
  { id: 9,  taskTitle: "Redesign dashboard components",   project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-23", startTime: "13:15", durationMinutes: 110 },
  { id: 10, taskTitle: "Team sync meeting prep",          project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-22", startTime: "08:50", durationMinutes: 20  },
  { id: 11, taskTitle: "Fix navigation bug",              project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-22", startTime: "09:20", durationMinutes: 50  },
  { id: 12, taskTitle: "Database migration script",       project: "Side Project", projectColor: "#61afef", date: "2026-03-18", startTime: "11:00", durationMinutes: 120 },
  { id: 13, taskTitle: "Code review feedback",            project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-15", startTime: "14:30", durationMinutes: 45  },
  { id: 14, taskTitle: "Add loading skeletons",           project: "Stride v2.0",  projectColor: "#c678dd", date: "2026-03-12", startTime: "10:00", durationMinutes: 60  },
  { id: 15, taskTitle: "Refactor auth service",           project: "Side Project", projectColor: "#61afef", date: "2026-03-10", startTime: "09:00", durationMinutes: 90  },
];

const TODAY      = "2026-03-25";
const WEEK_DATES = ["2026-03-22", "2026-03-23", "2026-03-24", "2026-03-25"];
const MONTH      = "2026-03";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function secondsToMinutes(s: number) { return Math.floor(s / 60); }

function formatDate(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDue(date: string) {
  const d = new Date(date + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

// ─── Step slider ─────────────────────────────────────────────────────────────
// A discrete slider where tick marks + labels align perfectly with each step.
// fillFrom="start" fills left-to-right; fillFrom=N fills outward from step N.

const THUMB_R = 8; // thumb radius in px

function StepSlider({
  count, value, onChange, labels,
  fillFrom = "start",
  color = "var(--foreground)",
  colorNeg,
  colorPos,
}: {
  count: number;
  value: number;
  onChange: (i: number) => void;
  labels: string[];
  fillFrom?: "start" | number;
  color?: string;
  colorNeg?: string;
  colorPos?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function idxFromClientX(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = clientX - rect.left - THUMB_R;
    const w = rect.width - THUMB_R * 2;
    return Math.round(Math.max(0, Math.min(1, x / w)) * (count - 1));
  }

  function handleMouseDown(e: { clientX: number; preventDefault(): void }) {
    e.preventDefault();
    onChange(idxFromClientX(e.clientX));
    const onMove = (ev: MouseEvent) => onChange(idxFromClientX(ev.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const p = count === 1 ? 0 : value / (count - 1);

  let fillL = 0, fillR = 0, fillColor = color, showFill = true;

  if (fillFrom === "start") {
    fillL = 0; fillR = 1 - p; fillColor = color;
  } else {
    const fp = fillFrom / (count - 1);
    if (value < fillFrom)      { fillL = p;  fillR = 1 - fp; fillColor = colorNeg ?? color; }
    else if (value > fillFrom) { fillL = fp; fillR = 1 - p;  fillColor = colorPos ?? color; }
    else                       { showFill = false; }
  }

  const activeColor = showFill ? fillColor : color;

  // shared CSS helper for positioning along the track
  const trackPos = (frac: number) =>
    `calc(${THUMB_R}px + ${frac} * (100% - ${THUMB_R * 2}px))`;

  return (
    <div className="select-none">
      {/* Track + thumb */}
      <div
        ref={trackRef}
        className="relative cursor-pointer"
        style={{ height: THUMB_R * 2 + 4 }}
        onMouseDown={handleMouseDown}
      >
        {/* Track background */}
        <div className="absolute rounded-full bg-muted/60"
          style={{ top: "50%", transform: "translateY(-50%)", left: THUMB_R, right: THUMB_R, height: 8 }} />

        {/* Fill */}
        {showFill && (
          <div className="absolute rounded-full"
            style={{
              top: "50%", transform: "translateY(-50%)",
              left: trackPos(fillL),
              right: trackPos(fillR),
              height: 8,
              backgroundColor: fillColor,
            }} />
        )}

        {/* Tick marks */}
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              top: "50%", left: trackPos(count === 1 ? 0 : i / (count - 1)),
              transform: "translate(-50%, -50%)",
              width: 3, height: 3,
              backgroundColor: i === value ? "transparent" : "var(--border)",
            }} />
        ))}

        {/* Thumb */}
        <div className="absolute rounded-full border-2 transition-colors"
          style={{
            top: "50%", left: trackPos(p),
            transform: "translate(-50%, -50%)",
            width: THUMB_R * 2, height: THUMB_R * 2,
            backgroundColor: activeColor,
            borderColor: "var(--background)",
          }} />
      </div>

      {/* Labels */}
      <div className="relative mt-1" style={{ height: 16 }}>
        {labels.map((label, i) => label ? (
          <span key={i} className="absolute text-[10px] -translate-x-1/2 whitespace-nowrap"
            style={{
              left: trackPos(count === 1 ? 0 : i / (count - 1)),
              color: i === value ? activeColor : "var(--muted-foreground)",
              opacity: i === value ? 1 : 0.5,
              fontWeight: i === value ? 500 : 400,
            }}>
            {label}
          </span>
        ) : null)}
      </div>
    </div>
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function RingTimer({ seconds, prevMin, estimatedMin, running, color }: {
  seconds: number; prevMin: number; estimatedMin: number; running: boolean; color: string;
}) {
  const sessionMin = secondsToMinutes(seconds);
  const totalMin   = prevMin + sessionMin;
  const size = 144, stroke = 8, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = estimatedMin > 0 ? Math.min(totalMin / estimatedMin, 1) : 0;
  const isOver = estimatedMin > 0 && totalMin > estimatedMin;
  const ringColor = isOver ? "#e06c75" : color;
  const offset = circ * (1 - pct);

  const remaining = estimatedMin - totalMin;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={ringColor} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-mono font-semibold text-foreground tabular-nums">
            {formatSeconds(seconds)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">session</span>
        </div>
      </div>

      {estimatedMin > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {formatMinutes(totalMin)} / {formatMinutes(estimatedMin)}
          </p>
          <p className={cn("text-xs mt-0.5", isOver ? "text-destructive" : "text-muted-foreground")}>
            {isOver
              ? `↑ ${formatMinutes(-remaining)} over`
              : `${formatMinutes(remaining)} remaining`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Active banner ────────────────────────────────────────────────────────────

function ActiveBanner({ session, seconds, running, task, onStop }: {
  session: ActiveSession; seconds: number; running: boolean;
  task?: FocusTask; onStop: () => void;
}) {
  const prevMin = task?.actualMinutes ?? 0;
  const estimatedMin = task?.estimatedMinutes ?? 0;
  const totalMin = prevMin + secondsToMinutes(seconds);
  const isOver = estimatedMin > 0 && totalMin > estimatedMin;
  const dueLabel = task?.dueDate ? formatDue(task.dueDate) : null;
  const hasStats = estimatedMin > 0 || dueLabel || task?.difficulty;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-5 flex flex-col items-center gap-4">
        <RingTimer seconds={seconds} prevMin={prevMin} estimatedMin={estimatedMin}
          running={running} color={session.projectColor} />

        <div className="text-center">
          <p className="text-base font-semibold text-foreground">{session.taskTitle}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: session.projectColor }} />
            <span className="text-xs text-muted-foreground">{session.projectName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onStop}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:text-foreground hover:bg-muted/80 transition-colors">
            <Square className="h-3.5 w-3.5" /> End session
          </button>
        </div>
      </div>

      {/* Stats footer */}
      {hasStats && (
        <div className="border-t border-border px-6 py-3 flex items-center gap-6 bg-muted/20">
          {estimatedMin > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Time</p>
              <p className={cn("text-sm font-medium tabular-nums", isOver && "text-destructive")}>
                {formatMinutes(totalMin)}
                <span className="text-xs font-normal text-muted-foreground ml-1">/ {formatMinutes(estimatedMin)}</span>
              </p>
            </div>
          )}
          {dueLabel && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Due</p>
              <p className="text-sm font-medium text-foreground">{dueLabel}</p>
            </div>
          )}
          {task?.difficulty && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Difficulty</p>
              <p className="text-sm font-medium text-foreground">{formatDifficultyValue(task.difficulty, WORKSPACE_DIFFICULTY_MODE)}</p>
            </div>
          )}
          {task?.subtasks && task.subtasks.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Subtasks</p>
              <p className="text-sm font-medium text-foreground">
                {task.subtasks.filter(s => s.completed).length}
                <span className="text-muted-foreground font-normal">/{task.subtasks.length}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Idle state ───────────────────────────────────────────────────────────────

function IdleState() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10 flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Timer className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">No active session. Pick a task below to start.</p>
    </div>
  );
}

// ─── Switch dialog ────────────────────────────────────────────────────────────

function SwitchDialog({ current, next, elapsedSeconds, onConfirm, onCancel }: {
  current: ActiveSession; next: ActiveSession; elapsedSeconds: number;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <p className="text-sm font-semibold text-foreground mb-1">Switch session?</p>
        <p className="text-xs text-muted-foreground mb-4">
          Log {formatSeconds(elapsedSeconds)} on <strong className="text-foreground">{current.taskTitle}</strong> and
          switch to <strong className="text-foreground">{next.taskTitle}</strong>?
        </p>
        <div className="flex gap-2">
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: next.projectColor }}>
            Switch
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit entry dialog ────────────────────────────────────────────────────────

function EditEntryDialog({ entry, onSave, onCancel }: {
  entry: TimeEntry; onSave: (e: TimeEntry) => void; onCancel: () => void;
}) {
  const [title, setTitle]       = useState(entry.taskTitle);
  const [start, setStart]       = useState(entry.startTime);
  const [duration, setDuration] = useState(String(entry.durationMinutes));

  function handleSave() {
    onSave({ ...entry, taskTitle: title, startTime: start, durationMinutes: Math.max(1, parseInt(duration) || 1) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">Edit entry</p>
          <button onClick={onCancel} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Task</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
              <input value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Check className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled event helpers ──────────────────────────────────────────────────

function eventStartDate(evt: ScheduledEvent) {
  return new Date(evt.startTime);
}

function eventEndDate(evt: ScheduledEvent) {
  return new Date(new Date(evt.startTime).getTime() + evt.durationMinutes * 60_000);
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

type EventStatus = "past" | "active" | "upcoming";

function getEventStatus(evt: ScheduledEvent, now: Date): EventStatus {
  const start = eventStartDate(evt);
  const end   = eventEndDate(evt);
  if (now >= end)   return "past";
  if (now >= start) return "active";
  return "upcoming";
}

const EVENT_TYPE_META: Record<ScheduledEventType, { icon: React.ReactNode; label: string; color: string }> = {
  focus_block:    { icon: <Target   className="h-3 w-3" />, label: "Focus block",   color: "#c678dd" },
  meeting:        { icon: <Calendar className="h-3 w-3" />, label: "Meeting",        color: "#61afef" },
  break:          { icon: <Coffee   className="h-3 w-3" />, label: "Break",          color: "#98c379" },
  task:           { icon: <Target   className="h-3 w-3" />, label: "Task",           color: "#e5c07b" },
  calendar_event: { icon: <Calendar className="h-3 w-3" />, label: "Event",          color: "#56b6c2" },
};

const SOURCE_LABEL: Record<ExternalSource, string> = {
  google_calendar: "Google",
  outlook:         "Outlook",
  apple_calendar:  "Apple",
};

// ─── Upcoming tab ─────────────────────────────────────────────────────────────

function UpcomingTab({ activeSession, onStart, onSwitch }: {
  activeSession: ActiveSession | null;
  onStart: (s: ActiveSession) => void;
  onSwitch: (s: ActiveSession) => void;
}) {
  const now = new Date();

  const events = SCHEDULED_EVENTS
    .filter((e) => !e.deleted)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const firstUpcomingIdx = events.findIndex((e) => getEventStatus(e, now) !== "past");

  function sessionForEvent(evt: ScheduledEvent): ActiveSession {
    const linkedTask = evt.taskId ? FOCUS_TASKS.find((t) => String(t.id) === evt.taskId) : null;
    return {
      taskId: linkedTask?.id ?? 0,
      taskTitle: evt.label,
      projectColor: linkedTask?.projectColor ?? EVENT_TYPE_META[evt.type].color,
      projectName: linkedTask?.project ?? EVENT_TYPE_META[evt.type].label,
    };
  }

  return (
    <div className="space-y-1">
      {events.map((evt, idx) => {
        const status = getEventStatus(evt, now);
        const meta   = EVENT_TYPE_META[evt.type];
        const linkedTask = evt.taskId
          ? FOCUS_TASKS.find((t) => String(t.id) === evt.taskId)
          : null;
        const startLabel = formatEventTime(evt.startTime);
        const endLabel   = formatEventTime(eventEndDate(evt).toISOString());
        const isCurrentSession = activeSession?.taskTitle === evt.label;

        const showNowDivider = idx === firstUpcomingIdx && firstUpcomingIdx > 0;

        return (
          <div key={evt.id}>
            {showNowDivider && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Now</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <div className={cn(
              "group flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors",
              status === "active"
                ? "border-border bg-card"
                : status === "past"
                  ? "border-transparent opacity-40"
                  : "border-transparent hover:border-border/50 hover:bg-card/50"
            )}>
              {/* Time column */}
              <div className="flex-shrink-0 w-[64px] text-right pt-0.5">
                <p className={cn("text-xs font-medium tabular-nums", status === "past" ? "text-muted-foreground" : "text-foreground")}>
                  {startLabel}
                </p>
                <p className="text-[10px] text-muted-foreground">{endLabel}</p>
              </div>

              {/* Color bar */}
              <div className="flex-shrink-0 w-0.5 self-stretch rounded-full mt-0.5"
                style={{ backgroundColor: status === "past" ? "transparent" : meta.color }} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    status === "past" ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {evt.label}
                  </p>
                  {evt.externalSource && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 flex-shrink-0">
                      <ExternalLink className="h-2.5 w-2.5" />
                      {SOURCE_LABEL[evt.externalSource]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-1 text-xs" style={{ color: meta.color }}>
                    {meta.icon}
                    <span className="text-muted-foreground">{meta.label}</span>
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground">{formatMinutes(evt.durationMinutes)}</span>
                  {linkedTask && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTask.projectColor }} />
                      <span className="text-xs text-muted-foreground truncate">{linkedTask.project}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Start / Switch button — all non-past events */}
              {status !== "past" && !isCurrentSession && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const s = sessionForEvent(evt);
                    activeSession ? onSwitch(s) : onStart(s);
                  }}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    status === "active" ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    activeSession ? "bg-muted text-muted-foreground hover:text-foreground" : "text-black"
                  )}
                  style={!activeSession ? { backgroundColor: linkedTask?.projectColor ?? meta.color } : undefined}
                >
                  {activeSession
                    ? <><ArrowRightLeft className="h-3 w-3" /> Switch</>
                    : <><Play className="h-3 w-3" /> Start</>}
                </button>
              )}
              {isCurrentSession && status !== "past" && (
                <span className="flex-shrink-0 text-[11px] text-muted-foreground px-1">active</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ liveEntry, resolvedEntries, onEditEntry }: {
  liveEntry: TimeEntry | null;
  resolvedEntries: TimeEntry[];
  onEditEntry: (updated: TimeEntry) => void;
}) {
  const [histFilter, setHistFilter] = useState<HistoryFilter>("today");
  const [editTarget, setEditTarget] = useState<TimeEntry | null>(null);

  const allVisible = liveEntry ? [liveEntry, ...resolvedEntries] : resolvedEntries;

  const filtered = (() => {
    if (histFilter === "today") return allVisible.filter((e) => e.date === TODAY);
    if (histFilter === "week")  return allVisible.filter((e) => WEEK_DATES.includes(e.date));
    return allVisible.filter((e) => e.date.startsWith(MONTH));
  })();

  const grouped = filtered.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] ?? []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const totalMin = filtered.reduce((s, e) => s + e.durationMinutes, 0);

  const HIST_FILTERS: { id: HistoryFilter; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week",  label: "This week" },
    { id: "month", label: "This month" },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {HIST_FILTERS.map(({ id, label }) => (
            <button key={id} onClick={() => setHistFilter(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                histFilter === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{formatMinutes(totalMin)} total</span>
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <p className="text-sm text-muted-foreground">No entries for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayItems = grouped[date];
            const dayTotal = dayItems.reduce((s, e) => s + e.durationMinutes, 0);

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <p className="text-xs text-muted-foreground">
                    {date === TODAY ? "Today" : formatDate(date)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatMinutes(dayTotal)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {dayItems.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                      {item.id < 0 ? (
                        <div className="relative flex-shrink-0">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.projectColor }} />
                          <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: item.projectColor }} />
                        </div>
                      ) : (
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.projectColor }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{item.project}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{formatMinutes(item.durationMinutes)}</p>
                          <p className="text-xs text-muted-foreground">{item.startTime}{item.id < 0 ? " · now" : ""}</p>
                        </div>
                        {item.id > 0 && (
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setEditTarget(item); }}
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTarget && (
        <EditEntryDialog
          entry={editTarget}
          onSave={(updated) => { onEditEntry(updated); setEditTarget(null); }}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ─── Difficulty section ───────────────────────────────────────────────────────

function DifficultySection({ task, mode, onChange }: {
  task: FocusTask | undefined;
  mode: DifficultyMode;
  onChange: (value: DifficultyValue | null) => void;
}) {
  const [accuracyIdx, setAccuracyIdx] = useState(2); // 0–4, center = "As expected"
  const [scoreIdx, setScoreIdx] = useState(2);       // default to middle of scale

  const accuracyDelta = accuracyIdx - 2;

  // ── Task already has a score: accuracy slider ──
  if (task?.difficulty !== undefined) {
    const mappedValue = getDifficultyAtDelta(task.difficulty, accuracyDelta, mode);

    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          How did it feel?
        </p>

        <StepSlider
          count={5}
          value={accuracyIdx}
          onChange={(i) => {
            setAccuracyIdx(i);
            onChange(getDifficultyAtDelta(task.difficulty!, i - 2, mode));
          }}
          labels={["Easier", "", "As expected", "", "Harder"]}
          fillFrom={2}
          colorNeg="#10b981"
          colorPos="#e06c75"
        />

        {/* Consolidated estimate → result row */}
        <div className="flex items-center gap-2 mt-3 h-5">
          {accuracyDelta === 0 ? (
            <span className="text-xs text-muted-foreground/40">
              Est: {formatDifficultyValue(task.difficulty, mode)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: accuracyDelta < 0 ? "#10b981" : "#e06c75" }}>
              <span className="text-muted-foreground/50 font-normal">
                {formatDifficultyValue(task.difficulty, mode)}
              </span>
              <span>→</span>
              <span>{formatDifficultyValue(mappedValue, mode)}</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── No score yet: scoring slider ──
  const steps = mode === "categorical" ? CATEGORICAL_ORDER : STORY_POINTS;
  const labels = mode === "categorical"
    ? CATEGORICAL_ORDER.map((d) => CATEGORICAL_LABELS[d])
    : STORY_POINTS.map(String);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Score difficulty</p>
        <span className="text-sm font-medium text-foreground">
          {formatDifficultyValue(steps[scoreIdx] as DifficultyValue, mode)}
        </span>
      </div>

      <StepSlider
        count={steps.length}
        value={scoreIdx}
        onChange={(i) => {
          setScoreIdx(i);
          onChange(steps[i] as DifficultyValue);
        }}
        labels={labels}
        fillFrom="start"
      />
    </div>
  );
}

// ─── Add subtask row ──────────────────────────────────────────────────────────

function AddSubtaskRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const trimmed = value.trim();
    if (trimmed) { onAdd(trimmed); setValue(""); }
    else setActive(false);
  }

  function handleKeyDown(e: { key: string; preventDefault(): void }) {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setValue(""); setActive(false); }
  }

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors text-muted-foreground/50 hover:text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-sm">Add subtask</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20">
      <Plus className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder="New subtask…"
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
      />
    </div>
  );
}

// ─── Wrap-up flow ─────────────────────────────────────────────────────────────

type WrapUpStep = "progress" | "difficulty" | "next_task";

function WrapUpFlow({ ended, onPickTask, onDone }: {
  ended: EndedSession;
  onPickTask: (s: ActiveSession) => void;
  onDone: () => void;
}) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(ended.task?.subtasks ?? []);
  const [progressPct, setProgressPct] = useState(0);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<DifficultyValue | null>(null);
  const [progressMode, setProgressMode] = useState<"estimate" | "subtasks">("estimate");

  const task = ended.task;
  const sessionMin = ended.sessionMinutes;
  const totalMin = (task?.actualMinutes ?? 0) + sessionMin;
  const originallyHadSubtasks = (ended.task?.subtasks?.length ?? 0) > 0;
  const hasSubtasks = subtasks.length > 0;

  const isComplete = hasSubtasks
    ? subtasks.every((s) => s.completed)
    : progressPct === 100;

  const upcomingTasks = FOCUS_TASKS.filter((t) => t.status === "TODO").slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{ended.session.taskTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatMinutes(sessionMin)} this session
              {task?.estimatedMinutes && ` · ${formatMinutes(totalMin)} / ${formatMinutes(task.estimatedMinutes)} total`}
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-500/70 flex-shrink-0 pt-0.5">
            <Check className="h-3 w-3" /> Logged
          </span>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Progress section */}
          {originallyHadSubtasks || hasSubtasks ? (
            /* Subtask checklist */
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtasks</p>
                <span className="text-[11px] text-muted-foreground/50">
                  {subtasks.filter(s => s.completed).length} / {subtasks.length}
                </span>
              </div>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {subtasks.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSubtasks((prev) => prev.map((s) => s.id === sub.id ? { ...s, completed: !s.completed } : s))}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      sub.completed ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "bg-card hover:bg-muted/40"
                    )}
                  >
                    {sub.completed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />}
                    <span className={cn("text-sm flex-1", sub.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                      {sub.title}
                    </span>
                    {sub.completed && <span className="text-[10px] font-medium text-emerald-500 flex-shrink-0">Done</span>}
                  </button>
                ))}
                <AddSubtaskRow onAdd={(title) =>
                  setSubtasks((prev) => [...prev, { id: Date.now(), title, completed: false }])
                } />
              </div>
            </div>
          ) : (
            /* Two-choice progress: estimate or subtasks */
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Progress</p>

              {/* Toggle */}
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 mb-4">
                <button
                  onClick={() => setProgressMode("estimate")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                    progressMode === "estimate" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Rough estimate
                </button>
                <button
                  onClick={() => setProgressMode("subtasks")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                    progressMode === "subtasks" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Break into subtasks
                </button>
              </div>

              {progressMode === "estimate" ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground/60">How far along is this task?</p>
                    <span className={cn("text-sm font-medium tabular-nums", progressPct === 100 ? "text-emerald-500" : "text-foreground")}>
                      {progressPct === 100 ? "Done!" : `${progressPct}%`}
                    </span>
                  </div>
                  <StepSlider
                    count={PROGRESS_STEPS.length}
                    value={PROGRESS_STEPS.indexOf(progressPct)}
                    onChange={(i) => setProgressPct(PROGRESS_STEPS[i])}
                    labels={["0%", "25%", "50%", "75%", "Done"]}
                    fillFrom="start"
                    color={progressPct === 100 ? "#10b981" : "var(--foreground)"}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground/60 mb-3">Add subtasks and check them off as you go.</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <AddSubtaskRow onAdd={(title) =>
                      setSubtasks((prev) => [...prev, { id: Date.now(), title, completed: false }])
                    } />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Difficulty — always shown when complete */}
          {isComplete && (
            <DifficultySection
              task={task}
              mode={WORKSPACE_DIFFICULTY_MODE}
              onChange={setPerceivedDifficulty}
            />
          )}

          {/* Time summary — appears when complete */}
          {isComplete && task?.estimatedMinutes && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <span>Est. {formatMinutes(task.estimatedMinutes)}</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Actual {formatMinutes(totalMin)}</span>
              {totalMin > task.estimatedMinutes
                ? <span className="text-destructive ml-auto">↑ {formatMinutes(totalMin - task.estimatedMinutes)} over</span>
                : <span className="text-emerald-500 ml-auto">↓ {formatMinutes(task.estimatedMinutes - totalMin)} under</span>}
            </div>
          )}

        </div>
      </div>

      {/* What's next */}
      <div>
        <div className="flex items-center justify-between px-1 pt-1 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What's next?</p>
          {WORKSPACE_CLOCK_MODE && (
            <span className="text-[11px] text-muted-foreground/40">
              Today: {formatMinutes(TODAY_WORKED_MINUTES)}
            </span>
          )}
        </div>

        {/* Upcoming tasks */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {upcomingTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => onPickTask({ taskId: t.id, taskTitle: t.title, projectColor: t.projectColor, projectName: t.project })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-left group"
              >
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.projectColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.project} · {formatMinutes(t.estimatedMinutes)}</p>
                </div>
                <Play className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Break + end of day */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onDone}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <Coffee className="h-3.5 w-3.5" />
            Take a break
          </button>
          {WORKSPACE_CLOCK_MODE ? (
            <button
              onClick={onDone}
              className="flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" />
                Clock out
              </span>
            </button>
          ) : (
            <button
              onClick={onDone}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
            >
              <Moon className="h-3.5 w-3.5" />
              Done for the day
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TimerPage() {
  const { activeSession, sessionSeconds, sessionRunning, startSession, stopSession } = useApp();
  const [pendingSwitch, setPendingSwitch] = useState<ActiveSession | null>(null);
  const [endedSession, setEndedSession] = useState<EndedSession | null>(null);
  const [extraEntries, setExtraEntries] = useState<TimeEntry[]>([]);

  const currentTask = activeSession ? FOCUS_TASKS.find((t) => t.id === activeSession.taskId) : undefined;

  function logCurrentSession() {
    if (!activeSession || sessionSeconds <= 30) return;
    const now = new Date();
    const start = new Date(now.getTime() - sessionSeconds * 1000);
    const hhmm = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setExtraEntries((prev) => [...prev, {
      id: Date.now(), taskTitle: activeSession.taskTitle,
      project: activeSession.projectName ?? "", projectColor: activeSession.projectColor,
      date: TODAY, startTime: hhmm, durationMinutes: secondsToMinutes(sessionSeconds),
    }]);
  }

  function handleStop() {
    if (!activeSession) return;
    const data: EndedSession = {
      session: { ...activeSession },
      task: currentTask,
      sessionMinutes: secondsToMinutes(sessionSeconds),
    };
    logCurrentSession();
    stopSession();
    setEndedSession(data);
  }

  function handleSwitchConfirm() {
    if (!pendingSwitch || !activeSession) return;
    logCurrentSession();
    startSession(pendingSwitch);
    setPendingSwitch(null);
  }

  function handleWrapUpPickTask(s: ActiveSession) {
    setEndedSession(null);
    startSession(s);
  }

  function handleWrapUpDone() {
    setEndedSession(null);
  }

  return (
    <>
      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Focus</h1>

        {endedSession ? (
          <WrapUpFlow
            ended={endedSession}
            onPickTask={handleWrapUpPickTask}
            onDone={handleWrapUpDone}
          />
        ) : activeSession ? (
          <ActiveBanner session={activeSession} seconds={sessionSeconds} running={sessionRunning}
            task={currentTask} onStop={handleStop} />
        ) : (
          <IdleState />
        )}

      </div>

      {pendingSwitch && activeSession && (
        <SwitchDialog current={activeSession} next={pendingSwitch} elapsedSeconds={sessionSeconds}
          onConfirm={handleSwitchConfirm} onCancel={() => setPendingSwitch(null)} />
      )}
    </>
  );
}
