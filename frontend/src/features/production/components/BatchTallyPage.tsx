import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Scale } from "lucide-react";
import { useDesignLibrary } from "../../design-library/contexts/DesignLibraryContext";
import { useBatches, type SareeRow } from "../contexts/BatchContext";
import { useRatesPricing } from "../../pricing/contexts/RatesContext";
import { useAuth } from "../../../contexts/AuthContext";
import { T, F } from "./theme";
import { rowComplete, weaverBreakdown, bulkOrderBreakdown } from "./sections/batches/ContextBatchCard";
import { SareeWeightTallyList, type TallyRowItem, type TallyCorrection } from "./sections/batches/SareeWeightTallyList";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";

const imgSaree = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

/**
 * Batch Tally as its own full page (same pattern as BulkOrderDetailPage —
 * replaces the whole Production page rather than opening a modal), so the
 * per-saree weight/material tally has room to breathe and can be linked to
 * directly instead of being buried inside a dialog.
 */
export function BatchTallyPage({ batchId, onBack, onOpenCreation }: { batchId: string; onBack: () => void; onOpenCreation: () => void }) {
  const { batches, tallyRow } = useBatches();
  const b = batches.find(br => br.batchId === batchId);

  const { getSareeTypeByCode } = useRatesPricing();
  const { user } = useAuth();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [qcFilter, setQcFilter] = useState("All");

  const { getDesign } = useDesignLibrary();

  const weaverOptions = useMemo(() => b ? ["All", ...Array.from(new Set(b.rows.map(r => r.weaverName).filter(Boolean)))].sort() : ["All"], [b]);
  const orderOptions = useMemo(() => b ? ["All", "General Stock", ...Array.from(new Set(b.rows.map(r => r.bulkOrderLabel).filter(Boolean)))].sort() : ["All"], [b]);

  const filteredRows = (b?.rows ?? []).filter(r => {
    const q = search.toLowerCase();
    const mSearch = !q || r.sareeId?.toLowerCase().includes(q) || r.weaverName?.toLowerCase().includes(q);
    const mWeaver = weaverFilter === "All" || r.weaverName === weaverFilter;
    const orderLabel = r.bulkOrderLabel || "General Stock";
    const mOrder = orderFilter === "All" || orderLabel === orderFilter;
    const mQc = qcFilter === "All" || (qcFilter === "QC Passed" ? r.qcPassed : !r.qcPassed);
    return mSearch && mWeaver && mOrder && mQc;
  });

  const tallyItems: TallyRowItem[] = filteredRows
    .filter((r): r is SareeRow & { sareeId: string } => !!r.sareeId)
    .map(r => ({
      sareeId: r.sareeId,
      serial: r.serial,
      batchId,
      weaverName: r.weaverName,
      sareeTypeCode: r.sareeTypeCode,
      actualWeight: r.receivedWeight ? parseFloat(r.receivedWeight) : null,
      actualWarpG: r.receivedWarpG ? parseFloat(r.receivedWarpG) : null,
      actualReshamG: r.receivedReshamG ? parseFloat(r.receivedReshamG) : null,
      actualJariReels: r.receivedJariReels ? parseFloat(r.receivedJariReels) : null,
      tallied: r.tallied,
      talliedBy: r.talliedBy,
      talliedAt: r.talliedAt,
    }));

  const handleToggleTally = async (item: TallyRowItem, tallied: boolean) => {
    const key = `${item.batchId}-${item.serial}`;
    setBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, tallied, user?.name);
    } finally {
      setBusyKey(null);
    }
  };

  // Admin corrects the weight/material figures Worker Staff entered at
  // receipt, then the row is marked tallied in the same action.
  const handleSaveCorrection = async (item: TallyRowItem, correction: TallyCorrection) => {
    const key = `${item.batchId}-${item.serial}`;
    setBusyKey(key);
    try {
      await tallyRow(item.batchId, item.serial, true, user?.name, correction);
    } finally {
      setBusyKey(null);
    }
  };

  if (!b) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: F.ui }}>
        <div style={{ fontSize: 14, color: T.taupe }}>Batch {batchId} not found.</div>
        <Button onClick={onBack} variant="secondary" iconLeft={ArrowLeft}>Back to Batches</Button>
      </div>
    );
  }

  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  return (
    <div style={{ fontFamily: F.ui, minHeight: "100vh", background: T.silkCream }}>
      <div style={{ height: 220, position: "relative", overflow: "hidden", background: T.silkCream }}>
        <img src={designImage} alt="Design" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)" }} />

        <IconButton icon={ArrowLeft} label="Back to Batches" onClick={onBack} variant="ghost" size="sm"
          className="absolute top-5 left-6 rounded-[10px] border border-white/22 bg-[rgba(26,10,15,0.45)] text-white hover:bg-[rgba(26,10,15,0.6)]" />

        <div style={{ position: "absolute", bottom: 20, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight, letterSpacing: "0.5px", marginBottom: 4 }}>{b.batchId}</div>
            <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>
              {firstRow ? firstRow.sareeTypeName : "Batch"} Production
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "#2ECC71" : T.antiqueGold, borderRadius: 99, padding: "5px 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {b.status === "active" ? "Active" : "Draft"}
          </span>
        </div>
      </div>

      <div className="px-4 md:px-7 xl:px-8" style={{ maxWidth: 980, margin: "0 auto", paddingTop: 28, paddingBottom: 40, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "18px 22px" }}>
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

        <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Due Date</div>
            <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{b.dueDate || "Not Set"}</div>
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

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

        <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "18px 22px" }}>
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

        <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Scale size={16} color={T.royalBurgundy} />
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
              Weight &amp; Material Tally ({tallyItems.filter(i => i.tallied).length} / {tallyItems.length} tallied)
            </div>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 12 }}>
            Actual is what Worker Staff entered at receipt; Standard is the SareeTypeRate rate card for that saree's assigned type. Tally each saree once you've physically verified it.
          </div>
          <SareeWeightTallyList
            items={tallyItems}
            getSareeTypeByCode={getSareeTypeByCode}
            onToggleTally={handleToggleTally}
            onSaveCorrection={handleSaveCorrection}
            busyKey={busyKey}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={onBack} variant="secondary" size="lg" className="flex-1 h-11" iconLeft={ArrowLeft}>
            Back to Batches
          </Button>
          <Button onClick={onOpenCreation} variant="primary" size="lg" iconLeft={ArrowRight} className="flex-[1.5] h-11">
            Open in Batch Creation
          </Button>
        </div>
      </div>
    </div>
  );
}
