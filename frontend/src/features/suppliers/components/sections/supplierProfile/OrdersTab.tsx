// Order History tab of the supplier profile.

import React from "react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { Purchase, parseINR } from "../../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { PurchaseHistoryTable } from "../PurchaseHistoryTable";

export function OrdersTab({
  card, orderFilter, setOrderFilter, filteredOrders,
}: {
  card: React.CSSProperties;
  orderFilter: DateFilterState;
  setOrderFilter: (f: DateFilterState) => void;
  filteredOrders: Purchase[];
}) {
  return (
    <div style={card}>
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Full Purchase History</div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 12px", borderRadius: 8 }}>
              {filteredOrders.length} purchase{filteredOrders.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.13)", padding: "6px 12px", borderRadius: 8 }}>
              {formatMoney(rupees(filteredOrders.reduce((sum, p) => sum + parseINR(p.billAmount), 0)))}
            </span>
          </div>
        </div>
        <DateFilterBar filter={orderFilter} onChange={setOrderFilter} />
      </div>
      <PurchaseHistoryTable purchases={filteredOrders} />
    </div>
  );
}
