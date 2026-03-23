import { useState, useEffect } from "react";
import { Edit2, Trash2, Flame, Check, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "../../primitives/Button";
import { Card } from "../../primitives/Card";
import { Badge } from "../../primitives/Badge";
import { Progress } from "../../primitives/Progress";
import { Input } from "../../primitives/Input";
import { HabitHistory } from "./HabitHistory";
import type { HabitCardProps } from "./HabitCard.types";

export function HabitCard({
  name,
  description,
  icon,
  color,
  trackingType,
  unit,
  targetCount,
  completed,
  value,
  currentStreak,
  longestStreak,
  completionHistory,
  completionRate = 0,
  scheduleType = "DAILY",
  scheduleDays = null,
  startDate = null,
  endDate = null,
  onToggle,
  onValueUpdate,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const currentValue = value ?? 0;
  const [tempValue, setTempValue] = useState(currentValue);
  const counterProgress = targetCount ? (tempValue / targetCount) * 100 : 0;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentValue));
  const [showHistory, setShowHistory] = useState(false);

  // Sync tempValue with prop changes
  useEffect(() => {
    setTempValue(currentValue);
    setInputValue(String(currentValue));
  }, [currentValue]);

  // Auto-complete for counter types when target is reached
  const isCompleted =
    trackingType === "COUNTER" ? targetCount !== null && currentValue >= targetCount : completed;

  // Dynamically get the icon component from lucide-react
  const IconComponent: typeof Icons.Star =
    (Icons as unknown as Record<string, typeof Icons.Star>)[icon] || Icons.Star;

  const handleIncrement = (amount = 1) => {
    const newValue = tempValue + amount;
    setTempValue(newValue);
    setInputValue(String(newValue));
    onValueUpdate?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, tempValue - 1);
    setTempValue(newValue);
    setInputValue(String(newValue));
    onValueUpdate?.(newValue);
  };

  const handleInputSubmit = () => {
    const parsed = parseInt(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const newValue = parsed;
      setTempValue(newValue);
      onValueUpdate?.(newValue);
    } else {
      // Reset to current value if invalid
      setInputValue(String(tempValue));
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setInputValue(String(tempValue));
      setIsEditing(false);
    }
  };

  // Determine quick increment buttons based on target (more generous for larger targets)
  const quickIncrements: number[] = [];
  if (targetCount) {
    if (targetCount >= 100) {
      quickIncrements.push(25, 50, 100);
    } else if (targetCount >= 50) {
      quickIncrements.push(10, 25);
    } else if (targetCount >= 20) {
      quickIncrements.push(5, 10);
    }
  }

  const handleToggle = () => {
    onToggle?.();
  };

  return (
    <Card
      className="p-4 transition-all border"
      style={{
        backgroundColor: isCompleted ? `${color}10` : undefined,
        borderColor: isCompleted ? `${color}40` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon / Toggle Button */}
        <button
          onClick={trackingType === "COMPLETED" ? handleToggle : undefined}
          disabled={trackingType === "COUNTER"}
          className={`relative flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all focus:outline-none border-2 ${
            trackingType === "COMPLETED" ? "cursor-pointer hover:scale-105" : "cursor-default"
          }`}
          style={{
            borderColor: color,
            backgroundColor: isCompleted ? color : `${color}15`,
          }}
        >
          <IconComponent className="h-6 w-6" style={{ color: isCompleted ? "#ffffff" : color }} />
          {/* Completion checkmark badge */}
          {isCompleted && (
            <div
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center shadow-md border-[3px] border-background"
              style={{ backgroundColor: color }}
            >
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-base truncate ${
                  isCompleted ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {name}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentStreak > 0 && (
              <Badge
                variant="outline"
                className="gap-1.5 border"
                style={{ borderColor: `${color}40`, color }}
              >
                <Flame className="h-3 w-3" />
                <span className="font-medium">{currentStreak}</span>
              </Badge>
            )}
            {completionRate > 0 && (
              <span className="text-xs text-muted-foreground">
                {completionRate.toFixed(0)}% this week
              </span>
            )}
            {completionHistory && completionHistory.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistory(!showHistory);
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                History
                {showHistory ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Counter Controls + Progress */}
          {trackingType === "COUNTER" && (
            <div className="mt-3 space-y-2">
              {/* Counter Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrement}
                  disabled={tempValue === 0 || isEditing}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <div className="flex-1 text-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={handleInputSubmit}
                      onKeyDown={handleInputKeyDown}
                      className="h-8 text-center text-sm font-medium"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setInputValue(String(tempValue));
                      }}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {tempValue}
                      {targetCount && ` / ${targetCount}`}
                      {unit && ` ${unit}`}
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleIncrement(1)}
                  disabled={isEditing}
                  className="h-8 w-8 p-0"
                  style={{ borderColor: `${color}60`, color }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Quick Increment Buttons */}
              {quickIncrements.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Quick:</span>
                  <div className="flex gap-1 flex-1">
                    {quickIncrements.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncrement(amount)}
                        className="flex-1 h-7 px-2 text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          borderColor: `${color}50`,
                          color: color,
                          backgroundColor: `${color}08`,
                        }}
                      >
                        +{amount}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {targetCount && (
                <div className="space-y-1">
                  <Progress value={counterProgress} className="h-2" />
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(counterProgress)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {showHistory && completionHistory && completionHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <HabitHistory
                completionHistory={completionHistory}
                color={color}
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                scheduleType={scheduleType}
                scheduleDays={scheduleDays}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
