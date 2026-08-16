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
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          Since 1999 · Customer Management
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Customers</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Relationship Overview</span>
        </div>
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: "0 0 20px", lineHeight: 1.6 }}>
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
import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function StatsStrip() {
  const { wholesaleCustomers = [], retailCustomers = [], customers = [] } = useCustomers() ?? {};

  const statItems = [
    { icon: <Building2 size={20} color="rgba(245,232,208,0.90)" />, label: "Wholesale Customers", value: String(wholesaleCustomers.length), sub: "Active business relationships", highlight: false },
    { icon: <Users size={20} color="rgba(245,232,208,0.90)" />, label: "Retail Customers", value: String(retailCustomers.length), sub: "Profiles at point of sale", highlight: false },
    { icon: <IndianRupee size={20} color="rgba(231,201,131,0.95)" />, label: "Total Revenue", value: <Money value={paise(0)} />, sub: "Live Database", highlight: true },
    { icon: <AlertTriangle size={20} color="rgba(245,232,208,0.90)" />, label: "Customers with Dues", value: "0", sub: <>Total dues: <Money value={paise(0)} /></>, highlight: false },
    { icon: <UserPlus size={20} color="rgba(245,232,208,0.90)" />, label: "Total Customers", value: String(customers.length), sub: `${retailCustomers.length} retail · ${wholesaleCustomers.length} wholesale`, highlight: false },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-14 xl:-mt-[80px]" style={{ position: "relative", zIndex: 20 }}>
      <LuxuryStatsCard stats={statItems} />
    </div>
  );
}
