import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, isSold, ageBucket, purchaseOutstanding } from "../../../customers/contexts/SalesContext";
import { Card, Empty, ExportBtn, Pill, ScrollTable, SectionTitle, exportCsv, inr, td, tdMono, th } from "./primitives";
import type { AgeKey } from "./primitives";
import { DrilldownTabs, SareeDetailTable } from "./SareeDetailTable";

// ── External purchases outstanding — purchase-wise, per supplier ─────────────
export function ExternalOutstanding({ sarees, search, ageFilter }: { sarees: UnifiedSaree[]; search: string; ageFilter: AgeKey }) {
  const [open, setOpen] = useState<string | null>(null);
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
      <Card>
        <SectionTitle
          title="External Purchases — Outstanding by Purchase"
          sub="Every purchase from every supplier, showing the sarees still unsold from that bill, the bill amount still due, and any sarees returned by customers after a retail sale."
          right={
            <ExportBtn onClick={() => exportCsv("outstanding-external-purchases.csv",
              [["Purchase ID", "Supplier", "Location", "Invoice No", "GST No", "Purchase Date", "Bill Amount", "Paid", "Bill Due", "Bill Status", "Sarees Bought", "Sold", "Unsold", "Returned", "Unsold Cost", "Unsold Sale Value", "Refund Value"],
               ...all.map(p => [p.id, p.supplier, p.location, p.invoiceNumber, p.gstNumber, p.date, p.billAmount, p.paidAmount, p.dueAmount, p.status, p.sareeCount, p.soldCount, p.unsoldCount, p.returnedCount, p.unsoldCost, p.unsoldValue, p.refundValue])])} />
          }
        />

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
                <div key={p.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                  <button onClick={() => setOpen(isOpen ? null : p.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                    {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{p.supplier}</span>
                        <Pill label={p.status} color={statusCfg.color} bg={statusCfg.bg} />
                        {p.returnedCount > 0 && <Pill label={`${p.returnedCount} returned`} color={T.crimson} bg="rgba(192,57,43,0.10)" />}
                      </div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                        {p.id} · {p.invoiceNumber} · {p.date} · {p.location}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {[
                        { l: "Purchased", v: String(p.sareeCount), c: T.luxuryBrown },
                        { l: "Sold", v: String(p.soldCount), c: T.green },
                        { l: "Outstanding", v: String(p.unsoldCount), c: T.crimson },
                        { l: "Bill Due", v: inr(p.dueAmount), c: p.dueAmount > 0 ? T.orange : T.green },
                      ].map(k => (
                        <div key={k.l} style={{ textAlign: "right", minWidth: 60 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: k.c }}>{k.v}</div>
                        </div>
                      ))}
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
                                <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.v}</div>
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
      </Card>

      {/* Supplier roll-up */}
      <Card>
        <SectionTitle title="Supplier Roll-up" sub="Same numbers grouped by supplier across all their purchases." />
        <ScrollTable>
          <thead>
            <tr>
              <th style={th}>Supplier</th>
              <th style={{ ...th, textAlign: "right" }}>Purchases</th>
              <th style={{ ...th, textAlign: "right" }}>Purchased</th>
              <th style={{ ...th, textAlign: "right" }}>Outstanding</th>
              <th style={{ ...th, textAlign: "right" }}>Returned</th>
              <th style={{ ...th, textAlign: "right" }}>Unsold Value</th>
              <th style={{ ...th, textAlign: "right" }}>Bill Due</th>
            </tr>
          </thead>
          <tbody>
            {bySupplier.map(r => (
              <tr key={r.supplier}>
                <td style={{ ...td, fontWeight: 600 }}>{r.supplier}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{r.purchases}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{r.bought}</td>
                <td style={{ ...tdMono, textAlign: "right", color: T.crimson }}>{r.unsold}</td>
                <td style={{ ...tdMono, textAlign: "right", color: T.orange }}>{r.returned}</td>
                <td style={{ ...tdMono, textAlign: "right" }}>{inr(r.unsoldValue)}</td>
                <td style={{ ...tdMono, textAlign: "right", color: r.due > 0 ? T.orange : T.green }}>{inr(r.due)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </Card>
    </div>
  );
}
