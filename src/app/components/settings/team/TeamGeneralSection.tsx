import { useState, useRef, useEffect } from "react";
import {
  Check, Settings, Palette, Megaphone, Package, Code, Rocket, Lightbulb,
  Users, Zap, Target, BarChart2, Globe, Shield, Briefcase, Heart, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { cn } from "../../ui/utils";
import { TEAM_MEMBERS } from "../../../data/mockData";

// ─── Shared pickers ─────────────────────────────────────────────────────────

const TEAM_ICONS: { key: string; Icon: LucideIcon }[] = [
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

const TEAM_COLORS = [
  "#98c379", "#e06c75", "#61afef", "#e5c07b", "#c678dd",
  "#56b6c2", "#d19a66", "#abb2bf", "#5c6370", "#be5046",
  "#6366f1", "#84cc16",
];

// ─── Icon picker popover ─────────────────────────────────────────────────────

function IconPickerPopover({ value, color, onChange, onClose }: {
  value: string; color: string; onChange: (key: string) => void; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-[200px]">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">Choose icon</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TEAM_ICONS.map((opt) => (
            <button key={opt.key} onClick={() => { onChange(opt.key); onClose(); }}
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                value === opt.key ? "ring-2 ring-primary/50 bg-primary/10" : "bg-muted hover:bg-muted/80"
              )}>
              <opt.Icon className="h-4 w-4" style={{ color: value === opt.key ? color : undefined }} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Color picker popover ────────────────────────────────────────────────────

function ColorPickerPopover({ value, onChange, onClose }: {
  value: string; onChange: (c: string) => void; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-[200px]">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">Choose color</p>
        <div className="grid grid-cols-6 gap-1.5">
          {TEAM_COLORS.map((c) => (
            <button key={c} onClick={() => { onChange(c); onClose(); }}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}>
              {c === value && <Check className="h-3 w-3 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamGeneralSection() {
  const { selectedTeamId, allWorkspaceTeams } = useApp();
  const team = allWorkspaceTeams.find((t) => t.id === selectedTeamId);

  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [color, setColor] = useState(team?.color ?? "#61afef");
  const [selectedIconKey, setSelectedIconKey] = useState("code");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? "");
      setColor(team.color);
    }
  }, [team?.id]);

  const memberCount = TEAM_MEMBERS.filter((tm) => tm.teamId === selectedTeamId).length;
  const adminCount = TEAM_MEMBERS.filter((tm) => tm.teamId === selectedTeamId && tm.role === "ADMIN").length;
  const selectedIcon = TEAM_ICONS.find((i) => i.key === selectedIconKey) ?? TEAM_ICONS[0];

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Select a team from the sidebar to configure settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Team identity */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Team identity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Customize how this team appears across the workspace.</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Preview + pickers */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              {/* Icon + color preview */}
              <div className="h-14 w-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}>
                <selectedIcon.Icon className="h-7 w-7" style={{ color }} />
              </div>
              {/* Icon select */}
              <div className="relative">
                <button onClick={() => { setIconPickerOpen(!iconPickerOpen); setColorPickerOpen(false); }}
                  className="text-[10px] text-primary hover:opacity-80 transition-opacity">
                  Change icon
                </button>
                {iconPickerOpen && (
                  <IconPickerPopover value={selectedIconKey} color={color}
                    onChange={setSelectedIconKey} onClose={() => setIconPickerOpen(false)} />
                )}
              </div>
              {/* Color select */}
              <div className="relative">
                <button onClick={() => { setColorPickerOpen(!colorPickerOpen); setIconPickerOpen(false); }}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  Change color
                </button>
                {colorPickerOpen && (
                  <ColorPickerPopover value={color} onChange={setColor} onClose={() => setColorPickerOpen(false)} />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this team work on?"
                  rows={2}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Members</p>
          <p className="text-lg font-bold text-foreground mt-1">{memberCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Team admins</p>
          <p className="text-lg font-bold text-foreground mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive/80">Danger zone</h3>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Delete team</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently remove this team and all its data. This cannot be undone.</p>
          </div>
          <button className="text-sm text-destructive/70 hover:text-destructive transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}
