import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  WORKSPACES, WORKSPACE_MEMBERSHIPS, TEAMS, TEAM_MEMBERS,
  type Workspace, type WorkspaceRole, type TeamRole, type Team,
} from "../data/mockData";

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface NotificationPref {
  inApp: boolean;
  email: boolean;
}

export interface AppSettings {
  /** project-only: no clock-in/out concept. daily: explicit clock-in/out. */
  timeTrackingMode: "project-only" | "daily";
  defaultView: "list" | "board";
  weekStartsOn: "monday" | "sunday";
  workDayStart: string;
  workDayEnd: string;
  notifications: {
    // Activity
    taskCompleted: NotificationPref;
    taskAssigned: NotificationPref;
    mention: NotificationPref;
    // Team
    teamTaskAssigned: NotificationPref;
    deadlineApproaching: NotificationPref;
    // Reports
    weeklyDigest: NotificationPref;
    goalMilestone: NotificationPref;
    // Reminders
    dailyPlanning: NotificationPref;
    timerOverrun: NotificationPref;
    upcomingDeadline: NotificationPref;
    // Quiet hours
    quietHoursEnabled: boolean;
    quietHoursFrom: string;
    quietHoursTo: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  timeTrackingMode: "project-only",
  defaultView: "list",
  weekStartsOn: "monday",
  workDayStart: "09:00",
  workDayEnd: "17:00",
  notifications: {
    taskCompleted:      { inApp: true,  email: false },
    taskAssigned:       { inApp: true,  email: true  },
    mention:            { inApp: true,  email: true  },
    teamTaskAssigned:   { inApp: true,  email: false },
    deadlineApproaching:{ inApp: true,  email: true  },
    weeklyDigest:       { inApp: false, email: true  },
    goalMilestone:      { inApp: true,  email: true  },
    dailyPlanning:      { inApp: true,  email: false },
    timerOverrun:       { inApp: true,  email: false },
    upcomingDeadline:   { inApp: true,  email: true  },
    quietHoursEnabled:  false,
    quietHoursFrom:     "22:00",
    quietHoursTo:       "08:00",
  },
};

// ─── Active session ───────────────────────────────────────────────────────────

export interface ActiveSession {
  taskId: number;
  taskTitle: string;
  projectColor: string;
  projectName?: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

export interface AppContextType {
  // Workspace
  activeWorkspace: Workspace;
  setActiveWorkspace: (ws: Workspace) => void;
  workspaceRole: WorkspaceRole;
  myTeams: { team: Team; role: TeamRole }[];

  // Appearance
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Settings navigation (shared between Sidebar and SettingsPage)
  settingsSection: string;
  setSettingsSection: (s: string) => void;

  // Clock-in
  clockedIn: boolean;
  clockInTime: Date | null;
  clockIn: () => void;
  clockOut: () => void;

  // Timer / active session
  activeSession: ActiveSession | null;
  sessionSeconds: number;
  sessionRunning: boolean;
  startSession: (session: ActiveSession) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(WORKSPACES[2]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsSection, setSettingsSection] = useState("time");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const [activeSession, setActiveSessionState] = useState<ActiveSession | null>({
    taskId: 5,
    taskTitle: "Redesign dashboard components",
    projectColor: "#61afef",
    projectName: "Stride v2.0",
  });
  const [sessionSeconds, setSessionSeconds] = useState(1694);
  const [sessionRunning, setSessionRunning] = useState(true);

  useEffect(() => {
    if (!sessionRunning || !activeSession) return;
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sessionRunning, activeSession]);

  const workspaceRole: WorkspaceRole =
    WORKSPACE_MEMBERSHIPS.find(
      (wm) => wm.workspaceId === activeWorkspace.id && wm.userId === "u1"
    )?.role ?? "MEMBER";

  const myTeams = TEAM_MEMBERS.filter((tm) => tm.userId === "u1")
    .map((tm) => ({ team: TEAMS.find((t) => t.id === tm.teamId)!, role: tm.role }))
    .filter((item) => item.team?.workspaceId === activeWorkspace.id);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const clockIn = useCallback(() => { setClockedIn(true); setClockInTime(new Date()); }, []);
  const clockOut = useCallback(() => { setClockedIn(false); setClockInTime(null); }, []);

  const startSession = useCallback((session: ActiveSession) => {
    setActiveSessionState(session); setSessionSeconds(0); setSessionRunning(true);
  }, []);
  const pauseSession = useCallback(() => setSessionRunning(false), []);
  const resumeSession = useCallback(() => setSessionRunning(true), []);
  const stopSession = useCallback(() => {
    setActiveSessionState(null); setSessionSeconds(0); setSessionRunning(false);
  }, []);

  return (
    <AppContext.Provider value={{
      activeWorkspace, setActiveWorkspace, workspaceRole, myTeams,
      darkMode, toggleDarkMode,
      settings, updateSettings,
      settingsSection, setSettingsSection,
      clockedIn, clockInTime, clockIn, clockOut,
      activeSession, sessionSeconds, sessionRunning,
      startSession, pauseSession, resumeSession, stopSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}