import React from "react";
import { MaterialIssueRecord } from "@/features/materials";
import { T, F } from "./theme";
import { GrnLineCode } from "@/shared/ui/domain";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "@/shared/ui/DateFilterBar";
import { Select, SelectItem } from "@/shared/ui/primitives";

const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

export function LoomMaterialsTab({ materialRecords }: { materialRecords: MaterialIssueRecord[] }) {
  const [dateFilter, setDateFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [batchFilter, setBatchFilter] = React.useState<string>("all");

  const dateFiltered = React.useMemo(
    () => materialRecords.filter(r => matchesDateFilter(r.issuedAt, dateFilter)),
    [materialRecords, dateFilter]
  );

  const batchOptions = React.useMemo(
    () => Array.from(new Set(dateFiltered.map(r => r.batchId || "Unassigned"))).sort(),
    [dateFiltered]
  );

  React.useEffect(() => {
    if (batchFilter !== "all" && !batchOptions.includes(batchFilter)) setBatchFilter("all");
  }, [batchOptions, batchFilter]);

  const filterActive = dateFilter.mode !== "all";
  const filteredRecords = batchFilter === "all" ? dateFiltered : dateFiltered.filter(r => (r.batchId || "Unassigned") === batchFilter);

  return (
    <div>
      <SectionPill label="Materials Issued — Batch Wise" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        {batchOptions.length > 0 && (
          <div style={{ marginLeft: "auto" }}>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectItem value="all">All Batches</SelectItem>
              {batchOptions.map(id => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      </div>
      {materialRecords.length > 0 && (
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 12 }}>
          Showing <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{filteredRecords.length}</span> of{" "}
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{materialRecords.length}</span> handover{materialRecords.length !== 1 ? "s" : ""}
          {filterActive || batchFilter !== "all" ? " for the selected filters" : ""}
        </div>
      )}
      {materialRecords.length === 0 ? (
        <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, marginTop: 12 }}>
          No materials issued to this loom yet. Use the Issue Material page to record material handovers.
        </div>
      ) : filteredRecords.length === 0 ? (
        <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, marginTop: 12 }}>
          No material handovers match the selected filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 18, marginTop: 12 }}>
          {Array.from(filteredRecords.reduce((m, r) => {
            const key = r.batchId || "Unassigned";
            if (!m.has(key)) m.set(key, [] as typeof filteredRecords);
            m.get(key)!.push(r);
            return m;
          }, new Map<string, typeof filteredRecords>()).entries()).map(([batchId, recs]) => {
            let warpKg = 0;
            let reshamKg = 0;
            let jariReels = 0;
            recs.forEach(r => r.materials.forEach(mat => {
              const qty = mat.quantity || 0;
              if (mat.materialType === "Warp") {
                warpKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
              } else if (mat.materialType === "Resham") {
                reshamKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
              } else if (mat.materialType === "Jari") {
                jariReels += (mat.unit || "").toLowerCase().startsWith("bun") ? qty * 4 : qty;
              }
            }));

            return (
              <div key={batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 7, padding: "5px 12px" }}>{batchId}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{recs.length} issuance{recs.length > 1 ? "s" : ""}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.borderDef}` }}>
                  {[
                    { label: "Warp Outstanding", value: `${warpKg.toFixed(2)} kg`, color: T.royalBurgundy },
                    { label: "Resham Outstanding", value: `${reshamKg.toFixed(2)} kg`, color: "#7A5E1C" },
                    { label: "Jari Outstanding", value: `${jariReels} reels`, color: T.green },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
                  {recs.map(r => (
                    <div key={r.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap" as const, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 9px" }}>{r.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                        {r.materials.map((m, mi) => (
                          // eslint-disable-next-line react/no-array-index-key -- issued lines have no client-side id; order is fixed per record
                          <div key={`${m.grnItemCode ?? m.grnBatchId}-${m.materialType}-${mi}`} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                            <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{m.materialType}</span>
                            {m.description && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{m.description}</span>}
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                            <GrnLineCode batchId={m.grnBatchId} itemCode={m.grnItemCode} />
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 10 }}>Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
