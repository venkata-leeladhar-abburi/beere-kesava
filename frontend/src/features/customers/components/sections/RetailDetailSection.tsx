import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { RetailCustomer } from "../types";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { salesApi } from "../../../../shared/api/sales";
import { useRatesPricing } from "../../../pricing/contexts/RatesContext";

interface RetailPurchaseRow {
  date: string;
  items: { id: string; type: string }[];
  price: number;
  returned: boolean;
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
      id: "return", header: "Return", accessor: r => r.returned, priority: 3,
      cell: (_v, r) => r.returned
        ? <span style={{ color: T.crimson, fontWeight: 600 }}>Returned</span>
        : <span style={{ color: T.taupe }}>—</span>,
    },
  ];

  const { getSareeTypeByCode } = useRatesPricing();

  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-retail-detail"],
    queryFn: () => salesApi.list(200),
  });
  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-retail-detail"],
    queryFn: () => salesApi.listReturns(200),
  });

  // ReturnRecord has no saleRef FK — a saree only has one active sale at a
  // time, so sareeId is the closest usable link back to "was this returned".
  const returnedSareeIds = useMemo(
    () => new Set((returnsRes?.items ?? []).map(r => r.sareeId)),
    [returnsRes],
  );

  const customerSales = useMemo(
    () => (salesRes?.items ?? []).filter(s => s.channel === "RETAIL" && s.customerId === customer.id),
    [salesRes, customer.id],
  );

  const retailPurchaseRows: RetailPurchaseRow[] = useMemo(() => customerSales
    .map(s => {
      const typeCode = s.saree?.sareeTypeCode;
      const typeLabel = typeCode ? (getSareeTypeByCode(typeCode)?.type ?? typeCode) : (s.saree?.designCode ?? "—");
      return {
        date: new Date(s.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        items: [{ id: s.sareeId, type: typeLabel }],
        price: Number(s.amount),
        returned: returnedSareeIds.has(s.sareeId),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(row => matchesDateFilter(row.date, retailPurchaseDateFilter)),
  [customerSales, returnedSareeIds, getSareeTypeByCode, retailPurchaseDateFilter]);

  const totalPurchases = retailPurchaseRows.length;
  const totalSpent = retailPurchaseRows.reduce((sum, r) => sum + r.price, 0);
  const avgPerVisit = totalPurchases > 0 ? Math.round(totalSpent / totalPurchases) : 0;
  const totalReturns = retailPurchaseRows.filter(r => r.returned).length;

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
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{totalPurchases}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Spent</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{formatMoney(rupees(totalSpent))}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Avg per Visit</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.taupe, marginTop: 4 }}>
                {formatMoney(rupees(avgPerVisit))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Returns</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.crimson, marginTop: 4 }}>{totalReturns}</div>
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
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{customer.phone && customer.phone !== "—" ? `+91 ${customer.phone}` : "—"}</div>
            </div>
            <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>City / Location</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{customer.city || "—"}</div>
            </div>
          </div>
          <div style={{ background: T.silkCream, padding: 20, borderRadius: 12 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Relationship Manager Notes</span>
              <Button variant="link" size="sm">Save</Button>
            </div>
            {/* No backend field for CRM notes yet — left blank rather than a fabricated default. */}
            <textarea
              placeholder="Add notes about this customer's preferences..."
              style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FFF", resize: "vertical", outline: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
