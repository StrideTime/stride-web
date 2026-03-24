import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { cn } from "../../ui/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkflowItem {
  id: number;
  label: string;
  color: string;
}

const PRESET_COLORS = [
  "#98c379", "#e06c75", "#61afef", "#e5c07b", "#c678dd",
  "#56b6c2", "#d19a66", "#abb2bf", "#5c6370", "#be5046",
];

// ─── Compact editable tag list ───────────────────────────────────────────────

function TagList({ items, onChange, addLabel }: {
  items: WorkflowItem[];
  onChange: (items: WorkflowItem[]) => void;
  addLabel: string;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap gap-2 px-5 py-4">
      {items.map((item) => (
        <div key={item.id} className="relative group">
          {editingId === item.id ? (
            <div className="flex items-center gap-1 bg-muted border border-border rounded-lg px-1 py-0.5">
              <input
                value={item.label}
                autoFocus
                onChange={(e) => onChange(items.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                className="text-xs bg-transparent text-foreground focus:outline-none w-20 min-w-0"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingId(item.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors text-xs"
            >
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setColorPickerOpen(colorPickerOpen === item.id ? null : item.id); }}
                  className="h-3 w-3 rounded-full flex-shrink-0 hover:scale-125 transition-transform"
                  style={{ backgroundColor: item.color }}
                />
                {colorPickerOpen === item.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setColorPickerOpen(null)} />
                    <div className="absolute top-5 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl p-2 w-[140px]">
                      <div className="grid grid-cols-5 gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button key={c}
                            onClick={(e) => { e.stopPropagation(); onChange(items.map((x) => x.id === item.id ? { ...x, color: c } : x)); setColorPickerOpen(null); }}
                            className="h-5 w-5 rounded-full hover:scale-110 transition-transform flex items-center justify-center"
                            style={{ backgroundColor: c }}>
                            {c === item.color && <Check className="h-2 w-2 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <span className="text-foreground">{item.label}</span>
            </button>
          )}
          {items.length > 1 && (
            <button
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:border-destructive/30"
            >
              <X className="h-2 w-2 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { id: Date.now(), label: "New", color: "#abb2bf" }])}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamWorkflowSection() {
  const { selectedTeamId, allWorkspaceTeams } = useApp();
  const team = allWorkspaceTeams.find((t) => t.id === selectedTeamId);

  const [taskStatuses, setTaskStatuses] = useState<WorkflowItem[]>([
    { id: 1, label: "Backlog",     color: "#5c6370" },
    { id: 2, label: "To Do",       color: "#abb2bf" },
    { id: 3, label: "In Progress", color: "#61afef" },
    { id: 4, label: "In Review",   color: "#e5c07b" },
    { id: 5, label: "Done",        color: "#98c379" },
  ]);
  const [taskTypes, setTaskTypes] = useState<WorkflowItem[]>([
    { id: 1, label: "Feature",  color: "#98c379" },
    { id: 2, label: "Bug",      color: "#e06c75" },
    { id: 3, label: "Chore",    color: "#abb2bf" },
    { id: 4, label: "Research", color: "#c678dd" },
  ]);

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Select a team from the sidebar to configure workflow settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Statuses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Ticket statuses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a tag to rename it. Click the color dot to change color.
          </p>
        </div>
        <TagList items={taskStatuses} onChange={setTaskStatuses} addLabel="Add status" />
      </div>

      {/* Types */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Task types</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Classification labels for categorizing tasks.</p>
        </div>
        <TagList items={taskTypes} onChange={setTaskTypes} addLabel="Add type" />
      </div>
    </div>
  );
}
