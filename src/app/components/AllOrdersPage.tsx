import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Search, Filter, RotateCcw } from "lucide-react";
import { useBulkOrders } from "./BulkOrderContext";
import { BulkOrder, BulkOrderCard, OrderDialogContent, ProductionDialog } from "./ProductionPage";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#8B7060",
  borderDef: "rgba(110,15,45,0.10)",
  antiqueGold: "#C89B47",
  warmCream: "#F5E8D0",
  warmIvory: "#FFFDF9",
  green: "#1E6640",
  crimson: "#C0392B",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

export function AllOrdersPage({ onBack, superadmin = false }: { onBack?: () => void; superadmin?: boolean }) {
  const { bulkOrders } = useBulkOrders();
  const [dialog, setDialog] = useState<{ mode: "view" | "slip"; order: BulkOrder } | null>(null);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "on-track" | "at-risk" | "completed">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "partial" | "pending">("all");

  // Filtering logic
  const filteredOrders = bulkOrders.filter(o => {
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
        matchesStatus = o.status === "at-risk" || o.status === "delayed" || o.status === "overdue";
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
  };

  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      {/* Page Header */}
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "34px 48px", color: "#FFFDF9" }}>
        <button 
          onClick={onBack} 
          style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", marginBottom: 22, fontFamily: F.ui, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Production
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 32, fontWeight: 700 }}>All Bulk Orders</h1>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.68)", fontSize: 14 }}>Complete wholesale customer production order queue.</p>
          </div>
        </div>
      </div>

      {/* Filters and Categories Panel */}
      <div style={{ padding: "28px 48px 0" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "22px 24px", boxShadow: "0 4px 18px rgba(74,6,27,0.03)", display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Top row: search & reset */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by order ref, customer, saree type, or design..."
                style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 16, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {(search || statusFilter !== "all" || paymentFilter !== "all") && (
              <motion.button 
                onClick={resetFilters}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 16px", background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <RotateCcw size={14} /> Reset Filters
              </motion.button>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

          {/* Bottom row: Filter Categories */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            {/* Status Categories */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "all", label: "All Statuses" },
                  { key: "on-track", label: "On Track" },
                  { key: "at-risk", label: "At Risk / Delayed" },
                  { key: "completed", label: "Completed" }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key as any)}
                    style={{
                      fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                      background: statusFilter === item.key ? T.royalBurgundy : "transparent",
                      color: statusFilter === item.key ? "#FFFDF9" : T.taupe,
                      border: statusFilter === item.key ? "none" : `1px solid rgba(110,15,45,0.14)`,
                      transition: "all 0.15s"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Categories */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payments:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "all", label: "All Payments" },
                  { key: "paid", label: "Paid" },
                  { key: "partial", label: "Partial" },
                  { key: "pending", label: "Pending" }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setPaymentFilter(item.key as any)}
                    style={{
                      fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                      background: paymentFilter === item.key ? T.royalBurgundy : "transparent",
                      color: paymentFilter === item.key ? "#FFFDF9" : T.taupe,
                      border: paymentFilter === item.key ? "none" : `1px solid rgba(110,15,45,0.14)`,
                      transition: "all 0.15s"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grid count summary */}
      <div style={{ padding: "16px 48px 0", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>
        Showing <span style={{ fontWeight: 700, color: T.luxuryBrown }}>{filteredOrders.length}</span> of {bulkOrders.length} wholesale orders
      </div>

      {/* Orders Grid */}
      <div style={{ padding: "12px 48px 48px" }}>
        {filteredOrders.length === 0 ? (
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 18px rgba(74,6,27,0.03)" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>🔍</span>
            <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>No wholesale orders found</div>
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
                <BulkOrderCard o={o} superadmin={superadmin} onView={(order) => setDialog({ mode: "view", order })} onSlip={(order) => setDialog({ mode: "slip", order })} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {dialog && (
          <ProductionDialog open={!!dialog} title={dialog.mode === "view" ? "View order" : "Colour slip"} onClose={() => setDialog(null)}>
            <OrderDialogContent order={dialog.order} mode={dialog.mode} />
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
