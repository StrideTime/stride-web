import { useState, useRef, useEffect, type ComponentType } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, GripVertical, Search, Coffee, Users, Target, Tag, Repeat, ListTodo } from "lucide-react";
import { TASKS, PROJECTS, type Task } from "../data/mockData";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "BREAK" | "MEETING" | "FOCUS" | "OTHER";
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun

type RecurrenceEnd =
  | { type: "never" }
  | { type: "date";  date: string  }
  | { type: "count"; count: number };

type RecurrenceRule = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;             // every N units (1 = every, 2 = every other, …)
  days?: DayOfWeek[];           // weekly: which days of the week
  monthlyMode?: "date" | "weekday"; // monthly: same calendar date vs same nth-weekday
  end: RecurrenceEnd;
};

type CalendarEntry = {
  id: string;
  taskId?: number;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  eventType?: EventType;
  eventTitle?: string;
  recurrence?: RecurrenceRule;
};

type DragPayload =
  | { kind: "entry"; entryId: string }
  | { kind: "task";  taskId: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_START_HOUR = 7;
const GRID_END_HOUR   = 20;
const HOUR_HEIGHT     = 128; // 4 × 32px — each 15-min block = 32px (same as old 30-min blocks)
const TODAY_STR       = "2026-03-25";
const DAY_LABELS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WORK_START_HOUR = 9;
const WORK_END_HOUR   = 18;

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; Icon: ComponentType<{ className?: string }> }> = {
  BREAK:   { label: "Break",   color: "#10b981", Icon: Coffee  },
  MEETING: { label: "Meeting", color: "#6366f1", Icon: Users   },
  FOCUS:   { label: "Focus",   color: "#f59e0b", Icon: Target  },
  OTHER:   { label: "Other",   color: "#94a3b8", Icon: Tag     },
};

const DOW_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const DOW_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 15,  label: "15 min"  },
  { value: 30,  label: "30 min"  },
  { value: 45,  label: "45 min"  },
  { value: 60,  label: "1 hour"  },
  { value: 90,  label: "1.5 hr"  },
  { value: 120, label: "2 hours" },
];

const INITIAL_ENTRIES: CalendarEntry[] = [
  { id: "ce1",  taskId: 1,  date: "2026-03-23", startTime: "09:00", durationMinutes: 30  },
  { id: "ce2",  taskId: 3,  date: "2026-03-23", startTime: "10:00", durationMinutes: 15  },
  { id: "ce3",  taskId: 4,  date: "2026-03-24", startTime: "11:00", durationMinutes: 45  },
  { id: "ce4",  taskId: 2,  date: "2026-03-24", startTime: "14:00", durationMinutes: 60  },
  { id: "ce5",  taskId: 15, date: "2026-03-25"                                           },
  { id: "ce6",  taskId: 5,  date: "2026-03-25", startTime: "13:00", durationMinutes: 120 },
  { id: "ce7",  taskId: 16, date: "2026-03-25", startTime: "10:00", durationMinutes: 60  },
  { id: "ce8",  taskId: 6,  date: "2026-03-26"                                           },
  { id: "ce9",  taskId: 7,  date: "2026-03-26", startTime: "09:00", durationMinutes: 20  },
  { id: "ce10", taskId: 8,  date: "2026-03-27", startTime: "15:00", durationMinutes: 45  },
  { id: "ce11", taskId: 21, date: "2026-03-27"                                           },
  { id: "ce12", taskId: 20,   date: "2026-03-30", startTime: "10:00", durationMinutes: 150 },
  // Non-task events on today for demo
  { id: "ce13", eventType: "MEETING", eventTitle: "Sprint Planning",  date: "2026-03-25", startTime: "09:00", durationMinutes: 60,
    recurrence: { freq: "weekly", interval: 1, days: [3] as DayOfWeek[], monthlyMode: "date", end: { type: "never" } } },
  { id: "ce14", eventType: "BREAK",   eventTitle: "Lunch",             date: "2026-03-25", startTime: "12:00", durationMinutes: 60  },
  { id: "ce15", eventType: "FOCUS",   eventTitle: "Deep work session", date: "2026-03-25", startTime: "15:30", durationMinutes: 90  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseDate(s: string): Date { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); }
function formatMonthRange(start: Date, end: Date): string {
  const sm = start.toLocaleString("en-US", { month: "long" });
  const em = end.toLocaleString("en-US", { month: "long" });
  return sm === em ? `${sm} ${start.getFullYear()}` : `${sm} – ${em} ${start.getFullYear()}`;
}
function timeToMinutes(t: string): number { const [h,m] = t.split(":").map(Number); return h*60+m; }
function minutesToPx(minutes: number): number { return ((minutes - GRID_START_HOUR*60) / 60) * HOUR_HEIGHT; }
function snapTimeFromPx(px: number): string {
  const snapped = Math.round(Math.max(0, px) / HOUR_HEIGHT * 4) * 15; // 4 snaps/hour = 15 min
  const total   = Math.max(GRID_START_HOUR*60, Math.min((GRID_END_HOUR-1)*60, GRID_START_HOUR*60 + snapped));
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}
function fmt12h(t: string): string {
  const [h,m] = t.split(":").map(Number);
  return (m===0) ? `${h%12||12} ${h>=12?"PM":"AM"}` : `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function fmtDuration(min: number): string {
  if (min < 60) return `${min}m`;
  return (min%60) ? `${Math.floor(min/60)}h ${min%60}m` : `${min/60}h`;
}
function getProjectColor(task: Task): string { return PROJECTS.find(p=>p.id===task.projectId)?.color ?? "#61afef"; }
function getProjectName(task: Task): string  { return PROJECTS.find(p=>p.id===task.projectId)?.name  ?? ""; }

// ─── Recurrence helpers ───────────────────────────────────────────────────────

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

// Returns e.g. "the 2nd Tuesday" or "the last Friday" based on the event's date
function getNthWeekdayLabel(dateStr: string): string {
  const d          = parseDate(dateStr);
  const dayOfMonth = d.getDate();
  const dayOfWeek  = d.getDay();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const isLast     = dayOfMonth + 7 > daysInMonth;
  if (isLast) return `the last ${DOW_FULL[dayOfWeek]}`;
  return `the ${ordinal(Math.ceil(dayOfMonth / 7))} ${DOW_FULL[dayOfWeek]}`;
}

function formatRecurrence(rule: RecurrenceRule, dateStr: string): string {
  const { freq, interval, days, monthlyMode, end } = rule;
  const every = (n: number, unit: string) =>
    n === 1 ? `Every ${unit}` : `Every ${n} ${unit}s`;

  let base = "";
  if (freq === "daily") {
    base = every(interval, "day");
  } else if (freq === "weekly") {
    const dayList = (days ?? []).slice().sort((a, b) => a - b).map(d => DOW_SHORT[d]).join(", ");
    base = `${every(interval, "week")}${dayList ? ` on ${dayList}` : ""}`;
  } else if (freq === "monthly") {
    const suffix = monthlyMode === "weekday"
      ? `on ${getNthWeekdayLabel(dateStr)}`
      : `on the ${ordinal(parseDate(dateStr).getDate())}`;
    base = `${every(interval, "month")} ${suffix}`;
  } else {
    const d = parseDate(dateStr);
    const monthName = d.toLocaleString("en-US", { month: "long" });
    base = `${every(interval, "year")} on ${monthName} ${d.getDate()}`;
  }

  if (end.type === "date") {
    const until = parseDate(end.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${base}, until ${until}`;
  }
  if (end.type === "count") return `${base}, ${end.count}×`;
  return base;
}
function getTypeLabel(type: Task["type"]): string { return { FEATURE:"Feature", BUG:"Bug", CHORE:"Chore", RESEARCH:"Research" }[type]; }
function encodeDrag(p: DragPayload): string { return JSON.stringify(p); }
function decodeDrag(raw: string): DragPayload | null { try { return JSON.parse(raw); } catch { return null; } }

// ─── External link badge ─────────────────────────────────────────────────────

const PROVIDER_BADGE: Record<string, { bg: string; color: string }> = {
  jira:   { bg: "#4C9AFF1A", color: "#4C9AFF" },
  github: { bg: "#8b949e1A", color: "#8b949e"  },
  linear: { bg: "#8B7FEE1A", color: "#8B7FEE"  },
};

function ExternalBadge({ link }: { link: NonNullable<Task["externalLink"]> }) {
  const s = PROVIDER_BADGE[link.provider] ?? PROVIDER_BADGE.github;
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums flex-shrink-0 leading-none whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {link.id}
    </span>
  );
}

// Tracks how far below the block top the user grabbed — so we snap relative to the block's top
// edge, not the cursor position. Reset to 0 for new-task drags (no existing block).
let _dragOffsetY = 0;
// True while a resize handle is being dragged — prevents the block drag from also firing.
let _isResizing = false;

// ─── Overlap layout algorithm ─────────────────────────────────────────────────
// Assigns each block a (column, totalColumns) so overlapping events sit side-by-side.
// O(n log n) column assignment + O(n²) totalColumns pass — fine for typical n < 20.
type BlockLayout = { entryId: string; column: number; totalColumns: number };

function computeBlockLayout(entries: CalendarEntry[]): BlockLayout[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) =>
    timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!) ||
    (b.durationMinutes ?? 30) - (a.durationMinutes ?? 30)
  );
  // Greedy column assignment: put each event in the first column whose last event has ended
  const colEnds: number[] = [];
  const colOf = new Map<string, number>();
  for (const e of sorted) {
    const start = timeToMinutes(e.startTime!);
    const end   = start + (e.durationMinutes ?? 30);
    let col = colEnds.findIndex(ce => ce <= start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = end;
    colOf.set(e.id, col);
  }
  // totalColumns for each event = highest column index among all events it overlaps + 1
  return sorted.map(e => {
    const start = timeToMinutes(e.startTime!);
    const end   = start + (e.durationMinutes ?? 30);
    let maxCol  = colOf.get(e.id)!;
    for (const o of sorted) {
      if (o.id === e.id) continue;
      const s2 = timeToMinutes(o.startTime!), e2 = s2 + (o.durationMinutes ?? 30);
      if (s2 < end && e2 > start) maxCol = Math.max(maxCol, colOf.get(o.id)!);
    }
    return { entryId: e.id, column: colOf.get(e.id)!, totalColumns: maxCol + 1 };
  });
}

const TIME_SLOTS = (() => {
  const s: {label:string;value:string}[] = [];
  for (let h=GRID_START_HOUR; h<GRID_END_HOUR; h++) for (const m of [0,30]) {
    const v = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    s.push({ label: fmt12h(v), value: v });
  }
  return s;
})();

// ─── Add-task popover ─────────────────────────────────────────────────────────

function AddTaskPopover({ label, availableTasks, onAdd, onClose }: {
  label: string; availableTasks: Task[]; onAdd: (id:number)=>void; onClose: ()=>void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent"><X className="h-3 w-3 text-muted-foreground" /></button>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {availableTasks.length === 0
          ? <p className="px-3 py-4 text-xs text-muted-foreground text-center">No unassigned tasks</p>
          : availableTasks.map(task => {
            const color = getProjectColor(task);
            return (
              <button key={task.id} onClick={()=>onAdd(task.id)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent text-left">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  {getProjectName(task) && <p className="text-xs text-muted-foreground truncate">{getProjectName(task)}</p>}
                </div>
              </button>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── My tasks panel (week view) ───────────────────────────────────────────────

type TaskFilter = "all" | "planned" | "unplanned";

function BacklogPanel({ allTasks, entries }: { allTasks: Task[]; entries: CalendarEntry[] }) {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");

  const todayMs = parseDate(TODAY_STR).getTime();

  // Future (today or later) entries for a task, sorted chronologically
  function upcomingFor(taskId: number): CalendarEntry[] {
    return entries
      .filter(e => e.taskId === taskId && parseDate(e.date).getTime() >= todayMs)
      .sort((a, b) => {
        const dd = parseDate(a.date).getTime() - parseDate(b.date).getTime();
        if (dd !== 0) return dd;
        if (a.startTime && b.startTime) return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        return a.startTime ? -1 : 1;
      });
  }

  const q = query.toLowerCase().trim();
  const nonCompleted = allTasks.filter(t => t.status !== "COMPLETED");

  // Planned = has at least one upcoming entry
  const plannedTasks = nonCompleted
    .filter(t => upcomingFor(t.id).length > 0)
    .filter(t => !q || t.title.toLowerCase().includes(q) || getProjectName(t).toLowerCase().includes(q))
    .sort((a, b) => {
      const ua = upcomingFor(a.id), ub = upcomingFor(b.id);
      return parseDate(ua[0].date).getTime() - parseDate(ub[0].date).getTime();
    });

  // Unplanned = no upcoming entries → shown in Suggested section
  const unplannedTasks = nonCompleted
    .filter(t => upcomingFor(t.id).length === 0)
    .filter(t => !q || t.title.toLowerCase().includes(q) || getProjectName(t).toLowerCase().includes(q));

  const showPlanned   = filter === "all" || filter === "planned";
  const showSuggested = filter === "all" || filter === "unplanned";

  const FILTERS: { value: TaskFilter; label: string }[] = [
    { value: "all",       label: "All"       },
    { value: "planned",   label: "Planned"   },
    { value: "unplanned", label: "Unplanned" },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-l border-border flex flex-col">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">My Tasks</p>
          {unplannedTasks.length > 0 && filter !== "planned" && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
              {unplannedTasks.length} unplanned
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"/>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/40 text-foreground"/>
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-sm hover:bg-accent">
              <X className="h-3 w-3 text-muted-foreground/50"/>
            </button>
          )}
        </div>

        {/* Filter pills — segmented control style */}
        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={cn(
                "flex-1 text-[10px] py-1 rounded-md font-semibold transition-colors",
                filter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Planned tasks ── */}
        {showPlanned && (
          <div className="p-3 space-y-2">
            {plannedTasks.length === 0 && !showSuggested && (
              <p className="text-xs text-muted-foreground/50 text-center py-8">
                {q ? `No planned tasks match "${query}"` : "No planned tasks yet"}
              </p>
            )}
            {plannedTasks.map(task => {
              const color    = getProjectColor(task);
              const upcoming = upcomingFor(task.id);
              return (
                <div key={task.id} draggable
                  onDragStart={e => {
                    _dragOffsetY = 0;
                    e.dataTransfer.setData("text/plain", encodeDrag({ kind: "task", taskId: task.id }));
                    e.dataTransfer.effectAllowed = "all";
                  }}
                  className="rounded-lg border border-border bg-card/70 p-2.5 cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors">

                  <div className="flex items-start gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }}/>
                    <p className="text-xs font-semibold text-foreground leading-snug flex-1 truncate min-w-0">{task.title}</p>
                    {task.externalLink && <ExternalBadge link={task.externalLink}/>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 pl-4 mb-2">
                    <span className="truncate">{getProjectName(task)}</span>
                    <span className="flex-shrink-0">·</span>
                    <span className="flex-shrink-0">{fmtDuration(task.estimatedMinutes)}</span>
                  </div>
                  <div className="pl-4 flex flex-wrap gap-1">
                    {upcoming.slice(0, 3).map((e, i) => {
                      const d   = parseDate(e.date);
                      const dow = d.toLocaleDateString("en-US", { weekday: "short" });
                      const label = e.startTime
                        ? `${e.date === TODAY_STR ? "Today" : dow} ${fmt12h(e.startTime)}`
                        : e.date === TODAY_STR ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      return (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ backgroundColor: `${color}20`, color }}>
                          {label}
                        </span>
                      );
                    })}
                    {upcoming.length > 3 && (
                      <span className="text-[10px] text-muted-foreground/40 self-center">+{upcoming.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Suggested (unplanned tasks) ── */}
        {showSuggested && unplannedTasks.length > 0 && (
          <div className={cn("border-t border-border/50 pt-2 pb-3", !showPlanned && "border-t-0 pt-3")}>
            <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Suggested</p>
            <div className="px-3 space-y-px">
              {unplannedTasks.map(task => {
                const color = getProjectColor(task);
                return (
                  <div key={task.id} draggable
                    onDragStart={e => {
                      _dragOffsetY = 0;
                      e.dataTransfer.setData("text/plain", encodeDrag({ kind: "task", taskId: task.id }));
                      e.dataTransfer.effectAllowed = "all";
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
                    <p className="text-xs text-foreground/60 truncate flex-1">{task.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when both sections are empty */}
        {showPlanned && plannedTasks.length === 0 && showSuggested && unplannedTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-10 px-4 leading-relaxed">
            {q ? `No tasks match "${query}"` : "No tasks"}
          </p>
        )}
        {filter === "unplanned" && unplannedTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-10">All tasks are planned 🎉</p>
        )}
      </div>
    </div>
  );
}

// ─── Task chip (week view cell) ───────────────────────────────────────────────

function TaskChip({ task, entry }: { task?: Task; entry: CalendarEntry }) {
  const eventConfig = entry.eventType ? EVENT_TYPE_CONFIG[entry.eventType] : null;
  const color    = task ? getProjectColor(task) : (eventConfig?.color ?? "#94a3b8");
  const title    = task ? task.title : (entry.eventTitle ?? eventConfig?.label ?? "Event");
  const subtitle = task ? getProjectName(task) : eventConfig?.label ?? "";
  return (
    <div draggable
      onDragStart={e => { _dragOffsetY = 0; e.dataTransfer.setData("text/plain", encodeDrag({kind:"entry",entryId:entry.id})); e.dataTransfer.effectAllowed="all"; }}
      className="rounded-lg px-2.5 py-2 text-xs cursor-grab active:cursor-grabbing active:opacity-50 select-none hover:brightness-95 transition-all"
      style={{ backgroundColor: `${color}14`, border: `1px solid ${color}28` }}>
      {/* Title row */}
      <div className="flex items-center gap-1.5 mb-1">
        {eventConfig
          ? <eventConfig.Icon className="h-3 w-3 flex-shrink-0" style={{ color: color }}/>
          : <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>}
        <span className="font-semibold text-foreground truncate leading-tight flex-1 min-w-0">{title}</span>
        {task?.externalLink && <ExternalBadge link={task.externalLink}/>}
        {entry.recurrence && <Repeat className="h-2.5 w-2.5 flex-shrink-0 opacity-40" title={formatRecurrence(entry.recurrence, entry.date)}/>}
      </div>
      {/* Meta row */}
      <div className="flex items-center gap-1.5 pl-3 min-w-0">
        <span className="text-[10px] text-muted-foreground/60 truncate flex-1 min-w-0">{subtitle}</span>
        {entry.startTime && (
          <span className="text-[10px] text-muted-foreground/70 tabular-nums flex-shrink-0">{fmt12h(entry.startTime)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Day column (week view) ───────────────────────────────────────────────────

function DayColumn({ date, dayEntries, allTasks, isToday, onDayClick, onDrop }: {
  date: Date; dayEntries: CalendarEntry[]; allTasks: Task[]; isToday: boolean;
  onDayClick: ()=>void; onDrop: (p:DragPayload)=>void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const enterCount = useRef(0);
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;

  return (
    <div
      className={cn("flex flex-col border-r border-border last:border-r-0 transition-colors min-w-0",
        isToday    && "bg-primary/[0.025]",
        isWeekend  && !isToday && "bg-muted/20",
        isDragOver && "bg-primary/10 ring-1 ring-inset ring-primary/30")}
      onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
      onDragEnter={e=>{ e.preventDefault(); enterCount.current++; setIsDragOver(true); }}
      onDragLeave={()=>{ enterCount.current--; if(enterCount.current===0) setIsDragOver(false); }}
      onDrop={e=>{ e.preventDefault(); enterCount.current=0; setIsDragOver(false); const p=decodeDrag(e.dataTransfer.getData("text/plain")); if(p) onDrop(p); }}
    >
      {/* Header — clicking navigates to day view */}
      <button onClick={onDayClick}
        className="flex flex-col items-center py-3 border-b border-border w-full hover:bg-accent/50 transition-colors flex-shrink-0">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider mb-1.5",
          isToday ? "text-primary" : isWeekend ? "text-muted-foreground/35" : "text-muted-foreground")}>
          {DAY_LABELS[dow===0?6:dow-1]}
        </span>
        <span className={cn("w-9 h-9 flex items-center justify-center rounded-full text-base font-semibold",
          isToday ? "bg-primary text-primary-foreground" : isWeekend ? "text-muted-foreground/35" : "text-foreground")}>
          {date.getDate()}
        </span>
      </button>

      {/* Body — clicking anywhere on the background navigates to day view */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto cursor-pointer" onClick={onDayClick}>
        {isDragOver && dayEntries.length===0 && (
          <div className="h-10 rounded-md border-2 border-dashed border-primary/40 flex items-center justify-center">
            <span className="text-xs text-primary/60">Drop here</span>
          </div>
        )}
        {dayEntries.map(entry => {
          const task        = entry.taskId ? allTasks.find(t=>t.id===entry.taskId) : undefined;
          const eventConfig = entry.eventType ? EVENT_TYPE_CONFIG[entry.eventType] : null;
          if (!task && !eventConfig) return null;
          return <TaskChip key={entry.id} task={task} entry={entry}/>;
        })}
      </div>

    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ weekStart, entries, allTasks, selectedDay, onDayClick, onEntryAdd, onEntryMove, onPrevWeek, onNextWeek, onToday, onAddEvent }: {
  weekStart: Date; entries: CalendarEntry[]; allTasks: Task[]; selectedDay: string;
  onDayClick: (ds:string)=>void; onEntryAdd: (taskId:number,date:string)=>void;
  onEntryMove: (entryId:string,newDate:string)=>void;
  onPrevWeek:()=>void; onNextWeek:()=>void; onToday:()=>void;
  onAddEvent?: (entry: Omit<CalendarEntry,"id">) => void;
}) {
  const days = Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const [showEventModal, setShowEventModal] = useState(false);

  const isCurrentWeek = toDateStr(weekStart) === toDateStr(getMonday(parseDate(TODAY_STR)));
  // Default modal date: today if viewing current week, otherwise first day of the viewed week
  const modalDefaultDate = isCurrentWeek ? TODAY_STR : toDateStr(weekStart);

  return (
    <div className="flex flex-col h-full">
      {showEventModal && (
        <NewEventModal dateStr={modalDefaultDate} allTasks={allTasks} onClose={() => setShowEventModal(false)}
          onAdd={entry => { onAddEvent?.(entry); setShowEventModal(false); }}/>
      )}
      {/* Header — 3-column grid so navigation is centred */}
      <div className="grid grid-cols-3 items-center px-4 py-3 border-b border-border flex-shrink-0">
        {/* Left — title */}
        <div>
          <h1 className="text-sm font-semibold text-foreground">Calendar</h1>
        </div>

        {/* Centre — prev / month range + Today / next */}
        <div className="flex items-center justify-center gap-1">
          <button onClick={onPrevWeek}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            title="Previous week">
            <ChevronLeft className="h-4 w-4 text-muted-foreground"/>
          </button>
          <div className="px-2">
            <p className="text-sm font-semibold text-foreground text-center">{formatMonthRange(weekStart,days[6])}</p>
          </div>
          <button onClick={onToday}
            className={cn("text-xs px-2.5 py-1.5 rounded-md border transition-colors font-medium mx-0.5",
              isCurrentWeek
                ? "border-primary/30 bg-primary/10 text-primary cursor-default"
                : "border-border hover:bg-accent text-muted-foreground hover:text-foreground")}>
            Today
          </button>
          <button onClick={onNextWeek}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            title="Next week">
            <ChevronRight className="h-4 w-4 text-muted-foreground"/>
          </button>
        </div>

        {/* Right — new event button */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5"/>
            New event
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto min-w-0">
          {/* CSS grid gives every column exactly equal width; min-w ensures horizontal scroll on small screens */}
          <div className="grid grid-cols-7 h-full divide-x divide-border min-w-[840px]">
            {days.map(day => {
              const ds = toDateStr(day);
              return (
                <DayColumn key={ds} date={day}
                  dayEntries={entries.filter(e=>e.date===ds)} allTasks={allTasks}
                  isToday={ds===TODAY_STR} onDayClick={()=>onDayClick(ds)}
                  onDrop={p=>{
                    if (p.kind==="task") onEntryAdd(p.taskId,ds);
                    else onEntryMove(p.entryId,ds);
                  }}/>
              );
            })}
          </div>
        </div>
        <BacklogPanel allTasks={allTasks} entries={entries}/>
      </div>
    </div>
  );
}

// ─── Task palette panel (day view) ───────────────────────────────────────────

function TaskPalettePanel({ dateStr, entries, allTasks, onAddEntry, onPanelDrop, onGoToTasks }: {
  dateStr: string; entries: CalendarEntry[]; allTasks: Task[];
  onAddEntry: (taskId: number) => void; onPanelDrop: (p: DragPayload) => void;
  onGoToTasks?: () => void;
}) {
  const [query,      setQuery]      = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const enterCount = useRef(0);

  const dayEntries         = entries.filter(e => e.date === dateStr);
  const scheduledEntries   = dayEntries
    .filter(e => e.startTime)
    .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));
  const unscheduledEntries = dayEntries.filter(e => !e.startTime);
  const dayTaskIds         = new Set(dayEntries.filter(e => e.taskId != null).map(e => e.taskId as number));

  // Tasks assigned to this user but not yet on this day
  const availableTasks = allTasks.filter(t => !dayTaskIds.has(t.id) && t.status !== "COMPLETED");
  const q              = query.toLowerCase().trim();
  const searchResults  = q
    ? availableTasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        getProjectName(t).toLowerCase().includes(q) ||
        getTypeLabel(t.type).toLowerCase().includes(q)
      )
    : availableTasks;
  const isSearching = q.length > 0;

  return (
    <div
      className={cn(
        "w-72 flex-shrink-0 border-l border-border flex flex-col transition-colors",
        isDragOver && "bg-primary/5"
      )}
      onDragOver={e => { e.preventDefault(); }}
      onDragEnter={e => { e.preventDefault(); enterCount.current++; setIsDragOver(true); }}
      onDragLeave={() => { enterCount.current--; if (enterCount.current === 0) setIsDragOver(false); }}
      onDrop={e => {
        e.preventDefault(); enterCount.current = 0; setIsDragOver(false);
        const p = decodeDrag(e.dataTransfer.getData("text/plain")); if (p) onPanelDrop(p);
      }}
    >
      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Tasks</p>
          {isDragOver && (
            <span className="text-xs font-medium text-primary animate-pulse">Drop to unschedule</span>
          )}
        </div>
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks to add…"
            className="w-full pl-8 pr-7 py-2 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/40 text-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-sm hover:bg-accent">
              <X className="h-3 w-3 text-muted-foreground/50" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Search results ── */}
        {isSearching && (
          <div className="p-3 space-y-1">
            {searchResults.length === 0
              ? <p className="text-xs text-muted-foreground/50 text-center py-8">No tasks match "{query}"</p>
              : searchResults.map(task => {
                  const color = getProjectColor(task);
                  return (
                    <div key={task.id} draggable
                      onDragStart={e => {
                        _dragOffsetY = 0;
                        e.dataTransfer.setData("text/plain", encodeDrag({ kind: "task", taskId: task.id }));
                        e.dataTransfer.effectAllowed = "all";
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-transparent hover:border-border/60 hover:bg-accent/30 cursor-grab active:cursor-grabbing active:opacity-60 select-none transition-all group">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                          {getProjectName(task)} · {fmtDuration(task.estimatedMinutes)}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onAddEntry(task.id); setQuery(""); }}
                        className="flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                        title="Add to this day">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── Default (non-search) state ── */}
        {!isSearching && (
          <>
            {/* Scheduled section */}
            {scheduledEntries.length > 0 && (
              <div className="pt-3">
                <div className="px-4 pb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Scheduled</span>
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 font-medium tabular-nums">{scheduledEntries.length}</span>
                </div>
                <div className="px-3 space-y-1.5 pb-3">
                  {scheduledEntries.map(entry => {
                    const task        = entry.taskId ? allTasks.find(t => t.id === entry.taskId) : undefined;
                    const eventConfig = entry.eventType ? EVENT_TYPE_CONFIG[entry.eventType] : null;
                    if (!task && !eventConfig) return null;
                    const color    = task ? getProjectColor(task) : eventConfig!.color;
                    const title    = task ? task.title : (entry.eventTitle ?? eventConfig!.label);
                    const subtitle = task ? getProjectName(task) : eventConfig!.label;
                    return (
                      <div key={entry.id} draggable
                        onDragStart={e => {
                          _dragOffsetY = 0;
                          if (task) {
                            e.dataTransfer.setData("text/plain", encodeDrag({ kind: "task", taskId: task.id }));
                          } else {
                            e.dataTransfer.setData("text/plain", encodeDrag({ kind: "entry", entryId: entry.id }));
                          }
                          e.dataTransfer.effectAllowed = "all";
                        }}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:brightness-95 transition-all"
                        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}30` }}>
                        {eventConfig && <eventConfig.Icon className="h-4 w-4 flex-shrink-0" style={{ color }}/>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate leading-snug flex-1 min-w-0">{title}</p>
                            {task?.externalLink && <ExternalBadge link={task.externalLink}/>}
                            {entry.recurrence && <Repeat className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/40" title={formatRecurrence(entry.recurrence, entry.date)}/>}
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{subtitle}</p>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-0.5">
                          <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: `${color}22`, color }}>
                            {fmt12h(entry.startTime!)}
                          </div>
                          <p className="text-[9px] text-muted-foreground/50">{fmtDuration(entry.durationMinutes ?? 30)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unscheduled section */}
            {unscheduledEntries.length > 0 && (
              <div className={cn("border-t border-border/40 pt-3", scheduledEntries.length === 0 && "border-t-0")}>
                <div className="px-4 pb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Unscheduled</span>
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 font-medium tabular-nums">{unscheduledEntries.length}</span>
                </div>
                <div className="px-3 space-y-1.5 pb-3">
                  {unscheduledEntries.map(entry => {
                    const task = allTasks.find(t => t.id === entry.taskId);
                    if (!task) return null;
                    const color = getProjectColor(task);
                    return (
                      <div key={entry.id} draggable
                        onDragStart={e => {
                          _dragOffsetY = 0;
                          e.dataTransfer.setData("text/plain", encodeDrag({ kind: "entry", entryId: entry.id }));
                          e.dataTransfer.effectAllowed = "all";
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors group"
                        style={{ borderColor: `${color}45` }}>
                        <GripVertical className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                          <p className="text-[10px] text-muted-foreground/50 truncate">
                            {getProjectName(task)} · {fmtDuration(task.estimatedMinutes)}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground/40 italic flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">drag →</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {scheduledEntries.length === 0 && unscheduledEntries.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                  No tasks planned for this day.<br />Search above to find and add tasks.
                </p>
              </div>
            )}

            {/* ── Suggested tasks ── */}
            <div className="border-t border-border/50 pt-2 pb-3">
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Suggested</p>
              <div className="px-3 space-y-px">
                {availableTasks.length === 0
                  ? <p className="text-xs text-muted-foreground/40 text-center py-4">All your tasks are on this day</p>
                  : availableTasks.slice(0, 8).map(task => {
                      const color = getProjectColor(task);
                      return (
                        <div key={task.id} draggable
                          onDragStart={e => {
                            _dragOffsetY = 0;
                            e.dataTransfer.setData("text/plain", encodeDrag({ kind: "task", taskId: task.id }));
                            e.dataTransfer.effectAllowed = "all";
                          }}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors group">
                          <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <p className="text-xs text-foreground/60 truncate flex-1">{task.title}</p>
                          <button
                            onClick={e => { e.stopPropagation(); onAddEntry(task.id); }}
                            className="flex-shrink-0 h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground transition-all"
                            title="Add to this day">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </>
        )}

        {/* Drop-to-unschedule affordance when dragging over panel */}
        {isDragOver && (
          <div className="mx-3 mb-3 mt-1 h-10 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
            <span className="text-xs text-primary/60 font-medium">Release to unschedule</span>
          </div>
        )}
      </div>

      {/* Footer — view all tasks */}
      <div className="border-t border-border flex-shrink-0">
        <button
          onClick={onGoToTasks}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors",
            onGoToTasks
              ? "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              : "text-muted-foreground/30 cursor-default"
          )}>
          View all tasks
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Scheduled task block (day view grid) ────────────────────────────────────

function TimeBlock({ task, entry, onDelete, onResizeStart, liveResize, column, totalColumns }: {
  task?: Task; entry: CalendarEntry; onDelete: ()=>void;
  onResizeStart: (edge: "top"|"bottom") => void;
  liveResize?: { startTime: string; durationMinutes: number } | null;
  column: number; totalColumns: number;
}) {
  const eventConfig = entry.eventType ? EVENT_TYPE_CONFIG[entry.eventType] : null;
  const color        = task ? getProjectColor(task) : (eventConfig?.color ?? "#94a3b8");
  const title        = task ? task.title : (entry.eventTitle ?? eventConfig?.label ?? "Event");
  const displayStart = liveResize?.startTime      ?? entry.startTime!;
  const displayDur   = liveResize?.durationMinutes ?? (entry.durationMinutes ?? 30);
  const top    = minutesToPx(timeToMinutes(displayStart));
  const height = Math.max((displayDur / 60) * HOUR_HEIGHT, HOUR_HEIGHT / 4);
  // Column geometry: 2px gap between blocks, 1px inset from grid edges
  const GAP = 2;
  const leftPct  = (column / totalColumns) * 100;
  const widthPct = (1     / totalColumns) * 100;
  const leftInset  = column === 0                 ? 1 : GAP / 2;
  const rightInset = column === totalColumns - 1  ? 1 : GAP / 2;

  return (
    <div draggable
      onDragStart={e => {
        if (_isResizing) { e.preventDefault(); return; }
        _dragOffsetY = e.clientY - e.currentTarget.getBoundingClientRect().top;
        e.dataTransfer.setData("text/plain", encodeDrag({kind:"entry",entryId:entry.id}));
        e.dataTransfer.effectAllowed = "all";
      }}
      className="absolute rounded-lg px-2.5 py-1.5 overflow-hidden select-none hover:brightness-110 transition-[top,height,left,width] duration-75 group backdrop-blur-sm"
      style={{
        top, height,
        left:  `calc(${leftPct}%  + ${leftInset}px)`,
        width: `calc(${widthPct}% - ${leftInset + rightInset}px)`,
        backgroundColor: `${color}28`,
        border: `1px solid ${color}55`,
        cursor: liveResize ? "ns-resize" : "grab",
      }}>

      {/* Delete button */}
      <button onClick={e=>{ e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 h-5 w-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-destructive text-muted-foreground hover:text-white transition-all z-10 shadow-sm">
        <X className="h-3 w-3"/>
      </button>

      {/* Title row */}
      <div className="flex items-center gap-1 min-w-0 pr-4">
        {eventConfig && <eventConfig.Icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color }}/>}
        <p className="text-xs font-semibold leading-tight truncate flex-1 min-w-0" style={{color}}>{title}</p>
        {task?.externalLink && height >= HOUR_HEIGHT / 2 && <ExternalBadge link={task.externalLink}/>}
        {entry.recurrence && <Repeat className="h-2.5 w-2.5 flex-shrink-0 opacity-40" style={{ color }} title={formatRecurrence(entry.recurrence, entry.date)}/>}
      </div>

      {height >= HOUR_HEIGHT / 2 && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {fmt12h(displayStart)}{` · ${fmtDuration(displayDur)}`}
        </p>
      )}

      {/* Top resize handle — longer, slightly thinner */}
      <div
        className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); _isResizing = true; onResizeStart("top"); }}>
        <div className="w-16 h-1 rounded-full" style={{backgroundColor: color, opacity: 0.75}}/>
      </div>

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); _isResizing = true; onResizeStart("bottom"); }}>
        <div className="w-16 h-1 rounded-full" style={{backgroundColor: color, opacity: 0.75}}/>
      </div>
    </div>
  );
}

// ─── Recurrence editor ────────────────────────────────────────────────────────

function RecurrenceEditor({ rule, dateStr, onChange }: {
  rule: RecurrenceRule;
  dateStr: string;
  onChange: (r: RecurrenceRule) => void;
}) {
  const d            = parseDate(dateStr);
  const dayOfWeek    = d.getDay() as DayOfWeek;
  const dayOfMonth   = d.getDate();
  const daysInMonth  = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const monthName    = d.toLocaleString("en-US", { month: "long" });

  function setFreq(freq: RecurrenceRule["freq"]) {
    onChange({
      ...rule,
      freq,
      // sensible defaults when switching frequency
      days:        freq === "weekly"  ? (rule.days?.length ? rule.days : [dayOfWeek]) : rule.days,
      monthlyMode: freq === "monthly" ? (rule.monthlyMode ?? "date") : rule.monthlyMode,
    });
  }

  function toggleDay(day: DayOfWeek) {
    const cur  = rule.days ?? [];
    const next = cur.includes(day) ? cur.filter(x => x !== day) : [...cur, day];
    if (next.length === 0) return; // must keep at least one day selected
    onChange({ ...rule, days: next });
  }

  function setEnd(type: RecurrenceEnd["type"]) {
    if (type === "never") onChange({ ...rule, end: { type: "never" } });
    else if (type === "date") onChange({ ...rule, end: { type: "date", date: toDateStr(addDays(d, 30)) } });
    else onChange({ ...rule, end: { type: "count", count: 10 } });
  }

  const FREQS = [
    { value: "daily",   label: "Day"   },
    { value: "weekly",  label: "Week"  },
    { value: "monthly", label: "Month" },
    { value: "yearly",  label: "Year"  },
  ] as const;

  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5";
  const radioRingCls = (active: boolean) =>
    cn("h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
      active ? "border-primary bg-primary" : "border-border hover:border-primary/50");

  return (
    <div className="space-y-4">

      {/* ── Frequency: Every [N] [Day|Week|Month|Year] ── */}
      <div>
        <label className={labelCls}>Repeats every</label>
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} max={99} value={rule.interval}
            onChange={e => onChange({ ...rule, interval: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
            className="w-14 px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground text-center outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"/>
          <div className="flex gap-1">
            {FREQS.map(f => (
              <button key={f.value} onClick={() => setFreq(f.value)}
                className={cn("text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium",
                  rule.freq === f.value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border hover:bg-accent text-muted-foreground hover:text-foreground")}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day picker (weekly only) ── */}
      {rule.freq === "weekly" && (
        <div>
          <label className={labelCls}>On</label>
          <div className="flex gap-1.5">
            {DOW_SHORT.map((label, i) => {
              const day    = i as DayOfWeek;
              const active = rule.days?.includes(day) ?? false;
              return (
                <button key={i} onClick={() => toggleDay(day)}
                  className={cn(
                    "w-8 h-8 rounded-full text-[11px] font-semibold border transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Monthly mode ── */}
      {rule.freq === "monthly" && (
        <div>
          <label className={labelCls}>On</label>
          <div className="space-y-2">
            {([
              { value: "date",    label: `The ${ordinal(dayOfMonth)} of the month` },
              { value: "weekday", label: getNthWeekdayLabel(dateStr) },
            ] as const).map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                <div className={radioRingCls(rule.monthlyMode === opt.value)}
                  onClick={() => onChange({ ...rule, monthlyMode: opt.value })}>
                  {rule.monthlyMode === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
                </div>
                <span className="text-xs text-foreground">{opt.label}</span>
              </label>
            ))}
            {/* Edge case notice when date > 28 */}
            {rule.monthlyMode === "date" && dayOfMonth > 28 && (
              <p className="text-[10px] text-amber-600/80 pl-7 leading-snug">
                Months shorter than {daysInMonth} days will skip this event.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Yearly preview ── */}
      {rule.freq === "yearly" && (
        <p className="text-xs text-muted-foreground/60">
          Repeats every {rule.interval === 1 ? "year" : `${rule.interval} years`} on {monthName} {dayOfMonth}.
        </p>
      )}

      {/* ── End condition ── */}
      <div>
        <label className={labelCls}>Ends</label>
        <div className="space-y-2">
          {/* Never */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={radioRingCls(rule.end.type === "never")} onClick={() => setEnd("never")}>
              {rule.end.type === "never" && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
            </div>
            <span className="text-xs text-foreground">Never</span>
          </label>
          {/* On date */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={radioRingCls(rule.end.type === "date")} onClick={() => setEnd("date")}>
              {rule.end.type === "date" && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
            </div>
            <span className="text-xs text-foreground">On date</span>
            {rule.end.type === "date" && (
              <input type="date" value={rule.end.date}
                onChange={e => onChange({ ...rule, end: { type: "date", date: e.target.value } })}
                className="ml-1 text-xs px-2 py-1 bg-background border border-border rounded-md text-foreground outline-none focus:ring-2 focus:ring-primary/20"/>
            )}
          </label>
          {/* After N occurrences */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={radioRingCls(rule.end.type === "count")} onClick={() => setEnd("count")}>
              {rule.end.type === "count" && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
            </div>
            <span className="text-xs text-foreground">After</span>
            {rule.end.type === "count" && (
              <>
                <input type="number" min={1} max={999} value={rule.end.count}
                  onChange={e => onChange({ ...rule, end: { type: "count", count: Math.max(1, Number(e.target.value) || 1) } })}
                  className="w-16 px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground text-center outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"/>
                <span className="text-xs text-muted-foreground">occurrences</span>
              </>
            )}
            {rule.end.type !== "count" && <span className="text-xs text-muted-foreground">N occurrences</span>}
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── New event modal ──────────────────────────────────────────────────────────
//
// Every block on the calendar is an "event." Event types:
//   FOCUS   — work/focus time; optionally linked to a backlog task.
//             If a task is linked the event shows as that task.
//             If left unlinked it's a free-form focus block.
//   BREAK   — rest, lunch, personal time
//   MEETING — syncs, calls, external meetings
//   OTHER   — anything else

function NewEventModal({ dateStr, allTasks, onClose, onAdd }: {
  dateStr: string;
  allTasks: Task[];
  onClose: () => void;
  onAdd: (entry: Omit<CalendarEntry, "id">) => void;
}) {
  const [eventType,      setEventType]      = useState<EventType>("FOCUS");
  const [title,          setTitle]          = useState("");
  const [linkedTaskId,   setLinkedTaskId]   = useState<number | null>(null);
  const [taskQuery,      setTaskQuery]      = useState("");
  const [date,           setDate]           = useState(dateStr);
  const [startTime,      setStartTime]      = useState("09:00");
  const [duration,       setDuration]       = useState(30);
  const [showRepeat,     setShowRepeat]     = useState(false);
  const [recurrence,     setRecurrence]     = useState<RecurrenceRule>(() => {
    const d = parseDate(dateStr);
    return { freq: "weekly", interval: 1, days: [d.getDay() as DayOfWeek], monthlyMode: "date", end: { type: "never" } };
  });

  const isFocus = eventType === "FOCUS";
  // Focus: always submittable (linked task OR free-form title; defaults to "Focus" if both empty)
  const canSubmit = isFocus ? true : !!title.trim();

  function toggleRepeat() {
    const next = !showRepeat;
    setShowRepeat(next);
    if (next) {
      const d = parseDate(date);
      setRecurrence({ freq: "weekly", interval: 1, days: [d.getDay() as DayOfWeek], monthlyMode: "date", end: { type: "never" } });
    }
  }

  const q = taskQuery.toLowerCase().trim();
  const filteredTasks = allTasks
    .filter(t => t.status !== "COMPLETED")
    .filter(t => !q || t.title.toLowerCase().includes(q) || getProjectName(t).toLowerCase().includes(q));

  function handleSubmit() {
    if (!canSubmit) return;
    const shared = { date, startTime, durationMinutes: duration, recurrence: showRepeat ? recurrence : undefined };
    if (isFocus && linkedTaskId !== null) {
      // Focus with a linked task → pure task entry (renders with project colour + task title)
      onAdd({ ...shared, taskId: linkedTaskId });
    } else if (isFocus) {
      // Focus without a linked task → standalone focus block
      onAdd({ ...shared, eventType: "FOCUS", eventTitle: title.trim() || "Focus" });
    } else {
      onAdd({ ...shared, eventType, eventTitle: title.trim() });
    }
    onClose();
  }

  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2";
  const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-[400px] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <p className="text-sm font-semibold text-foreground">New event</p>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4"/>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Event type ── */}
          <div>
            <label className={labelCls}>Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["FOCUS", "BREAK", "MEETING", "OTHER"] as EventType[]).map(et => {
                const c      = EVENT_TYPE_CONFIG[et];
                const active = eventType === et;
                return (
                  <button key={et} onClick={() => { setEventType(et); setLinkedTaskId(null); setTaskQuery(""); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      active ? "border-2" : "border-border hover:bg-accent/30"
                    )}
                    style={active
                      ? { borderColor: c.color, backgroundColor: `${c.color}15`, color: c.color }
                      : { color: "var(--muted-foreground)" }}>
                    <c.Icon className="h-4 w-4"/>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Focus: optional task link + optional title ── */}
          {isFocus && (
            <div className="space-y-3">
              {/* Task link */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Link a task</label>
                  <span className="text-[10px] text-muted-foreground/40 font-medium">optional</span>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"/>
                  <input type="text" value={taskQuery} onChange={e => { setTaskQuery(e.target.value); if (linkedTaskId) setLinkedTaskId(null); }}
                    placeholder="Search tasks…" autoFocus
                    className="w-full pl-8 pr-3 py-2 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/40 transition-colors"/>
                </div>
                {/* Selected task chip */}
                {linkedTaskId !== null && (() => {
                  const t = allTasks.find(t => t.id === linkedTaskId);
                  if (!t) return null;
                  const color = getProjectColor(t);
                  return (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border mb-2"
                      style={{ backgroundColor: `${color}12`, borderColor: `${color}40` }}>
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
                      <p className="text-xs font-semibold text-foreground flex-1 truncate">{t.title}</p>
                      {t.externalLink && <ExternalBadge link={t.externalLink}/>}
                      <button onClick={() => { setLinkedTaskId(null); }}
                        className="h-4 w-4 flex items-center justify-center rounded hover:bg-accent flex-shrink-0">
                        <X className="h-3 w-3 text-muted-foreground/50"/>
                      </button>
                    </div>
                  );
                })()}
                {/* Task list — only shown when searching or no task linked */}
                {linkedTaskId === null && (
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/60 max-h-36 overflow-y-auto">
                    {filteredTasks.length === 0
                      ? <p className="px-3 py-3 text-xs text-muted-foreground/50 text-center">No tasks found</p>
                      : filteredTasks.map(task => {
                          const color = getProjectColor(task);
                          return (
                            <button key={task.id} onClick={() => { setLinkedTaskId(task.id); setTaskQuery(""); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-colors">
                              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                                <p className="text-[10px] text-muted-foreground/60 truncate">{getProjectName(task)}</p>
                              </div>
                              {task.externalLink && <ExternalBadge link={task.externalLink}/>}
                            </button>
                          );
                        })
                    }
                  </div>
                )}
              </div>

              {/* Free-form title — only shown when no task is linked */}
              {linkedTaskId === null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + " mb-0"}>Title</label>
                    <span className="text-[10px] text-muted-foreground/40 font-medium">defaults to "Focus"</span>
                  </div>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Deep work, Code review…"
                    onKeyDown={e => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
                    className={inputCls + " placeholder:text-muted-foreground/40"}/>
                </div>
              )}
            </div>
          )}

          {/* ── Break / Meeting / Other: just a title ── */}
          {!isFocus && (
            <div>
              <label className={labelCls}>Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={`${EVENT_TYPE_CONFIG[eventType].label}…`} autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
                className={inputCls + " placeholder:text-muted-foreground/40"}/>
            </div>
          )}

          {/* ── Date ── */}
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className={inputCls + " cursor-pointer"}/>
          </div>

          {/* ── Start time + Duration ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start time</label>
              <select value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls + " cursor-pointer"}>
                {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputCls + " cursor-pointer"}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Repeat ── */}
          <div>
            <button onClick={toggleRepeat}
              className={cn("flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors",
                showRepeat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
              <Repeat className="h-3.5 w-3.5"/>
              {showRepeat ? "Repeats" : "Does this repeat?"}
            </button>
            {showRepeat && (
              <div className="mt-3 p-3.5 bg-muted/30 rounded-xl border border-border/50">
                <RecurrenceEditor rule={recurrence} dateStr={date} onChange={setRecurrence}/>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20 flex-shrink-0">
          <button onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────

function DayView({ dateStr, entries, allTasks, onBack, onSchedule, onUnschedule, onAddEntry, onAddEntryAtTime, onDeleteEntry, onNavigateDay, onGoToTasks, onAddEvent }: {
  dateStr: string; entries: CalendarEntry[]; allTasks: Task[]; onBack: ()=>void;
  onSchedule: (id:string,time:string,dur:number)=>void;
  onUnschedule: (id:string)=>void;
  onAddEntry: (taskId:number,date:string)=>void;
  onAddEntryAtTime: (taskId:number,date:string,time:string,dur:number)=>void;
  onDeleteEntry: (id:string)=>void;
  onNavigateDay: (delta: number) => void;
  onGoToTasks?: () => void;
  onAddEvent?: (entry: Omit<CalendarEntry, "id">) => void;
}) {
  const date      = parseDate(dateStr);
  const isToday   = dateStr === TODAY_STR;
  const scheduled = entries.filter(e => e.date===dateStr && e.startTime);

  const [showEventModal, setShowEventModal] = useState(false);
  const [dragOverGrid, setDragOverGrid] = useState(false);
  const [dropTime,     setDropTime]     = useState<string|null>(null);
  const [liveResize,   setLiveResize]   = useState<{entryId:string;startTime:string;durationMinutes:number}|null>(null);
  const gridEnterCount = useRef(0);
  // Ref on the inner overlay container — its top IS 7 AM, so no padding offsets needed
  const gridOverlayRef = useRef<HTMLDivElement>(null);
  // Resize refs — use refs (not state) so mouse handlers always see current values
  const resizeDataRef  = useRef<{entryId:string;edge:"top"|"bottom";originalStart:string;originalDuration:number}|null>(null);
  const liveResizeRef  = useRef(liveResize);
  liveResizeRef.current = liveResize;
  const onScheduleRef  = useRef(onSchedule);
  onScheduleRef.current = onSchedule;

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const rs  = resizeDataRef.current;
      const ref = gridOverlayRef.current;
      if (!rs || !ref) return;
      const overlayTop = ref.getBoundingClientRect().top;
      const rawPx = e.clientY - overlayTop;
      const snapMinutes = (px: number) =>
        Math.round(Math.max(0, px) / HOUR_HEIGHT * 4) * 15; // 15-min snap

      if (rs.edge === "bottom") {
        const endMin   = GRID_START_HOUR * 60 + snapMinutes(rawPx);
        const startMin = timeToMinutes(rs.originalStart);
        const dur      = Math.max(15, Math.min(GRID_END_HOUR * 60 - startMin, endMin - startMin));
        setLiveResize({ entryId: rs.entryId, startTime: rs.originalStart, durationMinutes: dur });
      } else {
        const originalEnd = timeToMinutes(rs.originalStart) + rs.originalDuration;
        const newStart    = Math.max(GRID_START_HOUR * 60, Math.min(originalEnd - 15,
                              GRID_START_HOUR * 60 + snapMinutes(rawPx)));
        const h = Math.floor(newStart / 60), m = newStart % 60;
        setLiveResize({
          entryId: rs.entryId,
          startTime: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,
          durationMinutes: originalEnd - newStart,
        });
      }
    }
    function onMouseUp() {
      const lr = liveResizeRef.current;
      if (lr) onScheduleRef.current(lr.entryId, lr.startTime, lr.durationMinutes);
      resizeDataRef.current = null;
      setLiveResize(null);
      _isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  const gridHours   = Array.from({length:GRID_END_HOUR-GRID_START_HOUR},(_,i)=>GRID_START_HOUR+i);
  const totalGridPx = gridHours.length * HOUR_HEIGHT;
  const nowTop      = minutesToPx(14*60+28); // mocked 2:28 PM

  function timeFromEvent(e: React.DragEvent): string {
    const ref = gridOverlayRef.current;
    if (!ref) return "09:00";
    // ref.top is exactly where 7 AM renders — no padding offset needed.
    // _dragOffsetY anchors the snap to the block's top edge when rescheduling.
    return snapTimeFromPx(e.clientY - ref.getBoundingClientRect().top - _dragOffsetY);
  }

  function handleGridDrop(e: React.DragEvent) {
    e.preventDefault();
    gridEnterCount.current = 0;
    setDragOverGrid(false);
    setDropTime(null);
    const time = timeFromEvent(e);
    const p    = decodeDrag(e.dataTransfer.getData("text/plain"));
    if (!p) return;
    if (p.kind === "entry") {
      const entry = entries.find(en=>en.id===p.entryId);
      onSchedule(p.entryId, time, entry?.durationMinutes??30);
    } else {
      // Always create a new entry — allows scheduling same task multiple times
      onAddEntryAtTime(p.taskId, dateStr, time, 30);
    }
  }

  function handlePanelDrop(p: DragPayload) {
    if (p.kind === "entry") onUnschedule(p.entryId);
    else onAddEntry(p.taskId, dateStr);
  }

  return (
    <div className="flex flex-col h-full">
      {/* New event modal */}
      {showEventModal && (
        <NewEventModal dateStr={dateStr} allTasks={allTasks} onClose={() => setShowEventModal(false)}
          onAdd={entry => { onAddEvent?.(entry); setShowEventModal(false); }}/>
      )}

      {/* Header — 3-column grid keeps the nav cluster truly centred */}
      <div className="grid grid-cols-3 items-center px-4 py-3 border-b border-border flex-shrink-0">

        {/* Left — back to week view */}
        <div className="flex items-center">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-1.5 rounded-lg transition-colors font-medium">
            <ChevronLeft className="h-4 w-4"/>
            Week view
          </button>
        </div>

        {/* Centre — prev arrow · date circle + name · Today · next arrow */}
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onNavigateDay(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            title="Previous day">
            <ChevronLeft className="h-4 w-4 text-muted-foreground"/>
          </button>

          <div className="flex items-center gap-2.5 px-1">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
              isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {date.getDate()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <button
            onClick={() => { const delta = Math.round((parseDate(TODAY_STR).getTime() - date.getTime()) / 86400000); onNavigateDay(delta); }}
            className={cn("text-xs px-2.5 py-1.5 rounded-md border transition-colors font-medium mx-0.5",
              isToday
                ? "border-primary/30 bg-primary/10 text-primary cursor-default"
                : "border-border hover:bg-accent text-muted-foreground hover:text-foreground")}>
            Today
          </button>

          <button onClick={() => onNavigateDay(1)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            title="Next day">
            <ChevronRight className="h-4 w-4 text-muted-foreground"/>
          </button>
        </div>

        {/* Right — new event button (solid so it's unmissable) */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5"/>
            New event
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{minHeight:totalGridPx+48}}>
            {/* Hour labels */}
            <div className="w-16 flex-shrink-0 pt-4">
              {gridHours.map(h => {
                const isWorkHour = h >= WORK_START_HOUR && h < WORK_END_HOUR;
                return (
                  <div key={h} className="relative flex items-start justify-end pr-3" style={{height:HOUR_HEIGHT}}>
                    <span className={cn("text-xs leading-none -mt-2", isWorkHour ? "text-muted-foreground/50" : "text-muted-foreground/25")}>
                      {h===12?"12 PM":h>12?`${h-12} PM`:`${h} AM`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Drop zone — handles all drag events */}
            <div
              className={cn("flex-1 relative border-l border-border pt-4 mr-4 transition-colors", dragOverGrid&&"bg-primary/5")}
              onDragOver={e=>{ e.preventDefault(); setDropTime(timeFromEvent(e)); }}
              onDragEnter={e=>{ e.preventDefault(); gridEnterCount.current++; setDragOverGrid(true); }}
              onDragLeave={()=>{ gridEnterCount.current--; if(gridEnterCount.current===0){setDragOverGrid(false);setDropTime(null);} }}
              onDrop={handleGridDrop}
            >
              {/* Hour-line rows (flow, inside pt-4) */}
              {gridHours.map(h => <div key={h} className="border-t-2 border-border/50" style={{height:HOUR_HEIGHT}}/>)}

              {/* Overlay — top edge = 7 AM exactly. All absolute children use minutesToPx() with no offset. */}
              <div ref={gridOverlayRef} className="absolute inset-0 top-4 pointer-events-none">

                {/* Non-work hours — shaded regions before work start and after work end */}
                {WORK_START_HOUR > GRID_START_HOUR && (
                  <div className="absolute left-0 right-0 bg-muted/30"
                    style={{ top: 0, height: minutesToPx(WORK_START_HOUR * 60) }}/>
                )}
                {WORK_END_HOUR < GRID_END_HOUR && (
                  <div className="absolute left-0 right-0 bg-muted/30"
                    style={{ top: minutesToPx(WORK_END_HOUR * 60), bottom: 0 }}/>
                )}

                {/* 15-min sub-lines: faint at :15/:45, slightly stronger at :30 */}
                {gridHours.flatMap(h => [15, 30, 45].map(m => (
                  <div key={`${h}-${m}`}
                    className={cn("absolute left-0 right-0 border-t",
                      m === 30 ? "border-border/25" : "border-border/12")}
                    style={{top: minutesToPx(h*60+m)}}/>
                )))}

                {/* Current time — use -translate-y-1/2 so the dot/line center sits on nowTop */}
                {isToday && nowTop > 0 && nowTop < totalGridPx && (
                  <div className="absolute left-0 right-0 flex items-center z-10 -translate-y-1/2" style={{top: nowTop}}>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0"/>
                    <div className="flex-1 border-t-2 border-red-500/70"/>
                  </div>
                )}

                {/* Drop-time indicator — -translate-y-1/2 aligns the dashed line with the snap point */}
                {dragOverGrid && dropTime && (
                  <div className="absolute left-0 right-0 flex items-center z-20 -translate-y-1/2"
                    style={{top: minutesToPx(timeToMinutes(dropTime))}}>
                    <span className="text-[10px] font-mono font-semibold text-primary bg-background/90 px-1 py-0.5 rounded -ml-1 flex-shrink-0 border border-primary/30">
                      {fmt12h(dropTime)}
                    </span>
                    <div className="flex-1 border-t-2 border-primary border-dashed opacity-70"/>
                  </div>
                )}
              </div>

              {/* Task blocks — separate layer so pointer-events work on blocks */}
              <div className="absolute inset-0 top-4">
                {(() => {
                  // Substitute live-resize values before computing layout so columns
                  // update in real-time while the user is dragging a resize handle.
                  const effective = scheduled.map(e =>
                    liveResize?.entryId === e.id
                      ? { ...e, startTime: liveResize.startTime, durationMinutes: liveResize.durationMinutes }
                      : e
                  );
                  const layout = new Map(computeBlockLayout(effective).map(l => [l.entryId, l]));
                  return scheduled.map(entry => {
                    const task        = entry.taskId ? allTasks.find(t=>t.id===entry.taskId) : undefined;
                    const eventConfig = entry.eventType ? EVENT_TYPE_CONFIG[entry.eventType] : null;
                    if ((!task && !eventConfig) || !entry.startTime) return null;
                    const lr  = liveResize?.entryId === entry.id
                      ? { startTime: liveResize.startTime, durationMinutes: liveResize.durationMinutes }
                      : null;
                    const { column, totalColumns } = layout.get(entry.id) ?? { column:0, totalColumns:1 };
                    return <TimeBlock key={entry.id} task={task ?? undefined} entry={entry}
                      onDelete={()=>onDeleteEntry(entry.id)}
                      liveResize={lr} column={column} totalColumns={totalColumns}
                      onResizeStart={edge => {
                        resizeDataRef.current = {
                          entryId: entry.id, edge,
                          originalStart: entry.startTime!,
                          originalDuration: entry.durationMinutes ?? 30,
                        };
                        document.body.style.cursor = "ns-resize";
                        document.body.style.userSelect = "none";
                      }}/>;
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Task palette */}
        <TaskPalettePanel
          dateStr={dateStr}
          entries={entries}
          allTasks={allTasks}
          onAddEntry={taskId=>onAddEntry(taskId,dateStr)}
          onPanelDrop={handlePanelDrop}
          onGoToTasks={onGoToTasks}
        />
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export function CalendarPage({ onGoToTasks }: { onGoToTasks?: () => void } = {}) {
  const [view,        setView]        = useState<"week"|"day">("week");
  const [selectedDay, setSelectedDay] = useState(TODAY_STR);
  const [weekStart,   setWeekStart]   = useState(()=>getMonday(parseDate(TODAY_STR)));
  const [entries,     setEntries]     = useState<CalendarEntry[]>(INITIAL_ENTRIES);

  const myTasks = TASKS.filter(t=>t.assigneeId==="u1");

  const addEntry       = (taskId:number, date:string)                                       => setEntries(p=>[...p,{id:`ce-${Date.now()}`,taskId,date}]);
  const addEntryAtTime = (taskId:number, date:string, time:string, dur:number)              => setEntries(p=>[...p,{id:`ce-${Date.now()}`,taskId,date,startTime:time,durationMinutes:dur}]);
  const addEvent       = (e: Omit<CalendarEntry,"id">)                                      => setEntries(p=>[...p,{...e,id:`ce-${Date.now()}`}]);
  const scheduleEntry  = (id:string, time:string, dur:number)                               => setEntries(p=>p.map(e=>e.id===id?{...e,startTime:time,durationMinutes:dur}:e));
  const unscheduleEntry= (id:string)                                                        => setEntries(p=>p.map(e=>e.id===id?{...e,startTime:undefined,durationMinutes:undefined}:e));
  const moveEntry      = (id:string, newDate:string)                                        => setEntries(p=>p.map(e=>e.id===id?{...e,date:newDate}:e));
  const deleteEntry    = (id:string)                                                        => setEntries(p=>p.filter(e=>e.id!==id));

  function navigateDay(delta: number) {
    const d = parseDate(selectedDay);
    d.setDate(d.getDate() + delta);
    const newStr = toDateStr(d);
    setSelectedDay(newStr);
    setWeekStart(getMonday(d)); // keep week view in sync
  }

  if (view === "day") return (
    <div className="h-full flex flex-col overflow-hidden">
      <DayView dateStr={selectedDay} entries={entries} allTasks={myTasks}
        onBack={()=>setView("week")} onSchedule={scheduleEntry} onUnschedule={unscheduleEntry}
        onAddEntry={addEntry} onAddEntryAtTime={addEntryAtTime} onDeleteEntry={deleteEntry}
        onNavigateDay={navigateDay} onGoToTasks={onGoToTasks} onAddEvent={addEvent}/>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WeekView weekStart={weekStart} entries={entries} allTasks={myTasks}
        selectedDay={selectedDay} onDayClick={ds=>{setSelectedDay(ds);setView("day");}}
        onEntryAdd={addEntry} onEntryMove={moveEntry}
        onPrevWeek={()=>setWeekStart(d=>addDays(d,-7))}
        onNextWeek={()=>setWeekStart(d=>addDays(d,7))}
        onToday={()=>setWeekStart(getMonday(parseDate(TODAY_STR)))}
        onAddEvent={addEvent}/>
    </div>
  );
}
