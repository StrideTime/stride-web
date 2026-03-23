import { useState } from "react";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import type { HabitCompletionDay } from "./HabitCard.types";
import type { ScheduleType } from "@stridetime/types";

interface HabitHistoryProps {
  completionHistory: HabitCompletionDay[];
  color: string;
  currentStreak: number;
  longestStreak?: number;
  scheduleType?: ScheduleType;
  scheduleDays?: number[] | null; // 0 = Sunday, 6 = Saturday
  startDate?: string | null;
  endDate?: string | null;
}

interface DayCell {
  date: string;
  completed: boolean;
  isScheduled: boolean;
  isToday: boolean;
  isInStreak: boolean;
  isCurrentMonth: boolean;
  value?: number;
}

/**
 * HabitHistory — Monthly calendar view showing completion history and streak info.
 * Navigate through months to see historical patterns.
 * Consecutive streaks are combined into conjoined pills.
 */
export function HabitHistory({
  completionHistory,
  color,
  currentStreak,
  longestStreak,
  scheduleType = "DAILY",
  scheduleDays = null,
  startDate = null,
  endDate = null,
}: HabitHistoryProps) {
  const today = new Date();
  const [viewingMonth, setViewingMonth] = useState(today.getMonth());
  const [viewingYear, setViewingYear] = useState(today.getFullYear());
  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to parse YYYY-MM-DD string as local date (not UTC)
  const parseDateLocal = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to check if a date is scheduled for this habit
  const isScheduledDay = (date: Date): boolean => {
    const dateString = formatDateLocal(date);

    // Check date range if custom schedule
    if (scheduleType === "CUSTOM") {
      if (startDate && dateString < startDate) return false;
      if (endDate && dateString > endDate) return false;
      return true;
    }

    // Check specific days if weekly schedule
    if (scheduleType === "WEEKLY" && scheduleDays) {
      const dayOfWeek = date.getDay();
      return scheduleDays.includes(dayOfWeek);
    }

    // Daily schedule - all days
    return true;
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear(viewingYear - 1);
    } else {
      setViewingMonth(viewingMonth - 1);
    }
  };

  const goToNextMonth = () => {
    // Don't allow going past current month
    if (viewingYear === today.getFullYear() && viewingMonth === today.getMonth()) {
      return;
    }
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear(viewingYear + 1);
    } else {
      setViewingMonth(viewingMonth + 1);
    }
  };

  const isCurrentMonth = viewingYear === today.getFullYear() && viewingMonth === today.getMonth();

  // Generate calendar grid for viewing month
  const firstDayOfMonth = new Date(viewingYear, viewingMonth, 1);
  const lastDayOfMonth = new Date(viewingYear, viewingMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const todayString = formatDateLocal(today);
  const calendarDays: DayCell[] = [];

  // Add leading days from previous month
  for (let i = 0; i < firstDayWeekday; i++) {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() - (firstDayWeekday - i));
    const dateString = formatDateLocal(date);
    const completion = completionHistory.find((c) => c.date === dateString);

    calendarDays.push({
      date: dateString,
      completed: completion?.completed || false,
      isScheduled: isScheduledDay(date),
      isToday: dateString === todayString,
      isInStreak: false,
      isCurrentMonth: date.getMonth() === viewingMonth && date.getFullYear() === viewingYear,
      value: completion?.value,
    });
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewingYear, viewingMonth, day);
    const dateString = formatDateLocal(date);
    const completion = completionHistory.find((c) => c.date === dateString);

    calendarDays.push({
      date: dateString,
      completed: completion?.completed || false,
      isScheduled: isScheduledDay(date),
      isToday: dateString === todayString,
      isInStreak: false,
      isCurrentMonth: date.getMonth() === viewingMonth && date.getFullYear() === viewingYear,
      value: completion?.value,
    });
  }

  // Add trailing days from next month
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(viewingYear, viewingMonth + 1, i);
    const dateString = formatDateLocal(date);
    const completion = completionHistory.find((c) => c.date === dateString);

    calendarDays.push({
      date: dateString,
      completed: completion?.completed || false,
      isScheduled: isScheduledDay(date),
      isToday: dateString === todayString,
      isInStreak: false,
      isCurrentMonth: date.getMonth() === viewingMonth && date.getFullYear() === viewingYear,
      value: completion?.value,
    });
  }

  // Calculate streak days (working backwards from today)
  const streakDays = new Set<string>();
  if (currentStreak > 0) {
    const allCompletions = completionHistory
      .filter((c) => c.completed)
      .sort((a, b) => b.date.localeCompare(a.date));

    let count = 0;
    for (const completion of allCompletions) {
      if (count >= currentStreak) break;
      streakDays.add(completion.date);
      count++;
    }
  }

  // Mark streak days
  calendarDays.forEach((day) => {
    if (streakDays.has(day.date)) {
      day.isInStreak = true;
    }
  });

  // Group into weeks (7 days per week) and filter out weeks with no current month days
  const weeks: DayCell[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    const week = calendarDays.slice(i, i + 7);
    // Only include weeks that have at least one day from the current viewing month
    const hasCurrentMonthDay = week.some((day) => {
      const dayDate = parseDateLocal(day.date);
      return dayDate.getMonth() === viewingMonth && dayDate.getFullYear() === viewingYear;
    });
    if (hasCurrentMonthDay) {
      weeks.push(week);
    }
  }

  const getDayLabel = (index: number) => {
    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    return labels[index];
  };

  const getMonthName = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[viewingMonth];
  };

  // Helper to detect consecutive scheduled days in a week
  const getScheduledGroups = (week: DayCell[]): number[][] => {
    const groups: number[][] = [];
    let currentGroup: number[] = [];

    week.forEach((day, index) => {
      if (day.isScheduled && day.isCurrentMonth) {
        currentGroup.push(index);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Helper to detect consecutive completed days in a week
  const getCompletedGroups = (week: DayCell[]): number[][] => {
    const groups: number[][] = [];
    let currentGroup: number[] = [];

    week.forEach((day, index) => {
      if (day.completed && day.isCurrentMonth) {
        currentGroup.push(index);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  return (
    <div className="space-y-3">
      {/* Streak Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4" style={{ color }} />
          <div className="text-sm">
            <span className="font-semibold">{currentStreak}</span>
            <span className="text-muted-foreground ml-1">day streak</span>
          </div>
        </div>
        {longestStreak !== undefined && longestStreak > 0 && (
          <div className="text-xs text-muted-foreground">
            Best: <span className="font-medium">{longestStreak}</span> days
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="space-y-3">
        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold">
            {getMonthName()} {viewingYear}
          </div>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 hover:bg-muted rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar Grid Container */}
        <div className="rounded-lg border p-2 bg-muted/20">
          {/* Day labels (horizontal) */}
          <div className="flex gap-1 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex-1 text-[10px] text-muted-foreground text-center font-semibold"
              >
                {getDayLabel(i)}
              </div>
            ))}
          </div>

          {/* Weeks (rows) */}
          <div className="space-y-1.5" style={{ minHeight: "198px" }}>
            {weeks.map((week, weekIndex) => {
              const scheduledGroups = getScheduledGroups(week);
              const completedGroups = getCompletedGroups(week);

              return (
                <div key={weekIndex} className="flex">
                  {week.map((day, dayIndex) => {
                    // Check if this day is part of a scheduled group
                    let isFirstInScheduledGroup = false;
                    let isLastInScheduledGroup = false;
                    let isInScheduledGroup = false;

                    scheduledGroups.forEach((group) => {
                      if (group.includes(dayIndex)) {
                        isInScheduledGroup = true;
                        if (dayIndex === group[0]) isFirstInScheduledGroup = true;
                        if (dayIndex === group[group.length - 1]) isLastInScheduledGroup = true;
                      }
                    });

                    // Check if this day is part of a completed group
                    let isFirstInCompletedGroup = false;
                    let isLastInCompletedGroup = false;
                    let isInCompletedGroup = false;

                    completedGroups.forEach((group) => {
                      if (group.includes(dayIndex)) {
                        isInCompletedGroup = true;
                        if (dayIndex === group[0]) isFirstInCompletedGroup = true;
                        if (dayIndex === group[group.length - 1]) isLastInCompletedGroup = true;
                      }
                    });

                    // Determine which group to use for styling (completed takes precedence)
                    const useCompletedGrouping = day.completed && isInCompletedGroup;
                    const useScheduledGrouping =
                      !day.completed && day.isScheduled && isInScheduledGroup;

                    const isFirstInGroup = useCompletedGrouping
                      ? isFirstInCompletedGroup
                      : isFirstInScheduledGroup;
                    const isLastInGroup = useCompletedGrouping
                      ? isLastInCompletedGroup
                      : isLastInScheduledGroup;
                    const isInGroup = useCompletedGrouping || useScheduledGrouping;

                    // Check if next day is consecutive in the same group
                    const nextDay = week[dayIndex + 1];
                    let hasGapAfter = true;

                    if (nextDay && isInGroup && !isLastInGroup) {
                      const activeGroups = useCompletedGrouping ? completedGroups : scheduledGroups;
                      activeGroups.forEach((group) => {
                        if (group.includes(dayIndex) && group.includes(dayIndex + 1)) {
                          hasGapAfter = false;
                        }
                      });
                    }

                    // Determine border radius for conjoined pills
                    let borderRadius = "0.25rem"; // default rounded
                    const activeGroups = useCompletedGrouping ? completedGroups : scheduledGroups;
                    if (isInGroup && activeGroups.some((g) => g.length > 1)) {
                      if (isFirstInGroup && !isLastInGroup) {
                        borderRadius = "0.25rem 0 0 0.25rem"; // rounded-l
                      } else if (isLastInGroup && !isFirstInGroup) {
                        borderRadius = "0 0.25rem 0.25rem 0"; // rounded-r
                      } else if (!isFirstInGroup && !isLastInGroup) {
                        borderRadius = "0"; // no rounding
                      }
                    }

                    // Determine background and border styling
                    let backgroundColor: string;
                    let textColor: string;
                    let borderColor: string = "transparent";

                    if (day.completed) {
                      // Completed: full habit color with border
                      backgroundColor = color;
                      textColor = "#fff";
                      borderColor = color;
                    } else if (day.isScheduled && day.isCurrentMonth) {
                      // Scheduled but not completed: border with light background
                      backgroundColor = `${color}15`;
                      textColor = "hsl(var(--foreground))";
                      borderColor = `${color}40`;
                    } else if (day.isCurrentMonth) {
                      // Unscheduled in current month: no border, muted text
                      backgroundColor = "transparent";
                      textColor = "hsl(var(--muted-foreground))";
                    } else {
                      // Other month days: very subtle
                      backgroundColor = "transparent";
                      textColor = "hsl(var(--muted-foreground) / 0.3)";
                    }

                    // Get day number and verify it's in the current viewing month
                    const dayDate = parseDateLocal(day.date);
                    const dayNum = dayDate.getDate();
                    const dayMonth = dayDate.getMonth();
                    const dayYear = dayDate.getFullYear();

                    // Don't render days from other months
                    if (dayMonth !== viewingMonth || dayYear !== viewingYear) {
                      return (
                        <div
                          key={dayIndex}
                          className="flex-1 h-7"
                          style={{
                            marginRight: dayIndex < 6 ? "0.25rem" : "0",
                          }}
                        />
                      );
                    }

                    return (
                      <div
                        key={dayIndex}
                        className="flex-1 h-7 flex items-center justify-center text-[11px] font-medium transition-all border"
                        style={
                          {
                            backgroundColor,
                            borderRadius,
                            borderColor,
                            color: textColor,
                            marginRight: hasGapAfter && dayIndex < 6 ? "0.25rem" : "0",
                          } as React.CSSProperties
                        }
                        title={`${dayDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}: ${day.completed ? "Completed" : day.isScheduled ? "Scheduled" : "Not scheduled"}${
                          day.value !== undefined ? ` (${day.value})` : ""
                        }${day.isInStreak ? " 🔥 Current Streak" : ""}`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
