import { ChevronRight, Building2, ArrowRight, Plus } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { WORKSPACES, WORKSPACE_MEMBERSHIPS } from "../../../data/mockData";

export function PersonalBillingSection() {
  const { setSettingsSection } = useApp();

  // Check if user is admin of any org workspace
  const adminOrgs = WORKSPACES.filter((ws) => {
    if (ws.type !== "ORGANIZATION") return false;
    const membership = WORKSPACE_MEMBERSHIPS.find((m) => m.workspaceId === ws.id && m.userId === "u1");
    return membership?.role === "OWNER" || membership?.role === "ADMIN";
  });

  const hasAnyOrg = WORKSPACES.some((ws) => {
    if (ws.type !== "ORGANIZATION") return false;
    return WORKSPACE_MEMBERSHIPS.some((m) => m.workspaceId === ws.id && m.userId === "u1");
  });

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Personal plan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Stride Pro</p>
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

      {/* ── Organization billing callout ── */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 mb-5">
        <div className="flex items-start gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">Organization plans are billed separately</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your personal plan covers your individual account. Each organization has its own plan and billing.
            </p>

            {/* Links to existing org billing */}
            {adminOrgs.length > 0 && (
              <div className="flex flex-col gap-1 mt-3">
                {adminOrgs.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setSettingsSection("ws-billing")}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors group"
                  >
                    <span className="h-4 w-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${ws.color}20` }}>
                      <ws.Icon className="h-2.5 w-2.5" style={{ color: ws.color }} />
                    </span>
                    <span>{ws.name} billing</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* Create org CTA */}
            <button className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors mt-3 group">
              <span className="h-4 w-4 rounded flex items-center justify-center bg-primary/10">
                <Plus className="h-2.5 w-2.5" />
              </span>
              <span>{hasAnyOrg ? "Create another organization" : "Create an organization"}</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
