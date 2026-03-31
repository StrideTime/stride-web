import { useState, useMemo } from "react";
import {
  Banknote, ChevronDown, ChevronUp, Edit2, Check,
  DollarSign, AlertCircle, Clock, Users, CalendarDays,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import { USERS, TEAMS, TEAM_MEMBERS } from "../../../data/mockData";
import type { PayType } from "./InviteMemberModal";

// ─── Mock data ───────────────────────────────────────────────────────────────

interface MemberPayroll {
  userId: string;
  payType: PayType;
  rate: string;
  hoursThisPeriod: number;
  expectedHours: number;
  overtimeHours: number;
  overtimeRate: number;
  periodEarnings: number;
  overtimeEarnings: number;
  history: number[];
}

const MOCK_PAYROLL: MemberPayroll[] = [
  { userId: "u1", payType: "SALARY",  rate: "",    hoursThisPeriod: 86, expectedHours: 80, overtimeHours: 6,  overtimeRate: 1.5, periodEarnings: 4166.67, overtimeEarnings: 0,      history: [76, 78, 80, 76, 88, 80, 86] },
  { userId: "u2", payType: "HOURLY",  rate: "55",  hoursThisPeriod: 64, expectedHours: 80, overtimeHours: 0,  overtimeRate: 1.5, periodEarnings: 3520.00, overtimeEarnings: 0,      history: [70, 72, 76, 68, 80, 76, 64] },
  { userId: "u3", payType: "SALARY",  rate: "",    hoursThisPeriod: 82, expectedHours: 80, overtimeHours: 2,  overtimeRate: 1.5, periodEarnings: 3750.00, overtimeEarnings: 0,      history: [79, 80, 84, 78, 80, 82, 82] },
  { userId: "u4", payType: "HOURLY",  rate: "45",  hoursThisPeriod: 92, expectedHours: 80, overtimeHours: 12, overtimeRate: 1.5, periodEarnings: 3600.00, overtimeEarnings: 810.00, history: [70, 74, 72, 85, 90, 88, 92] },
  { userId: "u5", payType: "HOURLY",  rate: "40",  hoursThisPeriod: 58, expectedHours: 80, overtimeHours: 0,  overtimeRate: 1.5, periodEarnings: 2320.00, overtimeEarnings: 0,      history: [62, 60, 64, 56, 62, 60, 58] },
];

function getPeriodLabels(frequency: string): string[] {
  if (frequency === "weekly") return ["Feb 3", "Feb 10", "Feb 17", "Feb 24", "Mar 3", "Mar 10", "Mar 17"];
  if (frequency === "biweekly") return ["Dec 30", "Jan 13", "Jan 27", "Feb 10", "Feb 24", "Mar 10", "Mar 24"];
  if (frequency === "semimonthly") return ["Nov 15", "Dec 1", "Dec 15", "Jan 1", "Jan 15", "Feb 1", "Feb 15"];
  return ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
}

/** All selectable pay periods for a given frequency (most recent first, index 0 = current). */
function getPeriodOptions(frequency: string): string[] {
  if (frequency === "weekly") return [
    "Mar 17 – Mar 23", "Mar 10 – Mar 16", "Mar 3 – Mar 9",
    "Feb 24 – Mar 2",  "Feb 17 – Feb 23", "Feb 10 – Feb 16", "Feb 3 – Feb 9",
  ];
  if (frequency === "biweekly") return [
    "Mar 10 – Mar 23", "Feb 24 – Mar 9",  "Feb 10 – Feb 23",
    "Jan 27 – Feb 9",  "Jan 13 – Jan 26", "Dec 30 – Jan 12", "Dec 16 – Dec 29",
  ];
  if (frequency === "semimonthly") return [
    "Mar 1 – Mar 15",  "Feb 16 – Feb 28", "Feb 1 – Feb 15",
    "Jan 16 – Jan 31", "Jan 1 – Jan 15",  "Dec 16 – Dec 31", "Dec 1 – Dec 15",
  ];
  return ["Mar 2026", "Feb 2026", "Jan 2026", "Dec 2025", "Nov 2025", "Oct 2025", "Sep 2025"];
}

/** Return hours/earnings for a member for the given period offset (0 = current). */
function getMemberPeriodData(mp: MemberPayroll, offset: number) {
  if (offset === 0) {
    return {
      hours: mp.hoursThisPeriod,
      overtimeHours: mp.overtimeHours,
      earnings: mp.periodEarnings,
      overtimeEarnings: mp.overtimeEarnings,
    };
  }
  const histIdx = mp.history.length - 1 - offset;
  const hours = histIdx >= 0 ? (mp.history[histIdx] ?? 0) : 0;
  const overtimeHours = Math.max(0, hours - mp.expectedHours);
  const regularHours = Math.min(hours, mp.expectedHours);
  const hourlyRate = parseFloat(mp.rate) || 0;
  const earnings = mp.payType === "HOURLY"
    ? regularHours * hourlyRate
    : mp.periodEarnings; // salary is flat each period
  const overtimeEarnings = mp.payType === "HOURLY" && overtimeHours > 0
    ? overtimeHours * hourlyRate * mp.overtimeRate
    : 0;
  return { hours, overtimeHours, earnings, overtimeEarnings };
}

// ─── Chart tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
          <span className="text-muted-foreground">{p.name ?? p.dataKey}:</span>
          <span className="text-foreground font-medium">{typeof p.value === "number" ? `${p.value.toFixed(1)}h` : `${p.value}h`}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PayrollSection() {
  const { wsPermissions, allWorkspaceTeams } = useApp();
  const [payroll, setPayroll] = useState(MOCK_PAYROLL);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<string>("all"); // "all" or team id
  const [payTypeFilter, setPayTypeFilter] = useState<"all" | "hourly" | "salary">("all");
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, 1 = previous, etc.

  const periodOptions = getPeriodOptions(wsPermissions.payFrequency);
  const periodLabel = periodOptions[periodOffset] ?? periodOptions[0];
  const isCurrentPeriod = periodOffset === 0;

  // Filter members by team + pay type
  const filteredPayroll = useMemo(() => {
    let result = payroll;
    if (viewFilter !== "all") {
      const teamMemberIds = TEAM_MEMBERS.filter((tm) => tm.teamId === viewFilter).map((tm) => tm.userId);
      result = result.filter((mp) => teamMemberIds.includes(mp.userId));
    }
    if (payTypeFilter === "hourly")  result = result.filter((mp) => mp.payType === "HOURLY");
    if (payTypeFilter === "salary")  result = result.filter((mp) => mp.payType === "SALARY");
    return result;
  }, [payroll, viewFilter, payTypeFilter]);

  // Totals computed for the selected period
  const totalHours = filteredPayroll.reduce((s, m) => s + getMemberPeriodData(m, periodOffset).hours, 0);
  const totalExpected = filteredPayroll.reduce((s, m) => s + m.expectedHours, 0);
  const totalOT = filteredPayroll.reduce((s, m) => s + getMemberPeriodData(m, periodOffset).overtimeHours, 0);
  const totalEarnings = filteredPayroll.reduce((s, m) => {
    const d = getMemberPeriodData(m, periodOffset);
    return s + d.earnings + d.overtimeEarnings;
  }, 0);
  const totalOTEarnings = filteredPayroll.reduce((s, m) => s + getMemberPeriodData(m, periodOffset).overtimeEarnings, 0);

  // Team averages for the overview chart
  const labels = getPeriodLabels(wsPermissions.payFrequency);
  const teamChartData = useMemo(() => {
    return labels.map((label, periodIdx) => {
      const row: Record<string, any> = { period: label };
      allWorkspaceTeams.forEach((team) => {
        const memberIds = TEAM_MEMBERS.filter((tm) => tm.teamId === team.id).map((tm) => tm.userId);
        const teamMembers = payroll.filter((mp) => memberIds.includes(mp.userId));
        if (teamMembers.length > 0) {
          const avgHours = teamMembers.reduce((s, mp) => s + (mp.history[periodIdx] ?? 0), 0) / teamMembers.length;
          row[team.id] = Math.round(avgHours * 10) / 10;
        }
      });
      return row;
    });
  }, [payroll, allWorkspaceTeams, labels]);

  // Team summary stats
  const teamStats = useMemo(() => {
    return allWorkspaceTeams.map((team) => {
      const memberIds = TEAM_MEMBERS.filter((tm) => tm.teamId === team.id).map((tm) => tm.userId);
      const members = payroll.filter((mp) => memberIds.includes(mp.userId));
      const hours = members.reduce((s, m) => s + m.hoursThisPeriod, 0);
      const expected = members.reduce((s, m) => s + m.expectedHours, 0);
      const ot = members.reduce((s, m) => s + m.overtimeHours, 0);
      const earnings = members.reduce((s, m) => s + m.periodEarnings + m.overtimeEarnings, 0);
      const avg = members.length > 0 ? Math.round(hours / members.length) : 0;
      return { team, members: members.length, hours, expected, ot, earnings, avg };
    }).filter((ts) => ts.members > 0);
  }, [payroll, allWorkspaceTeams]);

  function updateMemberPay(userId: string, updates: Partial<MemberPayroll>) {
    setPayroll((prev) => prev.map((m) => m.userId === userId ? { ...m, ...updates } : m));
  }

  if (!wsPermissions.trackCompensation) {
    return (
      <div className="text-center py-16">
        <Banknote className="h-10 w-10 mx-auto text-muted-foreground/20 mb-4" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Compensation tracking is disabled</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Enable "Track compensation" in General settings to view and manage member pay rates and hours worked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Team filter */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
            <button onClick={() => setViewFilter("all")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                viewFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              All teams
            </button>
            {allWorkspaceTeams.map((team) => (
              <button key={team.id} onClick={() => setViewFilter(team.id)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  viewFilter === team.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <team.Icon className="h-3 w-3" style={{ color: team.color }} />
                {team.name}
              </button>
            ))}
          </div>

          {/* Pay type filter */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {(["all", "hourly", "salary"] as const).map((pt) => (
              <button
                key={pt}
                onClick={() => setPayTypeFilter(pt)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap capitalize",
                  payTypeFilter === pt ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {pt === "all" ? "All pay types" : pt === "hourly" ? "Hourly" : "Salary"}
              </button>
            ))}
          </div>
        </div>

        {/* Pay period dropdown */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <div className="relative">
            <select
              value={periodOffset}
              onChange={(e) => {
                setPeriodOffset(Number(e.target.value));
                setEditingId(null);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              {periodOptions.map((label, i) => (
                <option key={i} value={i}>
                  {label}{i === 0 ? " (Current)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Current period", value: periodLabel, sub: wsPermissions.payFrequency.replace("biweekly", "Bi-weekly").replace("semimonthly", "Semi-monthly").replace("weekly", "Weekly").replace("monthly", "Monthly") },
          { label: "Hours", value: `${totalHours}/${totalExpected}h`, sub: totalExpected > 0 ? `${Math.round((totalHours / totalExpected) * 100)}% of expected` : "No data" },
          { label: "Overtime", value: `${totalOT}h`, sub: totalOTEarnings > 0 ? `+$${totalOTEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "No overtime pay" },
          { label: "Total payroll", value: `$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: `${filteredPayroll.length} members` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Team overview chart — only on "all" view */}
      {viewFilter === "all" && teamStats.length > 1 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Average hours by team</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {teamStats.map((ts) => (
                <div key={ts.team.id} className="flex items-center gap-1">
                  <div className="h-2 w-5 rounded-sm" style={{ backgroundColor: `${ts.team.color}90` }} />
                  {ts.team.name}
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={teamChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={80} stroke="var(--muted-foreground)" strokeDasharray="4 3" strokeOpacity={0.3} />
                {teamStats.map((ts) => (
                  <Area key={ts.team.id} type="monotone" dataKey={ts.team.id} name={ts.team.name}
                    stroke={ts.team.color} fill={`${ts.team.color}15`} strokeWidth={2}
                    dot={{ r: 2.5, fill: ts.team.color, strokeWidth: 1.5, stroke: "var(--card)" }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Team summary row */}
          <div className="px-5 pb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${teamStats.length}, 1fr)` }}>
            {teamStats.map((ts) => (
              <button key={ts.team.id} onClick={() => setViewFilter(ts.team.id)}
                className="bg-muted/30 rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <ts.team.Icon className="h-3 w-3" style={{ color: ts.team.color }} />
                  <span className="text-xs font-medium text-foreground">{ts.team.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg hours</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{ts.avg}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{ts.members}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Overtime</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{ts.ot}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Payroll</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">${(ts.earnings / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {viewFilter === "all" ? "Member compensation" : (() => {
                const team = allWorkspaceTeams.find((t) => t.id === viewFilter);
                return team ? `${team.name} compensation` : "Member compensation";
              })()}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentPeriod && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Past period</span>
            )}
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredPayroll.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">No members in this team have payroll data.</p>
            </div>
          ) : filteredPayroll.map((mp) => {
            const user = USERS.find((u) => u.id === mp.userId);
            if (!user) return null;
            const isEditing = editingId === mp.userId;
            const isExpanded = expandedId === mp.userId;
            const pd = getMemberPeriodData(mp, periodOffset);
            const regularHours = pd.hours - pd.overtimeHours;
            const pct = Math.round((regularHours / mp.expectedHours) * 100);
            const otPct = mp.expectedHours > 0 ? Math.round((pd.overtimeHours / mp.expectedHours) * 100) : 0;
            const totalPay = pd.earnings + pd.overtimeEarnings;

            return (
              <div key={mp.userId}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : mp.userId)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                    {user.initials}
                  </div>

                  <div className="w-36 min-w-0 flex-shrink-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                        mp.payType === "HOURLY" ? "bg-chart-4/10 text-chart-4" : "bg-muted text-muted-foreground")}>
                        {mp.payType === "HOURLY" ? `$${mp.rate}/hr` : "Salary"}
                      </span>
                      {pd.overtimeHours > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-chart-4/10 text-chart-4 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {pd.overtimeHours}h OT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {mp.payType === "SALARY" ? (
                      /* Salary: just show running total, no expected comparison */
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground tabular-nums font-medium">{pd.hours}h logged</span>
                          {pd.overtimeHours > 0 && (
                            <span className="text-[10px] font-medium text-chart-4 tabular-nums">+{pd.overtimeHours}h OT</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: "100%" }} />
                        </div>
                      </>
                    ) : (
                      /* Hourly: show progress toward expected hours */
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground tabular-nums font-medium">
                            {pd.hours}h <span className="text-muted-foreground font-normal">/ {mp.expectedHours}h</span>
                          </span>
                          {pd.overtimeHours > 0 ? (
                            <span className="text-[10px] font-medium text-chart-4 tabular-nums">+{pd.overtimeHours}h OT</span>
                          ) : (
                            <span className={cn("text-[10px] font-medium tabular-nums",
                              pct >= 90 ? "text-chart-2" : pct >= 70 ? "text-chart-4" : "text-destructive")}>
                              {pct}%
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                          <div className={cn("h-full transition-all",
                            pct >= 90 ? "bg-chart-2" : pct >= 70 ? "bg-chart-4" : "bg-destructive")}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                          {otPct > 0 && (
                            <div className="h-full bg-chart-4 transition-all" style={{ width: `${Math.min(otPct, 30)}%` }} />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-right w-28 flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      ${totalPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {pd.overtimeEarnings > 0 && (
                      <p className="text-[10px] text-chart-4 tabular-nums">+${pd.overtimeEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })} OT</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-border bg-muted/10">
                    {(() => {
                      const chartData = mp.history.map((h, i) => ({ period: labels[i] ?? `P${i + 1}`, hours: h }));
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-foreground">Hours by pay period</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1"><div className="h-2 w-5 rounded-sm" style={{ backgroundColor: `${user.color}90` }} /> Worked</div>
                              <div className="flex items-center gap-1"><div className="h-px w-5 border-t border-dashed border-muted-foreground/40" /> Expected ({mp.expectedHours}h)</div>
                            </div>
                          </div>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="h" />
                                <Tooltip content={<ChartTooltip />} />
                                <ReferenceLine y={mp.expectedHours} stroke="var(--muted-foreground)" strokeDasharray="4 3" strokeOpacity={0.4} />
                                <Area type="monotone" dataKey="hours" name="Hours worked"
                                  stroke={user.color} fill={`${user.color}18`} strokeWidth={2}
                                  dot={{ r: 3, fill: user.color, strokeWidth: 2, stroke: "var(--card)" }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      );
                    })()}

                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {(() => {
                        const avg = Math.round(mp.history.reduce((a, b) => a + b, 0) / mp.history.length);
                        const max = Math.max(...mp.history);
                        const min = Math.min(...mp.history);
                        const otPeriods = mp.history.filter((h) => h > mp.expectedHours).length;
                        return [
                          { label: "Average", value: `${avg}h` },
                          { label: "Peak", value: `${max}h` },
                          { label: "Lowest", value: `${min}h` },
                          { label: "OT periods", value: `${otPeriods}/${mp.history.length}` },
                        ];
                      })().map((s) => (
                        <div key={s.label} className="bg-muted/30 rounded-lg px-3 py-2 text-center">
                          <p className="text-xs font-semibold text-foreground tabular-nums">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex gap-1">
                            {(["SALARY", "HOURLY"] as const).map((t) => (
                              <button key={t} onClick={() => updateMemberPay(mp.userId, { payType: t, rate: t === "SALARY" ? "" : mp.rate || "40" })}
                                className={cn("text-[10px] px-2 py-1 rounded-md font-medium transition-colors",
                                  mp.payType === t ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                                {t === "SALARY" ? "Salary" : "Hourly"}
                              </button>
                            ))}
                          </div>
                          {mp.payType === "HOURLY" && (
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                              <input value={mp.rate} onChange={(e) => updateMemberPay(mp.userId, { rate: e.target.value })}
                                className="w-full text-xs bg-muted border border-border rounded-md pl-5 pr-8 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">/hr</span>
                            </div>
                          )}
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">OT</span>
                            <input value={mp.overtimeRate} onChange={(e) => updateMemberPay(mp.userId, { overtimeRate: parseFloat(e.target.value) || 1.5 })}
                              className="w-full text-xs bg-muted border border-border rounded-md pl-7 pr-4 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">x</span>
                          </div>
                          <button onClick={() => setEditingId(null)}
                            className="text-[10px] px-2 py-1 rounded-md font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Done
                          </button>
                        </div>
                      ) : isCurrentPeriod ? (
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(mp.userId); }}
                          className="text-[10px] px-2 py-1 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1">
                          <Edit2 className="h-2.5 w-2.5" /> Edit compensation
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 italic">Read-only — past period</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{filteredPayroll.length} members</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground tabular-nums">{totalHours}/{totalExpected}h</span>
            {totalOT > 0 && <span className="text-xs text-chart-4 tabular-nums font-medium">{totalOT}h OT</span>}
            <span className="text-sm font-bold text-foreground tabular-nums">${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-foreground">Overtime &amp; pay period</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Hours exceeding the expected amount are flagged as overtime. For hourly members, overtime is calculated at the member's OT rate (default 1.5x).
            Adjust pay frequency in General &gt; Compensation settings.
          </p>
        </div>
      </div>
    </div>
  );
}
