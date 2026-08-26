// Page hero banner + the stats strip that overlaps its bottom edge.

import React from "react";
import suppliersHero from "../../../../assets/inline/suppliersHero.jpg";
import { Send, Plus, Building2, Package, IndianRupee, CheckCircle2, AlertTriangle } from "lucide-react";
import { T, F } from "../theme";
import { Purchase } from "../../contexts/SupplierContext";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function SuppliersHero({
  suppliersCount, totals, onAddExternalPurchase, onAddSupplier,
}: {
  suppliersCount: number;
  purchases: Purchase[];
  totals: { purchased: number; paid: number; outstanding: number; sarees: number };
  onAddExternalPurchase: () => void;
  onAddSupplier: () => void;
}) {
  const statItems = [
    { icon: <Building2 size={20} color="rgba(245,232,208,0.90)" />, label: "Total Suppliers", value: String(suppliersCount), sub: "Registered saree suppliers", highlight: false },
    { icon: <Package size={20} color="rgba(245,232,208,0.90)" />, label: "Sarees Purchased", value: String(totals.sarees), sub: "Across all external buys", highlight: false },
    { icon: <IndianRupee size={20} color="rgba(231,201,131,0.95)" />, label: "Total Purchased", value: formatMoney(rupees(totals.purchased), { compact: true }), sub: "Billed by all suppliers", highlight: true },
    { icon: <CheckCircle2 size={20} color="rgba(245,232,208,0.90)" />, label: "Total Paid", value: formatMoney(rupees(totals.paid), { compact: true }), sub: "Settled to suppliers", highlight: false },
    { icon: <AlertTriangle size={20} color="rgba(245,232,208,0.90)" />, label: "Outstanding", value: formatMoney(rupees(totals.outstanding), { compact: true }), sub: "Yet to be paid", highlight: false },
  ];

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
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              iconLeft={Send}
              onClick={onAddExternalPurchase}
              className="w-full sm:w-auto bg-white/10 border-[rgba(200,155,71,0.4)] text-[#E7C983] hover:bg-white/15 justify-center"
            >
              Add External Purchase
            </Button>
            <Button
              variant="primary"
              size="lg"
              iconLeft={Plus}
              onClick={onAddSupplier}
              className="w-full sm:w-auto border-none shadow-[0_4px_20px_rgba(200,155,71,0.35)] bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] hover:bg-[linear-gradient(135deg,#C89B47,#E7C983)] justify-center"
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
        <LuxuryStatsCard stats={statItems} />
      </div>
    </>
  );
}
