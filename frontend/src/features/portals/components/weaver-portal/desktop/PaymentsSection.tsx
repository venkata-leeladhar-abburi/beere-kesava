import React from "react";
import { Check } from "lucide-react";
import { C, F, FABRIC_BG } from "../theme";
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { DesktopHero } from "./DesktopHero";
import { Button } from "../../../../../shared/ui/primitives";
import { useCurrentWeaver } from "../useCurrentWeaver";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useQc } from "@/features/qc";
import { useWeaverPayments } from "@/features/weavers";
import { useBatches } from "@/features/production";
import { useRatesPricing } from "@/features/pricing";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";

/** Thin wrapper on the shared portal heading so this section matches admin,
 *  Worker Staff and the rest of the weaver portal. */
function DSectionHeader({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) {
  return (
    <SectionHeading
      title={label}
      right={link ? <Button variant="link" onClick={onLink} className="p-0 text-sm font-semibold text-[#845E04]">{link}</Button> : undefined}
    />
  );
}

export function PaymentsSection({ bp, isTablet }: { bp: "tablet" | "desktop"; isTablet: boolean }) {
  const { weaverId, weaverCode } = useCurrentWeaver();
  const { user } = useAuth();
  const { getQcForWeaver, isLoading: qcLoading, isError: qcError, error: qcErrorObj, refetch: refetchQc } = useQc();
  const { getPaymentsForWeaver, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErrorObj, refetch: refetchPayments } = useWeaverPayments();
  const { batches } = useBatches();
  const { getSareeTypeByCode } = useRatesPricing();

  const identityBadge = user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "—";

  const weaverQcRecords = weaverId ? getQcForWeaver(weaverId) : [];
  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const thisMonthQcRecords = weaverQcRecords.filter(q => isThisMonth(q.qcDate));

  // "Produced" = QC-passed this month OR finished via the Raise Quotation
  // receive flow this month — a saree can complete that flow without a QC
  // record showing up here, so counting QC records alone undercounts it.
  const myRows = weaverId ? batches.flatMap(b => b.rows.filter(r => r.weaverId === weaverId)) : [];
  const qcProducedIds = new Set(thisMonthQcRecords.filter(q => q.result === "passed").map(q => q.sareeId));
  const quotationFinishedRows = myRows.filter(
    r => r.sareeId && r.finished && r.finishedAt && isThisMonth(r.finishedAt) && !qcProducedIds.has(r.sareeId),
  );

  const passedCount = qcProducedIds.size;
  const sareesProduced = qcProducedIds.size + quotationFinishedRows.length;
  const grossFromQc = thisMonthQcRecords.filter(q => q.result === "passed").reduce((sum, q) => sum + (Number(q.makingCharge) || 0), 0);
  const grossFromQuotation = quotationFinishedRows.reduce(
    (sum, r) => sum + (r.sareeTypeCode ? Number(getSareeTypeByCode(r.sareeTypeCode)?.charge ?? 0) : 0),
    0,
  );
  const grossCharges = grossFromQc + grossFromQuotation;
  const totalDeductions = thisMonthQcRecords.reduce((sum, q) => sum + (Number(q.deduction) || 0), 0);
  const netAmount = Math.max(0, grossCharges - totalDeductions);

  const defectiveRecords = thisMonthQcRecords.filter(q => q.result === "defective" || q.deduction > 0);
  const myPayments = weaverId ? getPaymentsForWeaver(weaverId) : [];

  // Gross charges broken down by saree type — count x that type's making
  // charge, combining QC-passed records with quotation-finished rows so the
  // breakdown matches the "Sarees Produced" total above.
  const chargesByType = Object.values(
    [
      ...thisMonthQcRecords
        .filter(q => q.result === "passed")
        .map(q => ({ code: q.sareeTypeCode ?? "—", name: q.sareeTypeName ?? q.sareeTypeCode ?? "—", rate: Number(q.makingCharge) || 0 })),
      ...quotationFinishedRows.map(r => ({
        code: r.sareeTypeCode ?? "—",
        name: r.sareeTypeName ?? r.sareeTypeCode ?? "—",
        rate: r.sareeTypeCode ? Number(getSareeTypeByCode(r.sareeTypeCode)?.charge ?? 0) : 0,
      })),
    ].reduce((acc, entry) => {
      if (!acc[entry.code]) {
        acc[entry.code] = { code: entry.code, name: entry.name, count: 0, rate: entry.rate, subtotal: 0 };
      }
      acc[entry.code].count += 1;
      acc[entry.code].subtotal += entry.rate;
      return acc;
    }, {} as Record<string, { code: string; name: string; count: number; rate: number; subtotal: number }>)
  ).sort((a, b) => b.subtotal - a.subtotal);

  const formatCurrency = (n: number) => formatMoney(rupees(n), { compact: true });

  /**
   * Migrated onto <DataTable> — design-system/04-DATA-DISPLAY.md Part S.
   * Was a hand-rolled grid-as-table; cells keep their original font/colour
   * via `cell` overrides. Header row now uses DataTable's 12px Inter spec.
   */
  const chargesByTypeColumns: ColumnDef<typeof chargesByType[number]>[] = [
    {
      id: "type", header: "Saree Type", accessor: t => t.name,
      cell: (_v, t) => (
        <div>
          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>{t.name}</div>
          <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{t.code}</div>
        </div>
      ),
    },
    {
      id: "count", header: "Sarees", accessor: t => t.count,
      cell: (_v, t) => <span style={{ fontFamily: F.u, fontSize: 15, color: C.text }}>{t.count}</span>,
    },
    {
      id: "rate", header: "Rate / Saree", accessor: t => t.rate,
      cell: (_v, t) => <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}><Money value={rupees(t.rate)} /></span>,
    },
    {
      id: "subtotal", header: "Subtotal", accessor: t => t.subtotal,
      cell: (_v, t) => <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.burg }}><Money value={rupees(t.subtotal)} /></span>,
    },
  ];

  const paymentHistoryColumns: ColumnDef<typeof myPayments[number]>[] = [
    {
      id: "date", header: "Payment Date", accessor: p => p.paymentDate || p.uploadedAt,
      cell: (_v, p) => (
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>
          {new Date(p.paymentDate || p.uploadedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "sarees", header: "Sarees", accessor: p => p.noOfSarees,
      cell: (_v, p) => <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{p.noOfSarees ? `${p.noOfSarees} sarees` : "—"}</span>,
    },
    {
      id: "amount", header: "Amount", accessor: p => p.amountPaid,
      cell: (_v, p) => <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.gold }}><Money value={rupees(p.amountPaid)} /></span>,
    },
    {
      id: "utr", header: "UTR Reference", accessor: p => p.utrNumber,
      cell: (_v, p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={15} color={C.green} />
          <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{p.utrNumber || "N/A"}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <DesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · WEAVER PORTAL · MY EARNINGS"
        titleMain="My Payments"
        titleSub="& Earnings Ledger"
        description="Track your monthly earnings, deductions, and payment history. Payments are processed at the end of each month."
        pills={[
          { text: identityBadge },
          { text: `${monthName} · Current Month` },
          { text: `${formatMoney(rupees(netAmount))} Net — ${myPayments.length > 0 ? "Processed" : "Pending Payment"}`, color: C.gold },
          { text: "Payment by Month End" },
        ]}
        alertBadge={myPayments.length > 0 ? "Payment Recorded" : "Payment Pending"}
        stats={[
          { label: "Sarees Produced", val: `${sareesProduced}`, sub: `${passedCount} passed QC this month` },
          { label: "Gross Making Charges", val: formatCurrency(grossCharges), sub: "Before any deductions", highlight: true },
          { label: "Total Deductions", val: formatMoney(rupees(totalDeductions)), sub: `${defectiveRecords.length} defective item${defectiveRecords.length === 1 ? "" : "s"}` },
          { label: "Net Amount to Pay", val: formatMoney(rupees(netAmount)), sub: `Expected by end of ${monthName}` },
        ]}
        bgUrl={FABRIC_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: 36, alignItems: "start" }}>
          {/* Left: Deductions + History table */}
          <div>
            <DSectionHeader label="Charges by Saree Type" />
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 22 }}>Your gross making charge this month, broken down by saree type — sarees × rate for that type.</div>

            {qcLoading ? (
              <LoadingState variant="skeleton" rows={3} />
            ) : qcError ? (
              <ErrorState error={qcErrorObj} onRetry={refetchQc} />
            ) : chargesByType.length === 0 ? (
              <div style={{ background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 20, padding: "28px 24px", textAlign: "center" as const, marginBottom: 40 }}>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No sarees QC'd yet this month.</div>
              </div>
            ) : (
              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 40 }}>
                <div style={{ minWidth: isTablet ? "520px" : undefined }}>
                  <DataTable columns={chargesByTypeColumns} data={chargesByType} getRowId={t => t.code} />
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr]" style={{ padding: "16px 26px", background: C.cream, alignItems: "center" }}>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Total</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{sareesProduced}</div>
                    <div />
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: C.gold }}><Money value={rupees(grossCharges)} /></div>
                  </div>
                </div>
              </div>
            )}

            <DSectionHeader label="Deductions This Month" />
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 22 }}>Amounts deducted from your gross making charges this month.</div>

            {qcLoading ? (
              <LoadingState variant="skeleton" rows={2} />
            ) : qcError ? (
              <ErrorState error={qcErrorObj} onRetry={refetchQc} />
            ) : defectiveRecords.length === 0 ? (
              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.green}`, borderRadius: 20, padding: "24px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 40 }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.green }}>No Deductions Applied This Month</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 4 }}>You have a 100% clean quality inspection record for {monthName}.</div>
              </div>
            ) : (
              defectiveRecords.map((d) => (
                <div key={d.sareeId} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 20, padding: "26px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.crim }}>Defective Saree Deduction</div>
                      <div style={{ fontFamily: F.m, fontSize: 14, color: C.burg, marginTop: 6 }}>{d.sareeId}</div>
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.crim }}><Money value={rupees(Number(d.deduction || 0))} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "5px 14px", fontFamily: F.m, fontSize: 13 }}>{d.defects?.join(", ") || "Defect Registered"}</span>
                    <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>QC Date: {new Date(d.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  {d.notes && <div style={{ fontFamily: F.u, fontStyle: "italic", fontSize: 14, color: C.muted }}>{d.notes}</div>}
                </div>
              ))
            )}

            <DSectionHeader label="Payment History" />
            {paymentsLoading ? (
              <LoadingState variant="skeleton" rows={4} />
            ) : paymentsError ? (
              <ErrorState error={paymentsErrorObj} onRetry={refetchPayments} />
            ) : myPayments.length === 0 ? (
              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, padding: "32px 26px", textAlign: "center" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No payment records uploaded yet.</div>
              </div>
            ) : (
              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                <div style={{ minWidth: isTablet ? "560px" : undefined }}>
                  <DataTable columns={paymentHistoryColumns} data={myPayments} getRowId={p => p.id ?? `${p.paymentDate ?? p.uploadedAt}-${p.amountPaid}-${p.utrNumber ?? ""}`} />
                </div>
              </div>
            )}
          </div>

          {/* Right: Trend + payout */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
            {/* Payout card */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 20, padding: "30px 28px", boxShadow: "0 6px 28px rgba(61,14,26,0.22)" }}>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 12 }}>THIS MONTH'S PAYOUT</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 54, color: C.gold, lineHeight: 1, marginBottom: 10 }}><Money value={rupees(netAmount)} /></div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Net amount after deductions</div>
              <div style={{ display: "inline-block", background: "rgba(200,155,71,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13, color: C.gold }}>
                Payment for {monthName}
              </div>
            </div>

            {/* Schedule */}
            <div style={{ background: "#F0FFF4", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 18, padding: "22px 26px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.green, marginBottom: 10 }}>Payment Schedule</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>Payments are processed at month end. You'll receive a WhatsApp message and in-app notification when your payment is credited.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
