import React from "react";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import { T, F } from "../../theme";
import { trimNum } from "../../../../pricing/components/rates-pricing/jariUtils";
import type { SareeTypeRecord } from "../../../../pricing/components/RatesPricingPage";
import { Button } from "../../../../../shared/ui/primitives";

// ── Per-saree weight & material tally ───────────────────────────────────────
// Shared between the batch admin view (every saree in a batch) and the bulk
// order detail page (only that order's sarees) — the same real backend data
// (BatchSareeRow.received{Weight,WarpG,ReshamG,JariReels}, worked out by
// Worker Staff at receipt) compared against the SareeTypeRate standard for
// that row's own saree type, with a per-saree Tally action persisted via
// PATCH /batches/:id/rows/:serial/tally.
export interface TallyRowItem {
  sareeId: string;
  serial: number;
  batchId: string;
  weaverName?: string | null;
  sareeTypeCode: string | null;
  actualWeight: number | null;
  actualWarpG: number | null;
  actualReshamG: number | null;
  actualJariReels: number | null;
  tallied: boolean;
  talliedBy: string | null;
  talliedAt: string | null;
}

export function SareeWeightTallyList({
  items,
  getSareeTypeByCode,
  onToggleTally,
  busyKey,
}: {
  items: TallyRowItem[];
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined;
  onToggleTally: (item: TallyRowItem, tallied: boolean) => void;
  /** `${batchId}-${serial}` of the row currently being saved, if any. */
  busyKey?: string | null;
}) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center" as const, padding: "28px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        No sarees to tally yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(item => {
        const rate = item.sareeTypeCode ? getSareeTypeByCode(item.sareeTypeCode) : undefined;
        const weighed = item.actualWeight !== null;
        const expectedWeight = rate ? parseFloat(rate.stdWeight) || 0 : 0;
        const expectedWarpG = rate ? parseFloat(rate.warpWeight) || 0 : 0;
        const expectedReshamG = rate ? parseFloat(rate.reshamWeight) || 0 : 0;
        const expectedJariReels = rate ? parseFloat(rate.jariWeight) || 0 : 0;
        const short = weighed && expectedWeight > 0 && (item.actualWeight ?? 0) < expectedWeight * 0.95;
        const key = `${item.batchId}-${item.serial}`;
        const busy = busyKey === key;

        return (
          <div
            key={item.sareeId}
            style={{
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const,
              background: item.tallied ? "rgba(30,102,64,0.04)" : short ? "rgba(192,57,43,0.03)" : "#FFF",
              border: `1px solid ${item.tallied ? "rgba(30,102,64,0.18)" : short ? "rgba(192,57,43,0.18)" : T.borderDef}`,
              borderRadius: 12, padding: "12px 16px",
            }}
          >
            <div style={{ minWidth: 150 }}>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{item.sareeId}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{item.weaverName || "—"}</div>
            </div>

            <div style={{ flex: 1, minWidth: 280, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Weight", actual: item.actualWeight, expected: expectedWeight, unit: "g" },
                { label: "Warp", actual: item.actualWarpG, expected: expectedWarpG, unit: "g" },
                { label: "Resham", actual: item.actualReshamG, expected: expectedReshamG, unit: "g" },
                { label: "Jari", actual: item.actualJariReels, expected: expectedJariReels, unit: "reels" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{m.label}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: short ? T.crimson : T.luxuryBrown }}>
                    {m.actual === null ? "—" : trimNum(m.actual, m.unit === "reels" ? 2 : 0)}
                    <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 400, color: T.taupe }}> / {trimNum(m.expected, m.unit === "reels" ? 2 : 0)}{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              {!weighed ? (
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" as const }}>Not weighed yet</span>
              ) : short && !item.tallied ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>
                  <AlertTriangle size={13} /> Shortfall
                </span>
              ) : null}
              {item.tallied ? (
                <Button
                  onClick={() => onToggleTally(item, false)}
                  variant="secondary" size="sm" iconLeft={CheckCircle2}
                  disabled={busy}
                  className="rounded-full bg-[rgba(30,102,64,0.10)] border-[rgba(30,102,64,0.24)] text-[#1E6640] hover:bg-[rgba(30,102,64,0.16)]"
                >
                  Tallied
                </Button>
              ) : (
                <Button
                  onClick={() => onToggleTally(item, true)}
                  variant="secondary" size="sm" iconLeft={Scale}
                  disabled={!weighed || busy}
                  title={!weighed ? "Worker Staff hasn't weighed this saree yet" : undefined}
                >
                  Tally
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
