import React from "react";
import { CheckCircle2, Eye, IndianRupee, MapPin, Building2 } from "lucide-react";
import { motion } from "motion/react";

import { F, T } from "../../theme";
import { BulkOrder } from "@/features/production";
import { Invoice } from "../../types";
import { AnimBar } from "../common/motion";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";
import { Button } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { formatRecordedBy } from "@/lib/domain/actor";
import { EntityCode, Money, StatusPill } from "@/shared/ui/domain";

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
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
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
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
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

export function CustomerCard({ inv, onViewInvoice, onRecordPayment, bulkOrderRef, bulkOrderData }: { inv: Invoice, onViewInvoice?: () => void, onRecordPayment?: () => void, bulkOrderRef?: string, bulkOrderData?: BulkOrder }) {
  const remaining = inv.total - inv.paid;
  const pct = Math.round((inv.paid / inv.total) * 100);
  const cfg = INV_STATUS_CFG[inv.status];
  const isPaid = inv.status === "Paid";
  // Backend returns payments newest-first, so [0] is whoever recorded the
  // most recent collection — the settling payment once fully paid.
  const lastPayment = inv.payments?.[0];
  const recordedByLabel = lastPayment ? formatRecordedBy(lastPayment.recordedBy) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        background: "#FFFDF9",
        border: `1.5px solid ${T.antiqueGold}`,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%",
        color: T.luxuryBrown,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: T.royalBurgundy, width: "100%", opacity: 0.8, flexShrink: 0 }} />

      <div style={{ padding: "16px 20px 0" }}>
        <TopDivider />
      </div>

      <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header Row: Code & Status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#F4F1EB", padding: "4px 10px", borderRadius: 6, fontFamily: "monospace", fontSize: 13, color: "#3B2314", fontWeight: 600, wordBreak: "break-all" }}>
            {inv.code}
          </div>
          <InvBadge status={inv.status} />
        </div>

        {/* Title Row */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#3B2314", marginBottom: 6 }}>
            {inv.customer}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 13, color: "#6B5E55" }}>
            <MapPin size={14} color="#6B5E55" />
            <span>{inv.city}</span>
          </div>
        </div>

        {/* Dates Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div style={{ border: "1px solid #EAE3D5", borderRadius: 12, padding: "12px 14px", background: "#FCFAf7" }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: "#8A7D73", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Issued On</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: "#3B2314" }}>{inv.invoiceDate}</div>
          </div>
          <div style={{ border: "1px solid #EAE3D5", borderRadius: 12, padding: "12px 14px", background: "#FCFAf7" }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: "#8A7D73", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Due Date</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: "#3B2314" }}>{inv.dueDate}</div>
          </div>
        </div>

        {/* Amounts & Collection Block */}
        <div style={{ border: "1px solid #EAE3D5", borderRadius: 12, padding: "16px", background: "#FCFAf7", flex: 1, display: "flex", flexDirection: "column" }}>
          
          {/* Row 1: Invoiced & Collected */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#6B5E55", marginBottom: 4 }}>Invoiced Amount</div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#3B2314" }}><Money value={rupees(inv.total)} /></div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#6B5E55", marginBottom: 4 }}>Amount Collected</div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#3B2314" }}><Money value={rupees(inv.paid)} /></div>
            </div>
          </div>

          <div style={{ height: 1, background: "#F0EBE1", marginBottom: 16 }} />

          {/* Outstanding Balance */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: "#3B2314" }}>Outstanding Balance</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: "#3B2314" }}><Money value={rupees(remaining)} /></div>
          </div>

          {/* Collection Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "#6B5E55" }}>Collection Status</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#3B2314" }}>{pct}% Collected</div>
          </div>
          
          <div style={{ height: 6, background: "#F0EBE1", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", background: "#C69C45", width: `${pct}%`, borderRadius: 3 }} />
          </div>

          {/* Recorded By */}
          {recordedByLabel && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8A7D73" }}>Recorded by</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#3B2314" }}>{recordedByLabel}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <BottomDivider />
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={Eye}
          onClick={onViewInvoice}
          className="flex-1 rounded-[10px] border border-[#EAE3D5] bg-white hover:bg-[#F9F7F4] text-[#6E0F2D] font-semibold min-w-[120px]"
          style={{ height: 40 }}
        >
          View Invoice
        </Button>
        {isPaid ? (
          <Button variant="secondary" size="sm" iconLeft={CheckCircle2} disabled
            className="flex-1 rounded-[10px] border border-[rgba(30,102,64,0.18)] bg-[rgba(30,102,64,0.07)] text-[#1E6640] min-w-[120px]"
            style={{ height: 40 }}
          >
            Fully Paid
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            iconLeft={IndianRupee}
            onClick={onRecordPayment}
            className="flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#4A0A1D] text-white font-semibold min-w-[120px]"
            style={{ height: 40 }}
          >
            Record Pay
          </Button>
        )}
      </div>
    </motion.div>
  );
}
