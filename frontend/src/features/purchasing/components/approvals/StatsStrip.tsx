import React from "react";
import { T } from "./tokens";
import { formatMoney, rupees } from "@/lib/domain/money";

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";
import { CheckCircle2, ShoppingBag, Send, ShieldAlert, TrendingUp } from "lucide-react";

// ─── 2. STATS STRIP ─────────────────────────────────────────────────────────
export function StatsStrip({
  totalPending,
  poCount,
  warpCount,
  rateCount,
}: {
  totalPending: number;
  poCount: number;
  warpCount: number;
  rateCount: number;
}) {
  const statItems = [
    { icon: <CheckCircle2 size={22} color="rgba(245,232,208,0.90)" />, label: "TOTAL PENDING", value: String(totalPending), sub: "Require your action today", highlight: false },
    { icon: <ShoppingBag size={22} color="rgba(245,232,208,0.90)" />, label: "PURCHASE ORDERS", value: String(poCount), sub: "From admin · Awaiting approval", highlight: false },
    { icon: <ShieldAlert size={22} color="rgba(245,232,208,0.90)" />, label: "WARP REQUESTS", value: String(warpCount), sub: "Pending review", highlight: false },
    { icon: <TrendingUp size={22} color="#F47B72" />, label: "RATE CHANGES", value: String(rateCount), sub: "⚠ From admin · Pending", highlight: false, crimson: rateCount > 0 },
  ];

  return (
    <div className="mx-4 md:mx-7 xl:mx-14 -mt-6 md:-mt-8 xl:-mt-[40px]" style={{ zIndex: 20, position: "relative" }}>
      <LuxuryStatsCard stats={statItems} />
    </div>
  );
}
