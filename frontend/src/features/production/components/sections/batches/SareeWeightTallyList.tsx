import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Scale, X } from "lucide-react";
import { T, F } from "../../theme";
import { trimNum } from "../../../../pricing/components/rates-pricing/jariUtils";
import type { SareeTypeRecord } from "../../../../pricing/components/RatesPricingPage";
import { Button, NumberInput } from "../../../../../shared/ui/primitives";

// ── Per-saree weight & material tally ───────────────────────────────────────
// Shared between the batch admin view (every saree in a batch) and the bulk
// order detail page (only that order's sarees) — the same real backend data
// (BatchSareeRow.received{Weight,WarpG,ReshamG,JariReels}, worked out by
// Worker Staff at receipt) compared against the SareeTypeRate standard for
// that row's own saree type, with a per-saree Tally action persisted via
// PATCH /batches/:id/rows/:serial/tally. Admin can correct the received
// weight/material values in the same action, for a scale misread or a typo
// caught during verification.
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

export interface TallyCorrection {
  weight?: number;
  warpG?: number;
  reshamG?: number;
  jariReels?: number;
}

function EditRow({ item, onCancel, onSave, busy }: {
  item: TallyRowItem;
  onCancel: () => void;
  onSave: (correction: TallyCorrection) => void;
  busy: boolean;
}) {
  const [weight, setWeight] = useState(item.actualWeight !== null ? String(item.actualWeight) : "");
  const [warpG, setWarpG] = useState(item.actualWarpG !== null ? String(item.actualWarpG) : "");
  const [reshamG, setReshamG] = useState(item.actualReshamG !== null ? String(item.actualReshamG) : "");
  const [jariReels, setJariReels] = useState(item.actualJariReels !== null ? String(item.actualJariReels) : "");

  const fields = [
    { label: "Weight (g)", value: weight, set: setWeight },
    { label: "Warp (g)", value: warpG, set: setWarpG },
    { label: "Resham (g)", value: reshamG, set: setReshamG },
    { label: "Jari (reels)", value: jariReels, set: setJariReels },
  ];

  const handleSave = () => {
    const correction: TallyCorrection = {};
    if (weight !== "") correction.weight = Number(weight);
    if (warpG !== "") correction.warpG = Number(warpG);
    if (reshamG !== "") correction.reshamG = Number(reshamG);
    if (jariReels !== "") correction.jariReels = Number(jariReels);
    onSave(correction);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
        <div style={{ minWidth: 150 }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{item.sareeId}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{item.weaverName || "—"}</div>
        </div>
        <div style={{ flex: 1, minWidth: 320, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {fields.map(f => (
            <div key={f.label}>
              <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{f.label}</div>
              <NumberInput min={0} value={f.value === "" ? "" : Number(f.value)} onValueChange={v => f.set(v === "" ? "" : String(v))} className="h-9" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button onClick={onCancel} variant="tertiary" size="sm" iconLeft={X} disabled={busy}>Cancel</Button>
        <Button onClick={handleSave} variant="primary" size="sm" iconLeft={CheckCircle2} disabled={busy}>
          Save &amp; Tally
        </Button>
      </div>
    </div>
  );
}

export function SareeWeightTallyList({
  items,
  getSareeTypeByCode,
  onToggleTally,
  onSaveCorrection,
  busyKey,
}: {
  items: TallyRowItem[];
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined;
  onToggleTally: (item: TallyRowItem, tallied: boolean) => void;
  /** Persists an admin correction to the received weight/material values, then marks the row tallied. */
  onSaveCorrection: (item: TallyRowItem, correction: TallyCorrection) => void;
  /** `${batchId}-${serial}` of the row currently being saved, if any. */
  busyKey?: string | null;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

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
        const editing = editingKey === key;

        return (
          <div
            key={item.sareeId}
            style={{
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const,
              background: editing ? "rgba(200,155,71,0.05)" : item.tallied ? "rgba(30,102,64,0.04)" : short ? "rgba(192,57,43,0.03)" : "#FFF",
              border: `1px solid ${editing ? T.antiqueGold : item.tallied ? "rgba(30,102,64,0.18)" : short ? "rgba(192,57,43,0.18)" : T.borderDef}`,
              borderRadius: 12, padding: "12px 16px",
            }}
          >
            {editing ? (
              <EditRow
                item={item}
                busy={busy}
                onCancel={() => setEditingKey(null)}
                onSave={correction => { onSaveCorrection(item, correction); setEditingKey(null); }}
              />
            ) : (
              <>
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
                  <Button
                    onClick={() => setEditingKey(key)}
                    variant="tertiary" size="sm" iconLeft={Pencil}
                    disabled={!weighed || busy}
                    title={!weighed ? "Worker Staff hasn't weighed this saree yet" : "Correct the recorded weight/material"}
                  >
                    Edit
                  </Button>
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
