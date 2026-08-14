import React from "react";
import { T, F, ExtItem } from "./POTypesAndVendors";

interface PODocPreviewProps {
  vendor: string;
  vendorCity: string;
  vendorContact?: string;
  firmName?: string;
  deliveryDate: string;
  materials: ExtItem[];
  poNumber: string;
  notesVendor?: string;
  urgency: string;
  today: string;
}

export function PODocPreview({
  vendor,
  vendorCity,
  vendorContact,
  firmName,
  deliveryDate,
  materials,
  poNumber,
  notesVendor,
  urgency,
  today,
}: PODocPreviewProps) {
  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 12,
      border: `1.5px solid ${T.borderDef}`,
      overflow: "hidden",
      fontSize: 12,
      fontFamily: F.ui,
    }}>
      {/* Header strip */}
      <div style={{
        background: T.darkBurgundy,
        padding: "14px 18px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: "#FFFDF9", marginBottom: 2 }}>
          🪷 Beere Kesava &amp; Brothers Silks
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, letterSpacing: "2px" }}>Est. 1999</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>
          Guntur, Andhra Pradesh · India
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Reference row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${T.borderDef}` }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>
            Purchase Order No: {poNumber || "PO-2026-—"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>Date: {today}</span>
        </div>

        {/* Purchasing Firm */}
        {firmName && (
          <div style={{ marginBottom: 10, background: "rgba(200,155,71,0.07)", border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 2 }}>Purchasing Firm:</div>
            <div style={{ fontFamily: F.display, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{firmName}</div>
          </div>
        )}

        {/* Vendor block */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 2 }}>Vendor:</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
            {vendor || "—"}
          </div>
          {(vendorCity || vendorContact) && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              {[vendorCity, vendorContact].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>

        {/* Delivery */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>Expected Delivery: </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown }}>{deliveryDate || "—"}</span>
          {urgency === "Urgent" && (
            <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 7px", borderRadius: 4 }}>
              🔴 URGENT
            </span>
          )}
        </div>

        {/* Materials table */}
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 0.7fr 0.7fr", background: T.silkCream, padding: "7px 10px", gap: 6 }}>
            {["Material", "Description", "Qty / Unit", "Amount"].map(h => (
              <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>
          {materials.length === 0 ? (
            <div style={{ padding: "10px 12px", fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>No materials added yet</div>
          ) : materials.map((m, i) => (
            <div key={m._key} style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 0.7fr 0.7fr", padding: "8px 10px", gap: 6, background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory, borderTop: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{m.materialType}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, wordBreak: "break-word" }}>{m.description || "—"}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{m.quantity || 0} {m.unit}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>
                {m.pricePerUnit > 0 ? `INR ${((m.pricePerUnit || 0) * (m.quantity || 0)).toLocaleString("en-IN")}` : "—"}
              </span>
            </div>
          ))}
          {materials.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderTop: `1px solid ${T.borderDef}`, background: T.silkCream }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>
                INR {materials.reduce((sum, m) => sum + (m.pricePerUnit || 0) * (m.quantity || 0), 0).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {notesVendor && (
          <div style={{ marginBottom: 10, background: T.silkCream, borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 3 }}>Instructions:</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{notesVendor}</div>
          </div>
        )}

        {/* Signature block */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginTop: 12 }}>
          {["Prepared by", "Approved by"].map(s => (
            <div key={s}>
              <div style={{ height: 24, borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 5 }} />
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s}: _____________</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{s === "Prepared by" ? "Admin" : "Superadmin"}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 14, paddingTop: 10, borderTop: `1px solid ${T.borderDef}` }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Beere Kesava &amp; Brothers Silks · Est. 1999</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, marginTop: 2, letterSpacing: "1px" }}>Tradition · Trust · Timeless Quality</div>
        </div>
      </div>
    </div>
  );
}
