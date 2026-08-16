import React from "react";
import { T, F } from "../../theme";
import { WholesaleCustomer } from "../../types";

export function ContactDetailsTab({ customer, onViewCard }: {
  customer: WholesaleCustomer;
  onViewCard: (url: string) => void;
}) {
  const hasBankDetails = customer.bankName || customer.accountNumber || customer.ifscCode;
  return (
    <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>
        <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Business Contact Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Owner / Main Contact</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 4 }}>{customer.contactName || "—"}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GSTIN Registration</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: T.royalBurgundy, marginTop: 4 }}>{customer.gstNumber || "Unregistered"}</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Phone Number</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown, marginTop: 4 }}>{customer.phone || "—"}</div>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Billing Address</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, marginTop: 4, lineHeight: 1.5 }}>
            {customer.address || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bank Wire Account</div>
          {hasBankDetails ? (
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, marginTop: 4 }}>
              {customer.bankName || "Bank not set"} · Account No. {customer.accountNumber || "—"} · IFSC: {customer.ifscCode || "—"}
            </div>
          ) : (
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic", marginTop: 4 }}>No bank details on file.</div>
          )}
        </div>
      </div>

      <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Visiting Card</h3>
        {customer.visitingCard ? (
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer" }} onClick={() => onViewCard(customer.visitingCard!)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => onViewCard(customer.visitingCard!))?.(); } }}>
            <img src={customer.visitingCard} alt="Visiting Card" style={{ width: "100%", height: 180, objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "#fff", fontFamily: F.ui, fontSize: 12, padding: "8px 12px", textAlign: "center", fontWeight: 600 }}>Click to Zoom Card</div>
          </div>
        ) : (
          <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe, fontFamily: F.ui, fontSize: 13, fontStyle: "italic", background: T.silkCream }}>
            No visiting card uploaded.
          </div>
        )}
      </div>
    </div>
  );
}
