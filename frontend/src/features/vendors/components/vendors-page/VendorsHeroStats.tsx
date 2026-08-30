import React from "react";
import { motion } from "motion/react";
import vendorsHero from "../../../../assets/inline/vendorsHero.jpg";
import { Building2, CheckCircle2, IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toPaise, fromPaise } from "@/lib/gst";
import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function VendorsHeroStats({ vendors, onAddClick }: { vendors: Vendor[]; onAddClick: () => void }) {
  const totalSpendVal = React.useMemo(() => {
    // Total spend is money — sum in integer paise so the total across all
    // vendors never accumulates float drift, then convert back once.
    const totalPaise = vendors.reduce((acc, v) => acc + toPaise(Number(v.totalSpend.replace(/,/g, "")) || 0), 0);
    return formatMoney(rupees(fromPaise(totalPaise)), { compact: true });
  }, [vendors]);

  const newThisYearCount = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return vendors.filter(v => v.createdAt && new Date(v.createdAt).getFullYear() === currentYear).length;
  }, [vendors]);

  return (
    <>
      {/* Hero Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 400 }}>
              Since 1999 · Supplier Management
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Vendors</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Supplier Registry</span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: "0 0 16px", lineHeight: 1.6 }}>
            Manage all raw material vendors. Track purchase history, payment terms, and outstanding amounts for every supplier.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ alignSelf: "flex-start", flexShrink: 0, display: "inline-block" }}>
            <Button
              onClick={onAddClick}
              variant="primary"
              iconLeft="add"
              className="rounded-xl bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] shadow-[0_4px_20px_rgba(200,155,71,0.35)] hover:bg-[linear-gradient(135deg,#C89B47,#E7C983)]"
            >
              Add New Vendor
            </Button>
          </motion.div>
        </div>

        <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
          <img src={vendorsHero} alt="Vendors" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* Stats Strip */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-14 xl:-mt-[80px]" style={{ position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={[
          { label: "Total Vendors", value: String(vendors.length), sub: "Active supplier relationships", icon: <Building2 size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
          { label: "Active Vendors", value: String(vendors.filter(v => v.status === "active").length), sub: "Currently supplying materials", icon: <CheckCircle2 size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
          { label: "Total Spend", value: totalSpendVal, sub: "This year · All material types", icon: <IndianRupee size={20} color="rgba(231,201,131,0.95)" />, highlight: true },
          { label: "Overdue Payments", value: String(vendors.filter(v => v.status === "overdue").length), sub: "Vendors awaiting settlement", icon: <AlertTriangle size={20} color="#FCA5A5" />, highlight: false, crimson: vendors.some(v => v.status === "overdue") },
          { label: "New This Year", value: String(newThisYearCount), sub: "Recently onboarded vendors", icon: <TrendingUp size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
        ]} />
      </div>
    </>
  );
}
