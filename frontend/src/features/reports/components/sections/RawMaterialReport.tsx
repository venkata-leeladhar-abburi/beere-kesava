import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Scissors, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SectionCard, ReportDLBar, ChartTip, MiniDonut } from "../common/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { materialIssuesApi } from "../../../../shared/api/material-issues";
import { jariToReels, formatBunsReels } from "../../../../shared/lib/weightUnits";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

const bunsAndReels = formatBunsReels;

interface RawMaterialStockRow {
  type: string;
  sub: string;
  open: number;
  recv: number;
  given: number;
  close: number;
  change: string;
  oos: boolean;
  unit: string;
}

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

  const { data: issuesRes, isLoading: issuesLoading, isError: _issuesError } = useQuery({
    queryKey: ["reports", "material-issues"],
    queryFn: () => materialIssuesApi.list(200),
  });

  const { data: stockRes, isLoading: stockLoading, isError: _stockError } = useQuery({
    queryKey: ["reports", "raw-materials-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const receiptRows = useMemo<RawMaterialReceiptRow[]>(() => {
    if (!rawGrns?.items || rawGrns.items.length === 0) return [];
    return rawGrns.items.flatMap(g =>
      g.items.map(item => {
        const isJari = item.materialType === "JARI";
        const reels = isJari ? jariToReels(item.quantity, item.unit ?? "KG") : null;
        return {
          batchId: g.id,
          dateReceived: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          vendor: g.supplierName ?? "Vendor",
          firmName: g.firm?.firmName ?? "—",
          materialType: (item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari") as "Warp" | "Resham" | "Jari",
          description: item.name,
          quantity: isJari ? String(reels) : String(item.quantity),
          unit: isJari ? "Reels" : (item.unit ?? "kg").toLowerCase(),
          poReference: g.invoiceNo ?? `PO-${g.id.slice(-6)}`,
          notes: g.notes ?? "",
        };
      })
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
          // Jari is always tallied in Reels — never sum raw quantities of
          // mismatched units (a GRN row might store it as KG).
          totals[type].current += type === "Jari" ? jariToReels(item.quantity, item.unit ?? "KG") : Number(item.quantity || 0);
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
          totals[type].current += type === "Jari" ? jariToReels(item.quantity, item.unit ?? "REEL") : Number(item.quantity || 0);
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
  const stockItems = useMemo(() => stockRes?.items ?? [], [stockRes]);
  const stockByType = useMemo(() => {
    const map: Record<string, { stock: number; outOfStockCount: number; totalCount: number; unit: string }> = {
      WARP: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "kg" },
      RESHAM: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "kg" },
      JARI: { stock: 0, outOfStockCount: 0, totalCount: 0, unit: "reels" },
    };

    for (const item of stockItems) {
      const type = item.materialType;
      if (map[type]) {
        // Jari is always tallied in Reels regardless of the unit it was
        // recorded in (a GRN/stock row might store it as KG) — never sum
        // raw quantities of mismatched units.
        const qty = type === "JARI" ? jariToReels(item.currentStock, item.unit) : item.currentStock;
        map[type].stock += qty;
        map[type].totalCount++;
        if (qty <= 0) map[type].outOfStockCount++;
      }
    }

    return map;
  }, [stockItems]);

  const rawMaterialRows = useMemo<RawMaterialStockRow[]>(() => {
    if (stockItems.length === 0) return [];
    return stockItems.map(item => {
      const sub = [item.name, item.color, item.grade].filter(Boolean).join(" - ");
      const isJari = item.materialType === "JARI";
      const close = isJari ? jariToReels(item.currentStock, item.unit) : item.currentStock;
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
        unit: isJari ? "reels" : item.unit.toLowerCase(),
      };
    });
  }, [stockItems]);

  const totalsSummary = useMemo(() => {
    const recvTotal = rawReceivedData.reduce((s, r) => s + r.current, 0);
    const givenTotal = rawGivenData.reduce((s, r) => s + r.current, 0);
    // Uses the already-converted `close` values (Jari in Reels, Warp/Resham
    // in kg) rather than summing raw stock quantities of mismatched units.
    const closeTotal = rawMaterialRows.reduce((s, r) => s + r.close, 0);
    return { recvTotal, givenTotal, closeTotal };
  }, [rawReceivedData, rawGivenData, rawMaterialRows]);

  const isLoading = grnLoading || issuesLoading || stockLoading;

  const stockColumns: ColumnDef<RawMaterialStockRow>[] = [
    {
      id: "type", header: "Material Type", accessor: r => r.type,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span>,
    },
    { id: "sub", header: "Sub-type / Color / Grade", accessor: r => r.sub },
    {
      id: "close", header: "Stock Level", accessor: r => r.close, type: "number", align: "end", sortable: true,
      cell: (_v, r) => (
        <div>
          <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: r.close === 0 ? T.crimson : T.luxuryBrown }}>{r.close} {r.unit}</div>
          {r.unit === "reels" && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{bunsAndReels(r.close)}</div>}
        </div>
      ),
    },
    {
      id: "change", header: "Status", accessor: r => r.change, align: "center",
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: r.oos ? T.crimson : T.green }}>{r.change}</span>,
    },
  ];

  const receiptColumns: ColumnDef<RawMaterialReceiptRow>[] = [
    {
      id: "batchId", header: "Batch ID", accessor: r => r.batchId,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.batchId}</span>,
    },
    {
      id: "dateReceived", header: "Date Received", accessor: r => r.dateReceived,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.dateReceived}</span>,
    },
    { id: "vendor", header: "Vendor", accessor: r => r.vendor },
    { id: "firmName", header: "Firm Name", accessor: r => r.firmName },
    {
      id: "materialType", header: "Material Type", accessor: r => r.materialType,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{r.materialType}</span>,
    },
    { id: "description", header: "Description", accessor: r => r.description },
    {
      id: "quantity", header: "Quantity", accessor: r => r.quantity, align: "end",
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{r.quantity}</span>,
    },
    {
      id: "unit", header: "Unit", accessor: r => r.unit,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.unit}</span>,
    },
    {
      id: "poReference", header: "PO Reference", accessor: r => r.poReference,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.poReference}</span>,
    },
    {
      id: "notes", header: "Notes", accessor: r => r.notes,
      cell: (_v, r) => <span style={{ fontSize: 12, color: T.taupe }}>{r.notes || "—"}</span>,
    },
  ];

  return (
    <div id="rep-raw-materials" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={Package}
      title="Raw Material Report"
      subtitle="Track everything about raw material — how much was received from vendors, how much was given to weavers, and how much is still in the factory. Warp, Resham, and Jari tracked separately."
    >
      <ReportDLBar />

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <ChartCard title="Raw Material Received from Vendors" sub="Current Period" icon={<Package size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawReceivedData} barGap={4}>
              <CartesianGrid key="rm-recv-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-recv-x" dataKey="material" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-recv-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-recv-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-recv-cur" dataKey="current" name="Received" fill={T.royalBurgundy} radius={[4, 4, 0, 0]} />
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
              <XAxis key="rm-gvn-x" dataKey="material" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-gvn-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-gvn-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-gvn-cur" dataKey="current" name="Given to Weavers" fill={T.green} radius={[4, 4, 0, 0]} />
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
            <DataTable
              columns={stockColumns}
              data={rawMaterialRows}
              getRowId={(r) => `${r.type}-${r.sub}`}
              loading={isLoading}
              emptyTitle="No raw material items in stock database yet."
            />
          </div>
          {rawMaterialRows.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, padding: "12px 16px" }}>
              <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown }}>Total Closing Stock</span>
              <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>{totalsSummary.closeTotal} kg / reels</span>
            </div>
          )}
        </div>
      </FadeUp>

      {/* Materials Received — Batch Log */}
      <FadeUp>
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>Materials Received — Batch Log</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Every material batch received from a vendor against a purchase order, with its GRN batch ID.</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <DataTable
                columns={receiptColumns}
                data={receiptRows}
                getRowId={(r) => `${r.batchId}-${r.description}-${r.poReference}`}
                loading={grnLoading}
                error={grnError}
                emptyTitle="No material receipts recorded yet."
              />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
