import { Building2, Users, IndianRupee, AlertTriangle, UserPlus } from "lucide-react";
import { imgShowroom } from "../../../../shared/constants/weaverImages";
import { T, F } from "../theme";

import { useCustomers } from "../../contexts/CustomersContext";

// ── SECTION 1: PAGE HEADER ──────────────────────────────────────────────────
export function PageHeader() {
  const headerBgImage = imgShowroom;
  return (
    <div style={{
      minHeight: 230, background: T.darkBurgundy, display: "flex", position: "relative", overflow: "hidden"
    }}>
      {/* Decorative gold rings */}
      <div style={{ position: "absolute", right: -80, top: -100, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", right: 40, top: -30, width: 360, height: 360, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.07)", pointerEvents: "none", zIndex: 1 }} />

      {/* Background photo */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "45%",
        background: `url(${headerBgImage}) center/cover no-repeat`,
        opacity: 0.18, maskImage: "linear-gradient(to right, transparent, black)",
        zIndex: 1
      }} />

      {/* Grid line overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(200,155,71,0.022) 48px, rgba(200,155,71,0.022) 49px)` }} />

      <div style={{ padding: "44px 56px 90px", display: "flex", width: "100%", alignItems: "flex-start", zIndex: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, rgba(200,155,71,0))` }} />
            <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "2.5px", color: "rgba(200,155,71,0.82)", textTransform: "uppercase" as const, fontWeight: 600 }}>
              Since 1999 · Customer Management
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 48, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.0 }}>Customers</h1>
            <span style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.3px" }}>& Relationship Overview</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.60)", margin: "6px 0 0 0", maxWidth: 580, lineHeight: 1.65 }}>
            Manage all wholesale business customers and view retail customer profiles. Track purchase history, outstanding payments, and order records for every customer.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── SECTION 2: CUSTOMER STATS STRIP ─────────────────────────────────────────
export function StatsStrip() {
  const { wholesaleCustomers = [], retailCustomers = [], customers = [] } = useCustomers() ?? {};

  return (
    <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 24,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 24px 72px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 140,
      }}>
        {[
          { ico: <Building2 size={22} color="rgba(245,232,208,0.90)" />, label: "Wholesale Customers", val: String(wholesaleCustomers.length), sub: "Active business relationships", hi: false },
          { ico: <Users size={22} color="rgba(245,232,208,0.90)" />, label: "Retail Customers", val: String(retailCustomers.length), sub: "Profiles at point of sale", hi: false },
          { ico: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />, label: "Total Revenue", val: "₹0", sub: "Live Database", hi: true },
          { ico: <AlertTriangle size={22} color="rgba(245,232,208,0.90)" />, label: "Customers with Dues", val: "0", sub: "Total dues: ₹0", hi: false },
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
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 6 }}>
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
