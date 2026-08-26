import React, { useMemo, useState } from "react";
import { AlertTriangle, AlignJustify, BadgeCheck, Download, Eye, HandCoins, LayoutGrid, LayoutList, MinusCircle, UserCheck, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { useBatches } from "@/features/production";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { useMaterialIssue } from "@/features/materials";
import { weaversApi, BackendWeaver } from "../../../../shared/api/weavers";
import { weaverPaymentsApi, BackendWeaverPayment } from "../../../../shared/api/payments";
import { firmsApi } from "../../../../shared/api/firms";
import { EASE, F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges, calcCompletedSarees, calcDeduction, calcNet, calcPaid } from "../../utils/charges";
import { FadeUp } from "../common/motion";
import { DropBtn, Pip, SectionCard, StatusBadge } from "../common/primitives";
import { Button, Checkbox, SearchInput } from "../../../../shared/ui/primitives";
import { DataTable, exportTable, type ColumnDef } from "../../../../shared/ui/data";
import { useDocument } from "../../../../shared/ui/document";
import { BankUploadPanel } from "./BankUploadPanel";
import { WeaverProductionSummaryPanel } from "./WeaverProductionSummaryPanel";
import { WeaverCard } from "./WeaverCard";
import { WeaverPaymentDetailModal } from "./WeaverPaymentDetailModal";
import { WeaverPaymentReportDocument, type WeaverPaymentReportRow } from "./WeaverPaymentReportDocument";
import { rupees, formatMoney } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

const AVATAR_PALETTE = ["#5A3E6B", "#6E0F2D", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040"];

/**
 * Maps a real Weaver + that weaver's most recent WeaverPayment (from
 * GET /payments/weavers) into the local WeaverRecord shape this section's
 * card/list views expect. The backend does not track saree design-type
 * breakdown (sb/hz/ps/bs/st design counts) per weaver — those are always 0
 * here; the sarees-completed figure instead comes from the payment's
 * noOfSarees field (shown via the uploadedNoOfSarees override, same as the
 * Excel-upload flow already did).
 */
function toWeaverRecord(
  w: BackendWeaver,
  index: number,
  latestPayment: BackendWeaverPayment | undefined,
  production: { charges: number; sarees: number } | undefined,
  accruedDeduction: number | undefined,
  totalPaid: number | undefined,
): WeaverRecord {
  return {
    id: w.id,
    name: w.name,
    initials: w.initials,
    bg: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    village: w.village || "—",
    sb: 0, hz: 0, ps: 0, bs: 0, st: 0,
    advance: latestPayment?.deduction ? Number(latestPayment.deduction) : 0,
    status: latestPayment ? "Paid" : "Pending",
    uploadedAmount: latestPayment ? Number(latestPayment.amountPaid) : undefined,
    uploadedDeduction: latestPayment?.deduction !== undefined && latestPayment?.deduction !== null ? Number(latestPayment.deduction) : undefined,
    uploadedNoOfSarees: latestPayment?.noOfSarees ?? undefined,
    uploadedBatchNo: latestPayment?.batchNo ?? undefined,
    uploadedLoomNumber: latestPayment?.loomNumber ?? undefined,
    // Gross charges/sarees-completed now come from the same QcRecord rows
    // that back the Production Summary table below (weaverPaymentsApi.
    // productionRows()) instead of the separate earnings() endpoint, which
    // computed gross pay off current SareeTypeRate pricing for qcPassed-only
    // rows — a different number than the table's actual per-QC-record
    // makingCharge (which also reflects SEMI/DEFECTIVE sarees). Card and
    // table must show the same figure for the same weaver.
    earnedAmount: production?.charges,
    completedSarees: production?.sarees,
    accruedDeduction,
    totalPaid,
  };
}

export function WeaverMakingChargesSection() {
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError } = useQuery({
    queryKey: ["payments-weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: paymentsRes, isLoading: paymentsLoading, isError: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ["payments-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });
  // Real SEMI-verdict QC deductions, per weaver — so a defect deduction
  // shows up here immediately rather than only after someone manually
  // round-trips it through the payment template/upload flow.
  const { data: productionRows = [], isLoading: productionRowsLoading, isError: productionRowsError } = useQuery({
    queryKey: ["payments-weaver-production-rows"],
    queryFn: () => weaverPaymentsApi.productionRows(),
  });

  // Firm each payment was routed through — needed for the payment report's
  // "Firm" column (WeaverPayment only stores firmId).
  const { data: firmsRes } = useQuery({
    queryKey: ["payments-firms-roster"],
    queryFn: () => firmsApi.list(),
  });

  const roster = useMemo(() => weaversRes?.items ?? [], [weaversRes]);
  const payments = useMemo(() => paymentsRes?.items ?? [], [paymentsRes]);

  // Reused by both the card/list roster (below) and the printable payment
  // report (handleDownloadReport) — a weaver's most recent payment record.
  const latestByWeaver = useMemo(() => {
    const map = new Map<string, BackendWeaverPayment>();
    for (const p of payments) {
      const existing = map.get(p.weaverId);
      if (!existing || new Date(p.paymentDate) > new Date(existing.paymentDate)) {
        map.set(p.weaverId, p);
      }
    }
    return map;
  }, [payments]);

  const firmNameById = useMemo(
    () => new Map((firmsRes?.items ?? []).map(f => [f.id, f.firmName])),
    [firmsRes],
  );

  // Every payment recorded for a weaver, not just the latest one — a weaver
  // paid in several installments needs all of them summed to know what's
  // actually been transferred so far.
  const totalPaidByWeaver = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      map.set(p.weaverId, (map.get(p.weaverId) ?? 0) + Number(p.amountPaid));
    }
    return map;
  }, [payments]);

  const weaversList: WeaverRecord[] = useMemo(() => {
    const accruedDeductionByWeaver = new Map<string, number>();
    const productionByWeaver = new Map<string, { charges: number; sarees: number }>();
    for (const r of productionRows) {
      accruedDeductionByWeaver.set(r.weaverId, (accruedDeductionByWeaver.get(r.weaverId) ?? 0) + r.deduction);
      const prod = productionByWeaver.get(r.weaverId) ?? { charges: 0, sarees: 0 };
      prod.charges += r.makingCharge;
      prod.sarees += 1;
      productionByWeaver.set(r.weaverId, prod);
    }
    return roster.map((w, i) => toWeaverRecord(w, i, latestByWeaver.get(w.id), productionByWeaver.get(w.id), accruedDeductionByWeaver.get(w.id), totalPaidByWeaver.get(w.id)));
  }, [roster, latestByWeaver, productionRows, totalPaidByWeaver]);

  const isLoading = weaversLoading || paymentsLoading || productionRowsLoading;
  const isError = weaversError || paymentsError || productionRowsError;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [search, setSearch] = useState("");
  const [selWeaver, setSelWeaver] = useState<WeaverRecord | null>(null);

  const [uploadRefreshKey, setUploadRefreshKey] = useState(0);
  const [filterVillage, setFilterVillage] = useState("All Villages");
  const [filterStatus, setFilterStatus] = useState("All Payment Status");
  const { batches } = useBatches();
  useMaterialIssue();
  const { download } = useDocument();

  const viewOptions = [
    { key: "card", Icon: LayoutGrid, label: "Card View" },
    { key: "list", Icon: LayoutList, label: "List View" },
  ] as const;

  const villageOptions = useMemo(
    () => Array.from(new Set(weaversList.map(w => w.village).filter(v => v && v !== "—"))).sort(),
    [weaversList],
  );

  const filtered = weaversList.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase());
    const matchVillage = filterVillage === "All Villages" || w.village === filterVillage;
    const matchStatus = filterStatus === "All Payment Status" || w.status === filterStatus;
    return matchSearch && matchVillage && matchStatus;
  });

  // Declared for <DataTable> rather than hand-written <th>/<td> — the markup
  // this replaced duplicated the header row, the zebra striping and the
  // selection checkbox column that DataTable already owns.
  const weaverColumns: ColumnDef<WeaverRecord>[] = [
    {
      id: "weaver", header: "Weaver", accessor: w => w.name, priority: 1, sortable: true,
      cell: (_v, w) => (
        <div className="flex items-center gap-3">
          <Pip initials={w.initials || w.name} bg={w.bg} size={36} />
          <div>
            <div className="font-bold text-[14px] text-[#3B2314] whitespace-nowrap">{w.name}</div>
            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
              <EntityCode type="weaver" value={w.id} size="sm" className="whitespace-nowrap" />
              <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">📍 {w.village}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "completed", header: "Completed Sarees", accessor: w => calcCompletedSarees(w), priority: 2, sortable: true,
      cell: (_v, w) => (
        <>
          <strong className="font-bold">{calcCompletedSarees(w)}</strong> sarees
          {w.uploadedBatchNo && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6E0F2D] font-semibold flex-wrap">
              Batch: <EntityCode type="batch" value={w.uploadedBatchNo} size="sm" className="break-all whitespace-normal" />
              {w.uploadedLoomNumber ? <>· Loom: <EntityCode type="loom" value={w.uploadedLoomNumber} size="sm" className="break-all whitespace-normal" /></> : null}
            </div>
          )}
        </>
      ),
    },
    {
      id: "gross", header: "Gross Charges", type: "currency", priority: 2, sortable: true,
      accessor: w => calcCharges(w),
      cell: (_v, w) => <Money value={rupees(calcCharges(w))} />,
    },
    {
      id: "deductions", header: "Deductions", type: "currency", priority: 3, sortable: true,
      accessor: w => calcDeduction(w),
      cell: (_v, w) => <span className="text-[#C0392B]">−<Money value={rupees(calcDeduction(w))} /></span>,
    },
    {
      id: "paid", header: "Amount Paid", type: "currency", priority: 3, sortable: true,
      accessor: w => calcPaid(w),
      cell: (_v, w) => (calcPaid(w) > 0
        ? <span className="text-[#27AE60]">−<Money value={rupees(calcPaid(w))} /></span>
        : "—"),
    },
    {
      id: "balance", header: "Balance Due", type: "currency", priority: 1, sortable: true,
      accessor: w => calcNet(w),
      cell: (_v, w) => (
        <span className="font-extrabold" style={{ color: w.status === "Paid" ? T.green : T.royalBurgundy }}>
          <Money value={rupees(calcNet(w))} />
        </span>
      ),
    },
    {
      id: "status", header: "Status", type: "status", align: "center", priority: 2, sortable: true,
      accessor: w => w.status,
      cell: (_v, w) => <StatusBadge status={w.status} />,
    },
    {
      id: "actions", header: "Action", type: "actions", align: "center", priority: 1,
      accessor: () => null,
      cell: (_v, w) => (
        <Button variant="secondary" size="sm" iconLeft={Eye} onClick={() => setSelWeaver(w)}>
          Details
        </Button>
      ),
    },
  ];

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadExcelTemplate = async () => {
    const weaversToExport = selectedIds.size > 0 
      ? weaversList.filter(w => selectedIds.has(w.id))
      : filtered;

    if (weaversToExport.length === 0) {
      toast.error("No weavers match the current selection/filters.");
      return;
    }

    const dataRows = weaversToExport.map(w => {
      const weaverBatches = batches.filter(b => b.rows.some(r => r.weaverId === w.id));
      const activeBatches = weaverBatches.filter(b => b.status === "active");
      const activeRow = activeBatches[0]?.rows.find(r => r.weaverId === w.id);
      
      const loomNumber = activeRow?.weaverLoom?.toString() || "1";
      const noOfSarees = calcCompletedSarees(w) || 1;
      const grossAmount = calcCharges(w);
      const deduction = calcDeduction(w);

      // Dynamic Batches Info
      const activeBatchesString = activeBatches.map(b => b.batchId).join(", ") || "None";

      return {
        weaverId: w.id,
        name: w.name,
        batchNo: activeBatchesString,
        loomNumber,
        noOfSarees,
        grossAmount,
        deduction,
      };
    });

    // design-system/07-DOCUMENTS.md Part M — exportTable(), driven by
    // ColumnDef like every DataTable export, replacing the ad hoc
    // XLSX.utils.json_to_sheet call this used to make directly. Money
    // columns (`type: "currency"`) export as raw numbers so the sheet's own
    // SUM()/AVERAGE() work — never a "₹1.2L"-style formatted string —  and
    // "Weaver ID" is `type: "code"` so Excel can't reinterpret it as a number.
    // weaverId/batchNo/loomNumber/noOfSarees/deduction/amountPaid/utrNumber/
    // firmId/paymentDate header names must match
    // PaymentsService.importWeaverPaymentsFromExcel's expected columns exactly
    // so this template can be filled in and re-uploaded via BankUploadPanel.
    const ledgerColumns: ColumnDef<(typeof dataRows)[number]>[] = [
      { id: "weaverId", header: "weaverId", accessor: r => r.weaverId, type: "code" },
      { id: "name", header: "Weaver Name", accessor: r => r.name },
      { id: "batchNo", header: "batchNo", accessor: r => r.batchNo },
      { id: "loomNumber", header: "loomNumber", accessor: r => r.loomNumber },
      { id: "noOfSarees", header: "noOfSarees", accessor: r => r.noOfSarees, type: "number" },
      { id: "grossAmount", header: "Making Charges", accessor: r => r.grossAmount, type: "currency" },
      { id: "deduction", header: "deduction", accessor: r => r.deduction, type: "currency" },
      { id: "amountPaid", header: "amountPaid", accessor: () => null },
      { id: "utrNumber", header: "utrNumber", accessor: () => null },
      { id: "paymentDate", header: "paymentDate", accessor: () => null },
      { id: "firmId", header: "firmId", accessor: () => null },
    ];

    await exportTable({ columns: ledgerColumns, rows: dataRows, filename: "Weaver_Payment_Ledger" });
    toast.success(`Successfully exported ledger for ${weaversToExport.length} weavers — fill in Amount Paid, UTR Number, Payment Date, and Firm, then upload it above.`);
  };

  // Real printable/"Save as PDF" report — one row per weaver, batches/loom/
  // saree count/UTR/firm/payment date pulled from that weaver's actual
  // latest WeaverPayment record when one exists, falling back to their
  // currently active batch (same fallback the Excel ledger export above
  // uses) so a weaver who hasn't been paid yet still shows real batch/loom
  // data instead of a blank row.
  const handleDownloadReport = () => {
    const weaversToExport = selectedIds.size > 0
      ? weaversList.filter(w => selectedIds.has(w.id))
      : filtered;

    if (weaversToExport.length === 0) {
      toast.error("No weavers match the current selection/filters.");
      return;
    }

    const rows: WeaverPaymentReportRow[] = weaversToExport.map(w => {
      const payment = latestByWeaver.get(w.id);
      const weaverBatches = batches.filter(b => b.rows.some(r => r.weaverId === w.id));
      const activeBatches = weaverBatches.filter(b => b.status === "active");
      const activeRow = activeBatches[0]?.rows.find(r => r.weaverId === w.id);

      return {
        weaverId: w.id,
        weaverName: w.name,
        batches: w.uploadedBatchNo || activeBatches.map(b => b.batchId).join(", ") || "—",
        loomNumber: w.uploadedLoomNumber || activeRow?.weaverLoom?.toString() || "—",
        noOfSarees: calcCompletedSarees(w),
        makingCharges: calcCharges(w),
        deduction: calcDeduction(w),
        amountPaid: w.uploadedAmount ?? 0,
        utrNumber: payment?.utrNumber ?? "",
        firmName: payment?.firmId ? (firmNameById.get(payment.firmId) ?? "") : "",
        paymentDate: payment ? new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
      };
    });

    const now = new Date();
    download(
      <WeaverPaymentReportDocument
        rows={rows}
        reportNumber={`WPR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`}
        generatedDate={now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        periodLabel={now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      />,
    );
  };

  const totalWeavers = weaversList.length;
  const totalGross = weaversList.reduce((acc, w) => acc + calcCharges(w), 0);
  const totalDeductions = weaversList.reduce((acc, w) => acc + calcDeduction(w), 0);
  const totalNet = weaversList.reduce((acc, w) => acc + calcNet(w), 0);

  return (
    <div id="pay-making-charges" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={HandCoins}
        title="Weaver Making Charges — May 2026"
        subtitle="Making charges are paid once a month at the end of the month. This system calculates each weaver's earnings based on completed and approved sarees."
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button variant="secondary" size="md" onClick={() => setSelectedIds(new Set())}>
                Clear Selection ({selectedIds.size})
              </Button>
            )}
            <DownloadGate>
              <Button variant="secondary" size="md" iconLeft={Download} onClick={downloadExcelTemplate}>
                Export Ledger Template
              </Button>
              <Button variant="primary" size="md" iconLeft={Download} onClick={handleDownloadReport}>
                Download Weaver Payment Report
              </Button>
            </DownloadGate>
          </>
        }
      >
        {/* ── 4 stat cards — Premium Silk Saree Design ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
          {[
            {
              icon: <UserCheck size={22} color={T.antiqueGold} />,
              label: "Total Weavers",
              value: String(totalWeavers),
              sub: "All active weavers this month",
              gid: "tw",
            },
            {
              icon: <Wallet size={22} color={T.antiqueGold} />,
              label: "Total Making Charges",
              value: formatMoney(rupees(totalGross)),
              sub: "Gross charges for May 2026",
              gid: "mc",
            },
            {
              icon: <MinusCircle size={22} color={T.antiqueGold} />,
              label: "Total Deductions Applied",
              value: formatMoney(rupees(totalDeductions)),
              sub: "Advance amount deducted",
              gid: "td",
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              label: "Net Amount to Pay",
              value: formatMoney(rupees(totalNet)),
              sub: "After all deductions",
              gid: "np",
            },
          ].map((s) => (
            <div key={s.label} style={{ position: "relative", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "#FFFDF9", boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 6px 30px rgba(0,0,0,0.04)", overflow: "visible", display: "flex", flexDirection: "column" as const, alignItems: "center", minHeight: 236 }}>

              {/* ── Header — royal burgundy gradient ── */}
              <svg
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 44, display: "block", borderRadius: "12px 12px 0 0", flexShrink: 0 }}
              >
                <defs>
                  <linearGradient id={`bk-head-${s.gid}`} x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#7A1232" />
                    <stop offset="40%" stopColor={T.royalBurgundy} />
                    <stop offset="100%" stopColor={T.deepWine} />
                  </linearGradient>
                </defs>
                {/* Band shape: full top, deep elegant curve embracing the center badge */}
                <path
                  d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z"
                  fill={`url(#bk-head-${s.gid})`}
                />
                {/* Subtle silk shimmer */}
                <path
                  d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z"
                  fill={`url(#bk-shim-${s.gid})`}
                  opacity="0.4"
                />
                <defs>
                  <linearGradient id={`bk-shim-${s.gid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(200,155,71,0)" />
                    <stop offset="50%" stopColor="rgba(200,155,71,0.08)" />
                    <stop offset="100%" stopColor="rgba(200,155,71,0)" />
                  </linearGradient>
                </defs>
                {/* Accent line along curved edge */}
                <path
                  d="M0,32 C70,36 110,85 150,88 C190,85 230,36 300,32"
                  fill="none"
                  stroke="rgba(200,155,71,0.30)"
                  strokeWidth="0.7"
                />
                {/* Tiny gold ornament at centre of curve */}
                <g transform="translate(150,86)" opacity="0.45">
                  <path d="M-6,0 C-8,-3 -11,-2 -10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M6,0 C8,-3 11,-2 10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  <rect x="-2" y="-2" width="4" height="4" rx="0.3" fill={T.antiqueGold} transform="rotate(45)" />
                </g>
              </svg>

              {/* ── Circular icon badge ── */}
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(155deg, #7A1232 0%, #6E0F2D 40%, #4A061B 100%)", border: `2.5px solid rgba(200,155,71,0.45)`, boxShadow: "0 4px 14px rgba(74,6,27,0.25), 0 0 0 3px rgba(255,253,249,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </div>
              </div>

              {/* ── Card body content ── */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, padding: "34px 20px 0", width: "100%" }}>
                {/* Label */}
                <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: 1, textTransform: "uppercase" as const, textAlign: "center" as const, lineHeight: 1.45 }}>{s.label}</div>

                {/* Value */}
                <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginTop: 14, textAlign: "center" as const }}>{s.value}</div>

                {/* ── Thin divider with diamond ── */}
                <div style={{ width: "45%", display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                  <div style={{ width: 5, height: 5, background: "rgba(110,15,45,0.22)", transform: "rotate(45deg)", flexShrink: 0, margin: "0 4px" }} />
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                </div>

                {/* Sub text */}
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, textAlign: "center" as const, lineHeight: 1.4 }}>{s.sub}</div>
              </div>

              {/* ── Footer strip — royal burgundy ── */}
              <div style={{ width: "100%", marginTop: "auto", position: "relative", overflow: "hidden", borderRadius: "0 0 12px 12px", height: 30, flexShrink: 0 }}>
                <svg
                  viewBox="0 0 300 40"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", display: "block", position: "absolute", top: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id={`bk-foot-${s.gid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.royalBurgundy} />
                      <stop offset="50%" stopColor="#5A0A22" />
                      <stop offset="100%" stopColor={T.deepWine} />
                    </linearGradient>
                  </defs>
                  {/* Footer band with smooth wave top edge */}
                  <path
                    d="M0,28 C60,28 100,10 150,8 C200,10 240,28 300,28 L300,40 L0,40 Z"
                    fill={`url(#bk-foot-${s.gid})`}
                  />
                </svg>
                {/* Elegant gold fleur-de-lis motif at centre */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyItems: "center", justifyContent: "center", paddingBottom: 0 }}>
                  <img 
                    src="/assets/gold-fleur-footer.png" 
                    alt="Ornament"
                    style={{ height: 26, maxWidth: "100%", objectFit: "contain", opacity: 0.9, transform: "translateY(1px)" }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upload Bank Payment File panel ──────────────────── */}
        {/* Saves directly to the real backend (real Weaver UUIDs). The
            "Paid"/"Pending" status and gross/net figures above are now
            derived live from GET /weavers + GET /payments/weavers, so a
            successful import is reflected here once the query refetches. */}
        <BankUploadPanel
          onUploaded={() => {
            void refetchPayments();
            setUploadRefreshKey(k => k + 1);
          }}
          onReset={() => {
            void refetchPayments();
            setUploadRefreshKey(k => k + 1);
          }}
        />

        <WeaverProductionSummaryPanel refreshKey={uploadRefreshKey} />

        {/* ── Filter + View toggle bar ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" as const }}>
          {/* View toggle */}
          <div className="hidden md:flex" style={{ border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key as "card" | "list")}
                className="!rounded-none">
                {label}
              </Button>
            ))}
          </div>
          <label htmlFor="select-all-filtered-weavers" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer" }}>
            <Checkbox
              id="select-all-filtered-weavers"
              checked={filtered.length > 0 && filtered.every(w => selectedIds.has(w.id))}
              onCheckedChange={() => {
                const allSelected = filtered.every(w => selectedIds.has(w.id));
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  filtered.forEach(w => {
                    if (allSelected) next.delete(w.id);
                    else next.add(w.id);
                  });
                  return next;
                });
              }}
            />
            Select All Filtered
          </label>
          {/* Only filters that actually filter are shown. Two decorative
              DropBtns used to sit here with no onChange at all: an "All Weavers"
              seniority filter (Master/Junior — not a concept in the data model)
              and a making-charge-rate filter whose ₹450/₹680/₹280 options were
              invented figures backed by nothing. */}
          <DropBtn value={filterVillage} options={["All Villages", ...villageOptions]} onChange={setFilterVillage} />
          <DropBtn value={filterStatus} options={["All Payment Status", "Pending", "Paid"]} onChange={setFilterStatus} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput aria-label="Search weaver name, ID, or village" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search weaver name, ID, or village..." size="sm" />
          </div>
        </div>

        <div className="flex md:hidden items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setView("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                view === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              onClick={() => setView("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                view === "list" || view === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <AlignJustify size={14} /> Table View
            </Button>
          </div>
        </div>

        {/* ── Loading / error / empty states ──────────────────── */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            Loading weaver making charges…
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <AlertTriangle size={26} color={T.crimson} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson, fontWeight: 600 }}>Couldn't load weaver payment data.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 4 }}>Please try refreshing the page.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              {weaversList.length === 0 ? "No weavers registered yet." : "No weavers match the current search/filters."}
            </div>
          </div>
        ) : (
        <>
        {/* ── Card view grid ───────────────────────────────────── */}
        {view === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}>
                <WeaverCard
                  w={w}
                  onViewDetails={() => setSelWeaver(w)}
                  selected={selectedIds.has(w.id)}
                  onToggleSelect={() => toggleSelection(w.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Table / List view ────────────────────────────────── */}
        {(view === "list" || view === "table") && (
          <div className="overflow-x-auto w-full mb-8">
            <div className="min-w-[1450px]">
              <DataTable
                columns={weaverColumns}
                data={filtered}
                getRowId={w => w.id}
                caption="Weaver making charges"
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                emptyTitle="No weavers match your filters"
              />
            </div>
          </div>
        )}
        </>
        )}

      </SectionCard>
        <AnimatePresence>
          {selWeaver && <WeaverPaymentDetailModal weaver={selWeaver} onClose={() => setSelWeaver(null)} />}
        </AnimatePresence>
      </FadeUp>
    </div>
  );
}
