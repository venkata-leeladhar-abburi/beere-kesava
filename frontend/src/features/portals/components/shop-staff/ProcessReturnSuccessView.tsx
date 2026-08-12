import React from "react";
import { motion } from "motion/react";
import { RotateCcw, FileText, ChevronLeft, Check, QrCode, Printer } from "lucide-react";
import { C, F, Card, Btn } from "./theme";

interface RetailSuccessProps {
  resetReturn: () => void;
  onBack: () => void;
}

export function RetailReturnSuccessView({ resetReturn, onBack }: RetailSuccessProps) {
  return (
    <div style={{ padding: "44px 20px", textAlign: "center" as const }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(192,57,43,0.10)", border: `2px solid ${C.crim}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <RotateCcw size={36} color={C.crim} />
        </div>
      </motion.div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 8 }}>Return Processed</div>
      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20 }}>
        PADMA-L1-004 has been returned successfully.<br />Shop inventory updated. Customer profile updated.
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 14 }}>
        <FileText size={13} color={C.burg} /> RTN-2026-0041
      </div>
      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8 }}>Customer: Smt. Meenakshi · PADMA-L1-004</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 16 }}>
        <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.crim }} />
        <Btn label="Back to Home" icon={<ChevronLeft size={16} />} variant="ghost" onClick={onBack} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

interface WholesaleSuccessProps {
  wsNewId: string;
  wsVendor: string;
  wsDesign: string;
  wsColor: string;
  wsWeight: string;
  resetReturn: () => void;
}

export function WholesaleReturnSuccessView({
  wsNewId,
  wsVendor,
  wsDesign,
  wsColor,
  wsWeight,
  resetReturn,
}: WholesaleSuccessProps) {
  return (
    <div>
      <div style={{ padding: "44px 20px 20px", textAlign: "center" as const }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={38} color={C.green} />
          </div>
        </motion.div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 8 }}>Return Processed — Added to Inventory</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,155,71,0.12)", color: "#8B6520", borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 12, marginBottom: 20 }}>
          <QrCode size={13} color={C.gold} /> {wsNewId}
        </div>
      </div>
      <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(200,155,71,0.3))` }} />
        <div style={{ padding: 18 }}>
          <div style={{ background: "#111", borderRadius: 8, padding: "14px 10px", marginBottom: 16, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
              {[3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3].map((w, i) => (
                <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 40 : i % 2 === 0 ? 34 : 38, borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ fontFamily: F.m, fontSize: 12, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 14 }}>This saree has been added to shop inventory</div>
          {[
            ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
            ["Color", wsColor || "—"], ["Weight", wsWeight ? `${wsWeight}g` : "—"],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < 3 ? `1px solid ${C.bdr}` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
        <Btn label="Print Barcode Label" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
        <Btn label="Process Another Return" icon={<RotateCcw size={16} />} onClick={resetReturn} style={{ width: "100%", background: C.green }} />
      </div>
    </div>
  );
}
