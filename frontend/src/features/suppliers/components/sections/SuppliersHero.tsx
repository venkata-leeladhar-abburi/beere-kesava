// Page hero banner + the stats strip that overlaps its bottom edge.

import React from "react";
import suppliersHero from "../../../../assets/inline/suppliersHero.jpg";
import {
  Send, Plus, Building2, Package, IndianRupee, CheckCircle2,
  AlertTriangle, TrendingUp,
} from "lucide-react";
import { T, F } from "../theme";
import { Purchase } from "../../contexts/SupplierContext";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

export function SuppliersHero({
  suppliersCount, purchases, totals, onAddExternalPurchase, onAddSupplier,
}: {
  suppliersCount: number;
  purchases: Purchase[];
  totals: { purchased: number; paid: number; outstanding: number; sarees: number };
  onAddExternalPurchase: () => void;
  onAddSupplier: () => void;
}) {
  return (
    <>
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 90 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 400 }}>
              Since 1999 · Saree Supplier Network
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Suppliers</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; External Sourcing</span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Manage every saree supplier. Track external purchase inventory, payment history, and raise purchase requests for approval.
          </p>
          <div style={{ display: "flex", gap: 12, alignSelf: "flex-start", flexShrink: 0 }}>
            <Button
              variant="secondary"
              size="lg"
              iconLeft={Send}
              onClick={onAddExternalPurchase}
              className="bg-white/10 border-[rgba(200,155,71,0.4)] text-[#E7C983] hover:bg-white/15"
            >
              Add External Purchase
            </Button>
            <Button
              variant="primary"
              size="lg"
              iconLeft={Plus}
              onClick={onAddSupplier}
              className="border-none shadow-[0_4px_20px_rgba(200,155,71,0.35)] bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] hover:bg-[linear-gradient(135deg,#C89B47,#E7C983)]"
            >
              Add New Supplier
            </Button>
          </div>
        </div>

        <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
          <img src={suppliersHero} alt="Suppliers" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* Stats strip */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-14 xl:-mt-[80px]" style={{ position: "relative", zIndex: 20 }}>
        <div className="grid grid-cols-2 xl:flex" style={{ background: "linear-gradient(135deg,#5D1027 0%,#2C0913 100%)", borderRadius: 24, alignItems: "stretch", boxShadow: "0 24px 72px rgba(0,0,0,0.32),0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { icon: Building2,     label: "Total Suppliers",   value: String(suppliersCount),                                   sub: "Registered saree suppliers", hi: false },
            { icon: Package,       label: "Sarees Purchased",  value: String(totals.sarees),                                    sub: "Across all external buys",   hi: false },
            { icon: IndianRupee,   label: "Total Purchased",   value: formatMoney(rupees(totals.purchased), { compact: true }), sub: "Billed by all suppliers",    hi: true  },
            { icon: CheckCircle2,  label: "Total Paid",        value: formatMoney(rupees(totals.paid), { compact: true }),      sub: "Settled to suppliers",       hi: false },
            { icon: AlertTriangle, label: "Outstanding",       value: formatMoney(rupees(totals.outstanding), { compact: true }), sub: "Yet to be paid",           hi: false },
            { icon: TrendingUp,    label: "Pending Purchases",  value: String(purchases.filter(p => p.status === "Pending").length), sub: "Awaiting payment",        hi: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ flex: 1, padding: "26px 18px", background: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none", borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.icon size={20} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>{m.label}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{m.value}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
