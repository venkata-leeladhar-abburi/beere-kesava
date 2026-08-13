import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { RetailCustomer } from "../types";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

interface RetailPurchaseRow {
  date: string;
  items: { id: string; type: string }[];
  price: number;
}

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
  const purchaseColumns: ColumnDef<RetailPurchaseRow>[] = [
    {
      id: "date", header: "Sale Date", accessor: r => r.date,
      cell: (_v, r) => <span style={{ color: T.taupe }}>{r.date}</span>,
    },
    {
      id: "items", header: "Sarees (ID & Type)", accessor: r => r.items, priority: 1,
      cell: (_v, r) => (
        <>
          {r.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{item.id}</span>
              <span style={{ color: T.luxuryBrown, fontSize: 12 }}>{item.type}</span>
            </div>
          ))}
        </>
      ),
    },
    {
      id: "price", header: "Price Paid", accessor: r => r.price,
      cell: (_v, r) => <span style={{ color: T.antiqueGold, fontWeight: 600 }}><Money value={rupees(r.price)} /></span>,
    },
    {
      id: "return", header: "Return", accessor: () => "—", priority: 3,
      cell: () => <span style={{ color: T.taupe }}>—</span>,
    },
  ];

  const retailPurchaseRows: RetailPurchaseRow[] = [
    { date: customer.lastVisit, items: [{ id: "RAVI-L2-008", type: "Heavy Zari" }], price: 14500 },
    { date: "12 Feb 2026", items: [{ id: "PADMA-L1-012", type: "Plain Silk" }, { id: "PADMA-L1-013", type: "Plain Silk" }], price: 44000 },
    { date: "08 Jan 2026", items: [{ id: "BKB-L3-004", type: "Self Brocade" }], price: 9800 },
    { date: "14 Dec 2025", items: [{ id: "SURESH-L2-007", type: "Bridal Special" }], price: 38500 },
    { date: "02 Nov 2025", items: [{ id: "RAVI-L2-003", type: "Heavy Zari" }], price: 16200 },
  ].filter(row => matchesDateFilter(row.date, retailPurchaseDateFilter));

  return (
    <div style={{ padding: "48px 56px" }}>
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
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.warmCream, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, flexShrink: 0 }}>{customer.initials}</div>
        <div>
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: "0 0 6px 0" }}>{customer.name}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, background: T.crimsonBg, padding: "4px 8px", borderRadius: 12 }}>Retail Customer</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: "#FFF", border: `1px solid ${T.borderDef}`, padding: "4px 8px", borderRadius: 12 }}>Since 2024</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, marginBottom: 28 }}>
        <div onClick={() => setRetailModalTab("history")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setRetailModalTab("history"))?.(); } }} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: retailModalTab === "history" ? 600 : 500, color: retailModalTab === "history" ? T.royalBurgundy : T.taupe, borderBottom: retailModalTab === "history" ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>Purchase History</div>
        <div onClick={() => setRetailModalTab("profile")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setRetailModalTab("profile"))?.(); } }} style={{ padding: "16px 24px", fontFamily: F.ui, fontSize: 14, fontWeight: retailModalTab === "profile" ? 600 : 500, color: retailModalTab === "profile" ? T.royalBurgundy : T.taupe, borderBottom: retailModalTab === "profile" ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>Profile Details</div>
      </div>

      {retailModalTab === "history" ? (
        <>
          {/* 4-stat summary strip */}
          <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginBottom: 28, background: T.silkCream, borderRadius: 14, padding: "20px 24px" }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Purchases</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{(customer as any).totalPurchases ?? customer.purchases ?? 0}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Spent</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{formatMoney(rupees((customer as any).totalSpend ?? parseInt(String(customer.spend || "0").replace(/,/g, ''), 10) ?? 0))}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Avg per Visit</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.taupe, marginTop: 4 }}>
                {formatMoney(rupees(Math.round(((customer as any).totalSpend ?? parseInt(String(customer.spend || "0").replace(/,/g, ''), 10) ?? 0) / Math.max((customer as any).totalPurchases ?? customer.purchases ?? 0, 1))))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Returns</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.crimson, marginTop: 4 }}>0</div>
            </div>
          </div>

          <DateFilterBar filter={retailPurchaseDateFilter} onChange={setRetailPurchaseDateFilter} />
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", fontFamily: F.ui, fontSize: 13 }}>
            <DataTable
              responsive
              columns={purchaseColumns}
              data={retailPurchaseRows}
              getRowId={r => r.date + r.items.map(i => i.id).join(",")}
              emptyTitle="No purchases in this period"
            />
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Phone Number</div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>+91 99887 76655</div>
            </div>
            <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>City / Location</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{customer.city || "Hyderabad, TG"}</div>
            </div>
          </div>
          <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Relationship Manager Notes</span>
              <Button variant="link" size="sm">Save</Button>
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
