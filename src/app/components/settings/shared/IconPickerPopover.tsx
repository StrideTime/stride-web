import {
  Settings, Palette, Megaphone, Package, Code, Rocket, Lightbulb,
  Users, Zap, Target, BarChart2, Globe, Shield, Briefcase, Heart, Wrench,
  Circle, Check, Clock, Ban, Moon, Eye, EyeOff, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../ui/utils";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";

// ─── Icon sets ───────────────────────────────────────────────────────────────

export const TEAM_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: "settings",   Icon: Settings },
  { key: "palette",    Icon: Palette },
  { key: "megaphone",  Icon: Megaphone },
  { key: "package",    Icon: Package },
  { key: "code",       Icon: Code },
  { key: "rocket",     Icon: Rocket },
  { key: "lightbulb",  Icon: Lightbulb },
  { key: "users",      Icon: Users },
  { key: "zap",        Icon: Zap },
  { key: "target",     Icon: Target },
  { key: "bar-chart",  Icon: BarChart2 },
  { key: "globe",      Icon: Globe },
  { key: "shield",     Icon: Shield },
  { key: "briefcase",  Icon: Briefcase },
  { key: "heart",      Icon: Heart },
  { key: "wrench",     Icon: Wrench },
];

export const STATUS_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: "circle",   Icon: Circle },
  { key: "check",    Icon: Check },
  { key: "clock",    Icon: Clock },
  { key: "zap",      Icon: Zap },
  { key: "ban",      Icon: Ban },
  { key: "moon",     Icon: Moon },
  { key: "eye",      Icon: Eye },
  { key: "eye-off",  Icon: EyeOff },
  { key: "star",     Icon: Star },
  { key: "shield",   Icon: Shield },
  { key: "target",   Icon: Target },
  { key: "heart",    Icon: Heart },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

export function getIconByKey(key: string, set: { key: string; Icon: LucideIcon }[] = TEAM_ICONS): LucideIcon {
  return set.find((o) => o.key === key)?.Icon ?? Settings;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface IconPickerPopoverProps {
  value: string;
  onChange: (key: string, Icon: LucideIcon) => void;
  icons?: { key: string; Icon: LucideIcon }[];
  /** Color used to tint the selected icon */
  color?: string;
  /** What renders as the trigger */
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export function IconPickerPopover({
  value, onChange, icons = TEAM_ICONS, color, children, align = "start", side = "bottom",
}: IconPickerPopoverProps) {
  const SelectedIcon = getIconByKey(value, icons);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0">
            <SelectedIcon className="h-4 w-4" style={color ? { color } : undefined} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="w-auto p-3"
      >
        <p className="text-xs font-medium text-muted-foreground mb-2">Choose icon</p>
        <div className="grid grid-cols-4 gap-1.5">
          {icons.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key, opt.Icon)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                value === opt.key
                  ? "ring-2 ring-primary/50 bg-primary/10"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <opt.Icon className="h-3.5 w-3.5" style={{ color: value === opt.key ? (color ?? undefined) : undefined }} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
