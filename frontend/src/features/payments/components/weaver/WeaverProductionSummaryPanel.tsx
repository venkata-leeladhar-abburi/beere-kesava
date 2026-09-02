import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlignJustify, ClipboardList, Download, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

import { weaverPaymentsApi, BackendWeaverPayment } from "../../../../shared/api/payments";
import { weaversApi } from "../../../../shared/api/weavers";
import { firmsApi } from "../../../../shared/api/firms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { DataTable, exportTable, type ColumnDef } from "../../../../shared/ui/data";
import { Button } from "../../../../shared/ui/primitives";
import { DropBtn, Pip } from "../common/primitives";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";
import { T, F } from "../../theme";

const TopDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginBottom: 12 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

const BottomDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginTop: 16 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

interface GroupedRow {
  weaverId: string;
  /** Human-facing weaver code ("Ramarao-001") — the only weaver id shown/exported. */
  weaverCode: string;
  weaverName: string;
  batchId: string;
  loomNumber: string;
  noOfSarees: number;
  makingCharges: number;
  deduction: number;
  // Filled in from a matching saved WeaverPayment (same weaver+batch+loom),
  // when one exists — null otherwise, meaning payment hasn't been recorded yet.
  amountPaid: number | null;
  utrNumber: string | null;
  firmName: string | null;
  paymentDate: string | null;
}

// One row per (weaver, batch, loom) — a weaver working two looms on the same
// batch produces two separate rows, not one merged row, matching how
// payments are actually tracked (WeaverPayment.batchNo/loomNumber are per
// row, not aggregated across a weaver's whole batch).
function groupRows(
  rows: { weaverId: string; weaverCode: string; weaverName: string; batchId: string | null; loomNumber: string | null; makingCharge: number; deduction: number; qcDate: string }[],
  filter: DateFilterState,
): GroupedRow[] {
  const filtered = rows.filter(r => matchesDateFilter(r.qcDate, filter));
  const byKey = new Map<string, GroupedRow>();
  for (const r of filtered) {
    const batchId = r.batchId ?? "—";
    const loomNumber = r.loomNumber ?? "—";
    const key = `${r.weaverId}|${batchId}|${loomNumber}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.noOfSarees += 1;
      existing.makingCharges += r.makingCharge;
      existing.deduction += r.deduction;
    } else {
      byKey.set(key, {
        weaverId: r.weaverId, weaverCode: r.weaverCode, weaverName: r.weaverName, batchId, loomNumber,
        noOfSarees: 1, makingCharges: r.makingCharge, deduction: r.deduction,
        amountPaid: null, utrNumber: null, firmName: null, paymentDate: null,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.weaverName.localeCompare(b.weaverName) || a.batchId.localeCompare(b.batchId) || a.loomNumber.localeCompare(b.loomNumber),
  );
}

const displayColumns: ColumnDef<GroupedRow>[] = [
  { id: "weaverId", header: "Weaver ID", priority: 3, accessor: r => r.weaverCode, type: "code" },
  { id: "weaverName", header: "Weaver Name", priority: 1, accessor: r => r.weaverName },
  { id: "batchId", header: "Batch", priority: 3, accessor: r => r.batchId, type: "code" },
  { id: "loomNumber", header: "Loom Number", accessor: r => r.loomNumber },
  { id: "noOfSarees", header: "No. of Sarees", accessor: r => r.noOfSarees, type: "number" },
  { id: "makingCharges", header: "Making Charges", accessor: r => r.makingCharges, type: "currency",
    cell: (_v, r) => <span style={{ fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(r.makingCharges)} /></span> },
  { id: "deduction", header: "Deduction", accessor: r => r.deduction, type: "currency",
    cell: (_v, r) => <span style={{ fontWeight: 700, color: T.crimson }}><Money value={rupees(r.deduction)} /></span> },
  { id: "amount", header: "Amount", accessor: r => r.makingCharges - r.deduction, type: "currency",
    cell: (_v, r) => <span style={{ fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(r.makingCharges - r.deduction)} /></span> },
  // Blank, not a placeholder — an unfilled field should occupy no visible
  // content in its column, only whatever was actually uploaded/saved.
  { id: "amountPaid", header: "Amount Paid", accessor: r => r.amountPaid ?? 0, type: "currency",
    cell: (_v, r) => r.amountPaid != null
      ? <span style={{ fontWeight: 700, color: T.green }}><Money value={rupees(r.amountPaid)} /></span>
      : null },
  // What's left to pay on THIS batch/loom specifically — Amount minus
  // whatever's already been paid against this exact row — so a partial
  // payment (e.g. ₹3,000 of a ₹4,760 row) leaves the true ₹1,760 still owed
  // on that row for the next payment upload, not the weaver's whole-history
  // balance across every other batch/loom.
  { id: "remaining", header: "Remaining", accessor: r => Math.max(0, r.makingCharges - r.deduction - (r.amountPaid ?? 0)), type: "currency",
    cell: (_v, r) => {
      const remaining = Math.max(0, r.makingCharges - r.deduction - (r.amountPaid ?? 0));
      return <span style={{ fontWeight: 700, color: T.crimson }}><Money value={rupees(remaining)} /></span>;
    } },
  { id: "utrNumber", header: "UTR Number", priority: 3, accessor: r => r.utrNumber ?? "",
    cell: (_v, r) => r.utrNumber ? <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{r.utrNumber}</span> : null },
  { id: "firmName", header: "Firm Name", priority: 3, accessor: r => r.firmName ?? "",
    cell: (_v, r) => r.firmName ? <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.firmName}</span> : null },
  { id: "paymentDate", header: "Payment Date", priority: 3, accessor: r => r.paymentDate ?? "", type: "date",
    cell: (_v, r) => r.paymentDate
      ? <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{new Date(r.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      : null },
];

// Header text here must match the existing importer's exact column keys
// (PaymentsService.importWeaverPaymentsFromExcel) — weaverId/amountPaid/
// utrNumber/firmId/paymentDate/batchNo/loomNumber/noOfSarees/deduction —
// so the filled-in template uploads straight back through the same
// BankUploadPanel above with no format translation. weaverName/makingCharges
// are extra reference columns the importer simply ignores.
const templateColumns: ColumnDef<GroupedRow>[] = [
  // The importer resolves this column by UUID, weaver code, or name
  // (PaymentsService.importWeaverPaymentsFromExcel), so the template carries
  // the readable code the admin recognises rather than the raw UUID.
  { id: "weaverId", header: "weaverId", accessor: r => r.weaverCode, type: "code" },
  { id: "weaverName", header: "weaverName", accessor: r => r.weaverName },
  { id: "batchNo", header: "batchNo", accessor: r => r.batchId, type: "code" },
  { id: "loomNumber", header: "loomNumber", accessor: r => r.loomNumber },
  { id: "noOfSarees", header: "noOfSarees", accessor: r => r.noOfSarees, type: "number" },
  { id: "makingCharges", header: "makingCharges", accessor: r => r.makingCharges, type: "currency" },
  { id: "deduction", header: "deduction", accessor: r => r.deduction, type: "currency" },
  // Reference-only, like makingCharges/deduction above — ignored on import.
  // What's still owed on THIS row specifically as of this download (net of
  // whatever's already been paid against it), same figure the "Remaining"
  // column/card shows on screen — so whoever fills the sheet can see it
  // before typing an amount into the blank amountPaid column next to it.
  { id: "remainingAmount", header: "Remaining Amount", accessor: r => Math.max(0, r.makingCharges - r.deduction - (r.amountPaid ?? 0)), type: "currency" },
  // Blank — filled in by hand, then this same file is uploaded above.
  { id: "amountPaid", header: "amountPaid", accessor: () => null },
  { id: "utrNumber", header: "utrNumber", accessor: () => null },
  { id: "firmId", header: "firmId", accessor: () => null },
  { id: "paymentDate", header: "paymentDate", accessor: () => null },
];

const savedColumns: ColumnDef<BackendWeaverPayment & { weaverName: string; weaverCode: string }>[] = [
  { id: "weaverId", header: "weaverId", accessor: r => r.weaverCode, type: "code" },
  { id: "weaverName", header: "weaverName", accessor: r => r.weaverName },
  { id: "batchNo", header: "batchNo", accessor: r => r.batchNo ?? "" },
  { id: "loomNumber", header: "loomNumber", accessor: r => r.loomNumber ?? "" },
  { id: "noOfSarees", header: "noOfSarees", accessor: r => r.noOfSarees ?? 0, type: "number" },
  { id: "deduction", header: "deduction", accessor: r => r.deduction ? Number(r.deduction) : 0, type: "currency" },
  { id: "amountPaid", header: "amountPaid", accessor: r => Number(r.amountPaid), type: "currency" },
  { id: "utrNumber", header: "utrNumber", accessor: r => r.utrNumber ?? "" },
  { id: "firmId", header: "firmId", accessor: r => r.firmId ?? "" },
  { id: "paymentDate", header: "paymentDate", accessor: r => r.paymentDate, type: "date" },
];

/**
 * Sits directly under BankUploadPanel: pick a date range, see every weaver's
 * QC-passed production for that window broken down per (weaver, batch,
 * loom), download it as a template with blank amountPaid/utrNumber/firmId/
 * paymentDate columns for the admin to fill in offline, then upload that
 * same file back through BankUploadPanel above. Once saved, the actual
 * WeaverPayment records for the window can be re-downloaded as a
 * confirmation report.
 */
const ALL_WEAVERS = "All Weavers";
const ALL_BATCHES = "All Batches";

function WeaverProductionCard({ row }: { row: GroupedRow }) {
  const netAmount = row.makingCharges - row.deduction;
  const remaining = Math.max(0, netAmount - (row.amountPaid ?? 0));
  const isPaid = row.amountPaid != null && remaining <= 0;

  return (
    <div style={{
      background: "#FFFDF9",
      borderRadius: 12,
      border: `1.5px solid ${T.antiqueGold}`,
      boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      width: "100%",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: T.royalBurgundy, width: "100%" }} />

      <div style={{ padding: "16px 20px 0" }}>
        <TopDivider />
      </div>

      <div className="p-4 pt-0 flex flex-col gap-3 flex-1">
        {/* Header: Weaver ID + Status Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <EntityCode type="weaver" value={row.weaverCode} size="sm" className="break-all whitespace-normal max-w-full" />
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isPaid ? "bg-[#27AE60]/10 text-[#27AE60]" : "bg-[#6E0F2D]/10 text-[#6E0F2D]"}`}>
            {isPaid ? "Paid ✓" : "Pending"}
          </span>
        </div>

        {/* Weaver Info */}
        <div className="flex items-center gap-3">
          <Pip initials={row.weaverName} bg="#6E0F2D" size={40} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-[#3B2314] truncate">{row.weaverName}</div>
          </div>
        </div>

        {/* Loom & Batch Box */}
        <div className="bg-[rgba(110,15,45,0.015)] border border-[#E8DCC4] rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-[12px]">
            <span className="text-[#8C7A6B] font-medium">Loom Number:</span>
            <EntityCode type="loom" value={row.loomNumber.startsWith("Loom") ? row.loomNumber : `Loom-${row.loomNumber}`} size="sm" />
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[12px]">
            <span className="text-[#8C7A6B] font-medium">Batch:</span>
            <EntityCode type="batch" value={row.batchId} size="sm" />
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-[12px] pt-1 border-t border-[#E8DCC4]/50">
            <span className="text-[#8C7A6B] font-medium">No. of Sarees:</span>
            <span className="font-bold text-[#6E0F2D] bg-[#6E0F2D]/10 px-2 py-0.5 rounded-md">{row.noOfSarees} sarees</span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FDFBF7] border-[1.5px] border-[#E8DCC4] rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between text-[12px] text-[#8C7A6B]">
            <span>Making Charges</span>
            <span className="font-bold text-[#3B2314]"><Money value={rupees(row.makingCharges)} /></span>
          </div>
          <div className="flex justify-between text-[12px] text-[#C0392B]">
            <span>Deduction</span>
            <span className="font-semibold">−<Money value={rupees(row.deduction)} /></span>
          </div>
          <div className="flex justify-between text-[12px] text-[#6E0F2D]">
            <span>Net Amount</span>
            <span className="font-bold"><Money value={rupees(netAmount)} /></span>
          </div>
          <div className="flex justify-between text-[12px] text-[#27AE60]">
            <span>Amount Paid</span>
            <span className="font-semibold">{row.amountPaid != null ? <Money value={rupees(row.amountPaid)} /> : "—"}</span>
          </div>
          <div className="border-t border-dashed border-[#E8DCC4] pt-2 mt-1 flex justify-between items-baseline">
            <span className="text-[13px] font-bold text-[#3B2314]">Remaining</span>
            <span className={`text-[16px] font-extrabold ${isPaid ? "text-[#27AE60]" : "text-[#6E0F2D]"}`}>
              {isPaid ? "Paid ✓" : <Money value={rupees(remaining)} />}
            </span>
          </div>
        </div>

        {/* Payment & Bank Metadata Box */}
        <div className="bg-[#F7F2EA]/40 border border-[#E8DCC4] rounded-xl p-2.5 flex flex-col gap-1.5 mt-auto text-[11px] text-[#8C7A6B]">
          <div className="flex justify-between items-center gap-2">
            <span>Firm Name:</span>
            <span className="font-semibold text-[#3B2314]">{row.firmName || "—"}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span>UTR Number:</span>
            {row.utrNumber ? <EntityCode type="payment" value={row.utrNumber} size="sm" /> : <span className="text-[#8C7A6B]">—</span>}
          </div>
          <div className="flex justify-between items-center gap-2">
            <span>Payment Date:</span>
            <span className="font-medium text-[#3B2314]">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
          </div>
        </div>

        <BottomDivider />
      </div>
    </div>
  );
}

export function WeaverProductionSummaryPanel({ refreshKey }: { refreshKey: number }) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [weaverFilter, setWeaverFilter] = useState(ALL_WEAVERS);
  const [batchFilter, setBatchFilter] = useState(ALL_BATCHES);
  const [search, setSearch] = useState("");

  const { data: weaversRes } = useQuery({
    queryKey: ["payments-weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ["payments-weaver-production-rows"],
    queryFn: () => weaverPaymentsApi.productionRows(),
  });
  const { data: paymentsRes, refetch: refetchPayments } = useQuery({
    queryKey: ["payments-weaver-payments-for-summary", refreshKey],
    queryFn: () => weaverPaymentsApi.list(),
  });
  const { data: firmsRes } = useQuery({
    queryKey: ["payments-firms-for-summary"],
    queryFn: () => firmsApi.list(),
  });

  const weaverNameById = useMemo(
    () => new Map((weaversRes?.items ?? []).map(w => [w.id, w.name])),
    [weaversRes],
  );
  const weaverCodeById = useMemo(
    () => new Map((weaversRes?.items ?? []).map(w => [w.id, w.code])),
    [weaversRes],
  );
  const firmNameById = useMemo(
    () => new Map((firmsRes?.items ?? []).map(f => [f.id, f.firmName])),
    [firmsRes],
  );

  const paymentByKey = useMemo(() => {
    const map = new Map<string, { total: number; latest: BackendWeaverPayment }>();
    for (const p of paymentsRes?.items ?? []) {
      const key = `${p.weaverId}|${p.batchNo ?? "—"}|${p.loomNumber ?? "—"}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += Number(p.amountPaid);
        if ((p.paymentDate ?? "") > (existing.latest.paymentDate ?? "")) existing.latest = p;
      } else {
        map.set(key, { total: Number(p.amountPaid), latest: p });
      }
    }
    return map;
  }, [paymentsRes]);

  const groupedByDate = useMemo(() => {
    return groupRows(rows, filter).map(row => {
      const payment = paymentByKey.get(`${row.weaverId}|${row.batchId}|${row.loomNumber}`);
      if (!payment) return row;
      return {
        ...row,
        amountPaid: payment.total,
        utrNumber: payment.latest.utrNumber ?? null,
        firmName: payment.latest.firmId ? (firmNameById.get(payment.latest.firmId) ?? payment.latest.firmId) : null,
        paymentDate: payment.latest.paymentDate ?? null,
      };
    });
  }, [rows, filter, paymentByKey, firmNameById]);

  const weaverOptions = useMemo(
    () => [ALL_WEAVERS, ...Array.from(new Set(weaversRes?.items.map(w => w.name) ?? [])).sort()],
    [weaversRes],
  );
  const batchOptions = useMemo(
    () => [ALL_BATCHES, ...Array.from(new Set(groupedByDate.map(r => r.batchId))).sort()],
    [groupedByDate],
  );

  useEffect(() => {
    if (weaverFilter !== ALL_WEAVERS && !weaverOptions.includes(weaverFilter)) setWeaverFilter(ALL_WEAVERS);
  }, [weaverOptions, weaverFilter]);
  useEffect(() => {
    if (batchFilter !== ALL_BATCHES && !batchOptions.includes(batchFilter)) setBatchFilter(ALL_BATCHES);
  }, [batchOptions, batchFilter]);

  const grouped = useMemo(
    () => groupedByDate.filter(r =>
      (!search || r.weaverName.toLowerCase().includes(search.toLowerCase()) || r.weaverCode.toLowerCase().includes(search.toLowerCase()) || r.batchId.toLowerCase().includes(search.toLowerCase())) &&
      (weaverFilter === ALL_WEAVERS || r.weaverName === weaverFilter) &&
      (batchFilter === ALL_BATCHES || r.batchId === batchFilter),
    ),
    [groupedByDate, search, weaverFilter, batchFilter],
  );

  const savedRows = useMemo(() => {
    const items = paymentsRes?.items ?? [];
    return items
      .filter(p => matchesDateFilter(p.paymentDate, filter))
      .map(p => ({ ...p, weaverName: weaverNameById.get(p.weaverId) ?? p.weaverId, weaverCode: weaverCodeById.get(p.weaverId) ?? p.weaverId }))
      .filter(p =>
        (weaverFilter === ALL_WEAVERS || p.weaverName === weaverFilter) &&
        (batchFilter === ALL_BATCHES || p.batchNo === batchFilter),
      );
  }, [paymentsRes, filter, weaverNameById, weaverCodeById, weaverFilter, batchFilter]);

  // Everything still owed, not just rows with zero payments so far — a row
  // with a partial payment already recorded (amountPaid !== null) but a real
  // balance left (e.g. ₹10,000 paid of ₹70,000 owed) used to be excluded
  // entirely just because `amountPaid` was non-null, so a weaver mid-way
  // through being paid off silently dropped out of the template.
  const unpaidRows = useMemo(
    () => grouped.filter(r => (r.makingCharges - r.deduction - (r.amountPaid ?? 0)) > 0),
    [grouped],
  );

  const handleDownloadTemplate = async () => {
    if (unpaidRows.length === 0) {
      toast.error(grouped.length === 0
        ? "No production found for this date range."
        : "Every row in this date range is already paid in full — nothing left to fill in.");
      return;
    }
    await exportTable({ columns: templateColumns, rows: unpaidRows, filename: "Weaver_Payment_Template" });
    toast.success(`Template downloaded for ${unpaidRows.length} row(s) with a balance still owed — fill in Amount Paid, UTR Number, Firm ID, and Payment Date, then upload it above.`);
  };

  const handleDownloadSaved = async () => {
    void refetchPayments();
    if (savedRows.length === 0) {
      toast.error("No saved payments found for this date range yet.");
      return;
    }
    await exportTable({ columns: savedColumns, rows: savedRows, filename: "Weaver_Payment_Confirmation" });
    toast.success(`Confirmation report downloaded for ${savedRows.length} saved payment(s).`);
  };

  const totalSarees = grouped.reduce((s, r) => s + r.noOfSarees, 0);

  const [prodViewMode, setProdViewMode] = useState<"card" | "table">("table");

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", marginBottom: 28, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <ClipboardList size={20} color={T.royalBurgundy} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>Production Summary for Payment</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55 }}>
              Every active weaver's completed batches and QC-passed sarees, all time by default — narrow to a date range, download a payment template, fill it in, then upload it above.
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="secondary" size="md" iconLeft={Download} onClick={handleDownloadTemplate} disabled={unpaidRows.length === 0} className="w-auto shrink-0">
              Download Payment Template
            </Button>
            <Button variant="tertiary" size="md" iconLeft={Download} onClick={handleDownloadSaved} disabled={savedRows.length === 0} className="w-auto shrink-0">
              Download Confirmation Report
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search production summary..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: filter.mode,
              defaultValue: "all",
              options: [
                { value: "all", label: "All Time" },
                { value: "day", label: "Specific Date" },
                { value: "range", label: "Date Range" },
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ],
              onChange: (m: string) => {
                const mode = m as DateFilterState["mode"];
                if (mode === "day") setFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
              },
            },
            {
              id: "weaver",
              label: "Weaver",
              value: weaverFilter,
              defaultValue: ALL_WEAVERS,
              options: weaverOptions.map(w => ({ value: w, label: w })),
              onChange: setWeaverFilter,
            },
            {
              id: "batch",
              label: "Batch",
              value: batchFilter,
              defaultValue: ALL_BATCHES,
              options: batchOptions.map(b => ({ value: b, label: b })),
              onChange: setBatchFilter,
            },
          ]}
          onResetAll={() => {
            setSearch("");
            setWeaverFilter(ALL_WEAVERS);
            setBatchFilter(ALL_BATCHES);
            setFilter(DEFAULT_DATE_FILTER);
          }}
        />
      </div>

      {/* Desktop Filter Bar & Controls */}
      <div className="hidden md:flex flex-wrap items-center gap-2.5 mb-3.5">
        <DateFilterBar filter={filter} onChange={setFilter} />
        <DropBtn value={weaverFilter} options={weaverOptions} onChange={setWeaverFilter} />
        <DropBtn value={batchFilter} options={batchOptions} onChange={setBatchFilter} />
      </div>

      <div className="flex md:hidden items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
          <Button
            onClick={() => setProdViewMode("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              prodViewMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setProdViewMode("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              prodViewMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <AlignJustify size={14} /> Table View
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "32px 0", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading production data…</div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: "32px 0", fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Couldn't load production data.</div>
      ) : (
        <>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 10 }}>
            {grouped.length} row{grouped.length === 1 ? "" : "s"} · {totalSarees} saree{totalSarees === 1 ? "" : "s"} in this period
          </div>

          {prodViewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
              {/* weaverId|batchId|loomNumber is already the row's unique identity —
                  it's what paymentByKey is keyed on — so no index tiebreaker is needed. */}
              {grouped.map((row) => (
                <WeaverProductionCard key={`${row.weaverId}-${row.batchId}-${row.loomNumber}`} row={row} />
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }} className="w-full">
              <div style={{ overflowX: "auto" }} className="w-full">
                <div className="min-w-[1450px]">
                  <DataTable responsive={false} columns={displayColumns} data={grouped} getRowId={r => `${r.weaverId}-${r.batchId}-${r.loomNumber}`} emptyTitle="No production in this period." />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
