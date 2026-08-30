import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Scissors, BarChart2 } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard, ReportDLBar } from "../common/primitives";
import {
  ChartCard, ChartBand, ChartHint, CountUp, MicroLabel, StatFooter, TrackBar, HeroStat, SingleBarChart, CHART, BAND, NUM
} from "../../../production";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { materialIssuesApi } from "../../../../shared/api/material-issues";
import { jariToReels, formatBunsReels } from "../../../../shared/lib/weightUnits";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { useReportPeriod, useRegisterExport } from "../PeriodContext";

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
  itemId: string;
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
  const { data: rawGrns, isLoading: grnLoading, isError: grnError, refetch: refetchGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const { data: issuesRes, isLoading: issuesLoading, isError: issuesError, refetch: refetchIssues } = useQuery({
    queryKey: ["reports", "material-issues"],
    queryFn: () => materialIssuesApi.list(100),
  });

  const { data: stockRes, isLoading: stockLoading, isError: stockError, refetch: refetchStock } = useQuery({
    queryKey: ["reports", "raw-materials-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const { inCurrent } = useReportPeriod();

  // Everything flow-based (received / issued) is scoped to the selected
  // period; closing stock is a live snapshot and has no date to filter on.
  const grnsInPeriod = useMemo(
    () => (rawGrns?.items ?? []).filter(g => inCurrent(g.receivedDate)),
    [rawGrns, inCurrent],
  );
  const issuesInPeriod = useMemo(
    () => (issuesRes?.items ?? []).filter(i => inCurrent(i.issuedAt)),
    [issuesRes, inCurrent],
  );

  const receiptRows = useMemo<RawMaterialReceiptRow[]>(() => {
    if (grnsInPeriod.length === 0) return [];
    return grnsInPeriod.flatMap(g =>
      g.items.map(item => {
        const isJari = item.materialType === "JARI";
        const reels = isJari ? jariToReels(item.quantity, item.unit ?? "KG") : null;
        return {
          itemId: item.id,
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
  }, [grnsInPeriod]);

  // Dynamic calculation for Received from Vendors chart (by Material Type)
  const rawReceivedData = useMemo(() => {
    const totals: Record<string, { current: number; prior: number }> = {
      Warp: { current: 0, prior: 0 },
      Resham: { current: 0, prior: 0 },
      Jari: { current: 0, prior: 0 },
    };

    {
      for (const grn of grnsInPeriod) {
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
  }, [grnsInPeriod]);

  // Dynamic calculation for Material Given to Weavers chart
  const rawGivenData = useMemo(() => {
    const totals: Record<string, { current: number; prior: number }> = {
      Warp: { current: 0, prior: 0 },
      Resham: { current: 0, prior: 0 },
      Jari: { current: 0, prior: 0 },
    };

    {
      for (const issue of issuesInPeriod) {
        for (const item of issue.items) {
          const type = item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari";
          totals[type].current += type === "Jari" ? jariToReels(Number(item.quantity || 0), item.unit ?? "REEL") : Number(item.quantity || 0);
        }
      }
    }

    return [
      { material: "Warp", current: totals.Warp.current, prior: totals.Warp.prior },
      { material: "Resham", current: totals.Resham.current, prior: totals.Resham.prior },
      { material: "Jari", current: totals.Jari.current, prior: totals.Jari.prior },
    ];
  }, [issuesInPeriod]);

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
        // raw quantities of mismatched units. currentStock arrives as a
        // string (Prisma Decimal serialises over JSON as text), so it must
        // be coerced to a number before jariToReels/arithmetic — otherwise
        // `+=` silently concatenates strings instead of summing.
        const stock = Number(item.currentStock);
        const qty = type === "JARI" ? jariToReels(stock, item.unit) : stock;
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
      const stock = Number(item.currentStock);
      const close = isJari ? jariToReels(stock, item.unit) : stock;
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

  // Warp/Resham are kg, Jari is reels — the two must never be added into a
  // single "units" figure, so every total is kept split by its own unit.
  const totalsSummary = useMemo(() => {
    const kgOf = (rows: { material: string; current: number }[]) =>
      rows.filter(r => r.material !== "Jari").reduce((s, r) => s + r.current, 0);
    const reelsOf = (rows: { material: string; current: number }[]) =>
      rows.filter(r => r.material === "Jari").reduce((s, r) => s + r.current, 0);

    return {
      recvKg: kgOf(rawReceivedData),
      recvReels: reelsOf(rawReceivedData),
      givenKg: kgOf(rawGivenData),
      givenReels: reelsOf(rawGivenData),
      closeKg: rawMaterialRows.filter(r => r.unit !== "reels").reduce((s, r) => s + r.close, 0),
      closeReels: rawMaterialRows.filter(r => r.unit === "reels").reduce((s, r) => s + r.close, 0),
    };
  }, [rawReceivedData, rawGivenData, rawMaterialRows]);

  // Feeds the toolbar's "Download Excel" button with exactly what is on screen.
  useRegisterExport(useMemo(() => ({
    name: "Raw Material Report",
    headers: ["Batch ID", "Date Received", "Vendor", "Firm", "Material Type", "Description", "Quantity", "Unit", "PO Reference", "Notes"],
    rows: receiptRows.map(r => [r.batchId, r.dateReceived, r.vendor, r.firmName, r.materialType, r.description, r.quantity, r.unit, r.poReference, r.notes]),
  }), [receiptRows]));

  const isLoading = grnLoading || issuesLoading || stockLoading;
  const isError = grnError || issuesError || stockError;
  const refetchAll = () => { void refetchGrns(); void refetchIssues(); void refetchStock(); };

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
      <ReportDLBar note="closing stock is always live, not period-scoped" />

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        {/* ── Raw Material Received from Vendors ─────────────────────────────────────────────── */}
        <ChartCard>
          <ChartBand
            tone="pipeline"
            icon={<Package size={19} color={BAND.pipeline.icon} />}
            title="Raw Material Received"
            sub="Current Period"
          />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <ChartHint tone="pipeline">Totals received from vendors during this period.</ChartHint>
            
            <HeroStat
              value={totalsSummary.recvKg}
              unit="kg"
              secondary={{ value: totalsSummary.recvReels, unit: "reels" }}
              caption="Warp + Resham in kg, Jari in reels"
              icon={<Package size={12} color={T.royalBurgundy} />}
            />
            <div className="overflow-x-auto w-full" style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 10 }}>
              <div style={{ minWidth: 280, width: "100%" }}>
                <SingleBarChart data={rawReceivedData.map(d => ({ label: d.material, value: d.current, unit: d.material === "Jari" ? "reels" : "kg" }))} fillId="singleBarPrimary" />
              </div>
            </div>
            <div>
              <StatFooter stats={[
                { num: <CountUp value={totalsSummary.recvKg} />, label: "kg Received" },
                { num: <CountUp value={totalsSummary.recvReels} />, label: "Reels Received" },
              ]} />
            </div>
          </div>
        </ChartCard>

        {/* ── Material Given to Weavers ─────────────────────────────────────────────── */}
        <ChartCard>
          <ChartBand
            tone="weavers"
            icon={<Scissors size={19} color={BAND.weavers.icon} />}
            title="Material Given to Weavers"
            sub="Current Period"
          />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <ChartHint tone="weavers">Totals issued to weavers during this period.</ChartHint>
            
            <HeroStat
              value={totalsSummary.givenKg}
              unit="kg"
              secondary={{ value: totalsSummary.givenReels, unit: "reels" }}
              caption="Warp + Resham in kg, Jari in reels"
              icon={<Scissors size={12} color={T.antiqueGold} />}
            />
            <div className="overflow-x-auto w-full" style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 10 }}>
              <div style={{ minWidth: 280, width: "100%" }}>
                <SingleBarChart data={rawGivenData.map(d => ({ label: d.material, value: d.current, unit: d.material === "Jari" ? "reels" : "kg" }))} fillId="singleBarSecondary" />
              </div>
            </div>
            <div>
              <StatFooter stats={[
                { num: <CountUp value={totalsSummary.givenKg} />, label: "kg Given" },
                { num: <CountUp value={totalsSummary.givenReels} />, label: "Reels Given" },
              ]} />
            </div>
          </div>
        </ChartCard>

        {/* ── What Is In Stock Right Now ─────────────────────────────────────────────── */}
        <ChartCard>
          <ChartBand
            tone="output"
            icon={<BarChart2 size={19} color={BAND.output.icon} />}
            title="What Is In Stock Right Now"
            sub="Current closing stock levels"
          />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <ChartHint tone="output">Current raw materials available in the factory.</ChartHint>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center", marginTop: 10, paddingBottom: 2 }}>
              {[
                { material: "Warp", current: stockByType.WARP.stock, oos: stockByType.WARP.outOfStockCount, max: Math.max(200, stockByType.WARP.stock) },
                { material: "Resham", current: stockByType.RESHAM.stock, oos: stockByType.RESHAM.outOfStockCount, max: Math.max(150, stockByType.RESHAM.stock) },
                { material: "Jari", current: stockByType.JARI.stock, oos: stockByType.JARI.outOfStockCount, max: Math.max(80, stockByType.JARI.stock) },
              ].map((d, i) => {
                const pct = d.max > 0 ? (d.current / d.max) * 100 : 0;
                return (
                  <div key={d.material} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, lineHeight: 1.25 }}>{d.material}</div>
                          <MicroLabel color={d.oos > 0 ? T.crimson : T.green}>
                            {d.oos > 0 ? `${d.oos} Out of Stock` : "Healthy"}
                          </MicroLabel>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
                        <span style={{ fontFamily: F.display, fontSize: 21, fontWeight: 400, color: T.luxuryBrown, ...NUM }}>
                          <CountUp value={d.current} />
                        </span>
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe }}>
                          {d.material === "Jari" ? "reels" : "kg"}
                        </span>
                      </div>
                    </div>
                    <TrackBar
                      pct={pct}
                      fill={`linear-gradient(90deg, ${d.oos > 0 ? CHART.ramp[1] : CHART.ramp[3]} 0%, ${d.oos > 0 ? CHART.ramp[0] : CHART.ramp[2]} 100%)`}
                      height={9}
                      delay={i * 0.08}
                    />
                  </div>
                );
              })}
            </div>
            <div>
              <StatFooter stats={[
                { num: <CountUp value={totalsSummary.closeKg} />, label: "kg In Stock" },
                { num: <CountUp value={totalsSummary.closeReels} />, label: "Reels In Stock" },
              ]} />
            </div>
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
              error={isError}
              onRetry={refetchAll}
              emptyTitle="No raw materials in stock."
              pagination
            />
          </div>
          {rawMaterialRows.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, padding: "12px 16px" }}>
              <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown }}>Total Closing Stock</span>
              <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>{totalsSummary.closeKg} kg &nbsp;·&nbsp; {totalsSummary.closeReels} reels</span>
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
                getRowId={(r) => r.itemId}
                loading={grnLoading}
                error={grnError}
                onRetry={refetchGrns}
                emptyTitle="No recent material issues."
                pagination
              />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
