// Contact Details tab of the supplier profile.

import React from "react";
import { Building2, Phone, FileText, IndianRupee, Clock, Package } from "lucide-react";
import { T, F } from "../../theme";
import { Supplier } from "../../../contexts/SupplierContext";

export function ContactTab({ card, supplier }: { card: React.CSSProperties; supplier: Supplier }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
      {[
        { label: "Contact Person", value: supplier.contactName, Icon: Building2 },
        { label: "Phone",          value: supplier.phone, Icon: Phone },
        { label: "WhatsApp",       value: supplier.whatsapp || "—", Icon: Phone },
        { label: "GST Number",     value: supplier.gstCode || "—", Icon: FileText },
        { label: "Bank Name",      value: supplier.bankName || "—", Icon: IndianRupee },
        { label: "Account Number", value: supplier.accountNo || "—", Icon: IndianRupee },
        { label: "Payment Terms",  value: supplier.terms, Icon: Clock },
        { label: "Supplies",       value: supplier.specialty, Icon: Package },
      ].map(f => (
        <div key={f.label} style={{ ...card, padding: "20px 22px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>{f.label}</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}><f.Icon size={14} color={T.royalBurgundy} /> {f.value}</div>
        </div>
      ))}
      <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Address</div>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{supplier.address || "—"}</div>
      </div>
      {supplier.notes && (
        <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Notes</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{supplier.notes}</div>
        </div>
      )}
      {supplier.visitingCard && (
        <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>Visiting Card</div>
          <img src={supplier.visitingCard} alt="Visiting card" style={{ maxWidth: 380, width: "100%", borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
        </div>
      )}
    </div>
  );
}
