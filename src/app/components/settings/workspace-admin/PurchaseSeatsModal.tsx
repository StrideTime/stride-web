import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "../../ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PurchaseSeatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeats: number;
  usedSeats: number;
  pricePerSeat: number;
  onConfirm: (newTotal: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PurchaseSeatsModal({
  open, onOpenChange, currentSeats, usedSeats, pricePerSeat, onConfirm,
}: PurchaseSeatsModalProps) {
  const [newTotal, setNewTotal] = useState(currentSeats);

  // Reset when modal opens
  const handleOpenChange = (o: boolean) => {
    if (o) setNewTotal(currentSeats);
    onOpenChange(o);
  };

  const delta = newTotal - currentSeats;
  const additionalCost = delta * pricePerSeat;
  const canDecrease = newTotal > usedSeats;
  const canIncrease = newTotal < 100;

  function handleConfirm() {
    if (delta === 0) return;
    onConfirm(newTotal);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Purchase seats</DialogTitle>
          <DialogDescription>Adjust the number of seats in your organization plan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current usage */}
          <div className="rounded-lg bg-muted/30 border border-border divide-y divide-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Current seats</span>
              <span className="text-sm font-medium text-foreground">{currentSeats}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Seats used</span>
              <span className="text-sm font-medium text-foreground">{usedSeats}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Available</span>
              <span className="text-sm font-medium text-foreground">{currentSeats - usedSeats}</span>
            </div>
          </div>

          {/* Seat adjuster */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">New seat count</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => canDecrease && setNewTotal((n) => n - 1)}
                disabled={!canDecrease}
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center border transition-all",
                  canDecrease
                    ? "border-border bg-card hover:bg-muted text-foreground"
                    : "border-border/50 bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-20 text-center">
                <span className="text-2xl font-bold text-foreground tabular-nums">{newTotal}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">seats</p>
              </div>
              <button
                onClick={() => canIncrease && setNewTotal((n) => n + 1)}
                disabled={!canIncrease}
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center border transition-all",
                  canIncrease
                    ? "border-border bg-card hover:bg-muted text-foreground"
                    : "border-border/50 bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Price preview */}
          {delta !== 0 ? (
            <div className={cn(
              "rounded-lg p-4 border",
              delta > 0
                ? "bg-primary/5 border-primary/20"
                : "bg-chart-2/5 border-chart-2/20"
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {delta > 0 ? "Additional seats" : "Seats to remove"}
                </span>
                <span className={cn("text-sm font-semibold", delta > 0 ? "text-primary" : "text-chart-2")}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {delta > 0 ? "Additional cost" : "Monthly savings"}
                </span>
                <span className={cn("text-sm font-semibold", delta > 0 ? "text-primary" : "text-chart-2")}>
                  {delta > 0 ? `+$${additionalCost}/mo` : `-$${Math.abs(additionalCost)}/mo`}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-4 border border-border bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">No changes</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={delta === 0}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              delta !== 0
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {delta > 0 ? "Confirm purchase" : delta < 0 ? "Confirm reduction" : "No changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
