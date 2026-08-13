import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { BulkOrder, BulkOrderCard } from "../../production/components/ProductionPage";
import { BulkOrderDetailPage } from "./BulkOrderDetailPage";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { AllOrdersFilterBar } from "./AllOrdersFilterBar";
import { AllOrdersAnalyticsSection } from "./AllOrdersAnalyticsSection";
import { Button } from "../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif" };

export function AllOrdersPage({ onBack, superadmin = false }: { onBack?: () => void; superadmin?: boolean }) {
  const { bulkOrders } = useBulkOrders();
  const [viewingOrder, setViewingOrder] = useState<{ order: BulkOrder; tab: "overview" | "payments" } | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "on-track" | "at-risk" | "completed">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "partial" | "pending">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // Filtering logic
  const filteredOrders = bulkOrders.filter(o => {
    // Timeline filter — delivery deadline
    if (!matchesDateFilter(o.due, dateFilter)) return false;

    // Search filter
    const matchesSearch = 
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      (o.sareeType && o.sareeType.toLowerCase().includes(search.toLowerCase())) ||
      (o.design && o.design.toLowerCase().includes(search.toLowerCase()));

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "at-risk") {
        matchesStatus = o.status === "at-risk" || (o.status as string) === "delayed" || o.status === "overdue";
      } else {
        matchesStatus = o.status === statusFilter;
      }
    }

    // Payment filter
    let matchesPayment = true;
    if (paymentFilter !== "all") {
      matchesPayment = o.paymentStatus === paymentFilter;
    }

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  if (viewingOrder) {
    return (
      <BulkOrderDetailPage
        order={viewingOrder.order}
        initialTab={viewingOrder.tab}
        onBack={() => setViewingOrder(null)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      {/* Page Header */}
      <div className="px-4 md:px-7 xl:px-12" style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, paddingTop: 34, paddingBottom: 34, color: "#FFFDF9" }}>
        <div style={{ marginBottom: 22 }}>
          <Button onClick={onBack} variant="tertiary" size="md" iconLeft={ArrowLeft}>
            Back to Production
          </Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 30, fontWeight: 700 }}>All Bulk Orders</h1>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.68)", fontSize: 14 }}>Complete wholesale customer production order queue.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 16, background: T.silkCream }}>
        <Breadcrumbs
          items={[
            { key: "production", label: "Production", onClick: onBack },
            { key: "orders", label: "Orders", onClick: onBack },
            { key: "all-orders", label: "All Bulk Orders" },
          ]}
        />
      </div>

      {/* Filters and Categories Panel */}
      <AllOrdersFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        resetFilters={resetFilters}
      />

      {/* Order Analytics */}
      <AllOrdersAnalyticsSection
        filteredOrders={filteredOrders}
        dateFilter={dateFilter}
      />

      {/* Grid count summary */}
      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 24, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        Showing <span style={{ fontWeight: 700, color: T.luxuryBrown }}>{filteredOrders.length}</span> of {bulkOrders.length} wholesale orders
      </div>

      {/* Orders Grid */}
      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 12, paddingBottom: 48 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 18px rgba(74,6,27,0.03)" }}>
            <span style={{ fontSize: 30, display: "block", marginBottom: 12 }}>🔍</span>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>No wholesale orders found</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Try adjusting your filters or search keywords.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {filteredOrders.map((o, i) => (
              <motion.div 
                key={o.ref} 
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.04 }}
              >
                <BulkOrderCard o={o} superadmin={superadmin} onView={(order) => setViewingOrder({ order, tab: "overview" })} onSlip={(order) => setViewingOrder({ order, tab: "payments" })} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
