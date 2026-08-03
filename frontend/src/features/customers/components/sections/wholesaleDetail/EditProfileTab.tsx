import React from "react";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";

export function EditProfileTab({ customer, setWholesaleTab, onSave }: {
  customer: WholesaleCustomer;
  setWholesaleTab: (t: WholesaleTab) => void;
  onSave: (updated: WholesaleCustomer) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Edit Customer Profile</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Business Name</label>
            <input type="text" defaultValue={customer.name} id="edit-biz-name" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Owner Name</label>
            <input type="text" defaultValue="Ramesh Rao" id="edit-owner-name" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>GST Number</label>
            <input type="text" defaultValue={customer.gstNumber || ""} id="edit-gst-number" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.mono, fontSize: 14 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>City</label>
            <input type="text" defaultValue={customer.city} id="edit-city" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Credit Terms</label>
            <select defaultValue={customer.terms} id="edit-terms" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14, backgroundColor: "#FFF" }}>
              <option>30 days</option>
              <option>45 days</option>
              <option>60 days</option>
              <option>90 days</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Outstanding Amount (₹)</label>
            <input type="text" defaultValue={customer.out} id="edit-out" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.mono, fontSize: 14 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderDef}` }}>
        <button onClick={() => setWholesaleTab("Overview")} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button
          onClick={() => {
            const name = (document.getElementById("edit-biz-name") as HTMLInputElement)?.value;
            const city = (document.getElementById("edit-city") as HTMLInputElement)?.value;
            const gst = (document.getElementById("edit-gst-number") as HTMLInputElement)?.value;
            const terms = (document.getElementById("edit-terms") as HTMLSelectElement)?.value;
            const out = (document.getElementById("edit-out") as HTMLInputElement)?.value;

            const updated = {
              ...customer,
              name, city, gstNumber: gst, terms, out,
              status: out === "0" ? "clear" : customer.status
            };

            onSave(updated);
            setWholesaleTab("Overview");
          }}
          style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          ✓ Save Changes
        </button>
      </div>
    </div>
  );
}
