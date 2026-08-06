import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Scissors, ShoppingBag, Store, Boxes } from "lucide-react";
import { T, F } from "../theme";
import { reportsApi } from "../../../../shared/api/reports";

// A small real-data strip pulling directly from GET /reports/production-summary
// and GET /reports/sales-summary — both backend endpoints exist but were
// otherwise unconsumed by the frontend. The rest of this page's report
// sections still run on richer mocked datasets; this is the honest live
// subset available today, not a replacement for them.
export function LiveSummarySnapshot() {
  const { data: production } = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
  });
  const { data: sales } = useQuery({
    queryKey: ["reports", "sales-summary"],
    queryFn: () => reportsApi.salesSummary(),
  });
  const { data: outstanding } = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
  });

  const cards = [
    {
      icon: <Scissors size={18} color={T.royalBurgundy} />,
      label: "Sarees Produced (Live)",
      value: production ? production.totalSareesProduced.toLocaleString("en-IN") : "—",
    },
    {
      icon: <Boxes size={18} color={T.green} />,
      label: "QC Passed / Semi / Defective",
      value: production
        ? `${production.qcByResult.PASSED} / ${production.qcByResult.SEMI} / ${production.qcByResult.DEFECTIVE}`
        : "—",
    },
    {
      icon: <Store size={18} color={T.antiqueGold} />,
      label: "Retail Sales (Live)",
      value: sales ? `₹${sales.retail.totalSales.toLocaleString("en-IN")} · ${sales.retail.count} sarees` : "—",
    },
    {
      icon: <ShoppingBag size={18} color={T.antiqueGold} />,
      label: "Wholesale Dispatched (Live)",
      value: sales ? `₹${sales.wholesale.totalSales.toLocaleString("en-IN")} · ${sales.wholesale.count} dispatches` : "—",
    },
    {
      icon: <ShoppingBag size={18} color={T.crimson} />,
      label: "Total Outstanding Dues (Live)",
      value: outstanding ? `₹${outstanding.totalOutstanding.toLocaleString("en-IN")} · ${outstanding.count} pending` : "—",
    },
  ];

  return (
    <div style={{ padding: "0 48px", marginTop: 20 }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14,
        background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "16px 20px",
        boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
      }}>
        {cards.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{c.label}</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

