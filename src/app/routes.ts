import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { TodayPage } from "./components/TodayPage";
import { TeamPage } from "./components/TeamPage";
import { TeamTasksPage } from "./components/TeamTasksPage";
import { OrgDashboard } from "./components/OrgDashboard";
import { SettingsPage } from "./components/SettingsPage";
import { GoalsPage } from "./components/GoalsPage";
import { ReportsPage } from "./components/ReportsPage";
import { PlaceholderPage } from "./components/PlaceholderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                      Component: TodayPage },
      { path: "focus",                    Component: PlaceholderPage },
      { path: "timer",                    Component: PlaceholderPage },
      { path: "calendar",                 Component: PlaceholderPage },
      { path: "goals",                    Component: GoalsPage },
      { path: "reports",                  Component: ReportsPage },
      // Team routes
      { path: "team/:teamId/tasks",       Component: TeamTasksPage },
      { path: "team/:teamId",             Component: TeamPage },
      // Org routes
      { path: "org",                      Component: OrgDashboard },
      { path: "org/members",              Component: OrgDashboard },
      // Settings
      { path: "settings",                 Component: SettingsPage },
    ],
  },
]);