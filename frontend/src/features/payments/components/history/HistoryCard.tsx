import { ArrowDownCircle, BadgeCheck, Eye, Package, Scissors, UploadCloud } from "lucide-react";
import { motion } from "motion/react";

import { F, T } from "../../theme";
import { PayHistRecord, PayHistStatus, PayHistType } from "../../types";
import { Button } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";

export const HIST_TYPE_CFG: Record<PayHistType, { bg: string; color: string; border: string }> = {
  "Vendor Payment":   { bg: "rgba(200,155,71,0.12)",  color: "#8B6018",       border: "#C89B47" },
  "Weaver Payment":   { bg: "rgba(110,15,45,0.10)",   color: "#6E0F2D",       border: "#6E0F2D" },
  "Customer Receipt": { bg: "rgba(30,102,64,0.10)",   color: "#1E6640",       border: "#1E6640" },
  "Supplier Payment": { bg: "rgba(74,107,138,0.12)",  color: "#2E5A8A",       border: "#4A6B8A" },
};

export const HIST_STATUS_CFG: Record<PayHistStatus, { bg: string; color: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640" },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018" },
  Pending: { bg: "rgba(192,57,43,0.10)",   color: "#C0392B" },
};

export function getHistTypeIcon(type: PayHistType) {
  if (type === "Customer Receipt") return { Icon: ArrowDownCircle, color: T.green,         iconBg: T.greenBg,                  iconBorder: "rgba(30,102,64,0.22)"  };
  if (type === "Weaver Payment")   return { Icon: Scissors,        color: T.royalBurgundy, iconBg: "rgba(110,15,45,0.08)",     iconBorder: T.borderDef             };
  if (type === "Supplier Payment") return { Icon: Package,         color: "#2E5A8A",       iconBg: "rgba(74,107,138,0.12)",    iconBorder: "rgba(74,107,138,0.22)" };
  return                                  { Icon: Package,         color: "#8B6018",       iconBg: "rgba(200,155,71,0.12)",    iconBorder: T.borderGold            };
}
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
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
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
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
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

export function HistoryCard({ r, onView }: { r: PayHistRecord; onView?: () => void }) {
  const typeCfg = HIST_TYPE_CFG[r.type];
  const stsCfg = HIST_STATUS_CFG[r.status];
  const { Icon, color: iconColor } = getHistTypeIcon(r.type);
  const isReceipt = r.type === "Customer Receipt";
  const isPaid    = r.status === "Paid";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="card-hover"
      style={{
        background: "#FFFDF9",
        border: `1.5px solid ${T.antiqueGold}`,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: T.royalBurgundy, width: "100%" }} />

      <div style={{ padding: "16px 20px 0" }}>
        <TopDivider />
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <div style={{ padding: "20px 22px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: typeCfg.bg, border: `1px solid ${typeCfg.border}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={20} color={iconColor} />
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <div style={{ fontFamily: F.display, fontSize: 15.5, fontWeight: 700, color: T.luxuryBrown, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.party}</div>
            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
          </div>
          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color, flexShrink: 0 }}>
            {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
          </span>
        </div>

        {/* Body / Amount */}
        <div style={{ padding: "16px 22px", borderTop: `1px solid rgba(110,15,45,0.06)`, borderBottom: `1px solid rgba(110,15,45,0.06)`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>
              {isReceipt ? "Amount Received" : "Amount Paid"}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: isReceipt ? T.green : T.crimson }}>
              {isReceipt ? "+" : "−"}<Money value={rupees(r.amount)} />
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>Date</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 700 }}>{r.date}</div>
          </div>
        </div>

        {/* Meta Grid */}
        <div style={{ padding: "16px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px 14px", flexShrink: 0, borderBottom: `1px solid rgba(110,15,45,0.06)` }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Reference</div>
            <EntityCode type="payment" value={r.refNo} size="sm" className="break-all whitespace-normal max-w-full" />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Invoice / PO</div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{r.invoicePO ?? "—"}</span>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Payment Mode</div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 500 }}>{r.mode}</span>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 2 }}>Recorded By</div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.recordedBy}</span>
          </div>
        </div>

        {/* UTR / Description info */}
        <div style={{ padding: "14px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>Description</div>
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.5, margin: 0 }}>{r.description}</p>
          </div>
          {r.utr && (
            <div style={{ borderTop: `1px dashed rgba(110,15,45,0.08)`, paddingTop: 8, marginTop: 4 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>UTR / Reference ID</div>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, fontWeight: 700 }}>{r.utr}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <BottomDivider />
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
        <Button variant="secondary" size="sm" iconLeft={Eye} onClick={onView}
          className="flex-1 min-w-[120px] rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D]">
          View Details
        </Button>
        {isPaid ? (
          <Button variant="secondary" size="sm" iconLeft={BadgeCheck} disabled
            className="flex-1 min-w-[120px] rounded-xl border-[1.5px] border-[rgba(30,102,64,0.18)] bg-[rgba(30,102,64,0.07)] text-[#1E6640] disabled:bg-[rgba(30,102,64,0.07)] disabled:text-[#1E6640] disabled:opacity-100">
            Completed
          </Button>
        ) : (
          <Button variant="primary" size="sm" iconLeft={UploadCloud}
            className="flex-1 min-w-[120px] rounded-xl bg-[#6E0F2D] hover:bg-[#4A0A1D]">
            Update Status
          </Button>
        )}
      </div>
    </motion.div>
  );
}
