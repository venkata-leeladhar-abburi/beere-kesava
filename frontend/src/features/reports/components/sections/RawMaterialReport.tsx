import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Scissors, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T, F } from "../theme";
import { FadeUp, ChartCard, TabTitle, ReportDLBar, ChartTip, MiniDonut, TH, TD } from "../common/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { materialIssuesApi } from "../../../../shared/api/material-issues";

const REELS_PER_BUN = 4;
const bunsAndReels = (reels: number) => {
  const buns = Math.floor(reels / REELS_PER_BUN);
  const rem = reels % REELS_PER_BUN;
  return rem > 0 ? `${buns} Buns ${rem} Reel${rem > 1 ? "s" : ""}` : `${buns} Buns`;
};

interface RawMaterialReceiptRow {
  batchId: string;
  dateReceived: string;
  vendor: string;
  firmName: string;
  materialType: "Warp" | "Resham" | "Jari";
  description: string;
  quantity: string;
  unit: string;
  poReference: string;
  notes: string;
}

export function RawMaterialReport() {
  const { data: rawGrns, isLoading: grnLoading, isError: grnError } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const { data: issuesRes, isLoading: issuesLoading, isError: issuesError } = useQuery({
    queryKey: ["reports", "material-issues"],
    queryFn: () => materialIssuesApi.list(200),
  });

  const { data: stockRes, isLoading: stockLoading, isError: stockError } = useQuery({
    queryKey: ["reports", "raw-materials-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const receiptRows = useMemo<RawMaterialReceiptRow[]>(() => {
    if (!rawGrns?.items || rawGrns.items.length === 0) return [];
    return rawGrns.items.flatMap(g =>
      g.items.map(item => ({
        batchId: g.id,
        dateReceived: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
        vendor: g.supplierName ?? "Vendor",
        firmName: g.firm?.firmName ?? "—",
        materialType: (item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari") as "Warp" | "Resham" | "Jari",
        description: item.name,
        quantity: String(item.quantity),
        unit: item.quantity > 10 ? "kg" : "Buns",
        poReference: g.invoiceNo ?? `PO-${g.id.slice(-6)}`,
        notes: g.notes ?? "",
      }))
    );
  }, [rawGrns]);

  // Dynamic calculation for Received from Vendors chart (by Material Type)
  const rawReceivedData = useMemo(() => {
    const totals: Record<string, { current: number; prior: number }> = {
      Warp: { current: 0, prior: 0 },
      Resham: { current: 0, prior: 0 },
      Jari: { current: 0, prior: 0 },
    };

    if (rawGrns?.items) {
      for (const grn of rawGrns.items) {
        for (const item of grn.items) {
          const type = item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari";
          totals[type].current += Number(item.quantity || 0);
        }
      }
    }

    return [
      { material: "Warp", current: totals.Warp.current, prior: totals.Warp.prior },
      { material: "Resham", current: totals.Resham.current, prior: totals.Resham.prior },
      { material: "Jari", current: totals.Jari.current, prior: totals.Jari.prior },
    ];
  }, [rawGrns]);

  // Dynamic calculation for Material Given to Weavers chart
  const rawGivenData = useMemo(() => {
    const totals: Record<string, { current: number; prior: number }> = {
      Warp: { current: 0, prior: 0 },
      Resham: { current: 0, prior: 0 },
      Jari: { current: 0, prior: 0 },
    };

    if (issuesRes?.items) {
      for (const issue of issuesRes.items) {
        for (const item of issue.items) {
          const type = item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari";
          totals[type].current += Number(item.quantity || 0);
        }
      }
    }

    return [
      { material: "Warp", current: totals.Warp.current, prior: totals.Warp.prior },
      { material: "Resham", current: totals.Resham.current, prior: totals.Resham.prior },
      { material: "Jari", current: totals.Jari.current, prior: totals.Jari.prior },
    ];
  }, [issuesRes]);

  // Dynamic calculation for Stock Items & Mini Donut cards
  const stockItems = stockRes?.items ?? [];
  const stockByType = useMemo(() => {
    const map: Record<string, { stock: number; outOfStockCount: number; totalCount: number; unit: string }> = {
      WARP: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "kg" },
      RESHAM: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "kg" },
      JARI: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "reels" },
    };

    for (const item of stockItems) {
      const type = item.materialType;
      if (map[type]) {
        map[type].stock += item.currentStock;
        map[type].totalCount++;
        if (item.currentStock <= 0) map[type].outOfStockCount++;
      }
    }

    return map;
  }, [stockItems]);

  const rawMaterialRows = useMemo(() => {
    if (stockItems.length === 0) return [];
    return stockItems.map(item => {
      const sub = [item.name, item.color, item.grade].filter(Boolean).join(" - ");
      const close = item.currentStock;
      const oos = close <= 0;
      return {
        type: item.materialType,
        sub,
        open: Math.max(0, close), // derived stock
        recv: 0,
        given: 0,
        close,
        change: oos ? "— Out of Stock" : "Healthy",
        oos,
        unit: item.unit.toLowerCase(),
      };
    });
  }, [stockItems]);

  const totalsSummary = useMemo(() => {
    const recvTotal = rawReceivedData.reduce((s, r) => s + r.current, 0);
    const givenTotal = rawGivenData.reduce((s, r) => s + r.current, 0);
    const closeTotal = stockItems.reduce((s, item) => s + item.currentStock, 0);
    return { recvTotal, givenTotal, closeTotal };
  }, [rawReceivedData, rawGivenData, stockItems]);

  const isLoading = grnLoading || issuesLoading || stockLoading;

  return (
    <div id="rep-raw-materials" style={{ padding: "32px 40px" }}>
      <TabTitle title="Raw Material Report"
        sub="Track everything about raw material — how much was received from vendors, how much was given to weavers, and how much is still in the factory. Warp, Resham, and Jari tracked separately." />
      <ReportDLBar />

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <ChartCard title="Raw Material Received from Vendors" sub="Current Period" icon={<Package size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawReceivedData} barGap={4}>
              <CartesianGrid key="rm-recv-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-recv-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-recv-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-recv-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-recv-cur" dataKey="current" name="Received" fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: T.royalBurgundy }} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Total Received</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Material Given to Weavers" sub="Current Period" icon={<Scissors size={22} color={T.green} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawGivenData} barGap={4}>
              <CartesianGrid key="rm-gvn-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-gvn-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-gvn-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-gvn-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-gvn-cur" dataKey="current" name="Given to Weavers" fill={T.green} radius={[4,4,0,0] as any} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: T.green }} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Total Given</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="What Is In Stock Right Now" sub="Current closing stock levels" icon={<BarChart2 size={22} color={T.antiqueGold} />}>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", padding: "12px 0 8px" }}>
            <MiniDonut
              value={stockByType.WARP.stock}
              max={Math.max(200, stockByType.WARP.stock)}
              color={T.royalBurgundy}
              label="Warp"
              badge={stockByType.WARP.outOfStockCount > 0 ? `${stockByType.WARP.outOfStockCount} Out of Stock` : "Healthy"}
              badgeType={stockByType.WARP.outOfStockCount > 0 ? "low" : "ok"}
            />
            <MiniDonut
              value={stockByType.RESHAM.stock}
              max={Math.max(150, stockByType.RESHAM.stock)}
              color={T.antiqueGold}
              label="Resham"
              badge={stockByType.RESHAM.outOfStockCount > 0 ? `${stockByType.RESHAM.outOfStockCount} Out of Stock` : "Healthy"}
              badgeType={stockByType.RESHAM.outOfStockCount > 0 ? "low" : "ok"}
            />
            <MiniDonut
              value={stockByType.JARI.stock}
              max={Math.max(80, stockByType.JARI.stock)}
              color={T.green}
              label="Jari"
              unit="reels"
              footNote={bunsAndReels(stockByType.JARI.stock)}
              badge={stockByType.JARI.outOfStockCount > 0 ? `${stockByType.JARI.outOfStockCount} Out of Stock` : "Healthy"}
              badgeType={stockByType.JARI.outOfStockCount > 0 ? "low" : "ok"}
            />
          </div>
        </ChartCard>
      </div>

      {/* Comparison table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={TH}>Material Type</th>
                  <th style={TH}>Sub-type / Color / Grade</th>
                  <th style={{ ...TH, textAlign: "right" }}>Stock Level</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td style={TD} colSpan={4}>Loading…</td></tr>
                )}
                {!isLoading && rawMaterialRows.length === 0 && (
                  <tr><td style={TD} colSpan={4}>No raw material items in stock database yet.</td></tr>
                )}
                {!isLoading && rawMaterialRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.type === "WARP" ? T.royalBurgundy : r.type === "RESHAM" ? T.antiqueGold : T.green}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: r.close === 0 ? T.crimson : T.luxuryBrown }}>{r.close} {r.unit}</div>
                      {r.unit === "reels" && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{bunsAndReels(r.close)}</div>}
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: r.oos ? T.crimson : T.green }}>{r.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {rawMaterialRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                    <td colSpan={2} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, background: T.warmCream }}>Total Closing Stock</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream }}>{totalsSummary.closeTotal} kg / reels</td>
                    <td style={{ ...TD, background: T.warmCream }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Materials Received — Batch Log */}
      <FadeUp>
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>Materials Received — Batch Log</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Every material batch received from a vendor against a purchase order, with its GRN batch ID.</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={TH}>Batch ID</th>
                    <th style={TH}>Date Received</th>
                    <th style={TH}>Vendor</th>
                    <th style={TH}>Firm Name</th>
                    <th style={TH}>Material Type</th>
                    <th style={TH}>Description</th>
                    <th style={{ ...TH, textAlign: "right" }}>Quantity</th>
                    <th style={TH}>Unit</th>
                    <th style={TH}>PO Reference</th>
                    <th style={TH}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {grnLoading && (
                    <tr><td style={TD} colSpan={10}>Loading…</td></tr>
                  )}
                  {grnError && (
                    <tr><td style={{ ...TD, color: T.crimson }} colSpan={10}>Failed to load material receipts.</td></tr>
                  )}
                  {!grnLoading && !grnError && receiptRows.length === 0 && (
                    <tr><td style={TD} colSpan={10}>No material receipts recorded yet.</td></tr>
                  )}
                  {!grnLoading && !grnError && receiptRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.materialType === "Warp" ? T.royalBurgundy : r.materialType === "Resham" ? T.antiqueGold : T.green}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.batchId}</span></td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{r.dateReceived}</td>
                      <td style={TD}>{r.vendor}</td>
                      <td style={TD}>{r.firmName}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{r.materialType}</span>
                      </td>
                      <td style={TD}>{r.description}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 600 }}>{r.quantity}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.unit}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.poReference}</td>
                      <td style={{ ...TD, fontSize: 12, color: T.taupe }}>{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
