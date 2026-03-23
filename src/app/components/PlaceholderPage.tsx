import { useLocation } from "react-router";
import { Construction } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  "/tasks": "Tasks",
  "/focus": "Focus Sessions",
  "/timer": "Timer & Time Tracking",
  "/calendar": "Calendar",
  "/habits": "Habits",
  "/goals": "Goals",
  "/reports": "Reports & Analytics",
  "/projects": "Projects",
  "/team": "Team",
  "/settings": "Settings",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/tasks": "Manage your task backlog, plan your day, and track progress across projects.",
  "/focus": "Pomodoro-style focus sessions with configurable work/break intervals.",
  "/timer": "Live time tracking with start/stop/pause and time entry history.",
  "/calendar": "View and manage scheduled events, sync with Google Calendar.",
  "/habits": "Track daily and weekly habits with streaks, history, and completion rates.",
  "/goals": "Set and track goals with milestones, progress, and deadlines.",
  "/reports": "Analytics dashboard — focus time, task velocity, habit trends, and more.",
  "/projects": "Project overview with task breakdowns, progress, and team assignments.",
  "/team": "Team management, member performance, and shared projects.",
  "/settings": "Workspace settings, preferences, notifications, and integrations.",
};

export function PlaceholderPage() {
  const location = useLocation();
  const label = PAGE_LABELS[location.pathname] ?? "Page";
  const description = PAGE_DESCRIPTIONS[location.pathname] ?? "Coming up next in the wireframe series.";

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Construction className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-foreground mb-2">{label}</h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      <div className="mt-6 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
        Wireframe coming next
      </div>
    </div>
  );
}