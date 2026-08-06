import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Factory, CheckCircle2, Boxes, Package, AlertTriangle, Truck, IndianRupee,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { T, F } from "../theme";
import {
  FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar,
  TablePager, StatusPill, TH, TD,
} from "../common/primitives";
import { batchesApi } from "../../../../shared/api/batches";
import { qcApi } from "../../../../shared/api/qc";
import { weaversApi } from "../../../../shared/api/weavers";
import { reportsApi } from "../../../../shared/api/reports";

// MOCK: no backend endpoint tracks weekly production trend, own-factory vs
// outsourced split, or per-pipeline-stage saree counts (dispatched / finished
// / assigned-to-finishing / etc). GET /reports/production-summary only
// returns a total count and a QC pass/semi/defective breakdown — that part
// (the QC donut below) is wired live; these three stay on static demo data.
const PRODUCTION_SOURCE_DATA = [
  { name: "Own Factory",          value: 142, fill: "#6E0F2D" },
  { name: "Outsourced (Weavers)", value: 106, fill: "#C89B47" },
];

const prodWeeklyData = [
  { week: "W1", may: 58, apr: 50 },
  { week: "W2", may: 64, apr: 55 },
  { week: "W3", may: 72, apr: 62 },
  { week: "W4", may: 54, apr: 48 },
];
const prodStageData = [
  { stage: "Dispatched",          count: 186, color: "#69635E" },
  { stage: "Finished",            count: 186, color: "#3B5F4E" },
  { stage: "Assigned to Finishing",count: 24, color: T.darkBurgundy },
  { stage: "Quality Check Passed", count: 238, color: T.green },
  { stage: "Waiting Quality Check",count: 14,  color: T.royalBurgundy },
  { stage: "Weaving in Progress",  count: 48,  color: T.antiqueGold },
];
// MOCK: no backend module exists yet for ready-made sarees bought from
// external suppliers (separate from the weaver-production pipeline) — no
// /external-purchases endpoint or similar. Mirrors ExternalPurchasesPage's
// data shape; that page is on the same static sample data for the same reason.
const externalPurchaseRows = [
  { supplier: "Ravi Silks",                location: "Dharmavaram, AP", gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-118", billAmount: 34000,  sareeCount: 4,  date: "01 Jun 2026", sareeIds: ["EXT-2026-0001-001", "EXT-2026-0001-002", "EXT-2026-0001-003", "EXT-2026-0001-004"] },
  { supplier: "Mysore Sarees",             location: "Mysore, KA",      gstNumber: "29MYSRS5678K1Z2", invoiceNumber: "INV-MS-2026-552", billAmount: 74400,  sareeCount: 12, date: "05 Jun 2026", sareeIds: ["EXT-2026-0002-001", "EXT-2026-0002-002", "EXT-2026-0002-003"] },
  { supplier: "Chennai Silks",             location: "Chennai, TN",     gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-073", billAmount: 66000,  sareeCount: 6,  date: "08 Jun 2026", sareeIds: ["EXT-2026-0003-001", "EXT-2026-0003-002"] },
  { supplier: "Kanchipuram House",         location: "Kanchipuram, TN", gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-209", billAmount: 88000,  sareeCount: 8,  date: "10 Jun 2026", sareeIds: ["EXT-2026-0004-001", "EXT-2026-0004-002"] },
  { supplier: "Venkateshwara Handlooms",   location: "Ongole, AP",      gstNumber: "37VENK7890N1Z6", invoiceNumber: "INV-VH-2026-014", billAmount: 22500,  sareeCount: 3,  date: "11 Jun 2026", sareeIds: ["EXT-2026-0005-001"] },
];

export function ExternalPurchasesSection() {
  const totalSarees = externalPurchaseRows.reduce((s, r) => s + r.sareeCount, 0);
  const totalBill = externalPurchaseRows.reduce((s, r) => s + r.billAmount, 0);
  return (
    <FadeUp>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>External Purchases</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Sarees purchased ready-made from external suppliers — separate from factory production.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total External Sarees Purchased" value={`${totalSarees} sarees`} sub="This period" />
          <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Bill Amount" value={`₹${totalBill.toLocaleString("en-IN")}`} sub="Across all suppliers" hi />
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={TH}>Vendor / Supplier</th>
                  <th style={TH}>GST Number</th>
                  <th style={TH}>Invoice Number</th>
                  <th style={{ ...TH, textAlign: "right" }}>Bill Amount</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Saree IDs</th>
                </tr>
              </thead>
              <tbody>
                {externalPurchaseRows.map((r, i) => (
                  <tr key={r.invoiceNumber} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.antiqueGold}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.supplier}</span></td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{r.gstNumber}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.invoiceNumber}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.billAmount.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.sareeCount}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{r.date}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.sareeIds.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

export function SareeProductionReport() {
  const { data: batchesRes } = useQuery({ queryKey: ["reports", "batches"], queryFn: () => batchesApi.list() });
  const { data: qcRes } = useQuery({ queryKey: ["reports", "qc"], queryFn: () => qcApi.list() });
  const { data: weaversRes } = useQuery({ queryKey: ["reports", "weavers-roster"], queryFn: () => weaversApi.list() });
  const { data: production } = useQuery({ queryKey: ["reports", "production-summary"], queryFn: () => reportsApi.productionSummary() });

  const prodTableRows = useMemo(() => {
    const batches = batchesRes?.items ?? [];
    const qcBySareeId = new Map((qcRes?.items ?? []).filter(q => q.sareeId).map(q => [q.sareeId, q]));
    const weaverNameById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.name]));

    interface Acc { batches: Set<string>; produced: number; passed: number; rejected: number; designs: Set<string>; charges: number }
    const byWeaver = new Map<string, Acc>();
    for (const batch of batches) {
      for (const row of batch.rows) {
        if (row.recipientType !== "WEAVER" || !row.weaverId) continue;
        let acc = byWeaver.get(row.weaverId);
        if (!acc) { acc = { batches: new Set(), produced: 0, passed: 0, rejected: 0, designs: new Set(), charges: 0 }; byWeaver.set(row.weaverId, acc); }
        acc.batches.add(row.batchId);
        acc.produced += 1;
        if (row.designCode) acc.designs.add(row.designCode);
        const qc = row.sareeId ? qcBySareeId.get(row.sareeId) : undefined;
        if (qc) {
          if (qc.result === "PASSED") acc.passed += 1;
          else if (qc.result === "DEFECTIVE") acc.rejected += 1;
          acc.charges += Number(qc.payable);
        }
      }
    }
    return Array.from(byWeaver.entries()).map(([weaverId, acc]) => ({
      code: weaverId,
      name: weaverNameById.get(weaverId) ?? "Unknown Weaver",
      batches: acc.batches.size,
      produced: acc.produced,
      passed: acc.passed,
      rejected: acc.rejected,
      passRate: acc.produced > 0 ? Math.round((acc.passed / acc.produced) * 100) : 0,
      designs: acc.designs.size > 0 ? Array.from(acc.designs).join(", ") : "—",
      charges: acc.charges,
    })).sort((a, b) => b.produced - a.produced);
  }, [batchesRes, qcRes, weaversRes]);

  const qcDonutData = [
    { name: "Passed",     value: production?.qcByResult.PASSED ?? 0,    color: T.green },
    { name: "Semi",       value: production?.qcByResult.SEMI ?? 0,      color: T.antiqueGold },
    { name: "Rejected",   value: production?.qcByResult.DEFECTIVE ?? 0, color: T.crimson },
  ];
  const totalQc = qcDonutData.reduce((s, d) => s + d.value, 0);
  const passRatePct = totalQc > 0 ? Math.round((qcDonutData[0].value / totalQc) * 100) : 0;
  const dispatchedCount = production?.finishingByStatus?.["DISPATCHED"] ?? 0;

  return (
    <div id="rep-production" style={{ padding: "32px 40px" }}>
      <TabTitle title="Saree Production Report"
        sub="Track how many sarees were produced, which weavers produced them, which designs were made, and how many passed or failed quality check." />
      <ReportDLBar />

      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {["All Sources", "Own Factory Only", "Outsourced Only"].map((f, i) => (
          <div key={i} style={{ padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 500, background: i === 0 ? T.royalBurgundy : "transparent", color: i === 0 ? "#FFF" : T.taupe, border: `1px solid ${i === 0 ? T.royalBurgundy : T.borderDef}` }}>{f}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard title="Sarees Produced Each Week" sub="May 2026 vs April 2026" icon={<TrendingUp size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={prodWeeklyData}>
              <CartesianGrid key="prod-wk-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="prod-wk-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="prod-wk-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="prod-wk-tip" content={<ChartTip suffix=" sarees" />} />
              <Line key="prod-wk-may" type="monotone" dataKey="may" name="May 2026" stroke={T.royalBurgundy} strokeWidth={2.5} dot={{ fill: T.royalBurgundy, r: 4 }} />
              <Line key="prod-wk-apr" type="monotone" dataKey="apr" name="April 2026" stroke={T.antiqueGold} strokeWidth={2} strokeDasharray="5 4" dot={{ fill: T.antiqueGold, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.royalBurgundy, l: "May 2026", dash: false }, { c: T.antiqueGold, l: "April 2026", dash: true }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 18, height: 3, borderRadius: 2, background: x.c, borderTop: x.dash ? `2px dashed ${x.c}` : "none" }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Where Sarees Are Right Now" sub="Production pipeline by stage" icon={<Factory size={22} color={T.antiqueGold} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}>
            {prodStageData.map(s => (
              <div key={s.stage}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{s.stage}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <AnimBar pct={Math.round((s.count / 248) * 100)} color={s.color} height={7} delay={prodStageData.indexOf(s) * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Quality Check This Period" sub="Pass / reject breakdown — May 2026" icon={<CheckCircle2 size={22} color={T.green} />}>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie key="qc-pie" data={qcDonutData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                  dataKey="value" stroke="none" paddingAngle={3}>
                  {qcDonutData.filter(d => d.value > 0).map(e => <Cell key={`qc-cell-${e.name}`} fill={e.color} />)}
                </Pie>
                <Tooltip key="qc-tip" formatter={(v: any, n: any) => [`${v} sarees`, n]}
                  contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>{totalQc > 0 ? `${passRatePct}%` : "—"}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>Pass Rate</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {qcDonutData.filter(d => d.value > 0).map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Own Factory vs Outsourced donut */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Boxes size={24} color={T.royalBurgundy} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0" }}>Own Factory vs Outsourced</h3>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Production source split this period</p>
            </div>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PRODUCTION_SOURCE_DATA} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {PRODUCTION_SOURCE_DATA.map((entry, index) => (
                    <Cell key={`src-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>248</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Sarees</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {PRODUCTION_SOURCE_DATA.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.fill, flexShrink: 0 }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>({Math.round(s.value/248*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 summary cards — live from GET /reports/production-summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total Sarees Produced" value={`${production?.totalSareesProduced ?? 0}`} sub="All batches" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Passed Quality Check" value={`${qcDonutData[0].value}`} sub={totalQc > 0 ? `${passRatePct}% pass rate` : "No QC records yet"} greenHi />
        <SumCard icon={<AlertTriangle size={22} color={T.crimson} />} label="Total Rejected" value={`${qcDonutData[2].value}`} sub={totalQc > 0 ? `${Math.round((qcDonutData[2].value / totalQc) * 100)}% rejection rate` : "No QC records yet"} crimsonHi />
        <SumCard icon={<Truck size={22} color={T.antiqueGold} />} label="Total Dispatched" value={`${dispatchedCount}`} sub="To wholesale customers" hi />
      </div>

      {/* Production table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={TH}>Weaver Code</th>
                  <th style={TH}>Weaver Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Batches</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees Produced</th>
                  <th style={{ ...TH, textAlign: "center" }}>QC Passed</th>
                  <th style={{ ...TH, textAlign: "center" }}>QC Rejected</th>
                  <th style={{ ...TH, textAlign: "center" }}>Pass Rate</th>
                  <th style={TH}>Designs Worked On</th>
                  <th style={{ ...TH, textAlign: "right" }}>Making Charges</th>
                </tr>
              </thead>
              <tbody>
                {prodTableRows.length === 0 && (
                  <tr><td style={TD} colSpan={9}>No sarees assigned to weavers yet.</td></tr>
                )}
                {prodTableRows.map((r, i) => (
                  <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{r.code}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.name}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>{r.batches}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.produced}</td>
                    <td style={{ ...TD, textAlign: "center", color: T.green, fontFamily: F.mono, fontWeight: 700 }}>{r.passed}</td>
                    <td style={{ ...TD, textAlign: "center", color: r.rejected > 0 ? T.crimson : T.taupe, fontFamily: F.mono, fontWeight: 700 }}>{r.rejected > 0 ? r.rejected : "—"}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={`${r.passRate}%`} type={r.passRate >= 95 ? "ok" : r.passRate >= 85 ? "warn" : "bad"} />
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.designs}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy }}>₹{r.charges.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              {prodTableRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                    <td colSpan={3} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, background: T.warmCream }}>Totals ({prodTableRows.length} weavers)</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, background: T.warmCream }}>{prodTableRows.reduce((s, r) => s + r.produced, 0)}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green, background: T.warmCream }}>{prodTableRows.reduce((s, r) => s + r.passed, 0)}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson, background: T.warmCream }}>{prodTableRows.reduce((s, r) => s + r.rejected, 0)}</td>
                    <td style={{ ...TD, background: T.warmCream }} />
                    <td style={{ ...TD, background: T.warmCream }} />
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream }}>₹{prodTableRows.reduce((s, r) => s + r.charges, 0).toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <TablePager total={prodTableRows.length} showing={prodTableRows.length} />
        </div>
      </FadeUp>

      <ExternalPurchasesSection />
    </div>
  );
}
