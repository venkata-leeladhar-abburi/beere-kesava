import React, { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Download, Wallet, type LucideIcon } from "lucide-react";

import { DownloadGate } from "../../../shared/ui/DownloadAccess";
import { F, T } from "../theme";
import { formatMoney, rupees } from "@/lib/domain/money";
import { AnimBar, FadeUp } from "./common/motion";
import { ActionModal, SectionCard } from "./common/primitives";
import { Button } from "../../../shared/ui/primitives";

/* ── Financial Summary Card Template ─────────────────────────────────────────── */
function ArchCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 24, // perfectly rounds the bounding box so the hover shadow tightly hugs the template's curved corners
        containerType: "inline-size",
        aspectRatio: "938/1024",
        backgroundImage: "url(/assets/finance-card-bg-4.png)",
        backgroundSize: "100% 100%",
        display: "flex",
        flexDirection: "column",
        padding: "26% 14% 16%", // carefully tuned to avoid overlapping top arch and bottom corner flourishes
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function ArchCardHead({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", marginBottom: "6%" }}>
      <span style={{ fontFamily: F.ui, fontSize: "clamp(12px, 5cqw, 17px)", fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.6px", textTransform: "uppercase", marginTop: 4 }}>{label}</span>
      <div style={{ width: "clamp(26px, 14%, 40px)", aspectRatio: "1/1", borderRadius: "50%", border: `1px solid ${T.antiqueGold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: "translateY(-20%)" }}>
        <Icon size="50%" color={T.royalBurgundy} strokeWidth={1.5} />
      </div>
    </div>
  );
}

function ArchCardValue({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: F.display, fontSize: "clamp(22px, 10cqw, 36px)", fontWeight: 700, color: T.royalBurgundy, lineHeight: 1.1, marginBottom: "8%" }}>{children}</div>
  );
}

export function SummaryLineItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.borderDef}` }}>
      <span style={{ fontFamily: F.ui, fontSize: "clamp(12px, 4.5cqw, 15px)", color: T.taupe }}>{label}</span>
      <span style={{ fontFamily: F.ui, fontSize: "clamp(13px, 5cqw, 16px)", fontWeight: 700, color }}>{value}</span>
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
    { label: "Retail & Wholesale Sales", value: formatMoney(rupees(totalIn)) },
    { label: "Advance Collections", value: formatMoney(rupees(0)) },
  ];

  const dynamicGoingOut = [
    { label: "Weavers Paid", value: formatMoney(rupees(weaverTotal)) },
    { label: "Vendors Paid", value: formatMoney(rupees(vendorTotal)) },
    { label: "Raw Material Suppliers", value: formatMoney(rupees(supplierTotal)) },
  ];

  const pctIn  = Math.min(100, Math.round((totalIn  / (totalIn + 1841000 || 1)) * 100));
  const pctOut = Math.min(100, Math.round((totalOut / (totalIn || 1)) * 100));

  return (
    <div id="pay-summary" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <FadeUp>
      <SectionCard
        icon={Wallet}
        title="This Month's Financial Summary"
        subtitle="A clear view of all money coming in and going out this month."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download} onClick={() => setDownloadModal(true)} className="shrink-0">
              Download Report
            </Button>
          </DownloadGate>
        }
      >
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
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 20, marginTop: 24, alignItems: "stretch" }}>

          {/* Card 1 — Total Received This Month */}
          <ArchCard>
            <ArchCardHead label="Received" icon={ArrowDownCircle} />
            <ArchCardValue>{formatMoney(rupees(totalIn))}</ArchCardValue>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {dynamicComingIn.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "2cqw", fontFamily: F.ui, fontSize: "clamp(11px, 4cqw, 14px)", color: T.luxuryBrown }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.royalBurgundy, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.ui, color: T.royalBurgundy, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              {/* Elegant Gold Divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8%" }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.antiqueGold}, transparent)`, opacity: 0.5 }} />
                <div style={{ width: 4, height: 4, background: T.antiqueGold, transform: "rotate(45deg)", margin: "0 6px" }} />
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.antiqueGold}, transparent)`, opacity: 0.5 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: "clamp(11px, 4cqw, 14px)", color: T.luxuryBrown, marginBottom: 8 }}>
                <span>Collected Target</span>
                <span style={{ fontWeight: 700 }}>{pctIn}%</span>
              </div>
              <AnimBar pct={pctIn} color={T.royalBurgundy} height={6} trackBg="rgba(110,15,45,0.10)" />
            </div>
          </ArchCard>

          {/* Card 2 — Total Paid Out This Month */}
          <ArchCard>
            <ArchCardHead label="Paid Out" icon={ArrowUpCircle} />
            <ArchCardValue>{formatMoney(rupees(totalOut))}</ArchCardValue>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {dynamicGoingOut.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "2cqw", fontFamily: F.ui, fontSize: "clamp(11px, 4cqw, 14px)", color: T.luxuryBrown }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.royalBurgundy, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.ui, color: T.royalBurgundy, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto" }}>
              {/* Elegant Gold Divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8%" }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.antiqueGold}, transparent)`, opacity: 0.5 }} />
                <div style={{ width: 4, height: 4, background: T.antiqueGold, transform: "rotate(45deg)", margin: "0 6px" }} />
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.antiqueGold}, transparent)`, opacity: 0.5 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: "clamp(11px, 4cqw, 14px)", color: T.luxuryBrown, marginBottom: 8 }}>
                <span>Expense Ratio</span>
                <span style={{ fontWeight: 700 }}>{pctOut}%</span>
              </div>
              <AnimBar pct={pctOut} color={T.royalBurgundy} height={6} trackBg="rgba(110,15,45,0.10)" />
            </div>
          </ArchCard>

          {/* Card 3 — Net Cash Flow */}
          <ArchCard>
            <ArchCardHead label="Net Income" icon={Wallet} />
            <ArchCardValue>{formatMoney(rupees(netCash))}</ArchCardValue>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.8, margin: 0 }}>
              This is the remaining cash in hand after settling all weaver making charges and vendor raw material bills this month.
            </p>
          </ArchCard>

          {/* Card 4 — Outstanding (If All Collected) */}
          <ArchCard>
            <ArchCardHead label="Projected Total" icon={CalendarClock} />
            <ArchCardValue>{formatMoney(rupees(totalIn + (summary?.outstandingAmount ?? 0)))}</ArchCardValue>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.8, margin: 0 }}>
              The total potential revenue for this month, calculated if all outstanding wholesale invoices are paid in full.
            </p>
          </ArchCard>

        </div>
        </>
        )}
        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Financial Report" desc="Generate and download the financial summary report for this month." actionLabel="Download" icon={Download} />
      </SectionCard>
      </FadeUp>
    </div>
  );
}
