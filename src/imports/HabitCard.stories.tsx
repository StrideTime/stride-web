import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { HabitCard } from "./HabitCard";
import { HabitEditModal } from "./HabitEditModal";
import type { HabitFormData } from "./HabitEditModal.types";
import type { HabitCompletionDay } from "./HabitCard.types";

// Generate mock completion history
function generateMockHistory(completionRate: number): HabitCompletionDay[] {
  const history: HabitCompletionDay[] = [];
  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const completed = Math.random() < completionRate / 100;

    history.push({
      date: date.toISOString().split("T")[0],
      completed,
    });
  }

  return history;
}

// Generate mock history for specific days of week (0=Sunday, 6=Saturday)
function generateScheduledHistory(
  daysOfWeek: number[],
  completionRate: number
): HabitCompletionDay[] {
  const history: HabitCompletionDay[] = [];
  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    // Only add completion data for scheduled days
    if (daysOfWeek.includes(dayOfWeek)) {
      const completed = Math.random() < completionRate / 100;
      history.push({
        date: date.toISOString().split("T")[0],
        completed,
      });
    }
  }

  return history;
}

const meta: Meta<typeof HabitCard> = {
  title: "Components/HabitCard",
  component: HabitCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: "2rem", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HabitCard>;

/**
 * Default boolean habit (complete/incomplete tracking)
 */
export const Default: Story = {
  args: {
    name: "Morning Exercise",
    description: "30 minutes of cardio or strength training",
    icon: "Dumbbell",
    color: "#10b981",
    trackingType: "COMPLETED",
    unit: null,
    targetCount: null,
    completed: false,
    value: null,
    currentStreak: 5,
    longestStreak: 12,
    completionHistory: generateMockHistory(85),
    completionRate: 85,
    scheduleType: "DAILY",
    scheduleDays: null,
    startDate: null,
    endDate: null,
    onToggle: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

/**
 * Counter-based habit (numeric progress tracking)
 */
export const Counter: Story = {
  render: () => {
    const [value, setValue] = useState(5);
    return (
      <HabitCard
        name="Drink Water"
        description="Stay hydrated throughout the day"
        icon="Droplet"
        color="#06b6d4"
        trackingType="COUNTER"
        unit="glasses"
        targetCount={8}
        completed={false}
        value={value}
        currentStreak={3}
        longestStreak={8}
        completionHistory={generateMockHistory(71)}
        completionRate={71}
        scheduleType="DAILY"
        scheduleDays={null}
        startDate={null}
        endDate={null}
        onValueUpdate={setValue}
        onEdit={fn()}
        onDelete={fn()}
      />
    );
  },
};

/**
 * High-count habit with quick increment buttons
 */
export const HighCountCounter: Story = {
  render: () => {
    const [value, setValue] = useState(3500);
    return (
      <HabitCard
        name="Daily Steps"
        description="Walk 10,000 steps per day"
        icon="Footprints"
        color="#10b981"
        trackingType="COUNTER"
        unit="steps"
        targetCount={10000}
        completed={false}
        value={value}
        currentStreak={2}
        longestStreak={15}
        completionHistory={generateMockHistory(80)}
        completionRate={80}
        scheduleType="DAILY"
        scheduleDays={null}
        startDate={null}
        endDate={null}
        onValueUpdate={setValue}
        onEdit={fn()}
        onDelete={fn()}
      />
    );
  },
};

/**
 * Weekly habit tracked on Mondays only with 4-week streak
 * Demonstrates schedule-aware history visualization with conjoined streak pills
 */
export const WeeklyWithStreak: Story = {
  args: {
    name: "Weekly Review",
    description: "Review goals and progress every Monday",
    icon: "CalendarCheck",
    color: "#8b5cf6",
    trackingType: "COMPLETED",
    unit: null,
    targetCount: null,
    completed: true,
    value: null,
    currentStreak: 4,
    longestStreak: 8,
    completionHistory: generateScheduledHistory([1], 100), // Monday only, 100% completion
    completionRate: 100,
    scheduleType: "WEEKLY",
    scheduleDays: [1], // Monday
    startDate: null,
    endDate: null,
    onToggle: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

/**
 * Weekday habit (Mon-Fri) showing work week pattern with consecutive streaks
 */
export const WeekdayHabit: Story = {
  args: {
    name: "Morning Standup",
    description: "Attend daily standup meeting",
    icon: "Users",
    color: "#3b82f6",
    trackingType: "COMPLETED",
    unit: null,
    targetCount: null,
    completed: true,
    value: null,
    currentStreak: 5,
    longestStreak: 15,
    completionHistory: generateScheduledHistory([1, 2, 3, 4, 5], 95), // Mon-Fri, 95% completion
    completionRate: 95,
    scheduleType: "WEEKLY",
    scheduleDays: [1, 2, 3, 4, 5], // Mon-Fri
    startDate: null,
    endDate: null,
    onToggle: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

/**
 * Interactive: create/edit habits with full modal workflow
 */
export const WithEditModal: Story = {
  render: () => {
    const [habits, setHabits] = useState<
      Array<
        HabitFormData & {
          id: string;
          completed: boolean;
          value: number | null;
          currentStreak: number;
          longestStreak: number;
          completionRate: number;
          completionHistory: HabitCompletionDay[];
        }
      >
    >([
      {
        id: "1",
        name: "Morning Exercise",
        description: "30 minutes of cardio or strength training",
        icon: "Dumbbell",
        color: "#10b981",
        trackingType: "COMPLETED",
        unit: null,
        targetCount: null,
        scheduleType: "WEEKLY",
        scheduleDays: [1, 2, 3, 4, 5], // Mon-Fri
        startDate: null,
        endDate: null,
        completed: false,
        value: null,
        currentStreak: 5,
        longestStreak: 12,
        completionRate: 85,
        completionHistory: generateScheduledHistory([1, 2, 3, 4, 5], 85),
      },
      {
        id: "2",
        name: "Drink Water",
        description: "Stay hydrated throughout the day",
        icon: "Droplet",
        color: "#06b6d4",
        trackingType: "COUNTER",
        unit: "glasses",
        targetCount: 8,
        scheduleType: "DAILY",
        scheduleDays: null,
        startDate: null,
        endDate: null,
        completed: false,
        value: 5,
        currentStreak: 3,
        longestStreak: 8,
        completionRate: 71,
        completionHistory: generateMockHistory(71),
      },
    ]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<string | null>(null);

    const handleToggle = (id: string) => {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id && h.trackingType === "COMPLETED" ? { ...h, completed: !h.completed } : h
        )
      );
    };

    const handleValueUpdate = (id: string, value: number) => {
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, value } : h)));
    };

    const handleEdit = (id: string) => {
      setEditingHabit(id);
      setModalOpen(true);
    };

    const handleSave = (data: HabitFormData) => {
      if (editingHabit) {
        setHabits((prev) => prev.map((h) => (h.id === editingHabit ? { ...h, ...data } : h)));
      } else {
        // Create new habit
        setHabits((prev) => [
          ...prev,
          {
            ...data,
            id: Date.now().toString(),
            completed: false,
            value: data.trackingType === "COUNTER" ? 0 : null,
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
            completionHistory: [],
          },
        ]);
      }
      setEditingHabit(null);
    };

    const handleDelete = () => {
      if (editingHabit) {
        setHabits((prev) => prev.filter((h) => h.id !== editingHabit));
        setEditingHabit(null);
      }
    };

    const currentHabit = editingHabit ? habits.find((h) => h.id === editingHabit) : undefined;

    return (
      <div className="space-y-4 w-full">
        {/* Add New Button */}
        <button
          onClick={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
          className="w-full rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          + Add New Habit
        </button>

        {/* Habit Cards */}
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            name={habit.name}
            description={habit.description}
            icon={habit.icon}
            color={habit.color}
            trackingType={habit.trackingType}
            unit={habit.unit}
            targetCount={habit.targetCount}
            completed={habit.completed}
            value={habit.value}
            currentStreak={habit.currentStreak}
            longestStreak={habit.longestStreak}
            completionHistory={habit.completionHistory}
            completionRate={habit.completionRate}
            scheduleType={habit.scheduleType}
            scheduleDays={habit.scheduleDays}
            startDate={habit.startDate}
            endDate={habit.endDate}
            onToggle={habit.trackingType === "COMPLETED" ? () => handleToggle(habit.id) : undefined}
            onValueUpdate={
              habit.trackingType === "COUNTER"
                ? (value) => handleValueUpdate(habit.id, value)
                : undefined
            }
            onEdit={() => handleEdit(habit.id)}
            onDelete={() => {
              if (confirm("Delete this habit?")) {
                setHabits((prev) => prev.filter((h) => h.id !== habit.id));
              }
            }}
          />
        ))}

        {/* Edit Modal */}
        <HabitEditModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          habit={currentHabit}
          onSave={handleSave}
          onDelete={editingHabit ? handleDelete : undefined}
        />
      </div>
    );
  },
};
