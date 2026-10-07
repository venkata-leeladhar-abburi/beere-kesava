/**
 * Shop Staff → All Sales (`/shop/sales`) — the Home page's "View All".
 * ═══════════════════════════════════════════════════════════════════════════
 * Every sale on record, findable in a couple of clicks:
 *   1. Find      — search box, one-tap date presets, the app-wide timeline,
 *                  and a dropdown per dimension (channel, payment, customer,
 *                  saree type, sold by, status, sort, amount range).
 *   2. Records   — the same result set read two ways: one row per saree, or
 *                  one row per counter bill. Either opens the printable bill.
 *
 * Open to every shop login (unlike Reports, which is admin-only). Money is
 * gated by `useCanSeePrices`: a real shop-staff login sees no amounts, no
 * amount filters and no amount sort.
 */
import React from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Table as TableIcon,
  Users,
  IndianRupee,
  X,
} from "lucide-react";

import {
  C,
  F,
  Chip,
  PageHero,
  PortalStatsStrip,
  SectionCard,
  useCanSeePrices,
  type PortalStat,
} from "./theme";
import { Button, Combobox, IconButton, Input, Select, SelectItem } from "@/shared/ui/primitives";
import { Modal } from "@/shared/ui/overlay";
import { ErrorState } from "@/shared/ui/state";
import { DataTable, exportTable, type ColumnDef } from "@/shared/ui/data";
import {
  DateFilterBar,
  DEFAULT_DATE_FILTER,
  type DateFilterState,
} from "@/shared/ui/DateFilterBar";
import { ViewSelector } from "@/shared/ui/ViewSelector";
import { RoyalSubTabStrip } from "@/shared/ui/RoyalSubTabStrip";
import { DocumentViewer, RetailBillDocument, DEFAULT_LETTERHEAD_FIRM } from "@/shared/ui/document";
import { Money } from "@/shared/ui/domain";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useResponsive } from "@/hooks/useResponsive";
import {
  ALL,
  useAllSalesModel,
  type BillRow,
  type SaleLineRow,
  type SortKey,
  type StatusFilter,
} from "./allSalesModel";

type RecordTab = "sarees" | "bills";
const RECORD_VIEWS = [
  { key: "table" as const, label: "Table", Icon: TableIcon },
  { key: "cards" as const, label: "Cards", Icon: LayoutGrid },
];
type RecordView = (typeof RECORD_VIEWS)[number]["key"];

// ── Formatting ──────────────────────────────────────────────────────────────

function fullDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function money(v: number) {
  return formatMoney(rupees(v));
}

/** Local calendar date as "yyyy-MM-dd" — the format DateFilterBar stores. */
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Preset = "today" | "yesterday" | "7d" | "30d" | "month";
const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
];

function presetFilter(p: Preset): DateFilterState {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  switch (p) {
    case "today":
      return { ...DEFAULT_DATE_FILTER, mode: "day", day: ymd(now) };
    case "yesterday":
      return { ...DEFAULT_DATE_FILTER, mode: "day", day: ymd(daysAgo(1)) };
    case "7d":
      return { ...DEFAULT_DATE_FILTER, mode: "range", from: ymd(daysAgo(6)), to: ymd(now) };
    case "30d":
      return { ...DEFAULT_DATE_FILTER, mode: "range", from: ymd(daysAgo(29)), to: ymd(now) };
    case "month":
      return {
        ...DEFAULT_DATE_FILTER,
        mode: "month",
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      };
  }
}

function activePreset(f: DateFilterState): Preset | null {
  for (const p of PRESETS) {
    const x = presetFilter(p.key);
    if (
      x.mode === f.mode &&
      x.day === f.day &&
      x.from === f.from &&
      x.to === f.to &&
      x.month === f.month
    )
      return p.key;
  }
  return null;
}

// ── Small pieces ────────────────────────────────────────────────────────────

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: F.u,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: C.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={
        "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border font-semibold " +
        (active
          ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9]"
          : "border-[rgba(110,15,45,0.14)] bg-white hover:bg-[#6E0F2D]/10 text-[#69635E] hover:text-[#6E0F2D]")
      }
    >
      {children}
    </Button>
  );
}

function ChannelChip({ channel, label }: { channel: "RETAIL" | "WHOLESALE"; label: string }) {
  return channel === "RETAIL" ? (
    <Chip label={label} color={C.green} bg="rgba(30,102,64,0.10)" />
  ) : (
    <Chip label={label} color="#845E04" bg="rgba(200,155,71,0.16)" />
  );
}

function BillButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-8 gap-1.5 rounded-full border border-[rgba(110,15,45,0.18)] bg-white px-3 font-semibold text-[#6E0F2D] hover:bg-[#6E0F2D]/10"
    >
      <FileText size={14} /> Bill
    </Button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function AllSalesPage({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const gutter = isMobile ? 16 : isTablet ? 28 : 48;

  const m = useAllSalesModel(canSeePrices);
  const { filters, patch } = m;

  const [tab, setTab] = React.useState<RecordTab>("sarees");
  const [view, setView] = React.useState<RecordView>("table");
  const [showMore, setShowMore] = React.useState(!isMobile);
  const [openBill, setOpenBill] = React.useState<BillRow | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const openBillFor = React.useCallback(
    (billRef: string) => {
      const bill = m.billByRef.get(billRef);
      if (bill) setOpenBill(bill);
    },
    [m.billByRef]
  );

  // ── Columns ──────────────────────────────────────────────────────────────
  const lineColumns = React.useMemo<ColumnDef<SaleLineRow>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        accessor: () => "",
        type: "number",
        width: 64,
        sortable: false,
        priority: 3,
        exportable: false,
        cell: (_v, _r, i) => (
          <span style={{ fontFamily: F.m, color: C.muted }}>{String(i + 1).padStart(2, "0")}</span>
        ),
      },
      {
        id: "saree",
        header: "Saree ID",
        accessor: (r) => r.sareeId,
        type: "code",
        width: 190,
        sortable: true,
        priority: 1,
      },
      {
        id: "date",
        header: "Date & Time",
        accessor: (r) => new Date(r.date),
        type: "datetime",
        width: 190,
        sortable: true,
        priority: 2,
      },
      {
        id: "customer",
        header: "Customer",
        accessor: (r) => r.customer,
        type: "text",
        sortable: true,
        priority: 2,
        cell: (_v, r) => (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, color: C.text }}>{r.customer}</div>
            {r.customerPhone && (
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.customerPhone}</div>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: "Saree Type",
        accessor: (r) => r.sareeType,
        type: "text",
        sortable: true,
        priority: 2,
      },
      {
        id: "channel",
        header: "Channel",
        accessor: (r) => r.channelLabel,
        type: "text",
        width: 120,
        sortable: true,
        priority: 3,
        cell: (_v, r) => <ChannelChip channel={r.channel} label={r.channelLabel} />,
      },
      {
        id: "pay",
        header: "Payment",
        accessor: (r) => r.pay,
        type: "text",
        width: 140,
        sortable: true,
        priority: 2,
        cell: (_v, r) => (
          <div>
            <div style={{ color: C.text }}>{r.pay}</div>
            {r.payRef && (
              <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{r.payRef}</div>
            )}
          </div>
        ),
      },
      {
        id: "bill",
        header: "Bill No",
        accessor: (r) => r.billRef,
        type: "code",
        width: 200,
        sortable: true,
        priority: 3,
      },
      {
        id: "soldBy",
        header: "Sold by",
        accessor: (r) => r.soldBy ?? "—",
        type: "text",
        width: 140,
        sortable: true,
        priority: 3,
      },
      {
        id: "status",
        header: "Status",
        accessor: (r) => (r.returned ? "Returned" : "Sold"),
        type: "text",
        width: 110,
        sortable: true,
        priority: 2,
        cell: (_v, r) =>
          r.returned ? (
            <Chip label="Returned" color={C.crim} bg="rgba(192,57,43,0.10)" />
          ) : (
            <Chip label="Sold" color={C.burg} bg="rgba(110,15,45,0.07)" />
          ),
      },
      ...(canSeePrices
        ? [
            {
              id: "gst",
              header: "GST",
              accessor: (r: SaleLineRow) => r.gst,
              type: "currency" as const,
              width: 130,
              sortable: true,
              priority: 3 as const,
              cell: (_v: unknown, r: SaleLineRow) =>
                r.gstRate === null ? (
                  <span style={{ color: C.muted }}>—</span>
                ) : (
                  <div>
                    <div style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
                      {money(r.gst)}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>
                      @ {r.gstRate}%
                    </div>
                  </div>
                ),
            },
            {
              id: "amount",
              header: "Amount",
              accessor: (r: SaleLineRow) => r.amount,
              type: "currency" as const,
              width: 130,
              sortable: true,
              priority: 2 as const,
            },
          ]
        : []),
      {
        id: "actions",
        header: "",
        accessor: () => "",
        type: "actions",
        width: 90,
        sortable: false,
        priority: 2,
        cell: (_v, r) =>
          r.channel === "RETAIL" ? <BillButton onClick={() => openBillFor(r.billRef)} /> : null,
      },
    ],
    [canSeePrices, openBillFor]
  );

  const lineExportColumns = React.useMemo<ColumnDef<SaleLineRow>[]>(
    () => [
      { id: "saleRef", header: "Sale Ref", accessor: (r) => r.saleRef, type: "code" },
      { id: "bill", header: "Bill No", accessor: (r) => r.billRef, type: "code" },
      { id: "saree", header: "Saree ID", accessor: (r) => r.sareeId, type: "code" },
      { id: "date", header: "Date & Time", accessor: (r) => new Date(r.date), type: "datetime" },
      { id: "customer", header: "Customer", accessor: (r) => r.customer, type: "text" },
      { id: "phone", header: "Phone", accessor: (r) => r.customerPhone ?? "", type: "text" },
      { id: "type", header: "Saree Type", accessor: (r) => r.sareeType, type: "text" },
      { id: "design", header: "Design", accessor: (r) => r.design ?? "", type: "text" },
      { id: "channel", header: "Channel", accessor: (r) => r.channelLabel, type: "text" },
      { id: "pay", header: "Payment", accessor: (r) => r.pay, type: "text" },
      { id: "payRef", header: "Payment Ref", accessor: (r) => r.payRef ?? "", type: "text" },
      { id: "soldBy", header: "Sold by", accessor: (r) => r.soldBy ?? "", type: "text" },
      {
        id: "status",
        header: "Status",
        accessor: (r) => (r.returned ? "Returned" : "Sold"),
        type: "text",
      },
      ...(canSeePrices
        ? [
            {
              id: "taxable",
              header: "Taxable Value",
              accessor: (r: SaleLineRow) => r.taxable,
              type: "currency" as const,
            },
            {
              id: "gstRate",
              header: "GST %",
              accessor: (r: SaleLineRow) => r.gstRate ?? "",
              type: "text" as const,
            },
            {
              id: "gst",
              header: "GST",
              accessor: (r: SaleLineRow) => r.gst,
              type: "currency" as const,
            },
            {
              id: "amount",
              header: "Amount",
              accessor: (r: SaleLineRow) => r.amount,
              type: "currency" as const,
            },
            {
              id: "refund",
              header: "Refund",
              accessor: (r: SaleLineRow) => r.refund,
              type: "currency" as const,
            },
          ]
        : []),
      {
        id: "customerGstin",
        header: "Customer GSTIN",
        accessor: (r) => r.customerGstin ?? "",
        type: "text",
      },
    ],
    [canSeePrices]
  );

  const billColumns = React.useMemo<ColumnDef<BillRow>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        accessor: () => "",
        type: "number",
        width: 64,
        sortable: false,
        priority: 3,
        exportable: false,
        cell: (_v, _r, i) => (
          <span style={{ fontFamily: F.m, color: C.muted }}>{String(i + 1).padStart(2, "0")}</span>
        ),
      },
      {
        id: "bill",
        header: "Bill No",
        accessor: (r) => r.billRef,
        type: "code",
        width: 210,
        sortable: true,
        priority: 1,
      },
      {
        id: "date",
        header: "Date & Time",
        accessor: (r) => new Date(r.date),
        type: "datetime",
        width: 190,
        sortable: true,
        priority: 2,
      },
      {
        id: "customer",
        header: "Customer",
        accessor: (r) => r.customer,
        type: "text",
        sortable: true,
        priority: 2,
        cell: (_v, r) => (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, color: C.text }}>{r.customer}</div>
            {r.customerPhone && (
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.customerPhone}</div>
            )}
          </div>
        ),
      },
      {
        id: "sarees",
        header: "Sarees",
        accessor: (r) => r.pieces,
        type: "number",
        width: 150,
        sortable: true,
        priority: 2,
        cell: (_v, r) => (
          <span title={r.lines.map((l) => l.sareeId).join(", ")}>
            {r.pieces}
            {r.returnedCount > 0 && (
              <span style={{ color: C.crim, fontSize: 12 }}> · {r.returnedCount} returned</span>
            )}
          </span>
        ),
      },
      {
        id: "channel",
        header: "Channel",
        accessor: (r) => r.channelLabel,
        type: "text",
        width: 120,
        sortable: true,
        priority: 3,
        cell: (_v, r) => <ChannelChip channel={r.channel} label={r.channelLabel} />,
      },
      {
        id: "pay",
        header: "Payment",
        accessor: (r) => r.pay,
        type: "text",
        width: 130,
        sortable: true,
        priority: 2,
      },
      {
        id: "soldBy",
        header: "Sold by",
        accessor: (r) => r.soldBy ?? "—",
        type: "text",
        width: 140,
        sortable: true,
        priority: 3,
      },
      ...(canSeePrices
        ? [
            {
              id: "gst",
              header: "GST",
              accessor: (r: BillRow) => r.gst,
              type: "currency" as const,
              width: 150,
              sortable: true,
              priority: 3 as const,
              cell: (_v: unknown, r: BillRow) =>
                r.gstRate === null ? (
                  <span style={{ color: C.muted }}>—</span>
                ) : (
                  <div>
                    <div style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
                      {money(r.gst)}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>
                      @ {r.gstRate}%{r.customerGstin ? ` · ${r.customerGstin}` : ""}
                    </div>
                  </div>
                ),
            },
            {
              id: "total",
              header: "Bill Total",
              accessor: (r: BillRow) => r.total,
              type: "currency" as const,
              width: 140,
              sortable: true,
              priority: 2 as const,
            },
          ]
        : []),
      {
        id: "actions",
        header: "",
        accessor: () => "",
        type: "actions",
        width: 90,
        sortable: false,
        priority: 2,
        cell: (_v, r) =>
          r.channel === "RETAIL" ? <BillButton onClick={() => setOpenBill(r)} /> : null,
      },
    ],
    [canSeePrices]
  );

  const billExportColumns = React.useMemo<ColumnDef<BillRow>[]>(
    () => [
      { id: "bill", header: "Bill No", accessor: (r) => r.billRef, type: "code" },
      { id: "date", header: "Date & Time", accessor: (r) => new Date(r.date), type: "datetime" },
      { id: "customer", header: "Customer", accessor: (r) => r.customer, type: "text" },
      { id: "phone", header: "Phone", accessor: (r) => r.customerPhone ?? "", type: "text" },
      { id: "sarees", header: "Sarees", accessor: (r) => r.pieces, type: "number" },
      {
        id: "ids",
        header: "Saree IDs",
        accessor: (r) => r.lines.map((l) => l.sareeId).join(", "),
        type: "text",
      },
      { id: "returned", header: "Returned", accessor: (r) => r.returnedCount, type: "number" },
      { id: "channel", header: "Channel", accessor: (r) => r.channelLabel, type: "text" },
      { id: "pay", header: "Payment", accessor: (r) => r.pay, type: "text" },
      { id: "payRef", header: "Payment Ref", accessor: (r) => r.payRef ?? "", type: "text" },
      { id: "soldBy", header: "Sold by", accessor: (r) => r.soldBy ?? "", type: "text" },
      ...(canSeePrices
        ? [
            {
              id: "taxable",
              header: "Taxable Value",
              accessor: (r: BillRow) => (Math.round(r.total * 100) - Math.round(r.gst * 100)) / 100,
              type: "currency" as const,
            },
            {
              id: "gstRate",
              header: "GST %",
              accessor: (r: BillRow) => r.gstRate ?? "",
              type: "text" as const,
            },
            {
              id: "gst",
              header: "GST",
              accessor: (r: BillRow) => r.gst,
              type: "currency" as const,
            },
            {
              id: "total",
              header: "Bill Total",
              accessor: (r: BillRow) => r.total,
              type: "currency" as const,
            },
          ]
        : []),
      {
        id: "customerGstin",
        header: "Customer GSTIN",
        accessor: (r) => r.customerGstin ?? "",
        type: "text",
      },
    ],
    [canSeePrices]
  );

  async function runExport(format: "xlsx" | "csv") {
    setExporting(true);
    try {
      const suffix = m.dateLabel.replace(/[^\w-]+/g, "_");
      if (tab === "sarees") {
        await exportTable({
          columns: lineExportColumns,
          rows: m.lines,
          filename: `sales_${suffix}`,
          format,
          totalRowCount: m.totalOnRecord,
        });
      } else {
        await exportTable({
          columns: billExportColumns,
          rows: m.bills,
          filename: `bills_${suffix}`,
          format,
        });
      }
    } finally {
      setExporting(false);
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats: PortalStat[] = [
    {
      label: "Sarees sold",
      value: m.error ? "Error" : m.metrics.sarees,
      sub: m.dateLabel,
      icon: ShoppingBag,
      highlight: true,
    },
    {
      label: "Bills",
      value: m.metrics.bills,
      sub: `${m.metrics.customers} customer${m.metrics.customers === 1 ? "" : "s"}`,
      icon: ReceiptText,
    },
    ...(canSeePrices
      ? [
          {
            label: "Revenue",
            value: money(m.metrics.revenue),
            icon: IndianRupee,
            sub: [
              m.metrics.refunded > 0 ? `${money(m.metrics.net)} after refunds` : "Gross sales",
              m.metrics.gst > 0 ? `incl. ${money(m.metrics.gst)} GST` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          } as PortalStat,
          {
            label: "Average bill",
            value: money(m.metrics.avgBill),
            sub: "Per bill",
            icon: Users,
          } as PortalStat,
        ]
      : [
          {
            label: "Customers",
            value: m.metrics.customers,
            sub: "Unique buyers",
            icon: Users,
          } as PortalStat,
        ]),
    {
      label: "Returned",
      value: m.metrics.returned,
      sub: "Sarees brought back",
      icon: RotateCcw,
      alert: m.metrics.returned > 0,
    },
  ];

  const preset = activePreset(filters.date);
  const filterCols = isMobile
    ? "1fr"
    : isTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))";

  const customerOptions = React.useMemo(
    () => [{ value: ALL, label: "All customers" }, ...m.options.customers],
    [m.options.customers]
  );
  const typeOptions = React.useMemo(
    () => [{ value: ALL, label: "All saree types" }, ...m.options.sareeTypes],
    [m.options.sareeTypes]
  );

  const resultLabel =
    tab === "sarees"
      ? `${m.metrics.sarees} saree${m.metrics.sarees === 1 ? "" : "s"}`
      : `${m.bills.length} bill${m.bills.length === 1 ? "" : "s"}`;

  return (
    <div style={{ paddingBottom: isMobile ? 110 : 0 }}>
      <PageHero
        eyebrow="Shop Staff Portal · Sales"
        title="All"
        titleAccent="Sales"
        description="Every sale on record. Search any saree, bill, customer or phone number, narrow it down with the filters, and open the bill for any sale."
        actions={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              onClick={onBack}
              className="h-11 gap-2 rounded-full border border-white/25 bg-white/10 px-5 font-semibold text-[#FFFDF9] hover:bg-white/20 hover:text-[#FFFDF9]"
            >
              <ArrowLeft size={16} /> Back to home
            </Button>
            <Button
              onClick={m.refetch}
              disabled={m.fetching}
              className="h-11 gap-2 rounded-full border border-white/25 bg-white/10 px-5 font-semibold text-[#FFFDF9] hover:bg-white/20 hover:text-[#FFFDF9]"
            >
              <RefreshCw size={16} className={m.fetching ? "animate-spin" : undefined} /> Refresh
            </Button>
          </div>
        }
      />
      <PortalStatsStrip stats={stats} />

      <div
        style={{
          padding: `${isMobile ? 20 : 36}px ${gutter}px ${isMobile ? 32 : 56}px`,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ── 1. Find ──────────────────────────────────────────────────── */}
        <SectionCard
          icon={Filter}
          title="Find Sales"
          subtitle={
            m.activeFilterCount > 0
              ? `${m.activeFilterCount} filter${m.activeFilterCount === 1 ? "" : "s"} applied · ${m.dateLabel}`
              : `Showing everything · ${m.totalOnRecord} sarees on record`
          }
          actions={
            m.activeFilterCount > 0 ? (
              <Button
                onClick={m.reset}
                className="h-10 gap-2 rounded-full border-none bg-white px-4 font-bold text-[#6E0F2D] hover:bg-white/90 hover:text-[#4A061B]"
              >
                <X size={15} /> Clear all
              </Button>
            ) : undefined
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder="Search saree ID, bill no, customer, phone, design, UPI ref…"
              iconLeft={Search}
              size="lg"
              containerClassName="h-12 rounded-xl"
              aria-label="Search sales"
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Pill
                active={filters.date.mode === "all"}
                onClick={() => patch({ date: DEFAULT_DATE_FILTER })}
              >
                All time
              </Pill>
              {PRESETS.map((p) => (
                <Pill
                  key={p.key}
                  active={preset === p.key}
                  onClick={() => patch({ date: presetFilter(p.key) })}
                >
                  {p.label}
                </Pill>
              ))}
              <div style={{ marginLeft: isMobile ? 0 : "auto" }}>
                <DateFilterBar filter={filters.date} onChange={(d) => patch({ date: d })} />
              </div>
            </div>

            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMore((v) => !v)}
                className="self-start rounded-full gap-2 font-semibold text-[#6E0F2D]"
              >
                <Filter size={14} /> {showMore ? "Hide filters" : "More filters"}
              </Button>
            )}

            {showMore && (
              <div style={{ display: "grid", gridTemplateColumns: filterCols, gap: 14 }}>
                <FilterField label="Customer">
                  <Combobox
                    options={customerOptions}
                    value={filters.customer}
                    onValueChange={(v) => patch({ customer: v || ALL })}
                    placeholder="All customers"
                    searchPlaceholder="Name, phone or code…"
                    emptyMessage="No customer found"
                  />
                </FilterField>
                <FilterField label="Saree type">
                  <Combobox
                    options={typeOptions}
                    value={filters.sareeType}
                    onValueChange={(v) => patch({ sareeType: v || ALL })}
                    placeholder="All saree types"
                    searchPlaceholder="Search type…"
                    emptyMessage="No saree type found"
                  />
                </FilterField>
                <FilterField label="Channel">
                  <Select
                    value={filters.channel}
                    onValueChange={(v) => patch({ channel: v })}
                    align="start"
                  >
                    <SelectItem value={ALL}>All channels</SelectItem>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  </Select>
                </FilterField>
                <FilterField label="Payment">
                  <Select
                    value={filters.payment}
                    onValueChange={(v) => patch({ payment: v })}
                    align="start"
                  >
                    <SelectItem value={ALL}>All payments</SelectItem>
                    {m.options.payments.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </Select>
                </FilterField>
                <FilterField label="Sold by">
                  <Select
                    value={filters.soldBy}
                    onValueChange={(v) => patch({ soldBy: v })}
                    align="start"
                  >
                    <SelectItem value={ALL}>Everyone</SelectItem>
                    {m.options.staff.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </Select>
                </FilterField>
                <FilterField label="Status">
                  <Select
                    value={filters.status}
                    onValueChange={(v) => patch({ status: v as StatusFilter })}
                    align="start"
                  >
                    <SelectItem value="all">Sold &amp; returned</SelectItem>
                    <SelectItem value="sold">Sold only</SelectItem>
                    <SelectItem value="returned">Returned only</SelectItem>
                  </Select>
                </FilterField>
                <FilterField label="Sort by">
                  <Select
                    value={
                      canSeePrices || !filters.sort.startsWith("amount") ? filters.sort : "newest"
                    }
                    onValueChange={(v) => patch({ sort: v as SortKey })}
                    align="start"
                  >
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    {canSeePrices && (
                      <SelectItem value="amount-desc">Amount: high to low</SelectItem>
                    )}
                    {canSeePrices && (
                      <SelectItem value="amount-asc">Amount: low to high</SelectItem>
                    )}
                  </Select>
                </FilterField>
                {canSeePrices && (
                  <FilterField label="Amount range">
                    <div style={{ display: "flex", gap: 8 }}>
                      <Input
                        value={filters.minAmount}
                        onChange={(e) =>
                          patch({ minAmount: e.target.value.replace(/[^\d.]/g, "") })
                        }
                        placeholder="Min"
                        inputMode="decimal"
                        aria-label="Minimum amount"
                      />
                      <Input
                        value={filters.maxAmount}
                        onChange={(e) =>
                          patch({ maxAmount: e.target.value.replace(/[^\d.]/g, "") })
                        }
                        placeholder="Max"
                        inputMode="decimal"
                        aria-label="Maximum amount"
                      />
                    </div>
                  </FilterField>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 2. Records ───────────────────────────────────────────────── */}
        <SectionCard
          icon={ReceiptText}
          title="Sales Records"
          subtitle={`${resultLabel} · ${m.dateLabel}${canSeePrices ? ` · ${money(m.metrics.revenue)}` : ""}`}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                onClick={() => void runExport("xlsx")}
                disabled={
                  exporting ||
                  m.loading ||
                  (tab === "sarees" ? m.lines.length === 0 : m.bills.length === 0)
                }
                className="h-10 gap-2 rounded-full border-none bg-white px-4 font-bold text-[#6E0F2D] hover:bg-white/90 hover:text-[#4A061B]"
              >
                <Download size={15} /> Excel
              </Button>
              <Button
                onClick={() => void runExport("csv")}
                disabled={
                  exporting ||
                  m.loading ||
                  (tab === "sarees" ? m.lines.length === 0 : m.bills.length === 0)
                }
                className="h-10 gap-2 rounded-full border border-white/30 bg-white/10 px-4 font-bold text-[#FFFDF9] hover:bg-white/20 hover:text-[#FFFDF9]"
              >
                <Download size={15} /> CSV
              </Button>
            </div>
          }
        >
          {m.error ? (
            <ErrorState error={undefined} onRetry={m.refetch} />
          ) : (
            <>
              <RoyalSubTabStrip
                tabs={[
                  {
                    key: "sarees",
                    label: `By saree (${m.metrics.sarees})`,
                    icon: <ShoppingBag size={16} />,
                  },
                  {
                    key: "bills",
                    label: `By bill (${m.bills.length})`,
                    icon: <ReceiptText size={16} />,
                  },
                ]}
                activeTab={tab}
                onTabChange={setTab}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontFamily: F.u,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: C.muted,
                  }}
                >
                  {resultLabel} · {m.dateLabel}
                  {m.returnsError && (
                    <span style={{ color: C.crim, textTransform: "none", fontWeight: 600 }}>
                      {" "}
                      · returns could not be loaded
                    </span>
                  )}
                </span>
                {!isMobile && (
                  <ViewSelector options={RECORD_VIEWS} activeView={view} onViewChange={setView} />
                )}
              </div>

              {tab === "sarees" ? (
                <DataTable
                  columns={lineColumns}
                  data={m.lines}
                  getRowId={(r) => r.key}
                  caption={`Sales — ${m.dateLabel}`}
                  responsive
                  view={isMobile ? "auto" : view}
                  pagination
                  pageSize={25}
                  itemLabel="sales"
                  loading={m.loading}
                  onRowClick={(r) => {
                    if (r.channel === "RETAIL") openBillFor(r.billRef);
                  }}
                  isFiltered={m.activeFilterCount > 0}
                  onClearFilters={m.reset}
                  emptyTitle="No sales recorded yet"
                  emptyDescription="Sales rung up at the counter will appear here."
                />
              ) : (
                <DataTable
                  columns={billColumns}
                  data={m.bills}
                  getRowId={(r) => r.key}
                  caption={`Bills — ${m.dateLabel}`}
                  responsive
                  view={isMobile ? "auto" : view}
                  pagination
                  pageSize={25}
                  itemLabel="bills"
                  loading={m.loading}
                  onRowClick={(r) => {
                    if (r.channel === "RETAIL") setOpenBill(r);
                  }}
                  isFiltered={m.activeFilterCount > 0}
                  onClearFilters={m.reset}
                  emptyTitle="No bills yet"
                  emptyDescription="Bills from counter sales will appear here."
                />
              )}

              {canSeePrices && !m.loading && m.lines.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px 24px",
                    marginTop: 14,
                    padding: "16px 20px",
                    background: "#FFFDF9",
                    border: "1px solid rgba(110,15,45,0.10)",
                    borderRadius: 14,
                  }}
                >
                  {m.metrics.gst > 0 && (
                    <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                      GST collected{" "}
                      <strong style={{ color: C.text }}>{money(m.metrics.gst)}</strong>
                    </span>
                  )}
                  {m.metrics.refunded > 0 && (
                    <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                      Refunded{" "}
                      <strong style={{ color: C.crim }}>− {money(m.metrics.refunded)}</strong>
                    </span>
                  )}
                  <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>
                    Total ({m.dateLabel})
                  </span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>
                    <Money value={rupees(m.metrics.revenue)} />
                  </span>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>

      {openBill && <BillModal bill={openBill} onClose={() => setOpenBill(null)} />}
    </div>
  );
}

/**
 * The same RetailBillDocument the customer received — every saree rung up on
 * that bill, the payment, and who sold it — ready to view, print or download.
 * Per-saree counter discounts are not stored on the sale, so lines show the
 * price actually charged — before GST, which the bill adds once at the foot
 * when it was charged.
 */
function BillModal({ bill, onClose }: { bill: BillRow; onClose: () => void }) {
  const saleRefs = bill.lines.map((l) => l.saleRef);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid rgba(110,15,45,0.10)",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.text }}>
              Bill {bill.billRef}
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
              {fullDate(bill.date)} · {bill.customer} · {bill.pieces} saree
              {bill.pieces === 1 ? "" : "s"}
              {bill.returnedCount > 0 ? ` · ${bill.returnedCount} returned since` : ""}
            </div>
          </div>
          <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <DocumentViewer
          fileName={bill.billRef}
          documentTitle={`Retail Bill ${bill.billRef}`}
          className="flex-1"
        >
          <RetailBillDocument
            billRef={bill.billRef}
            billDate={fullDate(bill.date)}
            firm={DEFAULT_LETTERHEAD_FIRM}
            customerName={bill.customer}
            customerPhone={bill.customerPhone ?? undefined}
            customerAddress={bill.customerAddress ?? undefined}
            lines={bill.lines.map((l) => ({
              sareeId: l.sareeId,
              type: l.sareeType,
              design: l.design ?? undefined,
              soldPrice: l.taxable,
            }))}
            total={bill.total}
            gst={
              bill.gstRate !== null
                ? {
                    rate: bill.gstRate,
                    amount: bill.gst,
                    customerGstin: bill.customerGstin ?? undefined,
                    sellerGstin: bill.sellerGstin ?? undefined,
                  }
                : undefined
            }
            paymentMethod={bill.payKey === "none" ? undefined : bill.payKey}
            paymentRef={bill.payRef ?? undefined}
            soldBy={bill.soldBy ?? undefined}
            saleRefs={saleRefs.length > 1 ? saleRefs : undefined}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}
