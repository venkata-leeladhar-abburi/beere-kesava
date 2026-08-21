import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Scale, X } from "lucide-react";
import { T, F } from "../../theme";
import { trimNum } from "@/features/pricing";
import type { SareeTypeRecord } from "@/features/pricing";
import { Button, NumberInput } from "../../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";

// ── Per-saree weight & material tally ───────────────────────────────────────
// Shared between the batch admin view (every saree in a batch) and the bulk
// order detail page (only that order's sarees) — the same real backend data
// (BatchSareeRow.received{Weight,WarpG,ReshamG,JariReels}, worked out by
// Worker Staff at receipt) compared against the SareeTypeRate standard for
// that row's own saree type, with a per-saree Tally action persisted via
// PATCH /batches/:id/rows/:serial/tally. Admin can correct the received
// weight/material values in the same action, for a scale misread or a typo
// caught during verification.
// Jari is weighed in reels but the floor often counts it in buns —
// same conversion the Materials module uses (1 Reel = 4 Buns), so a value
// entered in buns is stored as reels.
export const BUNS_PER_REEL = 4;
export type JariUnit = "Reels" | "Buns";

export interface TallyRowItem {
  /** null until the saree is allotted an ID (row still shows, keyed by serial). */
  sareeId: string | null;
  serial: number;
  batchId: string;
  weaverName?: string | null;
  /** Row allocation context — shown when the caller has it (batch tally page). */
  weaverLoom?: string | number | null;
  bulkOrderLabel?: string | null;
  qcPassed?: boolean;
  sareeTypeCode: string | null;
  actualWeight: number | null;
  actualWarpG: number | null;
  actualReshamG: number | null;
  actualJariReels: number | null;
  tallied?: boolean;
  talliedBy?: string | null;
  talliedAt?: string | null;
}

export interface TallyCorrection {
  weight?: number;
  warpG?: number;
  reshamG?: number;
  jariReels?: number;
}

// Every measurement column shares one label row of a fixed height, so the
// Jari unit toggle can't push its own column's input out of line with the rest.
const LABEL_ROW_HEIGHT = 18;
const labelRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", height: LABEL_ROW_HEIGHT };
const labelTextStyle: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe,
  textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
};

function EditRow({
  item,
  busy,
  onCancel,
  onSave,
}: {
  item: TallyRowItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (correction: TallyCorrection) => void;
}) {
  const [weight, setWeight] = useState<string>(item.actualWeight !== null ? String(item.actualWeight) : "");
  const [warpG, setWarpG] = useState<string>(item.actualWarpG !== null ? String(item.actualWarpG) : "");
  const [reshamG, setReshamG] = useState<string>(item.actualReshamG !== null ? String(item.actualReshamG) : "");
  const [jariUnit, setJariUnit] = useState<JariUnit>("Reels");
  // Held in whichever unit is selected; converted to reels on save.
  const [jariQty, setJariQty] = useState<string>(item.actualJariReels !== null ? String(item.actualJariReels) : "");

  const fields = [
    { label: "Weight (g)", value: weight, set: setWeight },
    { label: "Warp (g)", value: warpG, set: setWarpG },
    { label: "Resham (g)", value: reshamG, set: setReshamG },
  ];

  // Switching unit re-expresses the quantity already typed rather than
  // silently changing what it means.
  const switchJariUnit = (next: JariUnit) => {
    if (next === jariUnit) return;
    if (jariQty !== "") {
      const n = Number(jariQty);
      setJariQty(String(next === "Buns" ? n * BUNS_PER_REEL : n / BUNS_PER_REEL));
    }
    setJariUnit(next);
  };

  const jariReels = jariQty === "" ? null : jariUnit === "Buns" ? Number(jariQty) / BUNS_PER_REEL : Number(jariQty);

  const handleSave = () => {
    const correction: TallyCorrection = {};
    if (weight !== "") correction.weight = Number(weight);
    if (warpG !== "") correction.warpG = Number(warpG);
    if (reshamG !== "") correction.reshamG = Number(reshamG);
    if (jariReels !== null) correction.jariReels = jariReels;
    onSave(correction);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" as const }}>
        <div style={{ minWidth: 170, paddingTop: LABEL_ROW_HEIGHT + 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>Saree {item.serial}</span>
            {item.sareeId && <EntityCode type="saree" value={item.sareeId} size="sm" />}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
            {item.weaverLoom ? `Loom ${item.weaverLoom} · ` : ""}{item.weaverName || "—"}
          </div>
        </div>
        <div className="flex-1 min-w-[280px]" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, alignItems: "start" }}>
          {fields.map(f => (
            <div key={f.label} style={{ minWidth: 0 }}>
              <div style={{ ...labelRowStyle, marginBottom: 3 }}>
                <span style={labelTextStyle}>{f.label}</span>
              </div>
              <NumberInput min={0} value={f.value === "" ? "" : Number(f.value)} onValueChange={v => f.set(v === "" ? "" : String(v))} className="h-9" />
            </div>
          ))}
          <div style={{ minWidth: 0 }}>
            <div style={{ ...labelRowStyle, justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
              <span style={labelTextStyle}>Jari</span>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {(["Reels", "Buns"] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => switchJariUnit(u)}
                    style={{
                      fontFamily: F.ui, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
                      lineHeight: 1, padding: "3px 6px", borderRadius: 5, cursor: "pointer",
                      background: jariUnit === u ? "rgba(110,15,45,0.08)" : "transparent",
                      border: `1px solid ${jariUnit === u ? T.royalBurgundy : T.borderDef}`,
                      color: jariUnit === u ? T.royalBurgundy : T.taupe,
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <NumberInput min={0} value={jariQty === "" ? "" : Number(jariQty)} onValueChange={v => setJariQty(v === "" ? "" : String(v))} className="h-9" />
            {jariUnit === "Buns" && jariReels !== null && (
              <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginTop: 3 }}>
                = {trimNum(jariReels, 2)} reels <span style={{ color: T.taupe }}>(1 Reel = {BUNS_PER_REEL} Buns)</span>
              </div>
            )}
          </div>
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
        const expectedWeight = rate ? Number(rate.stdWeight) || 0 : 0;
        const expectedWarpG = rate ? Number(rate.warpWeight) || 0 : 0;
        const expectedReshamG = rate ? Number(rate.reshamWeight) || 0 : 0;
        const expectedJariReels = rate ? Number(rate.jariWeight) || 0 : 0;
        const short = weighed && expectedWeight > 0 && (item.actualWeight ?? 0) < expectedWeight * 0.95;
        const key = `${item.batchId}-${item.serial}`;
        const busy = busyKey === key;
        const editing = editingKey === key;

        return (
          <div
            key={`${item.batchId}-${item.serial}`}
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
                <div style={{ minWidth: 170 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>Saree {item.serial}</span>
                    {item.sareeId && <EntityCode type="saree" value={item.sareeId} size="sm" />}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, marginTop: 3 }}>
                    {item.weaverLoom ? `Loom ${item.weaverLoom} · ` : ""}{item.weaverName || "Unassigned"}
                  </div>
                  {item.bulkOrderLabel && (
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 2 }}>↳ Order: {item.bulkOrderLabel}</div>
                  )}
                  {item.qcPassed !== undefined && (
                    <span style={{ display: "inline-block", marginTop: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 800, textTransform: "uppercase" as const, color: item.qcPassed ? T.green : T.taupe, background: item.qcPassed ? "rgba(30,102,64,0.08)" : "rgba(139,112,96,0.08)", borderRadius: 6, padding: "3px 7px" }}>
                      {item.qcPassed ? "QC Passed" : "In Progress"}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-[280px]" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, alignItems: "start" }}>
                  {[
                    // Only Weight is compared against the rate card standard;
                    // the material figures read as plain measured quantities.
                    { label: "Weight", actual: item.actualWeight, expected: expectedWeight, unit: "g", showExpected: true },
                    { label: "Warp", actual: item.actualWarpG, expected: expectedWarpG, unit: "g", showExpected: false },
                    { label: "Resham", actual: item.actualReshamG, expected: expectedReshamG, unit: "g", showExpected: false },
                    { label: "Jari", actual: item.actualJariReels, expected: expectedJariReels, unit: " reels", showExpected: false },
                  ].map(m => {
                    const dp = m.unit === " reels" ? 2 : 0;
                    return (
                      <div key={m.label} style={{ minWidth: 0 }}>
                        <div style={{ ...labelRowStyle, marginBottom: 3 }}><span style={labelTextStyle}>{m.label}</span></div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: short ? T.crimson : T.luxuryBrown }}>
                          {m.actual === null ? "—" : `${trimNum(m.actual, dp)}${m.unit}`}
                          {m.showExpected && m.expected > 0 && (
                            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 400, color: T.taupe }}> / {trimNum(m.expected, dp)}{m.unit}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
