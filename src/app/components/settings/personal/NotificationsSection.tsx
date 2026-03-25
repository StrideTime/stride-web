import { Bell, Mail } from "lucide-react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { ApplyToAllBanner } from "../shared/ApplyToAllBanner";
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
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
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
  const { settings, updateSettings, activeWorkspace } = useApp();
  const isOrg = activeWorkspace.type === "ORGANIZATION";
  const notif = settings.notifications;
  const updateNotif = (key: keyof typeof notif, val: any) =>
    updateSettings({ notifications: { ...notif, [key]: val } });

  return (
    <div className="space-y-5">
      {/* Activity */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</h2>
        </div>
        <div className="divide-y divide-border">
          <NotifItem label="Task completed" desc="When one of your tasks is marked complete."
            pref={notif.taskCompleted} onChange={(v) => updateNotif("taskCompleted", v)} />
          <NotifItem label="Task assigned to you" desc="When a team member assigns a task to you."
            pref={notif.taskAssigned} onChange={(v) => updateNotif("taskAssigned", v)} />
          <NotifItem label="Mention in a comment" desc="When someone @-mentions you on a task."
            pref={notif.mention} onChange={(v) => updateNotif("mention", v)} />
        </div>
        <ApplyToAllBanner sectionLabel="Activity" compact />
      </div>

      {/* Reminders */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reminders</h2>
        </div>
        <div className="divide-y divide-border">
          <NotifItem label="Daily planning reminder" desc="Morning prompt to review and plan your day."
            pref={notif.dailyPlanning} onChange={(v) => updateNotif("dailyPlanning", v)} />
          <NotifItem label="Timer running over 3h" desc="Alert when a session has been running unusually long."
            pref={notif.timerOverrun} onChange={(v) => updateNotif("timerOverrun", v)} />
          <NotifItem label="Upcoming deadlines" desc="Reminder the day before a task is due."
            pref={notif.upcomingDeadline} onChange={(v) => updateNotif("upcomingDeadline", v)} />
        </div>
        <ApplyToAllBanner sectionLabel="Reminders" compact />
      </div>

      {/* Team & Organization — only for org workspaces */}
      {isOrg && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team & Organization</h2>
          </div>
          <div className="divide-y divide-border">
            <NotifItem label="Team task assigned" desc="When any task is assigned within your team."
              pref={notif.teamTaskAssigned} onChange={(v) => updateNotif("teamTaskAssigned", v)} />
            <NotifItem label="Deadline approaching" desc="24 hours before a task or project deadline."
              pref={notif.deadlineApproaching} onChange={(v) => updateNotif("deadlineApproaching", v)} />
            <NotifItem label="Goal milestone reached" desc="When you hit a significant percentage on a goal."
              pref={notif.goalMilestone} onChange={(v) => updateNotif("goalMilestone", v)} />
          </div>
          <ApplyToAllBanner sectionLabel="Team" compact />
        </div>
      )}

      {/* Reports & Digests */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports & Digests</h2>
        </div>
        <div className="divide-y divide-border">
          <NotifItem label="Weekly progress digest" desc="Summary of tasks, hours, and goal progress each Monday."
            pref={notif.weeklyDigest} onChange={(v) => updateNotif("weeklyDigest", v)} />
        </div>
        <ApplyToAllBanner sectionLabel="Digests" compact />
      </div>

      {/* Quiet hours */}
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
    </div>
  );
}
