import type { TrackingType, ScheduleType } from "@stridetime/types";

export interface HabitCompletionDay {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  value?: number; // For counter type
}

export interface HabitCardProps {
  // From Habit
  name: string;
  description: string | null;
  icon: string;
  color: string;
  trackingType: TrackingType;
  unit: string | null;
  targetCount: number | null;

  // From HabitCompletion
  completed: boolean;
  value: number | null;

  // From HabitStreak
  currentStreak: number;
  longestStreak?: number;

  // Completion history (last 30-90 days)
  completionHistory?: HabitCompletionDay[];

  // Computed
  completionRate?: number;

  // Schedule
  scheduleType?: ScheduleType;
  scheduleDays?: number[] | null;
  startDate?: string | null;
  endDate?: string | null;

  // Callbacks
  onToggle?: () => void;
  onValueUpdate?: (value: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
