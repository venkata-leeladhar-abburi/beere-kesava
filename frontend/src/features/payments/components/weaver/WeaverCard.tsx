import React from "react";
import { Eye } from "lucide-react";
import { motion } from "motion/react";

import { F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges, calcCompletedSarees, calcDeduction, calcNet, calcPaid } from "../../utils/charges";
import { Pip, StatusBadge } from "../common/primitives";
import { Button, Checkbox } from "../../../../shared/ui/primitives";
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

// Weaver card (card view)
export function WeaverCard({ w, onViewDetails, selected, onToggleSelect }: { w: WeaverRecord, onViewDetails?: () => void, selected: boolean, onToggleSelect: () => void }) {
  const charges = calcCharges(w);
  const deduction = calcDeduction(w);
  const amountPaid = calcPaid(w);
  const net = calcNet(w);
  const breakdown = [
    w.sb > 0 && `SB×${w.sb}`,
    w.hz > 0 && `HZ×${w.hz}`,
    w.ps > 0 && `PS×${w.ps}`,
    w.bs > 0 && `BS×${w.bs}`,
    w.st > 0 && `ST×${w.st}`,
  ].filter(Boolean).join(" · ");

  const isPaid = w.status === "Paid";
  const completedSarees = calcCompletedSarees(w);

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
      
      <div style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {/* Top Header Row: Checkbox + Weaver ID + Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0, maxWidth: "100%" }}>
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect()}
            />
            <EntityCode type="weaver" value={w.code} size="sm" className="break-all whitespace-normal max-w-full" />
          </div>
          <StatusBadge status={w.status} />
        </div>

        {/* Weaver Profile Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Pip initials={w.initials || w.name} bg={w.bg} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, letterSpacing: "-0.2px", marginBottom: 2 }}>
              {w.name}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              📍 {w.village || "—"}
            </div>
          </div>
        </div>

        {/* Loom & Production Details */}
        <div style={{ background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>Loom & Production</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>
              {completedSarees} Sarees
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
            <span style={{ color: T.taupe, fontFamily: F.ui }}>Loom No:</span>
            <EntityCode type="loom" value={w.uploadedLoomNumber ? `Loom-${w.uploadedLoomNumber}` : "Loom-1"} size="sm" />
            {w.uploadedBatchNo && (
              <>
                <span style={{ color: T.borderDef }}>•</span>
                <span style={{ color: T.taupe, fontFamily: F.ui }}>Batch:</span>
                <EntityCode type="batch" value={w.uploadedBatchNo} size="sm" />
              </>
            )}
          </div>

          {breakdown && (
            <div style={{ fontSize: 11, color: T.taupe, fontFamily: F.ui, borderTop: `1px dashed rgba(110,15,45,0.06)`, paddingTop: 6 }}>
              Types: <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>{breakdown}</span>
            </div>
          )}
        </div>

        {/* Financial Breakdown */}
        <div style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #FDFBF7 100%)", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: F.ui, color: T.taupe }}>
            <span>Gross Charges</span>
            <span style={{ fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(charges)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: F.ui, color: T.crimson }}>
            <span>Deductions</span>
            <span style={{ fontWeight: 600 }}>−<Money value={rupees(deduction)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: F.ui, color: T.green }}>
            <span>Amount Paid</span>
            <span style={{ fontWeight: 600 }}>−<Money value={rupees(amountPaid)} /></span>
          </div>
          <div style={{ borderTop: `1.5px dashed ${T.borderDef}`, paddingTop: 8, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Balance Payable</span>
            <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 800, color: isPaid ? T.green : T.royalBurgundy }}>
              {isPaid ? "Paid ✓" : <Money value={rupees(net)} />}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <BottomDivider />
      </div>

      {/* Action Footer - Equal-Width 2-Button Grid */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, width: "100%" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={Eye}
            onClick={onViewDetails}
            className="w-full justify-center rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D] text-[12px] font-bold py-2 whitespace-nowrap"
          >
            Statement
          </Button>
          {!isPaid ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onViewDetails}
              className="w-full justify-center rounded-[8px] bg-[#6E0F2D] hover:bg-[#4A0A1D] text-[12px] font-bold py-2 whitespace-nowrap"
            >
              Record Pay
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="w-full justify-center rounded-[8px] bg-[#27AE60]/10 text-[#27AE60] border-none text-[12px] font-bold py-2 whitespace-nowrap"
            >
              Paid ✓
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
