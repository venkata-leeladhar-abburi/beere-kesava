import React, { useContext, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Download } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, EASE, MobileCtx } from "../theme";
import { SectionHeader, FadeUp } from "../common/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { materialIssuesApi } from "../../../../shared/api/material-issues";

function parseKg(quantity: number | string | null | undefined, unit?: string | null): number {
  const q = Number(quantity || 0);
  if (!unit) return q;
  const u = unit.trim().toLowerCase();
  if (u === "g" || u === "gram" || u === "grams") return q / 1000;
  return q;
}

export function MovementHistorySection({ onDownloadMovementReport }: { onDownloadMovementReport: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const { data: rawGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const { data: rawIssues } = useQuery({
    queryKey: ["material-issues"],
    queryFn: () => materialIssuesApi.list(100),
  });

  const { data: rawStock } = useQuery({
    queryKey: ["raw-material-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const stats = useMemo(() => {
    const grns = rawGrns?.items ?? [];
    const issues = rawIssues?.items ?? [];
    const stockItems = rawStock?.items ?? [];

    let receivedKg = 0;
    grns.forEach(g => {
      g.items.forEach(i => {
        receivedKg += parseKg(i.quantity, (i as any).unit || "KG");
      });
    });

    let issuedKg = 0;
    issues.forEach(iss => {
      iss.items.forEach(i => {
        issuedKg += parseKg(i.quantity, i.unit);
      });
    });

    const currentStockKg = stockItems.reduce((sum, s) => sum + parseKg(s.currentStock, s.unit), 0);
    const inFactoryKg = currentStockKg > 0 ? currentStockKg : Math.max(0, receivedKg - issuedKg);

    // Timeline entries
    const grnEntries = grns.map(g => {
      const totalQtyKg = g.items.reduce((s, i) => s + parseKg(i.quantity, (i as any).unit || "KG"), 0);
      return {
        type: "in" as const,
        desc: `${g.supplierName ?? "Vendor"} — ${g.items.map(i => `${i.name} (${i.quantity} ${i.materialType === "JARI" ? (i.unit || "Reels") : (i.unit || "kg")})`).join(", ")}`,
        time: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
        ref: g.id,
        date: g.receivedDate ? new Date(g.receivedDate).getTime() : Date.now(),
        qty: Math.round(totalQtyKg * 10) / 10,
        monthLabel: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) : "Recent",
      };
    });

    const issueEntries = issues.map(iss => {
      const totalQtyKg = iss.items.reduce((s, i) => s + parseKg(i.quantity, i.unit), 0);
      return {
        type: "out" as const,
        desc: `Issued to Weaver/Loom — ${iss.items.map(i => `${i.materialType} ${i.quantity} ${i.unit}`).join(", ")}`,
        time: new Date(iss.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        ref: iss.id,
        date: new Date(iss.issuedAt).getTime(),
        qty: Math.round(totalQtyKg * 10) / 10,
        monthLabel: new Date(iss.issuedAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      };
    });

    const entries = [...grnEntries, ...issueEntries].sort((a, b) => b.date - a.date);

    // Dynamic Chart Data aggregated by month
    const chartMap = new Map<string, { label: string; received: number; given: number; timestamp: number }>();

    grnEntries.forEach(g => {
      const existing = chartMap.get(g.monthLabel) ?? { label: g.monthLabel, received: 0, given: 0, timestamp: g.date };
      existing.received += g.qty;
      chartMap.set(g.monthLabel, existing);
    });

    issueEntries.forEach(i => {
      const existing = chartMap.get(i.monthLabel) ?? { label: i.monthLabel, received: 0, given: 0, timestamp: i.date };
      existing.given += i.qty;
      chartMap.set(i.monthLabel, existing);
    });

    const chartData = Array.from(chartMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const finalChartData = chartData.length > 0 ? chartData : [
      { label: "Current", received: Math.round(receivedKg), given: Math.round(issuedKg), timestamp: Date.now() }
    ];

    return {
      receivedKg: Math.round(receivedKg),
      issuedKg: Math.round(issuedKg),
      inFactoryKg: Math.round(inFactoryKg),
      entries,
      chartData: finalChartData,
    };
  }, [rawGrns, rawIssues, rawStock]);

  return (
    <section id="mat-movement" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="Full Movement History — Stock Coming In and Going Out"
        action="Download Report"
        actionIcon={<Download size={15} />}
        onAction={onDownloadMovementReport}
        actionVariant="gold"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, margin: "0 0 22px", lineHeight: 1.65 }}>
        Every time material came into the factory from a vendor, or was given out to a weaver — it is recorded here.
      </p>

      <div style={{ marginBottom: 26 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.07)", overflow: "hidden", marginBottom: 28 }}>
          <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid rgba(110,15,45,0.07)`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>Stock Coming In vs Going Out</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>How much material was received from vendors vs given out to weavers each week</div>
            </div>
          </div>

          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 32, alignItems: "stretch" }}>
            <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column" }}>
              {(() => {
                const maxVal = Math.max(1, ...stats.chartData.flatMap(d => [d.received, d.given]));
                return (
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, minHeight: 220 }}>
                    {stats.chartData.map(d => (
                      <div key={d.label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 5, width: "100%", justifyContent: "center" }}>
                          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, ease: EASE }} style={{ width: 18, height: `${(d.received / maxVal) * 100}%`, background: T.royalBurgundy, borderRadius: "5px 5px 0 0", minHeight: 4, transformOrigin: "bottom" }} />
                          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.1, ease: EASE }} style={{ width: 18, height: `${(d.given / maxVal) * 100}%`, background: T.antiqueGold, borderRadius: "5px 5px 0 0", minHeight: 4, transformOrigin: "bottom" }} />
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textAlign: "center", lineHeight: 1.35, marginTop: 8, flexShrink: 0 }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 24, marginTop: 20, flexShrink: 0 }}>
                {[["Received from Vendor", T.royalBurgundy], ["Given to Weavers", T.antiqueGold]].map(([label, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total received from vendors", value: `${stats.receivedKg} kg`, sub: "Across all deliveries in this period",  color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)",  border: "rgba(110,15,45,0.14)"  },
                { label: "Total given to weavers",      value: `${stats.issuedKg} kg`, sub: "Across all issue slips in this period", color: T.antiqueGold,   bg: "rgba(200,155,71,0.06)", border: "rgba(200,155,71,0.20)" },
                { label: "Currently still in factory",  value: `${stats.inFactoryKg} kg`, sub: "Net stock remaining in the store",      color: T.green,         bg: "rgba(30,102,64,0.06)",  border: "rgba(30,102,64,0.20)"  },
              ].map(row => (
                <div key={row.label} style={{ flex: 1, background: row.bg, border: `1px solid ${row.border}`, borderRadius: 14, padding: "22px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.taupe, marginBottom: 8 }}>{row.label}</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: row.color, lineHeight: 1.1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{row.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{row.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>Every Movement Entry</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Each line below is one movement — material arriving or leaving the factory store.</div>
          </div>

          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
            {stats.entries.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                No material movement entries recorded yet.
              </div>
            ) : stats.entries.map((entry, i) => (
              <motion.div
                key={entry.ref}
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03, ease: EASE }}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                  borderBottom: i < stats.entries.length - 1 ? `1px solid ${T.borderDef}` : "none",
                  background: i % 2 === 0 ? "transparent" : T.silkCream,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.type === "in" ? T.green : T.crimson, flexShrink: 0 }} />

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.luxuryBrown }}>{entry.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: entry.type === "in" ? T.green : T.crimson, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {entry.type === "in" ? "Received" : "Given"}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{entry.time}</span>
                  </div>
                </div>

                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.5px", background: "rgba(110,15,45,0.05)", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}>
                  {entry.ref}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
