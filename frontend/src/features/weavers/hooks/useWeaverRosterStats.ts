import { useQuery } from "@tanstack/react-query";
import {
  weaversApi,
  type BackendWeaver,
  type BackendWeaverStats,
  type WeaverStatsRange,
} from "../../../shared/api/weavers";
import type { Status } from "../components/types";

/**
 * Derives the directory status from live stats.
 *
 * Every weaver surface used to inline `activeBatchRowsCount > 0 ? "active" :
 * "idle"`, which made the "qc" arm of the Status union unreachable — the
 * "Submitted — Waiting Quality Check" filter pill matched nobody and the
 * workforce donut never drew that slice. `awaitingQcCount` supplies the
 * missing state.
 *
 * Precedence is deliberate: a weaver with rows still on the loom reads as
 * "currently weaving" even if some finished pieces are queued for inspection.
 * "qc" therefore means "everything they had is handed in and waiting on us",
 * which is the state that actually wants someone to act.
 */
export function weaverStatusFromStats(stats: BackendWeaverStats | undefined): Status {
  if (!stats) return "idle";
  if (stats.activeBatchRowsCount > 0) return "active";
  if (stats.awaitingQcCount > 0) return "qc";
  return "idle";
}

export interface WeaverRosterStats {
  roster: BackendWeaver[];
  statsById: Map<string, BackendWeaverStats>;
  allStats: BackendWeaverStats[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * The roster plus every weaver's stats, in two requests total.
 *
 * Each weaver surface previously ran its own `Promise.all(roster.map(w =>
 * getStats(w.id)))` — one HTTP request per weaver, repeated per component, so
 * a 200-weaver roster meant 200 requests on the directory and 200 more on the
 * analytics section of the same page. GET /weavers/stats returns them all at
 * once.
 *
 * `range` scopes the production/QC aggregates to a window; omit it for
 * all-time figures.
 */
export function useWeaverRosterStats(range?: WeaverStatsRange): WeaverRosterStats {
  const {
    data: weaversRes,
    isLoading: rosterLoading,
    isError: rosterError,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: ["weavers-roster"],
    queryFn: () => weaversApi.list(),
  });

  const {
    data: statsList,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["weavers-all-stats", range?.from ?? null, range?.to ?? null],
    queryFn: () => weaversApi.getAllStats(range),
  });

  const roster = weaversRes?.items ?? [];
  const allStats = statsList ?? [];

  return {
    roster,
    allStats,
    statsById: new Map(allStats.map(s => [s.weaverId, s])),
    isLoading: rosterLoading || statsLoading,
    isError: rosterError || statsError,
    refetch: () => { void refetchRoster(); void refetchStats(); },
  };
}

/**
 * "Last active" as a short relative label. Every weaver row used to render a
 * literal "—" here because no endpoint exposed the timestamp; `lastActivityAt`
 * is the latest of their QC inspections and saree receipts.
 */
export function formatLastActive(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
