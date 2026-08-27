import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShoppingBag, Star, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { C, F } from "../theme";
import type { ShopCustomer } from "./CustomersSection";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { salesApi } from "../../../../../shared/api/sales";
import { Modal } from "../../../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";

export function CustomerProfileDialog({
  customer, onClose, canSeePrices, isTablet,
}: {
  customer: ShopCustomer | null; onClose: () => void; canSeePrices: boolean; isTablet: boolean;
}) {
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-customer-dialog", customer?.id],
    queryFn: () => salesApi.list(100),
    enabled: !!customer,
  });

  const customerPurchases = (salesRes?.items ?? [])
    .filter(s => s.customerId === customer?.id)
    .map(s => ({
      id: s.sareeId,
      design: s.channel === "WHOLESALE" ? "Wholesale Purchase" : "Retail Purchase",
      date: new Date(s.saleDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      pay: "Counter",
      amt: formatMoney(rupees(Number(s.amount))),
    }));

  return (
    <Modal open={!!customer} onOpenChange={o => { if (!o) onClose(); }} size={isTablet ? "lg" : "sm"}>
      {customer && (
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100dvh - 96px)", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "32px 32px 28px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.burg, border: "3px solid rgba(200,155,71,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(110,15,45,0.40)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 30, fontWeight: 700, color: "#FFF" }}>{customer.initials}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <Dialog.Title style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: "#FFF", lineHeight: 1.1, margin: 0 }}>{customer.name}</Dialog.Title>
                    {customer.regular && <Star size={18} fill={C.gold} color={C.gold} />}
                  </div>
                  <Dialog.Description asChild><div style={{ fontFamily: F.m, fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{customer.phone}</div></Dialog.Description>
                  {customer.regular && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(200,155,71,0.20)", border: "1px solid rgba(200,155,71,0.40)", borderRadius: 999, padding: "3px 12px", marginTop: 8 }}><Star size={11} fill={C.gold} color={C.gold} /><span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold }}>Regular Customer</span></div>}
                </div>
                <Dialog.Close asChild>
                  <IconButton
                    icon={X}
                    label="Close"
                    onClick={onClose}
                    variant="ghost"
                    shape="circle"
                    className="bg-white/10 text-white/70 w-[38px] h-[38px] shrink-0"
                  />
                </Dialog.Close>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "28px 32px 32px", overflowY: "auto" as const }}>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ display: "grid", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Purchases", val: `${customer!.purchases}`, sub: "sarees bought", color: C.burg },
                  ...(canSeePrices ? [{ label: "Total Spent", val: customer!.total, sub: "lifetime value", color: C.gold }] : []),
                  { label: "Last Visit", val: customer!.last, sub: "most recent", color: C.text },
                ].map(s => (
                  <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 14px" }}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.color, lineHeight: 1.2, marginBottom: 3 }}>{s.val}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Purchase History ({customerPurchases.length})
                </div>
                {customerPurchases.length === 0 ? (
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No purchase history recorded for this customer.</div>
                ) : (
                  customerPurchases.map((p, i, arr) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ShoppingBag size={18} color={C.burg} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 3 }}>{p.id}</div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{p.design}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date} · {p.pay}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <Button onClick={onClose} variant="ghost" className="flex-1 h-[50px] rounded-[14px] border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white hover:bg-[rgba(110,15,45,0.06)] font-semibold text-sm text-[#69635E] hover:text-[#1A0A0F]">Close</Button>
                <Button variant="primary" className="flex-[2] h-[50px] rounded-[14px] border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold text-sm gap-2 shadow-[0_4px_16px_rgba(110,15,45,0.30)]">
                  <ShoppingBag size={16} /> Record New Sale for {customer!.name.split(" ")[1] || customer!.name.split(" ")[0]}
                </Button>
              </div>
            </div>
        </div>
      )}
    </Modal>
  );
}
