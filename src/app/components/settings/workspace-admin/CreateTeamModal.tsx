import { useState } from "react";
import {
  Settings, Palette, Megaphone, Package, Code, Rocket, Lightbulb,
  Users, Zap, Target, BarChart2, Globe, Shield, Briefcase, Heart, Wrench,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";

// ─── Icon picker options ─────────────────────────────────────────────────────

const ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
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

const PRESET_COLORS = [
  "#98c379", "#e06c75", "#61afef", "#e5c07b", "#c678dd",
  "#56b6c2", "#d19a66", "#abb2bf", "#5c6370", "#be5046",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NewTeamData {
  name: string;
  description: string;
  color: string;
  iconKey: string;
  Icon: LucideIcon;
}

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTeam: (team: NewTeamData) => void;
  workspaceName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateTeamModal({ open, onOpenChange, onCreateTeam, workspaceName }: CreateTeamModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[2]);
  const [iconKey, setIconKey] = useState("settings");

  const selectedIcon = ICON_OPTIONS.find((o) => o.key === iconKey) ?? ICON_OPTIONS[0];

  function handleCreate() {
    if (!name.trim()) return;
    onCreateTeam({ name: name.trim(), description: description.trim(), color, iconKey, Icon: selectedIcon.Icon });
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[2]);
    setIconKey("settings");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>Add a new team to {workspaceName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              autoFocus
              className="w-full text-sm bg-input-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team work on?"
              rows={2}
              className="w-full text-sm bg-input-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {c === color && <Check className="h-3 w-3 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setIconKey(opt.key)}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    iconKey === opt.key
                      ? "ring-2 ring-primary/50 bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <opt.Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15` }}>
              <selectedIcon.Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{name || "Team name"}</p>
              <p className="text-xs text-muted-foreground">{description || "No description"}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              name.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Create team
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
