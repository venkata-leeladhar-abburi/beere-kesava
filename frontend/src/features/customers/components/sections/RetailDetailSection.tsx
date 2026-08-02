import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { RetailCustomer } from "../types";

export interface RetailDetailSectionProps {
  customer: RetailCustomer;
  retailModalTab: "history" | "profile";
  setRetailModalTab: (t: "history" | "profile") => void;
  onBack: () => void;
  retailPurchaseDateFilter: DateFilterState;
  setRetailPurchaseDateFilter: (f: DateFilterState) => void;
}

// ── Retail customer detail (Purchase History / Profile) ─────────────────────
export function RetailDetailSection({
  customer, retailModalTab, setRetailModalTab, onBack, retailPurchaseDateFilter, setRetailPurchaseDateFilter,
}: RetailDetailSectionProps) {
  return (
    <div style={{ padding: "48px 56px" }}>
      {/* Header row with Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          ← Back to Customers
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.warmCream, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, flexShrink: 0 }}>{customer.initials}</div>
        <div>
          <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: "0 0 6px 0" }}>{customer.name}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.royalBurgundy, background: T.crimsonBg, padding: "4px 8px", borderRadius: 12 }}>Retail Customer</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: "#FFF", border: `1px solid ${T.borderDef}`, padding: "4px 8px", borderRadius: 12 }}>Since 2024</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, marginBottom: 28 }}>
        <div onClick={() => setRetailModalTab("history")} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: retailModalTab === "history" ? 600 : 500, color: retailModalTab === "history" ? T.royalBurgundy : T.taupe, borderBottom: retailModalTab === "history" ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>Purchase History</div>
        <div onClick={() => setRetailModalTab("profile")} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: retailModalTab === "profile" ? 600 : 500, color: retailModalTab === "profile" ? T.royalBurgundy : T.taupe, borderBottom: retailModalTab === "profile" ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>Profile Details</div>
      </div>

      {retailModalTab === "history" ? (
        <>
          {/* 4-stat summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28, background: T.silkCream, borderRadius: 14, padding: "20px 24px" }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Purchases</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{customer.purchases}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Spent</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>₹{customer.spend}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Avg per Visit</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.taupe, marginTop: 4 }}>
                ₹{Math.round(parseInt(customer.spend.replace(/,/g, '')) / Math.max(customer.purchases, 1)).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Total Returns</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.crimson, marginTop: 4 }}>0</div>
            </div>
          </div>

          <DateFilterBar filter={retailPurchaseDateFilter} onChange={setRetailPurchaseDateFilter} />
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                  {["Sale Date", "Sarees (ID & Type)", "Price Paid", "Return"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: T.taupe, fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: customer.lastVisit, items: [{id: "RAVI-L2-008", type: "Heavy Zari"}], price: "₹14,500" },
                  { date: "12 Feb 2026",         items: [{id: "PADMA-L1-012", type: "Plain Silk"}, {id: "PADMA-L1-013", type: "Plain Silk"}], price: "₹44,000" },
                  { date: "08 Jan 2026",         items: [{id: "BKB-L3-004", type: "Self Brocade"}], price: "₹9,800" },
                  { date: "14 Dec 2025",         items: [{id: "SURESH-L2-007", type: "Bridal Special"}], price: "₹38,500" },
                  { date: "02 Nov 2025",         items: [{id: "RAVI-L2-003", type: "Heavy Zari"}], price: "₹16,200" },
                ].filter(row => matchesDateFilter(row.date, retailPurchaseDateFilter)).map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 14px", color: T.taupe }}>{row.date}</td>
                    <td style={{ padding: "14px 14px" }}>
                      {row.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{item.id}</span>
                          <span style={{ color: T.luxuryBrown, fontSize: 12.5 }}>{item.type}</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "14px 14px", color: T.antiqueGold, fontWeight: 600 }}>{row.price}</td>
                    <td style={{ padding: "14px 14px", color: T.taupe }}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Phone Number</div>
              <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>+91 99887 76655</div>
            </div>
            <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>City / Location</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>{customer.city || "Hyderabad, TG"}</div>
            </div>
          </div>
          <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Relationship Manager Notes</span>
              <button style={{ background: "transparent", border: "none", color: T.royalBurgundy, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Save</button>
            </div>
            <textarea
              defaultValue="Prefers deep burgundy and gold heavy zari borders. Usually visits during festive/wedding seasons. Add to priority lists for exclusive product drops."
              style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FFF", resize: "vertical", outline: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
