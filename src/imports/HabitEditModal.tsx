import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../primitives/Dialog";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { Label } from "../../primitives/Label";
import { Separator } from "../../primitives/Separator";
import { DatePicker } from "../../primitives/DatePicker";
import { IconPicker } from "../IconPicker";
import type { HabitEditModalProps, HabitFormData } from "./HabitEditModal.types";

const DEFAULT_HABIT: HabitFormData = {
  name: "",
  description: null,
  icon: "Star",
  color: "#3b82f6",
  trackingType: "COMPLETED",
  unit: null,
  targetCount: null,
  scheduleType: "DAILY",
  scheduleDays: null,
  startDate: null,
  endDate: null,
};

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

/**
 * HabitEditModal — Create or edit a habit with full customization.
 * Includes icon/color picker, tracking type, schedule settings, and more.
 */
export function HabitEditModal({
  open,
  onOpenChange,
  habit,
  onSave,
  onDelete,
}: HabitEditModalProps) {
  const [formData, setFormData] = useState<HabitFormData>(habit || DEFAULT_HABIT);
  const isEditing = !!habit;

  // Reset form when modal opens/closes or habit changes
  useEffect(() => {
    if (open) {
      setFormData(habit || DEFAULT_HABIT);
    }
  }, [open, habit]);

  const handleSave = () => {
    // Basic validation
    if (!formData.name.trim()) {
      alert("Please enter a habit name");
      return;
    }

    if (formData.trackingType === "COUNTER" && !formData.targetCount) {
      alert("Please enter a target count for counter habits");
      return;
    }

    if (
      formData.scheduleType === "WEEKLY" &&
      (!formData.scheduleDays || formData.scheduleDays.length === 0)
    ) {
      alert("Please select at least one day");
      return;
    }

    onSave?.(formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this habit?")) {
      onDelete?.();
      onOpenChange(false);
    }
  };

  const toggleDay = (day: number) => {
    const days = formData.scheduleDays || [];
    const newDays = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    setFormData({ ...formData, scheduleDays: newDays });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Habit" : "Create New Habit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Morning Exercise"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            />
          </div>

          {/* Icon & Color */}
          <div className="space-y-2">
            <Label className="block">Icon & Color</Label>
            <div>
              <IconPicker
                value={{ icon: formData.icon, color: formData.color }}
                onValueChange={(value) =>
                  setFormData({ ...formData, icon: value.icon, color: value.color })
                }
                triggerLabel="Select Icon"
              />
            </div>
          </div>

          <Separator />

          {/* Tracking Type */}
          <div className="space-y-2">
            <Label>Tracking Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    trackingType: "COMPLETED",
                    unit: null,
                    targetCount: null,
                  })
                }
                className={`flex-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                  formData.trackingType === "COMPLETED"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">Complete</div>
                <div className="text-xs text-muted-foreground mt-1">Yes/No tracking</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, trackingType: "COUNTER" })}
                className={`flex-1 rounded-lg border-2 p-3 text-sm transition-colors ${
                  formData.trackingType === "COUNTER"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">Counter</div>
                <div className="text-xs text-muted-foreground mt-1">Track progress</div>
              </button>
            </div>
          </div>

          {/* Counter Settings */}
          {formData.trackingType === "COUNTER" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="targetCount">
                  Target <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetCount"
                  type="number"
                  min="1"
                  placeholder="8"
                  value={formData.targetCount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetCount: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="glasses"
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value || null })}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Schedule Type */}
          <div className="space-y-3">
            <Label>Repeat</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, scheduleType: "DAILY", scheduleDays: null })
                }
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                  formData.scheduleType === "DAILY"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Every Day
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    scheduleType: "WEEKLY",
                    scheduleDays: [1, 2, 3, 4, 5],
                  })
                }
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                  formData.scheduleType === "WEEKLY"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Specific Days
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, scheduleType: "CUSTOM", scheduleDays: null })
                }
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                  formData.scheduleType === "CUSTOM"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Date Range
              </button>
            </div>

            {/* Specific Days Selector */}
            {formData.scheduleType === "WEEKLY" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Days</Label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.scheduleDays?.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Date Range */}
            {formData.scheduleType === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    value={formData.startDate || undefined}
                    onChange={(date) => setFormData({ ...formData, startDate: date || null })}
                    placeholder="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    value={formData.endDate || undefined}
                    onChange={(date) => setFormData({ ...formData, endDate: date || null })}
                    placeholder="End date"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {/* Delete Button (only for existing habits) */}
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="mr-auto text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}

          {/* Cancel & Save */}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEditing ? "Save Changes" : "Create Habit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
