import { useState } from "react";
import { User, Users, Building2, Banknote, ChevronDown, Layers } from "lucide-react";
import { cn } from "../ui/utils";
import { useApp } from "../../context/AppContext";
import { PersonalStatsSection } from "./PersonalStatsSection";
import { TeamStatsSection } from "./TeamStatsSection";
import { DepartmentStatsSection } from "./DepartmentStatsSection";
import { OrgStatsSection } from "./OrgStatsSection";
import { PayrollSection } from "../settings/workspace-admin/PayrollSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightsTab = "personal" | "team" | "department" | "org" | "payroll";

export type Timeframe =
  | "this_week"
  | "this_month"
  | "last_3months"
  | "last_6months"
  | "this_year";

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  this_week:    "This week",
  this_month:   "This month",
  last_3months: "Last 3 months",
  last_6months: "Last 6 months",
  this_year:    "This year",
};

const TAB_DESCRIPTIONS: Record<InsightsTab, string> = {
  personal:   "Your productivity metrics, ML-powered patterns, and activity insights.",
  team:       "Team health, velocity trends, and your contribution — not a scoreboard.",
  department: "Cross-team patterns, collaboration, and department-level health.",
  org:        "Organisation-wide throughput, project portfolio, and milestones.",
  payroll:    "Compensation rates, hours worked, and pay period earnings.",
};

// ─── Timeframe selector ───────────────────────────────────────────────────────

function TimeframeSelector({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-accent transition-colors"
      >
        {TIMEFRAME_LABELS[value]}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-20">
          {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => { onChange(tf); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm transition-colors",
                value === tf
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StatsPage() {
  const { workspaceRole, myTeams, activeWorkspace, wsPermissions } = useApp();
  const [timeframe, setTimeframe] = useState<Timeframe>("this_week");

  const isOrgAdmin  = workspaceRole === "OWNER" || workspaceRole === "ADMIN";
  const isTeamAdmin = myTeams.some((mt) => mt.role === "ADMIN");
  const isOrg       = activeWorkspace.type === "ORGANIZATION";

  const canSeeTeam    = isOrg && (isOrgAdmin || isTeamAdmin);
  const canSeeDept    = isOrg && isOrgAdmin;
  const canSeeOrg     = isOrg && isOrgAdmin;
  const canSeePayroll = canSeeOrg && wsPermissions.trackCompensation;

  const tabs: { id: InsightsTab; label: string; icon: typeof User }[] = [
    { id: "personal",   label: "Personal",     icon: User      },
    ...(canSeeTeam ? [{ id: "team"       as const, label: "Team",         icon: Users     }] : []),
    ...(canSeeDept ? [{ id: "department" as const, label: "Department",   icon: Layers    }] : []),
    ...(canSeeOrg  ? [{ id: "org"        as const, label: "Organisation", icon: Building2 }] : []),
    ...(canSeePayroll ? [{ id: "payroll" as const, label: "Payroll",      icon: Banknote  }] : []),
  ];

  const [activeTab, setActiveTab] = useState<InsightsTab>("personal");
  const validTab = tabs.some((t) => t.id === activeTab) ? activeTab : "personal";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-foreground">Insights</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {TAB_DESCRIPTIONS[validTab]}
            </p>
          </div>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto mt-4 mb-6">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-max min-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  validTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {validTab === "personal"   && <PersonalStatsSection    timeframe={timeframe} />}
        {validTab === "team"       && <TeamStatsSection        timeframe={timeframe} />}
        {validTab === "department" && <DepartmentStatsSection  timeframe={timeframe} />}
        {validTab === "org"        && <OrgStatsSection         timeframe={timeframe} />}
        {validTab === "payroll"    && <PayrollSection />}
      </div>
    </div>
  );
}
