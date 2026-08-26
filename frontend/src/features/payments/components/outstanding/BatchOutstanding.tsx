import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, isOutstanding, isSold, ageBucket } from "@/features/customers";
import { Empty, ExportBtn, SectionCard, exportCsv, inr } from "./primitives";
import type { AgeKey } from "./primitives";
import { DrilldownTabs, sareeOriginName, sareeOriginSub } from "./SareeDetailTable";
import { EntityCode } from "@/shared/ui/domain";

// ── Outstanding by batch (in-house batches across weavers + factory looms) ───
export function BatchOutstanding({ sarees, search, ageFilter }: { sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey }) {
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, {
      key: string; all: UnifiedSaree[]; soldRows: UnifiedSaree[]; rows: UnifiedSaree[];
      weavers: Set<string>; looms: Set<string>;
    }>();
    const q = search.trim().toLowerCase();
    sarees.filter(s => s.batchId).forEach(s => {
      const key = s.batchId as string;
      if (q && !key.toLowerCase().includes(q) && !s.sareeId.toLowerCase().includes(q)
            && !sareeOriginName(s).toLowerCase().includes(q) && !s.sareeTypeName.toLowerCase().includes(q)) return;
      let g = map.get(key);
      if (!g) { g = { key, all: [], soldRows: [], rows: [], weavers: new Set(), looms: new Set() }; map.set(key, g); }
      g.all.push(s);
      if (isSold(s)) g.soldRows.push(s);
      if (s.origin === "weaver" && s.weaverName) g.weavers.add(s.weaverName);
      if (s.origin === "factoryLoom" && s.factoryLoomNumber) g.looms.add(s.factoryLoomNumber);
      if (!isOutstanding(s)) return;
      if (ageFilter !== "all" && ageBucket(s.ageDays) !== ageFilter) return;
      g.rows.push(s);
    });
    return [...map.values()].filter(g => g.all.length > 0).sort((a, b) => b.rows.length - a.rows.length);
  }, [sarees, search, ageFilter]);

  const totalProduced = groups.reduce((a, g) => a + g.all.length, 0);
  const totalSold = groups.reduce((a, g) => a + g.soldRows.length, 0);
  const totalOut = groups.reduce((a, g) => a + g.rows.length, 0);
  const totalVal = groups.reduce((a, g) => a + g.rows.reduce((x, s) => x + s.finalAmount, 0), 0);

  return (
    <SectionCard
      icon={Layers}
      title="Outstanding Sarees — By Batch"
      subtitle="Every production batch and how much of it is still unsold. Covers in-house batches only — weavers and factory looms. External purchases are billed per invoice, not per batch."
      actions={
        <ExportBtn onClick={() => exportCsv("outstanding-by-batch.csv",
          [["Batch", "Saree Code", "Made By", "Reference", "Saree Type", "Weight", "QC Date", "Days In Stock", "Cost", "Sell Price"],
           ...groups.flatMap(g => g.rows.map(s => [g.key, s.sareeId, sareeOriginName(s), sareeOriginSub(s), s.sareeTypeName, s.weight, s.qcDate, s.ageDays, s.costPrice, s.finalAmount]))])} />
      }
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { l: "Produced", v: String(totalProduced), c: T.luxuryBrown },
          { l: "Sold", v: String(totalSold), c: T.green },
          { l: "Outstanding", v: String(totalOut), c: T.crimson },
          { l: "Batches with Stock", v: String(groups.length), c: T.royalBurgundy },
          { l: "Expected Sale Value", v: inr(totalVal), c: T.green },
        ].map(k => (
          <div key={k.l} style={{ flex: "1 1 170px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{k.l}</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {groups.length === 0 ? <Empty msg="Nothing outstanding for the current filters." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const isOpen = open === g.key;
            const val = g.rows.reduce((a, s) => a + s.finalAmount, 0);
            const parts = [
              g.weavers.size ? `${g.weavers.size} weaver${g.weavers.size > 1 ? "s" : ""}` : "",
              g.looms.size ? `${g.looms.size} factory loom${g.looms.size > 1 ? "s" : ""}` : "",
            ].filter(Boolean).join(" · ");
            return (
              <div key={g.key} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 18, background: "#FFFFFF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : g.key)}
                  style={{
                    width: "100%", padding: "16px 18px", background: isOpen ? "rgba(110,15,45,0.03)" : "#FFFFFF",
                    border: "none", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 14,
                  }}
                >
                  {/* Top Header Row: EntityCode & Subtitle on left, Chevron on right */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, width: "100%" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div><EntityCode type="batch" value={g.key} size="sm" /></div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 4 }}>{parts || "—"}</div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {isOpen ? <ChevronDown size={16} color={T.royalBurgundy} /> : <ChevronRight size={16} color={T.taupe} />}
                    </div>
                  </div>

                  {/* Horizontal Divider Line */}
                  <div style={{ width: "100%", height: 1, background: "rgba(110,15,45,0.08)" }} />

                  {/* Stat Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                    <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>PRODUCED</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{g.all.length}</div>
                    </div>
                    <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>SOLD</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.green }}>{g.soldRows.length}</div>
                    </div>
                    <div style={{ background: "rgba(192,57,43,0.06)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.crimson, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>OUTSTANDING</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.crimson }}>{g.rows.length}</div>
                    </div>
                    <div style={{ background: "rgba(110,15,45,0.06)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>VALUE</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>{inr(val)}</div>
                    </div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "10px 18px 16px" }}>
                        <DrilldownTabs produced={g.all} sold={g.soldRows} outstanding={g.rows} showSource />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
