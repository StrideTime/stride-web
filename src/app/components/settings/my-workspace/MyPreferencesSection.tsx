import { useState } from "react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";
import { ApplyToAllBanner } from "../shared/ApplyToAllBanner";

export function MyPreferencesSection() {
  const [defaultView, setDefaultView] = useState("today");
  const [groupBy, setGroupBy] = useState("project");
  const [sortBy, setSortBy] = useState("priority");
  const [showCompleted, setShowCompleted] = useState(false);

  const [showQuickAdd, setShowQuickAdd] = useState(true);
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
        <Row label="Show completed tasks" description="Display completed tasks in task lists.">
          <Toggle value={showCompleted} onChange={setShowCompleted} />
        </Row>
      </Section>

      {/* Quick actions */}
      <Section title="Quick actions" description="Shortcuts and behaviors when working in this workspace.">
        <Row label="Show quick-add button" description="Floating button for quick task creation.">
          <Toggle value={showQuickAdd} onChange={setShowQuickAdd} />
        </Row>
        <Row label="Auto-start timer on task" description="Automatically start the timer when you open a task.">
          <Toggle value={autoStartTimer} onChange={setAutoStartTimer} />
        </Row>
      </Section>

      {/* Apply to all */}
      <ApplyToAllBanner />
    </div>
  );
}
