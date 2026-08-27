import React from "react";
import { Factory, PackageOpen, ChevronDown, ChevronRight } from "lucide-react";
import { SareeRow } from "../../contexts/BatchContext";
import { T, F, Pip } from "./constants";
import { pipColor } from "./PickerModals";
import type { WeaverOption } from "../useBatchFormHandlers";
import type { IssuedMaterialItem, MaterialIssueRecord } from "@/features/materials";
import { formatDate } from "../../../../shared/ui/date";
import { EntityCode } from "../../../../shared/ui/domain";

// ── Cell styles for the per-group issued-materials table ─────────────────────
const mth: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left", fontFamily: F.ui, fontSize: 10.5,
  fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px",
  borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap",
};
const mtd: React.CSSProperties = {
  padding: "9px 12px", verticalAlign: "top", fontFamily: F.ui, fontSize: 12.5,
  color: T.luxuryBrown, borderBottom: "1px solid rgba(110,15,45,0.06)",
};

const TYPE_TINT: Record<string, { fg: string; bg: string }> = {
  Warp:   { fg: "#7A5010", bg: "rgba(196,146,58,0.14)" },
  Resham: { fg: "#7A5E1C", bg: "rgba(200,155,71,0.13)" },
  Jari:   { fg: T.royalBurgundy, bg: "rgba(110,15,45,0.08)" },
};

/** The descriptive half of a material line — subtype, colour, grade, or the GRN line's own description. */
function describe(m: IssuedMaterialItem): string {
  if (m.materialType === "Warp") return [m.warpSubtype, m.description].filter(Boolean).join(" · ");
  if (m.materialType === "Resham") return m.description || m.jariColor || "";
  return [m.jariType, m.jariGrade, m.jariColor, m.description].filter(Boolean).join(" · ");
}

/** Roll every issued line up per material type, so a group's totals read at a glance. */
function totalsByType(records: MaterialIssueRecord[]) {
  const acc = new Map<string, { qty: number; unit: string }>();
  for (const r of records) {
    for (const m of r.materials) {
      const key = `${m.materialType}|${m.unit}`;
      const prev = acc.get(key);
      acc.set(key, { qty: (prev?.qty ?? 0) + m.quantity, unit: m.unit });
    }
  }
  return Array.from(acc.entries()).map(([key, v]) => ({ type: key.split("|")[0], ...v }));
}

/** Every distinct parent GRN batch this group's materials were received under. */
function grnBatchesFor(records: MaterialIssueRecord[]): string[] {
  const seen = new Set<string>();
  for (const r of records) {
    for (const m of r.materials) {
      if (m.grnBatchId) seen.add(m.grnBatchId);
    }
  }
  return Array.from(seen);
}

const STATUS_TINT: Record<MaterialIssueRecord["status"], { label: string; fg: string; bg: string }> = {
  "pending-signature": { label: "Pending signature", fg: T.amber, bg: "rgba(183,121,31,0.10)" },
  signed:              { label: "Signed",            fg: T.green, bg: "rgba(30,102,64,0.10)" },
  cancelled:           { label: "Cancelled",         fg: T.red,   bg: "rgba(192,57,43,0.10)" },
};

// ── One recipient group: weaver+loom, or a factory loom ──────────────────────
function GroupCard({
  row, records, weavers,
}: { row: SareeRow; records: MaterialIssueRecord[]; weavers: WeaverOption[] }) {
  const [open, setOpen] = React.useState(true);
  const weaverForRow = row.weaverId ? weavers.find(x => x.id === row.weaverId) : undefined;
  const totals = totalsByType(records);
  const lineCount = records.reduce((n, r) => n + r.materials.length, 0);
  const grnBatches = grnBatchesFor(records);

  return (
    <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
      {/* Header: who / which loom + rolled-up totals */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "13px 16px", borderBottom: `1px solid ${T.borderDef}`, background: "rgba(245,232,208,0.35)" }}>
        {row.weaverId ? (
          <>
            <Pip initials={weaverForRow?.initials ?? row.weaverInitials ?? "?"} bg={pipColor(row.weaverId)} size={30} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>
                {weaverForRow?.name ?? row.weaverName ?? row.weaverCode}
              </span>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                {records[0]?.weaverCode ? `${records[0].weaverCode} · ` : ""}Weaver
              </span>
            </div>
            {row.weaverLoom && (
              <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.antiqueGold, background: "rgba(200,155,71,0.1)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}>
                Loom {row.weaverLoom}
              </span>
            )}
          </>
        ) : (
          <>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={15} color={T.royalBurgundy} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{row.factoryLoomNumber}</span>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Factory loom</span>
            </div>
          </>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {grnBatches.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {grnBatches.length === 1 ? "GRN" : "GRNs"}
              </span>
              {grnBatches.map(g => (
                <EntityCode key={g} type="goodsReceipt" value={g} size="sm" copyable />
              ))}
            </div>
          )}
          {totals.map(t => (
            <span key={`${t.type}-${t.unit}`} style={{
              fontFamily: F.ui, fontSize: 11.5, fontWeight: 700,
              color: TYPE_TINT[t.type]?.fg ?? T.luxuryBrown, background: TYPE_TINT[t.type]?.bg ?? T.warmCream,
              borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap",
            }}>
              {t.type} {Number(t.qty.toFixed(3))} {t.unit}
            </span>
          ))}
          {records.length > 0 && (
            <button type="button" onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.taupe }}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {lineCount} line{lineCount === 1 ? "" : "s"} · {records.length} issue{records.length === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: "rgba(105,99,94,0.85)" }}>
          <PackageOpen size={15} color={T.taupe} />
          No materials issued to this loom for this batch yet.
        </div>
      ) : open && (
        <div style={{ overflowX: "auto" }}>
          {/* eslint-disable-next-line no-restricted-syntax -- raw table: dense traceability grid mirroring the Issue Material history table */}
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: T.warmCream }}>
                {["Issue ID", "Date", "Material", "Description", "Quantity", "GRN / Sub-GRN", "Issued By", "Status"].map(h => (
                  // eslint-disable-next-line no-restricted-syntax -- raw <th>, see table comment above
                  <th key={h} style={mth}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.flatMap(rec => rec.materials.map((m, i) => {
                const tint = TYPE_TINT[m.materialType] ?? TYPE_TINT.Jari;
                const st = STATUS_TINT[rec.status];
                const desc = describe(m);
                return (
                  // eslint-disable-next-line react/no-array-index-key -- issued lines carry no stable client-side id; order is fixed per record
                  <tr key={`${rec.id}-${i}`} style={{ background: T.warmIvory }}>
                    {/* The issuance-level columns only print on the first line of
                        each record, so a multi-material slip reads as one block
                        instead of repeating itself on every row. */}
                    <td style={{ ...mtd, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {i === 0 ? rec.id : ""}
                    </td>
                    <td style={{ ...mtd, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                      {i === 0 ? formatDate(new Date(rec.issuedAt), "withTime") : ""}
                    </td>
                    <td style={mtd}>
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: tint.fg, background: tint.bg, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                        {m.materialType}
                      </span>
                    </td>
                    <td style={{ ...mtd, minWidth: 150 }}>
                      {desc || <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>}
                    </td>
                    <td style={{ ...mtd, fontWeight: 700, color: T.royalBurgundy, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {m.quantity} {m.unit}
                    </td>
                    {/* The overall GRN this line was received under, plus the
                        specific sub-GRN (batch label) it was issued from — the
                        same "-1"/"-2"/"-3" codes printed on the barcode labels. */}
                    <td style={{ ...mtd, whiteSpace: "nowrap" }}>
                      {m.grnBatchId || m.grnItemCode ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                          {m.grnBatchId && <EntityCode type="goodsReceipt" value={m.grnBatchId} size="sm" copyable />}
                          {m.grnItemCode && m.grnItemCode !== m.grnBatchId && (
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, borderRadius: 4, padding: "1px 6px" }}>
                              Sub-GRN {m.grnItemCode.slice(m.grnBatchId ? m.grnBatchId.length : 0) || m.grnItemCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...mtd, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                      {i === 0 ? rec.issuedBy : ""}
                    </td>
                    <td style={mtd}>
                      {i === 0 && (
                        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: st.fg, background: st.bg, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Materials issued for this batch, grouped once per weaver+loom (or factory
 * loom) rather than once per saree row — a loom's materials appear a single
 * time no matter how many sarees it is weaving in this batch. Every issued
 * line is listed in full (type, description, quantity, source GRN id, issue
 * id, date, issuer, signature status), so a batch's material trail can be
 * audited here without opening Issue Material.
 */
export function MaterialsGivenPanel({
  rows, issueRecords, batchId, weavers,
}: {
  rows: SareeRow[];
  issueRecords: MaterialIssueRecord[];
  batchId: string;
  weavers: WeaverOption[];
}) {
  const groupKey = (row: SareeRow) =>
    row.weaverId ? `w::${row.weaverId}::${row.weaverLoom ?? ""}` : row.factoryLoomId ? `f::${row.factoryLoomId}` : null;

  const groups: SareeRow[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = groupKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    groups.push(row);
  }

  const recordsFor = (row: SareeRow) => issueRecords
    .filter(r => r.batchId === batchId && r.status !== "cancelled" && (
      row.weaverId
        ? r.weaverId === row.weaverId && r.loomNumber === row.weaverLoom
        : r.factoryLoomId === row.factoryLoomId
    ))
    .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));

  if (groups.length === 0) {
    return (
      <div style={{ padding: "22px 4px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        Assign a weaver or factory loom to a saree to see materials issued here.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {groups.map(row => (
        <GroupCard key={groupKey(row)} row={row} records={recordsFor(row)} weavers={weavers} />
      ))}
    </div>
  );
}
