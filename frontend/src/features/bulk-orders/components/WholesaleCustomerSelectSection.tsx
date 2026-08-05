import React from "react";
import { Button, Field, Select, SelectItem } from "../../../shared/ui/primitives";

const T = {
  royalBurgundy: "#6E0F2D", darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47", luxuryBrown: "#3B2314",
  taupe: "#69635E", crimson: "#C0392B", warmIvory: "#FFFDF9",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

export interface WholesaleCustomer {
  id: string;
  name: string;
  city: string;
  terms: string;
  phone: string;
  address: string;
  gstCode: string;
}

export const WHOLESALE_CUSTOMERS: WholesaleCustomer[] = [
  { id: "WHL-001", name: "Lakshmi Silks", city: "Hyderabad", terms: "Net 30", phone: "+91 98450 11223", address: "G-12, Silk Plaza, Madhapur, Hyderabad - 500081", gstCode: "36AAAAA1111A1Z1" },
  { id: "WHL-002", name: "Narayana Silk Emporium", city: "Vijayawada", terms: "Net 45", phone: "+91 99123 44556", address: "40-1-5, MG Road, Vijayawada - 520010", gstCode: "37BBBBB2222B2Z2" },
  { id: "WHL-003", name: "Padmavathi Textiles", city: "Chennai", terms: "Net 30", phone: "+91 94440 99887", address: "82, Pondy Bazaar, T. Nagar, Chennai - 600017", gstCode: "33CCCCC3333C3Z3" },
  { id: "WHL-004", name: "Vijaya Silk House", city: "Bangalore", terms: "Net 60", phone: "+91 98800 55667", address: "144, Commercial Street, Bangalore - 560001", gstCode: "29DDDDD4444D4Z4" },
  { id: "WHL-005", name: "Meenakshi Silks", city: "Coimbatore", terms: "Net 30", phone: "+91 94250 88776", address: "12, Cross Cut Road, Gandhipuram, Coimbatore - 641012", gstCode: "33EEEEE5555E5Z5" },
  { id: "WHL-006", name: "Kalavathi Exports", city: "Surat", terms: "Net 45", phone: "+91 99790 33445", address: "Ring Road Textile Market, Surat - 395002", gstCode: "24FFFFF6666F6Z6" },
];

interface WholesaleCustomerSelectSectionProps {
  customerId: string;
  handleCustomerSelect: (id: string) => void;
  errors: Record<string, string>;
  selectedCustomer: WholesaleCustomer | undefined;
  onClose: () => void;
  onAddCustomerClick?: () => void;
}

export function WholesaleCustomerSelectSection({
  customerId,
  handleCustomerSelect,
  errors,
  selectedCustomer,
  onClose,
  onAddCustomerClick,
}: WholesaleCustomerSelectSectionProps) {
  const sectionLabel: React.CSSProperties = {
    fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe,
    textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16,
    paddingBottom: 8, borderBottom: `1px solid ${T.borderDef}`,
  };

  return (
    <div>
      <div style={sectionLabel}>1 · Wholesale Customer</div>
      <Field label="Select Wholesale Customer" error={errors.customerId} id="select-wholesale-customer">
        <Select
          value={customerId}
          onValueChange={handleCustomerSelect}
          placeholder="— Select customer —"
          invalid={!!errors.customerId}
        >
          {WHOLESALE_CUSTOMERS.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name} ({c.id}, {c.city})</SelectItem>
          ))}
        </Select>
      </Field>

      {selectedCustomer && (
        <div style={{ marginTop: 14, background: "linear-gradient(135deg, rgba(110,15,45,0.04) 0%, rgba(110,15,45,0.02) 100%)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.09)`, background: "rgba(110,15,45,0.06)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(110,15,45,0.25)" }}>
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 800, color: "#FFF" }}>{selectedCustomer.name.charAt(0)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, lineHeight: 1.2 }}>{selectedCustomer.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.10)", padding: "2px 8px", borderRadius: 5 }}>{selectedCustomer.id}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {selectedCustomer.city}</span>
              </div>
            </div>
            <div style={{ background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{selectedCustomer.terms}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)`, borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Phone</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.phone}</div>
            </div>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Payment Terms</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.terms}</div>
            </div>
            <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>GST Number</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px" }}>{selectedCustomer.gstCode}</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>City</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.city}</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)`, background: "rgba(247,242,234,0.5)" }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Address</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>{selectedCustomer.address}</div>
          </div>
        </div>
      )}

      <span style={{ display: "inline-block", marginTop: 12, color: T.antiqueGold }}>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            onClose();
            localStorage.setItem("bk_open_add_wholesale", "true");
            onAddCustomerClick?.();
          }}
        >
          ➕ Add New Customer
        </Button>
      </span>
    </div>
  );
}
