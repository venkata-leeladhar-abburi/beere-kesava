// ── Composes the performance leaderboard + QC panel with the activity feed ──
import { PerformancePanel } from "./leaderboard/PerformancePanel";
import { ActivitiesPanel } from "./leaderboard/ActivitiesPanel";

export function LeaderboardAndQC({ onActivities, onNavigate }: { onActivities: () => void; onNavigate?: (tab: string) => void }) {
  return (
    <div style={{ padding: "36px 48px 0" }}>
      <PerformancePanel onNavigate={onNavigate} />
      <ActivitiesPanel onActivities={onActivities} />
    </div>
  );
}
