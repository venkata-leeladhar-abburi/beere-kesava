import React from "react";

// ─── Money visibility ─────────────────────────────────────────────────────────
// Some pages (Inventory chief among them) are shared verbatim between the admin
// and shop-staff portals. Shop staff must never see cost prices, sell amounts,
// GST, or invoice/payment totals — everywhere else in their portal this is
// already enforced via ShopStaffPortal's own ShopPriceContext; this is the same
// idea for pages reused as-is rather than rebuilt for the shop portal.
// Defaults to true so admin/superadmin/accountant are unaffected.
const MoneyAccessContext = React.createContext<boolean>(true);

export function MoneyAccessProvider({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  return (
    <MoneyAccessContext.Provider value={allowed}>
      {children}
    </MoneyAccessContext.Provider>
  );
}

/** True when the current portal is allowed to see monetary figures. */
export function useCanSeeMoney(): boolean {
  return React.useContext(MoneyAccessContext);
}

/** Renders its children only where money is visible. */
export function MoneyGate({ children }: { children: React.ReactNode }) {
  return useCanSeeMoney() ? <>{children}</> : null;
}
