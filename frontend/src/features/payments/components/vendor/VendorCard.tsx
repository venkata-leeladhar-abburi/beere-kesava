import React from "react";
import { FileText, Pencil, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { PurchaseOrder } from "@/features/purchasing";
import { F, T } from "../../theme";
import { VendorPayment } from "../../types";
import { VENDOR_STATUS_CFG, VendorBadge } from "./VendorBadge";
import { Button } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

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

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "—";
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }
  return dateStr;
}

export function VendorCard({ vp, matchedPO, onPay, onView, onViewPO, onAddInvoice, selected }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onPay: (id: string) => void; onView?: () => void; onViewPO?: () => void; onAddInvoice?: () => void; selected: boolean }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const isPaid = vp.status === "Paid";
  const cfg = VENDOR_STATUS_CFG[vp.status];
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  const MAT_TAG_PO: Record<string, { col: string; bg: string }> = {
    "Warp": { col: "#B85C38", bg: "rgba(184,92,56,0.12)" },
    "Resham": { col: "#4A7059", bg: "rgba(74,112,89,0.12)" },
    "Jari": { col: "#C19A5B", bg: "rgba(193,154,91,0.15)" },
  };

  const actions = [
    matchedPO && onViewPO && {
      key: "po",
      label: "View PO",
      variant: "po" as const,
      onClick: onViewPO,
    },
    onView && {
      key: "stmt",
      label: "Statement",
      variant: "secondary" as const,
      onClick: onView,
    },
    onAddInvoice && {
      key: "inv",
      label: vp.billId ? "Edit Invoice" : "Add Invoice",
      icon: vp.billId ? Pencil : FileText,
      variant: "secondary" as const,
      onClick: onAddInvoice,
    },
    !isPaid && {
      key: "pay",
      label: "Pay Now",
      variant: "primary" as const,
      onClick: () => onPay(vp.id),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon?: LucideIcon;
    variant: "po" | "secondary" | "primary";
    onClick: () => void;
  }>;

  return (
    <motion.div
      transition={{ duration: 0.25 }}
      style={{
        background: "#FFFDF9",
        borderRadius: 12,
        border: `1.5px solid ${T.antiqueGold}`,
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: T.royalBurgundy, width: "100%", opacity: 0.8 }} />

      <div style={{ padding: "16px 20px 0" }}>
        <TopDivider />
      </div>

      <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Top row: PO number + Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" onClick={onViewPO} disabled={!onViewPO} style={{ background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8, cursor: onViewPO ? "pointer" : "default", border: "none", maxWidth: "100%" }}>
            <EntityCode type="purchaseOrder" value={vp.poNumber} size="sm" className="break-all whitespace-normal max-w-full" />
          </button>
          <span style={{ fontSize: 12, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8, fontVariantNumeric: "tabular-nums" }}>
            {formatDisplayDate(vp.dueDate)}
          </span>
        </div>

        {/* Vendor Details */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, letterSpacing: "-0.2px", marginBottom: 4 }}>
            {vendorName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            <span>{matchedPO?.vendorCity ?? "—"}</span>
            {matchedPO?.firmName && (
              <>
                <span style={{ color: T.borderDef }}>•</span>
                <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{matchedPO.firmName}</span>
              </>
            )}
          </div>
        </div>

        {/* Materials Grid */}
        {matchedPO && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Materials Requested</div>
            {matchedPO.materials.map((m, mi) => {
              const mt = MAT_TAG_PO[m.materialType] || MAT_TAG_PO.Warp;
              const materialKey = `${m.materialType}-${m.subtype ?? "none"}-${mi}`;
              return (
                <div key={materialKey} style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: mi < matchedPO.materials.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", paddingBottom: mi < matchedPO.materials.length - 1 ? 12 : 0, paddingTop: mi > 0 ? 8 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 6, padding: "2px 8px", minWidth: 50, textAlign: "center", flexShrink: 0 }}>
                      {m.materialType}
                    </span>
                    {m.subtype && (
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subtype}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }} />
                    <span style={{ fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap" as const, fontVariantNumeric: "tabular-nums" }}>
                      {m.quantity} {m.unit}
                      {m.pricePerUnit > 0 && <> · <Money value={rupees(m.pricePerUnit)} />/{m.unit}</>}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.invoiceAmount ? "#8B6018" : T.taupe }}>
                      {m.invoiceAmount ? <Money value={rupees(m.invoiceAmount)} /> : "Not yet invoiced"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Financials (Replaces Invoice amount inputs from Image 2) */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(vp.invoiceAmt)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Paid</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}><Money value={rupees(vp.paidAmt)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px dashed ${T.borderDef}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Balance</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: isPaid ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
              {isPaid ? "Fully Paid ✓" : <Money value={rupees(balance)} />}
            </span>
          </div>
        </div>

        <div style={{ padding: "10px 0 0" }}>
          <BottomDivider />
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-col gap-2.5 flex-shrink-0 w-full" style={{ padding: "0 20px 20px" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">Status & Actions</span>
          <VendorBadge status={vp.status} />
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          {actions.map(act => (
            <Button
              key={act.key}
              variant={act.variant === "po" ? "secondary" : act.variant}
              size="sm"
              iconLeft={act.icon}
              onClick={act.onClick}
              className={`flex-1 min-w-[120px] justify-center rounded-[8px] text-[12px] font-bold py-2 whitespace-nowrap ${
                act.variant === "po"
                  ? "border-[1.5px] border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#C89B47]"
                  : act.variant === "primary"
                  ? selected ? "bg-[#4A0A1D]" : "bg-[#6E0F2D]"
                  : "border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]"
              }`}
            >
              {act.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
