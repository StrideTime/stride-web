import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Menu, ArrowRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { AppProvider } from "../context/AppContext";
import { useApp } from "../context/AppContext";
import { cn } from "./ui/utils";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SessionBar() {
  const { activeSession, sessionSeconds, sessionRunning } = useApp();
  const navigate = useNavigate();

  if (!activeSession) return null;

  return (
    <button
      onClick={() => navigate("/timer")}
      className="flex-shrink-0 border-t border-border bg-card px-5 py-3 flex items-center gap-3 hover:bg-accent/30 transition-colors w-full text-left group"
    >
      {/* Status label */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="relative">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <div className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-500" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Focusing</span>
      </div>

      <div className="w-px h-4 bg-border flex-shrink-0" />

      {/* Task + project */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{activeSession.taskTitle}</p>
      </div>

      {/* Project */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: activeSession.projectColor }} />
        <span className="text-xs text-muted-foreground">{activeSession.projectName}</span>
      </div>

      <div className="hidden sm:block w-px h-4 bg-border flex-shrink-0" />

      {/* Timer */}
      <span className="text-sm font-mono tabular-nums text-foreground font-medium flex-shrink-0">
        {formatDuration(sessionSeconds)}
      </span>

      {/* My Day cue */}
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0">
        Focus <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">Stride</span>
        </header>
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
        <SessionBar />
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
