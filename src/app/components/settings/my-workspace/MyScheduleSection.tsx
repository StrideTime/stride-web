import { useState } from "react";
import { Toggle } from "../shared/Toggle";
import { ApplyToAllBanner } from "../shared/ApplyToAllBanner";
import { cn } from "../../ui/utils";

interface DaySchedule {
  day: string;
  short: string;
  enabled: boolean;
  start: string;
  end: string;
  breakMin: number;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday",    short: "Mon", enabled: true,  start: "09:00", end: "17:00", breakMin: 60 },
  { day: "Tuesday",   short: "Tue", enabled: true,  start: "09:00", end: "17:00", breakMin: 60 },
  { day: "Wednesday", short: "Wed", enabled: true,  start: "09:00", end: "17:00", breakMin: 60 },
  { day: "Thursday",  short: "Thu", enabled: true,  start: "09:00", end: "17:00", breakMin: 60 },
  { day: "Friday",    short: "Fri", enabled: true,  start: "09:00", end: "17:00", breakMin: 60 },
  { day: "Saturday",  short: "Sat", enabled: false, start: "10:00", end: "14:00", breakMin: 30 },
  { day: "Sunday",    short: "Sun", enabled: false, start: "10:00", end: "14:00", breakMin: 30 },
];

const TEMPLATES = [
  { label: "9 \u2013 5", desc: "Mon\u2013Fri", apply: () => DEFAULT_SCHEDULE },
  { label: "Flexible", desc: "10\u20136 weekdays", apply: () => DEFAULT_SCHEDULE.map((d, i) => i < 5 ? { ...d, start: "10:00", end: "18:00" } : d) },
  { label: "4-Day", desc: "Mon\u2013Thu", apply: () => DEFAULT_SCHEDULE.map((d, i) => i < 4 ? { ...d, enabled: true } : { ...d, enabled: false }) },
];

const BREAK_OPTIONS = [
  { value: 0, label: "None" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 45, label: "45m" },
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
];

export function MyScheduleSection() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);

  const workingDays = schedule.filter((d) => d.enabled).length;
  const totalHoursPerDay = schedule.filter((d) => d.enabled).map((d) => {
    const [sh, sm] = d.start.split(":").map(Number);
    const [eh, em] = d.end.split(":").map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm) - d.breakMin) / 60;
  });
  const weeklyHours = totalHoursPerDay.reduce((a, b) => a + b, 0);
  const avgDaily = workingDays > 0 ? weeklyHours / workingDays : 0;

  const updateDay = (idx: number, patch: Partial<DaySchedule>) => {
    setSchedule(schedule.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  return (
    <div className="space-y-5">
      {/* Summary + templates */}
      <div className="flex items-center gap-3">
        <div className="flex-1 grid grid-cols-3 gap-3">
          {[
            { label: "Working days", value: `${workingDays}/week` },
            { label: "Weekly hours", value: `${weeklyHours.toFixed(0)}h` },
            { label: "Daily avg", value: `${avgDaily.toFixed(1)}h` },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.label} onClick={() => setSchedule(t.apply())}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-center">
            <span className="font-medium block">{t.label}</span>
            <span className="text-[10px]">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Schedule */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Weekly schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Set your working hours for each day.</p>
        </div>
        <div className="divide-y divide-border">
          {schedule.map((day, idx) => (
            <div key={day.day} className={cn("px-5 py-2.5 flex items-center gap-3", !day.enabled && "opacity-40")}>
              <span className="text-xs font-medium text-foreground w-8">{day.short}</span>
              <Toggle value={day.enabled} onChange={(v) => updateDay(idx, { enabled: v })} />
              {day.enabled ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="time" value={day.start} onChange={(e) => updateDay(idx, { start: e.target.value })}
                    className="text-xs bg-muted border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-[5.5rem]" />
                  <span className="text-[10px] text-muted-foreground">&ndash;</span>
                  <input type="time" value={day.end} onChange={(e) => updateDay(idx, { end: e.target.value })}
                    className="text-xs bg-muted border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-[5.5rem]" />
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Break:</span>
                    <select value={day.breakMin} onChange={(e) => updateDay(idx, { breakMin: Number(e.target.value) })}
                      className="text-[11px] bg-muted border border-border rounded-md px-1.5 py-0.5 text-foreground focus:outline-none w-14 appearance-none cursor-pointer">
                      {BREAK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">Off</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Apply to all workspaces */}
      <ApplyToAllBanner />
    </div>
  );
}
