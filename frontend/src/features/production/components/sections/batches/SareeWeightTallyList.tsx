import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ImageOff, Pencil, Scale, X } from "lucide-react";
import { T, F } from "../../theme";
import { trimNum } from "@/features/pricing";
import type { SareeTypeRecord } from "@/features/pricing";
import { Button, NumberInput } from "../../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";
import { ImageZoomModal, type ZoomImage } from "../../../../../shared/ui/ImageZoomModal";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { ViewToggle, type DataView } from "../../../../../shared/ui/data/ViewToggle";

function TallyPhotoThumb({ url, sareeId, onView }: { url: string | null | undefined; sareeId: string | null; onView: (image: ZoomImage) => void }) {
  return url ? (
    <button
      type="button"
      onClick={() => onView({ url, label: `Saree photo — ${sareeId ?? "unassigned"}` })}
      title="View saree photo"
      aria-label={`View photo for saree ${sareeId ?? "unassigned"}`}
      style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.borderDef}`, padding: 0, cursor: "pointer", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }}
    />
  ) : (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: `1px dashed ${T.borderDef}`, color: T.taupe, flexShrink: 0 }} title="No photo on file">
      <ImageOff size={13} />
    </span>
  );
}

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
  /** Photo captured by Worker Staff at Receive Sarees — same source as the worker portal's Received History. */
  receivedPhotoUrl?: string | null;
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
  onViewPhoto,
}: {
  item: TallyRowItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (correction: TallyCorrection) => void;
  onViewPhoto: (image: ZoomImage) => void;
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
            <TallyPhotoThumb url={item.receivedPhotoUrl} sareeId={item.sareeId} onView={onViewPhoto} />
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

interface TallyDerived {
  rate: SareeTypeRecord | undefined;
  weighed: boolean;
  expectedWeight: number;
  expectedWarpG: number;
  expectedReshamG: number;
  expectedJariReels: number;
  short: boolean;
  key: string;
  busy: boolean;
}

function TallyCardList({
  items,
  getSareeTypeByCode,
  onToggleTally,
  editingKey,
  setEditingKey,
  onSaveCorrection,
  busyKey,
  setZoomImage,
}: {
  items: TallyRowItem[];
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined;
  onToggleTally: (item: TallyRowItem, tallied: boolean) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  onSaveCorrection: (item: TallyRowItem, correction: TallyCorrection) => void;
  busyKey?: string | null;
  setZoomImage: (image: ZoomImage | null) => void;
}) {
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
            className={
              "flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:px-5 sm:py-4 rounded-2xl border transition-all shadow-xs " +
              (editing
                ? "bg-[#FFFDF9] border-[#C89B47]"
                : item.tallied
                ? "bg-[#F4F9F5] border-[#BCE3C8]"
                : short
                ? "bg-[#FDF4F4] border-[#F5C6C6]"
                : "bg-white border-[#E8DCC4]")
            }
          >
            {editing ? (
              <EditRow
                item={item}
                busy={busy}
                onCancel={() => setEditingKey(null)}
                onSave={correction => { onSaveCorrection(item, correction); setEditingKey(null); }}
                onViewPhoto={setZoomImage}
              />
            ) : (
              <>
                {/* Saree Info Column */}
                <div className="flex flex-col gap-1 min-w-0 sm:min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TallyPhotoThumb url={item.receivedPhotoUrl} sareeId={item.sareeId} onView={setZoomImage} />
                    <span className="font-bold text-sm text-[#6E0F2D] font-serif">Saree {item.serial}</span>
                    {item.sareeId && <EntityCode type="saree" value={item.sareeId} size="sm" />}
                  </div>
                  <div className="text-xs text-[#523F31] font-medium mt-0.5">
                    {item.weaverLoom ? `Loom ${item.weaverLoom} · ` : ""}{item.weaverName || "Unassigned"}
                  </div>
                  {item.bulkOrderLabel && (
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <span>↳ Order: {item.bulkOrderLabel}</span>
                    </div>
                  )}
                  {item.qcPassed !== undefined && (
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${item.qcPassed ? "bg-emerald-100/70 text-emerald-800 border border-emerald-300/50" : "bg-amber-100/70 text-amber-800 border border-amber-300/50"}`}>
                        {item.qcPassed ? "QC PASSED" : "IN PROGRESS"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 my-1 sm:my-0 p-3 sm:p-0 rounded-xl bg-[#FAF6F0]/60 sm:bg-transparent border border-[#E8DCC4]/60 sm:border-none flex-1 min-w-0 sm:min-w-[320px]">
                  {[
                    { label: "WEIGHT", actual: item.actualWeight, expected: expectedWeight, unit: "g", showExpected: true },
                    { label: "WARP", actual: item.actualWarpG, expected: expectedWarpG, unit: "g", showExpected: false },
                    { label: "RESHAM", actual: item.actualReshamG, expected: expectedReshamG, unit: "g", showExpected: false },
                    { label: "JARI", actual: item.actualJariReels, expected: expectedJariReels, unit: " reels", showExpected: false },
                  ].map(m => {
                    const dp = m.unit === " reels" ? 2 : 0;
                    return (
                      <div key={m.label} className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-[#8B7060] uppercase tracking-wider">{m.label}</span>
                        <div className={`text-sm sm:text-base font-bold mt-0.5 ${short ? "text-rose-700" : "text-[#3B2314]"}`}>
                          {m.actual === null ? "—" : `${trimNum(m.actual, dp)}${m.unit}`}
                          {m.showExpected && m.expected > 0 && (
                            <span className="text-xs font-normal text-[#8B7060] ml-1"> / {trimNum(m.expected, dp)}{m.unit}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100/80 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {!weighed ? (
                      <span className="text-xs text-[#8B7060] italic">Not weighed yet</span>
                    ) : short && !item.tallied ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
                        <AlertTriangle size={13} /> Shortfall
                      </span>
                    ) : item.tallied && item.talliedBy ? (
                      <span className="text-xs text-[#8B7060]">Tallied by {item.talliedBy}</span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setEditingKey(key)}
                      variant="tertiary" size="sm" iconLeft={Pencil}
                      disabled={!weighed || busy}
                      className="h-8 sm:h-9 px-3 rounded-xl border border-[#E8DCC4] text-[#6E0F2D] hover:bg-[#6E0F2D]/5 font-bold text-xs cursor-pointer"
                      title={!weighed ? "Worker Staff hasn't weighed this saree yet" : "Correct the recorded weight/material"}
                    >
                      Edit
                    </Button>
                    {item.tallied ? (
                      <Button
                        onClick={() => onToggleTally(item, false)}
                        variant="secondary" size="sm" iconLeft={CheckCircle2}
                        disabled={busy}
                        className="h-8 sm:h-9 px-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs cursor-pointer"
                      >
                        Tallied
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onToggleTally(item, true)}
                        variant="secondary" size="sm" iconLeft={Scale}
                        disabled={!weighed || busy}
                        className="h-8 sm:h-9 px-3.5 rounded-xl border border-[#6E0F2D] text-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title={!weighed ? "Worker Staff hasn't weighed this saree yet" : undefined}
                      >
                        Tally
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function tallyKey(item: TallyRowItem): string {
  return `${item.batchId}-${item.serial}`;
}

function deriveTally(item: TallyRowItem, getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined, busyKey: string | null | undefined): TallyDerived {
  const rate = item.sareeTypeCode ? getSareeTypeByCode(item.sareeTypeCode) : undefined;
  const weighed = item.actualWeight !== null;
  const expectedWeight = rate ? Number(rate.stdWeight) || 0 : 0;
  const expectedWarpG = rate ? Number(rate.warpWeight) || 0 : 0;
  const expectedReshamG = rate ? Number(rate.reshamWeight) || 0 : 0;
  const expectedJariReels = rate ? Number(rate.jariWeight) || 0 : 0;
  const short = weighed && expectedWeight > 0 && (item.actualWeight ?? 0) < expectedWeight * 0.95;
  const key = tallyKey(item);
  const busy = busyKey === key;
  return { rate, weighed, expectedWeight, expectedWarpG, expectedReshamG, expectedJariReels, short, key, busy };
}

function TallyTableView({
  items,
  getSareeTypeByCode,
  onToggleTally,
  editingKey,
  setEditingKey,
  onSaveCorrection,
  busyKey,
  setZoomImage,
}: {
  items: TallyRowItem[];
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined;
  onToggleTally: (item: TallyRowItem, tallied: boolean) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  onSaveCorrection: (item: TallyRowItem, correction: TallyCorrection) => void;
  busyKey?: string | null;
  setZoomImage: (image: ZoomImage | null) => void;
}) {
  const columns: ColumnDef<TallyRowItem>[] = [
    {
      id: "saree", header: "Saree", accessor: item => item.serial, priority: 1,
      cell: (_v, item) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TallyPhotoThumb url={item.receivedPhotoUrl} sareeId={item.sareeId} onView={setZoomImage} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>Saree {item.serial}</span>
              {item.sareeId && <EntityCode type="saree" value={item.sareeId} size="sm" />}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              {item.weaverLoom ? `Loom ${item.weaverLoom} · ` : ""}{item.weaverName || "Unassigned"}
            </div>
            {item.bulkOrderLabel && (
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: "#047857" }}>↳ Order: {item.bulkOrderLabel}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "qc", header: "QC", accessor: item => item.qcPassed ?? null, priority: 3,
      cell: (_v, item) => item.qcPassed === undefined ? <span style={{ color: T.taupe }}>—</span> : (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${item.qcPassed ? "bg-emerald-100/70 text-emerald-800 border border-emerald-300/50" : "bg-amber-100/70 text-amber-800 border border-amber-300/50"}`}>
          {item.qcPassed ? "QC PASSED" : "IN PROGRESS"}
        </span>
      ),
    },
    {
      id: "weight", header: "Weight (g)", accessor: item => item.actualWeight,
      cell: (_v, item) => {
        const { expectedWeight, short } = deriveTally(item, getSareeTypeByCode, busyKey);
        return (
          <span style={{ color: short ? "#be123c" : T.luxuryBrown, fontWeight: 700 }}>
            {item.actualWeight === null ? "—" : trimNum(item.actualWeight, 0)}
            {expectedWeight > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: T.taupe }}> / {trimNum(expectedWeight, 0)}g</span>}
          </span>
        );
      },
    },
    {
      id: "warp", header: "Warp (g)", accessor: item => item.actualWarpG, priority: 3,
      cell: (_v, item) => <span>{item.actualWarpG === null ? "—" : trimNum(item.actualWarpG, 0)}</span>,
    },
    {
      id: "resham", header: "Resham (g)", accessor: item => item.actualReshamG, priority: 3,
      cell: (_v, item) => <span>{item.actualReshamG === null ? "—" : trimNum(item.actualReshamG, 0)}</span>,
    },
    {
      id: "jari", header: "Jari (reels)", accessor: item => item.actualJariReels, priority: 3,
      cell: (_v, item) => <span>{item.actualJariReels === null ? "—" : trimNum(item.actualJariReels, 2)}</span>,
    },
    {
      id: "status", header: "Status", accessor: item => item.tallied ?? false, type: "status",
      cell: (_v, item) => {
        const { weighed, short } = deriveTally(item, getSareeTypeByCode, busyKey);
        if (!weighed) return <span style={{ fontSize: 12, color: T.taupe, fontStyle: "italic" }}>Not weighed yet</span>;
        if (short && !item.tallied) return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#be123c" }}><AlertTriangle size={13} /> Shortfall</span>;
        if (item.tallied && item.talliedBy) return <span style={{ fontSize: 12, color: T.taupe }}>Tallied by {item.talliedBy}</span>;
        return <span style={{ color: T.taupe }}>—</span>;
      },
    },
    {
      id: "action", header: "Action", type: "actions", accessor: () => null,
      cell: (_v, item) => {
        const { weighed, busy, key } = deriveTally(item, getSareeTypeByCode, busyKey);
        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Button
              onClick={() => setEditingKey(editingKey === key ? null : key)}
              variant="tertiary" size="sm" iconLeft={Pencil}
              disabled={!weighed || busy}
              title={!weighed ? "Worker Staff hasn't weighed this saree yet" : "Correct the recorded weight/material"}
            >
              Edit
            </Button>
            {item.tallied ? (
              <Button onClick={() => onToggleTally(item, false)} variant="secondary" size="sm" iconLeft={CheckCircle2} disabled={busy}>
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
        );
      },
    },
  ];

  const expandedIds = editingKey ? new Set([editingKey]) : new Set<string>();

  return (
    <DataTable
      view="table"
      columns={columns}
      data={items}
      getRowId={tallyKey}
      emptyTitle="No sarees to tally yet."
      expandedIds={expandedIds}
      renderExpandedRow={item => {
        const { busy } = deriveTally(item, getSareeTypeByCode, busyKey);
        return (
          <div style={{ padding: 16, background: "#FFFDF9" }}>
            <EditRow
              item={item}
              busy={busy}
              onCancel={() => setEditingKey(null)}
              onSave={correction => { onSaveCorrection(item, correction); setEditingKey(null); }}
              onViewPhoto={setZoomImage}
            />
          </div>
        );
      }}
    />
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
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const [view, setView] = useState<DataView>("table");

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center" as const, padding: "28px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        No sarees to tally yet.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <ViewToggle value={view} onChange={setView} />
      </div>
      {view === "table" ? (
        <TallyTableView
          items={items}
          getSareeTypeByCode={getSareeTypeByCode}
          onToggleTally={onToggleTally}
          editingKey={editingKey}
          setEditingKey={setEditingKey}
          onSaveCorrection={onSaveCorrection}
          busyKey={busyKey}
          setZoomImage={setZoomImage}
        />
      ) : (
        <TallyCardList
          items={items}
          getSareeTypeByCode={getSareeTypeByCode}
          onToggleTally={onToggleTally}
          editingKey={editingKey}
          setEditingKey={setEditingKey}
          onSaveCorrection={onSaveCorrection}
          busyKey={busyKey}
          setZoomImage={setZoomImage}
        />
      )}
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </>
  );
}
