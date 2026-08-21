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
import { exportTable, type ColumnDef } from "../../../../shared/ui/data";
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

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(w => w.id)));
    }
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
        {/* ── 4 stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <UserCheck size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Weavers",
              value: String(totalWeavers),
              sub: "All active weavers this month",
              hi: false,
            },
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Making Charges",
              value: formatMoney(rupees(totalGross)),
              sub: "Gross charges for May 2026",
              hi: false,
            },
            {
              icon: <MinusCircle size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Deductions Applied",
              value: formatMoney(rupees(totalDeductions)),
              sub: "Advance amount deducted",
              hi: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Net Amount to Pay",
              value: formatMoney(rupees(totalNet)),
              sub: "After all deductions",
              hi: true,
            },
          ].map((s) => (
            <div key={s.label} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              {/* Icon + label row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              {/* Value */}
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : T.luxuryBrown, lineHeight: 1 }}>{s.value}</div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
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
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search weaver name, ID, or village..." size="sm" />
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
          <div className="overflow-x-auto w-full mb-8 rounded-xl border border-[#E8DCC4] bg-white shadow-sm">
            <table className="w-full text-left border-collapse min-w-[1450px]">
              <thead>
                <tr className="bg-[#F7F2EA] border-b border-[#E8DCC4] text-[12px] font-bold text-[#3B2314] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <Checkbox
                      checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                      onCheckedChange={() => toggleSelectAll()}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[420px]">Weaver</th>
                  <th className="py-3 px-4 min-w-[180px]">Completed Sarees</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Gross Charges</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Deductions</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Amount Paid</th>
                  <th className="py-3 px-4 text-right min-w-[150px]">Balance Due</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]">
                {filtered.map((w, i) => {
                  const charges = calcCharges(w);
                  const net = calcNet(w);
                  const completedSarees = calcCompletedSarees(w);
                  const deduction = calcDeduction(w);
                  const amountPaid = calcPaid(w);
                  return (
                    <tr key={w.id} className={i % 2 === 0 ? "bg-[#FFFDF9]" : "bg-white"}>
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedIds.has(w.id)}
                          onCheckedChange={() => toggleSelection(w.id)}
                        />
                      </td>
                      <td className="py-3 px-4 min-w-[420px]">
                        <div className="flex items-center gap-3">
                          <Pip initials={w.initials || w.name} bg={w.bg} size={36} />
                          <div>
                            <div className="font-bold text-[14px] text-[#3B2314] whitespace-nowrap">{w.name}</div>
                            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                              <div className="w-[300px] min-w-[300px]">
                                <EntityCode type="weaver" value={w.id} size="sm" className="whitespace-nowrap" />
                              </div>
                              <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">📍 {w.village}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[#3B2314]">
                        <strong className="font-bold">{completedSarees}</strong> sarees
                        {w.uploadedBatchNo && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6E0F2D] font-semibold flex-wrap">
                            Batch: <EntityCode type="batch" value={w.uploadedBatchNo} size="sm" className="break-all whitespace-normal" />
                            {w.uploadedLoomNumber ? <>· Loom: <EntityCode type="loom" value={w.uploadedLoomNumber} size="sm" className="break-all whitespace-normal" /></> : null}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[13px] text-[#3B2314] whitespace-nowrap">
                        <Money value={rupees(charges)} />
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[13px] text-[#C0392B] whitespace-nowrap">
                        −<Money value={rupees(deduction)} />
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[13px] text-[#27AE60] whitespace-nowrap">
                        {amountPaid > 0 ? <>−<Money value={rupees(amountPaid)} /></> : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[15px] whitespace-nowrap" style={{ color: w.status === "Paid" ? T.green : T.royalBurgundy }}>
                        <Money value={rupees(net)} />
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button variant="secondary" size="sm" iconLeft={Eye} onClick={() => setSelWeaver(w)}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
