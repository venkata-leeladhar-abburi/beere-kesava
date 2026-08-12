import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Users, Factory } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, SareeOrigin, isOutstanding, isSold, ageBucket } from "../../../customers/contexts/SalesContext";
import { Empty, ExportBtn, SectionCard, exportCsv, inr } from "./primitives";
import type { AgeKey } from "./primitives";
import { DrilldownTabs } from "./SareeDetailTable";
import { Button } from "../../../../shared/ui/primitives";

// ── In-house outstanding (weavers or factory looms) ──────────────────────────
export function InHouseOutstanding({
  origin, sarees, search, ageFilter,
}: {
  origin: Extract<SareeOrigin, "weaver" | "factoryLoom">;
  sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; sub: string; all: UnifiedSaree[]; soldRows: UnifiedSaree[]; rows: UnifiedSaree[] }>();
    const q = search.trim().toLowerCase();
    sarees.filter(s => s.origin === origin).forEach(s => {
      const key = origin === "weaver" ? (s.weaverId || "?") : (s.factoryLoomId || "?");
      const name = origin === "weaver" ? (s.weaverName || "—") : (s.factoryLoomNumber || "—");
      const sub  = origin === "weaver" ? `${s.weaverId} · Loom ${s.weaverLoom}` : `${s.operatorName} · ${s.loomLocation}`;
      // Search narrows every list; the ageing filter applies only to outstanding stock.
      if (q && !s.sareeId.toLowerCase().includes(q) && !name.toLowerCase().includes(q)
            && !s.sareeTypeName.toLowerCase().includes(q) && !(s.batchId || "").toLowerCase().includes(q)) return;
      let g = map.get(key);
      if (!g) { g = { key, name, sub, all: [], soldRows: [], rows: [] }; map.set(key, g); }
      g.all.push(s);
      if (isSold(s)) g.soldRows.push(s);
      if (!isOutstanding(s)) return;
      if (ageFilter !== "all" && ageBucket(s.ageDays) !== ageFilter) return;
      g.rows.push(s);
    });
    return [...map.values()].filter(g => g.all.length > 0).sort((a, b) => b.rows.length - a.rows.length);
  }, [sarees, origin, search, ageFilter]);

  const totalOut = groups.reduce((a, g) => a + g.rows.length, 0);
  const totalVal = groups.reduce((a, g) => a + g.rows.reduce((x, s) => x + s.finalAmount, 0), 0);
  const totalProduced = groups.reduce((a, g) => a + g.all.length, 0);
  const totalSold = groups.reduce((a, g) => a + g.soldRows.length, 0);

  const label = origin === "weaver" ? "Weaver" : "Factory Loom";

  return (
    <SectionCard
      icon={origin === "weaver" ? Users : Factory}
      title={`Outstanding Sarees — ${origin === "weaver" ? "Weavers" : "Factory Looms"}`}
      subtitle={`Sarees produced ${origin === "weaver" ? "by our weavers" : "on our factory looms"} that are still not sold — neither retail nor wholesale. Returned sarees that went back into stock are counted here too.`}
      actions={
        <ExportBtn onClick={() => exportCsv(
          `outstanding-${origin}.csv`,
          [[label, "Ref", "Saree Code", "Batch", "Saree Type", "Weight", "QC Date", "Days In Stock", "Cost", "Sell Price"],
           ...groups.flatMap(g => g.rows.map(s => [g.name, g.sub, s.sareeId, s.batchId || "—", s.sareeTypeName, s.weight, s.qcDate, s.ageDays, s.costPrice, s.finalAmount]))],
        )} />
      }
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { l: "Produced", v: String(totalProduced), c: T.luxuryBrown },
          { l: "Sold", v: String(totalSold), c: T.green },
          { l: "Outstanding", v: String(totalOut), c: T.crimson },
          { l: `${label}s with Stock`, v: String(groups.length), c: T.royalBurgundy },
          { l: "Expected Sale Value", v: inr(totalVal), c: T.green },
        ].map(k => (
          <div key={k.l} style={{ flex: "1 1 190px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
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
            return (
              <div key={g.key} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <Button
                  variant="ghost"
                  onClick={() => setOpen(isOpen ? null : g.key)}
                  className={`h-auto w-full justify-start gap-[14px] rounded-none px-[18px] py-[14px] text-left ${isOpen ? "bg-[rgba(110,15,45,0.04)]" : "bg-white"}`}
                >
                  {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{g.name}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{g.sub}</div>
                  </div>
                  <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Produced</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{g.all.length}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Sold</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>{g.soldRows.length}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Outstanding</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>{g.rows.length}</div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 96 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>Value</div>
                      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{inr(val)}</div>
                    </div>
                  </div>
                </Button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "10px 18px 16px" }}>
                        <DrilldownTabs produced={g.all} sold={g.soldRows} outstanding={g.rows} showBatch />
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
