import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import type {
  SubscriptionStatus,
  BillingPeriod,
  SubscriptionChangeReason,
  WorkspaceType,
  WorkspaceMemberRole,
  TaskDifficulty,
  TaskStatus,
  ScheduledEventType,
  Theme,
  UserStatus,
  PointsReason,
  TeamMemberRole,
  GoalType,
  GoalPeriod,
  BreakType,
  WorkSessionStatus,
  ExternalSource,
  ScheduleType,
  TrackingType,
  FocusSessionType,
  ProjectStatus,
  FontSize,
  Density,
  FeatureValueType,
} from '@stridetime/types';

// ============================================================================
// USERS TABLE
// ============================================================================

export const usersTable = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),
    timezone: text('timezone').notNull().default('UTC'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [index('idx_users_email').on(table.email)]
);

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  subscription: one(userSubscriptionsTable, {
    fields: [usersTable.id],
    references: [userSubscriptionsTable.userId],
  }),
  subscriptionHistory: many(subscriptionHistoryTable),
  ownedWorkspaces: many(workspacesTable),
  workspaceMemberships: many(workspaceMembersTable),
  projects: many(projectsTable),
  tasks: many(tasksTable),
  taskTypes: many(taskTypesTable),
  timeEntries: many(timeEntriesTable),
  scheduledEvents: many(scheduledEventsTable),
  dailySummaries: many(dailySummariesTable),
  preferences: one(userPreferencesTable, {
    fields: [usersTable.id],
    references: [userPreferencesTable.userId],
  }),
  pointsLedger: many(pointsLedgerTable),
  ledTeams: many(teamsTable),
  teamMemberships: many(teamMembersTable),
  goals: many(goalsTable),
  breaks: many(breaksTable),
  workSessions: many(workSessionsTable),
  workspaceUserPreferences: many(workspaceUserPreferencesTable),
  habits: many(habitsTable),
  habitCompletions: many(habitCompletionsTable),
  focusSettings: many(focusSettingsTable),
  focusSessions: many(focusSessionsTable),
}));

// ============================================================================
// PLANS TABLE
// ============================================================================

export const plansTable = sqliteTable('plans', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const plansRelations = relations(plansTable, ({ many }) => ({
  subscriptions: many(userSubscriptionsTable),
  features: many(planFeaturesTable),
  prices: many(planPricesTable),
}));

// ============================================================================
// FEATURES TABLE
// ============================================================================

export const featuresTable = sqliteTable(
  'features',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    valueType: text('value_type').notNull().$type<FeatureValueType>(), // BOOLEAN or LIMIT
    category: text('category').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [index('idx_features_category').on(table.category)]
);

export const featuresRelations = relations(featuresTable, ({ many }) => ({
  planFeatures: many(planFeaturesTable),
}));

// ============================================================================
// PLAN FEATURES TABLE
// ============================================================================

export const planFeaturesTable = sqliteTable(
  'plan_features',
  {
    id: text('id').primaryKey(),
    planId: text('plan_id').notNull(),
    featureId: text('feature_id').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    limitValue: integer('limit_value'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    uniqueIndex('idx_plan_features_plan_feature').on(table.planId, table.featureId),
    index('idx_plan_features_feature_id').on(table.featureId),
  ]
);

export const planFeaturesRelations = relations(planFeaturesTable, ({ one }) => ({
  plan: one(plansTable, {
    fields: [planFeaturesTable.planId],
    references: [plansTable.id],
  }),
  feature: one(featuresTable, {
    fields: [planFeaturesTable.featureId],
    references: [featuresTable.id],
  }),
}));

// ============================================================================
// PLAN PRICES TABLE
// ============================================================================

export const planPricesTable = sqliteTable(
  'plan_prices',
  {
    id: text('id').primaryKey(),
    planId: text('plan_id').notNull(),
    billingPeriod: text('billing_period').notNull().$type<BillingPeriod>(),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    stripePriceId: text('stripe_price_id'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    index('idx_plan_prices_plan_id').on(table.planId),
    uniqueIndex('idx_plan_prices_plan_period').on(table.planId, table.billingPeriod),
  ]
);

export const planPricesRelations = relations(planPricesTable, ({ one }) => ({
  plan: one(plansTable, {
    fields: [planPricesTable.planId],
    references: [plansTable.id],
  }),
}));

// ============================================================================
// ADMIN AUDIT LOG TABLE
// ============================================================================

export const adminAuditLogTable = sqliteTable(
  'admin_audit_log',
  {
    id: text('id').primaryKey(),
    adminUserId: text('admin_user_id').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    details: text('details'),
    performedAt: text('performed_at').notNull(),
  },
  table => [
    index('idx_admin_audit_log_admin').on(table.adminUserId),
    index('idx_admin_audit_log_entity').on(table.entityType, table.entityId),
    index('idx_admin_audit_log_performed_at').on(table.performedAt),
  ]
);

export const adminAuditLogRelations = relations(adminAuditLogTable, ({ one }) => ({
  admin: one(usersTable, {
    fields: [adminAuditLogTable.adminUserId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// USER SUBSCRIPTIONS TABLE
// ============================================================================

export const userSubscriptionsTable = sqliteTable(
  'user_subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique(),
    planId: text('plan_id').notNull(),
    status: text('status').notNull().$type<SubscriptionStatus>(),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    billingPeriod: text('billing_period').notNull().$type<BillingPeriod>(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripePriceId: text('stripe_price_id'),
    startedAt: text('started_at').notNull(),
    currentPeriodStart: text('current_period_start'),
    currentPeriodEnd: text('current_period_end'),
    canceledAt: text('canceled_at'),
    trialEndsAt: text('trial_ends_at'),
    isGrandfathered: integer('is_grandfathered', { mode: 'boolean' }).notNull().default(false),
    grandfatheredReason: text('grandfathered_reason'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    index('idx_user_subscriptions_user_id').on(table.userId),
    index('idx_user_subscriptions_plan_id').on(table.planId),
    index('idx_user_subscriptions_status').on(table.status),
  ]
);

export const userSubscriptionsRelations = relations(userSubscriptionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userSubscriptionsTable.userId],
    references: [usersTable.id],
  }),
  plan: one(plansTable, {
    fields: [userSubscriptionsTable.planId],
    references: [plansTable.id],
  }),
}));

// ============================================================================
// SUBSCRIPTION HISTORY TABLE
// ============================================================================

export const subscriptionHistoryTable = sqliteTable(
  'subscription_history',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    oldPlanId: text('old_plan_id'),
    newPlanId: text('new_plan_id').notNull(),
    oldPriceCents: integer('old_price_cents'),
    newPriceCents: integer('new_price_cents').notNull(),
    reason: text('reason').notNull().$type<SubscriptionChangeReason>(),
    changedAt: text('changed_at').notNull(),
  },
  table => [index('idx_subscription_history_user_id').on(table.userId)]
);

export const subscriptionHistoryRelations = relations(subscriptionHistoryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [subscriptionHistoryTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// WORKSPACES TABLE
// ============================================================================

export const workspacesTable = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    color: text('color'),
    timezone: text('timezone').notNull().default('America/New_York'),
    weekStartsOn: integer('week_starts_on').notNull().default(1),
    defaultProjectId: text('default_project_id'),
    defaultTeamId: text('default_team_id'),
    type: text('type').notNull().$type<WorkspaceType>(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [index('idx_workspaces_owner_user_id').on(table.ownerUserId)]
);

export const workspacesRelations = relations(workspacesTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [workspacesTable.ownerUserId],
    references: [usersTable.id],
  }),
  members: many(workspaceMembersTable),
  projects: many(projectsTable),
  teams: many(teamsTable),
  goals: many(goalsTable),
  workSessions: many(workSessionsTable),
  workspaceUserPreferences: many(workspaceUserPreferencesTable),
  workspaceStatuses: many(workspaceStatusesTable),
  focusSessions: many(focusSessionsTable),
}));

// ============================================================================
// WORKSPACE MEMBERS TABLE
// ============================================================================

export const workspaceMembersTable = sqliteTable(
  'workspace_members',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').notNull().$type<WorkspaceMemberRole>(),
    invitedBy: text('invited_by'),
    joinedAt: text('joined_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    uniqueIndex('idx_workspace_members_workspace_user').on(table.workspaceId, table.userId),
    index('idx_workspace_members_user_id').on(table.userId),
  ]
);

export const workspaceMembersRelations = relations(workspaceMembersTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceMembersTable.workspaceId],
    references: [workspacesTable.id],
  }),
  user: one(usersTable, {
    fields: [workspaceMembersTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// PROJECTS TABLE
// ============================================================================

export const projectsTable = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    createdByUserId: text('created_by_user_id'),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'),
    icon: text('icon'),
    status: text('status').notNull().default('ACTIVE').$type<ProjectStatus>(),
    completionPercentage: integer('completion_percentage').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_projects_workspace_id').on(table.workspaceId),
    index('idx_projects_created_by_user_id').on(table.createdByUserId),
    index('idx_projects_deleted').on(table.deleted),
  ]
);

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [projectsTable.workspaceId],
    references: [workspacesTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [projectsTable.createdByUserId],
    references: [usersTable.id],
  }),
  tasks: many(tasksTable),
  projectTeams: many(projectTeamsTable),
}));

// ============================================================================
// TASK TYPES TABLE
// ============================================================================

export const taskTypesTable = sqliteTable(
  'task_types',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id'),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    color: text('color'),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_task_types_user_id').on(table.userId),
    index('idx_task_types_workspace_id').on(table.workspaceId),
  ]
);

export const taskTypesRelations = relations(taskTypesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [taskTypesTable.userId],
    references: [usersTable.id],
  }),
  tasks: many(tasksTable),
}));

// ============================================================================
// TASKS TABLE
// ============================================================================

export const tasksTable = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    projectId: text('project_id').notNull(),

    title: text('title').notNull(),
    description: text('description'),
    difficulty: text('difficulty').notNull().$type<TaskDifficulty>(),
    progress: integer('progress').notNull().default(0),
    status: text('status').notNull().default('BACKLOG').$type<TaskStatus>(),
    assigneeUserId: text('assignee_user_id'),
    teamId: text('team_id'),
    estimatedMinutes: integer('estimated_minutes'),
    maxMinutes: integer('max_minutes'),
    actualMinutes: integer('actual_minutes').notNull().default(0),
    plannedForDate: text('planned_for_date'),
    dueDate: text('due_date'),
    taskTypeId: text('task_type_id'),
    checklistItems: text('checklist_items'),
    tags: text('tags'),
    externalId: text('external_id'),
    externalSource: text('external_source').$type<ExternalSource>(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    completedAt: text('completed_at'),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_tasks_user_id').on(table.userId),
    index('idx_tasks_project_id').on(table.projectId),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_planned_for_date').on(table.plannedForDate),
    index('idx_tasks_deleted').on(table.deleted),
  ]
);

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tasksTable.userId],
    references: [usersTable.id],
  }),
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id],
  }),
  taskType: one(taskTypesTable, {
    fields: [tasksTable.taskTypeId],
    references: [taskTypesTable.id],
  }),
  focusSessions: many(focusSessionsTable),
  timeEntries: many(timeEntriesTable),
  scheduledEvents: many(scheduledEventsTable),
  pointsLedger: many(pointsLedgerTable),
}));

// ============================================================================
// TIME ENTRIES TABLE
// ============================================================================

export const timeEntriesTable = sqliteTable(
  'time_entries',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id').notNull(),
    userId: text('user_id').notNull(),
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_time_entries_task_id').on(table.taskId),
    index('idx_time_entries_user_id').on(table.userId),
    index('idx_time_entries_started_at').on(table.startedAt),
  ]
);

export const timeEntriesRelations = relations(timeEntriesTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [timeEntriesTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [timeEntriesTable.userId],
    references: [usersTable.id],
  }),
  pointsLedger: many(pointsLedgerTable),
}));

// ============================================================================
// SCHEDULED EVENTS TABLE
// ============================================================================

export const scheduledEventsTable = sqliteTable(
  'scheduled_events',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id'),
    userId: text('user_id').notNull(),
    startTime: text('start_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    label: text('label').notNull(),
    type: text('type').notNull().$type<ScheduledEventType>(),
    externalId: text('external_id'),
    externalSource: text('external_source').$type<ExternalSource>(),
    metadata: text('metadata'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_scheduled_events_user_id').on(table.userId),
    index('idx_scheduled_events_start_time').on(table.startTime),
    index('idx_scheduled_events_external_id').on(table.externalId),
  ]
);

export const scheduledEventsRelations = relations(scheduledEventsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [scheduledEventsTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [scheduledEventsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// POINTS LEDGER TABLE
// ============================================================================

export const pointsLedgerTable = sqliteTable(
  'points_ledger',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    taskId: text('task_id'),
    timeEntryId: text('time_entry_id'),
    points: integer('points').notNull(),
    reason: text('reason').notNull().$type<PointsReason>(),
    description: text('description'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_points_ledger_user_id').on(table.userId),
    index('idx_points_ledger_user_created').on(table.userId, table.createdAt),
    index('idx_points_ledger_task_id').on(table.taskId),
  ]
);

export const pointsLedgerRelations = relations(pointsLedgerTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [pointsLedgerTable.userId],
    references: [usersTable.id],
  }),
  task: one(tasksTable, {
    fields: [pointsLedgerTable.taskId],
    references: [tasksTable.id],
  }),
  timeEntry: one(timeEntriesTable, {
    fields: [pointsLedgerTable.timeEntryId],
    references: [timeEntriesTable.id],
  }),
}));

// ============================================================================
// DAILY SUMMARIES TABLE
// ============================================================================

export const dailySummariesTable = sqliteTable(
  'daily_summaries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    tasksCompleted: integer('tasks_completed').notNull().default(0),
    tasksWorkedOn: integer('tasks_worked_on').notNull().default(0),
    totalPoints: integer('total_points').notNull().default(0),
    focusMinutes: integer('focus_minutes').notNull().default(0),
    breakMinutes: integer('break_minutes').notNull().default(0),
    workSessionCount: integer('work_session_count').notNull().default(0),
    clockInTime: text('clock_in_time'),
    clockOutTime: text('clock_out_time'),
    efficiencyRating: real('efficiency_rating').notNull().default(0.0),
    standoutMoment: text('standout_moment'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    uniqueIndex('idx_daily_summaries_user_date').on(table.userId, table.date),
    index('idx_daily_summaries_user_id_date').on(table.userId, table.date),
  ]
);

export const dailySummariesRelations = relations(dailySummariesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [dailySummariesTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// USER PREFERENCES TABLE
// ============================================================================

export const userPreferencesTable = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey(),

  theme: text('theme').notNull().default('SYSTEM').$type<Theme>(),

  checkInFrequency: integer('check_in_frequency').notNull().default(30),
  checkInEnabled: integer('check_in_enabled', { mode: 'boolean' }).notNull().default(true),

  endOfDaySummaryTime: text('end_of_day_summary_time').notNull().default('17:00'),
  endOfDaySummaryEnabled: integer('end_of_day_summary_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),

  autoPauseMinutes: integer('auto_pause_minutes').notNull().default(10),
  autoPauseEnabled: integer('auto_pause_enabled', { mode: 'boolean' }).notNull().default(true),

  breakReminderEnabled: integer('break_reminder_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  breakReminderMinutes: integer('break_reminder_minutes').notNull().default(90),

  accentColor: text('accent_color'),
  fontSize: text('font_size').notNull().default('MEDIUM').$type<FontSize>(),
  density: text('density').notNull().default('COMFORTABLE').$type<Density>(),
  keyboardShortcuts: text('keyboard_shortcuts'),
  soundEnabled: integer('sound_enabled', { mode: 'boolean' }).notNull().default(true),
  soundVolume: integer('sound_volume').notNull().default(80),
  enableHapticFeedback: integer('enable_haptic_feedback', { mode: 'boolean' })
    .notNull()
    .default(false),
  autoStartTimer: integer('auto_start_timer', { mode: 'boolean' }).notNull().default(false),

  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userPreferencesRelations = relations(userPreferencesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userPreferencesTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// TEAMS TABLE
// ============================================================================

export const teamsTable = sqliteTable(
  'teams',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'),
    icon: text('icon'),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    leadUserId: text('lead_user_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_teams_workspace_id').on(table.workspaceId),
    index('idx_teams_lead_user_id').on(table.leadUserId),
  ]
);

export const teamsRelations = relations(teamsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [teamsTable.workspaceId],
    references: [workspacesTable.id],
  }),
  leadUser: one(usersTable, {
    fields: [teamsTable.leadUserId],
    references: [usersTable.id],
  }),
  members: many(teamMembersTable),
  projectTeams: many(projectTeamsTable),
}));

// ============================================================================
// TEAM MEMBERS TABLE
// ============================================================================

export const teamMembersTable = sqliteTable(
  'team_members',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').notNull().$type<TeamMemberRole>(),
    addedBy: text('added_by'),
    addedAt: text('added_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    uniqueIndex('idx_team_members_team_user').on(table.teamId, table.userId),
    index('idx_team_members_user_id').on(table.userId),
  ]
);

export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [teamMembersTable.teamId],
    references: [teamsTable.id],
  }),
  user: one(usersTable, {
    fields: [teamMembersTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// PROJECT TEAMS TABLE
// ============================================================================

export const projectTeamsTable = sqliteTable(
  'project_teams',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    teamId: text('team_id').notNull(),
    addedAt: text('added_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    uniqueIndex('idx_project_teams_project_team').on(table.projectId, table.teamId),
    index('idx_project_teams_team_id').on(table.teamId),
  ]
);

export const projectTeamsRelations = relations(projectTeamsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectTeamsTable.projectId],
    references: [projectsTable.id],
  }),
  team: one(teamsTable, {
    fields: [projectTeamsTable.teamId],
    references: [teamsTable.id],
  }),
}));

// ============================================================================
// GOALS TABLE
// ============================================================================

export const goalsTable = sqliteTable(
  'goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
    type: text('type').notNull().$type<GoalType>(),
    targetValue: integer('target_value').notNull(),
    period: text('period').notNull().$type<GoalPeriod>(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_goals_user_id').on(table.userId),
    index('idx_goals_workspace_id').on(table.workspaceId),
  ]
);

export const goalsRelations = relations(goalsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [goalsTable.userId],
    references: [usersTable.id],
  }),
  workspace: one(workspacesTable, {
    fields: [goalsTable.workspaceId],
    references: [workspacesTable.id],
  }),
}));

// ============================================================================
// HABITS TABLE
// ============================================================================

export const habitsTable = sqliteTable(
  'habits',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull(),
    scheduleType: text('schedule_type').notNull().$type<ScheduleType>(),
    scheduleDaysOfWeek: text('schedule_days_of_week'),
    scheduleStartDate: text('schedule_start_date').notNull(),
    scheduleEndDate: text('schedule_end_date'),
    targetCount: integer('target_count'),
    trackingType: text('tracking_type').notNull().$type<TrackingType>(),
    unit: text('unit'),
    reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(false),
    reminderTime: text('reminder_time'),
    reminderMessage: text('reminder_message'),
    displayOrder: integer('display_order').notNull().default(0),
    archivedAt: text('archived_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_habits_user_id').on(table.userId),
    index('idx_habits_deleted').on(table.deleted),
  ]
);

export const habitsRelations = relations(habitsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [habitsTable.userId],
    references: [usersTable.id],
  }),
  completions: many(habitCompletionsTable),
}));

// ============================================================================
// HABIT COMPLETIONS TABLE
// ============================================================================

export const habitCompletionsTable = sqliteTable(
  'habit_completions',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id').notNull(),
    userId: text('user_id').notNull(),
    date: text('date').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    value: integer('value'),
    completedAt: text('completed_at'),
    notes: text('notes'),
    mood: integer('mood'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_habit_completions_habit_id').on(table.habitId),
    index('idx_habit_completions_user_id').on(table.userId),
    uniqueIndex('idx_habit_completions_habit_user_date').on(
      table.habitId,
      table.userId,
      table.date
    ),
  ]
);

export const habitCompletionsRelations = relations(habitCompletionsTable, ({ one }) => ({
  habit: one(habitsTable, {
    fields: [habitCompletionsTable.habitId],
    references: [habitsTable.id],
  }),
  user: one(usersTable, {
    fields: [habitCompletionsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// BREAKS TABLE
// ============================================================================

export const breaksTable = sqliteTable(
  'breaks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull().$type<BreakType>(),
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at'),
    durationMinutes: integer('duration_minutes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_breaks_user_id').on(table.userId),
    index('idx_breaks_started_at').on(table.startedAt),
  ]
);

export const breaksRelations = relations(breaksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [breaksTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// WORK SESSIONS TABLE
// ============================================================================

export const workSessionsTable = sqliteTable(
  'work_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
    status: text('status').notNull().$type<WorkSessionStatus>(),
    clockedInAt: text('clocked_in_at').notNull(),
    clockedOutAt: text('clocked_out_at'),
    totalFocusMinutes: integer('total_focus_minutes').notNull().default(0),
    totalBreakMinutes: integer('total_break_minutes').notNull().default(0),
    date: text('date').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_work_sessions_user_id').on(table.userId),
    index('idx_work_sessions_date').on(table.date),
  ]
);

export const workSessionsRelations = relations(workSessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [workSessionsTable.userId],
    references: [usersTable.id],
  }),
  workspace: one(workspacesTable, {
    fields: [workSessionsTable.workspaceId],
    references: [workspacesTable.id],
  }),
}));

// ============================================================================
// FOCUS SETTINGS TABLE
// ============================================================================

export const focusSettingsTable = sqliteTable(
  'focus_settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    pomodoroModeEnabled: integer('pomodoro_mode_enabled', { mode: 'boolean' })
      .notNull()
      .default(false),
    focusDuration: integer('focus_duration').notNull().default(25),
    shortBreakDuration: integer('short_break_duration').notNull().default(5),
    longBreakDuration: integer('long_break_duration').notNull().default(15),
    sessionsBeforeLongBreak: integer('sessions_before_long_break').notNull().default(4),
    autoStartBreaks: integer('auto_start_breaks', { mode: 'boolean' }).notNull().default(false),
    autoStartFocus: integer('auto_start_focus', { mode: 'boolean' }).notNull().default(false),
    soundEnabled: integer('sound_enabled', { mode: 'boolean' }).notNull().default(true),
    soundVolume: integer('sound_volume').notNull().default(80),
    notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    tickingSoundEnabled: integer('ticking_sound_enabled', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [uniqueIndex('idx_focus_settings_user_id').on(table.userId)]
);

export const focusSettingsRelations = relations(focusSettingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [focusSettingsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================================================
// FOCUS SESSIONS TABLE
// ============================================================================

export const focusSessionsTable = sqliteTable(
  'focus_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id'),
    taskId: text('task_id'),
    taskName: text('task_name'),
    type: text('type').notNull().$type<FocusSessionType>(),
    durationMinutes: integer('duration_minutes').notNull(),
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    interrupted: integer('interrupted', { mode: 'boolean' }).notNull().default(false),
    interruptions: integer('interruptions').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [
    index('idx_focus_sessions_user_id').on(table.userId),
    index('idx_focus_sessions_workspace_id').on(table.workspaceId),
    index('idx_focus_sessions_task_id').on(table.taskId),
    index('idx_focus_sessions_started_at').on(table.startedAt),
  ]
);

export const focusSessionsRelations = relations(focusSessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [focusSessionsTable.userId],
    references: [usersTable.id],
  }),
  workspace: one(workspacesTable, {
    fields: [focusSessionsTable.workspaceId],
    references: [workspacesTable.id],
  }),
  task: one(tasksTable, {
    fields: [focusSessionsTable.taskId],
    references: [tasksTable.id],
  }),
}));

// ============================================================================
// WORKSPACE USER PREFERENCES TABLE
// ============================================================================

export const workspaceUserPreferencesTable = sqliteTable(
  'workspace_user_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
    defaultView: text('default_view').notNull().default('TODAY'),
    groupTasksBy: text('group_tasks_by').notNull().default('PROJECT'),
    sortTasksBy: text('sort_tasks_by').notNull().default('PRIORITY'),
    showCompletedTasks: integer('show_completed_tasks', { mode: 'boolean' })
      .notNull()
      .default(false),
    showQuickAddButton: integer('show_quick_add_button', { mode: 'boolean' })
      .notNull()
      .default(true),
    keyboardShortcutsEnabled: integer('keyboard_shortcuts_enabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    autoStartTimerOnTask: integer('auto_start_timer_on_task', { mode: 'boolean' })
      .notNull()
      .default(false),
    trackTime: integer('track_time', { mode: 'boolean' }).notNull().default(true),
    trackBreaks: integer('track_breaks', { mode: 'boolean' }).notNull().default(true),
    trackCompletionTimes: integer('track_completion_times', { mode: 'boolean' })
      .notNull()
      .default(true),
    trackFocus: integer('track_focus', { mode: 'boolean' }).notNull().default(true),
    trackProjectSwitching: integer('track_project_switching', { mode: 'boolean' })
      .notNull()
      .default(false),
    statsVisibility: text('stats_visibility').notNull().default('ONLY_ME'),
    showOnLeaderboard: integer('show_on_leaderboard', { mode: 'boolean' }).notNull().default(false),
    shareAchievements: integer('share_achievements', { mode: 'boolean' }).notNull().default(false),
    dataRetention: text('data_retention').notNull().default('FOREVER'),
    taskReminders: integer('task_reminders', { mode: 'boolean' }).notNull().default(true),
    goalProgressNotifications: integer('goal_progress_notifications', { mode: 'boolean' })
      .notNull()
      .default(true),
    breakReminders: integer('break_reminders', { mode: 'boolean' }).notNull().default(true),
    dailySummary: integer('daily_summary', { mode: 'boolean' }).notNull().default(true),
    weeklySchedule: text('weekly_schedule'),
    workingHoursStart: text('working_hours_start').notNull().default('09:00'),
    workingHoursEnd: text('working_hours_end').notNull().default('17:00'),
    workingDays: text('working_days').notNull().default('[1,2,3,4,5]'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    uniqueIndex('idx_workspace_user_prefs_user_workspace').on(table.userId, table.workspaceId),
  ]
);

export const workspaceUserPreferencesRelations = relations(
  workspaceUserPreferencesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [workspaceUserPreferencesTable.userId],
      references: [usersTable.id],
    }),
    workspace: one(workspacesTable, {
      fields: [workspaceUserPreferencesTable.workspaceId],
      references: [workspacesTable.id],
    }),
  })
);

// ============================================================================
// WORKSPACE STATUSES TABLE
// ============================================================================

export const workspaceStatusesTable = sqliteTable(
  'workspace_statuses',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull().default('Circle'),
    color: text('color').notNull().default('#22c55e'),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  table => [index('idx_workspace_statuses_workspace_id').on(table.workspaceId)]
);

export const workspaceStatusesRelations = relations(workspaceStatusesTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceStatusesTable.workspaceId],
    references: [workspacesTable.id],
  }),
}));

// ============================================================================
// WORKSPACE USER STATUS TABLE
// ============================================================================

export const workspaceUserStatusTable = sqliteTable(
  'workspace_user_status',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
    status: text('status').notNull().$type<UserStatus>(),
    statusText: text('status_text'),
    activeTaskId: text('active_task_id'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    uniqueIndex('idx_workspace_user_status_user_workspace').on(table.userId, table.workspaceId),
    index('idx_workspace_user_status_workspace_id').on(table.workspaceId),
  ]
);

export const workspaceUserStatusRelations = relations(workspaceUserStatusTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [workspaceUserStatusTable.userId],
    references: [usersTable.id],
  }),
  workspace: one(workspacesTable, {
    fields: [workspaceUserStatusTable.workspaceId],
    references: [workspacesTable.id],
  }),
}));
