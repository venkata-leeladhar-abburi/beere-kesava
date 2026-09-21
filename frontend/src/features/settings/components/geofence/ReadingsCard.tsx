import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { F, T, SectionCard } from "../labelSettings/primitives";
import { StatusPill } from "./primitives";
import { geofenceApi, type GeofenceDecision, type GeofenceReadings } from "../../../../shared/api/geofence";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { DataTable } from "../../../../shared/ui/data";
import type { ColumnDef } from "../../../../shared/ui/data/columns";
import type { GeofenceReadingRow } from "../../../../shared/api/geofence";

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "WORKER", label: "Worker Staff" },
  { value: "WEAVER", label: "Weavers" },
  { value: "SHOP", label: "Shop Staff" },
  { value: "ACCOUNTANT", label: "Accountants" },
];

const DECISION_COPY: Record<GeofenceDecision, { label: string; tone: "good" | "warn" | "bad" | "muted" }> = {
  ALLOWED: { label: "At the premises", tone: "good" },
  OUTSIDE: { label: "Too far away", tone: "bad" },
  INACCURATE: { label: "Position too vague", tone: "warn" },
  UNAVAILABLE: { label: "No location given", tone: "warn" },
  EXEMPT: { label: "Exempt", tone: "muted" },
  NOT_ENFORCED: { label: "Not checked", tone: "muted" },
  NO_SITE_CONFIGURED: { label: "No site set up", tone: "muted" },
};

const metres = (value: number | null) => (value == null ? "—" : `${Math.round(value)} m`);

/**
 * The sentence this whole screen exists to produce.
 *
 * A distribution tells you what happened; this tells you what switching to
 * blocking would do to your staff tomorrow. It is the difference between a
 * decision someone can make and a chart they have to interpret.
 */
function Headline({ data }: { data: GeofenceReadings }) {
  const { summary } = data;

  if (summary.total === 0) {
    return (
      <div style={{ ...headlineStyle, background: "rgba(110,15,45,0.05)", color: T.luxuryBrown }}>
        No location-checked sign-ins recorded yet. Once staff start signing in, their distance from
        the premises is recorded here — that is what tells you whether {data.radiusMeters} m is the
        right limit.
      </div>
    );
  }

  const refused = summary.wouldBeRefusedIfEnforced;
  const tone = refused === 0 ? T.green : refused / summary.total > 0.1 ? T.crimson : "#8A6D1F";

  return (
    <div style={{ ...headlineStyle, background: "rgba(110,15,45,0.05)", color: T.luxuryBrown }}>
      <span style={{ color: tone, fontWeight: 700 }}>
        {refused} of the last {summary.total} sign-ins
      </span>{" "}
      would have been refused if blocking were switched on
      {data.siteLabel ? ` for ${data.siteLabel}` : ""} at the current {data.radiusMeters} m limit.
      {summary.medianDistanceMeters != null && (
        <>
          {" "}The typical sign-in was <strong>{metres(summary.medianDistanceMeters)}</strong> from
          the pin, with the phone able to place itself to about{" "}
          <strong>{metres(summary.medianAccuracyMeters)}</strong>.
        </>
      )}
      {summary.inaccurate > 0 && (
        <>
          {" "}
          <strong>{summary.inaccurate}</strong> were refused for a vague position rather than for
          being far away — if that number is high, the accuracy limit is too strict for how these
          phones behave indoors.
        </>
      )}
    </div>
  );
}

function Distribution({ data }: { data: GeofenceReadings }) {
  const max = Math.max(1, ...data.buckets.map((bucket) => bucket.count));

  return (
    <div style={{ marginTop: 18 }}>
      {data.buckets.map((bucket) => {
        // A band entirely inside the radius is where you want sign-ins to be;
        // shading it makes the limit readable straight off the chart.
        const insideRadius = bucket.toMeters != null && bucket.toMeters <= data.radiusMeters;
        return (
          <div key={bucket.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0" }}>
            <div style={{ width: 110, fontFamily: F.ui, fontSize: 12.5, color: T.taupe, flexShrink: 0 }}>
              {bucket.label}
            </div>
            <div style={{ flex: 1, minWidth: 0, height: 20, background: "rgba(110,15,45,0.06)", borderRadius: 6 }}>
              <div
                style={{
                  width: `${(bucket.count / max) * 100}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: insideRadius ? T.green : bucket.fromMeters === null ? T.taupe : T.royalBurgundy,
                  minWidth: bucket.count > 0 ? 3 : 0,
                }}
              />
            </div>
            <div
              style={{
                width: 34,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                fontFamily: F.ui,
                fontSize: 12.5,
                color: T.luxuryBrown,
                flexShrink: 0,
              }}
            >
              {bucket.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReadingsCard() {
  const [days, setDays] = useState(30);
  const [role, setRole] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["geofence", "readings", days, role],
    queryFn: () => geofenceApi.readings({ days, role: role || undefined, limit: 200 }),
  });

  return (
    <SectionCard
      icon={Activity}
      title="What the location check has been seeing"
      subtitle="Read this before switching any role to blocking."
    >
      <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 16 }}>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={filterStyle}>
          {ROLE_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={filterStyle}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Loading sign-in locations" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && (
        <>
          <Headline data={data} />
          {data.summary.total > 0 && <Distribution data={data} />}

          {data.rows.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <DataTable
                columns={READING_COLUMNS}
                data={data.rows}
                getRowId={(row) => row.id}
                caption="Recorded sign-in locations"
                density="compact"
                responsive
              />
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

const READING_COLUMNS: ColumnDef<GeofenceReadingRow>[] = [
  {
    id: "staffName",
    header: "Who",
    accessor: (row) => row.staffName ?? "—",
    priority: 1,
    cell: (_value, row) => (
      <span>
        {row.staffName ?? "—"}
        {row.role && <span style={{ color: T.taupe, fontSize: 12 }}> · {row.role}</span>}
      </span>
    ),
  },
  {
    id: "at",
    header: "When",
    type: "datetime",
    accessor: (row) => row.at,
    priority: 2,
  },
  {
    id: "distanceMeters",
    header: "Distance",
    type: "number",
    accessor: (row) => row.distanceMeters,
    priority: 2,
    cell: (_value, row) => metres(row.distanceMeters),
  },
  {
    id: "accuracyMeters",
    header: "Accuracy",
    type: "number",
    accessor: (row) => row.accuracyMeters,
    priority: 2,
    cell: (_value, row) =>
      row.accuracyMeters == null ? "—" : `±${Math.round(row.accuracyMeters)} m`,
  },
  {
    id: "decision",
    header: "Result",
    type: "status",
    accessor: (row) => row.decision,
    priority: 2,
    cell: (_value, row) => {
      const decision = row.decision ? DECISION_COPY[row.decision] : null;
      return (
        <span>
          {decision && <StatusPill tone={decision.tone}>{decision.label}</StatusPill>}
          {/* An OBSERVE-mode refusal did not actually stop anyone. Saying so
              inline keeps the table honest about what the person experienced. */}
          {row.mode === "OBSERVE" && row.decision !== "ALLOWED" && (
            <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginLeft: 7 }}>
              (allowed — recording only)
            </span>
          )}
        </span>
      );
    },
  },
];

const headlineStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: "16px 18px",
  fontFamily: F.ui,
  fontSize: 14,
  lineHeight: 1.6,
};


const filterStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: `1px solid ${T.borderDef}`,
  background: "#FFFFFF",
  fontFamily: F.ui,
  fontSize: 13,
  color: T.luxuryBrown,
};
