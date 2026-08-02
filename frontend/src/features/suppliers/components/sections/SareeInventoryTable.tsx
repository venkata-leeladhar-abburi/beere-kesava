// Flat saree inventory table, used inside the Overview tab and inside each
// expanded purchase row of the Order History tab.

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Image as ImageIcon } from "lucide-react";
import { T, F } from "../theme";
import { SareeTag, formatINR } from "../../contexts/SupplierContext";

export function SareeInventoryTable({ rows }: { rows: (SareeTag & { purchaseId: string; invoiceNumber: string })[] }) {
  const [preview, setPreview] = useState<string | null>(null);

  if (rows.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees match this filter.</div>;
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: T.silkCream }}>
              {["Photo", "Saree ID", "Serial No.", "Purchase Order", "Quantity", "Type", "Colour", "Weight", "Purchase Date", "Buying Price", "Sell %", "Selling Price", "Profit"].map(h => (
                <th key={h} style={{ padding: "11px 14px", fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={`${s.purchaseId}-${s.id}-${i}`} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.45)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.id} onClick={() => setPreview(s.imageUrl!)}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", cursor: "pointer", border: `1px solid ${T.borderDef}` }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={14} color={T.taupe} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, color: T.royalBurgundy }}>{s.id}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.luxuryBrown }}>{s.id.includes("-INV-") ? s.id.split("-")[1] : "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{s.purchaseId}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{s.quantity} pcs</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{s.sareeType || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{s.color || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.weight || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.date}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{formatINR(s.price)}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.sellPercent}%</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{formatINR(s.finalAmount)}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.green }}>{formatINR((s.finalAmount - s.price) * s.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {preview && (
          <div onClick={() => setPreview(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(20,8,14,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={preview} alt="Saree" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
