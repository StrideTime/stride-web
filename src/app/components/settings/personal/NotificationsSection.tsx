import { Bell, Mail } from "lucide-react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { useApp } from "../../../context/AppContext";
import { cn } from "../../ui/utils";
import type { NotificationPref } from "../../../context/AppContext";

// ─── Channel toggle pill ────────────────────────────────────────────────────

function ChannelPill({ label, icon: Icon, active, onChange }: {
  label: string;
  icon: typeof Bell;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
        active
          ? "bg-primary/8 border-primary/30 text-primary"
          : "bg-transparent border-border text-muted-foreground/50 hover:text-muted-foreground hover:border-muted-foreground/30"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

// ─── Single notification row ────────────────────────────────────────────────

function NotifItem({ label, description, pref, onChange }: {
  label: string;
  description: string;
  pref: NotificationPref;
  onChange: (p: NotificationPref) => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <ChannelPill label="In-app" icon={Bell} active={pref.inApp} onChange={(v) => onChange({ ...pref, inApp: v })} />
        <ChannelPill label="Email" icon={Mail} active={pref.email} onChange={(v) => onChange({ ...pref, email: v })} />
      </div>
    </div>
  );
}

// ─── Notifications section ──────────────────────────────────────────────────

export function NotificationsSection() {
  const { settings, updateSettings } = useApp();
  const notif = settings.notifications;
  const updateNotif = (key: keyof typeof notif, val: any) =>
    updateSettings({ notifications: { ...notif, [key]: val } });

  const groups = [
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
  ];

  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{group.title}</h2>
          </div>
          <div className="divide-y divide-border">
            {group.rows.map((row) => (
              <NotifItem key={row.key} label={row.label} description={row.desc}
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
}
