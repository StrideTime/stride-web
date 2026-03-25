import { useState } from "react";
import { ChevronRight, Building2, User, Plus, ArrowRight, Check } from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import { WORKSPACES, WORKSPACE_MEMBERSHIPS } from "../../../data/mockData";

// ─── Component ───────────────────────────────────────────────────────────────

export function PersonalBillingSection() {
  const { activeWorkspace } = useApp();
  const [activeTab, setActiveTab] = useState<"personal" | "organization">(
    activeWorkspace.type === "ORGANIZATION" ? "organization" : "personal"
  );

  const isOrg = activeWorkspace.type === "ORGANIZATION";
  const isOrgAdmin = (() => {
    const m = WORKSPACE_MEMBERSHIPS.find((wm) => wm.workspaceId === activeWorkspace.id && wm.userId === "u1");
    return m?.role === "OWNER" || m?.role === "ADMIN";
  })();

  // All orgs the user admins
  const adminOrgs = WORKSPACES.filter((ws) => {
    if (ws.type !== "ORGANIZATION") return false;
    const m = WORKSPACE_MEMBERSHIPS.find((wm) => wm.workspaceId === ws.id && wm.userId === "u1");
    return m?.role === "OWNER" || m?.role === "ADMIN";
  });

  const hasAnyOrg = WORKSPACES.some((ws) =>
    ws.type === "ORGANIZATION" && WORKSPACE_MEMBERSHIPS.some((m) => m.workspaceId === ws.id && m.userId === "u1")
  );

  return (
    <div className="space-y-5">
      {/* Tab switcher — only show when viewing an org */}
      {isOrg && isOrgAdmin && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button onClick={() => setActiveTab("personal")}
            className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "personal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <User className="h-3.5 w-3.5" /> Personal Plan
          </button>
          <button onClick={() => setActiveTab("organization")}
            className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "organization" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Building2 className="h-3.5 w-3.5" /> Organization Plan
          </button>
        </div>
      )}

      {/* ── Personal plan ── */}
      {activeTab === "personal" && (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Personal plan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your individual Stride account</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary">Active</span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-foreground">Pro &middot; $12/mo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Renews Apr 15, 2025</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-foreground">Payment method</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Visa ending 4242</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity">
                  Update <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Organization links */}
          {(adminOrgs.length > 0 || !hasAnyOrg) && (
            <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">Organization plans</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Organizations are billed separately from your personal plan.
                    {isOrg && isOrgAdmin && " Switch to the Organization Plan tab above to manage it."}
                  </p>
                  {adminOrgs.length > 0 && !isOrg && (
                    <div className="flex flex-col gap-1 mt-2.5">
                      {adminOrgs.map((ws) => (
                        <span key={ws.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="h-4 w-4 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${ws.color}20` }}>
                            <ws.Icon className="h-2.5 w-2.5" style={{ color: ws.color }} />
                          </span>
                          {ws.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <button className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors mt-2.5 group">
                    <span className="h-4 w-4 rounded flex items-center justify-center bg-primary/10">
                      <Plus className="h-2.5 w-2.5" />
                    </span>
                    <span>{hasAnyOrg ? "Create another organization" : "Create an organization"}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Organization plan ── */}
      {activeTab === "organization" && isOrg && isOrgAdmin && (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <activeWorkspace.Icon className="h-3.5 w-3.5" style={{ color: activeWorkspace.color }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{activeWorkspace.name}</h2>
                <p className="text-xs text-muted-foreground">Business &middot; 13 seats</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Active</span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-foreground">Business &middot; $18/seat/mo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">$234/mo &middot; Renews May 1, 2025</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-foreground">Seat usage</p>
                  <p className="text-xs text-muted-foreground mt-0.5">13 of 20 seats used</p>
                </div>
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "65%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-foreground">Payment method</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Visa ending 8910</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity">
                  Update <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Personal plan callout */}
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">This is separate from your personal plan</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  This covers {activeWorkspace.name} and all its members. Your personal Stride account has its own plan.
                </p>
                <button
                  onClick={() => setActiveTab("personal")}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 group"
                >
                  View personal plan
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
