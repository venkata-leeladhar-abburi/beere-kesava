import { useState } from "react";
import { useListDetailScroll } from "@/shared/ui/ScrollToTop";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { BulkOrder, BulkOrderCard } from "@/features/production";
import { BulkOrderDetailPage } from "./BulkOrderDetailPage";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { AllOrdersFilterBar } from "./AllOrdersFilterBar";
import { AllOrdersAnalyticsSection } from "./AllOrdersAnalyticsSection";
import { Button } from "../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../shared/ui/state";
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
  const { bulkOrders, isLoading, isError, error, refetch } = useBulkOrders();
  const [viewingOrder, setViewingOrder] = useState<{ order: BulkOrder; tab: "overview" | "payments" } | null>(null);
  const { openDetail, backToList } = useListDetailScroll();

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
        onBack={() => backToList(() => setViewingOrder(null))}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      {/* Page Header */}
      <div className="px-4 md:px-7 xl:px-12" style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", paddingTop: 40, paddingBottom: 40, color: "#FFFDF9", position: "relative", overflow: "hidden" }}>
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ marginBottom: 22 }}>
            <Button onClick={onBack} variant="tertiary" size="md" iconLeft={ArrowLeft}>
              Back to Production
            </Button>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 14 }}>
            Since 1999 · Wholesale Orders
          </div>
          <div className="flex items-start md:items-center flex-col md:flex-row" style={{ gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={26} color="#E7C983" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: F.display, fontWeight: 400, fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                All Bulk <span style={{ fontStyle: "italic", color: "#C89B47" }}>Orders</span>
              </h1>
              <p className="max-w-[520px]" style={{ margin: "8px 0 0", color: "rgba(245,232,208,0.72)", fontSize: 14, lineHeight: 1.6 }}>
                Complete wholesale customer production order queue.
              </p>
            </div>
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
        {isLoading ? (
          <LoadingState variant="skeleton" rows={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : filteredOrders.length === 0 ? (
          bulkOrders.length === 0 ? (
            <EmptyState title="No wholesale orders yet" description="Bulk orders raised for wholesale customers will show up here." />
          ) : (
            <FilteredEmptyState onClearFilters={resetFilters} />
          )
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {filteredOrders.map((o, i) => (
              <motion.div 
                key={o.ref} 
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.04 }}
              >
                <BulkOrderCard o={o} superadmin={superadmin} onView={(order) => openDetail(() => setViewingOrder({ order, tab: "overview" }))} onSlip={(order) => openDetail(() => setViewingOrder({ order, tab: "payments" }))} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
