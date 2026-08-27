
import React, { useMemo } from "react";
import { useBatches } from "@/features/production";

import { useWeaverPayments } from "@/features/weavers";

import { rupees, formatMoney } from "@/lib/domain/money";
import { useCurrentWeaver } from "./useCurrentWeaver";
import { Check, AlertTriangle } from "lucide-react";


// ─── Design Tokens ─────────────────────────────────────────────────────────
import { C, F, HeroHeader } from './theme';
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";



import { useQc } from "@/features/qc";

import { useAuth } from "../../../../contexts/AuthContext";

import { BG_IMAGE } from "./WeaverBatchNotifData";

import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";

import { IcoResourceMgmt, IcoFabricRoll, IcoQualityCheck, IcoInvoice } from "@/features/dashboards";
import { LoadingState, ErrorState } from "@/shared/ui/state";


export function PaymentLedgerPage() {
  const { getPaymentsForWeaver, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErrorObj, refetch: refetchPayments } = useWeaverPayments();
  const { getQcForWeaver, isLoading: qcLoading, isError: qcError, error: qcErrorObj, refetch: refetchQc } = useQc();
  useBatches();
  const { weaverId, weaverCode, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const { user } = useAuth();

  const myPayments = useMemo(() => (weaverId ? getPaymentsForWeaver(weaverId) : []), [weaverId, getPaymentsForWeaver]);
  const weaverQcRecords = useMemo(() => (weaverId ? getQcForWeaver(weaverId) : []), [weaverId, getQcForWeaver]);

  const now = useMemo(() => new Date(), []);
  const currentMonthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const thisMonthQcRecords = useMemo(() => {
    return weaverQcRecords.filter(q => {
      const d = new Date(q.qcDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [weaverQcRecords, now]);

  const passedSarees = useMemo(() => thisMonthQcRecords.filter(q => q.result === "passed"), [thisMonthQcRecords]);

  const chargesByType = useMemo(() => {
    const acc: Record<string, { code: string; name: string; count: number; rate: number; subtotal: number }> = {};
    for (const q of thisMonthQcRecords) {
      if (q.result === "passed") {
        const code = q.sareeTypeCode ?? "—";
        const name = q.sareeTypeName ?? q.sareeTypeCode ?? "Saree";
        const rate = Number(q.makingCharge) || 0;
        if (!acc[code]) {
          acc[code] = { code, name, count: 0, rate, subtotal: 0 };
        }
        acc[code].count += 1;
        acc[code].subtotal += rate;
      }
    }
    return Object.values(acc).sort((a, b) => b.subtotal - a.subtotal);
  }, [thisMonthQcRecords]);
  const failedSarees = useMemo(() => {
    return thisMonthQcRecords.filter(q => q.result === "defective" || q.deduction > 0).map(q => ({
      sareeId: q.sareeId,
      batchId: q.batchId || "—",
      sareeTypeName: q.sareeTypeName || "Saree",
      date: new Date(q.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      defect: q.defects?.join(", ") || "QC Deduction",
      deduction: Number(q.deduction || 0),
    }));
  }, [thisMonthQcRecords]);

  const grossChargesVal = useMemo(() => {
    return passedSarees.reduce((sum, q) => sum + (Number(q.makingCharge) || 0), 0);
  }, [passedSarees]);

  const deductionsVal = useMemo(() => {
    return thisMonthQcRecords.reduce((sum, q) => sum + (Number(q.deduction) || 0), 0);
  }, [thisMonthQcRecords]);

  const netAmountVal = Math.max(0, grossChargesVal - deductionsVal);
  const totalSareesCount = passedSarees.length;

  const currentPayment = myPayments[0] ?? null;
  const isPaid = currentPayment !== null;

  // Last 6 months of this weaver's real payments, bar-scaled to the biggest.

  const fmtAmt = (n: number) => formatMoney(rupees(n));

  const statIcons = useMemo(() => [
    <IcoResourceMgmt key="r" sz={22} col="#F5E8D0" />,
    <IcoFabricRoll key="f" sz={22} col="#F5E8D0" />,
    <IcoQualityCheck key="q" sz={22} col="#F5E8D0" />,
    <IcoInvoice key="i" sz={22} col="#F5E8D0" />,
  ], []);

  const pills: Array<{ text: string; color?: string }> = useMemo(() => [
    { text: user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "Ramarao Abburi · Ramarao-005" },
    { text: `${currentMonthLabel} · Current Month` },
    { text: `${fmtAmt(netAmountVal)} Net — ${isPaid ? "Paid" : "Pending Payment"}`, color: C.gold },
    { text: "Payment by Month End" },
  ], [user, weaverCode, currentMonthLabel, netAmountVal, isPaid]);

  const statItems: StatItem[] = useMemo(() => [
    {
      label: "SAREES PRODUCED",
      value: `${totalSareesCount}`,
      sub: `${passedSarees.length} passed QC this month`,
      icon: statIcons[0],
    },
    {
      label: "GROSS MAKING CHARGES",
      value: fmtAmt(grossChargesVal),
      sub: "Before any deductions",
      icon: statIcons[1],
      highlight: true,
      goldVal: true,
    },
    {
      label: "TOTAL DEDUCTIONS",
      value: fmtAmt(deductionsVal),
      sub: `${failedSarees.length} defective items`,
      icon: statIcons[2],
      crimson: deductionsVal > 0,
    },
    {
      label: "NET AMOUNT TO PAY",
      value: fmtAmt(netAmountVal),
      sub: `Expected by end of ${currentMonthLabel}`,
      icon: statIcons[3],
    },
  ], [totalSareesCount, passedSarees.length, grossChargesVal, deductionsVal, failedSarees.length, netAmountVal, currentMonthLabel, statIcons]);

  if (weaverLoading || paymentsLoading) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MY EARNINGS" title="My Payment Ledger" sub="Earnings, deductions, balance" />
        <div style={{ margin: "20px" }}>
          <LoadingState variant="skeleton" rows={4} />
        </div>
      </div>
    );
  }

  if (paymentsError) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MY EARNINGS" title="My Payment Ledger" sub="Earnings, deductions, balance" />
        <div style={{ margin: "20px" }}>
          <ErrorState error={paymentsErrorObj} onRetry={refetchPayments} />
        </div>
      </div>
    );
  }

  if (weaverError || !weaverId) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MY EARNINGS" title="My Payment Ledger" sub="Earnings, deductions, balance" />
        <div style={{ margin: "40px 20px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <AlertTriangle size={28} color={C.crim} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, fontWeight: 600 }}>Couldn't find your weaver profile</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── HERO BANNER MATCHING DESKTOP / MY BATCHES MOBILE HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: "28px 16px 76px" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22, pointerEvents: "none"
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.7) 0%, #0D0207 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Top row: Eyebrow + Alert Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase" }}>
              SINCE 1999 · WEAVER PORTAL · MY EARNINGS
            </div>
            <div style={{ background: "rgba(200,155,71,0.25)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#E7C983" }}>
                {isPaid ? "Payment Processed" : "Payment Pending"}
              </span>
            </div>
          </div>

          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 28, color: "#FFFDF9", lineHeight: 1.15 }}>
            My Payments <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.gold }}>& Earnings Ledger</span>
          </div>

          <div style={{ fontFamily: F.u, fontSize: 13.5, color: "rgba(255,253,249,0.75)", lineHeight: 1.6 }}>
            Track your monthly earnings, deductions, and payment history. Payments are processed at the end of each month.
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pills.map((p) => (
              <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 14px" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOATING LUXURY STATS CARD (MATCHING MY BATCHES MOBILE PAGE) ── */}
      <div style={{ padding: "0 16px", marginTop: -56, position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={statItems} />
      </div>

      {/* ── CHARGES BY SAREE TYPE ── */}
      <div style={{ margin: "24px 20px 0" }}>
        <SectionHeading title="Charges by Saree Type" />
        <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, marginTop: 4, marginBottom: 16 }}>
          Your gross making charge this month, broken down by saree type — sarees × rate for that type.
        </div>

        {qcLoading ? (
          <LoadingState variant="skeleton" rows={3} />
        ) : qcError ? (
          <ErrorState error={qcErrorObj} onRetry={refetchQc} />
        ) : chargesByType.length === 0 ? (
          <div style={{ background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "24px 20px", textAlign: "center" as const, marginBottom: 24 }}>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted }}>No sarees QC'd yet this month.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {chargesByType.map((t) => (
              <div key={t.code} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 16px rgba(44,24,16,0.06)" }}>
                {/* Header row: Name + Subtotal */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15.5, color: C.text }}>{t.name}</div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{t.code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.burg }}>{fmtAmt(t.subtotal)}</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1 }}>Subtotal</div>
                  </div>
                </div>

                {/* Details row: Quantity + Rate */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>Sarees: </span>
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{t.count} sarees</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>Rate / Saree: </span>
                    <span style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.text }}>{fmtAmt(t.rate)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Summary Strip */}
            <div style={{ background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>Total Making Charges</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{totalSareesCount} sarees produced</div>
              </div>
              <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 19, color: C.gold }}>{fmtAmt(grossChargesVal)}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── THIS MONTH'S PAYOUT CARD (DARK BURGUNDY CARD) ── */}
      <div style={{ margin: "0 20px 20px", background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 20, padding: "26px 24px", boxShadow: "0 6px 28px rgba(61,14,26,0.22)" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 10 }}>THIS MONTH'S PAYOUT</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 44, color: C.gold, lineHeight: 1, marginBottom: 8 }}>{fmtAmt(netAmountVal)}</div>
        <div style={{ fontFamily: F.u, fontSize: 13.5, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>Net amount after deductions</div>
        <div style={{ display: "inline-block", background: "rgba(200,155,71,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "7px 18px", fontFamily: F.m, fontSize: 12.5, color: C.gold }}>
          Payment for {currentMonthLabel}
        </div>
      </div>

      {/* ── PAYMENT SCHEDULE CARD (LIGHT GREEN CARD) ── */}
      <div style={{ margin: "0 20px 24px", background: "#EFFCF5", border: "1px solid #C2F0D5", borderRadius: 18, padding: "20px 22px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#1E6640", marginBottom: 8 }}>Payment Schedule</div>
        <div style={{ fontFamily: F.u, fontSize: 13.5, color: "#2B523B", lineHeight: 1.6 }}>
          Payments are processed at month end. You'll receive a WhatsApp message and in-app notification when your payment is credited.
        </div>
      </div>

      {/* ── DEDUCTIONS THIS MONTH ── */}
      <div style={{ margin: "0 20px 24px" }}>
        <SectionHeading title="Deductions This Month" />
        <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, marginTop: 4, marginBottom: 16 }}>
          Amounts deducted from your gross making charges this month.
        </div>

        {qcLoading ? (
          <LoadingState variant="skeleton" rows={2} />
        ) : qcError ? (
          <ErrorState error={qcErrorObj} onRetry={refetchQc} />
        ) : failedSarees.length === 0 ? (
          <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.green}`, borderRadius: 18, padding: "20px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.06)" }}>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.green }}>No Deductions Applied This Month</div>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, marginTop: 4 }}>You have a 100% clean quality inspection record for {currentMonthLabel}.</div>
          </div>
        ) : (
          failedSarees.map((d) => (
            <div key={d.sareeId} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 18, padding: "22px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.06)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.crim }}>Defective Saree Deduction</div>
                  <div style={{ fontFamily: F.m, fontSize: 13.5, color: C.burg, marginTop: 4 }}>{d.sareeId} ({d.batchId})</div>
                </div>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: C.crim }}>{fmtAmt(d.deduction)}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" as const }}>
                <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "4px 12px", fontFamily: F.m, fontSize: 12 }}>{d.defect}</span>
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC Date: {d.date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── PAYMENT HISTORY ── */}
      <div style={{ margin: "0 20px" }}>
        <SectionHeading title="Payment History" />
        {myPayments.length === 0 ? (
          <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, padding: "24px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted }}>No payment records uploaded yet.</div>
          </div>
        ) : (
          myPayments.map((rec) => {
            const dateStr = new Date(rec.paymentDate || rec.uploadedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
            return (
              <div key={rec.id} style={{ margin: "0 0 12px", background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `4px solid ${C.green}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 16px rgba(44,24,16,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>{dateStr}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, marginTop: 2 }}>{rec.noOfSarees ? `${rec.noOfSarees} sarees` : "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.gold }}>{fmtAmt(rec.amountPaid)}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, background: "rgba(30,102,64,0.10)", color: C.green, borderRadius: 999, padding: "3px 10px" }}>
                      <Check size={12} color={C.green} />
                      <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.green, fontWeight: 600 }}>✓ Paid</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.bdr}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 2 }}>UTR Reference</div>
                    <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.text, wordBreak: "break-all" as const }}>{rec.utrNumber || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 2 }}>Paid By</div>
                    <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>{rec.firmName || "Beere Kesava Silks"}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 2 }}>Batch No.</div>
                    <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.text }}>{rec.batchNo || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 2 }}>Loom Number</div>
                    <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.text }}>{rec.loomNumber || "—"}</div>
                  </div>
                  {!!rec.deduction && (
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 2 }}>Deduction</div>
                      <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.crim }}>{fmtAmt(rec.deduction)}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PAGE 06 — NOTIFICATIONS (admin-dashboard style) ──────────────────────
