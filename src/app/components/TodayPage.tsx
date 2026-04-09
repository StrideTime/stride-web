import { useState, useMemo } from "react";
import type { FC, CSSProperties } from "react";
import {
  ChevronRight, ChevronLeft, Coffee, Video, Zap,
  Pause, Square, Check, Trophy, CheckCircle2, CheckCheck,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { type Task as FullTask, type TaskStatus as FullTaskStatus, type TaskType as FullTaskType, type Priority as FullPriority } from "../data/mockData";
import { TaskDetailModal, PRIORITY_META } from "./TaskDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "TODO";
type TaskType = "FEATURE" | "BUG" | "CHORE" | "RESEARCH";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Task {
  id: number; title: string; type: TaskType; priority: Priority;
  status: TaskStatus; difficulty: Difficulty; project: string;
  projectColor: string; estimatedMinutes: number; actualMinutes?: number; tagIds: string[];
}
interface ScheduleEvent {
  id: number; label: string; startTime: string; durationMinutes: number;
  type: "MEETING" | "FOCUS_BLOCK" | "BREAK" | "TASK"; source?: string;
}
interface Goal { id: number; title: string; progress: number; color: string; dueLabel: string; }
interface TimelineBlock {
  startOffset: number; // minutes relative to NOW
  endOffset: number;
  type: "FOCUS" | "MEETING" | "BREAK" | "TASK";
  label: string;
  isActive?: boolean;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#61afef";

function card(extra?: CSSProperties): CSSProperties {
  return { background: "#191c23", border: "1px solid rgba(255,255,255,0.05)", ...extra };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY = new Date();
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const todayFormatted = `${DAY_NAMES[TODAY.getDay()]}, ${MONTH_NAMES[TODAY.getMonth()]} ${TODAY.getDate()}`;

const ALL_TASKS: Task[] = [
  { id: 1, title: "Review pull requests",          type: "CHORE",   priority: "MEDIUM", status: "COMPLETED",   difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 30,  actualMinutes: 22,  tagIds: [] },
  { id: 2, title: "Fix navigation bug",            type: "BUG",     priority: "HIGH",   status: "COMPLETED",   difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: [] },
  { id: 3, title: "Weekly standup notes",          type: "CHORE",   priority: "LOW",    status: "COMPLETED",   difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [] },
  { id: 9, title: "Refactor auth service",         type: "FEATURE", priority: "URGENT", status: "IN_PROGRESS", difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 180, actualMinutes: 210, tagIds: [] },
  { id: 5, title: "Redesign dashboard components", type: "FEATURE", priority: "HIGH",   status: "IN_PROGRESS", difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 120, actualMinutes: 105, tagIds: [] },
  { id: 6, title: "Database migration script",     type: "CHORE",   priority: "HIGH",   status: "TODO",        difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 90,                      tagIds: [] },
];

function addMinutesToNow(offsetMinutes: number): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SCHEDULE: ScheduleEvent[] = [
  { id: 1, label: "Team standup",      startTime: addMinutesToNow(-40), durationMinutes: 30,  type: "MEETING",     source: "Google Calendar" },
  { id: 2, label: "Deep work block",   startTime: addMinutesToNow(-10), durationMinutes: 120, type: "FOCUS_BLOCK" },
  { id: 3, label: "1:1 with Sarah",    startTime: addMinutesToNow(45),  durationMinutes: 30,  type: "MEETING",     source: "Google Calendar" },
  { id: 4, label: "Code review block", startTime: addMinutesToNow(90),  durationMinutes: 60,  type: "TASK" },
];

const GOALS: Goal[] = [
  { id: 1, title: "Ship Stride v2.0",       progress: 65, color: "#61afef", dueLabel: "Apr 30" },
  { id: 2, title: "Run 100km in March",      progress: 43, color: "#98c379", dueLabel: "Mar 31" },
  { id: 3, title: "Read 12 books this year", progress: 33, color: "#e5c07b", dueLabel: "Dec 31" },
];

// Timeline: blocks relative to NOW (minutes offset)
const TL_WINDOW_BACK = 210;  // show 3.5h of history
const TL_WINDOW_FWD  = 150;  // show 2.5h of future
const TIMELINE_BLOCKS: TimelineBlock[] = [
  { startOffset: -210, endOffset: -180, type: "FOCUS",   label: "Morning focus" },
  { startOffset: -180, endOffset: -150, type: "MEETING", label: "Standup" },
  { startOffset: -150, endOffset: -65,  type: "FOCUS",   label: "Deep work" },
  { startOffset: -65,  endOffset: -35,  type: "BREAK",   label: "Lunch" },
  { startOffset: -29,  endOffset:  45,  type: "FOCUS",   label: "Redesign dashboard", isActive: true },
  { startOffset:  45,  endOffset:  75,  type: "MEETING", label: "1:1 with Sarah" },
  { startOffset:  90,  endOffset: 150,  type: "TASK",    label: "Code review" },
];

const DAILY_TIME = [
  { label: "Focus",    hours: 3.7, color: ACCENT },
  { label: "Meetings", hours: 1.5, color: "#c678dd" },
  { label: "Breaks",   hours: 0.8, color: "#98c379" },
];

const WEEKLY_HOURS = [8.5, 6.2, 7.4, 5.5, 0, 0, 0];
const TODAY_IDX = (TODAY.getDay() + 6) % 7;

// Focus score (0–100): weighted from deep work, task completion, streak
const FOCUS_SCORE = 82;
const SCORE_BREAKDOWN = [
  { label: "Deep work",     value: "3.7h",  color: ACCENT },
  { label: "Tasks done",    value: "3 / 6", color: "#98c379" },
  { label: "Streak",        value: "7 days", color: "#e5c07b" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes-since-midnight as "3:45pm" */
function minsToLabel(totalMins: number): string {
  const now = new Date();
  const abs = now.getHours() * 60 + now.getMinutes() + totalMins;
  const h = Math.floor(abs / 60) % 24;
  const m = abs % 60;
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}${m === 0 ? "" : `:${String(m).padStart(2, "0")}`}${ampm}`;
}

const BLOCK_COLOR: Record<TimelineBlock["type"], string> = {
  FOCUS:   ACCENT,
  MEETING: "#c678dd",
  BREAK:   "#98c379",
  TASK:    "#e5c07b",
};

// ─── Active Task Hero ─────────────────────────────────────────────────────────
// Full-width command center for the live focus session.

function ActiveTaskHero() {
  const color = ACCENT;
  return (
    <div className="rounded-xl mb-3 px-6 py-5" style={{
      ...card(),
      borderColor: `${color}18`,
      background: "#191c23",
    }}>
      <div className="flex items-center gap-6">

        {/* ── Task context ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
              <span className="relative rounded-full h-2 w-2" style={{ backgroundColor: color }} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: `${color}80` }}>
              In Focus
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: `${color}14`, color }}>
              Side Project
            </span>
          </div>
          <h2 className="text-xl font-black text-white truncate leading-tight mb-1">
            Redesign dashboard components
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Session 2 today · High priority · 2h estimated
          </p>
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.06)" }} />

        {/* ── Elapsed timer (hero number) ─────────────────────────── */}
        <div className="text-center flex-shrink-0 px-4">
          <div className="font-black tabular-nums text-white leading-none" style={{
            fontSize: "3.75rem", letterSpacing: "-0.04em",
            textShadow: `0 0 40px ${color}50`,
          }}>
            28:42
          </div>
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            elapsed
          </p>
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.06)" }} />

        {/* ── Session stats ───────────────────────────────────────── */}
        <div className="flex-shrink-0 px-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-0">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Today</p>
              <p className="text-lg font-black text-white tabular-nums">5.5h</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Sessions</p>
              <p className="text-lg font-black text-white tabular-nums">2</p>
            </div>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.06)" }} />

        {/* ── Controls ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-black transition-opacity hover:opacity-80"
            style={{ background: color, color: "#0d1117", boxShadow: `0 0 20px ${color}40` }}>
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-60"
              style={{ background: "rgba(152,195,121,0.12)", border: "1px solid rgba(152,195,121,0.2)", color: "#98c379" }}>
              <CheckCheck className="h-3 w-3" /> Done
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-60"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
              <Square className="h-3 w-3" /> Stop
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Block Detail Popup ───────────────────────────────────────────────────────

type BlockDetail = {
  startOffset: number; endOffset: number;
  type: TimelineBlock["type"]; label: string;
  durationMins: number; isPast: boolean; isFuture: boolean; isActive: boolean;
};

const BLOCK_DETAIL_MOCK: Record<string, {
  subtitle?: string;
  project?: string;
  attendees?: string[];
  source?: string;
  tasks?: string[];
  note?: string;
}> = {
  "Morning focus":       { project: "Side Project",  tasks: ["Set up repo structure", "Write initial types"] },
  "Standup":             { attendees: ["Alex Chen", "Sarah Kim", "Jordan Lee", "Marcus Wu"], source: "Google Calendar" },
  "Deep work":           { project: "Side Project",  tasks: ["Implement auth flow", "Write unit tests", "Fix token refresh bug"] },
  "Lunch":               { note: "Regular lunch break" },
  "Redesign dashboard":  { project: "Side Project",  tasks: ["Sketch card layouts", "Implement bar chart"] },
  "1:1 with Sarah":      { attendees: ["Alex Chen", "Sarah Kim"], source: "Google Calendar", note: "Weekly check-in" },
  "Code review":         { project: "Stride",        tasks: ["Review PR #58", "Review PR #61"] },
  "Weekly planning":     { attendees: ["Alex Chen", "Sarah Kim", "Jordan Lee"], source: "Google Calendar" },
  "Feature development": { project: "Side Project",  tasks: ["Build settings page", "Wire up notifications"] },
  "Code review (prev)":  { project: "Stride",        tasks: ["Review PR #54", "Review PR #55", "Review PR #56"] },
  "1:1 with manager":    { attendees: ["Alex Chen", "Dave Park"], source: "Google Calendar", note: "Monthly 1:1" },
  "Bug fixes":           { project: "Stride",        tasks: ["Fix sidebar scroll bug", "Fix modal z-index"] },
};

function BlockDetailPopup({ block, onClose }: { block: BlockDetail; onClose: () => void }) {
  const color   = BLOCK_COLOR[block.type];
  const Icon    = BLOCK_ICON_MAP[block.type];
  const detail  = BLOCK_DETAIL_MOCK[block.label] ?? {};

  const startLabel = minsToLabel(block.startOffset);
  const endLabel   = minsToLabel(block.endOffset);

  const typeLabel: Record<TimelineBlock["type"], string> = {
    FOCUS: "Focus Session", MEETING: "Meeting", BREAK: "Break", TASK: "Task Block",
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl w-80"
        style={{
          background: "#1c2030",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ color: `${color}80` }}>{typeLabel[block.type]}</p>
                <p className="text-sm font-black text-white leading-tight">{block.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
              ✕
            </button>
          </div>

          {/* Time strip */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs font-bold text-white tabular-nums">{startLabel}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>→</span>
              <span className="text-xs font-bold text-white tabular-nums">{endLabel}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
              <span className="text-xs font-black tabular-nums" style={{ color }}>
                {block.durationMins >= 60
                  ? `${(block.durationMins / 60).toFixed(block.durationMins % 60 === 0 ? 0 : 1)}h`
                  : `${block.durationMins}m`}
              </span>
            </div>
            {block.isActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-full w-full rounded-full opacity-60"
                    style={{ backgroundColor: color }} />
                  <span className="relative rounded-full h-1.5 w-1.5" style={{ backgroundColor: color }} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Project */}
          {detail.project && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-1.5"
                style={{ color: "rgba(255,255,255,0.25)" }}>Project</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="text-sm font-semibold text-white">{detail.project}</span>
              </div>
            </div>
          )}

          {/* Tasks */}
          {detail.tasks && detail.tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-2"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                {block.isPast ? "Completed" : "Planned"} tasks
              </p>
              <div className="space-y-1.5">
                {detail.tasks.map((task) => (
                  <div key={task} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: block.isPast ? "rgba(152,195,121,0.15)" : `${color}12` }}>
                      {block.isPast
                        ? <Check className="h-2.5 w-2.5" style={{ color: "#98c379" }} />
                        : <div className="h-1.5 w-1.5 rounded-full" style={{ background: color, opacity: 0.5 }} />
                      }
                    </div>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendees */}
          {detail.attendees && detail.attendees.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-2"
                style={{ color: "rgba(255,255,255,0.25)" }}>Attendees</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.attendees.map((name) => (
                  <span key={name} className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {detail.source && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 rotate-90" style={{ color: "rgba(255,255,255,0.2)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>via {detail.source}</span>
            </div>
          )}

          {/* Note */}
          {detail.note && (
            <p className="text-xs px-3 py-2 rounded-lg italic"
              style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.06)" }}>
              {detail.note}
            </p>
          )}

          {/* Break fallback */}
          {block.type === "BREAK" && !detail.tasks && !detail.attendees && (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Scheduled break · {block.durationMins} minutes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Day Schedule Card ────────────────────────────────────────────────────────
// Vertical agenda — navigable by day, active row simplified (hero card owns the timer).

const BLOCK_ICON_MAP = {
  FOCUS:   Zap,
  MEETING: Video,
  BREAK:   Coffee,
  TASK:    CheckCircle2,
} as const;

// Mock data for previous days (all past, no active session)
const PREV_DAY_BLOCKS: TimelineBlock[] = [
  { startOffset: -480, endOffset: -420, type: "FOCUS",   label: "Morning focus" },
  { startOffset: -420, endOffset: -390, type: "MEETING", label: "Weekly planning" },
  { startOffset: -390, endOffset: -270, type: "FOCUS",   label: "Feature development" },
  { startOffset: -270, endOffset: -240, type: "BREAK",   label: "Lunch" },
  { startOffset: -240, endOffset: -120, type: "FOCUS",   label: "Code review" },
  { startOffset: -120, endOffset:  -90, type: "MEETING", label: "1:1 with manager" },
  { startOffset:  -90, endOffset:  -30, type: "FOCUS",   label: "Bug fixes" },
];

function DayTimelineCard() {
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<BlockDetail | null>(null);
  const isToday = dayOffset === 0;
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  // Display date label
  const displayDate = useMemo(() => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + dayOffset);
    if (dayOffset === 0)  return { label: "Today",     sub: todayFormatted };
    if (dayOffset === -1) return { label: "Yesterday", sub: `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` };
    return { label: DAY_NAMES[d.getDay()], sub: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` };
  }, [dayOffset]);

  const source = isToday ? TIMELINE_BLOCKS : PREV_DAY_BLOCKS;

  const events = source.map((b) => ({
    ...b,
    durationMins: b.endOffset - b.startOffset,
    isPast:   !isToday || b.endOffset < 0,
    isFuture: isToday && b.startOffset > 0,
    isActive: isToday && !!b.isActive,
  }));

  const elapsedMins = (b: TimelineBlock) => Math.min(b.endOffset, 0) - b.startOffset;
  const totalFocusMins   = source.filter(b => b.type === "FOCUS"   && b.startOffset < 0).reduce((s, b) => s + elapsedMins(b), 0);
  const totalMeetingMins = source.filter(b => b.type === "MEETING" && b.startOffset < 0).reduce((s, b) => s + elapsedMins(b), 0);

  const workStart = 9 * 60, workEnd = 18 * 60;
  const dayPct = isToday
    ? Math.min(100, Math.max(0, ((nowMins - workStart) / (workEnd - workStart)) * 100))
    : 100;

  return (
    <div className="rounded-xl flex flex-col" style={card()}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5"
            style={{ color: "rgba(255,255,255,0.25)" }}>{displayDate.label}</p>
          <p className="text-sm font-bold text-white">{displayDate.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Workday progress */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full" style={{ width: `${dayPct}%`, background: ACCENT }} />
            </div>
            <span className="text-xs font-black tabular-nums" style={{ color: ACCENT }}>{Math.round(dayPct)}%</span>
          </div>
          {/* Day navigation */}
          <button
            onClick={() => setDayOffset(d => d - 1)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.07]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <ChevronLeft className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.45)" }} />
          </button>
          <button
            onClick={() => setDayOffset(d => Math.min(0, d + 1))}
            disabled={dayOffset === 0}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              opacity: dayOffset === 0 ? 0.3 : 1,
              cursor: dayOffset === 0 ? "default" : "pointer",
            }}>
            <ChevronRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.45)" }} />
          </button>
        </div>
      </div>

      {selectedBlock && (
        <BlockDetailPopup block={selectedBlock} onClose={() => setSelectedBlock(null)} />
      )}

      {/* Event list */}
      <div className="flex-1 px-5 pb-2">
        {events.map((event, i) => {
          const color  = BLOCK_COLOR[event.type];
          const Icon   = BLOCK_ICON_MAP[event.type];
          const isLast = i === events.length - 1;

          return (
            <div key={i} className="flex" style={{ opacity: event.isFuture ? 0.4 : 1 }}>

              {/* Time — colored per type */}
              <div className="flex-shrink-0 pt-3 text-right pr-3" style={{ width: "52px" }}>
                <span className="text-[11px] font-bold tabular-nums" style={{
                  color: event.isActive ? color : event.isPast ? `${color}55` : `${color}45`,
                }}>
                  {minsToLabel(event.startOffset)}
                </span>
              </div>

              {/* Spine */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: "20px" }}>
                <div className="relative mt-3 z-10 flex-shrink-0">
                  {event.isActive ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute h-full w-full rounded-full opacity-40"
                        style={{ backgroundColor: color }} />
                      <span className="relative rounded-full h-3 w-3" style={{ backgroundColor: color }} />
                    </span>
                  ) : (
                    <div className="h-2 w-2 rounded-full" style={{
                      background: event.isPast ? color : "transparent",
                      border: event.isPast ? "none" : `1.5px solid rgba(255,255,255,0.15)`,
                      opacity: event.isPast ? 0.45 : 1,
                    }} />
                  )}
                </div>
                {!isLast && (
                  <div className="flex-1 mt-1" style={{
                    width: "1px",
                    background: "rgba(255,255,255,0.07)",
                    minHeight: "10px",
                  }} />
                )}
              </div>

              {/* Content — clickable row */}
              <div className="flex-1 min-w-0 pl-3 pb-1">
                {event.isActive ? (
                  <div
                    className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg mb-1 cursor-pointer transition-colors"
                    style={{ background: `${color}0e`, border: `1px solid ${color}1a` }}
                    onClick={() => setSelectedBlock(event)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${color}18`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${color}0e`)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                    <span className="text-sm font-semibold flex-1 truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {event.label}
                    </span>
                    <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${color}10`, color: `${color}90` }}>
                      {event.durationMins}m
                    </span>
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                      <span className="animate-ping absolute h-full w-full rounded-full opacity-60"
                        style={{ backgroundColor: color }} />
                      <span className="relative rounded-full h-1.5 w-1.5" style={{ backgroundColor: color }} />
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2.5 py-2.5 px-2 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setSelectedBlock(event)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{
                      color: event.isPast ? `${color}45` : color,
                    }} />
                    <span className="text-sm flex-1 truncate" style={{
                      color: event.isPast ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)",
                    }}>
                      {event.label}
                    </span>
                    <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded flex-shrink-0" style={{
                      background: `${color}10`,
                      color: event.isPast ? `${color}55` : `${color}90`,
                    }}>
                      {event.durationMins}m
                    </span>
                    {event.isPast && (
                      <Check className="h-3 w-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.18)" }} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="px-5 py-3.5 flex items-center gap-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { label: "Focus",     value: `${(totalFocusMins / 60).toFixed(1)}h`,   color: ACCENT },
          { label: "Meetings",  value: `${(totalMeetingMins / 60).toFixed(1)}h`, color: "#c678dd" },
          { label: "Untracked", value: "0.8h",                                   color: "rgba(255,255,255,0.22)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
            <span className="text-xs font-black tabular-nums text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Focus Score Card ─────────────────────────────────────────────────────────
// Gamified productivity ring + sub-metrics + weekly sparkline.

function FocusScoreCard() {
  const score = FOCUS_SCORE;
  const cx = 80, cy = 80, r = 62, strokeW = 10;
  const C = 2 * Math.PI * r;
  const filled = (score / 100) * C;

  // Sparkline: daily score proxy from weekly hours
  const sparkMax = Math.max(...WEEKLY_HOURS);
  const SW = 120, SH = 28;
  const sparkPts = WEEKLY_HOURS.slice(0, TODAY_IDX + 1).map((h, i) => ({
    x: (i / 6) * SW,
    y: SH - (h / sparkMax) * SH,
  }));
  const sparkLine = sparkPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="rounded-xl flex flex-col" style={card()}>
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.25)" }}>
          Focus Score
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
          style={{ background: `${ACCENT}14`, color: ACCENT }}>Today</span>
      </div>

      {/* Ring */}
      <div className="flex justify-center">
        <svg width={160} height={160} style={{ overflow: "visible" }}>
          <defs>
            <filter id="scoreGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
          {/* Glow arc */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={ACCENT} strokeWidth={strokeW + 4} strokeOpacity="0.2"
            strokeDasharray={`${filled} ${C}`}
            strokeDashoffset={C * 0.25}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter="url(#scoreGlow)"
          />
          {/* Score arc */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={ACCENT} strokeWidth={strokeW}
            strokeDasharray={`${filled} ${C}`}
            strokeDashoffset={C * 0.25}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          {/* Score number */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={36} fontWeight="900"
            fill="white" fontFamily="inherit">{score}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10}
            fill="rgba(255,255,255,0.3)" fontFamily="inherit" letterSpacing="1">OUT OF 100</text>
        </svg>
      </div>

      {/* Sub-metrics */}
      <div className="px-5 pb-3 space-y-2.5 -mt-2">
        {SCORE_BREAKDOWN.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
            <span className="text-sm font-black tabular-nums" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

      {/* Weekly sparkline */}
      <div className="px-5 pt-3 pb-5">
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          This week
        </p>
        <svg width="100%" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" style={{ height: "28px" }}>
          {/* Area fill */}
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          {sparkLine && (
            <path d={`${sparkLine} L${sparkPts[sparkPts.length-1].x},${SH} L0,${SH} Z`}
              fill="url(#sparkFill)" />
          )}
          {sparkLine && (
            <path d={sparkLine} fill="none" stroke={ACCENT} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
          {/* Today dot */}
          {sparkPts.length > 0 && (
            <circle cx={sparkPts[sparkPts.length-1].x} cy={sparkPts[sparkPts.length-1].y} r="3"
              fill="white" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        <div className="flex justify-between mt-1">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <span key={i} className="text-[9px] font-bold" style={{
              color: i === TODAY_IDX ? ACCENT : "rgba(255,255,255,0.15)",
            }}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Next Up Card ─────────────────────────────────────────────────────────────

function NextUpCard({ task, onStart }: { task: Task; onStart: () => void }) {
  const prioMeta = PRIORITY_META[task.priority];
  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={card()}>
      <div className="px-5 py-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Next up
          </span>
          <span className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ml-auto",
            task.priority === "URGENT" && "animate-pulse")}
            style={{ background: `${prioMeta.color}18`, color: prioMeta.color }}>
            <prioMeta.Icon className="h-2.5 w-2.5" />{prioMeta.label}
          </span>
        </div>
        <p className="text-base font-black text-white leading-snug mb-1">{task.title}</p>
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {task.project} · {formatMinutes(task.estimatedMinutes)} est.
        </p>
        <div className="mt-auto">
          <button onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-black text-sm transition-opacity hover:opacity-90"
            style={{
              background: ACCENT, color: "#0d1117",
              boxShadow: `0 0 24px ${ACCENT}45, 0 4px 12px ${ACCENT}30`,
            }}>
            <Zap className="h-3.5 w-3.5" /> Start Focus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Wins Card ────────────────────────────────────────────────────────────────

function WinsCard({ tasks, onClickTask }: { tasks: Task[]; onClickTask: (t: Task) => void }) {
  if (tasks.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden" style={card()}>
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e5c07b" }} />
        <h3 className="text-sm font-black text-white">Today's Wins</h3>
        <span className="text-xs font-bold ml-auto" style={{ color: "rgba(152,195,121,0.5)" }}>
          {tasks.length} completed
        </span>
      </div>
      <div className="px-3 pb-3">
        {tasks.map((task) => {
          const worked = task.actualMinutes ?? 0;
          const diff = worked - task.estimatedMinutes;
          const underTime = diff < 0;
          return (
            <div key={task.id} onClick={() => onClickTask(task)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
              style={{ background: "rgba(255,255,255,0)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0)")}>
              <div className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(152,195,121,0.15)" }}>
                <Check className="h-2.5 w-2.5" style={{ color: "#98c379" }} />
              </div>
              <p className="text-sm flex-1 truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{task.title}</p>
              {worked > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{formatMinutes(worked)}</p>
                  {diff !== 0 && (
                    <p className="text-[11px] tabular-nums font-bold"
                      style={{ color: underTime ? "#98c379" : "#e06c75" }}>
                      {underTime ? `−${formatMinutes(Math.abs(diff))}` : `+${formatMinutes(diff)}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upcoming Card ────────────────────────────────────────────────────────────

const EVENT_META: Record<ScheduleEvent["type"], { color: string; icon: FC<{ className?: string; style?: CSSProperties }> }> = {
  MEETING:     { color: "#c678dd", icon: Video },
  FOCUS_BLOCK: { color: "#61afef", icon: Zap },
  BREAK:       { color: "#98c379", icon: Coffee },
  TASK:        { color: "#e5c07b", icon: CheckCircle2 },
};

function UpcomingCard() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = SCHEDULE.map((event) => {
    const startMin = timeToMinutes(event.startTime);
    const endMin = startMin + event.durationMinutes;
    const isNow = startMin <= nowMinutes && nowMinutes < endMin;
    const minutesUntil = startMin - nowMinutes;
    const progressPct = isNow ? Math.min(100, Math.round(((nowMinutes - startMin) / event.durationMinutes) * 100)) : 0;
    return { ...event, startMin, endMin, isNow, minutesUntil, progressPct };
  }).filter((e) => e.endMin > nowMinutes).slice(0, 4);

  function formatUntil(mins: number) {
    if (mins < 60) return `in ${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
  }

  return (
    <div className="rounded-xl overflow-hidden" style={card()}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-white">Upcoming</h3>
        <button className="flex items-center gap-0.5 text-xs font-medium" style={{ color: `${ACCENT}60` }}>
          Calendar <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {upcoming.map((event) => {
          const meta = EVENT_META[event.type];
          const Icon = meta.icon;
          return (
            <div key={event.id} className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg overflow-hidden" style={{
              background: event.isNow ? `${meta.color}0a` : "rgba(255,255,255,0.02)",
              border: `1px solid ${event.isNow ? `${meta.color}20` : "rgba(255,255,255,0.04)"}`,
            }}>
              <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full" style={{ background: meta.color, opacity: event.isNow ? 1 : 0.4 }} />
              <div className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 ml-2"
                style={{ background: `${meta.color}14` }}>
                <Icon className="h-3 w-3" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{event.label}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{event.startTime} · {formatMinutes(event.durationMinutes)}</p>
              </div>
              {event.isNow ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: meta.color }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: meta.color }} />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: meta.color }}>Now</span>
                </div>
              ) : (
                <span className="text-xs font-bold flex-shrink-0 tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {formatUntil(event.minutesUntil)}
                </span>
              )}
              {event.isNow && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ width: `${event.progressPct}%`, height: "100%", backgroundColor: meta.color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Goals Strip ──────────────────────────────────────────────────────────────

function GoalsStrip() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {GOALS.map((goal) => (
        <div key={goal.id} className="rounded-xl px-5 py-5" style={card()}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.25)" }}>Goal</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: `${goal.color}14`, color: `${goal.color}bb` }}>{goal.dueLabel}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-black tabular-nums leading-none" style={{
              fontSize: "2.75rem", letterSpacing: "-0.04em", color: goal.color,
              textShadow: `0 0 20px ${goal.color}40`,
            }}>
              {goal.progress}
            </span>
            <span className="text-lg font-black" style={{ color: `${goal.color}40` }}>%</span>
          </div>
          <p className="text-sm font-semibold mb-4 truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{goal.title}</p>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{
              width: `${goal.progress}%`, backgroundColor: goal.color,
              boxShadow: `0 0 8px ${goal.color}60`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TodayPage() {
  const { settings } = useApp();
  const [tasks] = useState<Task[]>(ALL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const PRIORITY_ORDER: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const nextUpTask = tasks
    .filter((t) => t.status !== "COMPLETED")
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))[0] ?? null;

  function toFullTask(t: Task): FullTask {
    return {
      id: t.id, workspaceId: "ws3", projectId: "p1", teamId: "t1", assigneeId: "u1", createdBy: "u1",
      title: t.title, type: t.type as FullTaskType, priority: t.priority as FullPriority,
      status: t.status as FullTaskStatus, difficulty: t.difficulty as any,
      estimatedMinutes: t.estimatedMinutes, actualMinutes: t.actualMinutes, tagIds: t.tagIds,
    };
  }

  return (
    <div style={{ background: "#111318", minHeight: "100%", position: "relative", overflow: "hidden" }}>
      {/* Ambient depth */}
      <div style={{
        position: "absolute", top: "-10%", left: "5%",
        width: "60%", height: "50%",
        background: `radial-gradient(ellipse at 30% 30%, ${ACCENT}08 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />

      <div style={{ padding: "28px 28px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-white leading-none mb-2" style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Good morning, Alex
            </h1>
            <p className="text-sm flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {todayFormatted}
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <span style={{ color: "#e5c07b" }}>🔥 7-day streak</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <span>Strongest week in 6 months</span>
            </p>
          </div>
        </div>

        {/* ── Row 1: Active Task Hero (full width) ── */}
        <ActiveTaskHero />

        {/* ── Row 2: Day Timeline + Focus Score ── */}
        <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 280px" }}>
          <DayTimelineCard />
          <FocusScoreCard />
        </div>

        {/* ── Row 3: Next Up · Wins · Upcoming ── */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {nextUpTask ? <NextUpCard task={nextUpTask} onStart={() => {}} /> : <div />}
          <WinsCard tasks={completedTasks} onClickTask={setSelectedTask} />
          <UpcomingCard />
        </div>

        {/* ── Row 4: Goals ── */}
        <GoalsStrip />

        <div className="h-8" />
      </div>

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onOpenChange={(o) => { if (!o) setSelectedTask(null); }}
          task={toFullTask(selectedTask)}
          onChangeStatus={() => {}}
          onChangePriority={() => {}}
          onChangeType={() => {}}
          onChangeTask={() => {}}
        />
      )}
    </div>
  );
}
