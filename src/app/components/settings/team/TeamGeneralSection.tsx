import { useState, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { TEAM_MEMBERS } from "../../../data/mockData";
import { ColorPickerPopover } from "../shared/ColorPickerPopover";
import { IconPickerPopover, TEAM_ICONS, getIconByKey } from "../shared/IconPickerPopover";

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamGeneralSection() {
  const { selectedTeamId, allWorkspaceTeams } = useApp();
  const team = allWorkspaceTeams.find((t) => t.id === selectedTeamId);

  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [color, setColor] = useState(team?.color ?? "#61afef");
  const [selectedIconKey, setSelectedIconKey] = useState("code");

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? "");
      setColor(team.color);
    }
  }, [team?.id]);

  const memberCount = TEAM_MEMBERS.filter((tm) => tm.teamId === selectedTeamId).length;
  const adminCount = TEAM_MEMBERS.filter((tm) => tm.teamId === selectedTeamId && tm.role === "ADMIN").length;
  const SelectedIcon = getIconByKey(selectedIconKey, TEAM_ICONS);

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
                <SelectedIcon className="h-7 w-7" style={{ color }} />
              </div>
              {/* Icon select */}
              <IconPickerPopover
                value={selectedIconKey}
                color={color}
                icons={TEAM_ICONS}
                onChange={(key) => setSelectedIconKey(key)}
              >
                <button className="text-xs text-primary hover:opacity-80 transition-opacity">
                  Change icon
                </button>
              </IconPickerPopover>
              {/* Color select */}
              <ColorPickerPopover value={color} onChange={setColor}>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  Change color
                </button>
              </ColorPickerPopover>
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
