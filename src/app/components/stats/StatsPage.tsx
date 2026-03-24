import { useState } from "react";
import { BarChart2, Users, Building2, Banknote } from "lucide-react";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import { ReportsPage } from "../ReportsPage";
import { TeamInsightsSection } from "./TeamInsightsSection";
import { OrgStatsSection } from "./OrgStatsSection";
import { PayrollSection } from "../settings/workspace-admin/PayrollSection";

// ─── Tab definitions ─────────────────────────────────────────────────────────

type StatsTab = "overview" | "team" | "org" | "payroll";

// ─── Component ───────────────────────────────────────────────────────────────

export function StatsPage() {
  const { workspaceRole, myTeams, activeWorkspace, wsPermissions } = useApp();
  const isOrgAdmin = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isOrg = activeWorkspace.type === "ORGANIZATION";
  const hasTeams = myTeams.length > 0;

  const [activeTab, setActiveTab] = useState<StatsTab>("overview");

  // Build visible tabs
  const tabs: { id: StatsTab; label: string; icon: typeof BarChart2 }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
  ];
  if (isOrg && hasTeams) {
    tabs.push({ id: "team", label: "Team Insights", icon: Users });
  }
  if (isOrg && isOrgAdmin) {
    tabs.push({ id: "org", label: "Organization", icon: Building2 });
    if (wsPermissions.trackCompensation) {
      tabs.push({ id: "payroll", label: "Payroll", icon: Banknote });
    }
  }

  // Auto-correct if current tab becomes invisible
  if (!tabs.some((t) => t.id === activeTab)) {
    setActiveTab("overview");
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Stats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "overview" && "Your productivity snapshot — tracked time, tasks, and focus patterns."}
            {activeTab === "team" && "Team performance, workload distribution, and velocity trends."}
            {activeTab === "org" && "Organization-wide metrics, team comparisons, and project health."}
            {activeTab === "payroll" && "Compensation rates, hours worked, and pay period earnings."}
          </p>
        </div>

        {/* Tab bar */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {activeTab === "overview" && <ReportsPage embedded />}
        {activeTab === "team" && <TeamInsightsSection />}
        {activeTab === "org" && <OrgStatsSection />}
        {activeTab === "payroll" && <PayrollSection />}
      </div>
    </div>
  );
}
