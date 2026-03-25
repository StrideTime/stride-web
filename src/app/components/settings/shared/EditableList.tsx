import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ColorPickerPopover } from "./ColorPickerPopover";

export interface EditableItem { id: number; label: string; color: string; }

interface EditableListProps {
  items: EditableItem[];
  onChange: (items: EditableItem[]) => void;
  addLabel: string;
  minCount?: number;
}

export function EditableList({ items, onChange, addLabel, minCount = 2 }: EditableListProps) {
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3 group border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
          <ColorPickerPopover
            value={item.color}
            onChange={(c) => onChange(items.map((x) => x.id === item.id ? { ...x, color: c } : x))}
          />
          <input
            value={item.label}
            onChange={(e) => onChange(items.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))}
            className="flex-1 text-sm text-foreground bg-transparent focus:outline-none focus:ring-0 min-w-0"
          />
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => move(idx, -1)} disabled={idx === 0}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={() => items.length > minCount && onChange(items.filter((x) => x.id !== item.id))}
              disabled={items.length <= minCount}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { id: Date.now(), label: "New item", color: "#abb2bf" }])}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}
