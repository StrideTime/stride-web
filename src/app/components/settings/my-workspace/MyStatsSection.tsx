import { useState } from "react";
import {
  Timer, Coffee, Zap, CheckSquare, Target, Gauge, AlertTriangle,
  Info, Eye, EyeOff, BarChart2, TrendingUp,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";

// ─── Component ───────────────────────────────────────────────────────────────

export function MyStatsSection() {
  const { wsPermissions } = useApp();

  // Personal display preferences (what the user wants to see on their own dashboard)
  const [showTimeChart, setShowTimeChart] = useState(true);
  const [showTaskVelocity, setShowTaskVelocity] = useState(true);
  const [showFocusStats, setShowFocusStats] = useState(true);
  const [showGoalProgress, setShowGoalProgress] = useState(true);
  const [showEstimateAccuracy, setShowEstimateAccuracy] = useState(false);
  const [showStreak, setShowStreak] = useState(true);

  // Privacy
  const [profileVisible, setProfileVisible] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);

  // Dashboard layout
  const [defaultStatsView, setDefaultStatsView] = useState("week");
  const [chartStyle, setChartStyle] = useState("area");

  // What the workspace admin has enabled
  const enabledTrackers = [
    { enabled: wsPermissions.trackTimeEntries, label: "Time entries", icon: Timer, color: "#61afef" },
    { enabled: wsPermissions.trackBreaks, label: "Breaks", icon: Coffee, color: "#98c379" },
    { enabled: wsPermissions.trackFocusSessions, label: "Focus sessions", icon: Zap, color: "#c678dd" },
    { enabled: wsPermissions.trackTaskCompletion, label: "Task completion", icon: CheckSquare, color: "#e5c07b" },
    { enabled: wsPermissions.trackGoalProgress, label: "Goal progress", icon: Target, color: "#e06c75" },
    { enabled: wsPermissions.trackEstimateAccuracy, label: "Estimate accuracy", icon: Gauge, color: "#56b6c2" },
    { enabled: wsPermissions.trackBurnoutRisk, label: "Burnout monitoring", icon: AlertTriangle, color: "#d19a66" },
  ];

  return (
    <div className="space-y-5">
      {/* What's being tracked (read-only from workspace admin) */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">What's being tracked</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configured by your workspace admin.</p>
          </div>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {enabledTrackers.map((t) => (
              <div key={t.label} className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium",
                t.enabled
                  ? "border-transparent"
                  : "border-border text-muted-foreground/50 line-through"
              )} style={t.enabled ? { backgroundColor: `${t.color}12`, color: t.color } : undefined}>
                <t.icon className="h-3 w-3" />
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard preferences */}
      <Section title="Dashboard display" description="Choose which stats widgets show on your personal dashboard.">
        <Row label="Hours logged chart" description="Daily/weekly hours breakdown.">
          <Toggle value={showTimeChart} onChange={setShowTimeChart} />
        </Row>
        <Row label="Task velocity" description="Tasks completed vs added over time.">
          <Toggle value={showTaskVelocity} onChange={setShowTaskVelocity} />
        </Row>
        <Row label="Focus sessions" description="Focus time and Pomodoro session stats.">
          <Toggle value={showFocusStats} onChange={setShowFocusStats} />
        </Row>
        <Row label="Goal progress" description="Progress toward your active goals.">
          <Toggle value={showGoalProgress} onChange={setShowGoalProgress} />
        </Row>
        <Row label="Estimate accuracy" description="How accurate your time estimates are.">
          <Toggle value={showEstimateAccuracy} onChange={setShowEstimateAccuracy} />
        </Row>
        <Row label="Logging streak" description="Consecutive days with tracked activity.">
          <Toggle value={showStreak} onChange={setShowStreak} />
        </Row>
      </Section>

      {/* Chart preferences */}
      <Section title="Chart preferences" description="Customize how charts display on your stats page.">
        <Row label="Default time range">
          <SelectInput
            value={defaultStatsView}
            onChange={setDefaultStatsView}
            options={[
              { value: "day", label: "Today" },
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
              { value: "quarter", label: "This quarter" },
            ]}
          />
        </Row>
        <Row label="Chart style">
          <SelectInput
            value={chartStyle}
            onChange={setChartStyle}
            options={[
              { value: "area", label: "Area chart" },
              { value: "line", label: "Line chart" },
              { value: "bar", label: "Bar chart" },
            ]}
          />
        </Row>
      </Section>

      {/* Privacy */}
      <Section title="Privacy" description="Control how your stats appear to others.">
        <Row label="Profile visible to team" description="Allow team members to see your activity summary.">
          <Toggle value={profileVisible} onChange={setProfileVisible} />
        </Row>
        {wsPermissions.enableLeaderboard && (
          <Row label="Show on leaderboard" description="Include your stats in the workspace leaderboard.">
            <Toggle value={showOnLeaderboard} onChange={setShowOnLeaderboard} />
          </Row>
        )}
      </Section>

      {/* Visibility summary */}
      <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 flex items-start gap-3">
        {profileVisible ? (
          <Eye className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-xs font-medium text-foreground">
            {profileVisible ? "Your stats are visible" : "Your stats are private"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {wsPermissions.statsVisibility === "private"
              ? "Your workspace admin has set stats to private. Only you can see your detailed statistics."
              : wsPermissions.statsVisibility === "team_leads"
                ? "Team admins and workspace admins can see your stats summary. Detailed stats are only visible to you."
                : "All workspace members can see your stats summary."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
