import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Palette, ArrowRight } from "lucide-react";
import { useDesignLibrary } from "../../../../design-library/contexts/DesignLibraryContext";
import type { BatchRecord, SareeRow } from "../../../contexts/BatchContext";
import { T, F } from "../../theme";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../../../shared/ui/primitives";

const imgSaree = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function rowComplete(r: SareeRow) {
  return !!(r.weaverId && r.sareeId && r.designCode && r.sareeTypeCode);
}
export function weaverBreakdown(rows: SareeRow[]): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.weaverName || "Unassigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}
export function bulkOrderBreakdown(rows: SareeRow[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.bulkOrderLabel || "Not assigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count }));
}

export function ContextBatchCard({ b, onNavigateBatches, onClick }: { b: BatchRecord; onNavigateBatches?: (batchId: string) => void; onClick?: () => void }) {
  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);
  const hasDueDate = !!b.dueDate;

  const { getDesign } = useDesignLibrary();
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.05)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", position: "relative", cursor: "pointer" }}
    >
      <div style={{ width: "100%", height: 5, background: b.status === "active" ? T.green : T.antiqueGold, flexShrink: 0 }} />

      <div style={{ height: 160, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5 }}
          src={designImage}
          alt={b.batchId}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />

        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
          {b.batchId}
        </div>

        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "rgba(30,102,64,0.85)" : "rgba(200,155,71,0.92)", backdropFilter: "blur(4px)", borderRadius: 99, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.status === "active" ? "#2ECC71" : T.royalBurgundy }} />
            {b.status === "active" ? "Active" : "Draft"}
          </span>
        </div>

        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{b.totalCount} Sarees</div>
          </div>
          {hasDueDate && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight }}>{b.dueDate}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {firstRow && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "8px 12px" }}>
            <Palette size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstRow.sareeTypeName} · <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{firstRow.designCode}</span>
            </span>
          </div>
        )}

        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            Assigned Weavers
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {weavers.map(w => (
              <span key={w.name} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "4px 8px" }}>
                {w.count} × {w.name}
              </span>
            ))}
          </div>
        </div>

        {orders.length > 0 && (
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Linked Orders
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {orders.map(o => (
                <span key={o.label} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: o.label === "Not assigned" ? "rgba(139,112,96,0.06)" : "rgba(30,102,64,0.05)", color: o.label === "Not assigned" ? T.taupe : T.green, border: `1px solid ${o.label === "Not assigned" ? "rgba(139,112,96,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 8, padding: "4px 8px" }}>
                  {o.count} × {o.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(110,15,45,0.05)", margin: "4px 0" }} />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Rows complete: {completeCount} of {b.totalCount}</span>
            <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }}
            />
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <Button
            onClick={(e) => { e.stopPropagation(); onNavigateBatches?.(b.batchId); }}
            variant="secondary" size="md" iconLeft={ArrowRight} fullWidth
            className="border-[1.5px] border-[rgba(110,15,45,0.16)] bg-[rgba(110,15,45,0.04)] text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.08)]"
          >
            Open in Batch Creation
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function ContextBatchDetailsDialog({ b, onClose, onOpenCreation }: { b: BatchRecord; onClose: () => void; onOpenCreation: () => void }) {
  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);

  const [search, setSearch] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [qcFilter, setQcFilter] = useState("All");

  const weaverOptions = useMemo(() => ["All", ...Array.from(new Set(b.rows.map(r => r.weaverName).filter(Boolean)))].sort(), [b.rows]);
  const orderOptions = useMemo(() => ["All", "General Stock", ...Array.from(new Set(b.rows.map(r => r.bulkOrderLabel).filter(Boolean)))].sort(), [b.rows]);

  const filteredRows = b.rows.filter(r => {
    const q = search.toLowerCase();
    const mSearch = !q || r.sareeId?.toLowerCase().includes(q) || r.weaverName?.toLowerCase().includes(q);
    const mWeaver = weaverFilter === "All" || r.weaverName === weaverFilter;
    const orderLabel = r.bulkOrderLabel || "General Stock";
    const mOrder = orderFilter === "All" || orderLabel === orderFilter;
    const mQc = qcFilter === "All" || (qcFilter === "QC Passed" ? r.qcPassed : !r.qcPassed);
    return mSearch && mWeaver && mOrder && mQc;
  });

  const { getDesign } = useDesignLibrary();
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "rgba(26,10,15,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ y: 18, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: "100%", background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        <div style={{ height: 180, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
          <img src={designImage} alt="Design image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />

          <div style={{ position: "absolute", bottom: 16, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight, letterSpacing: "0.5px", marginBottom: 4 }}>{b.batchId}</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>
                {firstRow ? firstRow.sareeTypeName : "Batch"} Production
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "#2ECC71" : T.antiqueGold, borderRadius: 99, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {b.status === "active" ? "Active" : "Draft"}
            </span>
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} variant="ghost" size="sm"
            className="absolute top-4 right-4 rounded-[10px] border border-white/22 bg-[rgba(26,10,15,0.45)] text-white hover:bg-[rgba(26,10,15,0.6)]" />
        </div>

        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          <div style={{ background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Production progress</span>
              <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>
                {completeCount} / {b.totalCount} ({pct}%) Complete
              </span>
            </div>
            <div style={{ height: 10, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Due Date</div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                {b.dueDate || "Not Set"}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Assigned Weavers
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {weavers.map(w => (
                  <span key={w.name} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "5px 10px" }}>
                    {w.count} × {w.name}
                  </span>
                ))}
              </div>
            </div>

            {orders.length > 0 && (
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Linked Orders
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {orders.map(o => (
                    <span key={o.label} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: o.label === "Not assigned" ? "rgba(139,112,96,0.06)" : "rgba(30,102,64,0.05)", color: o.label === "Not assigned" ? T.taupe : T.green, border: `1px solid ${o.label === "Not assigned" ? "rgba(139,112,96,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 8, padding: "5px 10px" }}>
                      {o.count} × {o.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Saree Row Allocations ({filteredRows.length})
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ flex: "1 1 200px" }}>
                <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Saree ID, Weaver..." className="w-full" />
              </div>
              <Select value={weaverFilter} onValueChange={setWeaverFilter} size="sm" className="w-auto min-w-[130px]">
                {weaverOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Weavers" : w as string}</SelectItem>)}
              </Select>
              <Select value={orderFilter} onValueChange={setOrderFilter} size="sm" className="w-auto min-w-[130px]">
                {orderOptions.map(o => <SelectItem key={o as string} value={o as string}>{o === "All" ? "All Orders" : o as string}</SelectItem>)}
              </Select>
              <Select value={qcFilter} onValueChange={setQcFilter} size="sm" className="w-auto min-w-[130px]">
                {["All", "QC Passed", "In Progress"].map(q => <SelectItem key={q} value={q}>{q === "All" ? "All QC Status" : q}</SelectItem>)}
              </Select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredRows.map(row => (
                <div key={row.serial} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>
                        Saree {row.serial}
                      </span>
                      {row.sareeId && (
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                          ({row.sareeId})
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, marginTop: 4 }}>
                      Loom {row.weaverLoom} · {row.weaverName || "Unassigned"}
                    </div>
                    {row.bulkOrderLabel && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>↳ Order: {row.bulkOrderLabel}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: row.qcPassed ? T.green : T.taupe, background: row.qcPassed ? "rgba(30,102,64,0.08)" : "rgba(139,112,96,0.08)", borderRadius: 6, padding: "4px 8px" }}>
                    {row.qcPassed ? "QC Passed" : "In Progress"}
                  </span>
                </div>
              ))}
              {filteredRows.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: T.taupe, fontFamily: F.ui, fontSize: 13 }}>No sarees match these filters.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "18px 24px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 12, background: T.warmIvory }}>
          <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-11">
            Close Details
          </Button>
          <Button onClick={onOpenCreation} variant="primary" size="lg" iconLeft={ArrowRight} className="flex-[1.5] h-11">
            Open in Batch Creation
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
