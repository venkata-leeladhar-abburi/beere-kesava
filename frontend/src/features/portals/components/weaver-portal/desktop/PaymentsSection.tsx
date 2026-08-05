import React from "react";
import { Check, TrendingUp } from "lucide-react";
import { C, F, FABRIC_BG } from "../theme";
import { DesktopHero } from "./DesktopHero";
import { Button } from "../../../../../shared/ui/primitives";

function DSectionHeader({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
      </div>
      {link && (
        <Button variant="link" onClick={onLink} className="p-0 text-sm text-[#C4923A]">{link}</Button>
      )}
    </div>
  );
}

export function PaymentsSection({ bp, isTablet }: { bp: "tablet" | "desktop"; isTablet: boolean }) {
  return (
    <>
      <DesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · WEAVER PORTAL · MY EARNINGS"
        titleMain="My Payments"
        titleSub="& Earnings Ledger"
        description="Track your monthly earnings, deductions, and payment history. Payments are processed at the end of each month."
        pills={[
          { text: "May 2026 · Current Month" },
          { text: "₹7,650 Net — Pending Payment", color: C.gold },
          { text: "Payment by Month End" },
        ]}
        alertBadge="Payment Pending"
        stats={[
          { label: "Sarees Produced", val: "18", sub: "17 passed QC this month" },
          { label: "Gross Making Charges", val: "₹8,100", sub: "Before any deductions", highlight: true },
          { label: "Total Deductions", val: "₹450", sub: "Thread break defect" },
          { label: "Net Amount to Pay", val: "₹7,650", sub: "Expected by end of June" },
        ]}
        bgUrl={FABRIC_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: 36, alignItems: "start" }}>
          {/* Left: Deductions + History table */}
          <div>
            <DSectionHeader label="Deductions This Month" />
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 22 }}>Amounts deducted from your gross making charges this month.</div>

            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 20, padding: "26px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.crim }}>Defective Saree Deduction</div>
                  <div style={{ fontFamily: F.m, fontSize: 14, color: C.burg, marginTop: 6 }}>PADMA-L1-004</div>
                </div>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.crim }}>₹450</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "5px 14px", fontFamily: F.m, fontSize: 13 }}>Thread Break</span>
                <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>QC Date: 10 Jun 2026</span>
              </div>
              <div style={{ fontFamily: F.u, fontStyle: "italic", fontSize: 14, color: C.muted }}>Defect photo was sent to you via WhatsApp.</div>
            </div>

            <DSectionHeader label="Payment History" link="See All →" />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
              <div style={{ minWidth: isTablet ? 560 : undefined }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "14px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                  {["Month", "Sarees", "Amount", "UTR Reference"].map(h => (
                    <div key={h} style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                  ))}
                </div>
                {[
                  { month: "Apr 2026", sarees: "15 sarees", amount: "₹6,300", utr: "UTR202604301122" },
                  { month: "Mar 2026", sarees: "12 sarees", amount: "₹5,040", utr: "UTR202603281456" },
                  { month: "Feb 2026", sarees: "18 sarees", amount: "₹7,560", utr: "UTR202602271234" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "20px 26px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>{p.month}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{p.sarees}</div>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.gold }}>{p.amount}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={15} color={C.green} />
                      <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{p.utr.slice(0, 14)}…</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Trend + payout */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
            {/* Payout card */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 20, padding: "30px 28px", boxShadow: "0 6px 28px rgba(61,14,26,0.22)" }}>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 12 }}>THIS MONTH'S PAYOUT</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 60, color: C.gold, lineHeight: 1, marginBottom: 10 }}>₹7,650</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Net amount after deductions</div>
              <div style={{ display: "inline-block", background: "rgba(196,146,58,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13, color: C.gold }}>
                Payment by end of June 2026
              </div>
            </div>

            {/* Earning trend */}
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, padding: "26px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <TrendingUp size={20} color={C.burg} />
                <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Earning Trend</span>
              </div>
              {[
                { month: "Feb 2026", amt: 7560, pct: 95 },
                { month: "Mar 2026", amt: 5040, pct: 63 },
                { month: "Apr 2026", amt: 6300, pct: 79 },
                { month: "May 2026", amt: 7650, pct: 96 },
              ].map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted, width: 68, flexShrink: 0 }}>{e.month}</span>
                  <div style={{ flex: 1, height: 12, background: "rgba(107,26,42,0.08)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${e.pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text, width: 56, textAlign: "right" as const }}>₹{(e.amt / 1000).toFixed(1)}k</span>
                </div>
              ))}
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
