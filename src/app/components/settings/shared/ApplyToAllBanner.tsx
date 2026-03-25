import { useState } from "react";
import { Link2, Unlink, Settings, Check, ChevronDown } from "lucide-react";
import { cn } from "../../ui/utils";
import { useApp } from "../../../context/AppContext";
import { WORKSPACES, WORKSPACE_MEMBERSHIPS } from "../../../data/mockData";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkspaceSync {
  workspaceId: string;
  synced: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ApplyToAllBannerProps {
  /** Label shown in the modal to identify what's being synced */
  sectionLabel?: string;
  /** Compact mode renders as an inline bar inside a card instead of a standalone card */
  compact?: boolean;
}

export function ApplyToAllBanner({ sectionLabel, compact }: ApplyToAllBannerProps = {}) {
  const { activeWorkspace } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // All workspaces the user belongs to
  const myWorkspaces = WORKSPACES.filter((ws) =>
    WORKSPACE_MEMBERSHIPS.some((wm) => wm.workspaceId === ws.id && wm.userId === "u1")
  );
  const otherWorkspaces = myWorkspaces.filter((ws) => ws.id !== activeWorkspace.id);

  // Sync state — start with all synced
  const [syncState, setSyncState] = useState<WorkspaceSync[]>(() =>
    otherWorkspaces.map((ws) => ({ workspaceId: ws.id, synced: true }))
  );

  const allSynced = syncState.every((s) => s.synced);
  const syncedCount = syncState.filter((s) => s.synced).length;
  const totalOther = otherWorkspaces.length;

  function toggleSync(wsId: string) {
    setSyncState((prev) => prev.map((s) => s.workspaceId === wsId ? { ...s, synced: !s.synced } : s));
  }

  function syncAll() {
    setSyncState((prev) => prev.map((s) => ({ ...s, synced: true })));
  }

  function unsyncAll() {
    setSyncState((prev) => prev.map((s) => ({ ...s, synced: false })));
  }

  if (otherWorkspaces.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={cn(
          "w-full flex items-center gap-2.5 transition-colors text-left hover:bg-muted/30",
          compact
            ? "px-5 py-2.5 border-t border-border"
            : cn("rounded-lg border px-4 py-3",
                allSynced ? "border-chart-2/20 bg-chart-2/[0.03]" : syncedCount === 0 ? "border-chart-4/20 bg-chart-4/[0.03]" : "border-border bg-card")
        )}
      >
        {allSynced ? (
          <Link2 className={cn("flex-shrink-0", compact ? "h-3 w-3 text-chart-2" : "h-4 w-4 text-chart-2")} />
        ) : syncedCount === 0 ? (
          <Unlink className={cn("flex-shrink-0", compact ? "h-3 w-3 text-chart-4" : "h-4 w-4 text-chart-4")} />
        ) : (
          <Link2 className={cn("flex-shrink-0", compact ? "h-3 w-3 text-muted-foreground" : "h-4 w-4 text-muted-foreground")} />
        )}
        <p className={cn(
          "flex-1 min-w-0",
          compact ? "text-xs" : "text-sm font-medium",
          allSynced ? "text-chart-2" : syncedCount === 0 ? "text-chart-4" : "text-muted-foreground"
        )}>
          {allSynced
            ? "Synced across all workspaces"
            : syncedCount === 0
              ? `Only applies to ${activeWorkspace.name}`
              : `Synced with ${syncedCount} of ${totalOther}`
          }
        </p>
        <span className={cn("text-muted-foreground flex-shrink-0", compact ? "text-xs" : "text-xs")}>Manage</span>
      </button>

      {/* ── Sync management modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync {sectionLabel ? `${sectionLabel} settings` : "settings"}</DialogTitle>
            <DialogDescription>
              Choose which workspaces share {sectionLabel ? `your ${sectionLabel.toLowerCase()} settings` : "these settings"} with {activeWorkspace.name}.
              Synced workspaces will mirror any changes you make here.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {/* Current workspace — always the source */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${activeWorkspace.color}15` }}>
                <activeWorkspace.Icon className="h-3.5 w-3.5" style={{ color: activeWorkspace.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activeWorkspace.name}</p>
                <p className="text-xs text-primary">Source</p>
              </div>
            </div>

            {/* Other workspaces */}
            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
              {otherWorkspaces.map((ws) => {
                const sync = syncState.find((s) => s.workspaceId === ws.id);
                const isSynced = sync?.synced ?? false;
                return (
                  <button
                    key={ws.id}
                    onClick={() => toggleSync(ws.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${ws.color}15` }}>
                      <ws.Icon className="h-3.5 w-3.5" style={{ color: ws.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{ws.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ws.type === "ORGANIZATION" ? "Organization" : "Personal workspace"}
                      </p>
                    </div>
                    <div className={cn(
                      "h-5 w-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                      isSynced ? "bg-primary border-primary" : "border-border"
                    )}>
                      {isSynced && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={syncAll}
                disabled={allSynced}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-center",
                  allSynced
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                )}
              >
                Sync all
              </button>
              <button
                onClick={unsyncAll}
                disabled={syncedCount === 0}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-center",
                  syncedCount === 0
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Unsync all
              </button>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
