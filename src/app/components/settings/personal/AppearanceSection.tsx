import { useState } from "react";
import { Sun, Moon, Check } from "lucide-react";
import { cn } from "../../ui/utils";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";
import { useApp } from "../../../context/AppContext";

// ─── Theme preview mini-wireframe ────────────────────────────────────────────

function ThemePreview({ mode, active, onClick }: { mode: "light" | "dark"; active: boolean; onClick: () => void }) {
  const isLight = mode === "light";

  // Colors that represent each theme
  const bg = isLight ? "#f8f9fa" : "#282c34";
  const card = isLight ? "#ffffff" : "#2c313a";
  const sidebar = isLight ? "#ffffff" : "#21252b";
  const text = isLight ? "#282c34" : "#abb2bf";
  const textMuted = isLight ? "#6b7280" : "#848b98";
  const primary = isLight ? "#0ea5e9" : "#61afef";
  const border = isLight ? "rgba(0,0,0,0.08)" : "#3e4451";
  const muted = isLight ? "#f1f3f5" : "#3e4451";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-1 rounded-xl border-2 p-1.5 transition-all overflow-hidden",
        active
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-muted-foreground/30"
      )}
    >
      {/* Mini app wireframe */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="flex h-[100px]">
          {/* Sidebar */}
          <div className="w-[48px] flex-shrink-0 flex flex-col gap-1 p-1.5" style={{ backgroundColor: sidebar, borderRight: `1px solid ${border}` }}>
            <div className="h-3.5 w-full rounded" style={{ backgroundColor: muted }} />
            <div className="h-2 w-full rounded" style={{ backgroundColor: primary, opacity: 0.7 }} />
            <div className="h-2 w-full rounded" style={{ backgroundColor: muted }} />
            <div className="h-2 w-full rounded" style={{ backgroundColor: muted }} />
            <div className="h-2 w-3/4 rounded mt-auto" style={{ backgroundColor: muted }} />
          </div>
          {/* Main content */}
          <div className="flex-1 p-2 flex flex-col gap-1.5">
            <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: text, opacity: 0.6 }} />
            <div className="flex-1 rounded-md p-1.5 flex flex-col gap-1" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="h-1.5 w-2/3 rounded" style={{ backgroundColor: textMuted, opacity: 0.5 }} />
              <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: textMuted, opacity: 0.3 }} />
              <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: textMuted, opacity: 0.3 }} />
            </div>
            <div className="flex-1 rounded-md p-1.5 flex flex-col gap-1" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
              <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: textMuted, opacity: 0.5 }} />
              <div className="h-1.5 w-2/5 rounded" style={{ backgroundColor: textMuted, opacity: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-center gap-1.5 pt-2.5 pb-1">
        {isLight ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-medium text-foreground">{isLight ? "Light" : "Dark"}</span>
      </div>

      {/* Active indicator */}
      {active && (
        <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

// ─── Appearance section ──────────────────────────────────────────────────────

export function AppearanceSection() {
  const { darkMode, toggleDarkMode, settings, updateSettings } = useApp();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showEstimates, setShowEstimates] = useState(true);

  return (
    <>
      <Section title="Theme" description="Choose how the app looks. Your theme applies across all workspaces.">
        <div className="px-5 py-5">
          <div className="flex gap-3">
            <ThemePreview mode="light" active={!darkMode} onClick={() => { if (darkMode) toggleDarkMode(); }} />
            <ThemePreview mode="dark" active={darkMode} onClick={() => { if (!darkMode) toggleDarkMode(); }} />
          </div>
        </div>
      </Section>
      <Section title="Display">
        <Row label="Default task view" description="How tasks are displayed by default on team task pages.">
          <SelectInput value={settings.defaultView}
            options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }]}
            onChange={(v) => updateSettings({ defaultView: v as any })} />
        </Row>
        <Row label="Reduce motion" description="Minimize animations throughout the app.">
          <Toggle value={reduceMotion} onChange={setReduceMotion} />
        </Row>
        <Row label="Compact mode" description="Tighter spacing for higher density views.">
          <Toggle value={compactMode} onChange={setCompactMode} />
        </Row>
        <Row label="Show task estimates" description="Display estimated time on task cards by default.">
          <Toggle value={showEstimates} onChange={setShowEstimates} />
        </Row>
      </Section>
    </>
  );
}
