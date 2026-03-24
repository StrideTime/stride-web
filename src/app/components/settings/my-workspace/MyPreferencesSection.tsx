import { useState } from "react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";

export function MyPreferencesSection() {
  const [defaultView, setDefaultView] = useState("today");
  const [groupBy, setGroupBy] = useState("project");
  const [sortBy, setSortBy] = useState("priority");
  const [showCompleted, setShowCompleted] = useState(false);

  const [taskReminders, setTaskReminders] = useState(true);
  const [goalProgress, setGoalProgress] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);

  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [autoStartTimer, setAutoStartTimer] = useState(false);

  return (
    <div className="space-y-5">
      {/* Task views */}
      <Section title="Task views" description="How tasks are displayed when you open this workspace.">
        <Row label="Default view">
          <SelectInput value={defaultView}
            options={[
              { value: "today", label: "Today" },
              { value: "tasks", label: "All Tasks" },
              { value: "planner", label: "Weekly Planner" },
              { value: "stats", label: "Stats" },
            ]}
            onChange={setDefaultView} />
        </Row>
        <Row label="Group tasks by">
          <SelectInput value={groupBy}
            options={[
              { value: "project", label: "Project" },
              { value: "status", label: "Status" },
              { value: "priority", label: "Priority" },
              { value: "date", label: "Due Date" },
              { value: "none", label: "None" },
            ]}
            onChange={setGroupBy} />
        </Row>
        <Row label="Sort tasks by">
          <SelectInput value={sortBy}
            options={[
              { value: "priority", label: "Priority" },
              { value: "date", label: "Due Date" },
              { value: "created", label: "Created Date" },
              { value: "progress", label: "Progress" },
              { value: "difficulty", label: "Difficulty" },
            ]}
            onChange={setSortBy} />
        </Row>
        <Row label="Show completed tasks" description="Display completed tasks in lists.">
          <Toggle value={showCompleted} onChange={setShowCompleted} />
        </Row>
      </Section>

      {/* Workspace notifications */}
      <Section title="Notifications for this workspace" description="Override your global notification preferences for this workspace.">
        <Row label="Task reminders" description="Get reminded about upcoming tasks.">
          <Toggle value={taskReminders} onChange={setTaskReminders} />
        </Row>
        <Row label="Goal progress" description="Notify when approaching daily goals.">
          <Toggle value={goalProgress} onChange={setGoalProgress} />
        </Row>
        <Row label="Break reminders" description="Remind me to take breaks.">
          <Toggle value={breakReminders} onChange={setBreakReminders} />
        </Row>
        <Row label="Daily summary" description="End-of-day productivity report.">
          <Toggle value={dailySummary} onChange={setDailySummary} />
        </Row>
      </Section>

      {/* Quick actions */}
      <Section title="Quick actions">
        <Row label="Show quick-add button" description="Floating + button for quick task creation.">
          <Toggle value={showQuickAdd} onChange={setShowQuickAdd} />
        </Row>
        <Row label="Keyboard shortcuts" description="Use keyboard for navigation and actions.">
          <Toggle value={keyboardShortcuts} onChange={setKeyboardShortcuts} />
        </Row>
        <Row label="Auto-start timer on task" description="Start timer when clicking a task.">
          <Toggle value={autoStartTimer} onChange={setAutoStartTimer} />
        </Row>
      </Section>

      {/* Keyboard shortcuts reference */}
      {keyboardShortcuts && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-5 py-4">
            {[
              { action: "Quick Add", key: "Q" },
              { action: "Search", key: "\u2318K" },
              { action: "Settings", key: "\u2318," },
              { action: "Today View", key: "T" },
            ].map((s) => (
              <div key={s.action} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.action}</span>
                <kbd className="px-1.5 py-0.5 text-[11px] bg-muted border border-border rounded font-mono">{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
