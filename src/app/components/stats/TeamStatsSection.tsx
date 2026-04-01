import { TeamHealthSection } from "./TeamHealthSection";
import { GoalsSection } from "./GoalsSection";
import { TEAM_GOALS } from "../../data/mockIntelligence";
import { useApp } from "../../context/AppContext";
import type { Timeframe } from "./StatsPage";

export function TeamStatsSection({ timeframe: _timeframe }: { timeframe: Timeframe }) {
  const { myTeams } = useApp();
  const isAdmin = myTeams.some((mt) => mt.role === "ADMIN");

  return (
    <div className="space-y-8">
      <TeamHealthSection isAdmin={isAdmin} />
      <GoalsSection goals={TEAM_GOALS} entityName="Frontend team" />
    </div>
  );
}
