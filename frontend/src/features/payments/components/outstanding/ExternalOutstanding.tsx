import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, RotateCcw, Truck, Building2, LayoutGrid, List } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, isSold, ageBucket, purchaseOutstanding } from "@/features/customers";
import { Empty, ExportBtn, Pill, SectionCard, exportCsv, inr, tdMono } from "./primitives";
import type { AgeKey } from "./primitives";
import { DrilldownTabs, SareeDetailTable } from "./SareeDetailTable";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { EntityCode } from "@/shared/ui/domain";

interface SupplierRollup { supplier: string; purchases: number; bought: number; unsold: number; returned: number; due: number; unsoldValue: number; }

// ── External purchases outstanding — purchase-wise, per supplier ─────────────
export function ExternalOutstanding({ sarees, search, ageFilter }: { sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey }) {
  const [open, setOpen] = useState<string | null>(null);
  const [supplierViewMode, setSupplierViewMode] = useState<"card" | "table">("card");
  const all = useMemo(() => purchaseOutstanding(sarees), [sarees]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .map(p => ({
        ...p,
        unsoldSarees: p.unsoldSarees.filter(s => ageFilter === "all" || ageBucket(s.ageDays) === ageFilter),
      }))
      .filter(p => !q || p.supplier.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .sort((a, b) => b.unsoldSarees.length - a.unsoldSarees.length);
  }, [all, search, ageFilter]);

  const bySupplier = useMemo(() => {
    const m = new Map<string, { supplier: string; purchases: number; bought: number; unsold: number; returned: number; due: number; unsoldValue: number }>();
    all.forEach(p => {
      let r = m.get(p.supplier);
      if (!r) { r = { supplier: p.supplier, purchases: 0, bought: 0, unsold: 0, returned: 0, due: 0, unsoldValue: 0 }; m.set(p.supplier, r); }
      r.purchases++; r.bought += p.sareeCount; r.unsold += p.unsoldCount;
      r.returned += p.returnedCount; r.due += p.dueAmount; r.unsoldValue += p.unsoldValue;
    });
    return [...m.values()].sort((a, b) => b.unsold - a.unsold);
  }, [all]);

  const totBought = all.reduce((a, p) => a + p.sareeCount, 0);
  const totSold = all.reduce((a, p) => a + p.soldCount, 0);
  const totUnsold = all.reduce((a, p) => a + p.unsoldCount, 0);
  const totReturned = all.reduce((a, p) => a + p.returnedCount, 0);
  const totDue = all.reduce((a, p) => a + p.dueAmount, 0);
  const totUnsoldVal = all.reduce((a, p) => a + p.unsoldValue, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionCard
        icon={Truck}
        title="External Purchases — Outstanding by Purchase"
        subtitle="Every purchase from every supplier, showing the sarees still unsold from that bill, the bill amount still due, and any sarees returned by customers after a retail sale."
        actions={
          <ExportBtn onClick={() => exportCsv("outstanding-external-purchases.csv",
            [["Purchase ID", "Supplier", "Location", "Invoice No", "GST No", "Purchase Date", "Bill Amount", "Paid", "Bill Due", "Bill Status", "Sarees Bought", "Sold", "Unsold", "Returned", "Unsold Cost", "Unsold Sale Value", "Refund Value"],
             ...all.map(p => [p.id, p.supplier, p.location, p.invoiceNumber, p.gstNumber, p.date, p.billAmount, p.paidAmount, p.dueAmount, p.status, p.sareeCount, p.soldCount, p.unsoldCount, p.returnedCount, p.unsoldCost, p.unsoldValue, p.refundValue])])} />
        }
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { l: "Purchased", v: String(totBought), c: T.luxuryBrown },
            { l: "Sold", v: String(totSold), c: T.green },
            { l: "Outstanding", v: String(totUnsold), c: T.crimson },
            { l: "Customer Returns", v: String(totReturned), c: T.orange },
            { l: "Bill Amount Due", v: inr(totDue), c: T.royalBurgundy },
            { l: "Unsold Stock Value", v: inr(totUnsoldVal), c: T.green },
          ].map(k => (
            <div key={k.l} style={{ flex: "1 1 160px", background: T.warmCream, borderRadius: 12, padding: "13px 16px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{k.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        {rows.length === 0 ? <Empty msg="No purchases match the current filters." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map(p => {
              const isOpen = open === p.id;
              const statusCfg = p.status === "Paid"
                ? { color: T.green, bg: "rgba(30,102,64,0.09)" }
                : p.status === "Partial"
                ? { color: T.crimson, bg: "rgba(192,57,43,0.08)" }
                : { color: T.orange, bg: "rgba(230,126,34,0.12)" };
              return (
              <div key={p.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 18, background: "#FFFFFF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  style={{
                    width: "100%", padding: "16px 18px", background: isOpen ? "rgba(110,15,45,0.03)" : "#FFFFFF",
                    border: "none", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 14,
                  }}
                >
                  {/* Top Header Row: Supplier Name, Badges & Subtitle on left, Chevron on right */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, width: "100%" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{p.supplier}</span>
                        <Pill label={p.status} color={statusCfg.color} bg={statusCfg.bg} />
                        {p.returnedCount > 0 && <Pill label={`${p.returnedCount} returned`} color={T.crimson} bg="rgba(192,57,43,0.10)" />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        <EntityCode type="purchaseOrder" value={p.id} size="sm" />
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, wordBreak: "break-all" }}>· {p.invoiceNumber} · {p.date} · {p.location}</span>
                      </div>
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
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>PURCHASED</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{p.sareeCount}</div>
                    </div>
                    <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>SOLD</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.green }}>{p.soldCount}</div>
                    </div>
                    <div style={{ background: "rgba(192,57,43,0.06)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: T.crimson, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>OUTSTANDING</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.crimson }}>{p.unsoldCount}</div>
                    </div>
                    <div style={{ background: p.dueAmount > 0 ? "rgba(230,126,34,0.08)" : "rgba(30,102,64,0.08)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: p.dueAmount > 0 ? T.orange : T.green, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>BILL DUE</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: p.dueAmount > 0 ? T.orange : T.green }}>{inr(p.dueAmount)}</div>
                    </div>
                  </div>
                </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                        <div style={{ padding: "10px 18px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

                          {/* Bill detail */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                            {[
                              { l: "GST Number",     v: p.gstNumber },
                              { l: "Bill Amount",    v: inr(p.billAmount) },
                              { l: "Paid",           v: inr(p.paidAmount) },
                              { l: "Bill Due",       v: inr(p.dueAmount) },
                              { l: "Unsold Cost",    v: inr(p.unsoldCost) },
                              { l: "Unsold Sale Value", v: inr(p.unsoldValue) },
                            ].map(k => (
                              <div key={k.l} style={{ background: T.warmCream, borderRadius: 10, padding: "10px 13px" }}>
                                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{k.l}</div>
                                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.v}</div>
                              </div>
                            ))}
                          </div>

                          <DrilldownTabs
                            produced={p.sarees}
                            sold={p.sarees.filter(isSold)}
                            outstanding={p.unsoldSarees}
                            producedLabel="Purchased"
                          />

                          {p.returnedSarees.length > 0 && (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                <RotateCcw size={14} color={T.crimson} />
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.9px" }}>
                                  Customer returns ({p.returnedSarees.length}) · refund {inr(p.refundValue)}
                                </span>
                              </div>
                              <SareeDetailTable sarees={p.returnedSarees} showReturn />
                            </div>
                          )}
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

      {/* Supplier roll-up */}
      <SectionCard icon={Building2} title="Supplier Roll-up" subtitle="Same numbers grouped by supplier across all their purchases.">
        {/* Mobile View Toggle */}
        <div className="flex md:hidden justify-end mb-3">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setSupplierViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                supplierViewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              onClick={() => setSupplierViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                supplierViewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <List size={14} /> Table View
            </Button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className={`grid grid-cols-1 gap-3.5 ${supplierViewMode === "card" ? "block md:hidden" : "hidden"}`}>
          {bySupplier.map(r => (
            <div key={r.supplier} style={{ background: "#FFFFFF", border: "1px solid rgba(110,15,45,0.12)", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.supplier}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 8 }}>{r.purchases} {r.purchases === 1 ? "purchase" : "purchases"}</span>
              </div>
              <div style={{ width: "100%", height: 1, background: "rgba(110,15,45,0.08)" }} />
              <div className="grid grid-cols-2 gap-2.5">
                <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.taupe, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>PURCHASED</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{r.bought}</div>
                </div>
                <div style={{ background: "rgba(192,57,43,0.06)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.crimson, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>OUTSTANDING</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.crimson }}>{r.unsold}</div>
                </div>
                <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.taupe, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>UNSOLD VALUE</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{inr(r.unsoldValue)}</div>
                </div>
                <div style={{ background: r.due > 0 ? "rgba(230,126,34,0.08)" : "rgba(30,102,64,0.08)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: r.due > 0 ? T.orange : T.green, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>BILL DUE</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: r.due > 0 ? T.orange : T.green }}>{inr(r.due)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View & Mobile Table Mode */}
        <div className={`w-full overflow-x-auto section-nav-scroll border border-[#E8DCC4] rounded-xl bg-white p-2 ${supplierViewMode === "table" ? "block" : "hidden md:block"}`}>
          <div className="min-w-[700px]">
            <DataTable<SupplierRollup>
              responsive={false}
              columns={supplierRollupColumns}
              data={bySupplier}
              getRowId={r => r.supplier}
              caption="Supplier roll-up table"
              emptyTitle="No supplier data yet"
              pagination
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

const supplierRollupColumns: ColumnDef<SupplierRollup>[] = [
  { id: "supplier", header: "Supplier", priority: 1, accessor: r => r.supplier, sortable: true, cell: (_v, r) => <span style={{ fontWeight: 600 }}>{r.supplier}</span> },
  { id: "purchases", header: "Purchases", priority: 3, accessor: r => r.purchases, align: "end", sortable: true, cell: (_v, r) => <span style={tdMono}>{r.purchases}</span> },
  { id: "bought", header: "Purchased", accessor: r => r.bought, align: "end", sortable: true, cell: (_v, r) => <span style={tdMono}>{r.bought}</span> },
  { id: "unsold", header: "Outstanding", accessor: r => r.unsold, align: "end", sortable: true, cell: (_v, r) => <span style={{ ...tdMono, color: T.crimson }}>{r.unsold}</span> },
  { id: "returned", header: "Returned", priority: 3, accessor: r => r.returned, align: "end", sortable: true, cell: (_v, r) => <span style={{ ...tdMono, color: T.orange }}>{r.returned}</span> },
  { id: "unsoldValue", header: "Unsold Value", accessor: r => r.unsoldValue, align: "end", sortable: true, cell: (_v, r) => <span style={tdMono}>{inr(r.unsoldValue)}</span> },
  { id: "due", header: "Bill Due", accessor: r => r.due, align: "end", sortable: true, cell: (_v, r) => <span style={{ ...tdMono, color: r.due > 0 ? T.orange : T.green }}>{inr(r.due)}</span> },
];
