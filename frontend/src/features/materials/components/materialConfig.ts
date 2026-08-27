import React from "react";
import { AlertTriangle, CheckCircle2, Archive } from "lucide-react";
import { imgWarp, imgResham, imgJari } from "../../../shared/constants/imageData";
import { T } from "./theme";
import { NAV_GROUPS } from "@/features/dashboards";
import type {
  StatusType, WeaverStatus, StatusCfgEntry, TagStyle, WeaverStatusCfgEntry,
} from "./types";

export const STATUS_CFG: Record<StatusType, StatusCfgEntry> = {
  good:     { dot: T.green,       color: T.green,       bg: "rgba(30,102,64,0.09)",   text: "In Stock",    icon: React.createElement(CheckCircle2, { size: 13 }) },
  warning:  { dot: T.antiqueGold, color: "#7A5E1C",     bg: "rgba(200,155,71,0.12)",  text: "Running Low", icon: React.createElement(AlertTriangle, { size: 13 }) },
  critical: { dot: T.crimson,     color: T.crimson,     bg: "rgba(192,57,43,0.09)",   text: "Very Low",    icon: React.createElement(AlertTriangle, { size: 13 }) },
  empty:    { dot: T.taupe,       color: T.taupe,       bg: "rgba(139,112,96,0.09)",  text: "All Used Up", icon: React.createElement(Archive, { size: 13 }) },
};

export const MAT_TAG: Record<string, TagStyle> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
};

export const W_STATUS: Record<WeaverStatus, WeaverStatusCfgEntry> = {
  "on-time":     { border: T.royalBurgundy, bannerBg: "rgba(30,102,64,0.10)",  bannerColor: T.green    },
  "approaching": { border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"  },
  "overdue":     { border: T.crimson,       bannerBg: "rgba(192,57,43,0.10)",  bannerColor: T.crimson  },
  "quality":     { border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"  },
};

export const PO_STATUS_CFG = {
  pending:  { border: "#C89B47", badge: "⏳ Awaiting Superadmin Approval", badgeBg: "rgba(200,155,71,0.12)", badgeColor: "#C89B47", label: "Pending Approval" },
  approved: { border: "#1E6640", badge: "✓ Approved — Ready to Receive",   badgeBg: "rgba(30,102,64,0.10)",  badgeColor: "#1E6640", label: "Approved" },
  rejected: { border: "#C0392B", badge: "✗ Rejected",                       badgeBg: "rgba(192,57,43,0.09)", badgeColor: "#C0392B", label: "Rejected" },
  received: { border: "#69635E", badge: "📦 Received",                      badgeBg: "rgba(139,112,96,0.10)", badgeColor: "#69635E", label: "Received" },
};

export const BATCH_IMG: Record<string, string> = { Warp: imgWarp, Resham: imgResham, Jari: imgJari };

export const MAT_FILTERS = ["All Materials", "Warp Only", "Resham Only", "Jari Only"];
export const STATUS_FILTERS = ["All Status", "In Stock", "Running Low", "Very Low", "All Used Up"];
export const STATUS_FILTER_MAP: Record<string, StatusType | null> = {
  "All Status": null,
  "In Stock": "good",
  "Running Low": "warning",
  "Very Low": "critical",
  "All Used Up": "empty",
};

export const MAT_CARDS_TEMPLATE = [
  { name: "Warp",   desc: "Base Thread used for weaving · Cotton and Silk types", barColor: T.royalBurgundy, stockColor: T.antiqueGold, img: imgWarp, stock: "0 kg" },
  { name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours", barColor: T.antiqueGold, stockColor: T.antiqueGold, img: imgResham, stock: "0 kg" },
  { name: "Jari",   desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types", barColor: T.crimson, stockColor: T.crimson, img: imgJari, stock: "0 Buns" },
];

// Mirrors the superadmin top navbar's NAV_GROUPS exactly, so the footer
// never drifts out of sync when pages are added/removed from Operations
// (or any other group) — see superadmin-dashboard/data.tsx.
export type FooterLink = { key: string; label: string; sa?: boolean };
export const FOOTER_LINKS: Record<string, FooterLink[]> = Object.fromEntries(
  NAV_GROUPS.map(g => [g.label, g.pages.map(p => ({ key: p.key, label: p.label, sa: p.sa }))])
);
