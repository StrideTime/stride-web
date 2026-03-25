import { useState } from "react";
import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { AppProvider } from "../context/AppContext";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppProvider>
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
        </div>
      </div>
    </AppProvider>
  );
}
