
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG
} from './theme';


export function PaymentLedgerPage() {
  const { isMobile } = useResponsive();
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { batches } = useBatches();
  
  const myPayments = getPaymentsForWeaver(CURRENT_WEAVER_ID);

  const myWeaverRows = useMemo(() => {
    return batches.flatMap(b => b.rows.map(r => ({ ...r, batchId: b.batchId })).filter(r => r.weaverId === CURRENT_WEAVER_ID));
  }, [batches]);

  const passedSarees = useMemo(() => {
    return myWeaverRows.filter(r => r.qcPassed === true);
  }, [myWeaverRows]);

  const failedSarees = useMemo(() => {
    return myWeaverRows.filter(r => r.qcPassed === false).map(r => ({
      sareeId: r.sareeId,
      batchId: r.batchId,
      sareeTypeName: r.sareeTypeName,
      date: "10 Jun 2026",
      defect: "Thread Break",
      deduction: 450
    }));
  }, [myWeaverRows]);

  const grossChargesVal = useMemo(() => {
    return passedSarees.reduce((sum, r) => {
      const chargeStr = SAREE_TYPE_RATES[r.sareeTypeCode || '']?.charge || "450";
      return sum + parseInt(chargeStr, 10);
    }, 0);
  }, [passedSarees]);

  const deductionsVal = useMemo(() => {
    return failedSarees.length * 450;
  }, [failedSarees]);

  const netAmountVal = grossChargesVal - deductionsVal;

  const totalSareesCount = passedSarees.length + failedSarees.length;

  // Determine if the current month has a matched payment
  // A payment is "current month" if its paymentDate or uploadedAt references May/Jun 2026
  // (we treat any record NOT in the seed past-months UTRs as a current-month upload)
  const seedUtrs = new Set(PAST_MONTHS.map(p => p.utrFallback));
  const currentPayment = myPayments.find(p => !seedUtrs.has(p.utrNumber)) ?? null;

  const isPaid = currentPayment !== null;

  const fmtAmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MY EARNINGS" title="My Payment Ledger" sub="Earnings, deductions, balance" />

      {/* This Month Summary */}
      <div style={{ margin: "16px 20px" }}>
        <Card style={{ padding: 22 }}>
          <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.muted, textAlign: "center" as const, marginBottom: 16 }}>{CURRENT_MONTH_LABEL}</div>
          {[
            { label: "Sarees Produced:", value: `${totalSareesCount} sarees · ${passedSarees.length} passed QC`, color: C.text, size: 18, fw: 600 },
            { label: "Gross Making Charges:", value: fmtAmt(grossChargesVal), color: C.gold, size: 26, fw: 700 },
            { label: "Total Deductions:", value: fmtAmt(deductionsVal), color: C.crim, size: 18, fw: 600 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14, paddingBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>{row.label}</span>
              <span style={{ fontFamily: F.d, fontWeight: row.fw, fontSize: row.size, color: row.color, textAlign: "right" as const }}>{row.value}</span>
            </div>
          ))}

          {/* Net amount + payment status */}
          <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 16, marginTop: 4, textAlign: "center" as const }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>Net Amount to Be Paid:</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.green, marginBottom: 8 }}>{fmtAmt(netAmountVal)}</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 16 }}>This is what you will receive this month</div>

            {isPaid ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(30,102,64,0.12)", color: C.green, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13, fontWeight: 600 }}>
                <Check size={15} color={C.green} />✓ Paid
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(196,146,58,0.15)", color: C.gold, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13 }}>
                <Clock size={14} color={C.gold} />⏳ Payment Pending — Expected by month end
              </div>
            )}
          </div>

          {/* Payment details — shown only when paid */}
          {isPaid && currentPayment && (
            <div style={{ marginTop: 18, background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.m, fontSize: 11.5, color: C.green, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 12 }}>Payment Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                {[
                  { label: "Amount Credited", value: fmtAmt(currentPayment.amountPaid), mono: true },
                  { label: "Payment Date",    value: currentPayment.paymentDate,          mono: false },
                  { label: "UTR Number",      value: currentPayment.utrNumber,            mono: true },
                  { label: "Paid By",         value: currentPayment.firmName,             mono: false },
                  ...(currentPayment.batchNo ? [
                    { label: "Batch No",      value: currentPayment.batchNo,              mono: true },
                    { label: "Loom Number",   value: `Loom ${currentPayment.loomNumber}`,  mono: false },
                    { label: "No of Sarees",  value: `${currentPayment.noOfSarees} sarees`, mono: true },
                    { label: "Deduction",     value: fmtAmt(currentPayment.deduction ?? 0),mono: true },
                  ] : [])
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontFamily: f.mono ? F.m : F.u, fontSize: 14, fontWeight: 600, color: C.text, wordBreak: "break-all" as const }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* This Month's Payout — highlight card (same info as desktop payout panel) */}
      <div style={{ margin: "0 20px 16px", background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 18, padding: "24px 22px", boxShadow: "0 6px 24px rgba(61,14,26,0.20)" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" as const, marginBottom: 10 }}>This Month's Payout</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 40, color: C.gold, lineHeight: 1, marginBottom: 8 }}>{fmtAmt(netAmountVal)}</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.60)", marginBottom: 16 }}>Net amount after deductions</div>
        <div style={{ display: "inline-block", background: "rgba(196,146,58,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "7px 16px", fontFamily: F.m, fontSize: 12.5, color: C.gold }}>
          Payment by end of June 2026
        </div>
      </div>

      {/* Deductions Breakdown */}
      <SectionTitle title="Deductions Applied This Month" />
      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "-4px 20px 12px", lineHeight: 1.5 }}>These are the amounts deducted from your gross making charges.</div>

      {failedSarees.map((ds, idx) => (
        <div key={idx} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.crim }}>Defective Saree Deduction</span>
            <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.crim, flexShrink: 0 }}>₹{ds.deduction}</span>
          </div>
          <div style={{ fontFamily: F.m, fontSize: 13, color: C.burg, marginBottom: 8 }}>{ds.sareeId} ({ds.batchId})</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" as const }}>
            <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "3px 12px", fontFamily: F.m, fontSize: 12 }}>{ds.defect}</span>
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC Date: {ds.date}</span>
          </div>
          <div style={{ fontFamily: F.u, fontStyle: "italic", fontSize: 13, color: C.muted, lineHeight: 1.4 }}>Defect photo was sent to you via WhatsApp</div>
        </div>
      ))}
      {failedSarees.length === 0 && (
        <div style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.green}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.green, fontWeight: 600 }}>No deductions applied this month! Perfect QC record.</div>
        </div>
      )}

      {/* Earning Trend — same 4-month data shown on desktop */}
      <SectionTitle title="Earning Trend" />
      <Card style={{ margin: "0 20px 12px", padding: "20px 20px" }}>
        {[
          { month: "Feb 2026", amt: 7560, pct: 95 },
          { month: "Mar 2026", amt: 5040, pct: 63 },
          { month: "Apr 2026", amt: 6300, pct: 79 },
          { month: "May 2026", amt: 7650, pct: 96 },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 16 : 0 }}>
            <span style={{ fontFamily: F.m, fontSize: 12.5, color: C.muted, width: 76, flexShrink: 0, whiteSpace: "nowrap" as const }}>{e.month}</span>
            <div style={{ flex: 1, height: 12, background: "rgba(107,26,42,0.08)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${e.pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text, width: 52, textAlign: "right" as const, flexShrink: 0 }}>₹{(e.amt / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </Card>

      {/* Past Months History */}
      <SectionTitle title="Payment History" link="See All →" />
      {isMobile ? (
        PAST_MONTHS.map((p, i) => {
          // Find matching payment record from context (seed data or future uploads)
          const rec = myPayments.find(r => r.utrNumber === p.utrFallback);
          return (
            <div key={i} style={{ margin: "0 20px 10px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.green}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>{p.month}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 3 }}>{p.sarees}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: C.gold }}>{rec ? fmtAmt(rec.amountPaid) : p.amtFallback}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, background: "rgba(30,102,64,0.10)", color: C.green, borderRadius: 999, padding: "4px 12px" }}>
                    <Check size={12} color={C.green} />
                    <span style={{ fontFamily: F.m, fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Paid</span>
                  </div>
                </div>
              </div>

              {/* UTR + Firm row from context */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.bdr}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>UTR Number</div>
                  <div style={{ fontFamily: F.m, fontSize: 13, color: C.text, wordBreak: "break-all" as const }}>{rec?.utrNumber ?? p.utrFallback}</div>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Paid By</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{rec?.firmName ?? "Beere Kesava & Brothers Silks"}</div>
                </div>
                {rec?.paymentDate && (
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Payment Date</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{rec.paymentDate}</div>
                  </div>
                )}
                {rec?.batchNo && (
                  <>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Batch No</div>
                      <div style={{ fontFamily: F.m, fontSize: 13, color: C.text }}>{rec.batchNo}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Loom No / Sarees</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Loom {rec.loomNumber} · {rec.noOfSarees} sarees</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Gross / Deduction</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{fmtAmt(rec.amount ?? 0)} / <span style={{ color: C.crim }}>{fmtAmt(rec.deduction ?? 0)}</span></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1.2fr 1fr 0.8fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
              {["Month", "Amount Paid", "UTR", "Firm", "Date", "Status"].map(h => (
                <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
              ))}
            </div>
            {PAST_MONTHS.map((p, i) => {
              const rec = myPayments.find(r => r.utrNumber === p.utrFallback);
              return (
                <React.Fragment key={i}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1.2fr 1fr 0.8fr", padding: "12px 16px", borderBottom: !rec?.batchNo && i < PAST_MONTHS.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{p.month}</div>
                    <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.gold }}>{rec ? fmtAmt(rec.amountPaid) : p.amtFallback}</div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.text }}>{rec?.utrNumber ?? p.utrFallback}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{rec?.firmName ?? "Beere Kesava & Brothers Silks"}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{rec?.paymentDate ?? "—"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(30,102,64,0.10)", color: C.green, borderRadius: 999, padding: "2px 10px", width: "fit-content" }}>
                      <Check size={10} color={C.green} />
                      <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 600 }}>Paid</span>
                    </div>
                  </div>
                  {rec?.batchNo && (
                    <div style={{ display: "flex", gap: 32, padding: "8px 16px 12px", background: "rgba(30,102,64,0.02)", borderBottom: i < PAST_MONTHS.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                      <div>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Batch No:</span>
                        <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, marginLeft: 6 }}>{rec.batchNo}</span>
                      </div>
                      <div>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Loom Number:</span>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, marginLeft: 6 }}>Loom {rec.loomNumber}</span>
                      </div>
                      <div>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>No of Sarees:</span>
                        <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, marginLeft: 6 }}>{rec.noOfSarees} sarees</span>
                      </div>
                      <div>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Gross Amount:</span>
                        <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, marginLeft: 6 }}>{fmtAmt(rec.amount ?? 0)}</span>
                      </div>
                      <div>
                        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Deduction:</span>
                        <span style={{ fontFamily: F.m, fontSize: 12, color: C.crim, marginLeft: 6 }}>{fmtAmt(rec.deduction ?? 0)}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Schedule — same info as desktop's schedule card */}
      <div style={{ margin: "12px 20px 0", background: "#F0FFF4", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 16, padding: "18px 20px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 8 }}>Payment Schedule</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Payments are processed at month end. You'll receive a WhatsApp message and in-app notification when your payment is credited.</div>
      </div>
    </div>
  );
}

// ─── PAGE 06 — NOTIFICATIONS (admin-dashboard style) ──────────────────────
