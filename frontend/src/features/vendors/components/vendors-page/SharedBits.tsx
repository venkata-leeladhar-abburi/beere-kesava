import React from "react";
import { Star } from "lucide-react";
import { T, F } from "./theme";

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(30,102,64,0.09)", color: "#2D9158", label: "Active" },
    inactive: { bg: "rgba(139,112,96,0.10)", color: T.taupe, label: "Inactive" },
    overdue: { bg: "rgba(192,57,43,0.08)", color: "#C0392B", label: "Overdue" },
  };
  const s = map[status] ?? map.active;
  return <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= rating ? T.antiqueGold : "none"} color={i <= rating ? T.antiqueGold : T.taupe} />)}
    </div>
  );
}
