import { T, F } from "./tokens";

// ─── 1. PAGE HEADER ─────────────────────────────────────────────────────────
export function ApprovalsHeader() {
  return (
    <header style={{
      background: "#0D0207",
      position: "relative",
      overflow: "hidden",
      minHeight: 340,
      display: "flex",
      alignItems: "center",
    }}>
      <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
        {/* Left copy */}
        <div>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            SINCE 1999 · SUPERADMIN · APPROVALS
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
              Approvals
            </h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>
              &amp; Pending Actions
            </span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
            Review and action purchase orders, external purchase requests, warp material requests, and rate change proposals from your admin team.
          </p>
        </div>
      </div>
    </header>
  );
}
