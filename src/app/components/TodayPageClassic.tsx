/**
 * TodayPageClassic — solid-card (non-glassmorphism) version for comparison.
 * Same layout and data as TodayPage, but uses opaque bg-card treatment.
 */
import { useState } from "react";
import type { FC, CSSProperties } from "react";
import {
  ChevronRight, Coffee, Video, Zap, ArrowRight,
  Pause, Square, Check, Trophy, CheckCircle2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { type Task as FullTask, type TaskStatus as FullTaskStatus, type TaskType as FullTaskType, type Priority as FullPriority } from "../data/mockData";
import { TaskDetailModal, PRIORITY_META } from "./TaskDetailModal";

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

const TODAY = new Date();
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const todayFormatted = `${DAY_NAMES[TODAY.getDay()]}, ${MONTH_NAMES[TODAY.getMonth()]} ${TODAY.getDate()}`;

const ALL_TASKS: Task[] = [
  { id: 1,  title: "Review pull requests",          type: "CHORE",   priority: "MEDIUM", status: "COMPLETED",  difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 30,  actualMinutes: 22,  tagIds: [] },
  { id: 2,  title: "Fix navigation bug",            type: "BUG",     priority: "HIGH",   status: "COMPLETED",  difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 71,  tagIds: [] },
  { id: 3,  title: "Weekly standup notes",          type: "CHORE",   priority: "LOW",    status: "COMPLETED",  difficulty: "EASY",   project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 15,  actualMinutes: 12,  tagIds: [] },
  { id: 9,  title: "Refactor auth service",         type: "FEATURE", priority: "URGENT", status: "IN_PROGRESS",difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 180, actualMinutes: 210, tagIds: [] },
  { id: 5,  title: "Redesign dashboard components", type: "FEATURE", priority: "HIGH",   status: "IN_PROGRESS",difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 120, actualMinutes: 105, tagIds: [] },
  { id: 10, title: "Add loading skeletons",         type: "FEATURE", priority: "LOW",    status: "IN_PROGRESS",difficulty: "MEDIUM", project: "Stride",       projectColor: "#c678dd", estimatedMinutes: 60,  actualMinutes: 25,  tagIds: [] },
  { id: 6,  title: "Database migration script",    type: "CHORE",   priority: "HIGH",   status: "TODO",       difficulty: "HARD",   project: "Side Project", projectColor: "#61afef", estimatedMinutes: 90,                      tagIds: [] },
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

const TODAY_IDX = (TODAY.getDay() + 6) % 7;
const WEEKLY_DATA = [
  { day: "Mon", hours: 7.5 }, { day: "Tue", hours: 6.2 }, { day: "Wed", hours: 4.6 },
  { day: "Thu", hours: 0   }, { day: "Fri", hours: 0   }, { day: "Sat", hours: 0   }, { day: "Sun", hours: 0 },
];
const DAILY_TIME = [
  { label: "Focus",    hours: 3.2, color: "#61afef" },
  { label: "Meetings", hours: 1.5, color: "#c678dd" },
  { label: "Breaks",   hours: 0.8, color: "#98c379" },
];

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Solid card style (classic)
const CARD = "bg-card border border-border rounded-2xl";

function StatCards({ streak }: { streak: number }) {
  const totalLogged = WEEKLY_DATA.reduce((s, d) => s + d.hours, 0);
  const weekPct = Math.round((totalLogged / 40) * 100);
  return (
    <div className="grid grid-cols-3 gap-4 mb-5">
      <div className={`${CARD} px-5 py-5 relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 0% 100%, rgba(97,175,239,0.07) 0%, transparent 60%)" }} />
        <div className="flex items-start justify-between relative">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Focus Today</p>
          <svg width={44} height={44} className="flex-shrink-0 -mt-1 -mr-1">
            <circle cx={22} cy={22} r={17} fill="none" stroke="rgba(97,175,239,0.12)" strokeWidth={5} />
            <circle cx={22} cy={22} r={17} fill="none" stroke="#61afef" strokeWidth={5}
              strokeDasharray={`${(200 / 480) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
              strokeDashoffset={2 * Math.PI * 17 * 0.25}
              strokeLinecap="round" transform="rotate(-90 22 22)" />
            <text x={22} y={26} textAnchor="middle" fontSize={9} fontWeight="700" fill="#61afef" fontFamily="inherit">41%</text>
          </svg>
        </div>
        <div className="flex items-baseline gap-1 mt-2 mb-1 relative">
          <span className="font-black text-foreground tabular-nums" style={{ fontSize: "2.75rem" }}>3</span>
          <span className="text-lg font-bold text-muted-foreground">hr</span>
          <span className="font-black text-foreground tabular-nums ml-1" style={{ fontSize: "2.75rem" }}>20</span>
          <span className="text-lg font-bold text-muted-foreground">min</span>
        </div>
        <p className="text-xs text-muted-foreground relative">of 8h daily target</p>
      </div>
      <div className="rounded-2xl px-5 py-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #44d9ff 0%, #7b6cf6 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.12) 0%, transparent 50%)" }} />
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 relative" style={{ color: "rgba(255,255,255,0.7)" }}>Week Target</p>
        <div className="flex items-baseline gap-1.5 mb-1 relative">
          <span className="font-black tabular-nums" style={{ fontSize: "2.75rem", color: "#fff" }}>{weekPct}</span>
          <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>%</span>
        </div>
        <p className="text-xs relative" style={{ color: "rgba(255,255,255,0.6)" }}>{totalLogged.toFixed(1)}h of 40h logged</p>
      </div>
      <div className={`${CARD} px-5 py-5 relative overflow-hidden`}
        style={{ backgroundColor: "rgba(229,192,123,0.08)", borderColor: "rgba(229,192,123,0.2)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(229,192,123,0.1) 0%, transparent 60%)" }} />
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 relative" style={{ color: "rgba(229,192,123,0.7)" }}>Streak</p>
        <div className="flex items-center gap-3 mb-1 relative">
          <p className="font-black tabular-nums" style={{ fontSize: "2.75rem", color: "#e5c07b" }}>{streak}</p>
          <span style={{ fontSize: "2rem", lineHeight: 1 }}>🔥</span>
        </div>
        <p className="text-xs font-semibold relative" style={{ color: "rgba(229,192,123,0.8)" }}>Days in a row · personal best</p>
      </div>
    </div>
  );
}

function ActiveSessionCard({ taskName, project, projectColor, elapsed }: {
  taskName: string; project: string; projectColor: string; elapsed: string;
}) {
  return (
    <div className="rounded-2xl border mb-5 overflow-hidden relative"
      style={{ backgroundColor: `${projectColor}0b`, borderColor: `${projectColor}28` }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 10% 50%, ${projectColor}15 0%, transparent 60%)` }} />
      <div className="relative px-5 py-4 flex items-center gap-5">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: projectColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: projectColor }} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: projectColor }}>In the zone</span>
        </div>
        <p className="font-black tabular-nums text-foreground leading-none flex-shrink-0"
          style={{ fontSize: "2.25rem", textShadow: `0 0 40px ${projectColor}60` }}>{elapsed}</p>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{taskName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{project}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: `${projectColor}35`, backgroundColor: `${projectColor}14`, color: projectColor }}>
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-border/50 text-muted-foreground">
            <Square className="h-3.5 w-3.5" /> Stop
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklyActivityChart() {
  const maxH = 10;
  const totalLogged = WEEKLY_DATA.reduce((s, d) => s + d.hours, 0);
  return (
    <div className={`${CARD} p-5 h-full`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-foreground">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Focus hours · Mon–Sun</p>
        </div>
        <div className="text-right">
          <p className="font-black text-foreground tabular-nums" style={{ fontSize: "1.5rem" }}>
            {totalLogged.toFixed(1)}<span className="text-sm text-muted-foreground font-normal ml-1">h</span>
          </p>
          <p className="text-[11px] text-muted-foreground">of 40h weekly target</p>
        </div>
      </div>
      <div className="flex gap-2.5" style={{ height: "130px" }}>
        {WEEKLY_DATA.map(({ day, hours }, i) => {
          const isToday = i === TODAY_IDX;
          const isFuture = i > TODAY_IDX;
          const pct = Math.min((hours / maxH) * 100, 100);
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full rounded-xl flex-1" style={{ backgroundColor: "#ffffff06" }}>
                <div className="absolute inset-x-0 pointer-events-none"
                  style={{ top: `${100 - (8 / maxH) * 100}%`, borderTop: "1px dashed rgba(255,255,255,0.08)" }} />
                {!isFuture && pct > 0 && (
                  <div className="absolute bottom-0 inset-x-0 rounded-xl" style={{
                    height: `${pct}%`,
                    background: isToday
                      ? "linear-gradient(to top, #61afef 0%, #9edcff 100%)"
                      : "linear-gradient(to top, rgba(97,175,239,0.55) 0%, rgba(158,220,255,0.25) 100%)",
                    boxShadow: isToday ? "0 0 20px rgba(97,175,239,0.6)" : undefined,
                  }} />
                )}
                {isToday && (
                  <div className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ border: "1px solid rgba(97,175,239,0.5)", boxShadow: "inset 0 0 10px rgba(97,175,239,0.08)" }} />
                )}
                {!isFuture && hours > 0 && (
                  <div className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ top: `calc(${100 - pct}% - 18px)` }}>
                    <span className="text-[9px] font-bold tabular-nums"
                      style={{ color: isToday ? "#9edcff" : "rgba(97,175,239,0.5)" }}>{hours}h</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold"
                style={{ color: isToday ? "#61afef" : "#4a5568" }}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailySummaryCard() {
  const total = DAILY_TIME.reduce((s, x) => s + x.hours, 0);
  const cx = 80, cy = 80, rMid = 60, strokeW = 14;
  const C = 2 * Math.PI * rMid;
  const GAP = 4;
  let cum = 0;
  const segs = DAILY_TIME.map((seg) => {
    const segLen = (seg.hours / total) * C;
    const draw = Math.max(segLen - GAP, 0);
    const offset = -(cum + GAP / 2);
    cum += segLen;
    return { ...seg, draw, offset };
  });
  return (
    <div className={`${CARD} p-5 h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Daily Summary</h3>
        <span className="text-sm font-black tabular-nums" style={{ color: "#61afef" }}>{total.toFixed(1)}h</span>
      </div>
      <div className="flex-1 flex items-center gap-5">
        <svg width={160} height={160} className="flex-shrink-0">
          <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="#ffffff08" strokeWidth={strokeW} />
          {segs.map((seg, i) => (
            <circle key={i} cx={cx} cy={cy} r={rMid} fill="none" stroke={seg.color} strokeWidth={strokeW}
              strokeDasharray={`${seg.draw} ${C}`} strokeDashoffset={seg.offset}
              strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={26} fontWeight="900" fill="white" fontFamily="inherit">{total.toFixed(1)}</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize={10} fill="#5c6370" fontFamily="inherit">hours today</text>
        </svg>
        <div className="flex-1 space-y-4">
          {DAILY_TIME.map((seg) => (
            <div key={seg.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                </div>
                <span className="text-sm font-black tabular-nums" style={{ color: seg.color }}>{seg.hours}h</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${seg.color}18` }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(seg.hours / total) * 100}%`, backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}50` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextUpCard({ task, onStart }: { task: Task; onStart: () => void }) {
  const prioMeta = PRIORITY_META[task.priority];
  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ backgroundColor: `${task.projectColor}0d`, borderColor: `${task.projectColor}28` }}>
      <div className="px-5 py-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next up</span>
          <span className={cn("flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
            task.priority === "URGENT" && "animate-pulse")}
            style={{ backgroundColor: `${prioMeta.color}18`, color: prioMeta.color }}>
            <prioMeta.Icon className="h-2.5 w-2.5" />{prioMeta.label}
          </span>
        </div>
        <p className="text-lg font-black text-foreground leading-snug mb-1">{task.title}</p>
        <p className="text-sm text-muted-foreground mb-5">{task.project} · {formatMinutes(task.estimatedMinutes)} est.</p>
        <div className="mt-auto">
          <button onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm"
            style={{ backgroundColor: task.projectColor, color: "#1a1d23", boxShadow: `0 0 20px ${task.projectColor}45` }}>
            <Zap className="h-4 w-4" /> Start Focus Session
          </button>
        </div>
      </div>
    </div>
  );
}

function TodayWins({ tasks, onClickTask }: { tasks: Task[]; onClickTask: (t: Task) => void }) {
  if (tasks.length === 0) return null;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Trophy className="h-3.5 w-3.5" style={{ color: "#e5c07b" }} />
        <h3 className="text-sm font-bold text-foreground">Today's wins</h3>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length} completed</span>
        <button className="flex items-center gap-0.5 text-xs text-primary hover:opacity-80 transition-opacity">
          All tasks <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const worked = task.actualMinutes ?? 0;
          const diff = worked - task.estimatedMinutes;
          const underTime = diff < 0;
          return (
            <div key={task.id} onClick={() => onClickTask(task)}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#98c37918" }}>
                <Check className="h-3.5 w-3.5" style={{ color: "#98c379" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">{task.project}</p>
              </div>
              {worked > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold tabular-nums text-foreground">{formatMinutes(worked)}</p>
                  {diff !== 0 && (
                    <p className="text-[10px] tabular-nums font-medium"
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

const EVENT_META: Record<ScheduleEvent["type"], { color: string; icon: FC<{ className?: string; style?: CSSProperties }> }> = {
  MEETING:     { color: "#c678dd", icon: Video },
  FOCUS_BLOCK: { color: "#61afef", icon: Zap },
  BREAK:       { color: "#98c379", icon: Coffee },
  TASK:        { color: "#e5c07b", icon: CheckCircle2 },
};

function UpcomingPanel() {
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
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Upcoming</h3>
        <button className="flex items-center gap-0.5 text-xs text-primary hover:opacity-80">
          Calendar <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div>
        {upcoming.map((event, idx) => {
          const meta = EVENT_META[event.type];
          const Icon = meta.icon;
          return (
            <div key={event.id} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: meta.color }} />
              {event.isNow && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, ${meta.color}12 0%, transparent 55%)` }} />
              )}
              <div className="relative flex items-center gap-3 pl-5 pr-4 py-3"
                style={idx < upcoming.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.06)" } : {}}>
                <div className="flex-shrink-0 w-10 text-right">
                  <p className="text-[13px] font-bold tabular-nums leading-none" style={{ color: meta.color }}>{event.startTime}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatMinutes(event.durationMinutes)}</p>
                </div>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${meta.color}18` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{event.label}</p>
                  {event.source && <p className="text-[10px] text-muted-foreground mt-0.5">{event.source}</p>}
                </div>
                {event.isNow ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: meta.color }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: meta.color }} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>Live</span>
                  </div>
                ) : (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold tabular-nums text-foreground">{formatUntil(event.minutesUntil)}</p>
                    <p className="text-[10px] text-muted-foreground">away</p>
                  </div>
                )}
              </div>
              {event.isNow && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: `${meta.color}15` }}>
                  <div className="h-full" style={{ width: `${event.progressPct}%`, backgroundColor: meta.color, opacity: 0.6 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalsStrip() {
  return (
    <div className="grid grid-cols-3 gap-5 mb-5">
      {GOALS.map((goal) => (
        <div key={goal.id} className={`${CARD} px-5 py-5 relative overflow-hidden`}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 100% 0%, ${goal.color}10 0%, transparent 55%)` }} />
          <div className="relative">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Goal</p>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>{goal.dueLabel}</span>
            </div>
            <div className="flex items-baseline gap-0.5 mb-1">
              <span className="font-black tabular-nums leading-none" style={{ fontSize: "3rem", color: goal.color }}>{goal.progress}</span>
              <span className="text-xl font-black" style={{ color: `${goal.color}60` }}>%</span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-4 truncate">{goal.title}</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${goal.color}15` }}>
              <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color, boxShadow: `0 0 8px ${goal.color}60` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TodayPageClassic() {
  const { settings, clockedIn } = useApp();
  const isDailyMode = settings.timeTrackingMode === "daily";
  const [tasks] = useState<Task[]>(ALL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const PRIORITY_ORDER: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const nextUpTask = tasks.filter((t) => t.status !== "COMPLETED")
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
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Style toggle banner */}
      <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold"
        style={{ background: "rgba(229,192,123,0.08)", border: "1px solid rgba(229,192,123,0.2)", color: "#e5c07b" }}>
        <span>Classic (solid cards) — comparison view</span>
        <a href="/" className="underline opacity-70 hover:opacity-100">← Back to Glassmorphism</a>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-foreground mb-1">Good morning, Alex 👋</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            {todayFormatted}
            <span className="text-muted-foreground/40">·</span>
            <span className="font-medium" style={{ color: "#e06c75" }}>🔥 7-day streak</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground">Your strongest week in 6 months</span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Zap className="h-3.5 w-3.5" /> Start Focus
        </button>
      </div>

      <StatCards streak={7} />
      <ActiveSessionCard taskName="Redesign dashboard components" project="Side Project" projectColor="#61afef" elapsed="28:42" />

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="col-span-2"><WeeklyActivityChart /></div>
        <DailySummaryCard />
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {nextUpTask ? <NextUpCard task={nextUpTask} onStart={() => {}} /> : <div />}
        <TodayWins tasks={completedTasks} onClickTask={setSelectedTask} />
        <UpcomingPanel />
      </div>

      <GoalsStrip />
      <div className="h-8" />

      {selectedTask && (
        <TaskDetailModal open={!!selectedTask} onOpenChange={(o) => { if (!o) setSelectedTask(null); }}
          task={toFullTask(selectedTask)} onChangeStatus={() => {}} onChangePriority={() => {}}
          onChangeType={() => {}} onChangeTask={() => {}} />
      )}
    </div>
  );
}
