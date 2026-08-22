import React, { useContext, useMemo } from "react";
import { CustomersContext } from "@/features/customers";
import { Button, Field, Select, SelectItem } from "../../../shared/ui/primitives";

const T = {
  royalBurgundy: "#6E0F2D", darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47", luxuryBrown: "#3B2314",
  taupe: "#69635E", crimson: "#C0392B", warmIvory: "#FFFDF9",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

export interface WholesaleCustomer {
  /** Customer.id (UUID) — the FK stored on the order, never shown to staff. */
  id: string;
  /** Human-facing customer ID (e.g. "WHL-001"). This is what the UI displays. */
  code: string;
  name: string;
  city: string;
  terms: string;
  phone: string;
  address: string;
  gstCode: string;
}

export function useAllWholesaleCustomers(): WholesaleCustomer[] {
  const ctx = useContext(CustomersContext);

  return useMemo(() => {
    const backendWholesale = ctx?.wholesaleCustomers ?? [];
    return backendWholesale.map(c => ({
      id: c.id,
      // Customers created before codes were generated have none — fall back to
      // a dash rather than leaking the UUID into the label.
      code: c.code || "—",
      name: c.name,
      city: c.city || "—",
      terms: "Net 30",
      phone: c.phone || "—",
      address: c.address || "—",
      gstCode: c.gstCode || "—",
    }));
  }, [ctx?.wholesaleCustomers]);
}

interface WholesaleCustomerSelectSectionProps {
  customerId: string;
  handleCustomerSelect: (id: string) => void;
  errors: Record<string, string>;
  selectedCustomer: WholesaleCustomer | undefined;
  onClose: () => void;
  onAddCustomerClick?: () => void;
  wholesaleCustomersList?: WholesaleCustomer[];
}

export function WholesaleCustomerSelectSection({
  customerId,
  handleCustomerSelect,
  errors,
  selectedCustomer,
  onClose,
  onAddCustomerClick,
  wholesaleCustomersList,
}: WholesaleCustomerSelectSectionProps) {
  const hookCustomers = useAllWholesaleCustomers();
  const customersList = wholesaleCustomersList || hookCustomers;

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.taupe,
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
          {customersList.map(c => (
            // Value stays the UUID (it's the FK the order is saved against);
            // only the label switches to the readable code.
            <SelectItem key={c.id} value={c.id}>{c.name} ({c.code}, {c.city})</SelectItem>
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
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.10)", padding: "2px 8px", borderRadius: 5 }}>{selectedCustomer.code}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {selectedCustomer.city}</span>
              </div>
            </div>
            <div style={{ background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{selectedCustomer.terms}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 0 }}>
            <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)`, borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Phone</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.phone}</div>
            </div>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Payment Terms</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.terms}</div>
            </div>
            <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>GST Number</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px" }}>{selectedCustomer.gstCode}</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>City</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{selectedCustomer.city}</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)`, background: "rgba(247,242,234,0.5)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Address</div>
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
