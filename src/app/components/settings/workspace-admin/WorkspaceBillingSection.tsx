import { ChevronRight, User, ArrowRight, Plus } from "lucide-react";
import { useApp } from "../../../context/AppContext";

export function WorkspaceBillingSection() {
  const { activeWorkspace, setSettingsSection } = useApp();

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
            <activeWorkspace.Icon className="h-3.5 w-3.5" style={{ color: activeWorkspace.color }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{activeWorkspace.name} &mdash; Organization plan</h2>
            <p className="text-xs text-muted-foreground">Business &middot; 13 seats</p>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Active</span>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm text-foreground">Business &middot; $18/seat/mo</p>
              <p className="text-xs text-muted-foreground mt-0.5">$234/mo &middot; Renews May 1, 2025</p>
            </div>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm text-foreground">Seat usage</p>
              <p className="text-xs text-muted-foreground mt-0.5">13 of 20 seats used</p>
            </div>
            <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: "65%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal billing callout ── */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 mb-5">
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">This is separate from your personal plan</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This plan covers {activeWorkspace.name} and all its members. Your personal Stride account has its own plan and payment method.
            </p>
            <div className="flex flex-col gap-1.5 mt-2.5">
              <button
                onClick={() => setSettingsSection("billing")}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors group"
              >
                <span>Go to personal billing</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
              <button className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors group">
                <span className="h-4 w-4 rounded flex items-center justify-center bg-primary/10">
                  <Plus className="h-2.5 w-2.5" />
                </span>
                <span>Create another organization</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
