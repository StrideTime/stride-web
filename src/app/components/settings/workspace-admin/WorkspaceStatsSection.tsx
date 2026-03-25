import {
  Timer, Coffee, Zap, CheckSquare, Target, Gauge,
  AlertTriangle, Trophy, Medal, Eye, Database,
  ClipboardList, Mail, Info,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";

// ─── Tracking toggle card ────────────────────────────────────────────────────

function TrackingCard({ icon: Icon, label, description, enabled, onChange, color }: {
  icon: typeof Timer;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all",
      enabled ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-card"
    )}>
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
        enabled ? `bg-[${color}]/10` : "bg-muted"
      )} style={enabled ? { backgroundColor: `${color}15`, color } : undefined}>
        <Icon className={cn("h-4 w-4", !enabled && "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Toggle value={enabled} onChange={onChange} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WorkspaceStatsSection() {
  const { wsPermissions, updateWsPermissions } = useApp();

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These settings determine what gets tracked across your organization.
          Members can see what's enabled but cannot override these settings.
        </p>
      </div>

      {/* ── Activity tracking ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Activity tracking</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose what activities are tracked for organization members.</p>
        </div>
        <div className="p-4 space-y-3">
          <TrackingCard
            icon={Timer} label="Time entries" color="#61afef"
            description="Track time spent on tasks and projects. This is the core time tracking feature."
            enabled={wsPermissions.trackTimeEntries}
            onChange={(v) => updateWsPermissions({ trackTimeEntries: v })}
          />
          <TrackingCard
            icon={Coffee} label="Breaks" color="#98c379"
            description="Track break duration and frequency. Helps monitor work-life balance."
            enabled={wsPermissions.trackBreaks}
            onChange={(v) => updateWsPermissions({ trackBreaks: v })}
          />
          <TrackingCard
            icon={Zap} label="Focus sessions" color="#c678dd"
            description="Track deep work and focus timer usage. Includes Pomodoro sessions."
            enabled={wsPermissions.trackFocusSessions}
            onChange={(v) => updateWsPermissions({ trackFocusSessions: v })}
          />
          <TrackingCard
            icon={CheckSquare} label="Task completion" color="#e5c07b"
            description="Track tasks completed, velocity, and throughput over time."
            enabled={wsPermissions.trackTaskCompletion}
            onChange={(v) => updateWsPermissions({ trackTaskCompletion: v })}
          />
          <TrackingCard
            icon={Target} label="Goal progress" color="#e06c75"
            description="Track progress toward individual and team goals."
            enabled={wsPermissions.trackGoalProgress}
            onChange={(v) => updateWsPermissions({ trackGoalProgress: v })}
          />
          <TrackingCard
            icon={Gauge} label="Estimate accuracy" color="#56b6c2"
            description="Compare estimated vs actual time to improve planning over time."
            enabled={wsPermissions.trackEstimateAccuracy}
            onChange={(v) => updateWsPermissions({ trackEstimateAccuracy: v })}
          />
          <TrackingCard
            icon={AlertTriangle} label="Burnout risk" color="#d19a66"
            description="Monitor working patterns to flag potential burnout. Uses hours, overtime, and break frequency."
            enabled={wsPermissions.trackBurnoutRisk}
            onChange={(v) => updateWsPermissions({ trackBurnoutRisk: v })}
          />
        </div>
      </div>

      {/* ── Social & visibility ── */}
      <Section title="Social & gamification" description="Optional features that encourage healthy engagement.">
        <Row label="Leaderboard" description="Show a workspace leaderboard ranking members by activity.">
          <Toggle value={wsPermissions.enableLeaderboard} onChange={(v) => updateWsPermissions({ enableLeaderboard: v })} />
        </Row>
        <Row label="Achievements" description="Award badges for milestones like streaks, task counts, and focus hours.">
          <Toggle value={wsPermissions.enableAchievements} onChange={(v) => updateWsPermissions({ enableAchievements: v })} />
        </Row>
      </Section>

      {/* ── Visibility ── */}
      <Section title="Stats visibility" description="Control who can see individual member statistics.">
        <Row label="Member stats visible to">
          <SelectInput
            value={wsPermissions.statsVisibility}
            onChange={(v) => updateWsPermissions({ statsVisibility: v as any })}
            options={[
              { value: "private", label: "Only the member themselves" },
              { value: "team_leads", label: "Team admins and above" },
              { value: "everyone", label: "All workspace members" },
            ]}
          />
        </Row>
      </Section>

      {/* ── Data & reporting ── */}
      <Section title="Data & reporting" description="Reporting cadence and data management.">
        <Row label="Require daily log" description="Prompt members to submit a brief daily activity log.">
          <Toggle value={wsPermissions.requireDailyLog} onChange={(v) => updateWsPermissions({ requireDailyLog: v })} />
        </Row>
        <Row label="Weekly digest email" description="Send members a weekly summary of their tracked stats.">
          <Toggle value={wsPermissions.enableWeeklyDigest} onChange={(v) => updateWsPermissions({ enableWeeklyDigest: v })} />
        </Row>
        <Row label="Stats retention" description="How long to keep detailed stats history for all members.">
          <SelectInput
            value={String(wsPermissions.statsRetentionDays)}
            onChange={(v) => updateWsPermissions({ statsRetentionDays: parseInt(v) })}
            options={[
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
              { value: "180", label: "6 months" },
              { value: "365", label: "1 year" },
              { value: "0", label: "Forever" },
            ]}
          />
        </Row>
      </Section>

      {/* Tracking summary */}
      <div className="rounded-lg bg-muted/30 border border-border px-4 py-3">
        <p className="text-xs font-medium text-foreground mb-2">Active tracking summary</p>
        <div className="flex flex-wrap gap-2">
          {wsPermissions.trackTimeEntries && <SummaryChip label="Time" color="#61afef" />}
          {wsPermissions.trackBreaks && <SummaryChip label="Breaks" color="#98c379" />}
          {wsPermissions.trackFocusSessions && <SummaryChip label="Focus" color="#c678dd" />}
          {wsPermissions.trackTaskCompletion && <SummaryChip label="Tasks" color="#e5c07b" />}
          {wsPermissions.trackGoalProgress && <SummaryChip label="Goals" color="#e06c75" />}
          {wsPermissions.trackEstimateAccuracy && <SummaryChip label="Estimates" color="#56b6c2" />}
          {wsPermissions.trackBurnoutRisk && <SummaryChip label="Burnout" color="#d19a66" />}
          {!wsPermissions.trackTimeEntries && !wsPermissions.trackBreaks && !wsPermissions.trackFocusSessions
            && !wsPermissions.trackTaskCompletion && !wsPermissions.trackGoalProgress
            && <span className="text-xs text-muted-foreground">No tracking enabled</span>}
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${color}15`, color }}>
      {label}
    </span>
  );
}
