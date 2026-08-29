// ── Composes the performance leaderboard + QC panel with the activity feed ──
import { PerformancePanel } from "./leaderboard/PerformancePanel";
import { ActivitiesPanel } from "./leaderboard/ActivitiesPanel";

export function LeaderboardAndQC({ onActivities, onNavigate }: { onActivities: () => void; onNavigate?: (tab: string) => void }) {
  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <PerformancePanel onNavigate={onNavigate} />
      <ActivitiesPanel onActivities={onActivities} />
    </div>
  );
}
