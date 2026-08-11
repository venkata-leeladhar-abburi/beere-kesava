import React from "react";
import { motion } from "motion/react";
import vendorsHero from "../../../../assets/inline/vendorsHero.jpg";
import { Building2, CheckCircle2, IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

export function VendorsHeroStats({ vendors, onAddClick }: { vendors: Vendor[]; onAddClick: () => void }) {
  const totalSpendVal = React.useMemo(() => {
    const total = vendors.reduce((acc, v) => acc + (parseFloat(v.totalSpend.replace(/,/g, "")) || 0), 0);
    return formatMoney(rupees(total), { compact: true });
  }, [vendors]);

  return (
    <>
      {/* Hero Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 90px 48px", flex: "0 0 65%", maxWidth: "65%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 400 }}>
              Since 1999 · Supplier Management
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Vendors</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Supplier Registry</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 18, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
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

        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
          <img src={vendorsHero} alt="Vendors" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* Stats Strip */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg,#5D1027 0%,#2C0913 100%)", borderRadius: 24, display: "flex", alignItems: "stretch", boxShadow: "0 24px 72px rgba(0,0,0,0.32),0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { icon: Building2, label: "Total Vendors", value: String(vendors.length), sub: "Active supplier relationships", hi: false },
            { icon: CheckCircle2, label: "Active Vendors", value: String(vendors.filter(v => v.status === "active").length), sub: "Currently supplying materials", hi: false },
            { icon: IndianRupee, label: "Total Spend", value: totalSpendVal, sub: "This year · All material types", hi: true },
            { icon: AlertTriangle, label: "Overdue Payments", value: String(vendors.filter(v => v.status === "overdue").length), sub: "Vendors awaiting settlement", hi: false },
            { icon: TrendingUp, label: "New This Year", value: "2", sub: "Recently onboarded vendors", hi: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ flex: 1, padding: "26px 20px", background: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none", borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.icon size={22} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 7, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>{m.label}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 48, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{m.value}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
