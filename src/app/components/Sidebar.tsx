import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Timer, Zap, Calendar, Target, BarChart2,
  Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Plus, Building2, Pause, Play, Square,
  ListTodo, Gauge, TrendingUp, SlidersHorizontal, Check,
  Clock, CalendarDays, Bell, Palette, Shield, Plug, CreditCard,
  ArrowLeft, LogIn, LogOut, Users,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useApp } from "../context/AppContext";
import {
  WORKSPACES, WORKSPACE_MEMBERSHIPS,
  type Workspace, type WorkspaceRole,
} from "../data/mockData";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// ─── Nav constants ────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { path: "/",         label: "Dashboard", icon: LayoutDashboard, exact: true },
  null,
  { path: "/calendar", label: "Calendar",  icon: Calendar },
  null,
  { path: "/goals",    label: "Goals",     icon: Target },
  { path: "/reports",  label: "Reports",   icon: BarChart2 },
  null,
  { path: "/focus",    label: "Focus",     icon: Zap },
  { path: "/timer",    label: "Timer",     icon: Timer },
];

// Team sub-nav — Tasks always shown, Insights only for admins
const TEAM_NAV_ADMIN = [
  { subpath: "/tasks", label: "Tasks",    icon: ListTodo },
  { subpath: "",       label: "Insights", icon: Gauge },
];

const TEAM_NAV_STANDARD = [
  { subpath: "/tasks", label: "Tasks", icon: ListTodo },
];

// Org sub-nav (for workspace admins only)
const ORG_NAV = [
  { subpath: "",         label: "Overview", icon: BarChart2 },
  { subpath: "/members", label: "Members",  icon: Users },
];

// Settings nav items
export const SETTINGS_NAV = [
  // Personal
  { id: "time",        label: "Time Tracking", icon: Clock,        group: "personal" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  { id: "display",     label: "Display",       icon: Palette,      group: "personal" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  { id: "schedule",    label: "Schedule",      icon: CalendarDays, group: "personal" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  { id: "notif",       label: "Notifications", icon: Bell,         group: "personal" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  { id: "account",     label: "Account",       icon: Shield,       group: "personal" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  // Workspace
  { id: "connections", label: "Connections",   icon: Plug,         group: "workspace" as const, teamOnly: false, adminOnly: false, ownerOnly: false },
  { id: "billing",     label: "Billing",       icon: CreditCard,   group: "workspace" as const, teamOnly: false, adminOnly: false, ownerOnly: true },
  // Team (team admin only)
  { id: "team",        label: "Team",          icon: Users,        group: "team" as const,      teamOnly: true,  adminOnly: false, ownerOnly: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatClockInTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Workspace switcher ───────────────────────────────────────────────────────

function WorkspaceSwitcher({ activeWorkspace, onSelect, collapsed }: {
  activeWorkspace: Workspace;
  onSelect: (ws: Workspace) => void;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const myIds = WORKSPACE_MEMBERSHIPS.filter((wm) => wm.userId === "u1").map((wm) => wm.workspaceId);
  const accessible = WORKSPACES.filter((ws) => myIds.includes(ws.id));
  const personal = accessible.filter((ws) => ws.type === "PERSONAL");
  const orgs = accessible.filter((ws) => ws.type === "ORGANIZATION");

  const userRoleInWs = (ws: Workspace): WorkspaceRole =>
    WORKSPACE_MEMBERSHIPS.find((wm) => wm.workspaceId === ws.id && wm.userId === "u1")?.role ?? "MEMBER";

  const ROLE_BADGE: Record<WorkspaceRole, string> = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

  return (
    <div ref={ref} className="relative px-2 py-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="text-base leading-none flex-shrink-0">{activeWorkspace.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm font-semibold text-sidebar-foreground truncate">
              {activeWorkspace.name}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-2 right-2 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
          {personal.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Personal</p>
              {personal.map((ws) => (
                <WorkspaceOption key={ws.id} ws={ws} active={activeWorkspace.id === ws.id}
                  role={ROLE_BADGE[userRoleInWs(ws)]} onSelect={() => { onSelect(ws); setOpen(false); }} />
              ))}
            </>
          )}
          {orgs.length > 0 && (
            <>
              <p className={cn("px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", personal.length > 0 ? "pt-3" : "pt-2")}>
                Organizations
              </p>
              {orgs.map((ws) => (
                <WorkspaceOption key={ws.id} ws={ws} active={activeWorkspace.id === ws.id}
                  role={ROLE_BADGE[userRoleInWs(ws)]} onSelect={() => { onSelect(ws); setOpen(false); }} />
              ))}
            </>
          )}
          <div className="border-t border-border mt-1 pt-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" /> New workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceOption({ ws, active, role, onSelect }: { ws: Workspace; active: boolean; role: string; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors", active && "bg-accent/60")}>
      <span className="h-7 w-7 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: `${ws.color}18` }}>
        {ws.icon}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-foreground font-medium truncate leading-snug">{ws.name}</p>
        <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{role}</p>
      </div>
      {active && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ws.color }} />}
    </button>
  );
}

// ─── Section divider label ────────────────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 mx-3 h-px bg-sidebar-border" />;
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {label}
    </p>
  );
}

// ─── Collapsible team section ─────────────────────────────────────────────────

function TeamSection({ team, role, collapsed, defaultOpen }: {
  team: { id: string; name: string; icon: string; color: string };
  role: "ADMIN" | "STANDARD";
  collapsed: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const navigate = useNavigate();
  const navItems = role === "ADMIN" ? TEAM_NAV_ADMIN : TEAM_NAV_STANDARD;
  const hasSubItems = navItems.length > 0;

  // Collapsed: always just navigate to team root
  if (collapsed) {
    return (
      <button onClick={() => navigate(`/team/${team.id}`)} title={team.name}
        className="w-full flex items-center justify-center py-2 rounded-md hover:bg-sidebar-accent transition-colors">
        <span className="text-sm">{team.icon}</span>
      </button>
    );
  }

  // Standard member — no sub-items, row is a plain NavLink
  if (!hasSubItems) {
    return (
      <NavLink to={`/team/${team.id}`}
        className={({ isActive }) => cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary font-medium"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}>
        <span className="text-sm leading-none">{team.icon}</span>
        <span className="flex-1 text-left truncate">{team.name}</span>
      </NavLink>
    );
  }

  // Admin — accordion with sub-nav
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
      >
        <span className="text-sm leading-none">{team.icon}</span>
        <span className="flex-1 text-left text-sm text-sidebar-foreground font-medium truncate">{team.name}</span>
        {role === "ADMIN" && (
          <span className="text-[9px] font-bold px-1 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
            style={{ backgroundColor: `${team.color}20`, color: team.color }}>
            Admin
          </span>
        )}
        {open
          ? <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {navItems.map((item) => (
            <NavLink
              key={item.subpath}
              to={`/team/${team.id}${item.subpath}`}
              end
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-muted-foreground")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Active session timer widget ──────────────────────────────────────────────

function TimerWidget({ collapsed, session, seconds, running, onPause, onResume, onStop }: {
  collapsed: boolean;
  session: { taskTitle: string; projectColor: string; projectName?: string };
  seconds: number;
  running: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border px-1 py-3 flex flex-col items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: session.projectColor }} />
          {running && <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: session.projectColor }} />}
        </div>
        <span className="text-[10px] font-mono tabular-nums text-muted-foreground leading-none">{formatDuration(seconds)}</span>
        <button onClick={running ? onPause : onResume}
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors">
          {running ? <Pause className="h-3 w-3 text-muted-foreground" /> : <Play className="h-3 w-3 text-muted-foreground" />}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border px-3 py-2.5">
      {/* Task name row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: session.projectColor }} />
          {running && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-50"
              style={{ backgroundColor: session.projectColor }} />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate flex-1 leading-none">{session.taskTitle}</p>
      </div>

      {/* Timer row */}
      <div className="flex items-center justify-between pl-3.5">
        <span className="text-sm font-mono font-semibold tabular-nums text-foreground tracking-wide">
          {formatDuration(seconds)}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={running ? onPause : onResume}
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors"
            title={running ? "Pause" : "Resume"}>
            {running
              ? <Pause className="h-3 w-3 text-muted-foreground" />
              : <Play className="h-3 w-3 text-muted-foreground" />}
          </button>
          <button onClick={onStop}
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors"
            title="Stop">
            <Square className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clock-in/out widget ──────────────────────────────────────────────────────

function ClockWidget({ collapsed, clockedIn, clockInTime, onClockIn, onClockOut }: {
  collapsed: boolean;
  clockedIn: boolean;
  clockInTime: Date | null;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border px-1.5 py-2 flex justify-center">
        <button
          onClick={clockedIn ? onClockOut : onClockIn}
          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent"
          title={clockedIn ? "Clock out" : "Clock in"}
        >
          {clockedIn
            ? <LogOut className="h-3.5 w-3.5 text-chart-2" />
            : <LogIn className="h-3.5 w-3.5 text-amber-400" />}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border px-2 py-2">
      {clockedIn ? (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: "rgba(152,195,121,0.07)", border: "1px solid rgba(152,195,121,0.15)" }}>
          <div className="relative flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
            <div className="absolute inset-0 rounded-full animate-ping opacity-50 bg-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-chart-2 leading-none">Clocked in</p>
            {clockInTime && (
              <p className="text-[11px] text-muted-foreground mt-0.5">since {formatClockInTime(clockInTime)}</p>
            )}
          </div>
          <button onClick={onClockOut}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <LogOut className="h-3 w-3" /> Out
          </button>
        </div>
      ) : (
        <button onClick={onClockIn}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: "rgba(229,192,123,0.1)", border: "1px solid rgba(229,192,123,0.2)", color: "#e5c07b" }}>
          <LogIn className="h-3.5 w-3.5" />
          Clock In
        </button>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const {
    activeWorkspace, setActiveWorkspace, workspaceRole, myTeams,
    settings, clockedIn, clockInTime, clockIn, clockOut,
    activeSession, sessionSeconds, sessionRunning, pauseSession, resumeSession, stopSession,
    settingsSection, setSettingsSection,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const isSettingsPage = location.pathname === "/settings";
  const isOrg = activeWorkspace.type === "ORGANIZATION";
  const isOrgAdmin = isOrg && (workspaceRole === "ADMIN" || workspaceRole === "OWNER");
  const canSeeBilling = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isDailyMode = settings.timeTrackingMode === "daily";

  // Filter billing from settings nav if not eligible
  const isTeamAdmin = myTeams.some((mt) => mt.role === "ADMIN");
  const visibleSettingsNav = SETTINGS_NAV.filter((s) => {
    if (s.ownerOnly) return canSeeBilling;
    if (s.teamOnly) return isTeamAdmin;
    return true;
  });

  return (
    <aside className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out relative flex-shrink-0",
      collapsed ? "w-[56px]" : "w-[220px]"
    )}>

      {/* ── Workspace switcher ── */}
      <div className="border-b border-sidebar-border">
        <WorkspaceSwitcher activeWorkspace={activeWorkspace} onSelect={setActiveWorkspace} collapsed={collapsed} />
      </div>

      {/* ── Nav area ── */}
      <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">

        {/* ─── SETTINGS MODE ─── */}
        {isSettingsPage ? (
          <>
            {/* Back to app */}
            <button
              onClick={() => navigate("/")}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors mb-1",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Back to app" : undefined}
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Back to app</span>}
            </button>

            {!collapsed && <div className="mx-1 h-px bg-sidebar-border mb-2" />}

            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Settings
              </p>
            )}

            {visibleSettingsNav.map((s) => (
              <button
                key={s.id}
                onClick={() => setSettingsSection(s.id)}
                title={collapsed ? s.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                  collapsed && "justify-center px-0",
                  settingsSection === s.id
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <s.icon className={cn("h-4 w-4 flex-shrink-0", settingsSection === s.id ? "text-sidebar-primary" : "text-muted-foreground")} />
                {!collapsed && <span>{s.label}</span>}
              </button>
            ))}
          </>
        ) : (
          /* ─── NORMAL MODE ─── */
          <>
            {MAIN_NAV.map((item, i) => {
              if (item === null) {
                return collapsed ? null : <div key={`sep-${i}`} className="my-1 mx-1 h-px bg-sidebar-border" />;
              }
              return (
                <NavLink key={item.path} to={item.path} end={item.exact} title={collapsed ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}>
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-muted-foreground")} />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Teams section */}
            {isOrg && myTeams.length > 0 && (
              <>
                <SectionLabel label="Teams" collapsed={collapsed} />
                {myTeams.map((mt, i) => (
                  <TeamSection key={mt.team.id} team={mt.team} role={mt.role} collapsed={collapsed} defaultOpen={i === 0} />
                ))}
              </>
            )}

            {/* Org admin section */}
            {isOrgAdmin && (
              <>
                <SectionLabel label="Organization" collapsed={collapsed} />
                {ORG_NAV.map((item) => (
                  <NavLink
                    key={item.subpath}
                    to={`/org${item.subpath}`}
                    end
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                      collapsed && "justify-center px-0",
                      isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-muted-foreground")} />
                        {!collapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* ── Active session timer ── */}
      {activeSession && (
        <TimerWidget
          collapsed={collapsed}
          session={activeSession}
          seconds={sessionSeconds}
          running={sessionRunning}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={stopSession}
        />
      )}

      {/* ── Clock-in/out (daily mode only) ── */}
      {isDailyMode && (
        <ClockWidget
          collapsed={collapsed}
          clockedIn={clockedIn}
          clockInTime={clockInTime}
          onClockIn={clockIn}
          onClockOut={clockOut}
        />
      )}

      {/* ── Bottom bar ── */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "px-3 py-2.5")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: "#61afef20", color: "#61afef" }}>
              AC
            </div>
            <NavLink to="/settings"
              className={({ isActive }) => cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                isActive ? "text-sidebar-primary bg-sidebar-accent" : "text-muted-foreground hover:bg-sidebar-accent"
              )} title="Settings">
              <Settings className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: "#61afef20", color: "#61afef" }}>
                AC
              </div>
              {isDailyMode && (
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar"
                  style={{ backgroundColor: clockedIn ? "#98c379" : "#e5c07b" }} />
              )}
            </div>
            <span className="flex-1 text-sm text-sidebar-foreground font-medium truncate">Alex Chen</span>
            <NavLink to="/settings"
              className={({ isActive }) => cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0",
                isActive ? "text-sidebar-primary bg-sidebar-accent" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )} title="Settings">
              <Settings className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10 shadow-sm"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3 text-muted-foreground" />
          : <ChevronLeft className="h-3 w-3 text-muted-foreground" />}
      </button>
    </aside>
  );
}