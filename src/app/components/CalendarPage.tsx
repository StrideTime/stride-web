import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Search, Bell, Plus, X, Video, Clock, MapPin, Calendar,
} from "lucide-react";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "important" | "meeting" | "task" | "break" | "focus";

type CalendarEvent = {
  id: string;
  date: string;             // YYYY-MM-DD
  startTime?: string;       // HH:mm — undefined = unscheduled
  endTime?: string;         // HH:mm
  durationMinutes?: number;
  title: string;
  subtitle?: string;
  type: EventType;
  color: string;
  attendees?: { name: string; initials: string; color: string }[];
  meetLink?: string;
  location?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const EVENT_COLORS: Record<EventType, string> = {
  important: "#ef4444",
  meeting:   "#a855f7",
  task:      "#0ea5e9",
  break:     "#10b981",
  focus:     "#f97316",
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  important: "Important",
  meeting:   "Meeting",
  task:      "Task",
  break:     "Break",
  focus:     "Focus",
};

const GRID_START_H  = 7;   // 7 AM
const GRID_END_H    = 21;  // 9 PM
const HOUR_PX       = 60;  // px per hour
const SNAP_MINUTES  = 15;  // snap drag to 15-min grid

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function dateToStr(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getCalendarCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const total    = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const dayNum = i - startPad + 1;
    return dayNum < 1 || dayNum > lastDay.getDate() ? null : new Date(year, month, dayNum);
  });
}

function formatDisplayTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${ampm}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ${h === 1 ? "hour" : "hours"}`;
  return `${h}h ${m}m`;
}

function formatHourLabel(h: number) {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function snapTo(minutes: number, snap: number) {
  return Math.round(minutes / snap) * snap;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function createMockEvents(year: number, month: number): CalendarEvent[] {
  const d = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  return [
    // Scheduled events
    {
      id: "e1", date: d(4), startTime: "11:00", endTime: "12:00", durationMinutes: 60,
      title: "Weekly Stand-up", type: "meeting", color: EVENT_COLORS.meeting,
      attendees: [{ name: "Alex W", initials: "AW", color: "#0ea5e9" }],
      location: "Google Meet",
    },
    {
      id: "e2", date: d(4), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Finance Meeting", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "e3", date: d(8), startTime: "09:00", endTime: "10:15", durationMinutes: 75,
      title: "English Lesson", subtitle: "Online class with tutor",
      type: "important", color: EVENT_COLORS.important,
      attendees: [
        { name: "Alex W", initials: "AW", color: "#0ea5e9" },
        { name: "Ivan M", initials: "IM", color: "#a855f7" },
      ],
      meetLink: "https://meet.google.com",
    },
    {
      id: "e4", date: d(8), startTime: "10:00", endTime: "11:00", durationMinutes: 60,
      title: "Job Interview", subtitle: "Frontend Developer position",
      type: "meeting", color: "#22c55e",
      meetLink: "https://meet.google.com",
    },
    {
      id: "e5", date: d(8), startTime: "13:00", endTime: "15:00", durationMinutes: 120,
      title: "Team Sync Call", subtitle: "Weekly updates",
      type: "meeting", color: "#0ea5e9",
      attendees: [
        { name: "Julia K",  initials: "JK", color: "#f59e0b" },
        { name: "Ivan M",   initials: "IM", color: "#a855f7" },
        { name: "Alex W",   initials: "AW", color: "#0ea5e9" },
        { name: "Sara C",   initials: "SC", color: "#10b981" },
        { name: "David P",  initials: "DP", color: "#ef4444" },
      ],
      location: "Conference Room B",
    },
    {
      id: "e6",  date: d(11), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Marketing Review", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "e7",  date: d(11), startTime: "16:00", endTime: "17:00", durationMinutes: 60,
      title: "Yoga Session", type: "break", color: EVENT_COLORS.break,
      location: "Studio 3",
    },
    {
      id: "e8",  date: d(13), startTime: "11:00", endTime: "12:00", durationMinutes: 60,
      title: "Project Deadline", type: "important", color: EVENT_COLORS.important,
    },
    {
      id: "e9",  date: d(15), startTime: "10:00", endTime: "11:00", durationMinutes: 60,
      title: "Marketing Review", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "e10", date: d(15), startTime: "15:00", endTime: "16:00", durationMinutes: 60,
      title: "Yoga Session", type: "break", color: EVENT_COLORS.break,
    },
    {
      id: "e11", date: d(19), startTime: "11:00", endTime: "12:30", durationMinutes: 90,
      title: "Call with Client", type: "meeting", color: EVENT_COLORS.meeting,
      attendees: [{ name: "Sara C", initials: "SC", color: "#f59e0b" }],
      meetLink: "https://meet.google.com",
    },
    {
      id: "e12", date: d(19), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Brainstorm Ideas", type: "focus", color: EVENT_COLORS.focus,
    },
    {
      id: "e13", date: d(19), startTime: "15:30", endTime: "16:30", durationMinutes: 60,
      title: "Weekly Stand-up", type: "meeting", color: EVENT_COLORS.meeting,
    },
    {
      id: "e14", date: d(20), startTime: "10:00", endTime: "11:00", durationMinutes: 60,
      title: "Project Deadline", type: "important", color: EVENT_COLORS.important,
    },
    {
      id: "e15", date: d(22), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Finance Meeting", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "e16", date: d(25), startTime: "09:30", endTime: "10:30", durationMinutes: 60,
      title: "Design Review", type: "meeting", color: EVENT_COLORS.meeting,
      attendees: [{ name: "Julia K", initials: "JK", color: "#f59e0b" }],
    },
    {
      id: "e17", date: d(25), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Marketing Review", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "e18", date: d(25), startTime: "16:00", endTime: "17:00", durationMinutes: 60,
      title: "Yoga Session", type: "break", color: EVENT_COLORS.break,
    },
    {
      id: "e19", date: d(26), startTime: "11:00", endTime: "12:00", durationMinutes: 60,
      title: "Project Deadline", type: "important", color: EVENT_COLORS.important,
    },
    {
      id: "e20", date: d(29), startTime: "10:00", endTime: "11:00", durationMinutes: 60,
      title: "Sprint Planning", type: "meeting", color: EVENT_COLORS.meeting,
      attendees: [
        { name: "Alex W", initials: "AW", color: "#0ea5e9" },
        { name: "Sara C", initials: "SC", color: "#10b981" },
      ],
      meetLink: "https://meet.google.com",
    },
    {
      id: "e21", date: d(29), startTime: "14:00", endTime: "15:00", durationMinutes: 60,
      title: "Finance Meeting", type: "task", color: EVENT_COLORS.task,
    },
    // Unscheduled events (no startTime)
    {
      id: "u1", date: d(2), title: "Review PR #42", type: "task", color: EVENT_COLORS.task,
    },
    {
      id: "u2", date: d(2), title: "Read design docs", type: "focus", color: EVENT_COLORS.focus,
    },
    {
      id: "u3", date: d(4), title: "Prep talking points", type: "important", color: EVENT_COLORS.important,
    },
    {
      id: "u4", date: d(8), title: "Send follow-up email", type: "task", color: EVENT_COLORS.task,
    },
  ];
}

// ─── Event Quick-View Popup ───────────────────────────────────────────────────

type PopupProps = {
  event: CalendarEvent;
  anchorRect: DOMRect;
  onClose: () => void;
};

function EventPopup({ event, anchorRect, onClose }: PopupProps) {
  const POPUP_W = 272;
  const POPUP_H = 230;

  let left = anchorRect.right + 8;
  if (left + POPUP_W > window.innerWidth - 8) left = anchorRect.left - POPUP_W - 8;
  let top = anchorRect.top;
  if (top + POPUP_H > window.innerHeight - 8) top = window.innerHeight - POPUP_H - 8;
  top = Math.max(8, top);

  return (
    <div className="fixed inset-0 z-50" onMouseDown={onClose}>
      <div
        className="absolute bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{ left, top, width: POPUP_W }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="h-1.5" style={{ background: event.color }} />

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: event.color }} />
              <span className="text-sm font-bold text-foreground leading-tight truncate">{event.title}</span>
            </div>
            <button
              onMouseDown={onClose}
              className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
            >
              <X size={11} />
            </button>
          </div>

          {event.subtitle && (
            <p className="text-xs text-muted-foreground mb-3 pl-4">{event.subtitle}</p>
          )}

          {event.startTime ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Clock size={11} className="flex-shrink-0 opacity-70" />
              <span>{formatDisplayTime(event.startTime)} – {event.endTime ? formatDisplayTime(event.endTime) : "?"}</span>
              {event.durationMinutes && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{formatDuration(event.durationMinutes)}</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Clock size={11} className="flex-shrink-0 opacity-70" />
              <span className="italic">Unscheduled</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MapPin size={11} className="flex-shrink-0 opacity-70" />
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1 mb-3 mt-1">
              <div className="flex">
                {event.attendees.slice(0, 5).map((a, i) => (
                  <div
                    key={i}
                    title={a.name}
                    className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background: a.color, marginLeft: i === 0 ? 0 : -6 }}
                  >
                    {a.initials}
                  </div>
                ))}
                {event.attendees.length > 5 && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground flex-shrink-0"
                    style={{ marginLeft: -6 }}
                  >
                    +{event.attendees.length - 5}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground ml-1.5">
                {event.attendees.slice(0, 2).map(a => a.name.split(" ")[0]).join(", ")}
                {event.attendees.length > 2 ? ` +${event.attendees.length - 2} more` : ""}
              </span>
            </div>
          )}

          {event.meetLink && (
            <a
              href={event.meetLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              onMouseDown={e => e.stopPropagation()}
            >
              <Video size={11} />
              Join Meeting
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hour-by-Hour Day Grid (sidebar) ─────────────────────────────────────────

type DragPreview = { id: string; top: number; height: number };

type DayGridProps = {
  events: CalendarEvent[];
  isToday: boolean;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
  onAddEvent: (time?: string) => void;
  onUpdateEvent: (id: string, changes: Partial<CalendarEvent>) => void;
};

function DayGrid({ events, isToday, onEventClick, onAddEvent, onUpdateEvent }: DayGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef  = useRef<HTMLDivElement>(null);

  // Drag state refs (no re-render on every pointer move)
  const dragRef = useRef<{
    type: "move" | "resize";
    eventId: string;
    startY: number;
    origTop: number;
    origHeight: number;
  } | null>(null);

  // Preview state drives the visual position during drag
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  const updatePreview = (v: DragPreview | null) => {
    dragPreviewRef.current = v;
    setDragPreview(v);
  };

  // Ref wrappers so closure-captured callbacks stay fresh
  const onUpdateEventRef = useRef(onUpdateEvent);
  useEffect(() => { onUpdateEventRef.current = onUpdateEvent; }, [onUpdateEvent]);
  const onEventClickRef = useRef(onEventClick);
  useEffect(() => { onEventClickRef.current = onEventClick; }, [onEventClick]);
  const onAddEventRef = useRef(onAddEvent);
  useEffect(() => { onAddEventRef.current = onAddEvent; }, [onAddEvent]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const targetH = isToday ? Math.max(GRID_START_H, now.getHours() - 1) : 8;
    scrollRef.current.scrollTop = (targetH - GRID_START_H) * HOUR_PX;
  }, [isToday]);

  const hours = Array.from({ length: GRID_END_H - GRID_START_H + 1 }, (_, i) => GRID_START_H + i);
  const totalH = (GRID_END_H - GRID_START_H) * HOUR_PX;
  const gridStartMin = GRID_START_H * 60;
  const gridEndMin   = GRID_END_H   * 60;

  const now = new Date();
  const nowMin    = now.getHours() * 60 + now.getMinutes();
  const currentTop = ((nowMin - gridStartMin) / 60) * HOUR_PX;
  const showNow    = isToday && nowMin > gridStartMin && nowMin < gridEndMin;

  const scheduledEvents = useMemo(
    () => events.filter(ev => ev.startTime != null),
    [events]
  );

  // ── Drag interaction ────────────────────────────────────────────────────────

  const startInteraction = (
    e: React.PointerEvent,
    ev: CalendarEvent,
    interactionType: "move" | "resize"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const [h, m] = ev.startTime!.split(":").map(Number);
    const origTop    = ((h * 60 + m - gridStartMin) / 60) * HOUR_PX;
    const origHeight = Math.max(22, ((ev.durationMinutes ?? 60) / 60) * HOUR_PX - 2);
    const startY     = e.clientY;

    dragRef.current = { type: interactionType, eventId: ev.id, startY, origTop, origHeight };
    updatePreview({ id: ev.id, top: origTop, height: origHeight });

    let hasMoved = false;

    const onMove = (me: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = me.clientY - startY;
      if (Math.abs(dy) > 4) hasMoved = true;

      if (drag.type === "move") {
        const maxTop = totalH - drag.origHeight;
        const newTop = Math.max(0, Math.min(drag.origTop + dy, maxTop));
        updatePreview({ id: drag.eventId, top: newTop, height: drag.origHeight });
      } else {
        const newHeight = Math.max(HOUR_PX / 2, drag.origHeight + dy);
        updatePreview({ id: drag.eventId, top: drag.origTop, height: newHeight });
      }
    };

    const onUp = (me: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);

      const drag    = dragRef.current;
      const preview = dragPreviewRef.current;

      dragRef.current = null;
      updatePreview(null);

      if (!hasMoved && drag) {
        // It was a click — open popup
        const el = document.getElementById(`cal-ev-${drag.eventId}`);
        if (el) onEventClickRef.current(ev, el.getBoundingClientRect());
        return;
      }

      if (!drag || !preview) return;

      // Snap to SNAP_MINUTES grid
      const rawStartMin = (preview.top / HOUR_PX) * 60;
      const rawDurMin   = (preview.height / HOUR_PX) * 60;
      const snappedStart = snapTo(rawStartMin, SNAP_MINUTES);
      const snappedDur   = Math.max(SNAP_MINUTES, snapTo(rawDurMin, SNAP_MINUTES));

      const startTotalMin = gridStartMin + Math.max(0, snappedStart);
      const endTotalMin   = Math.min(gridEndMin, startTotalMin + snappedDur);

      const sH = Math.floor(startTotalMin / 60);
      const sM = startTotalMin % 60;
      const eH = Math.floor(endTotalMin / 60);
      const eM = endTotalMin % 60;

      onUpdateEventRef.current(drag.eventId, {
        startTime:       `${pad(sH)}:${pad(sM)}`,
        endTime:         `${pad(eH)}:${pad(eM)}`,
        durationMinutes: endTotalMin - startTotalMin,
      });

      // suppress the synthetic click that fires after pointerup
      const suppressClick = (ce: MouseEvent) => {
        ce.stopPropagation();
        ce.preventDefault();
        window.removeEventListener("click", suppressClick, true);
      };
      window.addEventListener("click", suppressClick, true);
      setTimeout(() => window.removeEventListener("click", suppressClick, true), 300);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
  };

  // ── Click-to-add on grid background ─────────────────────────────────────────

  const handleGridClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-cal-event]")) return;

    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const relY  = e.clientY - rect.top;
    const rawMin = (relY / HOUR_PX) * 60;
    const snapped = snapTo(rawMin, 30);
    const totalMin = gridStartMin + Math.max(0, snapped);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    onAddEventRef.current(`${pad(Math.min(h, 23))}:${pad(m)}`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          ref={innerRef}
          className="relative cursor-pointer select-none"
          style={{ height: totalH }}
          onClick={handleGridClick}
        >

          {/* Hour lines + labels */}
          {hours.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start pointer-events-none"
              style={{ top: (h - GRID_START_H) * HOUR_PX }}
            >
              <span className="text-[10px] text-muted-foreground w-11 flex-shrink-0 text-right pr-2.5 -translate-y-[9px] leading-none select-none">
                {h < GRID_END_H ? formatHourLabel(h) : ""}
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          ))}

          {/* 30-min sub-lines */}
          {hours.slice(0, -1).map(h => (
            <div
              key={`${h}-half`}
              className="absolute left-11 right-0 border-t border-border/30 pointer-events-none"
              style={{ top: (h - GRID_START_H) * HOUR_PX + HOUR_PX / 2 }}
            />
          ))}

          {/* Hover time indicator on empty grid */}
          <div
            className="absolute left-11 right-0 pointer-events-none opacity-0 group-hover:opacity-100"
            style={{ height: HOUR_PX / 2 }}
          />

          {/* Current time line */}
          {showNow && (
            <div
              className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
              style={{ top: currentTop }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 ml-10 flex-shrink-0 -translate-y-px" />
              <div className="flex-1 border-t-2 border-red-500" />
            </div>
          )}

          {/* Event blocks */}
          {scheduledEvents.map(ev => {
            const [h, m] = ev.startTime!.split(":").map(Number);
            const normalTop    = ((h * 60 + m - gridStartMin) / 60) * HOUR_PX;
            const normalHeight = Math.max(22, ((ev.durationMinutes ?? 60) / 60) * HOUR_PX - 2);

            const preview = dragPreview?.id === ev.id ? dragPreview : null;
            const top    = preview?.top    ?? normalTop;
            const height = preview?.height ?? normalHeight;
            const isDragging = preview != null;
            const short  = height < 38;

            return (
              <div
                key={ev.id}
                id={`cal-ev-${ev.id}`}
                data-cal-event
                className={cn(
                  "absolute rounded-md overflow-hidden group cursor-grab active:cursor-grabbing",
                  isDragging && "opacity-75 z-20 shadow-lg ring-1 ring-primary/50"
                )}
                style={{
                  top:         top + 1,
                  height,
                  left:        46,
                  right:       6,
                  backgroundColor: `${ev.color}20`,
                  borderLeft:  `3px solid ${ev.color}`,
                }}
                onPointerDown={e => startInteraction(e, ev, "move")}
              >
                <div className="px-1.5 py-0.5 overflow-hidden h-full flex flex-col justify-center">
                  <div
                    className="text-[11px] font-semibold leading-tight truncate"
                    style={{ color: ev.color }}
                  >
                    {ev.title}
                  </div>
                  {!short && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {ev.startTime} – {ev.endTime}
                    </div>
                  )}
                </div>

                {/* Resize handle — drag bottom edge */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2.5 cursor-s-resize flex items-end justify-center pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onPointerDown={e => {
                    e.stopPropagation();
                    startInteraction(e, ev, "resize");
                  }}
                >
                  <div className="w-8 h-0.5 rounded-full bg-current opacity-40" style={{ color: ev.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add event button */}
      <button
        onClick={() => onAddEvent()}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 border-t border-border text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
      >
        <Plus size={12} />
        Add Event
      </button>
    </div>
  );
}

// ─── Unscheduled Section ──────────────────────────────────────────────────────

type UnscheduledSectionProps = {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
};

function UnscheduledSection({ events, onEventClick }: UnscheduledSectionProps) {
  if (events.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-t border-border">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Unscheduled
        </span>
        <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
          {events.length}
        </span>
      </div>
      <div className="px-2 pb-2 flex flex-col gap-1">
        {events.map(ev => (
          <div
            key={ev.id}
            className="flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 hover:bg-accent transition-colors cursor-grab active:cursor-grabbing group"
            draggable
            onDragStart={e => {
              e.dataTransfer.setData("text/plain", JSON.stringify({ id: ev.id, date: ev.date }));
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={e => onEventClick(ev, (e.currentTarget as HTMLElement).getBoundingClientRect())}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: ev.color }}
            />
            <span className="text-xs text-foreground truncate flex-1">{ev.title}</span>
            {/* drag hint */}
            <div className="flex flex-col gap-[3px] opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0">
              <div className="w-3 h-px bg-muted-foreground rounded" />
              <div className="w-3 h-px bg-muted-foreground rounded" />
              <div className="w-3 h-px bg-muted-foreground rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

type AddEventModalProps = {
  date: Date;
  initialTime?: string;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id">) => void;
};

function AddEventModal({ date, initialTime, onClose, onSave }: AddEventModalProps) {
  const initH = initialTime ? parseInt(initialTime.split(":")[0]) : 9;
  const initM = initialTime ? parseInt(initialTime.split(":")[1]) : 0;

  const [title,     setTitle]     = useState("");
  const [type,      setType]      = useState<EventType>("meeting");
  const [startHour, setStartHour] = useState(initH);
  const [startMin,  setStartMin]  = useState(initM);
  const [endHour,   setEndHour]   = useState(Math.min(23, initH + 1));
  const [endMin,    setEndMin]    = useState(initM);
  const [note,      setNote]      = useState("");
  const [unscheduled, setUnscheduled] = useState(!initialTime);

  const fmtTime = (h: number, m: number) => `${pad(h)}:${pad(m)}`;

  const handleSave = () => {
    if (!title.trim()) return;
    const startTime = unscheduled ? undefined : fmtTime(startHour, startMin);
    const endTime   = unscheduled ? undefined : fmtTime(endHour, endMin);
    const dur       = unscheduled ? undefined : Math.max(30,
      (endHour * 60 + endMin) - (startHour * 60 + startMin)
    );
    onSave({
      date:            dateToStr(date),
      startTime,
      endTime,
      durationMinutes: dur,
      title:           title.trim(),
      subtitle:        note.trim() || undefined,
      type,
      color:           EVENT_COLORS[type],
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-[380px] p-6 flex flex-col gap-5 shadow-2xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <input
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-lg font-bold text-foreground placeholder:text-muted-foreground placeholder:font-normal"
            placeholder="Event title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          />
          <button
            onMouseDown={onClose}
            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Date</span>
            <span className="text-sm text-foreground">
              {MONTHS[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
            </span>
          </div>

          {/* Type */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Type</span>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: EVENT_COLORS[type] }} />
              <div className="relative flex items-center flex-1">
                <select
                  className="appearance-none bg-transparent border-none outline-none text-sm text-foreground cursor-pointer pr-5 w-full"
                  value={type}
                  onChange={e => setType(e.target.value as EventType)}
                >
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-0 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Unscheduled toggle */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Time</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  unscheduled ? "bg-secondary border border-border" : "bg-primary"
                )}
                onClick={() => setUnscheduled(v => !v)}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full transition-all",
                  unscheduled ? "left-0.5 bg-muted-foreground" : "left-4 bg-primary-foreground"
                )} />
              </div>
              <span className="text-xs text-muted-foreground">{unscheduled ? "Unscheduled" : "Scheduled"}</span>
            </label>
          </div>

          {/* Time pickers — only if scheduled */}
          {!unscheduled && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Hours</span>
              <div className="flex items-center gap-1 text-sm">
                {([
                  { val: startHour, set: setStartHour, min: 0, max: 23 },
                ] as const).map(({ val, set, min, max }, idx) => (
                  <div key={idx} className="flex items-center gap-0.5">
                    <button onClick={() => set(v => Math.max(min, v - 1))} className="w-5 h-5 rounded bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronLeft size={11} />
                    </button>
                    <span className="text-sm font-semibold text-foreground min-w-[40px] text-center">{fmtTime(val, startMin)}</span>
                    <button onClick={() => set(v => Math.min(max, v + 1))} className="w-5 h-5 rounded bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
                <span className="text-xs text-muted-foreground mx-2">→</span>
                {([
                  { val: endHour, set: setEndHour, min: 0, max: 23 },
                ] as const).map(({ val, set, min, max }, idx) => (
                  <div key={idx} className="flex items-center gap-0.5">
                    <button onClick={() => set(v => Math.max(min, v - 1))} className="w-5 h-5 rounded bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronLeft size={11} />
                    </button>
                    <span className="text-sm font-semibold text-foreground min-w-[40px] text-center">{fmtTime(val, endMin)}</span>
                    <button onClick={() => set(v => Math.min(max, v + 1))} className="w-5 h-5 rounded bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Note</span>
            <input
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Add note"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Members */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Members</span>
            <button className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [panelDate,    setPanelDate]    = useState(today);
  const [events,       setEvents]       = useState<CalendarEvent[]>(
    () => createMockEvents(today.getFullYear(), today.getMonth())
  );
  const [showModal,    setShowModal]    = useState(false);
  const [modalDate,    setModalDate]    = useState(today);
  const [modalTime,    setModalTime]    = useState<string | undefined>();

  // Popup
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
  const [popupRect,  setPopupRect]  = useState<DOMRect | null>(null);

  // Month grid drag-over tracking
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const cells = useMemo(
    () => getCalendarCells(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) { (map[e.date] ??= []).push(e); }
    return map;
  }, [events]);

  const panelDateStr = dateToStr(panelDate);
  const allPanelEvents = useMemo(
    () => [...(eventsByDate[panelDateStr] ?? [])].sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    }),
    [eventsByDate, panelDateStr]
  );

  const scheduledPanelEvents   = allPanelEvents.filter(ev => ev.startTime != null);
  const unscheduledPanelEvents = allPanelEvents.filter(ev => ev.startTime == null);
  const isPanelToday = panelDateStr === dateToStr(today);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setPanelDate(date);
    setPopupEvent(null);
  };

  const handlePillClick = (e: React.MouseEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    setPopupEvent(ev);
    setPopupRect((e.currentTarget as HTMLElement).getBoundingClientRect());
  };

  const handleGridEventClick = (ev: CalendarEvent, rect: DOMRect) => {
    setPopupEvent(ev);
    setPopupRect(rect);
  };

  const handleSaveEvent = (data: Omit<CalendarEvent, "id">) => {
    setEvents(prev => [...prev, { ...data, id: `ev-${Date.now()}` }]);
  };

  const handleUpdateEvent = (id: string, changes: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...changes } : ev));
  };

  const openAddModal = (date: Date, time?: string) => {
    setModalDate(date);
    setModalTime(time);
    setShowModal(true);
  };

  // Month grid drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the cell itself, not entering a child
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const { id } = JSON.parse(e.dataTransfer.getData("text/plain")) as { id: string };
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, date: dateStr } : ev));
    } catch {
      // ignore bad data
    }
  };

  const todayStr    = dateToStr(today);
  const selectedStr = dateToStr(selectedDate);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden p-5 gap-4 bg-background">

      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            Morning, Alex!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's on your agenda today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 w-56 focus-within:border-primary transition-colors">
            <Search size={13} className="text-muted-foreground flex-shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-xs text-foreground flex-1 placeholder:text-muted-foreground"
              placeholder="Search for some activities"
            />
          </div>
          <button className="relative w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Calendar Section ── */}
        <section className="flex-1 min-w-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden p-5">

          {/* Month / year nav */}
          <div className="flex items-center gap-1 mb-4 flex-shrink-0">
            <button className="flex items-center gap-1 text-lg font-bold text-foreground px-2 py-1 rounded-lg hover:bg-accent transition-colors">
              {MONTHS[currentDate.getMonth()]}
              <ChevronDown size={13} className="text-muted-foreground mt-0.5" />
            </button>
            <button className="flex items-center gap-1 text-lg font-bold text-foreground px-2 py-1 rounded-lg hover:bg-accent transition-colors">
              {currentDate.getFullYear()}
              <ChevronDown size={13} className="text-muted-foreground mt-0.5" />
            </button>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            className="grid grid-cols-7 gap-1 flex-1 min-h-0"
            style={{ gridTemplateRows: `repeat(${Math.ceil(cells.length / 7)}, 1fr)` }}
          >
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="rounded-xl" />;

              const ds         = dateToStr(date);
              const cellEvents = eventsByDate[ds] ?? [];
              const isToday    = ds === todayStr;
              const isSelected = ds === selectedStr;
              const isDragOver = ds === dragOverDate;

              // Separate scheduled vs unscheduled for chip display
              const scheduled   = cellEvents.filter(ev => ev.startTime != null);
              const unscheduled = cellEvents.filter(ev => ev.startTime == null);
              const chipsToShow = [...scheduled, ...unscheduled].slice(0, 3);
              const overflow    = cellEvents.length - chipsToShow.length;

              return (
                <div
                  key={ds}
                  onClick={() => handleDayClick(date)}
                  onDoubleClick={() => openAddModal(date)}
                  onDragOver={e => handleDragOver(e, ds)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, ds)}
                  className={cn(
                    "rounded-xl border p-1.5 cursor-pointer flex flex-col gap-0.5 overflow-hidden transition-all",
                    isDragOver
                      ? "border-primary bg-primary/20 scale-[0.98]"
                      : isSelected
                        ? "border-primary bg-primary/10"
                        : isToday
                          ? "border-primary bg-background"
                          : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {/* Day number */}
                  <div className={cn(
                    "text-xs font-medium leading-none mb-0.5 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0",
                    isToday
                      ? "bg-primary text-primary-foreground font-bold text-[11px]"
                      : "text-foreground"
                  )}>
                    {date.getDate()}
                  </div>

                  {/* Event chips */}
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {chipsToShow.map(ev => (
                      <button
                        key={ev.id}
                        className="flex items-center gap-1 overflow-hidden w-full text-left rounded-md px-1 py-0.5 hover:brightness-110 transition-all"
                        style={{ backgroundColor: `${ev.color}22` }}
                        draggable
                        onDragStart={e => {
                          e.stopPropagation();
                          e.dataTransfer.setData("text/plain", JSON.stringify({ id: ev.id, date: ev.date }));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={e => handlePillClick(e, ev)}
                      >
                        <div
                          className="w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[10px]"
                          style={{ background: ev.color }}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-medium truncate leading-tight",
                            !ev.startTime && "italic opacity-75"
                          )}
                          style={{ color: ev.color }}
                        >
                          {ev.title}
                        </span>
                      </button>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[10px] text-muted-foreground pl-1">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Day Schedule Sidebar ── */}
        <aside className="w-[300px] flex-shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-muted-foreground" />
                <span className="text-sm font-bold text-foreground tracking-tight">
                  {panelDate.getDate()} {MONTHS[panelDate.getMonth()]}
                </span>
                {isPanelToday && (
                  <span className="text-[10px] font-semibold text-primary-foreground bg-primary rounded-full px-1.5 py-0.5 leading-none">
                    Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPanelDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                  className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => setPanelDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                  className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                  aria-label="Next day"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {allPanelEvents.length === 0
                ? "No events — click grid to add"
                : `${scheduledPanelEvents.length} scheduled${unscheduledPanelEvents.length > 0 ? `, ${unscheduledPanelEvents.length} unscheduled` : ""}`}
            </p>
          </div>

          {/* Hour-by-hour grid */}
          <DayGrid
            events={scheduledPanelEvents}
            isToday={isPanelToday}
            onEventClick={handleGridEventClick}
            onAddEvent={time => openAddModal(panelDate, time)}
            onUpdateEvent={handleUpdateEvent}
          />

          {/* Unscheduled events */}
          <UnscheduledSection
            events={unscheduledPanelEvents}
            onEventClick={handleGridEventClick}
          />
        </aside>
      </div>

      {/* ── Event Popup ── */}
      {popupEvent && popupRect && (
        <EventPopup
          event={popupEvent}
          anchorRect={popupRect}
          onClose={() => setPopupEvent(null)}
        />
      )}

      {/* ── Add Event Modal ── */}
      {showModal && (
        <AddEventModal
          date={modalDate}
          initialTime={modalTime}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
