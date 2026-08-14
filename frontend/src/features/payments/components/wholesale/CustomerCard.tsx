import React from "react";
import { CheckCircle2, Eye, IndianRupee, MapPin } from "lucide-react";
import { motion } from "motion/react";

import { F, T, BulkOrder } from "../../theme";
import { Invoice } from "../../types";
import { AnimBar } from "../common/motion";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";
import { Button } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

export function CustomerCard({ inv, onViewInvoice, onRecordPayment, bulkOrderRef, bulkOrderData }: { inv: Invoice, onViewInvoice?: () => void, onRecordPayment?: () => void, bulkOrderRef?: string, bulkOrderData?: BulkOrder }) {
  const remaining = inv.total - inv.paid;
  const pct = Math.round((inv.paid / inv.total) * 100);
  const cfg = INV_STATUS_CFG[inv.status];
  const isPaid = inv.status === "Paid";

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 16px 36px rgba(110,15,45,0.08)" }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1px solid ${T.borderDef}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: cfg.color, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <EntityCode type="invoice" value={inv.id} size="sm" />
            {bulkOrderRef && (
              <EntityCode type="order" value={bulkOrderRef} size="sm" />
            )}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 4 }}>{inv.customer}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            <MapPin size={12} color={T.taupe} style={{ flexShrink: 0 }} />
            <span>{inv.city}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <InvBadge status={inv.status} />
        </div>
      </div>

      {/* Dates Grid */}
      <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
        <div style={{ background: T.silkCream, borderRadius: 10, padding: "8px 12px", border: `1px solid ${T.borderDef}` }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>Issued On</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{inv.invoiceDate}</div>
        </div>
        <div style={{ background: inv.status === "Overdue" ? "rgba(192,57,43,0.04)" : T.silkCream, borderRadius: 10, padding: "8px 12px", border: `1px solid ${inv.status === "Overdue" ? "rgba(192,57,43,0.18)" : T.borderDef}` }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: inv.status === "Overdue" ? T.crimson : T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>Due Date</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{inv.dueDate}</span>
            {inv.daysOverdue ? (
              <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(192,57,43,0.08)", color: T.crimson, padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>{inv.daysOverdue}d late</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Financials Re-design */}
      <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #FFFDF9 0%, #FDFBF7 100%)", margin: "0 20px", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {bulkOrderData && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Dispatch Quantity</span>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{bulkOrderData.total} sarees</span>
          </div>
        )}
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderBottom: `1px solid rgba(110,15,45,0.06)`, paddingBottom: 10 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>Invoiced Amount</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(inv.total)} /></div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>Amount Collected</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(inv.paid)} /></div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 2 }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Outstanding Balance</span>
          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: isPaid ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {isPaid ? "Fully Settled ✓" : <Money value={rupees(remaining)} />}
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{ marginTop: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>
            <span>Collection Status</span>
            <span style={{ fontFamily: F.ui, fontWeight: 700, color: isPaid ? T.green : T.luxuryBrown }}>{pct}% Collected</span>
          </div>
          <AnimBar pct={pct} color={isPaid ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold} height={6} trackBg="rgba(110,15,45,0.06)" />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "16px 20px 20px", display: "flex", gap: 10, flexShrink: 0 }}>
        <Button
          variant="secondary"
          size="md"
          iconLeft={Eye}
          onClick={onViewInvoice}
          className="flex-1 rounded-[10px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]"
        >
          View Invoice
        </Button>
        {isPaid ? (
          <Button variant="secondary" size="md" iconLeft={CheckCircle2} disabled
            className="flex-1 rounded-[10px] border-[1.5px] border-[rgba(30,102,64,0.18)] bg-[rgba(30,102,64,0.07)] text-[#1E6640] disabled:bg-[rgba(30,102,64,0.07)] disabled:text-[#1E6640] disabled:opacity-100">
            Fully Paid
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            iconLeft={IndianRupee}
            onClick={onRecordPayment}
            className="flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#4A0A1D]"
          >
            Record Pay
          </Button>
        )}
      </div>
    </motion.div>
  );
}
