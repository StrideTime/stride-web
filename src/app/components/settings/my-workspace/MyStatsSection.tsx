import { useState } from "react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";
import { SelectInput } from "../shared/SelectInput";
import { AlertCircle } from "lucide-react";

export function MyStatsSection() {
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [shareAchievements, setShareAchievements] = useState(true);
  const [retention, setRetention] = useState("90");

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          What gets tracked (time, breaks, focus sessions, etc.) is determined by your workspace admin.
          You can control your social preferences and data retention below.
        </p>
      </div>

      {/* Social */}
      <Section title="Social" description="Control how your activity appears to others.">
        <Row label="Show on leaderboard" description="Appear on the workspace leaderboard (if enabled by admin).">
          <Toggle value={showLeaderboard} onChange={setShowLeaderboard} />
        </Row>
        <Row label="Share achievements" description="Display achievement badges on your profile.">
          <Toggle value={shareAchievements} onChange={setShareAchievements} />
        </Row>
      </Section>

      {/* Data retention */}
      <Section title="Data retention" description="How long to keep your detailed stats history.">
        <Row label="Retention period">
          <SelectInput value={retention}
            options={[
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
              { value: "180", label: "6 months" },
              { value: "365", label: "1 year" },
              { value: "0", label: "Forever" },
            ]}
            onChange={setRetention} />
        </Row>
      </Section>
    </div>
  );
}
