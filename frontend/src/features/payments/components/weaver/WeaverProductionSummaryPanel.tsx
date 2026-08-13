import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Download } from "lucide-react";
import { toast } from "sonner";

import { weaverPaymentsApi, BackendWeaverPayment } from "../../../../shared/api/payments";
import { weaversApi } from "../../../../shared/api/weavers";
import { firmsApi } from "../../../../shared/api/firms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { DataTable, exportTable, type ColumnDef } from "../../../../shared/ui/data";
import { Button } from "../../../../shared/ui/primitives";
import { DropBtn } from "../common/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { T, F } from "../../theme";

interface GroupedRow {
  weaverId: string;
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
  rows: { weaverId: string; weaverName: string; batchId: string | null; loomNumber: string | null; makingCharge: number; deduction: number; qcDate: string }[],
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
        weaverId: r.weaverId, weaverName: r.weaverName, batchId, loomNumber,
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
  { id: "weaverId", header: "Weaver ID", priority: 3, accessor: r => r.weaverId, type: "code" },
  { id: "weaverName", header: "Weaver Name", priority: 1, accessor: r => r.weaverName },
  { id: "batchId", header: "Batch", priority: 3, accessor: r => r.batchId, type: "code" },
  { id: "loomNumber", header: "Loom Number", accessor: r => r.loomNumber },
  { id: "noOfSarees", header: "No. of Sarees", accessor: r => r.noOfSarees, type: "number" },
  { id: "makingCharges", header: "Making Charges", accessor: r => r.makingCharges, type: "currency",
    cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(r.makingCharges)} /></span> },
  { id: "deduction", header: "Deduction", accessor: r => r.deduction, type: "currency",
    cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.crimson }}><Money value={rupees(r.deduction)} /></span> },
  { id: "amount", header: "Amount", accessor: r => r.makingCharges - r.deduction, type: "currency",
    cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(r.makingCharges - r.deduction)} /></span> },
  // Blank, not a placeholder — an unfilled field should occupy no visible
  // content in its column, only whatever was actually uploaded/saved.
  { id: "amountPaid", header: "Amount Paid", accessor: r => r.amountPaid ?? 0, type: "currency",
    cell: (_v, r) => r.amountPaid != null
      ? <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.green }}><Money value={rupees(r.amountPaid)} /></span>
      : null },
  // What's left to pay on THIS batch/loom specifically — Amount minus
  // whatever's already been paid against this exact row — so a partial
  // payment (e.g. ₹3,000 of a ₹4,760 row) leaves the true ₹1,760 still owed
  // on that row for the next payment upload, not the weaver's whole-history
  // balance across every other batch/loom.
  { id: "remaining", header: "Remaining", accessor: r => Math.max(0, r.makingCharges - r.deduction - (r.amountPaid ?? 0)), type: "currency",
    cell: (_v, r) => {
      const remaining = Math.max(0, r.makingCharges - r.deduction - (r.amountPaid ?? 0));
      return <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.crimson }}><Money value={rupees(remaining)} /></span>;
    } },
  { id: "utrNumber", header: "UTR Number", priority: 3, accessor: r => r.utrNumber ?? "",
    cell: (_v, r) => r.utrNumber ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{r.utrNumber}</span> : null },
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
  { id: "weaverId", header: "weaverId", accessor: r => r.weaverId, type: "code" },
  { id: "weaverName", header: "weaverName", accessor: r => r.weaverName },
  { id: "batchNo", header: "batchNo", accessor: r => r.batchId, type: "code" },
  { id: "loomNumber", header: "loomNumber", accessor: r => r.loomNumber },
  { id: "noOfSarees", header: "noOfSarees", accessor: r => r.noOfSarees, type: "number" },
  { id: "makingCharges", header: "makingCharges", accessor: r => r.makingCharges, type: "currency" },
  { id: "deduction", header: "deduction", accessor: r => r.deduction, type: "currency" },
  // Blank — filled in by hand, then this same file is uploaded above.
  { id: "amountPaid", header: "amountPaid", accessor: () => null },
  { id: "utrNumber", header: "utrNumber", accessor: () => null },
  { id: "firmId", header: "firmId", accessor: () => null },
  { id: "paymentDate", header: "paymentDate", accessor: () => null },
];

const savedColumns: ColumnDef<BackendWeaverPayment & { weaverName: string }>[] = [
  { id: "weaverId", header: "weaverId", accessor: r => r.weaverId, type: "code" },
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

export function WeaverProductionSummaryPanel({ refreshKey }: { refreshKey: number }) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [weaverFilter, setWeaverFilter] = useState(ALL_WEAVERS);
  const [batchFilter, setBatchFilter] = useState(ALL_BATCHES);

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
  const firmNameById = useMemo(
    () => new Map((firmsRes?.items ?? []).map(f => [f.id, f.firmName])),
    [firmsRes],
  );
  // Same (weaver, batch, loom) key as groupRows — a batch/loom can receive
  // more than one payment over time (partial payments), so this sums every
  // matching payment rather than keeping only the last one (which was
  // silently discarding earlier payments and understating what was paid).
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

  // The full weaver roster, always — not just weavers with rows in the
  // current date window, so admin can pick any weaver and see "no data" for
  // them rather than that weaver simply not being an option at all.
  const weaverOptions = useMemo(
    () => [ALL_WEAVERS, ...Array.from(new Set(weaversRes?.items.map(w => w.name) ?? [])).sort()],
    [weaversRes],
  );
  // Batches aren't a fixed roster the same way weavers are, so this stays
  // scoped to what's actually in the selected date window.
  const batchOptions = useMemo(
    () => [ALL_BATCHES, ...Array.from(new Set(groupedByDate.map(r => r.batchId))).sort()],
    [groupedByDate],
  );

  // A weaver/batch picked before the date filter changed can fall out of
  // the now-available options — reset back to "All" rather than silently
  // filtering everything down to zero rows.
  useEffect(() => {
    if (weaverFilter !== ALL_WEAVERS && !weaverOptions.includes(weaverFilter)) setWeaverFilter(ALL_WEAVERS);
  }, [weaverOptions, weaverFilter]);
  useEffect(() => {
    if (batchFilter !== ALL_BATCHES && !batchOptions.includes(batchFilter)) setBatchFilter(ALL_BATCHES);
  }, [batchOptions, batchFilter]);

  const grouped = useMemo(
    () => groupedByDate.filter(r =>
      (weaverFilter === ALL_WEAVERS || r.weaverName === weaverFilter) &&
      (batchFilter === ALL_BATCHES || r.batchId === batchFilter),
    ),
    [groupedByDate, weaverFilter, batchFilter],
  );

  const savedRows = useMemo(() => {
    const items = paymentsRes?.items ?? [];
    return items
      .filter(p => matchesDateFilter(p.paymentDate, filter))
      .map(p => ({ ...p, weaverName: weaverNameById.get(p.weaverId) ?? p.weaverId }))
      .filter(p =>
        (weaverFilter === ALL_WEAVERS || p.weaverName === weaverFilter) &&
        (batchFilter === ALL_BATCHES || p.batchNo === batchFilter),
      );
  }, [paymentsRes, filter, weaverNameById, weaverFilter, batchFilter]);

  // Only rows with no matching saved payment yet — an already-paid row has
  // nothing left to fill in, and including it would invite a duplicate
  // payment on re-upload.
  const unpaidRows = useMemo(() => grouped.filter(r => r.amountPaid == null), [grouped]);

  const handleDownloadTemplate = async () => {
    if (unpaidRows.length === 0) {
      toast.error(grouped.length === 0
        ? "No production found for this date range."
        : "Every row in this date range is already paid — nothing left to fill in.");
      return;
    }
    await exportTable({ columns: templateColumns, rows: unpaidRows, filename: "Weaver_Payment_Template" });
    toast.success(`Template downloaded for ${unpaidRows.length} unpaid row(s) — fill in Amount Paid, UTR Number, Firm ID, and Payment Date, then upload it above.`);
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

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", marginBottom: 28, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ClipboardList size={19} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Production Summary for Payment</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              Every active weaver's completed batches and QC-passed sarees, all time by default — narrow to a date range, download a payment template, fill it in, then upload it above.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <Button variant="secondary" size="md" iconLeft={Download} onClick={handleDownloadTemplate} disabled={unpaidRows.length === 0}>
            Download Payment Template
          </Button>
          <Button variant="tertiary" size="md" iconLeft={Download} onClick={handleDownloadSaved} disabled={savedRows.length === 0}>
            Download Confirmation Report
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <DateFilterBar filter={filter} onChange={setFilter} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 14 }}>
        <DropBtn value={weaverFilter} options={weaverOptions} onChange={setWeaverFilter} />
        <DropBtn value={batchFilter} options={batchOptions} onChange={setBatchFilter} />
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
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
            <DataTable responsive columns={displayColumns} data={grouped} getRowId={r => `${r.weaverId}-${r.batchId}-${r.loomNumber}`} emptyTitle="No production in this period." />
          </div>
        </>
      )}
    </div>
  );
}
