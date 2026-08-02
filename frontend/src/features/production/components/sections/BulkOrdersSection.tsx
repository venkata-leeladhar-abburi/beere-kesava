import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, CurrencyInr, ShoppingBag, Plus as PhPlus,
  CheckCircle, WarningCircle, Clock,
  Eye as PhEye,
} from "@phosphor-icons/react";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { BulkOrderCreateModal } from "../../../bulk-orders/components/BulkOrderCreateModal";
import { T, F } from "../theme";
import { ORDER_CFG, STATUS_LABELS } from "../data";
import type { BulkOrder } from "../types";
import { FadeUp } from "../common/primitives";

export function BulkOrderCard({ o, onView, onSlip, superadmin = false }: { o: BulkOrder; onView?: (o: BulkOrder) => void; onSlip?: (o: BulkOrder) => void; superadmin?: boolean }) {
  const cfg = ORDER_CFG[o.status];
  const pct = o.total > 0 ? Math.round((o.done / o.total) * 100) : 0;
  const remaining = o.total - o.done;
  const PhStatusIcon = cfg.PhIcon;
  // Tally state now lives on the order itself (BulkOrderContext) so it survives
  // navigating away to the full order page and back.
  const tallied = !!o.tallied;
  const talliedBy = o.talliedBy;

  return (
    <motion.div
      onClick={() => onView?.(o)}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", cursor: "pointer" }}
    >
      <div style={{ height: 5, background: cfg.strip, flexShrink: 0 }} />

      <div style={{ padding: "22px 22px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PhStatusIcon size={24} color={cfg.iconColor} weight="fill" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 4 }}>{o.customer}</div>
          <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, letterSpacing: "0.3px" }}>{o.ref}</div>
        </div>
      </div>

      <div style={{ margin: "0 22px 16px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: cfg.badgeBg, borderRadius: 10, padding: "9px 14px", width: "100%", boxSizing: "border-box" }}>
          <PhStatusIcon size={16} color={cfg.badgeColor} weight="fill" />
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: cfg.badgeColor }}>{STATUS_LABELS[o.status](o)}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 22px" }} />

      <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={20} color={T.royalBurgundy} weight="regular" />
          </div>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 3 }}>Delivery Deadline</div>
            <div style={{ fontFamily: F.ui, fontSize: 15.5, fontWeight: 700, color: T.luxuryBrown }}>{o.due}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.07)" }} />

        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{o.done}</span>
              <span style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, marginLeft: 6 }}>of {o.total} sarees done</span>
            </div>
            <span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: cfg.barColor }}>{pct}%</span>
          </div>
          <div style={{ height: 9, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ height: "100%", background: cfg.barColor, borderRadius: 99 }}
            />
          </div>
          {remaining > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{remaining} more sarees needed to complete</div>
          )}
        </div>

        {o.shortage && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 10, padding: "10px 13px" }}>
            <WarningCircle size={17} color={T.crimson} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.crimson }}>Shortage: {o.shortage} sarees</span>
          </div>
        )}
        {o.overdueBy && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 13px" }}>
            <Clock size={17} color={T.crimson} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.crimson }}>Overdue by {o.overdueBy} day{o.overdueBy === 1 ? "" : "s"}</span>
          </div>
        )}

        {(o.amountDue ?? 0) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(200,155,71,0.07)", borderRadius: 10, padding: "10px 13px", marginTop: "auto" }}>
            <CurrencyInr size={16} color={T.antiqueGold} weight="bold" />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px" }}>Est. Order Value</span>
            <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.antiqueGold, marginLeft: "auto" }}>₹{(o.amountDue ?? 0).toLocaleString("en-IN")}</span>
          </div>
        )}

        {superadmin && tallied && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 10, padding: "10px 13px", marginTop: "auto" }}>
            <CheckCircle size={16} color={T.green} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.green }}>Tallied by {talliedBy}</span>
          </div>
        )}

      </div>

      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 22px" }} />

      <div style={{ display: "flex", gap: 10, padding: "16px 22px 22px" }}>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onView?.(o); }}
          whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 12, padding: "12px 10px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          <PhEye size={18} weight="regular" /> View Order
        </motion.button>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onSlip?.(o); }}
          whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 12, padding: "12px 10px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          <CurrencyInr size={18} weight="regular" /> Payment
        </motion.button>
      </div>
    </motion.div>
  );
}

export function BulkOrdersSection({ onNavigate, superadmin = false, onOpenOrder }: { onNavigate?: (tab: string) => void; superadmin?: boolean; onOpenOrder: (order: BulkOrder, tab: "overview" | "payments") => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const { bulkOrders, addBulkOrder, nextOrderRef } = useBulkOrders();
  const atRiskCount = bulkOrders.filter(o => o.status === "at-risk" || o.status === "overdue").length;
  return (
    <div id="prod-bulk-orders" style={{ padding: "36px 48px 0" }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>

          <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingBag size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Bulk Orders — Production Progress</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Track wholesale customer orders and delivery deadlines</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <motion.button onClick={() => setShowCreate(true)} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: T.antiqueGold, color: T.luxuryBrown, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <PhPlus size={15} weight="bold" /> Add Bulk Order
              </motion.button>
              <motion.button onClick={() => onNavigate?.("AllOrders")} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.22)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                View All Orders <ArrowRight size={15} weight="bold" />
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {successRef && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ margin: "16px 28px 0", display: "flex", alignItems: "center", gap: 12, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderLeft: `4px solid ${T.green}`, borderRadius: 12, padding: "13px 18px" }}>
                <CheckCircle size={18} color={T.green} weight="fill" />
                <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.green, flex: 1 }}>
                  Bulk Order {successRef} created. Production teams have been notified.
                </span>
                <button onClick={() => setSuccessRef(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.green, padding: 0 }}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {atRiskCount > 0 && (
            <div style={{ margin: "20px 28px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 12, padding: "14px 18px" }}>
                <WarningCircle size={20} color={T.antiqueGold} weight="fill" />
                <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: "#8B6018" }}>{atRiskCount} bulk order{atRiskCount > 1 ? "s are" : " is"} at risk of missing their deadline. Check the orders below and take action.</span>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "20px 28px 28px", alignItems: "stretch" }}>
            {bulkOrders.map((o, i) => (
              <FadeUp key={o.ref} delay={i * 0.07} style={{ height: "100%" }}>
                <BulkOrderCard o={o} superadmin={superadmin} onView={(order) => onOpenOrder(order, "overview")} onSlip={(order) => onOpenOrder(order, "payments")} />
              </FadeUp>
            ))}
          </div>

        </div>
      </FadeUp>
      <BulkOrderCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        nextRef={nextOrderRef}
        onSubmit={(order) => { addBulkOrder(order); setSuccessRef(order.ref); setShowCreate(false); }}
        onAddCustomerClick={() => onNavigate?.("Customers")}
      />
    </div>
  );
}
