import React from "react";
import { MapPin } from "lucide-react";
import { useBulkOrders, BulkOrder } from "@/features/bulk-orders";
import { DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { resolveOrderMoney } from "@/features/bulk-orders";
import { INVOICES } from "@/features/payments";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { OrderHistoryTab } from "./OrderHistoryTab";
import { OverviewTab } from "./OverviewTab";
import { PaymentHistoryTab } from "./PaymentHistoryTab";
import { ContactDetailsTab } from "./ContactDetailsTab";
import { EditProfileTab } from "./EditProfileTab";
import { Button } from "../../../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";

export interface WholesaleDetailSectionProps {
  customer: WholesaleCustomer;
  wholesaleTab: WholesaleTab;
  setWholesaleTab: (t: WholesaleTab) => void;
  onBack: () => void;
  onSave: (updated: WholesaleCustomer) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
  onViewCard: (url: string) => void;
  wholesaleOrderDateFilter: DateFilterState;
  setWholesaleOrderDateFilter: (f: DateFilterState) => void;
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}

export function WholesaleDetailSection({
  customer, wholesaleTab, setWholesaleTab, onBack, onSave, onViewBulkOrder, onViewCard,
  wholesaleOrderDateFilter, setWholesaleOrderDateFilter, wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: WholesaleDetailSectionProps) {
  const { bulkOrders } = useBulkOrders();

  // ── Bulk orders belonging to the open wholesale customer ───────────────────
  // Matched on customerId where the order carries one, else on business name.
  const custOrders = React.useMemo(() => {
    return bulkOrders.filter(o =>
      (o.customerId && o.customerId === customer.id) ||
      o.customer.toLowerCase() === String(customer.name).toLowerCase()
    );
  }, [bulkOrders, customer]);

  const custOrderMoney = React.useMemo(
    () => new Map(custOrders.map(o => [o.ref, resolveOrderMoney(o, INVOICES)])),
    [custOrders]
  );
  const custBilled = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const custPaid = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountPaid ?? 0), 0);
  const custOutstanding = Math.max(0, custBilled - custPaid);
  const custSareesOrdered = custOrders.reduce((a, o) => a + o.total, 0);
  const custSareesDone = custOrders.reduce((a, o) => a + o.done, 0);
  const custActiveOrders = custOrders.filter(o => o.done < o.total);

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "customers", label: "Customers", onClick: onBack },
            { key: "customer", label: customer.name },
          ]}
        />
      </div>
      {/* Header row with Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <Button onClick={onBack} variant="secondary" size="sm">
          ← Back to Customers
        </Button>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, background: customer.status === "clear" ? T.greenBg : T.crimsonBg, color: customer.status === "clear" ? T.greenMid : T.crimson, padding: "5px 12px", borderRadius: 6, fontWeight: 700 }}>
            {customer.status.toUpperCase()}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>
            {customer.id}
          </span>
        </div>
      </div>

      {/* Profile Header Card */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy}, #1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 32, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 700 }}>
              {customer.code}
            </div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, margin: 0 }}>{customer.name}</h2>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} color={T.antiqueGold} /> {customer.city}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Total Spend</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight, marginTop: 4 }}>{formatMoney(rupees(Number(customer.spend) || 0))}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Outstanding</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: customer.out === "0" ? T.greenMid : T.crimson, marginTop: 4 }}>{formatMoney(rupees(Number(customer.out) || 0))}</div>
          </div>
        </div>
      </div>

      {/* Sub-tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, marginBottom: 32, gap: 8 }}>
        {(["Overview", "Order History", "Payment History", "Contact Details", "Edit Profile"] as WholesaleTab[]).map(tabName => {
          const isActive = wholesaleTab === tabName;
          return (
            <Button
              key={tabName}
              onClick={() => setWholesaleTab(tabName)}
              variant="ghost"
              size="sm"
              className={`rounded-none ${isActive ? "font-semibold" : "font-medium"}`}
            >
              <span style={{ borderBottom: isActive ? `3px solid ${T.royalBurgundy}` : "3px solid transparent", color: isActive ? T.royalBurgundy : T.taupe, paddingBottom: 12, marginBottom: -12 }}>
                {tabName}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        {wholesaleTab === "Overview" && (
          <OverviewTab
            customer={customer}
            custOrders={custOrders}
            custOrderMoney={custOrderMoney}
            custOutstanding={custOutstanding}
            custSareesOrdered={custSareesOrdered}
            custSareesDone={custSareesDone}
            custActiveOrders={custActiveOrders}
            setWholesaleTab={setWholesaleTab}
            onViewBulkOrder={onViewBulkOrder}
          />
        )}

        {wholesaleTab === "Order History" && (
          <OrderHistoryTab
            custOrders={custOrders}
            custOrderMoney={custOrderMoney}
            wholesaleOrderDateFilter={wholesaleOrderDateFilter}
            setWholesaleOrderDateFilter={setWholesaleOrderDateFilter}
            onViewBulkOrder={onViewBulkOrder}
          />
        )}

        {wholesaleTab === "Payment History" && (
          <PaymentHistoryTab
            customerId={customer.id}
            wholesalePaymentDateFilter={wholesalePaymentDateFilter}
            setWholesalePaymentDateFilter={setWholesalePaymentDateFilter}
          />
        )}

        {wholesaleTab === "Contact Details" && (
          <ContactDetailsTab customer={customer} onViewCard={onViewCard} />
        )}

        {wholesaleTab === "Edit Profile" && (
          <EditProfileTab customer={customer} setWholesaleTab={setWholesaleTab} onSave={onSave} />
        )}
      </div>
    </div>
  );
}
