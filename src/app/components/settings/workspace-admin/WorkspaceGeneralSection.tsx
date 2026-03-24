import { useState } from "react";
import {
  Check, Plus, X, Lock, Banknote,
  GripVertical, Circle, Clock, Zap, Ban, Moon, Eye, EyeOff, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";
import { useApp } from "../../../context/AppContext";
import { cn } from "../../ui/utils";

// ─── Status type ─────────────────────────────────────────────────────────────

interface StatusItem {
  id: string;
  name: string;
  iconKey: string;
  Icon: LucideIcon;
  color: string;
  enabled: boolean;
}

const STATUS_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: "circle",   Icon: Circle },
  { key: "check",    Icon: Check },
  { key: "clock",    Icon: Clock },
  { key: "zap",      Icon: Zap },
  { key: "ban",      Icon: Ban },
  { key: "moon",     Icon: Moon },
  { key: "eye",      Icon: Eye },
  { key: "eye-off",  Icon: EyeOff },
];

const STATUS_COLORS = [
  "#22c55e", "#eab308", "#ef4444", "#3b82f6", "#a855f7",
  "#ec4899", "#f97316", "#14b8a6", "#9ca3af", "#64748b",
  "#6366f1", "#84cc16",
];

const DEFAULT_STATUSES: StatusItem[] = [
  { id: "s1", name: "Active",  iconKey: "check",  Icon: Check, color: "#22c55e", enabled: true },
  { id: "s2", name: "Away",    iconKey: "clock",  Icon: Clock, color: "#eab308", enabled: true },
  { id: "s3", name: "Busy",    iconKey: "ban",    Icon: Ban,   color: "#ef4444", enabled: true },
  { id: "s4", name: "Offline", iconKey: "moon",   Icon: Moon,  color: "#9ca3af", enabled: true },
];

// ─── Color picker popover ────────────────────────────────────────────────────

function ColorPicker({ value, onChange, onClose }: {
  value: string; onChange: (c: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div ref={ref} className="absolute top-8 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-[172px]">
        <div className="grid grid-cols-6 gap-1.5">
          {STATUS_COLORS.map((c) => (
            <button key={c} onClick={() => { onChange(c); onClose(); }}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}>
              {c === value && <Check className="h-3 w-3 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Icon picker popover ─────────────────────────────────────────────────────

function IconPicker({ value, color, onChange, onClose }: {
  value: string; color: string; onChange: (key: string, Icon: LucideIcon) => void; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-8 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-[172px]">
        <div className="grid grid-cols-4 gap-1.5">
          {STATUS_ICONS.map((opt) => (
            <button key={opt.key} onClick={() => { onChange(opt.key, opt.Icon); onClose(); }}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                value === opt.key
                  ? "ring-2 ring-primary/50 bg-primary/10"
                  : "bg-muted hover:bg-muted/80"
              )}>
              <opt.Icon className="h-3.5 w-3.5" style={{ color: value === opt.key ? color : undefined }} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function WorkspaceGeneralSection() {
  const { activeWorkspace, settings, updateSettings, wsPermissions, updateWsPermissions } = useApp();
  const [wsName, setWsName] = useState(activeWorkspace.name);
  const [wsDescription, setWsDescription] = useState("Main workspace for professional tasks");
  const [timezone, setTimezone] = useState("America/New_York");
  const [statuses, setStatuses] = useState<StatusItem[]>(DEFAULT_STATUSES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);
  const [allowCustomStatuses, setAllowCustomStatuses] = useState(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...statuses];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setStatuses(next);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const addStatus = () => {
    const newId = `s-${Date.now()}`;
    setStatuses([...statuses, { id: newId, name: "New Status", iconKey: "circle", Icon: Circle, color: "#3b82f6", enabled: true }]);
    setEditingId(newId);
  };

  return (
    <div className="space-y-5">
      {/* Workspace Info */}
      <Section title="Workspace information">
        <Row label="Name">
          <input value={wsName} onChange={(e) => setWsName(e.target.value)}
            className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-48" />
        </Row>
        <Row label="Description">
          <input value={wsDescription} onChange={(e) => setWsDescription(e.target.value)}
            className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-64" />
        </Row>
        <Row label="Color">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: activeWorkspace.color }} />
            <span className="text-xs text-muted-foreground">{activeWorkspace.color}</span>
          </div>
        </Row>
      </Section>

      {/* Regional */}
      <Section title="Regional settings">
        <Row label="Timezone">
          <SelectInput value={timezone}
            options={[
              { value: "America/New_York", label: "Eastern (ET)" },
              { value: "America/Chicago", label: "Central (CT)" },
              { value: "America/Denver", label: "Mountain (MT)" },
              { value: "America/Los_Angeles", label: "Pacific (PT)" },
              { value: "Europe/London", label: "London (GMT)" },
              { value: "Europe/Paris", label: "Paris (CET)" },
              { value: "Asia/Tokyo", label: "Tokyo (JST)" },
            ]}
            onChange={setTimezone} />
        </Row>
      </Section>

      {/* Work schedule */}
      <Section title="Work schedule" description="Default schedule for new members. Members can customize their own.">
        <Row label="Work days">
          <div className="flex gap-1">
            {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
              <button key={day}
                onClick={() => {
                  const days = wsPermissions.workDays.includes(day)
                    ? wsPermissions.workDays.filter((d) => d !== day)
                    : [...wsPermissions.workDays, day];
                  updateWsPermissions({ workDays: days });
                }}
                className={cn(
                  "h-7 w-7 rounded-md text-[10px] font-medium transition-all",
                  wsPermissions.workDays.includes(day)
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-transparent hover:border-border"
                )}>
                {day.slice(0, 2).toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Work hours">
          <div className="flex items-center gap-2">
            <input type="time" value={wsPermissions.defaultWorkStart}
              onChange={(e) => updateWsPermissions({ defaultWorkStart: e.target.value })}
              className="text-sm bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-24" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="time" value={wsPermissions.defaultWorkEnd}
              onChange={(e) => updateWsPermissions({ defaultWorkEnd: e.target.value })}
              className="text-sm bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-24" />
          </div>
        </Row>
        <Row label="Week starts on">
          <SelectInput value={settings.weekStartsOn}
            options={[{ value: "monday", label: "Monday" }, { value: "sunday", label: "Sunday" }]}
            onChange={(v) => updateSettings({ weekStartsOn: v as any })} />
        </Row>
      </Section>

      {/* User statuses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">User status options</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Customize status options available to members in this workspace.</p>
            </div>
            <button onClick={() => { setStatuses(DEFAULT_STATUSES); setEditingId(null); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Reset to default
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Members can create custom statuses</span>
            </div>
            <Toggle value={allowCustomStatuses} onChange={setAllowCustomStatuses} />
          </div>
        </div>
        <div className="divide-y divide-border">
          {statuses.map((status, idx) => (
            <div
              key={status.id}
              draggable
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 px-5 py-3 group transition-colors",
                dragOverIdx === idx && dragIdx !== idx && "border-t-2 border-t-primary",
                dragIdx === idx ? "opacity-40 bg-muted/50" : "hover:bg-muted/30"
              )}
            >
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              {/* Icon picker */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIconPickerOpen(iconPickerOpen === status.id ? null : status.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                >
                  <status.Icon className="h-3.5 w-3.5" style={{ color: status.color }} />
                </button>
                {iconPickerOpen === status.id && (
                  <IconPicker
                    value={status.iconKey}
                    color={status.color}
                    onChange={(key, Icon) => setStatuses(statuses.map((s) => s.id === status.id ? { ...s, iconKey: key, Icon } : s))}
                    onClose={() => setIconPickerOpen(null)}
                  />
                )}
              </div>

              {/* Name (editable) */}
              {editingId === status.id ? (
                <input value={status.name} autoFocus
                  onChange={(e) => setStatuses(statuses.map((s) => s.id === status.id ? { ...s, name: e.target.value } : s))}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                  className="flex-1 text-sm bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 min-w-0" />
              ) : (
                <button onClick={() => setEditingId(status.id)} className="flex-1 text-left min-w-0">
                  <span className="text-sm text-foreground">{status.name}</span>
                </button>
              )}

              {/* Color picker */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setColorPickerOpen(colorPickerOpen === status.id ? null : status.id)}
                  className="h-5 w-5 rounded-full ring-2 ring-transparent hover:ring-offset-2 hover:ring-border transition-all"
                  style={{ backgroundColor: status.color }}
                />
                {colorPickerOpen === status.id && (
                  <ColorPicker
                    value={status.color}
                    onChange={(c) => setStatuses(statuses.map((s) => s.id === status.id ? { ...s, color: c } : s))}
                    onClose={() => setColorPickerOpen(null)}
                  />
                )}
              </div>

              {/* Delete */}
              {statuses.length > 2 && (
                <button onClick={() => setStatuses(statuses.filter((s) => s.id !== status.id))}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addStatus}
          className="w-full flex items-center gap-2.5 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-t border-border">
          <Plus className="h-3.5 w-3.5" /> Add status
        </button>
      </div>

      {/* Permissions */}
      <Section title="Permissions" description="Control what team admins can do in this organization.">
        <Row label="Team admin invite policy" description="How team admins can add new people to the organization.">
          <SelectInput
            value={wsPermissions.teamAdminsInvite}
            onChange={(v) => updateWsPermissions({ teamAdminsInvite: v as any })}
            options={[
              { value: "not_allowed", label: "Not allowed" },
              { value: "request", label: "Request approval" },
              { value: "allowed", label: "Allowed" },
            ]}
          />
        </Row>
      </Section>

      {wsPermissions.teamAdminsInvite === "not_allowed" && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Team admins can only add existing organization members to their teams. Only workspace admins can invite new people.
          </p>
        </div>
      )}
      {wsPermissions.teamAdminsInvite === "request" && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Team admins can request to invite new people. Requests will need your approval before the invitation is sent.
          </p>
        </div>
      )}

      {/* Compensation & pay period */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Compensation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track member pay, configure pay periods, and set overtime rules.</p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Track compensation</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enable salary/hourly tracking for organization members.</p>
            </div>
            <Toggle value={wsPermissions.trackCompensation} onChange={(v) => updateWsPermissions({ trackCompensation: v })} />
          </div>
        </div>

        {wsPermissions.trackCompensation && (
          <div className="px-5 pb-4 space-y-4 border-t border-border pt-4">
            {/* Pay frequency */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Pay frequency</label>
              <div className="grid grid-cols-5 gap-2">
                {([
                  { value: "weekly" as const, label: "Weekly" },
                  { value: "biweekly" as const, label: "Bi-weekly" },
                  { value: "semimonthly" as const, label: "Semi-monthly" },
                  { value: "monthly" as const, label: "Monthly" },
                  { value: "custom" as const, label: "Custom" },
                ]).map((f) => (
                  <button key={f.value} onClick={() => updateWsPermissions({ payFrequency: f.value })}
                    className={cn("px-2 py-2 rounded-lg border text-xs font-medium text-center transition-all",
                      wsPermissions.payFrequency === f.value ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom cycle length */}
            {wsPermissions.payFrequency === "custom" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Cycle length (days)</label>
                <input type="number" value={wsPermissions.payCustomDays ?? 14}
                  onChange={(e) => updateWsPermissions({ payCustomDays: parseInt(e.target.value) || 14 })}
                  className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-24" />
              </div>
            )}

            {/* Pay day */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Pay day</label>
              {(wsPermissions.payFrequency === "weekly" || wsPermissions.payFrequency === "biweekly") ? (
                <SelectInput value={wsPermissions.payDay} onChange={(v) => updateWsPermissions({ payDay: v })}
                  options={[
                    { value: "monday", label: "Monday" }, { value: "tuesday", label: "Tuesday" },
                    { value: "wednesday", label: "Wednesday" }, { value: "thursday", label: "Thursday" },
                    { value: "friday", label: "Friday" }, { value: "saturday", label: "Saturday" },
                    { value: "sunday", label: "Sunday" },
                  ]} />
              ) : wsPermissions.payFrequency === "semimonthly" ? (
                <p className="text-xs text-muted-foreground">Paid on the 1st and 15th of each month.</p>
              ) : wsPermissions.payFrequency === "custom" ? (
                <p className="text-xs text-muted-foreground">Pay day is the last day of each custom cycle.</p>
              ) : (
                <SelectInput value={wsPermissions.payDay} onChange={(v) => updateWsPermissions({ payDay: v })}
                  options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}${["st","nd","rd"][i] ?? "th"} of the month` })).concat(
                    [{ value: "last", label: "Last day of the month" }]
                  )} />
              )}
            </div>

            {/* Overtime policy */}
            <div className="border-t border-border pt-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Overtime policy</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([
                  { value: "none" as const, label: "No overtime", desc: "All hours treated equally" },
                  { value: "after_daily" as const, label: "After daily limit", desc: "OT after X hours/day" },
                  { value: "after_weekly" as const, label: "After weekly limit", desc: "OT after X hours/week" },
                  { value: "after_period" as const, label: "After period limit", desc: "OT after X hours/period" },
                ]).map((p) => (
                  <button key={p.value} onClick={() => updateWsPermissions({ overtimePolicy: p.value })}
                    className={cn("px-3 py-2 rounded-lg border text-left transition-all",
                      wsPermissions.overtimePolicy === p.value ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30")}>
                    <p className={cn("text-xs font-medium", wsPermissions.overtimePolicy === p.value ? "text-primary" : "text-foreground")}>{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
              {wsPermissions.overtimePolicy !== "none" && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Threshold</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={wsPermissions.overtimeThreshold}
                        onChange={(e) => updateWsPermissions({ overtimeThreshold: parseInt(e.target.value) || 40 })}
                        className="text-sm bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-16 text-center" />
                      <span className="text-xs text-muted-foreground">hours</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">OT rate</label>
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.1" value={wsPermissions.overtimeRate}
                        onChange={(e) => updateWsPermissions({ overtimeRate: parseFloat(e.target.value) || 1.5 })}
                        className="text-sm bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-16 text-center" />
                      <span className="text-xs text-muted-foreground">x</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current period */}
            <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 flex items-center gap-3">
              <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Current pay period</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {wsPermissions.payFrequency === "weekly" ? "Mar 17 \u2013 Mar 23, 2026" :
                   wsPermissions.payFrequency === "biweekly" ? "Mar 10 \u2013 Mar 23, 2026" :
                   wsPermissions.payFrequency === "semimonthly" ? "Mar 1 \u2013 Mar 15, 2026" :
                   wsPermissions.payFrequency === "custom" ? `Custom ${wsPermissions.payCustomDays ?? 14}-day cycle` :
                   "Mar 1 \u2013 Mar 31, 2026"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive/80">Danger zone</h3>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Delete workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently remove all projects, tasks, and data. This cannot be undone.</p>
          </div>
          <button className="text-sm text-destructive/70 hover:text-destructive transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}
