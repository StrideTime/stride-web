// ─── Weekly Narrative ─────────────────────────────────────────────────────────

export const WEEKLY_NARRATIVE = {
  weekOf: "March 24, 2026",
  headline: "Your strongest sprint week in 6 months",
  summary:
    "You logged 38.5 hours across 14 tasks — your second-highest output since joining. Tuesday was exceptional: 6 completions before 2pm, including the auth migration that had been blocked for two weeks. Focus session quality was up 28% vs your 4-week average.",
  highlights: [
    "Completed the auth migration — 3 weeks of groundwork paid off on Tuesday",
    "Focus session quality up 28% — longest avg session since October",
    "Zero overdue tasks for the first time in 5 sprints",
  ],
  watchouts: [
    "Wednesday afternoon showed your typical energy dip — 3 sessions under 15 min",
    "2 chore tasks carried over again — consider front-loading them Monday morning",
  ],
  metrics: {
    hoursLogged: 38.5,
    tasksCompleted: 14,
    focusSessions: 11,
    avgSessionMins: 52,
    streakDays: 18,
    pointsEarned: 340,
  },
};

// ─── ML Insight Cards ─────────────────────────────────────────────────────────

export type InsightType = "pattern" | "achievement" | "warning" | "suggestion";
export type InsightTrend = "improving" | "worsening" | "stable";

export interface MLInsight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  metric: { label: string; value: string };
  confidence: number; // 0–1
  trend: InsightTrend;
  color: string;
}

export const ML_INSIGHTS: MLInsight[] = [
  {
    id: "peak-hours",
    type: "pattern",
    title: "Morning is your superpower",
    body: "You complete tasks 2.4× faster before noon. Afternoon sessions average 18 min before abandonment — morning sessions average 52 min.",
    metric: { label: "Avg morning session", value: "52 min" },
    confidence: 0.87,
    trend: "stable",
    color: "#61afef",
  },
  {
    id: "bug-strength",
    type: "achievement",
    title: "Bug fixes are your fastest work",
    body: "You resolve bugs 35% faster than your team average. Estimate accuracy on bugs is 89% — highest on the team for any task type.",
    metric: { label: "vs team avg", value: "−35% time" },
    confidence: 0.93,
    trend: "stable",
    color: "#98c379",
  },
  {
    id: "refactor-overrun",
    type: "warning",
    title: "Refactor tasks consistently run over",
    body: "Tasks tagged 'refactor' take you 40% longer than estimated. You've underestimated this category 9 of the last 11 times.",
    metric: { label: "Avg overrun", value: "+40%" },
    confidence: 0.91,
    trend: "worsening",
    color: "#e5c07b",
  },
  {
    id: "streak-record",
    type: "achievement",
    title: "Longest habit streak in 3 months",
    body: "18-day streak — your previous best this year was 12 days. You've hit your morning routine 100% this week and haven't missed a weekday.",
    metric: { label: "Current streak", value: "18 days" },
    confidence: 1.0,
    trend: "improving",
    color: "#e06c75",
  },
  {
    id: "tuesday-peak",
    type: "pattern",
    title: "Tuesdays are your best day",
    body: "Your average task completion on Tuesdays is 6.2 — 2.1 more than any other day. Output peaks in weeks where Monday has fewer than 2 meetings.",
    metric: { label: "Avg Tuesday tasks", value: "6.2" },
    confidence: 0.84,
    trend: "stable",
    color: "#c678dd",
  },
  {
    id: "meeting-impact",
    type: "warning",
    title: "3+ meeting days hurt afternoon output",
    body: "On days with 3 or more meetings, your task completion drops 52% and focus sessions average just 12 minutes. Consider clustering meetings.",
    metric: { label: "Output drop on meeting days", value: "−52%" },
    confidence: 0.88,
    trend: "stable",
    color: "#e5c07b",
  },
  {
    id: "sprint-momentum",
    type: "suggestion",
    title: "Front-load chores for cleaner finishes",
    body: "Chore tasks completed in the first 2 days of a sprint correlate with 40% fewer overdue tasks at sprint end. You tend to save them for Fridays.",
    metric: { label: "Overdue reduction", value: "−40%" },
    confidence: 0.79,
    trend: "stable",
    color: "#61afef",
  },
];

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementCategory = "productivity" | "consistency" | "quality" | "collaboration" | "milestone";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  metric: { value: string | number; label: string };
  icon: string;
  color: string;
  category: AchievementCategory;
  unlockedAt?: string; // undefined = locked
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Unlocked ────────────────────────────────────────────────────────────────
  {
    id: "sprint-finisher",
    title: "Sprint Finisher",
    description: "Closed 5 sprints with zero tasks rolled over. Clean finishes compound — each one makes the next easier to plan.",
    metric: { value: 5, label: "clean sprints" },
    icon: "CheckCheck",
    color: "#98c379",
    category: "productivity",
    unlockedAt: "Jan 2026",
  },
  {
    id: "on-fire",
    title: "On a Roll",
    description: "18-day active streak — your longest this year. Previous best was 12 days. Consistency at this level is a real differentiator.",
    metric: { value: 18, label: "day streak" },
    icon: "Flame",
    color: "#e06c75",
    category: "consistency",
    unlockedAt: "Mar 2026",
  },
  {
    id: "deep-focus",
    title: "Deep Focus",
    description: "Averaged 52-minute focus sessions this month — 18 minutes above team average. You've built a habit of uninterrupted work time that shows in your output.",
    metric: { value: 52, label: "min avg session" },
    icon: "BrainCircuit",
    color: "#61afef",
    category: "productivity",
    unlockedAt: "Mar 2026",
  },
  {
    id: "fast-fixer",
    title: "Fast Fixer",
    description: "Resolving bugs 35% faster than team average with 89% estimate accuracy — the highest on the team for any task type. You've made bug work your most predictable skill.",
    metric: { value: "−35%", label: "vs team fix time" },
    icon: "Bug",
    color: "#e06c75",
    category: "quality",
    unlockedAt: "Feb 2026",
  },
  {
    id: "reviewer",
    title: "Good Reviewer",
    description: "Reviewed 34 pull requests this quarter with an average turnaround under 4 hours. Your reviews are thorough — teammates consistently cite them as actionable.",
    metric: { value: 34, label: "PRs reviewed" },
    icon: "GitPullRequest",
    color: "#c678dd",
    category: "collaboration",
    unlockedAt: "Mar 2026",
  },
  // ── In Progress ─────────────────────────────────────────────────────────────
  {
    id: "velocity-peak",
    title: "Velocity Peak",
    description: "Finish a sprint ranked #1 on sprint velocity for your team to unlock this. You've hit #2 two sprints in a row — a strong sprint could close the gap.",
    metric: { value: "#2", label: "current rank" },
    icon: "Zap",
    color: "#e5c07b",
    category: "milestone",
  },
  {
    id: "review-50",
    title: "Review Champion",
    description: "Review 50 pull requests to unlock. You're at 34 — at your current pace you'll hit this by mid-April.",
    metric: { value: "34/50", label: "PRs reviewed" },
    icon: "GitPullRequestArrow",
    color: "#c678dd",
    category: "collaboration",
  },
  {
    id: "early-deliver",
    title: "Early Deliver",
    description: "Deliver 10 tasks before their committed deadline to unlock. You're at 7 — strong candidate for this by end of sprint.",
    metric: { value: "7/10", label: "early deliveries" },
    icon: "CalendarCheck",
    color: "#98c379",
    category: "quality",
  },
  {
    id: "estimate-ace",
    title: "Estimate Ace",
    description: "Hit your time estimate on 20 consecutive tasks. Your current accuracy across all types is 74% — sharpen your bug and feature estimates to push higher.",
    metric: { value: "74%", label: "estimate accuracy" },
    icon: "Crosshair",
    color: "#61afef",
    category: "quality",
  },
  {
    id: "10k-club",
    title: "10K Club",
    description: "Complete 10,000 tasks over your career. You're at 1,240 — keep shipping and you'll get there.",
    metric: { value: "1.2k", label: "/ 10k tasks" },
    icon: "Trophy",
    color: "#e5c07b",
    category: "milestone",
  },
];

// ─── Productivity Fingerprint ─────────────────────────────────────────────────

// [dayIndex (0=Mon), hourIndex (0=8am), score (0–100)]
export const PEAK_HOUR_DATA: [number, number, number][] = [
  [0,0,65],[0,1,88],[0,2,92],[0,3,85],[0,4,45],[0,5,38],[0,6,62],[0,7,55],[0,8,48],[0,9,35],
  [1,0,72],[1,1,95],[1,2,98],[1,3,91],[1,4,52],[1,5,44],[1,6,70],[1,7,65],[1,8,58],[1,9,42],
  [2,0,68],[2,1,90],[2,2,94],[2,3,88],[2,4,48],[2,5,41],[2,6,55],[2,7,45],[2,8,38],[2,9,28],
  [3,0,60],[3,1,82],[3,2,88],[3,3,80],[3,4,44],[3,5,38],[3,6,58],[3,7,50],[3,8,44],[3,9,32],
  [4,0,55],[4,1,75],[4,2,82],[4,3,78],[4,4,42],[4,5,35],[4,6,52],[4,7,44],[4,8,38],[4,9,25],
  [5,0,30],[5,1,42],[5,2,45],[5,3,38],[5,4,22],[5,5,18],[5,6,28],[5,7,22],[5,8,18],[5,9,12],
  [6,0,12],[6,1,18],[6,2,20],[6,3,16],[6,4,10],[6,5,8], [6,6,12],[6,7,10],[6,8,7], [6,9,4],
];

export const HOUR_LABELS = ["8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm"];
export const DAY_LABELS_FULL = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export const TASK_TYPE_PERFORMANCE = [
  { type: "Bug fix",   avgMins: 45,  estimateAccuracy: 89, color: "#e06c75", count: 28 },
  { type: "Feature",   avgMins: 285, estimateAccuracy: 61, color: "#61afef", count: 42 },
  { type: "Refactor",  avgMins: 195, estimateAccuracy: 58, color: "#e5c07b", count: 15 },
  { type: "Chore",     avgMins: 28,  estimateAccuracy: 94, color: "#98c379", count: 34 },
  { type: "Research",  avgMins: 120, estimateAccuracy: 52, color: "#c678dd", count: 11 },
];

export const PRODUCTIVITY_STATS = {
  peakDay: "Tuesday",
  avgStartTime: "9:08am",
  avgEndTime: "5:42pm",
  avgSessionMins: 47,
  sessionAbandonmentRate: 18,
  tasksPerDay: { Mon: 3.8, Tue: 6.2, Wed: 4.1, Thu: 3.5, Fri: 3.2 },
};

// ─── Coming Week Preview ──────────────────────────────────────────────────────

export const COMING_WEEK = {
  weekOf: "March 31, 2026",
  estimatedHours: 41.5,
  scheduledMeetingHours: 12,
  meetingPct: 30,
  focusWindows: [
    { day: "Mon", time: "9:00–12:00", hours: 3, quality: "high" as const },
    { day: "Tue", time: "9:00–12:00", hours: 3, quality: "high" as const },
    { day: "Thu", time: "9:00–11:00", hours: 2, quality: "medium" as const },
    { day: "Fri", time: "10:00–12:00", hours: 2, quality: "medium" as const },
  ],
  riskFlags: [
    { type: "deadline" as const, label: "API Platform milestone due Apr 10 — 2 tasks unstarted" },
    { type: "overload" as const, label: "Heavy meeting week — 12h in meetings (30% of working hours)" },
  ],
  topTasks: [
    { title: "Core endpoints implementation", estimatedHours: 6, urgency: "high" as const },
    { title: "Auth service refactor",          estimatedHours: 4, urgency: "high" as const },
    { title: "Database migration script",      estimatedHours: 2, urgency: "medium" as const },
  ],
};

// ─── Team Health ──────────────────────────────────────────────────────────────

export const TEAM_HEALTH = {
  teamName: "Frontend",
  rhythmScore: 72,
  rhythmTrend: "improving" as InsightTrend,
  balanceScore: 64,
  balanceTrend: "stable" as InsightTrend,
  burnoutAlerts: 2,
  velocityData: [
    { label: "W9",  value: 54 },
    { label: "W10", value: 68 },
    { label: "W11", value: 47 },
    { label: "W12", value: 73 },
    { label: "W13", value: 55 },
    { label: "W14", value: 69 },
    { label: "W15", value: 58 },
    { label: "W16", value: 76 },
  ],
  topBlockers: [
    { type: "Code review delays",      count: 4, avgDays: 2.8 },
    { type: "Unclear requirements",    count: 2, avgDays: 3.5 },
    { type: "External dependencies",   count: 1, avgDays: 5.0 },
  ],
  workloadDistribution: [
    { label: "Alex C.",   pct: 32, over: true  },
    { label: "Jamie L.",  pct: 28, over: true  },
    { label: "Sam R.",    pct: 18, over: false },
    { label: "Morgan K.", pct: 14, over: false },
    { label: "Casey T.",  pct:  8, over: false },
  ],
  collaborationMap: [
    { from: "Alex C.",   to: "Jamie L.",  strength: 8 },
    { from: "Alex C.",   to: "Sam R.",    strength: 5 },
    { from: "Jamie L.",  to: "Morgan K.", strength: 7 },
    { from: "Sam R.",    to: "Morgan K.", strength: 3 },
    { from: "Casey T.",  to: "Jamie L.", strength: 4 },
  ],
  teamNarrative: "The team is finding its stride — velocity has climbed for 4 consecutive weeks. Workload is slightly front-loaded on two members; redistributing 3–4 tasks would balance capacity going into Q2.",
};

// ─── Department Data ──────────────────────────────────────────────────────────

export type TeamStatus = "healthy" | "watch" | "at_risk";

export interface DeptTeam {
  id: string;
  name: string;
  memberCount: number;
  rhythmScore: number;
  velocityTrend: "up" | "flat" | "down";
  status: TeamStatus;
  burnoutAlerts: number;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  leadName: string;
  teamCount: number;
  memberCount: number;
  teams: DeptTeam[];
  velocityData: { label: string; value: number }[];
  crossTeamLinks: { teamA: string; teamB: string; strength: number }[];
  topBlockers: { type: string; affectedTeams: string[] }[];
  burnoutTotal: number;
  narrative: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "dept-eng",
    name: "Engineering",
    color: "#61afef",
    leadName: "Sarah Kim",
    teamCount: 4,
    memberCount: 24,
    teams: [
      { id: "t1", name: "Frontend", memberCount: 5, rhythmScore: 72, velocityTrend: "up",   status: "healthy", burnoutAlerts: 2 },
      { id: "t2", name: "Backend",  memberCount: 6, rhythmScore: 58, velocityTrend: "flat", status: "watch",   burnoutAlerts: 1 },
      { id: "t3", name: "Infra",    memberCount: 4, rhythmScore: 81, velocityTrend: "up",   status: "healthy", burnoutAlerts: 0 },
      { id: "t4", name: "Data",     memberCount: 4, rhythmScore: 51, velocityTrend: "down", status: "watch",   burnoutAlerts: 3 },
    ],
    velocityData: [
      { label: "W9",  value: 180 }, { label: "W10", value: 195 }, { label: "W11", value: 188 },
      { label: "W12", value: 210 }, { label: "W13", value: 225 }, { label: "W14", value: 218 },
      { label: "W15", value: 235 }, { label: "W16", value: 241 },
    ],
    crossTeamLinks: [
      { teamA: "Frontend", teamB: "Backend", strength: 9 },
      { teamA: "Backend",  teamB: "Infra",   strength: 7 },
      { teamA: "Data",     teamB: "Backend", strength: 6 },
      { teamA: "Frontend", teamB: "Data",    strength: 2 },
    ],
    topBlockers: [
      { type: "API contract misalignment",     affectedTeams: ["Frontend", "Backend"] },
      { type: "Infra capacity constraints",    affectedTeams: ["Backend", "Data"]     },
      { type: "Unclear data schema ownership", affectedTeams: ["Data", "Backend"]     },
    ],
    burnoutTotal: 6,
    narrative: "Engineering velocity is up 34% over 8 weeks — strong overall momentum. The Data team is showing signs of overload and 3 burnout signals. Backend rhythm has plateaued; consider reviewing sprint scope before Q2 ramp-up.",
  },
  {
    id: "dept-product",
    name: "Product",
    color: "#c678dd",
    leadName: "Marcus Chen",
    teamCount: 2,
    memberCount: 12,
    teams: [
      { id: "t5", name: "Product", memberCount: 6, rhythmScore: 77, velocityTrend: "up", status: "healthy", burnoutAlerts: 0 },
      { id: "t6", name: "Design",  memberCount: 6, rhythmScore: 69, velocityTrend: "up", status: "healthy", burnoutAlerts: 1 },
    ],
    velocityData: [
      { label: "W9",  value: 92  }, { label: "W10", value: 88  }, { label: "W11", value: 95  },
      { label: "W12", value: 101 }, { label: "W13", value: 98  }, { label: "W14", value: 105 },
      { label: "W15", value: 110 }, { label: "W16", value: 108 },
    ],
    crossTeamLinks: [
      { teamA: "Product", teamB: "Design", strength: 9 },
    ],
    topBlockers: [
      { type: "Engineering handoff delays", affectedTeams: ["Product", "Design"] },
    ],
    burnoutTotal: 1,
    narrative: "Product and Design are well-aligned and trending positively. Primary constraint is engineering capacity to implement approved designs — worth a cross-department sync with Engineering leadership.",
  },
];

// ─── Member Narratives ────────────────────────────────────────────────────────

export interface MemberNarrative {
  highlight: string;
  wins: string[];
  riskReason?: string;
  sprintTrend: { label: string; tasks: number }[];
  dailyHours: number[]; // Mon–Fri
}

export const MEMBER_NARRATIVES: Record<string, MemberNarrative> = {
  u1: {
    highlight: "Closed the auth migration that had been blocked for 3 weeks",
    wins: [
      "Unblocked 2 teammates on a token refresh edge case",
      "Cleared the entire PR review queue — zero open reviews",
    ],
    sprintTrend: [
      { label: "W13", tasks: 9  },
      { label: "W14", tasks: 11 },
      { label: "W15", tasks: 8  },
      { label: "W16", tasks: 13 },
    ],
    dailyHours: [6, 7, 8, 7, 4],
  },
  u2: {
    highlight: "Best output sprint in 4 weeks — 6 tasks closed",
    wins: [
      "Rate limiter middleware shipped 2 days ahead of schedule",
      "Only member with zero sprint carry-overs",
    ],
    riskReason: "3 consecutive sprints over 40h — the pace is impressive but worth a check-in to make sure it's sustainable going into Q2.",
    sprintTrend: [
      { label: "W13", tasks: 10 },
      { label: "W14", tasks: 12 },
      { label: "W15", tasks: 14 },
      { label: "W16", tasks: 16 },
    ],
    dailyHours: [9, 10, 8, 9, 5],
  },
  u3: {
    highlight: "Back in rhythm after a slower month",
    wins: [
      "DB index optimization finished 20% under estimate",
      "Cleared 2 long-parked backlog items that were blocking staging",
    ],
    sprintTrend: [
      { label: "W13", tasks: 7 },
      { label: "W14", tasks: 8 },
      { label: "W15", tasks: 6 },
      { label: "W16", tasks: 9 },
    ],
    dailyHours: [5, 6, 7, 6, 4],
  },
  u4: {
    highlight: "9-day streak — consistent, predictable output all sprint",
    wins: [
      "Bug resolution 35% faster than team average — fastest on the team",
      "TypeScript cleanup resolved in a single focused session, unblocked 3 others",
    ],
    sprintTrend: [
      { label: "W13", tasks: 8  },
      { label: "W14", tasks: 10 },
      { label: "W15", tasks: 9  },
      { label: "W16", tasks: 12 },
    ],
    dailyHours: [8, 8, 7, 8, 7],
  },
  u5: {
    highlight: "47h logged — most time invested on the team this sprint",
    wins: [
      "Finally closed out the long-running QA regression suite",
    ],
    riskReason: "47h logged but 2 tasks shipped — the regression suite likely ballooned in scope. Worth splitting large QA items into smaller trackable chunks next sprint.",
    sprintTrend: [
      { label: "W13", tasks: 14 },
      { label: "W14", tasks: 13 },
      { label: "W15", tasks: 15 },
      { label: "W16", tasks: 11 },
    ],
    dailyHours: [10, 11, 9, 10, 7],
  },
};

// ─── Team Narratives (dept detail drawers) ───────────────────────────────────

export interface TeamNarrative {
  summary: string;
  highlight: string;
  watchItem?: string;
  topWorkItems: { title: string; status: "done" | "in_progress" | "blocked" }[];
}

export const TEAM_NARRATIVES: Record<string, TeamNarrative> = {
  t1: {
    summary: "Strong sprint — velocity up for the 4th consecutive week",
    highlight: "Shipped the auth migration milestone and cleared the entire review queue",
    topWorkItems: [
      { title: "Auth migration",               status: "done"        },
      { title: "Rate limiter middleware",       status: "done"        },
      { title: "Core endpoints implementation",status: "in_progress" },
      { title: "API integration tests",        status: "in_progress" },
    ],
  },
  t2: {
    summary: "Steady pace — on target but team capacity is plateauing",
    highlight: "Cleared staging infrastructure debt and unblocked the Frontend team",
    watchItem: "3 tickets in review for 4+ days — a short review sync could clear the queue",
    topWorkItems: [
      { title: "Staging environment setup",    status: "done"        },
      { title: "Rate limiting configuration",  status: "done"        },
      { title: "Add rate limiting middleware",  status: "in_progress" },
      { title: "SSO integration",              status: "blocked"     },
    ],
  },
  t3: {
    summary: "Best rhythm score in Engineering — zero blockers all sprint",
    highlight: "Exceptional execution this sprint — consistent delivery with no carry-overs",
    topWorkItems: [
      { title: "DB index optimization",        status: "done"        },
      { title: "Error monitoring setup",       status: "in_progress" },
    ],
  },
  t4: {
    summary: "Velocity declining — team showing signs of overload",
    highlight: "Data pipeline architecture design completed despite capacity pressure",
    watchItem: "3 burnout signals this sprint — recommend a capacity review before next sprint planning",
    topWorkItems: [
      { title: "Pipeline architecture",        status: "done"        },
      { title: "Ingestion layer",              status: "in_progress" },
      { title: "Transform layer",              status: "blocked"     },
    ],
  },
  t5: {
    summary: "Product momentum strong — spec velocity at 6-month high",
    highlight: "Closed 3 major spec docs this sprint, unblocking Engineering for Q2",
    topWorkItems: [
      { title: "Q2 roadmap spec",              status: "done"        },
      { title: "Settings architecture doc",    status: "done"        },
      { title: "Homepage redesign spec",       status: "in_progress" },
    ],
  },
  t6: {
    summary: "Design delivery consistent — one member approaching capacity",
    highlight: "Design system token refresh shipped, enabling faster Engineering iteration",
    watchItem: "One designer logged 48h this week — worth checking workload before assigning new items",
    topWorkItems: [
      { title: "Design system color tokens",   status: "done"        },
      { title: "Homepage hero redesign",       status: "in_progress" },
      { title: "Settings wireframes",          status: "in_progress" },
    ],
  },
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export type MetricType =
  | "tasks_week"
  | "hours_week"
  | "streak_days"
  | "prs_reviewed"
  | "avg_session"
  | "sprint_velocity"
  | "tasks_month"
  | "estimate_acc";

export interface MetricMeta {
  label: string;
  unit: string;
  description: string;
  defaultTarget: number;
}

export const METRIC_META: Record<MetricType, MetricMeta> = {
  tasks_week:      { label: "Tasks this week",    unit: " tasks", description: "Tasks completed this week",           defaultTarget: 20  },
  hours_week:      { label: "Hours logged",       unit: "h",      description: "Hours logged this week",             defaultTarget: 40  },
  streak_days:     { label: "Day streak",         unit: " days",  description: "Consecutive active days",            defaultTarget: 30  },
  prs_reviewed:    { label: "PRs reviewed",       unit: " PRs",   description: "Pull requests reviewed this period", defaultTarget: 50  },
  avg_session:     { label: "Avg focus session",  unit: " min",   description: "Average focus session length",       defaultTarget: 60  },
  sprint_velocity: { label: "Sprint velocity",    unit: "%",      description: "Capacity utilised this sprint",      defaultTarget: 85  },
  tasks_month:     { label: "Tasks this month",   unit: " tasks", description: "Tasks completed this month",         defaultTarget: 80  },
  estimate_acc:    { label: "Estimate accuracy",  unit: "%",      description: "Task time estimate accuracy",        defaultTarget: 85  },
};

export const CURRENT_METRIC_VALUES: Record<MetricType, number> = {
  tasks_week:      14,
  hours_week:      38.5,
  streak_days:     18,
  prs_reviewed:    34,
  avg_session:     52,
  sprint_velocity: 76,
  tasks_month:     52,
  estimate_acc:    74,
};

export interface KeyResult {
  id: string;
  title: string;
  progress: number; // 0–100
  done: boolean;
  metricType?: MetricType;
  target?: number;
}

export function computeKrProgress(kr: KeyResult): number {
  if (kr.metricType && kr.target) {
    return Math.min(100, Math.round((CURRENT_METRIC_VALUES[kr.metricType] / kr.target) * 100));
  }
  return kr.progress;
}

export type GoalStatus = "on_track" | "watch" | "at_risk";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  dueLabel: string;
  progress: number; // 0–100
  status: GoalStatus;
  owner?: string;   // free-text team/dept label
  keyResults: KeyResult[];
}

export const TEAM_GOALS: Goal[] = [
  {
    id: "tg1",
    title: "Ship auth migration to production",
    description: "Complete the auth service rewrite — OAuth2 PKCE, token refresh, session management, and full e2e test coverage.",
    dueLabel: "Apr 15",
    progress: 85,
    status: "on_track",
    keyResults: [
      { id: "kr1", title: "Token refresh edge cases resolved",         progress: 100, done: true  },
      { id: "kr2", title: "OAuth2 PKCE flow implemented & tested",     progress: 100, done: true  },
      { id: "kr3", title: "End-to-end integration tests passing",      progress: 65,  done: false },
    ],
  },
  {
    id: "tg2",
    title: "Reduce API p95 latency below 200ms",
    description: "Optimise the core API layer through DB index tuning, query caching, and connection pooling. Current p95: 340ms.",
    dueLabel: "May 1",
    progress: 45,
    status: "watch",
    keyResults: [
      { id: "kr4", title: "DB index optimization shipped",             progress: 100, done: true  },
      { id: "kr5", title: "Query cache layer implemented",             progress: 30,  done: false },
      { id: "kr6", title: "Connection pool tuning completed",          progress: 0,   done: false },
    ],
  },
  {
    id: "tg3",
    title: "Achieve 80% test coverage on core module",
    description: "Increase automated test coverage from 52% to 80% across the core business logic layer before Q2 feature work starts.",
    dueLabel: "Apr 30",
    progress: 62,
    status: "on_track",
    keyResults: [
      { id: "kr7", title: "Auth module: 90% coverage",                 progress: 100, done: true  },
      { id: "kr8", title: "Task engine: 75% coverage",                 progress: 75,  done: false },
      { id: "kr9", title: "Timer service: 60% coverage",               progress: 60,  done: false },
    ],
  },
  {
    id: "tg4",
    title: "Stride v2.0 — ship public beta",
    description: "Full product redesign — new task engine, calendar integration, timer, and team admin layer.",
    dueLabel: "Apr 30",
    progress: 40,
    status: "on_track",
    keyResults: [
      { id: "tgkr1", title: "Auth redesign",    progress: 100, done: true  },
      { id: "tgkr2", title: "Tasks & calendar", progress: 100, done: true  },
      { id: "tgkr3", title: "Timer & reports",  progress: 50,  done: false },
      { id: "tgkr4", title: "Team admin",       progress: 0,   done: false },
      { id: "tgkr5", title: "Public beta",      progress: 0,   done: false },
    ],
  },
  {
    id: "tg5",
    title: "API Platform v3 — core endpoints shipped",
    description: "Core API layer redesign with rate limiting, auth middleware, and full SDK + docs.",
    dueLabel: "Jun 15",
    progress: 25,
    status: "at_risk",
    keyResults: [
      { id: "tgkr6", title: "Schema design",     progress: 100, done: true  },
      { id: "tgkr7", title: "Core endpoints",    progress: 15,  done: false },
      { id: "tgkr8", title: "Auth & rate limit", progress: 0,   done: false },
      { id: "tgkr9", title: "Docs & SDK",        progress: 0,   done: false },
    ],
  },
  {
    id: "tg6",
    title: "Website redesign live before May",
    description: "Marketing site refresh with new landing page, updated blog, and design system alignment.",
    dueLabel: "May 1",
    progress: 67,
    status: "on_track",
    keyResults: [
      { id: "tgkr10", title: "Design system", progress: 100, done: true  },
      { id: "tgkr11", title: "Landing page",  progress: 100, done: true  },
      { id: "tgkr12", title: "Blog & docs",   progress: 20,  done: false },
    ],
  },
];

export const DEPT_GOALS: Record<string, Goal[]> = {
  "dept-eng": [
    {
      id: "dg1",
      title: "Release Stride v2.0 API Platform",
      description: "Ship all API platform work to production including the new rate limiting, auth middleware, and public SDK.",
      dueLabel: "Jun 30",
      progress: 40,
      status: "on_track",
      keyResults: [
        { id: "dkr1", title: "Auth layer complete & deployed",         progress: 85,  done: false },
        { id: "dkr2", title: "Rate limiting shipped to production",    progress: 100, done: true  },
        { id: "dkr3", title: "SDK & developer docs published",         progress: 0,   done: false },
        { id: "dkr4", title: "Load test passing at 10k rpm",           progress: 0,   done: false },
      ],
    },
    {
      id: "dg2",
      title: "Zero critical vulnerabilities in production",
      description: "Eliminate all critical and high severity vulnerabilities as part of Q2 security hardening.",
      dueLabel: "May 31",
      progress: 88,
      status: "on_track",
      keyResults: [
        { id: "dkr5", title: "Security audit completed",               progress: 100, done: true  },
        { id: "dkr6", title: "All critical CVEs patched",              progress: 100, done: true  },
        { id: "dkr7", title: "Automated SAST/DAST pipeline in CI",    progress: 65,  done: false },
      ],
    },
    {
      id: "dg3",
      title: "Average bug resolution time under 3 days",
      description: "Reduce median time-to-close for bugs from 6.2 days to under 3 days by improving triage and review cycles.",
      dueLabel: "May 31",
      progress: 38,
      status: "at_risk",
      keyResults: [
        { id: "dkr8",  title: "Daily triage process adopted by all teams", progress: 100, done: true  },
        { id: "dkr9",  title: "Median resolution: 6.2d → 3.0d",           progress: 40,  done: false },
        { id: "dkr10", title: "P0 escalation playbook live",               progress: 0,   done: false },
      ],
    },
  ],
  "dept-product": [
    {
      id: "pg1",
      title: "Deliver Q2 roadmap specs on schedule",
      description: "All Q2 feature specifications signed off by Engineering leads before May 1 sprint planning.",
      dueLabel: "May 1",
      progress: 65,
      status: "on_track",
      keyResults: [
        { id: "pkr1", title: "Settings architecture spec signed off",  progress: 100, done: true  },
        { id: "pkr2", title: "Habits & timer specs complete",          progress: 100, done: true  },
        { id: "pkr3", title: "Enterprise tier spec delivered",         progress: 40,  done: false },
        { id: "pkr4", title: "Q3 roadmap draft for stakeholder review",progress: 0,   done: false },
      ],
    },
    {
      id: "pg2",
      title: "Increase design system adoption to 100%",
      description: "All new UI work shipped using design system components — zero custom one-off implementations.",
      dueLabel: "Apr 30",
      progress: 72,
      status: "on_track",
      keyResults: [
        { id: "pkr5", title: "Design system color tokens shipped",     progress: 100, done: true  },
        { id: "pkr6", title: "Component library fully documented",     progress: 55,  done: false },
        { id: "pkr7", title: "Engineering adoption audit complete",    progress: 60,  done: false },
      ],
    },
    {
      id: "pg3",
      title: "Homepage redesign live before May launch",
      description: "Redesigned marketing homepage — new hero, updated nav, and refreshed social proof section — live by April 28.",
      dueLabel: "Apr 28",
      progress: 55,
      status: "watch",
      keyResults: [
        { id: "pkr8", title: "Hero section design approved",          progress: 100, done: true  },
        { id: "pkr9", title: "All responsive breakpoints QA'd",       progress: 60,  done: false },
        { id: "pkr10","title": "SEO metadata & og:image updated",     progress: 0,   done: false },
      ],
    },
  ],
};

export const ORG_GOALS: Goal[] = [
  {
    id: "og1",
    title: "Reach 10,000 monthly active users",
    description: "Grow MAU from 6,200 to 10,000 by end of Q2 through onboarding improvements, activation campaigns, and product quality.",
    dueLabel: "Jun 30",
    progress: 62,
    status: "on_track",
    owner: "Growth · Product",
    keyResults: [
      { id: "okr1", title: "New onboarding flow launched",            progress: 100, done: true  },
      { id: "okr2", title: "MAU: 6,200 → 10,000",                    progress: 62,  done: false },
      { id: "okr3", title: "Activation rate above 60%",               progress: 55,  done: false },
    ],
  },
  {
    id: "og2",
    title: "Launch enterprise tier",
    description: "Ship SSO, admin controls, audit logging, and role-based permissions to unlock the enterprise pipeline.",
    dueLabel: "Jul 31",
    progress: 25,
    status: "watch",
    owner: "Engineering · Product",
    keyResults: [
      { id: "okr4", title: "SSO integration shipped",                 progress: 30,  done: false },
      { id: "okr5", title: "Admin audit log in production",           progress: 40,  done: false },
      { id: "okr6", title: "3 design partner commitments signed",     progress: 0,   done: false },
    ],
  },
  {
    id: "og3",
    title: "Achieve SOC2 Type II compliance",
    description: "Complete SOC2 audit with Drata, remediate all findings, and receive the final report by May 31.",
    dueLabel: "May 31",
    progress: 70,
    status: "on_track",
    owner: "Engineering · Infra",
    keyResults: [
      { id: "okr7", title: "Drata setup & evidence collection done",  progress: 100, done: true  },
      { id: "okr8", title: "All control gaps remediated",             progress: 75,  done: false },
      { id: "okr9", title: "Audit walkthrough complete",              progress: 40,  done: false },
    ],
  },
  {
    id: "og4",
    title: "Reduce team burnout signals by 25%",
    description: "Protect team health in Q2 via sprint capacity guardrails, 1:1 cadence enforcement, and workload visibility tooling.",
    dueLabel: "Dec 31",
    progress: 55,
    status: "on_track",
    owner: "All teams",
    keyResults: [
      { id: "okr10", title: "1:1 cadence live across all teams",      progress: 80,  done: false },
      { id: "okr11", title: "Sprint capacity guardrails in place",    progress: 60,  done: false },
      { id: "okr12", title: "Avg burnout signals: 4.0 → 3.0/sprint", progress: 25,  done: false },
    ],
  },
  {
    id: "og5",
    title: "Stride v2.0 — ship public beta",
    description: "Full product redesign — new task engine, calendar integration, timer, and team admin layer.",
    dueLabel: "Apr 30",
    progress: 40,
    status: "on_track",
    owner: "Core team",
    keyResults: [
      { id: "ogkr1", title: "Auth redesign",    progress: 100, done: true  },
      { id: "ogkr2", title: "Tasks & calendar", progress: 100, done: true  },
      { id: "ogkr3", title: "Timer & reports",  progress: 50,  done: false },
      { id: "ogkr4", title: "Team admin",       progress: 0,   done: false },
      { id: "ogkr5", title: "Public beta",      progress: 0,   done: false },
    ],
  },
  {
    id: "og6",
    title: "API Platform v3 — core endpoints shipped",
    description: "Core API layer redesign with rate limiting, auth middleware, and full SDK + docs.",
    dueLabel: "Jun 15",
    progress: 25,
    status: "at_risk",
    owner: "Platform team",
    keyResults: [
      { id: "ogkr6", title: "Schema design",     progress: 100, done: true  },
      { id: "ogkr7", title: "Core endpoints",    progress: 15,  done: false },
      { id: "ogkr8", title: "Auth & rate limit", progress: 0,   done: false },
      { id: "ogkr9", title: "Docs & SDK",        progress: 0,   done: false },
    ],
  },
  {
    id: "og7",
    title: "Website redesign live before May",
    description: "Marketing site refresh with new landing page, updated blog, and design system alignment.",
    dueLabel: "May 1",
    progress: 67,
    status: "on_track",
    owner: "Growth team",
    keyResults: [
      { id: "ogkr10", title: "Design system", progress: 100, done: true  },
      { id: "ogkr11", title: "Landing page",  progress: 100, done: true  },
      { id: "ogkr12", title: "Blog & docs",   progress: 20,  done: false },
    ],
  },
  {
    id: "og8",
    title: "Data pipeline — ingestion and transform",
    description: "End-to-end data ingestion and transformation pipeline supporting ML feature extraction.",
    dueLabel: "Jul 30",
    progress: 25,
    status: "on_track",
    owner: "Infra team",
    keyResults: [
      { id: "ogkr13", title: "Architecture design", progress: 100, done: true  },
      { id: "ogkr14", title: "Ingestion layer",     progress: 20,  done: false },
      { id: "ogkr15", title: "Transform layer",     progress: 0,   done: false },
      { id: "ogkr16", title: "Dashboard output",    progress: 0,   done: false },
    ],
  },
];
