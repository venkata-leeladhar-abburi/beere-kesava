// NOTE(backend gap): everything in this file except the constant style/config
// tables (STATUS_CFG, MAT_TAG, W_STATUS, PO_STATUS_CFG, BATCH_IMG, filter
// option lists, FOOTER_LINKS) is placeholder data with no backend source.
//
// The only real "materials" backend module is MaterialIssuesModule
// (backend/src/material-issues/) — outbound issuance of Warp/Resham/Jari to
// weavers — and that is already wired end-to-end via
// frontend/src/shared/api/material-issues.ts and
// frontend/src/features/materials/contexts/MaterialIssueContext.tsx
// (consumed by IssueMaterialPage.tsx / IssuanceHistorySection.tsx).
//
// There is no backend module for: raw-material stock levels/batches (GRN
// receipts), vendors/suppliers, purchase orders, monthly spend, or low-stock
// alerts for Warp/Resham/Jari — InventoryModule (backend/src/inventory/) is
// an unrelated domain (finished-saree inventory: QC-passed/finishing/
// dispatch), not raw-material stock. Until such a module exists, the
// constants below (BATCH_DATA, MAT_CARDS, ALERTS, VENDOR_DATA, MONTHLY_DATA,
// SPEND_DATA, RECENT_DATA, MOVEMENT_ENTRIES, MOVE_CHART_DATA, HISTORY_ENTRIES,
// MATERIAL_METRICS) stay mock — wiring them to a nonexistent endpoint would
// just be a differently-shaped mock, and inventing numbers against no source
// of truth would be worse than leaving them clearly labeled as placeholders.
import React from "react";
import { AlertTriangle, CheckCircle2, Archive } from "lucide-react";
import { imgWarp, imgResham, imgJari } from "../../../shared/constants/imageData";
import { T } from "./theme";
import type {
  BatchRow, StatusType, WeaverStatus, StatusCfgEntry, TagStyle, WeaverStatusCfgEntry,
} from "./types";

/**
 * STATUS_CFG, MAT_TAG, and W_STATUS were each independently redeclared,
 * identically, inside 3-5 different modal/section functions in the original
 * 3,099-line MaterialsPage.tsx. Consolidated here as the single source of
 * truth — every consumer imports from this file instead of recreating it.
 */
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

export const BATCH_DATA: BatchRow[] = [];

export const MAT_FILTERS = ["All Materials", "Warp Only", "Resham Only", "Jari Only"];
export const STATUS_FILTERS = ["All Status", "In Stock", "Running Low", "Very Low", "All Used Up"];
export const STATUS_FILTER_MAP: Record<string, StatusType | null> = {
  "All Status": null,
  "In Stock": "good",
  "Running Low": "warning",
  "Very Low": "critical",
  "All Used Up": "empty",
};

export const MATERIAL_METRICS = [
  { label: "Total In Stock",   val: "0", sub: "kg Warp & Resham",  hi: false },
  { label: "Warp Available",   val: "0", sub: "0 sarees", hi: false },
  { label: "Resham Available", val: "0", sub: "0 colors",          hi: false },
  { label: "Jari Alerts",      val: "0 Buns", sub: "0 Reels", hi: true },
];

export const ALERTS: any[] = [];

export const MAT_CARDS = [
  { name: "Warp",   desc: "Base Thread used for weaving · Cotton and Silk types",                  stock: "0 kg in stock",     note: "0 sarees possible", pct: 0, barColor: T.royalBurgundy, stockColor: T.antiqueGold, badge: "No stock recorded", green: true,  img: imgWarp,   extra: null as React.ReactNode },
  { name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",             stock: "0 kg in stock",     note: "0 colours available",         pct: 0, barColor: T.antiqueGold,   stockColor: T.antiqueGold, badge: "No stock recorded", green: true,  img: imgResham,
    extra: React.createElement("div", { style: { display: "flex", gap: 8, margin: "10px 0 6px" } }) as React.ReactNode },
  { name: "Jari",   desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types", stock: "0 Buns", note: "Polyester and Silk Fast",    pct: 0, barColor: T.crimson,       stockColor: T.crimson,     badge: "No stock recorded", green: false, img: imgJari,
    extra: React.createElement("div", { style: { display: "flex", gap: 8, margin: "10px 0 6px" } }) as React.ReactNode },
];

export const VENDOR_DATA: any[] = [];

export const MONTHLY_DATA: any[] = [];

export const SPEND_DATA: any[] = [];

export const RECENT_DATA: any[] = [];

export const MOVEMENT_ENTRIES: any[] = [];

export const MOVE_CHART_DATA: any[] = [];

export const HISTORY_ENTRIES: any[] = [];

export const FOOTER_LINKS = {
  "Quick Links": ["Overview", "Materials", "Weavers", "Production", "Payments", "Reports", "Customers"],
  "Company":     ["About Us", "Our Story", "Awards", "Blog"],
  "Support":     ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use"],
};
