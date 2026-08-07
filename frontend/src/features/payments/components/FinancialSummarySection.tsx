import React, { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Download, Wallet } from "lucide-react";
import { motion } from "motion/react";

import { DownloadGate } from "../../../shared/ui/DownloadAccess";
import { F, T } from "../theme";
import { formatINR } from "../utils/format";
import { AnimBar, FadeUp } from "./common/motion";
import { ActionModal } from "./common/primitives";
import { Button } from "../../../shared/ui/primitives";

export function SummaryLineItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${T.borderDef}` }}>
      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{label}</span>
      <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../../../shared/api/payments";

export function FinancialSummarySection() {
  const [downloadModal, setDownloadModal] = useState(false);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ["payments-summary"],
    queryFn: () => paymentsApi.getSummary(),
  });

  const totalIn = summary?.totalRevenue ?? 0;
  const totalOut = summary?.totalExpenses ?? 0;
  const netCash = summary?.netCashFlow ?? 0;

  const weaverTotal = summary?.weaverTotal ?? 0;
  const vendorTotal = summary?.vendorTotal ?? 0;
  const supplierTotal = summary?.supplierTotal ?? 0;

  const dynamicComingIn = [
    { label: "Retail & Wholesale Sales", value: formatINR(totalIn) },
    { label: "Advance Collections", value: "₹0" },
  ];

  const dynamicGoingOut = [
    { label: "Weavers Paid", value: formatINR(weaverTotal) },
    { label: "Vendors Paid", value: formatINR(vendorTotal) },
    { label: "Raw Material Suppliers", value: formatINR(supplierTotal) },
  ];

  const pctIn  = Math.min(100, Math.round((totalIn  / (totalIn + 1841000 || 1)) * 100));
  const pctOut = Math.min(100, Math.round((totalOut / (totalIn || 1)) * 100));

  return (
    <div id="pay-summary" style={{ padding: "32px 40px" }}>
      <FadeUp>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>This Month's Financial Summary</h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px" }}>
              A clear view of all money coming in and going out this month.
            </p>
          </div>
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)} className="shrink-0">
              Download Report
            </Button>
          </DownloadGate>
        </div>

        {summaryLoading ? (
          <div style={{ marginTop: 24, padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Loading financial summary…
          </div>
        ) : summaryError ? (
          <div style={{ marginTop: 24, padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>
            Failed to load financial summary. Please retry.
          </div>
        ) : (
        <>
        {/* Compact info-card grid — 4 stat cards side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 24, alignItems: "stretch" }}>

          {/* Card 1 — Total Received This Month */}
          <motion.div
            whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(30,102,64,0.15)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ background: "linear-gradient(135deg, rgba(30,102,64,0.06) 0%, rgba(30,102,64,0.01) 100%)", borderRadius: 20, border: `1px solid rgba(30,102,64,0.18)`, padding: "24px 22px 20px", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green, letterSpacing: "0.5px", textTransform: "uppercase" }}>Received</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowDownCircle size={15} color={T.green} />
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: T.green, lineHeight: 1.1, marginBottom: 16 }}>{formatINR(totalIn)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {dynamicComingIn.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>
                <span>Collected Target</span>
                <span style={{ fontWeight: 700 }}>{pctIn}%</span>
              </div>
              <AnimBar pct={pctIn} color={T.green} height={5} trackBg="rgba(30,102,64,0.08)" />
            </div>
          </motion.div>

          {/* Card 2 — Total Paid Out This Month */}
          <motion.div
            whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(192,57,43,0.15)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ background: "linear-gradient(135deg, rgba(192,57,43,0.06) 0%, rgba(192,57,43,0.01) 100%)", borderRadius: 20, border: `1px solid rgba(192,57,43,0.18)`, padding: "24px 22px 20px", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, letterSpacing: "0.5px", textTransform: "uppercase" }}>Paid Out</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowUpCircle size={15} color={T.crimson} />
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: T.crimson, lineHeight: 1.1, marginBottom: 16 }}>{formatINR(totalOut)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {dynamicGoingOut.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.crimson, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>
                <span>Expense Ratio</span>
                <span style={{ fontWeight: 700 }}>{pctOut}%</span>
              </div>
              <AnimBar pct={pctOut} color={T.crimson} height={5} trackBg="rgba(192,57,43,0.08)" />
            </div>
          </motion.div>

          {/* Card 3 — Net Cash Flow */}
          <motion.div
            whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(110,15,45,0.12)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ background: "linear-gradient(135deg, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0.01) 100%)", borderRadius: 20, border: `1px solid rgba(110,15,45,0.18)`, padding: "24px 22px 20px", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px", textTransform: "uppercase" }}>Net Income</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={15} color={T.royalBurgundy} />
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: T.royalBurgundy, lineHeight: 1.1, marginBottom: 16 }}>{formatINR(netCash)}</div>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, margin: 0 }}>
              This is the remaining cash in hand after settling all weaver making charges and vendor raw material bills this month.
            </p>
          </motion.div>

          {/* Card 4 — Outstanding (If All Collected) */}
          <motion.div
            whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(200,155,71,0.15)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ background: "linear-gradient(135deg, rgba(200,155,71,0.08) 0%, rgba(200,155,71,0.02) 100%)", borderRadius: 20, border: `1px solid rgba(200,155,71,0.22)`, padding: "24px 22px 20px", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.antiqueGold, letterSpacing: "0.5px", textTransform: "uppercase" }}>Projected Total</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,155,71,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarClock size={15} color={T.antiqueGold} />
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: T.antiqueGold, lineHeight: 1.1, marginBottom: 16 }}>{formatINR(totalIn + (summary?.outstandingAmount ?? 0))}</div>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, margin: 0 }}>
              The total potential revenue for this month, calculated if all outstanding wholesale invoices are paid in full.
            </p>
          </motion.div>

        </div>
        </>
        )}
        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Financial Report" desc="Generate and download the financial summary report for this month." actionLabel="Download" icon={Download} />
      </FadeUp>
    </div>
  );
}
