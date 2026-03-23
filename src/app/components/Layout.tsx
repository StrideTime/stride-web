import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { AppProvider } from "../context/AppContext";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AppProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}
