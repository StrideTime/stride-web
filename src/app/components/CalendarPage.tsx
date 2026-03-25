import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Clock, X, GripVertical } from "lucide-react";
import { TASKS, PROJECTS, type Task } from "../data/mockData";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarEntry = {
  id: string;
  taskId: number;
  date: string;
  startTime?: string;
  durationMinutes?: number;
};

type DragPayload =
  | { kind: "entry"; entryId: string }
  | { kind: "task";  taskId: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_START_HOUR = 7;
const GRID_END_HOUR   = 20;
const HOUR_HEIGHT     = 64;
const TODAY_STR       = "2026-03-25";
const DAY_LABELS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  { id: "ce12", taskId: 20, date: "2026-03-30", startTime: "10:00", durationMinutes: 150 },
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
  const snapped = Math.round(Math.max(0, px) / HOUR_HEIGHT * 2) * 30;
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
function getTypeLabel(type: Task["type"]): string { return { FEATURE:"Feature", BUG:"Bug", CHORE:"Chore", RESEARCH:"Research" }[type]; }
function encodeDrag(p: DragPayload): string { return JSON.stringify(p); }
function decodeDrag(raw: string): DragPayload | null { try { return JSON.parse(raw); } catch { return null; } }

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

// ─── Backlog panel (week view) ────────────────────────────────────────────────

function BacklogPanel({ allTasks, entries }: { allTasks: Task[]; entries: CalendarEntry[] }) {
  const usedIds   = new Set(entries.map(e => e.taskId));
  const poolTasks = allTasks.filter(t => !usedIds.has(t.id) && t.status !== "COMPLETED");
  return (
    <div className="w-56 flex-shrink-0 border-l border-border flex flex-col bg-sidebar/30">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Backlog</p>
        <p className="text-xs text-muted-foreground mt-0.5">Drag onto a day to schedule</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {poolTasks.length === 0
          ? <p className="text-xs text-muted-foreground text-center py-6">All tasks assigned</p>
          : poolTasks.map(task => {
            const color = getProjectColor(task);
            return (
              <div key={task.id} draggable
                onDragStart={e => { e.dataTransfer.setData("text/plain", encodeDrag({kind:"task",taskId:task.id})); e.dataTransfer.effectAllowed="copy"; }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-card/70 cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/30 transition-colors">
                <GripVertical className="h-3 w-3 text-muted-foreground/40 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-snug">{task.title}</p>
                  {getProjectName(task) && <p className="text-[11px] text-muted-foreground truncate">{getProjectName(task)}</p>}
                </div>
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── Task chip (week view cell) ───────────────────────────────────────────────

function TaskChip({ task, entry }: { task: Task; entry: CalendarEntry }) {
  const color = getProjectColor(task);
  return (
    <div draggable
      onDragStart={e => { e.dataTransfer.setData("text/plain", encodeDrag({kind:"entry",entryId:entry.id})); e.dataTransfer.effectAllowed="move"; }}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs cursor-grab active:cursor-grabbing active:opacity-50 select-none"
      style={{ backgroundColor:`${color}18`, borderLeft:`2px solid ${color}` }}>
      <span className="flex-1 truncate text-foreground font-medium leading-tight">{task.title}</span>
      {entry.startTime && <span className="text-muted-foreground flex-shrink-0 tabular-nums">{fmt12h(entry.startTime)}</span>}
    </div>
  );
}

// ─── Day column (week view) ───────────────────────────────────────────────────

function DayColumn({ date, dayEntries, allTasks, isToday, onDayClick, availableTasks, onAddTask, onDrop }: {
  date: Date; dayEntries: CalendarEntry[]; allTasks: Task[]; isToday: boolean;
  onDayClick: ()=>void; availableTasks: Task[]; onAddTask: (id:number)=>void; onDrop: (p:DragPayload)=>void;
}) {
  const [addOpen,    setAddOpen]    = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const enterCount = useRef(0);
  const dow = date.getDay();

  return (
    <div
      className={cn("flex flex-col min-w-[120px] border-r border-border last:border-r-0 transition-colors",
        isToday    && "bg-primary/[0.025]",
        isDragOver && "bg-primary/10 ring-1 ring-inset ring-primary/30")}
      onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
      onDragEnter={e=>{ e.preventDefault(); enterCount.current++; setIsDragOver(true); }}
      onDragLeave={()=>{ enterCount.current--; if(enterCount.current===0) setIsDragOver(false); }}
      onDrop={e=>{ e.preventDefault(); enterCount.current=0; setIsDragOver(false); const p=decodeDrag(e.dataTransfer.getData("text/plain")); if(p) onDrop(p); }}
    >
      <button onClick={onDayClick}
        className="flex flex-col items-center py-3 border-b border-border w-full hover:bg-accent/50 transition-colors">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider mb-1.5", isToday?"text-primary":"text-muted-foreground")}>
          {DAY_LABELS[dow===0?6:dow-1]}
        </span>
        <span className={cn("w-9 h-9 flex items-center justify-center rounded-full text-base font-semibold", isToday?"bg-primary text-primary-foreground":"text-foreground")}>
          {date.getDate()}
        </span>
      </button>

      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {isDragOver && dayEntries.length===0 && (
          <div className="h-10 rounded-md border-2 border-dashed border-primary/40 flex items-center justify-center">
            <span className="text-xs text-primary/60">Drop here</span>
          </div>
        )}
        {dayEntries.map(entry => {
          const task = allTasks.find(t=>t.id===entry.taskId);
          if (!task) return null;
          return <TaskChip key={entry.id} task={task} entry={entry}/>;
        })}
      </div>

      <div className="px-2 pb-2 relative">
        <button onClick={()=>setAddOpen(o=>!o)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-dashed border-border/60">
          <Plus className="h-3 w-3"/> Add
        </button>
        {addOpen && (
          <AddTaskPopover
            label={date.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
            availableTasks={availableTasks}
            onAdd={id=>{onAddTask(id);setAddOpen(false);}}
            onClose={()=>setAddOpen(false)}/>
        )}
      </div>
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ weekStart, entries, allTasks, selectedDay, onDayClick, onEntryAdd, onEntryMove, onPrevWeek, onNextWeek, onToday }: {
  weekStart: Date; entries: CalendarEntry[]; allTasks: Task[]; selectedDay: string;
  onDayClick: (ds:string)=>void; onEntryAdd: (taskId:number,date:string)=>void;
  onEntryMove: (entryId:string,newDate:string)=>void;
  onPrevWeek:()=>void; onNextWeek:()=>void; onToday:()=>void;
}) {
  const days      = Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const usedIds   = new Set(entries.map(e=>e.taskId));
  const available = allTasks.filter(t=>!usedIds.has(t.id)&&t.status!=="COMPLETED");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">{formatMonthRange(weekStart,days[6])}</h1>
          <button onClick={onToday} className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-accent transition-colors border border-border">Today</button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrevWeek} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"><ChevronLeft className="h-4 w-4 text-muted-foreground"/></button>
          <button onClick={onNextWeek} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"><ChevronRight className="h-4 w-4 text-muted-foreground"/></button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[700px] h-full divide-x divide-border">
            {days.map(day => {
              const ds = toDateStr(day);
              return (
                <DayColumn key={ds} date={day}
                  dayEntries={entries.filter(e=>e.date===ds)} allTasks={allTasks}
                  isToday={ds===TODAY_STR} onDayClick={()=>onDayClick(ds)}
                  availableTasks={available} onAddTask={taskId=>onEntryAdd(taskId,ds)}
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

function TaskPalettePanel({ dateStr, entries, allTasks, onAddEntry, onPanelDrop }: {
  dateStr: string; entries: CalendarEntry[]; allTasks: Task[];
  onAddEntry: (taskId:number)=>void; onPanelDrop: (p:DragPayload)=>void;
}) {
  const dayEntries   = entries.filter(e => e.date === dateStr);
  const dayTaskIds   = [...new Set(dayEntries.map(e => e.taskId))];
  const dayTasks     = dayTaskIds.map(id => allTasks.find(t=>t.id===id)).filter((t): t is Task => !!t);
  const otherTasks   = allTasks.filter(t => !dayTaskIds.includes(t.id) && t.status !== "COMPLETED");

  const [showOthers,  setShowOthers]  = useState(false);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const enterCount = useRef(0);

  return (
    <div
      className={cn("w-64 flex-shrink-0 border-l border-border flex flex-col transition-colors", isDragOver && "bg-primary/5")}
      onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
      onDragEnter={e=>{ e.preventDefault(); enterCount.current++; setIsDragOver(true); }}
      onDragLeave={()=>{ enterCount.current--; if(enterCount.current===0) setIsDragOver(false); }}
      onDrop={e=>{ e.preventDefault(); enterCount.current=0; setIsDragOver(false); const p=decodeDrag(e.dataTransfer.getData("text/plain")); if(p) onPanelDrop(p); }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">Tasks</p>
        <p className="text-xs text-muted-foreground mt-0.5">Drag to grid · drop here to unschedule</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Day's tasks — always draggable, creates new slot each drag */}
        <div className="p-3 space-y-2">
          {isDragOver && (
            <div className="h-10 rounded-md border-2 border-dashed border-primary/40 flex items-center justify-center">
              <span className="text-xs text-primary/70">Drop to unschedule</span>
            </div>
          )}
          {dayTasks.length === 0 && !isDragOver && (
            <p className="text-xs text-muted-foreground text-center py-6 leading-relaxed">
              No tasks for this day yet.<br/>Drag from Backlog or add below.
            </p>
          )}
          {dayTasks.map(task => {
            const color         = getProjectColor(task);
            const taskEntries   = dayEntries.filter(e=>e.taskId===task.id);
            const times         = taskEntries.filter(e=>e.startTime).map(e=>fmt12h(e.startTime!));
            const unscheduled   = taskEntries.filter(e=>!e.startTime).length;
            return (
              <div key={task.id} draggable
                onDragStart={e=>{ e.dataTransfer.setData("text/plain",encodeDrag({kind:"task",taskId:task.id})); e.dataTransfer.effectAllowed="copy"; }}
                className="rounded-lg border border-border bg-card/60 p-2.5 cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors"
                style={{ borderLeftColor:color, borderLeftWidth:2 }}>
                <div className="flex items-start gap-1.5 mb-1">
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs font-semibold text-foreground leading-snug flex-1 min-w-0">{task.title}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-4 mb-2">
                  <span className="truncate">{getProjectName(task)}</span>
                  <span>·</span>
                  <span className="flex-shrink-0">{fmtDuration(task.estimatedMinutes)}</span>
                </div>
                <div className="pl-4 flex flex-wrap gap-1">
                  {times.map((t,i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor:`${color}20`, color }}>{t}</span>
                  ))}
                  {unscheduled > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {unscheduled > 1 ? `${unscheduled}× unscheduled` : "unscheduled"}
                    </span>
                  )}
                  {times.length === 0 && unscheduled === 0 && (
                    <span className="text-[10px] text-muted-foreground/50 italic">drag to schedule</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Other tasks — collapsible */}
        <div className="border-t border-border">
          <button onClick={()=>setShowOthers(o=>!o)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/40 transition-colors">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Other tasks</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground/50">{otherTasks.length}</span>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground/50 transition-transform", showOthers&&"rotate-180")}/>
            </div>
          </button>

          {showOthers && (
            <div className="px-3 pb-3 space-y-1">
              {otherTasks.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-3">All tasks already on this day</p>
                : otherTasks.map(task => {
                  const color = getProjectColor(task);
                  return (
                    <div key={task.id} draggable
                      onDragStart={e=>{ e.dataTransfer.setData("text/plain",encodeDrag({kind:"task",taskId:task.id})); e.dataTransfer.effectAllowed="copy"; }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/60 bg-card/40 cursor-grab active:cursor-grabbing active:opacity-60 select-none hover:bg-accent/20 transition-colors group">
                      <GripVertical className="h-3 w-3 text-muted-foreground/30 flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                        {getProjectName(task) && <p className="text-[11px] text-muted-foreground truncate">{getProjectName(task)}</p>}
                      </div>
                      <button
                        onClick={e=>{ e.stopPropagation(); onAddEntry(task.id); }}
                        className="flex-shrink-0 h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                        title="Add to this day">
                        <Plus className="h-3 w-3 text-muted-foreground"/>
                      </button>
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled task block (day view grid) ────────────────────────────────────

function TimeBlock({ task, entry, onDelete }: { task: Task; entry: CalendarEntry; onDelete: ()=>void }) {
  const color  = getProjectColor(task);
  const top    = minutesToPx(timeToMinutes(entry.startTime!));
  const height = Math.max(((entry.durationMinutes??30)/60)*HOUR_HEIGHT, 28);

  return (
    <div draggable
      onDragStart={e=>{ e.dataTransfer.setData("text/plain",encodeDrag({kind:"entry",entryId:entry.id})); e.dataTransfer.effectAllowed="move"; }}
      className="absolute left-1 right-1 rounded-lg px-2.5 py-1.5 overflow-hidden cursor-grab active:cursor-grabbing active:opacity-50 select-none hover:brightness-110 transition-all group"
      style={{ top, height, backgroundColor:`${color}20`, border:`1px solid ${color}45` }}>
      <button
        onClick={e=>{ e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 h-4 w-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/60 hover:bg-destructive/20 transition-all z-10">
        <X className="h-2.5 w-2.5 text-muted-foreground"/>
      </button>
      <p className="text-xs font-semibold leading-tight truncate pr-4" style={{color}}>{task.title}</p>
      {height >= 44 && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {fmt12h(entry.startTime!)}
          {entry.durationMinutes && ` · ${fmtDuration(entry.durationMinutes)}`}
        </p>
      )}
    </div>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────

function DayView({ dateStr, entries, allTasks, onBack, onSchedule, onUnschedule, onAddEntry, onAddEntryAtTime, onDeleteEntry }: {
  dateStr: string; entries: CalendarEntry[]; allTasks: Task[]; onBack: ()=>void;
  onSchedule: (id:string,time:string,dur:number)=>void;
  onUnschedule: (id:string)=>void;
  onAddEntry: (taskId:number,date:string)=>void;
  onAddEntryAtTime: (taskId:number,date:string,time:string,dur:number)=>void;
  onDeleteEntry: (id:string)=>void;
}) {
  const date      = parseDate(dateStr);
  const isToday   = dateStr === TODAY_STR;
  const scheduled = entries.filter(e => e.date===dateStr && e.startTime);

  const [dragOverGrid, setDragOverGrid] = useState(false);
  const [dropTime,     setDropTime]     = useState<string|null>(null);
  const gridEnterCount = useRef(0);
  const taskAreaRef    = useRef<HTMLDivElement>(null);

  const gridHours   = Array.from({length:GRID_END_HOUR-GRID_START_HOUR},(_,i)=>GRID_START_HOUR+i);
  const totalGridPx = gridHours.length * HOUR_HEIGHT;
  const nowTop      = minutesToPx(14*60+28); // mocked 2:28 PM

  function timeFromEvent(e: React.DragEvent): string {
    const ref = taskAreaRef.current;
    if (!ref) return "09:00";
    return snapTimeFromPx(e.clientY - ref.getBoundingClientRect().top);
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
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4"/> Week
        </button>
        <div className="w-px h-4 bg-border"/>
        <div className="flex items-center gap-2.5">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
            isToday?"bg-primary text-primary-foreground":"bg-muted text-foreground")}>
            {date.getDate()}
          </div>
          <div>
            <p className="text-foreground font-semibold leading-tight">{date.toLocaleDateString("en-US",{weekday:"long"})}</p>
            <p className="text-xs text-muted-foreground">{date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
          </div>
          {isToday && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Today</span>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{minHeight:totalGridPx+48}}>
            {/* Hour labels */}
            <div className="w-16 flex-shrink-0 pt-4">
              {gridHours.map(h => (
                <div key={h} className="relative flex items-start justify-end pr-3" style={{height:HOUR_HEIGHT}}>
                  <span className="text-xs text-muted-foreground/50 leading-none -mt-2">
                    {h===12?"12 PM":h>12?`${h-12} PM`:`${h} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              className={cn("flex-1 relative border-l border-border pt-4 mr-4 transition-colors", dragOverGrid&&"bg-primary/5")}
              onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; setDropTime(timeFromEvent(e)); }}
              onDragEnter={e=>{ e.preventDefault(); gridEnterCount.current++; setDragOverGrid(true); }}
              onDragLeave={()=>{ gridEnterCount.current--; if(gridEnterCount.current===0){setDragOverGrid(false);setDropTime(null);} }}
              onDrop={handleGridDrop}
            >
              {gridHours.map(h => <div key={h} className="border-t border-border/40" style={{height:HOUR_HEIGHT}}/>)}
              {gridHours.map(h => (
                <div key={`hh-${h}`} className="absolute left-0 right-0 border-t border-border/20"
                  style={{top:minutesToPx(h*60+30)+16}}/>
              ))}

              {/* Current time */}
              {isToday && nowTop>0 && nowTop<totalGridPx && (
                <div className="absolute left-0 right-0 flex items-center pointer-events-none z-10" style={{top:nowTop+16}}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0"/>
                  <div className="flex-1 border-t-2 border-red-500/70"/>
                </div>
              )}

              {/* Drop time indicator */}
              {dragOverGrid && dropTime && (
                <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                  style={{top:minutesToPx(timeToMinutes(dropTime))+16}}>
                  <span className="text-[10px] font-mono font-semibold text-primary bg-background/90 px-1 py-0.5 rounded -ml-1 flex-shrink-0 border border-primary/30">
                    {fmt12h(dropTime)}
                  </span>
                  <div className="flex-1 border-t-2 border-primary border-dashed opacity-70"/>
                </div>
              )}

              {/* Task blocks */}
              <div ref={taskAreaRef} className="absolute inset-0 top-4">
                {scheduled.map(entry => {
                  const task = allTasks.find(t=>t.id===entry.taskId);
                  if (!task || !entry.startTime) return null;
                  return <TimeBlock key={entry.id} task={task} entry={entry} onDelete={()=>onDeleteEntry(entry.id)}/>;
                })}
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
        />
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export function CalendarPage() {
  const [view,        setView]        = useState<"week"|"day">("week");
  const [selectedDay, setSelectedDay] = useState(TODAY_STR);
  const [weekStart,   setWeekStart]   = useState(()=>getMonday(parseDate(TODAY_STR)));
  const [entries,     setEntries]     = useState<CalendarEntry[]>(INITIAL_ENTRIES);

  const myTasks = TASKS.filter(t=>t.assigneeId==="u1");

  const addEntry       = (taskId:number, date:string)                                       => setEntries(p=>[...p,{id:`ce-${Date.now()}`,taskId,date}]);
  const addEntryAtTime = (taskId:number, date:string, time:string, dur:number)              => setEntries(p=>[...p,{id:`ce-${Date.now()}`,taskId,date,startTime:time,durationMinutes:dur}]);
  const scheduleEntry  = (id:string, time:string, dur:number)                               => setEntries(p=>p.map(e=>e.id===id?{...e,startTime:time,durationMinutes:dur}:e));
  const unscheduleEntry= (id:string)                                                        => setEntries(p=>p.map(e=>e.id===id?{...e,startTime:undefined,durationMinutes:undefined}:e));
  const moveEntry      = (id:string, newDate:string)                                        => setEntries(p=>p.map(e=>e.id===id?{...e,date:newDate}:e));
  const deleteEntry    = (id:string)                                                        => setEntries(p=>p.filter(e=>e.id!==id));

  if (view === "day") return (
    <div className="h-full flex flex-col overflow-hidden">
      <DayView dateStr={selectedDay} entries={entries} allTasks={myTasks}
        onBack={()=>setView("week")} onSchedule={scheduleEntry} onUnschedule={unscheduleEntry}
        onAddEntry={addEntry} onAddEntryAtTime={addEntryAtTime} onDeleteEntry={deleteEntry}/>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WeekView weekStart={weekStart} entries={entries} allTasks={myTasks}
        selectedDay={selectedDay} onDayClick={ds=>{setSelectedDay(ds);setView("day");}}
        onEntryAdd={addEntry} onEntryMove={moveEntry}
        onPrevWeek={()=>setWeekStart(d=>addDays(d,-7))}
        onNextWeek={()=>setWeekStart(d=>addDays(d,7))}
        onToday={()=>setWeekStart(getMonday(parseDate(TODAY_STR)))}/>
    </div>
  );
}
