import { useState, useRef, useEffect } from "react";
import {
  ChevronRight, Check, Info, ExternalLink, AlertCircle, RefreshCw,
  Plus, ChevronDown, ChevronUp, CreditCard, Users, Bell, Clock,
  Palette, CalendarDays, Plug, Shield, X, Zap, Building2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import { SETTINGS_NAV } from "./Sidebar";
import type { NotificationPref } from "../context/AppContext";
import { TEAMS, TEAM_MEMBERS, PROJECTS } from "../data/mockData";

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ title, description, children, flush }: {
  title: string; description?: string; children: React.ReactNode; flush?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className={cn(flush ? "" : "divide-y divide-border")}>{children}</div>
    </div>
  );
}

function Row({ label, description, children, danger }: {
  label: string; description?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className={cn("text-sm", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Fixed toggle — uses inline style for reliable transform in Tailwind v4
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-[22px] w-[42px] rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        value ? "bg-primary" : "bg-muted-foreground/25"
      )}
    >
      <span
        className="block absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: value ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function SelectInput({ value, options, onChange }: {
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Editable list (task types / ticket statuses) ─────────────────────────────

const PRESET_COLORS = [
  "#98c379","#e06c75","#61afef","#e5c07b","#c678dd",
  "#56b6c2","#d19a66","#abb2bf","#5c6370","#be5046",
];

interface EditableItem { id: number; label: string; color: string; }

function ColorPicker({ value, onChange, onClose }: {
  value: string; onChange: (c: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-7 left-0 z-30 bg-popover border border-border rounded-xl shadow-xl p-3 w-[148px]">
      <div className="grid grid-cols-5 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => { onChange(c); onClose(); }}
            className="h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
            style={{ backgroundColor: c }}>
            {c === value && <Check className="h-3 w-3 text-white drop-shadow" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditableList({ items, onChange, addLabel, minCount = 2 }: {
  items: EditableItem[]; onChange: (items: EditableItem[]) => void; addLabel: string; minCount?: number;
}) {
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3 group border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
          {/* Color swatch */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setPickerOpen(pickerOpen === item.id ? null : item.id)}
              className="h-5 w-5 rounded-full ring-2 ring-transparent hover:ring-offset-2 hover:ring-border transition-all"
              style={{ backgroundColor: item.color }}
            />
            {pickerOpen === item.id && (
              <ColorPicker value={item.color}
                onChange={(c) => onChange(items.map((x) => x.id === item.id ? { ...x, color: c } : x))}
                onClose={() => setPickerOpen(null)} />
            )}
          </div>

          {/* Label — directly editable */}
          <input
            value={item.label}
            onChange={(e) => onChange(items.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))}
            className="flex-1 text-sm text-foreground bg-transparent focus:outline-none focus:ring-0 min-w-0"
          />

          {/* Order + delete — appear on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => move(idx, -1)} disabled={idx === 0}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={() => items.length > minCount && onChange(items.filter((x) => x.id !== item.id))}
              disabled={items.length <= minCount}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { id: Date.now(), label: "New item", color: "#abb2bf" }])}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

// ─── Tracking mode selector ───────────────────────────────────────────────────

function TrackingModeSelector({ value, onChange }: {
  value: "project-only" | "daily";
  onChange: (v: "project-only" | "daily") => void;
}) {
  const options = [
    { id: "project-only" as const, icon: "⏱", title: "Project-based only", description: "Time is tracked against tasks and projects. Sessions start/stop per task.", note: "Ideal for freelancers, async teams, or anywhere attendance isn't tracked." },
    { id: "daily" as const, icon: "🕘", title: "Daily clock-in / out", description: "Record when your work day starts and ends in addition to project time.", note: "Ideal for offices, client billing, or teams that track attendance." },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Time tracking mode</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Choose how Stride records your working time. This affects the entire workspace.</p>
      </div>
      <div className="divide-y divide-border">
        {options.map((opt) => (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className={cn("w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30",
              value === opt.id && "bg-primary/5")}>
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5",
              value === opt.id ? "bg-primary/10" : "bg-muted")}>
              {opt.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-foreground">{opt.title}</p>
                {value === opt.id && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{opt.note}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ label, description, pref, onChange }: {
  label: string; description: string;
  pref: NotificationPref; onChange: (p: NotificationPref) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Toggle value={pref.inApp} onChange={(v) => onChange({ ...pref, inApp: v })} />
        <Toggle value={pref.email} onChange={(v) => onChange({ ...pref, email: v })} />
      </div>
    </div>
  );
}

// ─── Connections ──────────────────────────────────────────────────────────────

interface Connection { id: string; name: string; icon: string; description: string; connected: boolean; category: string; lastSync?: string; }
const CONNECTIONS: Connection[] = [
  { id: "gcal", name: "Google Calendar", icon: "📅", description: "Sync events into your Dashboard and Calendar pages.", connected: true,  category: "Calendar",            lastSync: "2 min ago" },
  { id: "ocal", name: "Outlook Calendar", icon: "📆", description: "Import Outlook events and schedule.", connected: false, category: "Calendar" },
  { id: "jira", name: "Jira",             icon: "🔵", description: "Import tasks from Jira boards as Stride tasks.", connected: false, category: "Project management" },
  { id: "gh",   name: "GitHub",           icon: "⚫", description: "Link issues and PRs to Stride tasks.", connected: false, category: "Project management" },
  { id: "slack", name: "Slack",           icon: "💬", description: "Receive Stride notifications in Slack channels.", connected: true,  category: "Communication",       lastSync: "Just now" },
];

function ConnectionCard({ conn }: { conn: Connection }) {
  const [connected, setConnected] = useState(conn.connected);
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-t border-border first:border-t-0">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">{conn.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{conn.name}</p>
          {connected && <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#98c37915", color: "#98c379" }}>Connected</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{conn.description}</p>
        {connected && conn.lastSync && <p className="text-[11px] text-muted-foreground/60 mt-0.5">Last synced {conn.lastSync}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {connected && <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"><RefreshCw className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        <button onClick={() => setConnected(!connected)}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            connected ? "text-destructive/80 hover:bg-destructive/10 border border-destructive/20" : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20")}>
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}

// ─── Personal billing ─────────────────────────────────────────────────────────

function PersonalBilling() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Personal plan</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Stride Pro</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary">Active</span>
      </div>
      <div className="divide-y divide-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm text-foreground">Pro · $12/mo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Renews Apr 15, 2025</p>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm text-foreground">Payment method</p>
            <p className="text-xs text-muted-foreground mt-0.5">Visa ending 4242</p>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity">
            Update <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Personal settings sections ───────────────────────────────────────────────

function PersonalSettings({ section, settings, updateSettings, darkMode, toggleDarkMode }: {
  section: string;
  settings: ReturnType<typeof useApp>["settings"];
  updateSettings: ReturnType<typeof useApp>["updateSettings"];
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const notif = settings.notifications;
  const updateNotif = (key: keyof typeof notif, val: any) =>
    updateSettings({ notifications: { ...notif, [key]: val } });

  // Local state for settings not yet in context
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactMode, setCompactMode]   = useState(false);
  const [showEstimates, setShowEstimates] = useState(true);
  const [calView, setCalView]           = useState("week");
  const [reminders, setReminders]       = useState("10");
  const [showWeekends, setShowWeekends] = useState(true);

  if (section === "time") return (
    <>
      <TrackingModeSelector value={settings.timeTrackingMode} onChange={(v) => updateSettings({ timeTrackingMode: v })} />
      <Section title="Work hours" description="Reference window used in weekly calculations and reports.">
        <Row label="Work day start">
          <input type="time" value={settings.workDayStart} onChange={(e) => updateSettings({ workDayStart: e.target.value })}
            className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </Row>
        <Row label="Work day end">
          <input type="time" value={settings.workDayEnd} onChange={(e) => updateSettings({ workDayEnd: e.target.value })}
            className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </Row>
        <Row label="Week starts on">
          <SelectInput value={settings.weekStartsOn}
            options={[{ value: "monday", label: "Monday" }, { value: "sunday", label: "Sunday" }]}
            onChange={(v) => updateSettings({ weekStartsOn: v as any })} />
        </Row>
      </Section>
    </>
  );

  if (section === "display") return (
    <Section title="Appearance">
      <Row label="Dark mode" description="Toggle between dark and light application theme.">
        <Toggle value={darkMode} onChange={toggleDarkMode} />
      </Row>
      <Row label="Default task view" description="How tasks are displayed by default on team task pages.">
        <SelectInput value={settings.defaultView}
          options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }]}
          onChange={(v) => updateSettings({ defaultView: v as any })} />
      </Row>
      <Row label="Reduce motion" description="Minimize animations throughout the app.">
        <Toggle value={reduceMotion} onChange={setReduceMotion} />
      </Row>
      <Row label="Compact mode" description="Tighter spacing for higher density views.">
        <Toggle value={compactMode} onChange={setCompactMode} />
      </Row>
      <Row label="Show task estimates" description="Display estimated time on task cards by default.">
        <Toggle value={showEstimates} onChange={setShowEstimates} />
      </Row>
    </Section>
  );

  if (section === "schedule") return (
    <Section title="Calendar preferences">
      <Row label="Show weekends" description="Include Saturday and Sunday in Calendar view.">
        <Toggle value={showWeekends} onChange={setShowWeekends} />
      </Row>
      <Row label="Default calendar view">
        <SelectInput value={calView}
          options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]}
          onChange={setCalView} />
      </Row>
      <Row label="Event reminders" description="Show a pop-up N minutes before scheduled events.">
        <SelectInput value={reminders}
          options={[{ value: "0", label: "At event time" }, { value: "5", label: "5 min" }, { value: "10", label: "10 min" }, { value: "15", label: "15 min" }]}
          onChange={setReminders} />
      </Row>
    </Section>
  );

  if (section === "notif") return (
    <>
      <div className="flex items-center justify-end gap-4 px-5 mb-1">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest w-10 text-center">In-app</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest w-10 text-center">Email</span>
        </div>
      </div>
      {[
        { title: "Activity", rows: [
          { label: "Task completed",        desc: "When one of your tasks is marked complete.",         key: "taskCompleted" },
          { label: "Task assigned to you",  desc: "When a team member assigns a task to you.",           key: "taskAssigned" },
          { label: "Mention in a comment",  desc: "When someone @-mentions you on a task.",             key: "mention" },
        ]},
        { title: "Team", rows: [
          { label: "Team task assigned",    desc: "When any task is assigned within your team.",         key: "teamTaskAssigned" },
          { label: "Deadline approaching",  desc: "24 hours before a task or project deadline.",         key: "deadlineApproaching" },
        ]},
        { title: "Reports & digests", rows: [
          { label: "Weekly progress digest",desc: "Summary of tasks, hours, and goal progress each Monday.", key: "weeklyDigest" },
          { label: "Goal milestone reached",desc: "When you hit a significant percentage on a goal.",   key: "goalMilestone" },
        ]},
        { title: "Reminders", rows: [
          { label: "Daily planning reminder",desc: "Morning prompt to review and plan your day.",        key: "dailyPlanning" },
          { label: "Timer running over 3h", desc: "Alert when a session has been running unusually long.", key: "timerOverrun" },
          { label: "Upcoming deadlines (24h)",desc: "Reminder the day before a task is due.",            key: "upcomingDeadline" },
        ]},
      ].map((group) => (
        <div key={group.title} className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{group.title}</h2>
          </div>
          <div className="divide-y divide-border">
            {group.rows.map((row) => (
              <NotifRow key={row.key} label={row.label} description={row.desc}
                pref={(notif as any)[row.key]} onChange={(v) => updateNotif(row.key as any, v)} />
            ))}
          </div>
        </div>
      ))}
      <Section title="Quiet hours" description="Suppress all in-app notifications during these hours.">
        <Row label="Enable quiet hours">
          <Toggle value={notif.quietHoursEnabled} onChange={(v) => updateNotif("quietHoursEnabled", v)} />
        </Row>
        {notif.quietHoursEnabled && (
          <>
            <Row label="From">
              <input type="time" value={notif.quietHoursFrom} onChange={(e) => updateNotif("quietHoursFrom", e.target.value)}
                className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </Row>
            <Row label="To">
              <input type="time" value={notif.quietHoursTo} onChange={(e) => updateNotif("quietHoursTo", e.target.value)}
                className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </Row>
          </>
        )}
      </Section>
    </>
  );

  if (section === "account") return (
    <>
      <Section title="Profile">
        <Row label="Full name">
          <input defaultValue="Alex Chen" className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-40" />
        </Row>
        <Row label="Email address"><span className="text-sm text-muted-foreground">alex@acme.com</span></Row>
        <Row label="Avatar">
          <button className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity">Change <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
      <Section title="Security">
        <Row label="Password" description="Last changed 3 months ago.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">Change <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
        <Row label="Two-factor authentication" description="Secure your account with an authenticator app.">
          <Toggle value={false} onChange={() => {}} />
        </Row>
        <Row label="Active sessions" description="Manage where you're logged in.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">View <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
      <Section title="Data">
        <Row label="Export data" description="Download all your tasks, sessions, and goal data as CSV.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">Export <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
        <Row label="Delete account" description="Permanently delete your account and all associated data." danger>
          <button className="flex items-center gap-1.5 text-sm text-destructive hover:opacity-80">Delete <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
    </>
  );

  return null;
}

// ─── Workspace settings sections ─────────────────────────────────────────────

function WorkspaceSettings({ section, canSeeBilling, workspaceName, workspaceIcon }: {
  section: string; canSeeBilling: boolean; workspaceName: string; workspaceIcon: string;
}) {
  if (section === "connections") return (
    <>
      <div className="flex items-start gap-2 p-3.5 rounded-xl border border-border bg-muted/30 mb-5">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These are your personal connections. Workspace-level integrations (for all members) are managed separately by workspace admins.
        </p>
      </div>
      {[
        { category: "Calendar",           label: "Calendars",           desc: "Sync events into your Dashboard and Calendar pages." },
        { category: "Project management", label: "Project management",  desc: "Import tasks from external boards." },
        { category: "Communication",      label: "Communication",       desc: "Receive notifications in messaging apps." },
      ].map((group) => (
        <div key={group.category} className="bg-card border border-border rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
          </div>
          {CONNECTIONS.filter((c) => c.category === group.category).map((c) => <ConnectionCard key={c.id} conn={c} />)}
        </div>
      ))}
    </>
  );

  if (section === "billing") return (
    <>
      <PersonalBilling />
      {canSeeBilling && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-sm">{workspaceIcon}</div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{workspaceName} — Org plan</h2>
              <p className="text-xs text-muted-foreground">Business · 13 seats</p>
            </div>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Active</span>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-4">
              <div><p className="text-sm text-foreground">Business · $18/seat/mo</p><p className="text-xs text-muted-foreground mt-0.5">$234/mo · Renews May 1, 2025</p></div>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">Manage <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div><p className="text-sm text-foreground">Seat usage</p><p className="text-xs text-muted-foreground mt-0.5">13 of 20 seats used</p></div>
              <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: "65%" }} /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return null;
}

// ─── Team settings section ────────────────────────────────────────────────────

function TeamSettings({ myTeams }: { myTeams: { team: { id: string; name: string }; role: "ADMIN" | "STANDARD" }[] }) {
  const adminTeams = myTeams.filter((mt) => mt.role === "ADMIN");
  const [teamId, setTeamId] = useState(adminTeams[0]?.team.id ?? "");
  const [taskStatuses, setTaskStatuses] = useState<EditableItem[]>([
    { id: 1, label: "Backlog",     color: "#5c6370" },
    { id: 2, label: "To Do",       color: "#abb2bf" },
    { id: 3, label: "In Progress", color: "#61afef" },
    { id: 4, label: "In Review",   color: "#e5c07b" },
    { id: 5, label: "Done",        color: "#98c379" },
  ]);
  const [taskTypes, setTaskTypes] = useState<EditableItem[]>([
    { id: 1, label: "Feature",  color: "#98c379" },
    { id: 2, label: "Bug",      color: "#e06c75" },
    { id: 3, label: "Chore",    color: "#abb2bf" },
    { id: 4, label: "Research", color: "#c678dd" },
  ]);
  const [requireEstimates, setRequireEstimates] = useState(true);
  const [trackHours, setTrackHours]             = useState(true);
  const [shoutoutsEnabled, setShoutoutsEnabled] = useState(true);

  return (
    <div className="space-y-5">
      {adminTeams.length > 1 && (
        <Section title="Select team">
          <Row label="Editing settings for">
            <SelectInput value={teamId}
              options={adminTeams.map((mt) => ({ value: mt.team.id, label: mt.team.name }))}
              onChange={setTeamId} />
          </Row>
        </Section>
      )}

      {/* Ticket statuses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Ticket statuses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Workflow stages for tasks. Click a color swatch to change it, click the label to rename.
            Use ↑↓ to reorder on hover.
          </p>
        </div>
        <EditableList items={taskStatuses} onChange={setTaskStatuses} addLabel="Add status" minCount={2} />
      </div>

      {/* Task types */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Task types</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Classification labels for categorizing tasks on this team.</p>
        </div>
        <EditableList items={taskTypes} onChange={setTaskTypes} addLabel="Add task type" minCount={1} />
      </div>

      {/* Team behaviour */}
      <Section title="Team behaviour">
        <Row label="Require task estimates" description="Members must set an estimated time before a session can start.">
          <Toggle value={requireEstimates} onChange={setRequireEstimates} />
        </Row>
        <Row label="Track member hours" description="Aggregate daily hours per member in the Insights page.">
          <Toggle value={trackHours} onChange={setTrackHours} />
        </Row>
        <Row label="Enable shoutouts" description="Allow admins to recognize team members in the Insights page.">
          <Toggle value={shoutoutsEnabled} onChange={setShoutoutsEnabled} />
        </Row>
      </Section>

      {/* Danger */}
      <div className="bg-card border border-destructive/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive/80">Danger zone</h3>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Archive team</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hides the team from the sidebar. Tasks and history are preserved.</p>
          </div>
          <button className="text-sm text-destructive/70 hover:text-destructive transition-colors">Archive</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section description map ──────────────────────────────────────────────────

const SECTION_DESC: Record<string, string> = {
  time:        "Control how Stride records and surfaces your working time.",
  display:     "Customize how the app looks and feels.",
  schedule:    "Configure your calendar integrations and scheduling preferences.",
  notif:       "Choose what you get notified about and how.",
  account:     "Manage your account credentials and security.",
  connections: "Connect third-party tools to import tasks and sync your calendar.",
  billing:     "View and manage your plan and payment details.",
  team:        "Configure your team's task workflow, statuses, and task types.",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const {
    settings, updateSettings, settingsSection,
    activeWorkspace, workspaceRole, myTeams,
    darkMode, toggleDarkMode,
  } = useApp();

  const canSeeBilling = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isTeamAdmin   = myTeams.some((mt) => mt.role === "ADMIN");

  const currentNav = SETTINGS_NAV.find((s) => s.id === settingsSection);

  const personalSections  = ["time", "display", "schedule", "notif", "account"];
  const workspaceSections = ["connections", "billing"];
  const teamSections      = ["team"];

  const isPersonal  = personalSections.includes(settingsSection);
  const isWorkspace = workspaceSections.includes(settingsSection);
  const isTeam      = teamSections.includes(settingsSection);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            {currentNav && <currentNav.icon className="h-4 w-4 text-muted-foreground" />}
            <h1 className="text-foreground">{currentNav?.label ?? "Settings"}</h1>
            <span className={cn("ml-1 text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium",
              isTeam ? "bg-primary/10 text-primary" : isWorkspace ? "bg-muted-foreground/10 text-muted-foreground" : "bg-muted text-muted-foreground/70")}>
              {isTeam ? "Team" : isWorkspace ? "Workspace" : "Personal"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{SECTION_DESC[settingsSection] ?? ""}</p>
        </div>

        {isPersonal && (
          <PersonalSettings
            section={settingsSection} settings={settings} updateSettings={updateSettings}
            darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}

        {isWorkspace && (
          <WorkspaceSettings
            section={settingsSection} canSeeBilling={canSeeBilling}
            workspaceName={activeWorkspace.name} workspaceIcon={activeWorkspace.icon} />
        )}

        {isTeam && (
          isTeamAdmin ? (
            <TeamSettings myTeams={myTeams as any} />
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Team settings are only available to team admins.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
