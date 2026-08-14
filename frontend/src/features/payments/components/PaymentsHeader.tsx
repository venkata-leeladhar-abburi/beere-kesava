import React from "react";
import { F, T, imgSareeFooter } from "../theme";

export function PaymentsHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
      {/* Left content */}
      <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[64%] xl:max-w-[64%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
        <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          SINCE 1999 · PAYMENT MANAGEMENT
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
            Payments
          </h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>
            &amp; Financial Overview
          </span>
        </div>
        {/* eslint-disable-next-line no-restricted-syntax -- block-level p is already 100% wide by default; maxWidth only caps growth on large screens, no overflow risk */}
        <p style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 580, lineHeight: 1.6 }}>
          Track all payments — weaver making charges, customer collections, vendor bills, and net income — all in one place.
        </p>
      </div>

      {/* Right — photography */}
      <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
        <img src={imgSareeFooter} alt="Silk sarees" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}
