import { useState } from "react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";

// ─── Shortcut data ───────────────────────────────────────────────────────────

const SHORTCUT_GROUPS = [
  {
    title: "Navigation",
    shortcuts: [
      { action: "Go to Dashboard", keys: "G then D" },
      { action: "Go to Calendar", keys: "G then C" },
      { action: "Go to Goals", keys: "G then G" },
      { action: "Go to Stats", keys: "G then S" },
      { action: "Go to Settings", keys: "\u2318," },
      { action: "Search", keys: "\u2318K" },
    ],
  },
  {
    title: "Tasks",
    shortcuts: [
      { action: "Quick add task", keys: "Q" },
      { action: "Mark task complete", keys: "E" },
      { action: "Assign to me", keys: "A" },
      { action: "Set due date", keys: "D" },
      { action: "Set priority", keys: "P" },
      { action: "Delete task", keys: "\u232B" },
    ],
  },
  {
    title: "Timer",
    shortcuts: [
      { action: "Start / stop timer", keys: "Space" },
      { action: "Pause timer", keys: "P" },
      { action: "Start focus session", keys: "F" },
    ],
  },
  {
    title: "Views",
    shortcuts: [
      { action: "Today view", keys: "T" },
      { action: "Board view", keys: "B" },
      { action: "List view", keys: "L" },
      { action: "Toggle sidebar", keys: "\u2318\\" },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function KeyboardShortcutsSection() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-5">
      <Section title="General">
        <Row label="Enable keyboard shortcuts" description="Use keyboard shortcuts for navigation and actions across the app.">
          <Toggle value={enabled} onChange={setEnabled} />
        </Row>
      </Section>

      {enabled && (
        <>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {group.shortcuts.map((s) => (
                  <div key={s.action} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-foreground">{s.action}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.split(" then ").map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-muted-foreground mx-1">then</span>}
                          <kbd className="px-2 py-1 text-xs bg-muted border border-border rounded-md font-mono text-foreground min-w-[28px] text-center">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
