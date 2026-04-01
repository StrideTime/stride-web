import { useState, useEffect } from "react";
import { Plus, X, Target, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "../ui/utils";
import { Slider } from "../ui/slider";
import {
  METRIC_META, CURRENT_METRIC_VALUES, computeKrProgress,
  type Goal, type GoalStatus, type KeyResult, type MetricType,
} from "../../data/mockIntelligence";

// ─── Config ───────────────────────────────────────────────────────────────────

const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  on_track: { label: "On track", color: "#4ade80", bg: "rgba(74,222,128,0.10)"  },
  watch:    { label: "Watch",    color: "#facc15", bg: "rgba(250,204,21,0.10)"  },
  at_risk:  { label: "At risk",  color: "#f87171", bg: "rgba(248,113,113,0.10)" },
};

// ─── Segment Progress Bar ─────────────────────────────────────────────────────

function SegmentProgressBar({ keyResults, color, height = "h-2" }: {
  keyResults: KeyResult[];
  color: string;
  height?: string;
}) {
  if (keyResults.length === 0) return null;
  return (
    <div className="flex gap-1">
      {keyResults.map((kr) => {
        const pct = computeKrProgress(kr);
        return (
          <div
            key={kr.id}
            className={cn("flex-1 rounded-sm overflow-hidden", height, pct === 0 ? "bg-muted" : "")}
            style={pct > 0 ? { backgroundColor: `${color}20` } : undefined}
          >
            <div
              className="h-full rounded-sm transition-all"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const cfg  = GOAL_STATUS_CONFIG[goal.status];
  const done = goal.keyResults.filter((kr) => kr.done).length;
  const total = goal.keyResults.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group"
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{goal.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">Due {goal.dueLabel}</span>
              {total > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground">{done}/{total} key results</span>
                </>
              )}
              {goal.owner && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground">{goal.owner}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>

        {total > 0 && (
          <div className="mt-2.5">
            <SegmentProgressBar keyResults={goal.keyResults} color={cfg.color} />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Goal Detail Drawer ───────────────────────────────────────────────────────

function GoalDetailDrawer({ goal, onClose, onEdit }: { goal: Goal | null; onClose: () => void; onEdit: () => void }) {
  if (!goal) return null;
  const cfg = GOAL_STATUS_CONFIG[goal.status];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground leading-snug">{goal.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">Due {goal.dueLabel}</span>
                {goal.owner && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[10px] text-muted-foreground">{goal.owner}</span>
                  </>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={onEdit}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
          )}

          {/* Overall progress */}
          {goal.keyResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-medium">Milestones</span>
                <span className="font-bold tabular-nums" style={{ color: cfg.color }}>{goal.progress}%</span>
              </div>
              <SegmentProgressBar keyResults={goal.keyResults} color={cfg.color} height="h-2.5" />
            </div>
          )}

          {/* Key results */}
          {goal.keyResults.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Key results
              </p>
              <div className="space-y-3.5">
                {goal.keyResults.map((kr) => {
                  const pct = computeKrProgress(kr);
                  const isDone = kr.done || pct >= 100;
                  return (
                    <div key={kr.id} className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isDone ? "border-green-400 bg-green-400/20" : "border-border bg-muted",
                        )}>
                          {isDone && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs leading-snug", isDone ? "text-muted-foreground" : "text-foreground")}>
                            {kr.title}
                          </p>
                          {kr.metricType && (
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                              {METRIC_META[kr.metricType].label}: {CURRENT_METRIC_VALUES[kr.metricType]}{METRIC_META[kr.metricType].unit} / {kr.target}{METRIC_META[kr.metricType].unit}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">{pct}%</span>
                      </div>
                      {!isDone && pct > 0 && (
                        <div className="ml-6 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color, opacity: 0.65 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom KPI row */}
          {(() => {
            const overallPct = goal.keyResults.length
              ? Math.round(goal.keyResults.reduce((a, kr) => a + computeKrProgress(kr), 0) / goal.keyResults.length)
              : goal.progress;
            const doneCount = goal.keyResults.filter((kr) => kr.done || computeKrProgress(kr) >= 100).length;
            return (
          <div className="flex gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-black tabular-nums" style={{ color: cfg.color }}>
                {overallPct}%
              </div>
              <div className="text-[10px] text-muted-foreground">progress</div>
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-black text-green-400 tabular-nums">
                {doneCount}
              </div>
              <div className="text-[10px] text-muted-foreground">KRs done</div>
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-black text-foreground tabular-nums">
                {goal.keyResults.length - doneCount}
              </div>
              <div className="text-[10px] text-muted-foreground">remaining</div>
            </div>
          </div>
            );
          })()}

        </div>
      </div>
    </>
  );
}

// ─── Create Goal Drawer ───────────────────────────────────────────────────────

function CreateGoalDrawer({
  open, entityName, onClose, onCreate,
}: {
  open: boolean;
  entityName: string;
  onClose: () => void;
  onCreate: (goal: Goal) => void;
}) {
  interface KrDraft { id: string; metricType: MetricType; target: number; }

  const [title,       setTitle]      = useState("");
  const [dueLabel,    setDueLabel]   = useState("");
  const [krDrafts,    setKrDrafts]   = useState<KrDraft[]>([]);
  const [pendingM,    setPendingM]   = useState<MetricType>("tasks_week");
  const [pendingT,    setPendingT]   = useState(String(METRIC_META["tasks_week"].defaultTarget));

  function reset() {
    setTitle(""); setDueLabel(""); setKrDrafts([]);
    setPendingM("tasks_week"); setPendingT(String(METRIC_META["tasks_week"].defaultTarget));
  }

  function addKr() {
    if (krDrafts.length >= 5) return;
    setKrDrafts((d) => [...d, { id: `kr-${Date.now()}`, metricType: pendingM, target: parseFloat(pendingT) || METRIC_META[pendingM].defaultTarget }]);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const krs: KeyResult[] = krDrafts.map((krd) => {
      const meta = METRIC_META[krd.metricType];
      const current = CURRENT_METRIC_VALUES[krd.metricType];
      const pct = Math.min(100, Math.round((current / krd.target) * 100));
      return { id: krd.id, title: `${meta.label} ≥ ${krd.target}${meta.unit}`, progress: pct, done: pct >= 100, metricType: krd.metricType, target: krd.target };
    });
    const progress = krs.length ? Math.round(krs.reduce((a, k) => a + k.progress, 0) / krs.length) : 0;
    onCreate({ id: `goal-${Date.now()}`, title: title.trim(), dueLabel: dueLabel.trim() || "TBD", progress, status: "on_track", keyResults: krs });
    reset();
  }

  if (!open) return null;

  const METRIC_KEYS = Object.keys(METRIC_META) as MetricType[];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { onClose(); reset(); }} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">New goal</h3>
              <p className="text-xs text-muted-foreground">{entityName}</p>
            </div>
            <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Goal title <span className="text-muted-foreground font-normal">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ship auth migration to production"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Due date</label>
              <input
                type="text"
                value={dueLabel}
                onChange={(e) => setDueLabel(e.target.value)}
                placeholder="e.g. Apr 30, Q2 2026"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Key Results — metric-backed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Key results <span className="text-muted-foreground font-normal">({krDrafts.length}/5)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Auto-tracked from your stats</span>
              </div>

              {/* Added KRs */}
              {krDrafts.length > 0 && (
                <div className="space-y-2 mb-3">
                  {krDrafts.map((krd) => {
                    const meta = METRIC_META[krd.metricType];
                    const current = CURRENT_METRIC_VALUES[krd.metricType];
                    const pct = Math.min(100, Math.round((current / krd.target) * 100));
                    return (
                      <div key={krd.id} className="bg-muted/40 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <p className="text-xs font-medium text-foreground">{meta.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Now: {current}{meta.unit} · Target: {krd.target}{meta.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tabular-nums" style={{ color: pct >= 100 ? "#4ade80" : undefined }}>
                              {pct}%
                            </span>
                            <button onClick={() => setKrDrafts((d) => d.filter((k) => k.id !== krd.id))} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add KR row */}
              {krDrafts.length < 5 && (
                <div className="flex gap-2">
                  <select
                    value={pendingM}
                    onChange={(e) => {
                      const m = e.target.value as MetricType;
                      setPendingM(m);
                      setPendingT(String(METRIC_META[m].defaultTarget));
                    }}
                    className="flex-1 bg-input-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  >
                    {METRIC_KEYS.map((m) => (
                      <option key={m} value={m}>{METRIC_META[m].label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={pendingT}
                    onChange={(e) => setPendingT(e.target.value)}
                    placeholder="Target"
                    className="w-20 bg-input-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={addKr}
                    className="px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { onClose(); reset(); }}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create goal
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Edit Goal Drawer ─────────────────────────────────────────────────────────

function EditGoalDrawer({
  goal, onClose, onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (updated: Goal) => void;
}) {
  const [title,      setTitle]      = useState("");
  const [dueLabel,   setDueLabel]   = useState("");
  const [status,     setStatus]     = useState<GoalStatus>("on_track");
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [krInput,    setKrInput]    = useState("");

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDueLabel(goal.dueLabel);
      setStatus(goal.status);
      setKeyResults(goal.keyResults.map((kr) => ({ ...kr })));
      setKrInput("");
    }
  }, [goal?.id]);

  if (!goal) return null;

  function addKr() {
    const trimmed = krInput.trim();
    if (trimmed && keyResults.length < 5) {
      setKeyResults((krs) => [...krs, { id: `kr-${Date.now()}`, title: trimmed, progress: 0, done: false }]);
      setKrInput("");
    }
  }

  function updateKrProgress(id: string, progress: number) {
    setKeyResults((krs) => krs.map((kr) => kr.id === id ? { ...kr, progress } : kr));
  }

  function toggleKrDone(id: string) {
    setKeyResults((krs) => krs.map((kr) =>
      kr.id === id ? { ...kr, done: !kr.done, ...(!kr.done ? { progress: 100 } : {}) } : kr
    ));
  }

  function deleteKr(id: string) {
    setKeyResults((krs) => krs.filter((kr) => kr.id !== id));
  }

  function handleSave() {
    if (!title.trim()) return;
    const updatedKrs = keyResults.map((kr) => {
      if (kr.metricType && kr.target) {
        const pct = Math.min(100, Math.round((CURRENT_METRIC_VALUES[kr.metricType] / kr.target) * 100));
        return { ...kr, progress: pct, done: pct >= 100 };
      }
      return kr;
    });
    const progress = updatedKrs.length
      ? Math.round(updatedKrs.reduce((a, kr) => a + kr.progress, 0) / updatedKrs.length)
      : 0;
    onSave({ ...goal, title: title.trim(), dueLabel: dueLabel.trim() || "TBD", status, keyResults: updatedKrs, progress });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Edit goal</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{goal.title}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Goal title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Due + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Due date</label>
                <input
                  type="text"
                  value={dueLabel}
                  onChange={(e) => setDueLabel(e.target.value)}
                  placeholder="e.g. Apr 30"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GoalStatus)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="on_track">On track</option>
                  <option value="watch">Watch</option>
                  <option value="at_risk">At risk</option>
                </select>
              </div>
            </div>

            {/* Key results */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Key results <span className="text-muted-foreground font-normal">({keyResults.length}/5)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Auto-tracked from your stats</span>
              </div>

              {keyResults.length > 0 && (
                <div className="space-y-2.5 mb-3">
                  {keyResults.map((kr) => {
                    const pct = computeKrProgress(kr);
                    const isDone = kr.done || pct >= 100;
                    if (kr.metricType) {
                      const meta = METRIC_META[kr.metricType];
                      const current = CURRENT_METRIC_VALUES[kr.metricType];
                      return (
                        <div key={kr.id} className="bg-muted/40 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <p className={cn("text-xs font-medium", isDone ? "text-muted-foreground" : "text-foreground")}>{meta.label}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">Now: {current}{meta.unit}</span>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[10px] text-muted-foreground">Target:</span>
                                <input
                                  type="number"
                                  value={kr.target ?? ""}
                                  onChange={(e) => setKeyResults((krs) => krs.map((k) =>
                                    k.id === kr.id ? { ...k, target: parseFloat(e.target.value) || 0 } : k
                                  ))}
                                  className="w-14 bg-input-background border border-border rounded px-1.5 py-0.5 text-[10px] text-foreground outline-none focus:border-primary"
                                />
                                <span className="text-[10px] text-muted-foreground">{meta.unit}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-semibold tabular-nums", isDone ? "text-green-400" : "text-foreground")}>{pct}%</span>
                              <button onClick={() => deleteKr(kr.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isDone ? "#4ade80" : "#61afef" }} />
                          </div>
                        </div>
                      );
                    }
                    // Legacy KR (no metric) — keep slider
                    return (
                      <div key={kr.id} className="bg-muted/40 rounded-lg p-3 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleKrDone(kr.id)}
                            className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", kr.done ? "border-green-400 bg-green-400/20" : "border-border")}
                          >
                            {kr.done && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                          </button>
                          <p className={cn("text-xs flex-1 leading-snug", kr.done ? "text-muted-foreground line-through" : "text-foreground")}>{kr.title}</p>
                          <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right flex-shrink-0">{pct}%</span>
                          <button onClick={() => deleteKr(kr.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {!kr.done && (
                          <div className="ml-6 pr-1">
                            <Slider value={[kr.progress]} onValueChange={([val]) => updateKrProgress(kr.id, val)} min={0} max={100} step={5} className="w-full" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {keyResults.length < 5 && (
                <div className="flex gap-2">
                  <select
                    value={krInput}
                    onChange={(e) => setKrInput(e.target.value)}
                    className="flex-1 bg-input-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  >
                    {(Object.keys(METRIC_META) as MetricType[]).map((m) => (
                      <option key={m} value={m}>{METRIC_META[m].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const m = (krInput || "tasks_week") as MetricType;
                      const meta = METRIC_META[m];
                      const current = CURRENT_METRIC_VALUES[m];
                      const pct = Math.min(100, Math.round((current / meta.defaultTarget) * 100));
                      setKeyResults((krs) => [...krs, { id: `kr-${Date.now()}`, title: `${meta.label} ≥ ${meta.defaultTarget}${meta.unit}`, progress: pct, done: pct >= 100, metricType: m, target: meta.defaultTarget }]);
                    }}
                    className="px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function GoalsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-muted/30 border border-dashed border-border rounded-xl px-6 py-8 text-center">
      <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">No goals set yet</p>
      <p className="text-xs text-muted-foreground mb-4">
        Goals help align the team on what matters most — and track progress against it.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="h-3.5 w-3.5" />
        Add first goal
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function GoalsSection({
  goals: initialGoals,
  entityName,
}: {
  goals: Goal[];
  entityName: string;
}) {
  const [goals,    setGoals]    = useState<Goal[]>(initialGoals);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<Goal | null>(null);

  const onTrack  = goals.filter((g) => g.status === "on_track").length;
  const atRisk   = goals.filter((g) => g.status === "at_risk").length;
  const watching = goals.filter((g) => g.status === "watch").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Goals</span>
            {goals.length > 0 && (
              <div className="flex items-center gap-1.5">
                {onTrack > 0  && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-400/12 text-green-400">
                    {onTrack} on track
                  </span>
                )}
                {watching > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-400/12 text-yellow-400">
                    {watching} watch
                  </span>
                )}
                {atRisk > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-400/12 text-red-400">
                    {atRisk} at risk
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add goal
        </button>
      </div>

      {/* Goal list or empty state */}
      {goals.length === 0 ? (
        <GoalsEmptyState onAdd={() => setCreating(true)} />
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => setSelected(goal)} />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <GoalDetailDrawer
        goal={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditing(selected); setSelected(null); }}
      />

      {/* Edit drawer */}
      <EditGoalDrawer
        goal={editing}
        onClose={() => setEditing(null)}
        onSave={(updated) => {
          setGoals((gs) => gs.map((g) => g.id === updated.id ? updated : g));
          setEditing(null);
        }}
      />

      {/* Create drawer */}
      <CreateGoalDrawer
        open={creating}
        entityName={entityName}
        onClose={() => setCreating(false)}
        onCreate={(newGoal) => {
          setGoals((g) => [...g, newGoal]);
          setCreating(false);
        }}
      />
    </>
  );
}
