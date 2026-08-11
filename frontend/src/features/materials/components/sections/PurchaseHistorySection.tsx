import React, { useContext, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { PieChart, Pie, Cell } from "recharts";
import { Layers, Tag, Sparkles, Calculator, Users, IndianRupee, Download, History } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, EASE, MobileCtx } from "../theme";
import { MAT_TAG } from "../materialConfig";
import { SectionCard, FadeUp, AnimatedBar } from "../common/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { purchaseOrdersApi } from "../../../../shared/api/purchase-orders";
import { vendorsApi } from "../../../../shared/api/vendors";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Button } from "../../../../shared/ui/primitives";

interface VendorRow {
  name: string;
  materials: { type: string; label: string }[];
  totals: string[];
  paid: string;
  orders: number;
  last: string;
}

function formatCurrency(n: number | string) {
  const val = Number(n) || 0;
  return formatMoney(rupees(val));
}

export function PurchaseHistorySection({ onDownloadReport }: { onDownloadReport: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const { data: rawGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const { data: rawPos } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => purchaseOrdersApi.list(100),
  });

  const { data: rawVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => vendorsApi.list(100),
  });

  const stats = useMemo(() => {
    const grns = rawGrns?.items ?? [];
    const pos = rawPos?.items ?? [];
    const vendors = rawVendors?.items ?? [];

    let warpKg = 0;
    let reshamKg = 0;
    let jariReels = 0;

    let warpSpend = 0;
    let reshamSpend = 0;
    let jariSpend = 0;

    const warpVendors = new Set<string>();
    const reshamVendors = new Set<string>();
    const jariVendors = new Set<string>();

    grns.forEach(g => {
      const vName = g.supplierName ?? "Vendor";
      g.items.forEach(i => {
        const qty = Number(i.quantity || 0);
        const unitPrice = Number(i.unitPrice || 0);
        const total = Number(i.totalPrice || 0) || (qty * unitPrice);

        if (i.materialType === "WARP") {
          warpKg += qty;
          warpSpend += total;
          warpVendors.add(vName);
        } else if (i.materialType === "RESHAM") {
          reshamKg += qty;
          reshamSpend += total;
          reshamVendors.add(vName);
        } else if (i.materialType === "JARI") {
          jariReels += qty;
          jariSpend += total;
          jariVendors.add(vName);
        }
      });
    });

    const poTotalSpend = pos.reduce((sum, p) => sum + Number(p.totalValue || 0), 0);
    const grnTotalSpend = warpSpend + reshamSpend + jariSpend;
    const totalSpent = Math.max(poTotalSpend, grnTotalSpend);

    const avgPoValue = pos.length > 0 ? Math.round(totalSpent / pos.length) : 0;
    const activeVendors = vendors.filter(v => v.status === "ACTIVE").length;

    // Per-vendor breakdown table
    const vendorMap = new Map<string, {
      name: string;
      materials: Set<string>;
      warpQty: number;
      reshamQty: number;
      jariQty: number;
      paid: number;
      orders: number;
      lastDate: string;
    }>();

    pos.forEach(p => {
      const name = p.vendor?.name ?? "Unknown Vendor";
      const entry = vendorMap.get(name) ?? {
        name,
        materials: new Set<string>(),
        warpQty: 0,
        reshamQty: 0,
        jariQty: 0,
        paid: 0,
        orders: 0,
        lastDate: p.createdAt,
      };
      entry.paid += Number(p.totalValue || 0);
      entry.orders += 1;
      if (new Date(p.createdAt) > new Date(entry.lastDate)) {
        entry.lastDate = p.createdAt;
      }
      vendorMap.set(name, entry);
    });

    grns.forEach(g => {
      const name = g.supplierName ?? "Unknown Vendor";
      const entry = vendorMap.get(name) ?? {
        name,
        materials: new Set<string>(),
        warpQty: 0,
        reshamQty: 0,
        jariQty: 0,
        paid: 0,
        orders: 0,
        lastDate: g.receivedDate,
      };
      g.items.forEach(i => {
        const matType = i.materialType === "WARP" ? "Warp" : i.materialType === "RESHAM" ? "Resham" : "Jari";
        entry.materials.add(matType);
        const qty = Number(i.quantity || 0);
        const unitPrice = Number(i.unitPrice || 0);
        const total = Number(i.totalPrice || 0) || (qty * unitPrice);

        if (i.materialType === "WARP") entry.warpQty += qty;
        else if (i.materialType === "RESHAM") entry.reshamQty += qty;
        else if (i.materialType === "JARI") entry.jariQty += qty;
        entry.paid += total;
      });
      if (!entry.orders) entry.orders = 1;
      if (new Date(g.receivedDate) > new Date(entry.lastDate)) {
        entry.lastDate = g.receivedDate;
      }
      vendorMap.set(name, entry);
    });

    const vendorRows = Array.from(vendorMap.values()).map(v => {
      const materialsList = Array.from(v.materials).map(m => ({ type: m, label: m }));
      const totalsList: string[] = [];
      if (v.warpQty > 0) totalsList.push(`${v.warpQty} kg Warp`);
      if (v.reshamQty > 0) totalsList.push(`${v.reshamQty} kg Resham`);
      if (v.jariQty > 0) totalsList.push(`${v.jariQty} Reels Jari`);
      if (totalsList.length === 0) totalsList.push("Material Supplies");

      return {
        name: v.name,
        materials: materialsList,
        totals: totalsList,
        paid: formatCurrency(v.paid),
        orders: v.orders,
        last: v.lastDate ? new Date(v.lastDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
      };
    });

    const grnMaterialTotalSpend = warpSpend + reshamSpend + jariSpend;
    const spendTotalForChart = grnMaterialTotalSpend > 0 ? grnMaterialTotalSpend : totalSpent;

    const warpPct = spendTotalForChart > 0 ? Math.round((warpSpend / spendTotalForChart) * 100) : 0;
    const reshamPct = spendTotalForChart > 0 ? Math.round((reshamSpend / spendTotalForChart) * 100) : 0;
    const jariPct = spendTotalForChart > 0 ? Math.max(0, 100 - warpPct - reshamPct) : 0;

    const spendData = [
      { name: "Warp", pct: warpPct, value: formatCurrency(warpSpend), color: T.royalBurgundy },
      { name: "Resham", pct: reshamPct, value: formatCurrency(reshamSpend), color: T.antiqueGold },
      { name: "Jari", pct: jariPct, value: formatCurrency(jariSpend), color: T.luxuryBrown },
    ];

    return {
      warpKg,
      warpSpend,
      warpVendorsCount: warpVendors.size,
      reshamKg,
      reshamSpend,
      reshamVendorsCount: reshamVendors.size,
      jariReels,
      jariSpend,
      jariVendorsCount: jariVendors.size,
      avgPoValue,
      activeVendors,
      totalSpent,
      vendorRows,
      spendData,
    };
  }, [rawGrns, rawPos, rawVendors]);

  const vendorColumns: ColumnDef<VendorRow>[] = [
    {
      id: "name", header: "Vendor Name", accessor: v => v.name,
      cell: (_v, v) => <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{v.name}</span>,
    },
    {
      id: "materials", header: "Material Supplied", accessor: v => v.materials,
      cell: (_v, v) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
          {v.materials.map(m => {
            const mt = MAT_TAG[m.type as keyof typeof MAT_TAG] || MAT_TAG.Warp;
            return <span key={m.label} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: mt.col, background: mt.bg, padding: "4px 11px", borderRadius: 7, letterSpacing: "1.2px", whiteSpace: "nowrap" }}>{m.label}</span>;
          })}
        </div>
      ),
    },
    {
      id: "totals", header: "Total Purchased", accessor: v => v.totals,
      cell: (_v, v) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {v.totals.map((t, idx) => <div key={idx} style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{t}</div>)}
        </div>
      ),
    },
    {
      id: "paid", header: "Total Paid", accessor: v => v.paid,
      cell: (_v, v) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.antiqueGold }}>{v.paid}</span>,
    },
    {
      id: "orders", header: "Orders", accessor: v => v.orders, align: "center",
      cell: (_v, v) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{v.orders}</span>,
    },
    {
      id: "last", header: "Last Purchase", accessor: v => v.last,
      cell: (_v, v) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{v.last}</span>,
    },
  ];

  return (
    <section id="mat-purchase-history" style={{ padding: `44px ${px}px 0` }}>
    <SectionCard
      icon={History}
      title="Purchase History From All Vendors"
      subtitle="Everything ever purchased and received — from the day this system was started until today. Filter by a specific date range below."
      actions={
        <Button onClick={onDownloadReport} variant="secondary" size="sm" iconLeft={Download}>
          Download Report
        </Button>
      }
    >
      <FadeUp>
        <div style={{ marginBottom: 24 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, 1fr)", gap: isMobile ? 12 : 18, marginBottom: 26, alignItems: "stretch" }}>
        {[
          { Icon: Layers,      label: "Total Warp Purchased",   amount: `${stats.warpKg.toLocaleString("en-IN")} kg`, cost: formatCurrency(stats.warpSpend), sub: `From ${stats.warpVendorsCount} vendor${stats.warpVendorsCount === 1 ? "" : "s"}`, dark: false },
          { Icon: Tag,         label: "Total Resham Purchased", amount: `${stats.reshamKg.toLocaleString("en-IN")} kg`, cost: formatCurrency(stats.reshamSpend), sub: `From ${stats.reshamVendorsCount} vendor${stats.reshamVendorsCount === 1 ? "" : "s"}`, dark: false },
          { Icon: Sparkles,    label: "Total Jari Purchased",   amount: `${stats.jariReels.toLocaleString("en-IN")} Reels`, cost: formatCurrency(stats.jariSpend), sub: `From ${stats.jariVendorsCount} vendor${stats.jariVendorsCount === 1 ? "" : "s"}`, dark: false },
          { Icon: Calculator,  label: "Average Order Value",    amount: formatCurrency(stats.avgPoValue), cost: "", sub: "Average value per PO", dark: false },
          { Icon: Users,       label: "Active Vendors",         amount: `${stats.activeVendors} Vendor${stats.activeVendors === 1 ? "" : "s"}`, cost: "", sub: "Vendors with history", dark: false },
          { Icon: IndianRupee, label: "TOTAL AMOUNT SPENT",     amount: formatCurrency(stats.totalSpent), cost: "", sub: "Total raw materials", dark: true },
        ].map((card, i) => (
          <FadeUp key={card.label} delay={i * 0.09} style={{ height: "100%" }}>
            <div style={{ background: card.dark ? T.darkBurgundy : "#FFFFFF", borderRadius: 16, border: `1px solid ${card.dark ? "transparent" : T.borderDef}`, padding: "22px 22px 20px", boxShadow: card.dark ? "0 8px 32px rgba(61,14,26,0.30)" : "0 2px 12px rgba(74,6,27,0.06)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              {card.dark && <>
                <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 140, height: 140, borderRadius: "50%", background: "rgba(200,155,71,0.07)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 100, height: 100, borderRadius: "50%", background: "rgba(200,155,71,0.05)", pointerEvents: "none" }} />
              </>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: card.dark ? "rgba(200,155,71,0.12)" : "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <card.Icon size={19} color={card.dark ? T.antiqueGold : T.royalBurgundy} />
                </div>
                <span style={{ fontFamily: card.dark ? F.mono : F.ui, fontWeight: 600, fontSize: card.dark ? 10 : 13, color: card.dark ? "rgba(200,155,71,0.85)" : T.taupe, letterSpacing: card.dark ? "2px" : 0, textTransform: card.dark ? "uppercase" : "none", lineHeight: 1.3 }}>{card.label}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: card.dark ? T.goldLight : T.luxuryBrown, lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{card.amount}</div>
              {card.cost && <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 16, color: T.antiqueGold, marginBottom: 8 }}>{card.cost}</div>}
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: card.dark ? "rgba(255,253,249,0.55)" : T.taupe, lineHeight: 1.5, marginTop: "auto" }}>{card.sub}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 16px rgba(74,6,27,0.06)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "22px 26px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>How Much Was Bought From Each Vendor</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.55 }}>Each vendor listed separately — what material they supplied, how much, and what it cost in total.</div>
          </div>
          <div style={{ overflowX: "auto", minWidth: 800 }}>
            <DataTable
              columns={vendorColumns}
              data={stats.vendorRows}
              getRowId={v => v.name}
              emptyTitle="No purchase history found across vendors."
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.warmCream, padding: "16px 18px", borderTop: `1px solid ${T.borderDef}` }}>
            <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.taupe }}>Grand Total across all vendors:</span>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.antiqueGold }}>{formatCurrency(stats.totalSpent)}</span>
          </div>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 22 }}>
        <FadeUp delay={0.1}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "24px 26px 22px", boxShadow: "0 2px 16px rgba(74,6,27,0.06)", height: "100%" }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>Total Spend Split</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 22, lineHeight: 1.5 }}>How much of your total spend goes to each material type</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie data={stats.spendData} cx={80} cy={80} innerRadius={48} outerRadius={72} dataKey="pct" paddingAngle={3}>
                    {stats.spendData.map((entry) => <Cell key={`spend-cell-${entry.name}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {stats.spendData.map(s => (
                  <div key={s.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: s.color }}>{s.pct}%</span>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.antiqueGold, paddingLeft: 22 }}>{s.value}</div>
                    <AnimatedBar pct={s.pct} color={s.color} height={5} trackBg="rgba(110,15,45,0.07)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </SectionCard>
    </section>
  );
}
