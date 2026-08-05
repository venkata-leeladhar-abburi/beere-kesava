import React from "react";
import { Eye } from "lucide-react";
import { motion } from "motion/react";

import { F, T } from "../../theme";
import { WeaverRecord } from "../../types";
import { calcCharges, calcNet } from "../../utils/charges";
import { Pip, StatusBadge } from "../common/primitives";
import { Button, Checkbox } from "../../../../shared/ui/primitives";

// Weaver card (card view)
export function WeaverCard({ w, onViewDetails, selected, onToggleSelect }: { w: WeaverRecord, onViewDetails?: () => void, selected: boolean, onToggleSelect: () => void }) {
  const charges = calcCharges(w);
  const net = calcNet(w);
  const breakdown = [
    w.sb > 0 && `SB×${w.sb}`,
    w.hz > 0 && `HZ×${w.hz}`,
    w.ps > 0 && `PS×${w.ps}`,
    w.bs > 0 && `BS×${w.bs}`,
    w.st > 0 && `ST×${w.st}`,
  ].filter(Boolean).join(" · ");

  const paid = w.status === "Paid";
  const completedSarees = w.uploadedNoOfSarees !== undefined ? w.uploadedNoOfSarees : (w.sb + w.hz + w.ps + w.bs + w.st);

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 12px 28px rgba(59,35,20,0.12)" }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1px solid ${T.borderDef}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: paid ? T.green : T.antiqueGold }} />
      
      {/* Card header */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect()}
            className="mr-1"
          />
          <Pip initials={w.initials} bg={w.bg} size={42} />
          <div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.25 }}>{w.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "1px 5px", borderRadius: 4 }}>{w.id}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {w.village}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={w.status} />
      </div>

      {/* Body */}
      <div style={{ padding: "0 20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, borderBottom: `1px solid rgba(110,15,45,0.06)`, paddingBottom: 8 }}>
          Sarees completed: <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{completedSarees}</span>
          {w.uploadedBatchNo ? (
            <span style={{ color: T.royalBurgundy, display: "block", marginTop: 2, fontSize: 12, fontFamily: F.mono, fontWeight: 600 }}>
              Batch: {w.uploadedBatchNo} · Loom: {w.uploadedLoomNumber}
            </span>
          ) : (
            breakdown && <span style={{ color: T.taupe, display: "block", marginTop: 2, fontSize: 12 }}>({breakdown})</span>
          )}
        </div>

        {/* Financial Breakdown */}
        <div style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #FDFBF7 100%)", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: F.ui, color: T.taupe }}>
            <span>Gross Charges</span>
            <span style={{ fontFamily: F.mono, fontWeight: 600, color: T.luxuryBrown }}>₹{charges.toLocaleString("en-IN")}</span>
          </div>
          {((w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance) > 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: F.ui, color: T.crimson }}>
              <span>Deductions</span>
              <span style={{ fontFamily: F.mono, fontWeight: 600 }}>−₹{(w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance).toLocaleString("en-IN")}</span>
            </div>
          )}
          <div style={{ borderTop: `1.5px dashed ${T.borderDef}`, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Net Payable</span>
            <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: paid ? T.green : T.royalBurgundy }}>
              ₹{net.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ padding: "0 20px 20px", borderTop: `1px solid rgba(110,15,45,0.05)`, paddingTop: 14 }}>
        <Button variant="secondary" size="sm" fullWidth iconLeft={Eye} onClick={onViewDetails}>
          View Statement & History
        </Button>
      </div>
    </motion.div>
  );
}
