import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, IndianRupee as CurrencyInr, ShoppingBag, Plus as PhPlus,
  CheckCircle2 as CheckCircle, AlertCircle as WarningCircle, Clock,
  Eye as PhEye,
} from "lucide-react";
import { X as XIcon } from "lucide-react";
import { useBulkOrders } from "@/features/bulk-orders";
import { useFinishing } from "@/features/finishing";
import { computeBulkOrderProducedSareeIds } from "@/features/bulk-orders";
import { BulkOrderCreateModal } from "@/features/bulk-orders";
import { T, F } from "../theme";
import { ORDER_CFG, STATUS_LABELS } from "../data";
import type { BulkOrder } from "../types";
import { FadeUp } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

export function BulkOrderCard({ o, onView, onSlip, superadmin = false }: { o: BulkOrder; onView?: (o: BulkOrder) => void; onSlip?: (o: BulkOrder) => void; superadmin?: boolean }) {
  const cfg = ORDER_CFG[o.status];
  const { bulkOrders } = useBulkOrders();
  const { readySarees, returns, quotations } = useFinishing();
  // o.done is a manually-set DB column nothing keeps in sync with actual
  // production — it drifts to 0/stale even once sarees have genuinely passed
  // QC for this order. Derive the real count the same way the order detail
  // page's Sarees tab does, so this card and that tab can't disagree.
  const producedCount = computeBulkOrderProducedSareeIds(o.ref, bulkOrders, readySarees, returns, quotations).size;
  const pct = o.total > 0 ? Math.round((producedCount / o.total) * 100) : 0;
  const remaining = o.total - producedCount;
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

      <div style={{ padding: "12px 16px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <PhStatusIcon size={22} color={cfg.iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 4 }}>{o.customer}</div>
          <div><EntityCode type="order" value={o.ref} size="sm" /></div>
        </div>
      </div>

      <div style={{ margin: "0 16px 12px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: cfg.badgeBg, borderRadius: 10, padding: "8px 12px", width: "100%", boxSizing: "border-box" }}>
          <PhStatusIcon size={16} color={cfg.badgeColor} />
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.badgeColor }}>{STATUS_LABELS[o.status](o)}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 16px" }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={18} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 2 }}>Delivery Deadline</div>
            <div style={{ fontFamily: F.ui, fontSize: 14.5, fontWeight: 700, color: T.luxuryBrown }}>{o.due}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.07)" }} />

        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{producedCount}</span>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginLeft: 6 }}>of {o.total} sarees done</span>
            </div>
            <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: cfg.barColor }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ height: "100%", background: cfg.barColor, borderRadius: 99 }}
            />
          </div>
          {remaining > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{remaining} more sarees needed to complete</div>
          )}
        </div>

        {o.shortage && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 10, padding: "8px 12px" }}>
            <WarningCircle size={16} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>Shortage: {o.shortage} sarees</span>
          </div>
        )}
        {o.overdueBy && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "8px 12px" }}>
            <Clock size={16} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>Overdue by {o.overdueBy} day{o.overdueBy === 1 ? "" : "s"}</span>
          </div>
        )}

        {(o.amountDue ?? 0) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(200,155,71,0.07)", borderRadius: 10, padding: "8px 12px", marginTop: "auto" }}>
            <CurrencyInr size={15} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px" }}>Est. Order Value</span>
            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.antiqueGold, marginLeft: "auto" }}><Money value={rupees(o.amountDue ?? 0)} /></span>
          </div>
        )}

        {superadmin && tallied && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 10, padding: "8px 12px", marginTop: "auto" }}>
            <CheckCircle size={15} color={T.green} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.green }}>Tallied by {talliedBy}</span>
          </div>
        )}

      </div>

      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 16px" }} />

      <div className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 w-full flex-nowrap min-w-0">
        <Button
          onClick={(e) => { e.stopPropagation(); onView?.(o); }}
          variant="secondary"
          size="sm"
          className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center"
        >
          <PhEye size={15} /> View Order
        </Button>
        <Button
          onClick={(e) => { e.stopPropagation(); onSlip?.(o); }}
          variant="secondary"
          size="sm"
          className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center"
        >
          <CurrencyInr size={15} /> Payment
        </Button>
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
    <div id="prod-bulk-orders" className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>

          <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
            <div className="flex items-start gap-3.5 sm:gap-4 w-full">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <ShoppingBag size={26} color="#FFFDF9" />
              </div>
              <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>Bulk Orders — Production Progress</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>Track wholesale customer orders and delivery deadlines</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <Button onClick={() => setShowCreate(true)} variant="primary" size="sm" className="shrink-0 text-[12px] whitespace-nowrap">
                    <PhPlus size={14} /> Add Bulk Order
                  </Button>
                  <Button onClick={() => onNavigate?.("AllOrders")} variant="secondary" size="sm" className="shrink-0 text-[12px] whitespace-nowrap">
                    View All Orders <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {successRef && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ margin: "12px 14px 0", display: "flex", alignItems: "center", gap: 12, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderLeft: `4px solid ${T.green}`, borderRadius: 12, padding: "11px 14px" }}>
                <CheckCircle size={18} color={T.green} />
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green, flex: 1 }}>
                  Bulk Order {successRef} created. Production teams have been notified.
                </span>
                <IconButton onClick={() => setSuccessRef(null)} variant="ghost" size="sm" label="Dismiss" icon={XIcon} />
              </motion.div>
            )}
          </AnimatePresence>

          {atRiskCount > 0 && (
            <div style={{ margin: "12px 14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 12, padding: "10px 14px" }}>
                <WarningCircle size={18} color={T.antiqueGold} />
                <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: "#8B6018" }}>{atRiskCount} bulk order{atRiskCount > 1 ? "s are" : " is"} at risk of missing their deadline. Check the orders below and take action.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 p-2.5 sm:p-5 md:p-6 items-stretch">
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
