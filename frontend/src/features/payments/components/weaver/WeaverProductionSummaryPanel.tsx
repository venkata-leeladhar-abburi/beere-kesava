import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Download } from "lucide-react";
import { toast } from "sonner";

import { weaverPaymentsApi, BackendWeaverPayment } from "../../../../shared/api/payments";
import { weaversApi } from "../../../../shared/api/weavers";
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
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.weaverName.localeCompare(b.weaverName) || a.batchId.localeCompare(b.batchId) || a.loomNumber.localeCompare(b.loomNumber),
  );
}

const displayColumns: ColumnDef<GroupedRow>[] = [
  { id: "weaverId", header: "Weaver ID", accessor: r => r.weaverId, type: "code" },
  { id: "weaverName", header: "Weaver Name", accessor: r => r.weaverName },
  { id: "batchId", header: "Batch", accessor: r => r.batchId, type: "code" },
  { id: "loomNumber", header: "Loom Number", accessor: r => r.loomNumber },
  { id: "noOfSarees", header: "No. of Sarees", accessor: r => r.noOfSarees, type: "number" },
  { id: "makingCharges", header: "Making Charges", accessor: r => r.makingCharges, type: "currency",
    cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(r.makingCharges)} /></span> },
  { id: "deduction", header: "Deduction", accessor: r => r.deduction, type: "currency",
    cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.crimson }}><Money value={rupees(r.deduction)} /></span> },
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

  const weaverNameById = useMemo(
    () => new Map((weaversRes?.items ?? []).map(w => [w.id, w.name])),
    [weaversRes],
  );

  const groupedByDate = useMemo(() => groupRows(rows, filter), [rows, filter]);

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

  const handleDownloadTemplate = async () => {
    if (grouped.length === 0) {
      toast.error("No production found for this date range.");
      return;
    }
    await exportTable({ columns: templateColumns, rows: grouped, filename: "Weaver_Payment_Template" });
    toast.success(`Template downloaded for ${grouped.length} row(s) — fill in Amount Paid, UTR Number, Firm ID, and Payment Date, then upload it above.`);
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
              Pick a date range to see real QC-passed production, download a payment template, fill it in, then upload it above.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" size="md" iconLeft={Download} onClick={handleDownloadTemplate} disabled={grouped.length === 0}>
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
      ) : filter.mode === "all" ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Select a date to see production for that period.</div>
      ) : (
        <>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 10 }}>
            {grouped.length} row{grouped.length === 1 ? "" : "s"} · {totalSarees} saree{totalSarees === 1 ? "" : "s"} in this period
          </div>
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
            <DataTable columns={displayColumns} data={grouped} getRowId={r => `${r.weaverId}-${r.batchId}-${r.loomNumber}`} emptyTitle="No production in this period." />
          </div>
        </>
      )}
    </div>
  );
}
