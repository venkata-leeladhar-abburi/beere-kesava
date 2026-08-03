import React from "react";
import { motion } from "motion/react";
import { Plus, Building2, CheckCircle2, IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";

export function VendorsHeroStats({ vendors, onAddClick }: { vendors: Vendor[]; onAddClick: () => void }) {
  const totalSpendVal = React.useMemo(() => {
    const total = vendors.reduce((acc, v) => acc + (parseFloat(v.totalSpend.replace(/,/g, "")) || 0), 0);
    return `₹${(total / 100000).toFixed(1)}L`;
  }, [vendors]);

  return (
    <>
      {/* Hero Header */}
      <div style={{ minHeight: 230, background: T.darkBurgundy, display: "flex", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -100, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(200,155,71,0.022) 48px,rgba(200,155,71,0.022) 49px)` }} />
        <div style={{ padding: "44px 56px 90px", display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},rgba(200,155,71,0))` }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "2.5px", color: "rgba(200,155,71,0.82)", textTransform: "uppercase" as const, fontWeight: 600 }}>Since 1999 · Supplier Management</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
              <h1 style={{ fontFamily: F.display, fontSize: 52, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.0 }}>Vendors</h1>
              <span style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontStyle: "italic", fontWeight: 400 }}>&amp; Supplier Registry</span>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.60)", margin: "6px 0 0", maxWidth: 540, lineHeight: 1.65 }}>Manage all raw material vendors. Track purchase history, payment terms, and outstanding amounts for every supplier.</p>
          </div>
          <motion.button onClick={onAddClick} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ alignSelf: "flex-start", padding: "13px 24px", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.darkBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(200,155,71,0.35)", flexShrink: 0 }}>
            <Plus size={15} /> Add New Vendor
          </motion.button>
        </div>
      </div>

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
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 7, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 6 }}>{m.value}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
