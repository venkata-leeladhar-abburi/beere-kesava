import React from "react";
import { F, T, imgSareeFooter } from "../theme";

export function PaymentsHeader() {
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
      {/* Left content */}
      <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          SINCE 1999 · PAYMENT MANAGEMENT
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
            Payments
          </h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>
            &amp; Financial Overview
          </span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 580, lineHeight: 1.6 }}>
          Track all payments — weaver making charges, customer collections, vendor bills, and net income — all in one place.
        </p>
      </div>

      {/* Right — photography */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <img src={imgSareeFooter} alt="Silk sarees" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}
