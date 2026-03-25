import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { TodayPage } from "./components/TodayPage";
import { TeamPage } from "./components/TeamPage";
import { TeamTasksPage } from "./components/TeamTasksPage";
import { OrgDashboard } from "./components/OrgDashboard";
import { SettingsPage } from "./components/settings/SettingsPage";
import { GoalsPage } from "./components/GoalsPage";
import { StatsPage } from "./components/stats/StatsPage";
import { TasksPage } from "./components/TasksPage";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { TimerPage } from "./components/TimerPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                      Component: TodayPage },
      { path: "tasks",                    Component: TasksPage },
      { path: "focus",                    Component: PlaceholderPage },
      { path: "timer",                    Component: TimerPage },
      { path: "calendar",                 Component: PlaceholderPage },
      { path: "goals",                    Component: GoalsPage },
      { path: "stats",                   Component: StatsPage },
      // Team routes
      { path: "team/:teamId/tasks",       Component: TeamTasksPage },
      { path: "team/:teamId",             Component: TeamPage },
      // Org routes
      { path: "org/members",              Component: OrgDashboard },
      // Settings — section from URL param
      { path: "settings",                 Component: SettingsPage },
      { path: "settings/:section",        Component: SettingsPage },
    ],
  },
]);
