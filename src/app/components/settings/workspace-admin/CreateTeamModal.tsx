import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";
import { ColorPickerPopover } from "../shared/ColorPickerPopover";
import { IconPickerPopover, TEAM_ICONS, getIconByKey } from "../shared/IconPickerPopover";
import { useApp } from "../../../context/AppContext";
import { USERS, WORKSPACE_MEMBERSHIPS, TEAM_MEMBERS, type Team, type TeamRole } from "../../../data/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMemberEntry {
  userId: string;
  role: TeamRole;
}

export interface TeamFormData {
  name: string;
  description: string;
  color: string;
  iconKey: string;
  Icon: LucideIcon;
  members: TeamMemberEntry[];
}

interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TeamFormData) => void;
  workspaceName: string;
  /** Pass a team to switch to edit mode with prefilled data */
  editTeam?: Team;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamModal({ open, onOpenChange, onSave, workspaceName, editTeam }: TeamModalProps) {
  const { activeWorkspace } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!editTeam;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#61afef");
  const [iconKey, setIconKey] = useState("settings");
  const [members, setMembers] = useState<TeamMemberEntry[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Reset form when modal opens or editTeam changes
  useEffect(() => {
    if (!open) return;
    if (editTeam) {
      setName(editTeam.name);
      setDescription(editTeam.description);
      setColor(editTeam.color);
      const match = TEAM_ICONS.find((i) => i.Icon === editTeam.Icon);
      setIconKey(match?.key ?? "settings");
      setMembers(
        TEAM_MEMBERS.filter((tm) => tm.teamId === editTeam.id).map((tm) => ({ userId: tm.userId, role: tm.role }))
      );
    } else {
      setName("");
      setDescription("");
      setColor("#61afef");
      setIconKey("settings");
      setMembers([]);
    }
    setMemberSearch("");
  }, [open, editTeam?.id]);

  const SelectedIcon = getIconByKey(iconKey, TEAM_ICONS);

  // Available workspace members
  const wsMembers = WORKSPACE_MEMBERSHIPS
    .filter((wm) => wm.workspaceId === activeWorkspace.id)
    .map((wm) => {
      const user = USERS.find((u) => u.id === wm.userId);
      return user ? { ...user, wsRole: wm.role } : null;
    })
    .filter(Boolean) as (typeof USERS[number] & { wsRole: string })[];

  const filteredMembers = wsMembers.filter((u) =>
    !memberSearch || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedIds = new Set(members.map((m) => m.userId));
  const unselectedResults = filteredMembers.filter((u) => !selectedIds.has(u.id));

  function toggleMember(userId: string) {
    if (selectedIds.has(userId)) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      setMembers((prev) => [...prev, { userId, role: "STANDARD" }]);
    }
  }

  function setMemberRole(userId: string, role: TeamRole) {
    setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role } : m));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), color, iconKey, Icon: SelectedIcon, members });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit team" : "Create team"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update settings and members for this team.` : `Add a new team to ${workspaceName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto px-1">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              autoFocus={!isEdit}
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

          {/* Icon & color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Appearance</label>
            <div className="flex items-center gap-3">
              <IconPickerPopover
                value={iconKey}
                color={color}
                icons={TEAM_ICONS}
                onChange={(key) => setIconKey(key)}
              >
                <button className="h-9 px-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <SelectedIcon className="h-3 w-3" style={{ color }} />
                  </div>
                  <span className="text-xs text-foreground">Icon</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </IconPickerPopover>
              <ColorPickerPopover value={color} onChange={setColor}>
                <button className="h-9 px-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                  <span className="text-xs text-foreground">Color</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </ColorPickerPopover>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Members */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Members{members.length > 0 ? ` (${members.length})` : ""}
            </label>

            {/* Search input with typeahead */}
            <PopoverPrimitive.Root open={memberSearch.length > 0 && unselectedResults.length > 0}>
              <PopoverPrimitive.Anchor asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full text-sm bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </PopoverPrimitive.Anchor>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align="start"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  className="z-50 w-[var(--radix-popover-trigger-width)] bg-popover border border-border rounded-lg shadow-xl overflow-hidden max-h-44 overflow-y-auto animate-in fade-in-0 zoom-in-95"
                >
                  {unselectedResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => { toggleMember(user.id); setMemberSearch(""); inputRef.current?.focus(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.jobTitle ? `${user.jobTitle} · ` : ""}{user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            {/* Added members list */}
            {members.length > 0 && (
              <div className="mt-2 rounded-lg border border-border overflow-hidden divide-y divide-border">
                {members.map((m) => {
                  const user = USERS.find((u) => u.id === m.userId);
                  if (!user) return null;
                  const isAdmin = m.role === "ADMIN";
                  return (
                    <div key={m.userId} className="flex items-center gap-3 px-3 py-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{user.name}</p>
                        {user.jobTitle && <p className="text-xs text-muted-foreground truncate">{user.jobTitle}</p>}
                      </div>
                      <div className="relative flex-shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => setMemberRole(m.userId, e.target.value as TeamRole)}
                          className={cn(
                            "appearance-none text-xs font-medium pl-2 pr-6 py-1 rounded-md border cursor-pointer",
                            isAdmin
                              ? "bg-chart-4/10 border-chart-4/20 text-chart-4"
                              : "bg-muted border-border text-muted-foreground"
                          )}
                        >
                          <option value="STANDARD">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                      <button onClick={() => toggleMember(m.userId)}
                        className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors flex-shrink-0">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
            onClick={handleSubmit}
            disabled={!name.trim()}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              name.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isEdit ? "Save changes" : "Create team"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export with old name for backwards compat
export { TeamModal as CreateTeamModal };
export type { TeamFormData as NewTeamData, TeamMemberEntry as NewTeamMember };
