import React from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { C, F, BG_IMAGE } from "../theme";
import { Button } from "../../../../../shared/ui/primitives";

export function WeaverHero({
  weaverName, onExploreBatches, onGoToPayments,
}: {
  weaverName: string;
  onExploreBatches: () => void;
  onGoToPayments: () => void;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: C.dark }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.22,
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(61,14,26,0.95) 0%, rgba(61,14,26,0.75) 60%, rgba(61,14,26,0.50) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, padding: "40px 48px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", marginBottom: 20 }}>
          SINCE 1999 · WEAVER PORTAL
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 48, color: "#FFF", lineHeight: 1, marginBottom: 12 }}>
          Welcome back, <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, color: C.gold }}>{weaverName}</span>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 560, marginBottom: 28 }}>
          Track your active and completed batches, view design references, and manage your materials — all in one place.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={onExploreBatches} variant="primary" className="flex items-center gap-2 h-auto rounded-full px-6 py-3 text-sm font-semibold" style={{ background: C.gold, color: C.dark }}>
            Explore Batches <ArrowRight size={16} />
          </Button>
          <Button onClick={onGoToPayments} variant="ghost" className="flex items-center gap-2 h-auto rounded-full px-6 py-3 text-sm font-semibold text-white border border-white/25 bg-white/10">
            <CreditCard size={16} /> View Payments
          </Button>
        </div>
      </div>
    </div>
  );
}
