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
  received: { border: "#8B7060", badge: "📦 Received",                      badgeBg: "rgba(139,112,96,0.10)", badgeColor: "#8B7060", label: "Received" },
};

export const BATCH_IMG: Record<string, string> = { Warp: imgWarp, Resham: imgResham, Jari: imgJari };

export const BATCH_DATA: BatchRow[] = [
  { id: "SRI-WARP-001",          type: "Warp",   details: "Cotton / Silk",             vendor: "Sri Venkateswara Textiles", date: "01 May 2026", received: 50, given: 8,  remaining: 42, statusType: "good"     },
  { id: "KANCH-RESH-001",        type: "Resham", details: "Silk · Red",                vendor: "Kanchipuram Silks",         date: "02 May 2026", received: 30, given: 5,  remaining: 25, statusType: "good"     },
  { id: "SURAT-PLY2GGOLD-001",   type: "Jari",   details: "Polyester · 2G · Gold",     vendor: "Surat Zari Works",          date: "01 May 2026", received: 8,  given: 3,  remaining: 5,  statusType: "good"     },
  { id: "LAKSH-WARP-001",        type: "Warp",   details: "Cotton / Silk",             vendor: "Lakshmi Thread House",      date: "28 Apr 2026", received: 40, given: 30, remaining: 10, statusType: "warning"  },
  { id: "MYSOR-RESH-001",        type: "Resham", details: "Silk · Gold",               vendor: "Mysore Silk Co.",           date: "28 Apr 2026", received: 25, given: 20, remaining: 5,  statusType: "critical" },
  { id: "SURAT-PLY1GSLVR-002",   type: "Jari",   details: "Polyester · 1G · Silver",   vendor: "Surat Zari Works",          date: "28 Apr 2026", received: 3,  given: 1,  remaining: 2,  statusType: "warning"  },
  { id: "SRI-WARP-002",          type: "Warp",   details: "Cotton / Silk",             vendor: "Sri Venkateswara Textiles", date: "20 Apr 2026", received: 35, given: 35, remaining: 0,  statusType: "empty"    },
  { id: "KANCH-RESH-002",        type: "Resham", details: "Silk · Blue",               vendor: "Kanchipuram Silks",         date: "15 Apr 2026", received: 28, given: 18, remaining: 10, statusType: "warning"  },
  { id: "SURAT-PLY3GCPPR-001",   type: "Jari",   details: "Polyester · 3G · Copper",   vendor: "Surat Zari Works",          date: "01 May 2026", received: 4,  given: 2,  remaining: 2,  statusType: "good"     },
  { id: "VARA-SF2GGOLD-001",     type: "Jari",   details: "Silk Fast · 2G · Gold",     vendor: "Varanasi Zari House",       date: "28 Apr 2026", received: 6,  given: 2,  remaining: 4,  statusType: "good"     },
  { id: "VARA-SF1GBLUE-001",     type: "Jari",   details: "Silk Fast · 1G · Blue",     vendor: "Varanasi Zari House",       date: "28 Apr 2026", received: 2,  given: 1,  remaining: 1,  statusType: "critical" },
  { id: "VARA-SF3GPINK-001",     type: "Jari",   details: "Silk Fast · 3G · Pink",     vendor: "Varanasi Zari House",       date: "01 May 2026", received: 3,  given: 1,  remaining: 2,  statusType: "warning"  },
  { id: "KANCH-RESH-GRN-001",    type: "Resham", details: "Silk · Green",              vendor: "Kanchipuram Silks",         date: "28 Apr 2026", received: 22, given: 20, remaining: 2,  statusType: "critical" },
];

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
  { label: "Total In Stock",   val: "322", sub: "kg Warp & Resham",  hi: false },
  { label: "Warp Available",   val: "142", sub: "approx 284 sarees", hi: false },
  { label: "Resham Available", val: "180", sub: "6 colors",          hi: false },
  { label: "Jari Alerts",      val: "36 Buns", sub: "(144 Reels) · some colors low", hi: true },
];

export const ALERTS = [
  { type: "WARP",   current: "4 kg", minimum: "10 kg", pct: 40 },
  { type: "RESHAM", current: "2 kg", minimum: "8 kg",  pct: 25 },
  { type: "JARI",   current: "4 Buns (16 Reels)", minimum: "20 Buns (80 Reels)", pct: 20 },
];

export const MAT_CARDS = [
  { name: "Warp",   desc: "Base Thread used for weaving · Cotton and Silk types",                  stock: "142 kg in stock",     note: "You can make approximately 284 sarees with this", pct: 72, barColor: T.royalBurgundy, stockColor: T.antiqueGold, badge: "✓ Stock is Healthy", green: true,  img: imgWarp,   extra: null as React.ReactNode },
  { name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",             stock: "180 kg in stock",     note: "6 different colours currently available",         pct: 85, barColor: T.antiqueGold,   stockColor: T.antiqueGold, badge: "✓ Stock is Healthy", green: true,  img: imgResham,
    extra: React.createElement("div", { style: { display: "flex", gap: 8, margin: "10px 0 6px" } }, ["#B22222", "#C89B47", "#1E5C8A", "#2D6B3A", "#8B008B", "#E8DCCB"].map((c, i) => React.createElement("div", { key: i, style: { width: 18, height: 18, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.10)" } }))) as React.ReactNode },
  { name: "Jari",   desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types", stock: "36 Buns (144 Reels)", note: "Polyester and Silk Fast · 5 Grades · 6 Colors",    pct: 30, barColor: T.crimson,       stockColor: T.crimson,     badge: "⚠ Some Types Are Low — Check Alerts", green: false, img: imgJari,
    extra: React.createElement("div", { style: { display: "flex", gap: 8, margin: "10px 0 6px" } }, ["Polyester", "Silk Fast"].map(p => React.createElement("span", { key: p, style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" as const, background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 6, padding: "4px 10px" } }, p))) as React.ReactNode },
];

export const VENDOR_DATA = [
  { name: "Sri Venkateswara Textiles", materials: [{ type: "Warp", label: "Warp" }, { type: "Jari", label: "Jari" }], totals: ["1,200 kg", "2 Buns (8 Reels)"], price: "₹280 per kg",   paid: "₹3,36,000",  orders: 12, last: "01 May 2026" },
  { name: "Lakshmi Thread House",      materials: [{ type: "Warp", label: "Warp" }],       totals: ["1,640 kg"], price: "₹275 per kg",   paid: "₹4,51,000",  orders: 18, last: "28 Apr 2026" },
  { name: "Kanchipuram Silks",         materials: [{ type: "Resham", label: "Resham" }],      totals: ["820 kg"],   price: "₹1,500 per kg", paid: "₹12,30,000", orders: 22, last: "02 May 2026" },
  { name: "Mysore Silk Co.",           materials: [{ type: "Resham", label: "Resham" }], totals: ["420 kg"],   price: "₹1,480 per kg", paid: "₹6,21,600",  orders: 14, last: "28 Apr 2026" },
  { name: "Surat Zari Works",          materials: [{ type: "Jari", label: "Jari" }],   totals: ["24 Buns (96 Reels)"],   price: "—", paid: "₹15,36,000", orders: 16, last: "01 May 2026" },
  { name: "Varanasi Zari House",       materials: [{ type: "Jari", label: "Jari" }],   totals: ["10 Buns (40 Reels)"],   price: "—",  paid: "₹9,12,000",  orders: 8,  last: "28 Apr 2026" },
];

export const MONTHLY_DATA = [
  { month: "Dec", Warp: 420, Resham: 180, Jari: 90  },
  { month: "Jan", Warp: 480, Resham: 200, Jari: 110 },
  { month: "Feb", Warp: 510, Resham: 230, Jari: 130 },
  { month: "Mar", Warp: 400, Resham: 190, Jari: 100 },
  { month: "Apr", Warp: 460, Resham: 220, Jari: 120 },
  { month: "May", Warp: 570, Resham: 220, Jari: 130 },
];

export const SPEND_DATA = [
  { name: "Warp",   pct: 25, value: "₹14,20,000", color: T.royalBurgundy },
  { name: "Resham", pct: 32, value: "₹18,60,000", color: T.antiqueGold   },
  { name: "Jari",   pct: 43, value: "₹24,48,000", color: T.luxuryBrown   },
];

export const RECENT_DATA = [
  { date: "01 May 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", description: "Cotton/Silk",       quantity: "50 kg",  po: "PO-SVT-2026-042", type: "Warp"   },
  { date: "02 May 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", description: "Red + Blue",        quantity: "58 kg",  po: "PO-KNC-2026-118", type: "Resham" },
  { date: "01 May 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", description: "Polyester 2G Gold", quantity: "5 Buns", po: "PO-SZW-2026-033", type: "Jari"   },
  { date: "28 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", description: "Gold",              quantity: "25 kg",  po: "PO-MSC-2026-056", type: "Resham" },
];

export const MOVEMENT_ENTRIES = [
  { type: "in" as const,  desc: "50 kg of Warp (Cotton/Silk) was received from Sri Venkateswara Textiles",    ref: "GRN-WRP-SVT-20260501-001", time: "01 May 2026, 10:30 AM" },
  { type: "out" as const, desc: "Warp 4.5 kg, Resham 1.2 kg and Jari 200g was given to Padma Veni for weaving", ref: "ISS-PV-BATCH086-20260501",  time: "01 May 2026, 02:15 PM" },
  { type: "in" as const,  desc: "30 kg of Resham (Red and Blue) was received from Kanchipuram Silks",          ref: "GRN-RSM-KNC-20260430-001", time: "30 Apr 2026, 11:00 AM" },
  { type: "out" as const, desc: "Warp 6 kg, Resham 900g and Jari 250g was given to Ravi Kumar for weaving",    ref: "ISS-RK-BATCH089-20260429",  time: "29 Apr 2026, 09:45 AM" },
  { type: "in" as const,  desc: "20 kg of Jari Polyester 2G was received from Surat Zari Works",               ref: "GRN-JRI-SZW-20260428-001", time: "28 Apr 2026, 03:00 PM" },
  { type: "out" as const, desc: "Warp 3 kg, Resham 900g and Jari 150g was given to Suresh Murti for weaving",  ref: "ISS-SM-BATCH081-20260427",  time: "27 Apr 2026, 10:00 AM" },
  { type: "in" as const,  desc: "25 kg of Resham Gold was received from Mysore Silk Co.",                      ref: "GRN-RSM-MSC-20260426-001", time: "26 Apr 2026, 04:30 PM" },
  { type: "out" as const, desc: "Warp 5 kg, Resham 700g and Jari 200g was given to Anand K. for weaving",      ref: "ISS-AK-BATCH083-20260425",  time: "25 Apr 2026, 11:30 AM" },
];

export const MOVE_CHART_DATA = [
  { label: "1–7 May",      received: 80, given: 15 },
  { label: "24–30 Apr",    received: 45, given: 40 },
  { label: "17–23 Apr",    received: 60, given: 35 },
  { label: "10–16 Apr",    received: 40, given: 28 },
  { label: "3–9 Apr",      received: 55, given: 32 },
  { label: "26 Mar–2 Apr", received: 70, given: 22 },
];

export const HISTORY_ENTRIES = [
  { ref: "ISS-PV-BATCH086-20260501", weaver: "Padma Veni",   weaverId: "WV002", batch: "BATCH-086", materials: "Warp 4.5kg · Resham 1.2kg · Jari 6 Reels", date: "01 May 2026, 2:15 PM",  status: "Active" },
  { ref: "ISS-RK-BATCH089-20260429", weaver: "Ravi Kumar",   weaverId: "WV001", batch: "BATCH-089", materials: "Warp 6kg · Resham 900g · Jari 8 Reels",    date: "29 Apr 2026, 9:45 AM",  status: "Active" },
  { ref: "ISS-SM-BATCH081-20260427", weaver: "Suresh Murti", weaverId: "WV003", batch: "BATCH-081", materials: "Warp 3kg · Resham 900g · Jari 5 Reels",    date: "27 Apr 2026, 10:00 AM", status: "Quality Check" },
  { ref: "ISS-AK-BATCH083-20260425", weaver: "Anand K.",     weaverId: "WV005", batch: "BATCH-083", materials: "Warp 5kg · Resham 700g · Jari 6 Reels",    date: "25 Apr 2026, 11:30 AM", status: "Active" },
  { ref: "ISS-MR-BATCH085-20260423", weaver: "Meena R.",     weaverId: "WV004", batch: "BATCH-085", materials: "Warp 3.5kg · Resham 700g · Jari 5 Reels",  date: "23 Apr 2026, 2:00 PM",  status: "Overdue" },
  { ref: "ISS-RK-BATCH077-20260415", weaver: "Ravi Kumar",   weaverId: "WV001", batch: "BATCH-077", materials: "Warp 5.5kg · Resham 1.1kg · Jari 7 Reels", date: "15 Apr 2026, 9:00 AM",  status: "Completed" },
];

export const FOOTER_LINKS = {
  "Quick Links": ["Overview", "Materials", "Weavers", "Production", "Payments", "Reports", "Customers"],
  "Company":     ["About Us", "Our Story", "Awards", "Blog"],
  "Support":     ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use"],
};
