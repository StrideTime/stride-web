import { Check } from "lucide-react";
import { cn } from "../../ui/utils";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";

// ─── Default colors ──────────────────────────────────────────────────────────

export const PRESET_COLORS = [
  "#98c379", "#e06c75", "#61afef", "#e5c07b", "#c678dd",
  "#56b6c2", "#d19a66", "#abb2bf", "#5c6370", "#be5046",
  "#6366f1", "#84cc16",
];

// ─── Component ───────────────────────────────────────────────────────────────

interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  /** What renders as the trigger — defaults to a colored circle */
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export function ColorPickerPopover({
  value, onChange, colors = PRESET_COLORS, children, align = "start", side = "bottom",
}: ColorPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            className="h-5 w-5 rounded-full ring-2 ring-transparent hover:ring-offset-2 hover:ring-border transition-all flex-shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="w-auto p-3"
      >
        <p className="text-xs font-medium text-muted-foreground mb-2">Choose color</p>
        <div className={cn("grid gap-1.5", colors.length > 10 ? "grid-cols-6" : "grid-cols-5")}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {c === value && <Check className="h-3 w-3 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
