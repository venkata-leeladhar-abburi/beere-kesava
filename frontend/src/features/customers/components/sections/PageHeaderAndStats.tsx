import { Building2, Users, IndianRupee, AlertTriangle, UserPlus } from "lucide-react";
import customersHero from "../../../../assets/inline/customers2.jpg";
import { Money } from "../../../../shared/ui/domain/Money";
import { paise } from "../../../../lib/domain/money";
import { T, F } from "../theme";

import { useCustomers } from "../../contexts/CustomersContext";

// ── SECTION 1: PAGE HEADER ──────────────────────────────────────────────────
export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 90 }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          Since 1999 · Customer Management
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Customers</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Relationship Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 18, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
          Manage all wholesale business customers and view retail customer profiles. Track purchase history, outstanding payments, and order records for every customer.
        </p>
      </div>

      <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
        <img src={customersHero} alt="Showroom" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

// ── SECTION 2: CUSTOMER STATS STRIP ─────────────────────────────────────────
export function StatsStrip() {
  const { wholesaleCustomers = [], retailCustomers = [], customers = [] } = useCustomers() ?? {};

  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ marginTop: -80, position: "relative", zIndex: 20 }}>
      <div className="grid grid-cols-2 xl:flex" style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 24,
        alignItems: "stretch",
        boxShadow: "0 24px 72px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 140,
      }}>
        {[
          { ico: <Building2 size={22} color="rgba(245,232,208,0.90)" />, label: "Wholesale Customers", val: String(wholesaleCustomers.length), sub: "Active business relationships", hi: false },
          { ico: <Users size={22} color="rgba(245,232,208,0.90)" />, label: "Retail Customers", val: String(retailCustomers.length), sub: "Profiles at point of sale", hi: false },
          { ico: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />, label: "Total Revenue", val: <Money value={paise(0)} />, sub: "Live Database", hi: true },
          { ico: <AlertTriangle size={22} color="rgba(245,232,208,0.90)" />, label: "Customers with Dues", val: "0", sub: <>Total dues: <Money value={paise(0)} /></>, hi: false },
          { ico: <UserPlus size={22} color="rgba(245,232,208,0.90)" />, label: "Total Customers", val: String(customers.length), sub: `${retailCustomers.length} retail · ${wholesaleCustomers.length} wholesale`, hi: false },
        ].map((m, i, arr) => (
          <div key={m.label} style={{
            flex: 1,
            padding: "26px 20px",
            backgroundImage: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none",
            borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "relative" as const,
            cursor: "pointer",
          }}>
            {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
            <div style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {m.ico}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 7, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 48, letterSpacing: "-0.01em", color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                {m.val}
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
