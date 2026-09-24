import React from "react";
import {
  Bell, AlertTriangle, CheckCircle2, Info,
  Package, Users, ShoppingCart, TrendingUp, FileText,
  AlertCircle, ShoppingBag, Truck
} from "lucide-react";

export type Priority = "critical" | "warning" | "info" | "success";

export interface UnifiedNotif {
  id: string;
  priority: Priority;
  category: "weaver" | "production" | "material" | "payment" | "dispatch" | "retail" | "wholesale";
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: string;
  /** Labelled facts for the detail panel — a sale's customer, rate, discount… */
  details?: NotifDetail[];
  /** Per-saree rows for a notification that covers several sarees. */
  sarees?: NotifSaree[];
}

export interface NotifDetail {
  label: string;
  value: string;
  /** Emphasised — the amount that was actually paid. */
  strong?: boolean;
}

export interface NotifSaree {
  sareeId: string;
  sareeType: string | null;
  /** "Weaver · Ramoji Rao · Loom 1" */
  source: string | null;
  /** "₹1,500 − ₹150 (10%) = ₹1,350" — set when the saree was sold, not dispatched. */
  price?: string;
}

export const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  warmCream:     "#F5E8D0",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const PRIORITY: Record<Priority, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  critical: { color: "#B91C1C", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.20)", Icon: AlertTriangle,  label: "Critical" },
  warning:  { color: "#B45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)",  Icon: AlertCircle,    label: "Warning" },
  info:     { color: "#1D4ED8", bg: "rgba(29,78,216,0.07)", border: "rgba(29,78,216,0.18)", Icon: Info,           label: "Info" },
  success:  { color: T.green,   bg: "rgba(30,102,64,0.07)", border: "rgba(30,102,64,0.18)", Icon: CheckCircle2,   label: "Success" },
};

export const CATEGORIES = [
  { key: "all",        label: "All Notifications",     color: T.royalBurgundy, Icon: Bell },
  { key: "weaver",     label: "Weavers & Looms",       color: T.royalBurgundy, Icon: Users },
  { key: "production", label: "Production & Batches",  color: T.green,         Icon: TrendingUp },
  { key: "material",   label: "Raw Materials & Stock", color: "#7B3F00",       Icon: Package },
  { key: "payment",    label: "Payments & Invoices",   color: "#1D4ED8",       Icon: FileText },
  { key: "retail",     label: "Retail Sales",          color: "#8A1C3F",       Icon: ShoppingBag },
  { key: "wholesale",  label: "Wholesale Sales",       color: "#5B3A8C",       Icon: Truck },
  { key: "dispatch",   label: "Shop & Dispatch",       color: T.antiqueGold,   Icon: ShoppingCart },
];
