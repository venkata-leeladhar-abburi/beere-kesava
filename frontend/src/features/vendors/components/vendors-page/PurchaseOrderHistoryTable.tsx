import React from "react";
import { T, F } from "./theme";
import { MAT_TAG_PO } from "./data";

export function PurchaseOrderHistoryTable({ orders }: { orders: any[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: T.silkCream }}>{["PO Reference","Materials","Total Value","Receipt Details","Status"].map(h => <th key={h} style={{ padding: "12px 16px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>)}</tr></thead>
      <tbody>{orders.map((o, i) => <tr key={o.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{o.id}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{o.date}</div>
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {o.materials.map((m: any, mi: number) => {
               const mt = MAT_TAG_PO[m.type] || MAT_TAG_PO.Warp;
               return (
                 <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: mi < o.materials.length - 1 ? `1px solid ${T.borderDef}` : "none" }}>
                   <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 4, padding: "2px 6px", marginTop: 1 }}>{m.type}</span>
                   <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                     <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{m.description}</span>
                     {m.invoiceAmount && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice: <span style={{fontFamily: F.mono, fontWeight: 600}}>{m.invoiceAmount}</span></span>}
                   </div>
                   <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, marginTop: 1 }}>{m.qty}</span>
                 </div>
               );
            })}
          </div>
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top", fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: "#8B6018" }}>
          {o.totalAmount}
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          {o.grnId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{o.grnId}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{o.firmName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{o.receivedDate}</div>
            </div>
          ) : (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</div>
          )}
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: o.status === "Delivered" ? T.greenBg : T.silkCream, color: o.status === "Delivered" ? T.greenMid : T.taupe, padding: "3px 8px", borderRadius: 6 }}>{o.status}</span>
            {o.receiveStatus && (
               <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: o.receiveStatus === "Match" ? T.greenBg : "rgba(242,153,74,0.15)", color: o.receiveStatus === "Match" ? T.greenMid : "#E67E22", padding: "2px 6px", borderRadius: 4 }}>
                 {o.receiveStatus}
               </span>
            )}
          </div>
        </td>
      </tr>)}</tbody>
    </table>
  );
}
