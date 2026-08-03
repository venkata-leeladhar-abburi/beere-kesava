import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Star, X } from "lucide-react";
import { C, F, CUSTOMER_PURCHASES } from "../theme";
import type { ShopCustomer } from "./CustomersSection";

export function CustomerProfileDialog({
  customer, onClose, canSeePrices, isTablet,
}: {
  customer: ShopCustomer | null; onClose: () => void; canSeePrices: boolean; isTablet: boolean;
}) {
  return (
    <AnimatePresence>
      {customer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: isTablet ? "80vw" : 520, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" as const }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "32px 32px 28px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.burg, border: "3px solid rgba(196,146,58,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(107,26,42,0.40)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 28, fontWeight: 700, color: "#FFF" }}>{customer!.initials}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: "#FFF", lineHeight: 1.1 }}>{customer!.name}</div>
                    {customer!.regular && <Star size={18} fill={C.gold} color={C.gold} />}
                  </div>
                  <div style={{ fontFamily: F.m, fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{customer!.phone}</div>
                  {customer!.regular && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(196,146,58,0.20)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "3px 12px", marginTop: 8 }}><Star size={11} fill={C.gold} color={C.gold} /><span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold }}>Regular Customer</span></div>}
                </div>
                <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <X size={18} color="rgba(255,255,255,0.70)" />
                </button>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "28px 32px 32px", overflowY: "auto" as const }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Purchases", val: `${customer!.purchases}`, sub: "sarees bought", color: C.burg },
                  ...(canSeePrices ? [{ label: "Total Spent", val: customer!.total, sub: "lifetime value", color: C.gold }] : []),
                  { label: "Last Visit", val: customer!.last, sub: "most recent", color: C.text },
                ].map(s => (
                  <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 14px" }}>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.color, lineHeight: 1.2, marginBottom: 3 }}>{s.val}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Purchase History ({(CUSTOMER_PURCHASES[customer!.name] || []).length})
                </div>
                {(CUSTOMER_PURCHASES[customer!.name] || []).map((p, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid rgba(107,26,42,0.08)` : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(107,26,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingBag size={18} color={C.burg} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 3 }}>{p.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{p.design}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date} · {p.pay}</div>
                    </div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{p.amt}</div>}
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>Close</button>
                <button style={{ flex: 2, height: 50, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                  <ShoppingBag size={16} /> Record New Sale for {customer!.name.split(" ")[1] || customer!.name.split(" ")[0]}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
