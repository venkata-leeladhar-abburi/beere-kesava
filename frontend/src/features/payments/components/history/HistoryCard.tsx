import React from "react";
import { ArrowDownCircle, BadgeCheck, Eye, Package, Receipt, Scissors, UploadCloud } from "lucide-react";
import { motion } from "motion/react";

import { F, T } from "../../theme";
import { Invoice, PayHistRecord, PayHistStatus, PayHistType } from "../../types";

export const HIST_TYPE_CFG: Record<PayHistType, { bg: string; color: string; border: string }> = {
  "Vendor Payment":   { bg: "rgba(200,155,71,0.12)",  color: "#8B6018",       border: "#C89B47" },
  "Weaver Payment":   { bg: "rgba(110,15,45,0.10)",   color: "#6E0F2D",       border: "#6E0F2D" },
  "Customer Receipt": { bg: "rgba(30,102,64,0.10)",   color: "#1E6640",       border: "#1E6640" },
};

export const HIST_STATUS_CFG: Record<PayHistStatus, { bg: string; color: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640" },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018" },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A" },
};

export function getHistTypeIcon(type: PayHistType) {
  if (type === "Customer Receipt") return { Icon: ArrowDownCircle, color: T.green,         iconBg: T.greenBg,                  iconBorder: "rgba(30,102,64,0.22)"  };
  if (type === "Weaver Payment")   return { Icon: Scissors,        color: T.royalBurgundy, iconBg: "rgba(110,15,45,0.08)",     iconBorder: T.borderDef             };
  return                                  { Icon: Package,         color: "#8B6018",       iconBg: "rgba(200,155,71,0.12)",    iconBorder: T.borderGold            };
}

export function HistoryCard({ r }: { r: PayHistRecord }) {
  const typeCfg = HIST_TYPE_CFG[r.type];
  const stsCfg  = HIST_STATUS_CFG[r.status];
  const { Icon, color: iconColor, iconBg, iconBorder } = getHistTypeIcon(r.type);
  const isReceipt = r.type === "Customer Receipt";
  const isPaid    = r.status === "Paid";

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 12px 28px rgba(59,35,20,0.12)" }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{ display: "flex", flexDirection: "column", width: "100%", borderRadius: 20, background: T.warmIvory, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: typeCfg.border, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid rgba(110,15,45,0.06)`, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, border: `1px solid ${iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 15.5, fontWeight: 700, color: T.luxuryBrown, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.party}</div>
          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
        </div>
        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color, flexShrink: 0 }}>
          {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
        </span>
      </div>

      {/* Body / Amount */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.06)`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>
            {isReceipt ? "Amount Received" : "Amount Paid"}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: isReceipt ? T.green : T.crimson }}>
            {isReceipt ? "+" : "−"}₹{r.amount.toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>Date</div>
          <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 700 }}>{r.date}</div>
        </div>
      </div>

      {/* Meta Grid */}
      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", flexShrink: 0, borderBottom: `1px solid rgba(110,15,45,0.06)` }}>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Reference</div>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{r.refNo}</span>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Invoice / PO</div>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{r.invoicePO ?? "—"}</span>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Payment Mode</div>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 500 }}>{r.mode}</span>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Recorded By</div>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{r.recordedBy}</span>
        </div>
      </div>

      {/* UTR / Description info */}
      <div style={{ padding: "14px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>Description</div>
          <p style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.5, margin: 0 }}>{r.description}</p>
        </div>
        {r.utr && (
          <div style={{ borderTop: `1px dashed rgba(110,15,45,0.08)`, paddingTop: 8, marginTop: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>UTR / Reference ID</div>
            <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.green, fontWeight: 700 }}>{r.utr}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 20px 20px", display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          style={{
            flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 10, background: "#fff",
            fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
        >
          <Eye size={13} /> View Details
        </button>
        {isPaid ? (
          <button style={{ flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px solid rgba(30,102,64,0.18)`, borderRadius: 10, background: "rgba(30,102,64,0.07)", fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.green, cursor: "default" }}>
            <BadgeCheck size={14} /> Completed
          </button>
        ) : (
          <button
            style={{
              flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: "none", borderRadius: 10, background: T.royalBurgundy,
              fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: "#FFFDF9", cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.deepWine; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.royalBurgundy; }}
          >
            <UploadCloud size={13} /> Update Status
          </button>
        )}
      </div>
    </motion.div>
  );
}
