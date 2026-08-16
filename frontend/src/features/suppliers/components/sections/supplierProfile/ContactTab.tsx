import React from "react";
import { Building2, Phone, FileText, IndianRupee, Clock, Package, MapPin, Landmark, MessageSquare, StickyNote } from "lucide-react";
import { T, F } from "../../theme";
import { Supplier } from "../../../contexts/SupplierContext";

export function ContactTab({ card, supplier }: { card: React.CSSProperties; supplier: Supplier }) {
  const hasBankDetails = supplier.bankName || supplier.accountNo || (supplier as any).ifscCode;
  
  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
      
      {/* Left Column: Details Cards */}
      <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Core Contact Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={20} color={T.royalBurgundy} /> Business Contact Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}>Owner / Contact</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, marginTop: 4 }}>{supplier.contactName || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} /> GSTIN</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: T.royalBurgundy, marginTop: 4 }}>{supplier.gstCode || "Unregistered"}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} /> Phone Number</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{supplier.phone || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={14} /> WhatsApp</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{supplier.whatsapp || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Payment Terms</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{supplier.terms || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}><Package size={14} /> Supplies</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, color: T.luxuryBrown, marginTop: 4 }}>{supplier.specialty || "—"}</div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontFamily: F.display, fontSize: 16, color: T.luxuryBrown, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={18} color={T.antiqueGold} /> Billing Address
          </h3>
          <div style={{ fontFamily: F.ui, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.6 }}>
            {supplier.address ? (
              <>
                {supplier.address}
                <br />
                {supplier.city}{supplier.city && supplier.state ? ", " : ""}{supplier.state}
              </>
            ) : "No address provided."}
          </div>
        </div>

        {/* Financials & Notes Container */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontFamily: F.display, fontSize: 16, color: T.luxuryBrown, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Landmark size={18} color={T.taupe} /> Bank Details
            </h3>
            {hasBankDetails ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bank:</span>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 500 }}>{supplier.bankName || "—"}</div>
                </div>
                <div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Account:</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{supplier.accountNo || "—"}</div>
                </div>
                <div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>IFSC:</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{(supplier as any).ifscCode || "—"}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>No bank details on file.</div>
            )}
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontFamily: F.display, fontSize: 16, color: T.luxuryBrown, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <StickyNote size={18} color={T.taupe} /> Special Instructions
            </h3>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.6 }}>
              {supplier.notes || "No special notes or instructions for this supplier."}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Visiting Card */}
      <div style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: "0 0 16px 0" }}>Visiting Card</h3>
          {supplier.visitingCard ? (
            <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", transition: "transform 0.2s ease" }} 
                 onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                 onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                 onClick={() => {
                   const el = document.createElement("a");
                   el.href = supplier.visitingCard!;
                   el.target = "_blank";
                   el.click();
                 }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.open(supplier.visitingCard!, "_blank"); } }}>
              <img src={supplier.visitingCard} alt="Visiting Card" style={{ width: "100%", height: 200, objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)", color: "#fff", fontFamily: F.ui, fontSize: 13, padding: "24px 16px 12px", textAlign: "center", fontWeight: 500 }}>
                Click to Expand
              </div>
            </div>
          ) : (
            <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", background: T.silkCream }}>
              No visiting card uploaded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
