import type { TrackingType, ScheduleType } from "@stridetime/types";

export interface HabitFormData {
  name: string;
  description: string | null;
  icon: string;
  color: string;
  trackingType: TrackingType;
  unit: string | null;
  targetCount: number | null;
  scheduleType: ScheduleType;
  scheduleDays: number[] | null; // 0 = Sunday, 6 = Saturday
  startDate: string | null;
  endDate: string | null;
}

export interface HabitEditModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial habit data (undefined for new habit) */
  habit?: HabitFormData;
  /** Callback when save is clicked */
  onSave?: (data: HabitFormData) => void;
  /** Callback when delete is clicked (only shown for existing habits) */
  onDelete?: () => void;
}
