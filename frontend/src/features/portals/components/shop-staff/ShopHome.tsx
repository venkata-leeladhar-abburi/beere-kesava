import { useCanSeePrices, HeroHeader, StatsStrip, TabId } from "./theme";
import { ShoppingBag, Check, Send, AlertTriangle, Package, RotateCcw, ArrowUpRight, X } from "lucide-react";
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Modal } from "../../../../shared/ui/overlay";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../shared/api/sales";
import { inventoryApi } from "../../../../shared/api/inventory";
import { customersApi } from "../../../../shared/api/customers";
import { C, F, Card, Btn, Chip, SectionTitle } from './theme';
import { Button, IconButton, Textarea } from "../../../../shared/ui/primitives";

function dateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function ShopHome({ onNavigate }: { onNavigate: (tab: TabId | "return") => void }) {
  const canSeePrices = useCanSeePrices();
  const [alerted, setAlerted] = useState(false);
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  const [lowStockMsg, setLowStockMsg] = useState("");
  const [lowStockPriority, setLowStockPriority] = useState<"urgent" | "normal">("urgent");
  const [lowStockSending, setLowStockSending] = useState(false);

  const { data: salesRes, isError: salesError } = useQuery({
    queryKey: ["sales-list-shophome"],
    queryFn: () => salesApi.list(100),
  });

  const { data: inventoryRes, isError: inventoryError } = useQuery({
    queryKey: ["inventory-list-shophome"],
    queryFn: () => inventoryApi.list(),
  });

  const { data: returnsRes, isError: returnsError } = useQuery({
    queryKey: ["returns-list-shophome"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers-shophome"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = salesRes?.items ?? [];
  const inventoryList = inventoryRes ?? [];
  const returnsList = returnsRes?.items ?? [];
  const customerMap = new Map((customersRes?.items ?? []).map(c => [c.id, c.name]));

  const todayStr = new Date().toDateString();
  const todaySales = salesList.filter(s => new Date(s.saleDate).toDateString() === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const todayReturns = returnsList.filter(r => new Date(r.returnDate).toDateString() === todayStr);

  const recentSales = salesList.slice(0, 5).map(s => ({
    id: s.sareeId,
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Retail Counter",
    design: s.channel === "WHOLESALE" ? "Wholesale Sale" : "Retail Sale",
    amt: `₹${Number(s.amount).toLocaleString("en-IN")}`,
    time: dateLabel(s.saleDate),
    color: "#6B1A2A",
    ext: false,
  }));

  const latestReturn = returnsList[0];

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · SHOP OVERVIEW" title="Shop Home" sub="& Today's Overview"
        desc="Today's sales, current inventory, and quick actions for the shop counter." />
      <StatsStrip items={[
        { label: "TODAY'S SALES", val: salesError ? "Error" : `${todaySales.length} saree${todaySales.length !== 1 ? "s" : ""}`, sub: salesError ? "Failed to load" : "Recorded today" },
        ...(canSeePrices ? [{ label: "TODAY'S REVENUE", val: salesError ? "Error" : `₹${todayRevenue.toLocaleString("en-IN")}`, sub: salesError ? "Failed to load" : `From ${todaySales.length} sales` }] : []),
        { label: "SHOP INVENTORY", val: inventoryError ? "Error" : `${inventoryList.length} sarees`, sub: inventoryError ? "Failed to load" : "Currently in stock", highlight: true },
        { label: "RETURNS TODAY", val: returnsError ? "Error" : `${todayReturns.length} return${todayReturns.length !== 1 ? "s" : ""}`, sub: returnsError ? "Failed to load" : "Processed and recorded" },
      ]} />

      {/* Quick New Sale */}
      <div style={{ margin: "20px 20px 14px" }}>
        <div style={{
          background: "linear-gradient(160deg, rgba(196,146,58,0.10) 0%, rgba(107,26,42,0.05) 100%)",
          border: `2px solid ${C.burg}`, borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 18px rgba(107,26,42,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(196,146,58,0.35)" }}>
              <ShoppingBag size={30} color={C.text} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.2 }}>New Retail Sale</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>Record a sale at the counter</div>
            </div>
          </div>
          <Button onClick={() => onNavigate("sale")} fullWidth className="h-14 rounded-full bg-[#6B1A2A] border-none font-bold text-base text-white gap-2 shadow-[0_6px_18px_rgba(107,26,42,0.30)]">
            <ArrowUpRight size={20} /> Start New Sale
          </Button>
        </div>
      </div>

      {/* Process Return quick link */}
      <div style={{ margin: "0 20px 8px", display: "flex", gap: 12 }}>
        <Button onClick={() => onNavigate("return")} className="flex-1 h-[52px] border border-[rgba(139,26,46,0.12)] bg-white rounded-2xl font-semibold text-sm text-[#1A0A0F] gap-2 shadow-[0_1px_6px_rgba(44,24,16,0.05)]">
          <RotateCcw size={17} color={C.crim} /> Process Return
        </Button>
        <Button onClick={() => onNavigate("inventory")} className="flex-1 h-[52px] border border-[rgba(139,26,46,0.12)] bg-white rounded-2xl font-semibold text-sm text-[#1A0A0F] gap-2 shadow-[0_1px_6px_rgba(44,24,16,0.05)]">
          <Package size={17} color={C.burg} /> View Inventory
        </Button>
      </div>

      {/* Recent Sales */}
      <SectionTitle title="Recent Sales — Today" link="View All →" onLink={() => onNavigate("reports")} />
      <Card style={{ margin: "0 20px", padding: 0, overflow: "hidden" }}>
        {recentSales.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
            No sales recorded today yet.
          </div>
        ) : (
          recentSales.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(139,26,46,0.08)` : "none" }}>
              <div style={{ width: 6, height: 40, borderRadius: 3, background: s.color, marginRight: 14, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{s.id}</span>
                  {s.ext && <Chip label="📦 External" color={C.gold} bg="rgba(196,146,58,0.12)" />}
                </div>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginTop: 3 }}>{s.customer}</div>
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 1 }}>{s.design}</div>
              </div>
              <div style={{ textAlign: "right" as const, flexShrink: 0, marginLeft: 8 }}>
                {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time}</div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Returns Today */}
      <SectionTitle title="Returns Today" />
      <div style={{ margin: "0 20px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "16px" }}>
        {latestReturn ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" as const }}>
            <Chip label="↩ Return" color={C.crim} bg="rgba(192,57,43,0.10)" />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{latestReturn.sareeId}</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2, lineHeight: 1.4 }}>
                {latestReturn.reason}
                {canSeePrices && latestReturn.refundAmount ? ` · ₹${Number(latestReturn.refundAmount).toLocaleString("en-IN")}` : ""}
              </div>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{dateLabel(latestReturn.returnDate)}</div>
          </div>
        ) : (
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No returns recorded today.</div>
        )}
      </div>

      {/* Low Stock Alert */}
      <SectionTitle title="Stock Alert" />
      <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", borderRadius: 16, borderLeft: `4px solid ${C.crim}`, padding: "18px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 14, lineHeight: 1.5 }}>
          ⚠ Shop stock is running low — only <strong>84 sarees</strong> remaining.
        </div>
        {alerted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green }}>
            <Check size={18} />
            <span style={{ fontFamily: F.u, fontSize: 14, lineHeight: 1.4 }}>Admin and Superadmin have been notified about low stock.</span>
          </div>
        ) : (
          <Btn label="Report Low Stock to Admin" icon={<Send size={16} />} onClick={() => setShowLowStockDialog(true)} style={{ width: "100%", height: 54, background: C.burg, fontSize: 14 }} />
        )}
      </div>

      {/* Low Stock Dialog — bottom sheet */}
      <Modal open={showLowStockDialog} onOpenChange={o => !o && setShowLowStockDialog(false)} size="sm">
            <div style={{ padding: "28px 20px 36px", overflowY: "auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={24} color={C.crim} />
                </div>
                <div>
                  <Dialog.Title asChild>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text }}>Report Low Stock</div>
                  </Dialog.Title>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>Notify Admin & Superadmin</div>
                </div>
                <Dialog.Close asChild>
                  <IconButton
                    icon={X}
                    label="Close"
                    variant="ghost"
                    shape="circle"
                    className="ml-auto bg-[rgba(139,112,96,0.10)] text-[#69635E] w-9 h-9"
                  />
                </Dialog.Close>
              </div>
              {/* Stock info */}
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Current stock</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.crim }}>84</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Minimum threshold</span>
                  <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}>100 sarees</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(192,57,43,0.12)", marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: C.crim, borderRadius: 3 }} />
                </div>
              </div>
              {/* Priority */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Priority</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["urgent", "normal"] as const).map(p => {
                    const isActive = lowStockPriority === p;
                    const activeColor = p === "urgent" ? "border-[#C0392B] bg-[rgba(192,57,43,0.08)] text-[#C0392B]" : "border-[#6B1A2A] bg-[rgba(107,26,42,0.06)] text-[#6B1A2A]";
                    return (
                      <Button
                        key={p}
                        onClick={() => setLowStockPriority(p)}
                        variant="ghost"
                        className={"flex-1 h-11 rounded-[10px] border-2 font-semibold text-sm " + (isActive ? activeColor : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E]")}
                      >
                        {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {/* Optional message */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 8 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                <Textarea value={lowStockMsg} onChange={e => setLowStockMsg(e.target.value)} placeholder="E.g. We need silk sarees urgently for upcoming festival orders..." rows={3}
                  className="rounded-xl min-h-[90px] resize-none" />
              </div>
              {/* Confirm */}
              <Button onClick={() => {
                setLowStockSending(true);
                setTimeout(() => { setLowStockSending(false); setShowLowStockDialog(false); setAlerted(true); }, 1200);
              }} fullWidth className="h-[54px] bg-[#C0392B] border-none rounded-full font-bold text-base text-white gap-2">
                {lowStockSending ? "Sending…" : <><Send size={18} /> Send Report to Admin</>}
              </Button>
            </div>
      </Modal>
    </div>
  );
}

// ─── PAGE 02 — NEW RETAIL SALE ───────────────────────────────────────────────
export { ShopHome };
