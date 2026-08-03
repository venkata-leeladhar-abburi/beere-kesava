import { imgPadmaVeni, imgRaviKumar, imgSureshMurti } from "../../../../shared/constants/weaverImages";
import { T_burgundy, T_gold, T_brown } from "./tokens";

// ─── Data ─────────────────────────────────────────────────────────────────────
export const PO_DATA = [
  {
    id: "PO-2026-022", raised: "2 days ago",
    vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",
    materials: [
      { label: "Warp", qty: "50 kg", icon: "pkg" },
    ],
    estimated: "₹1,40,000",
    stock: "Warp 142 kg",
    raisedBy: "Admin (BK)",
  },
  {
    id: "PO-2026-021", raised: "1 day ago",
    vendor: "Kanchipuram Silks", vendorCity: "Kanchipuram, TN",
    materials: [
      { label: "Resham Red", qty: "30 kg", icon: "tag" },
      { label: "Resham Gold", qty: "25 kg", icon: "tag" },
    ],
    estimated: "₹3,75,000",
    stock: "Resham Red 22 kg · Resham Gold 15 kg",
    raisedBy: "Admin (RK)",
  },
  {
    id: "PO-2026-020", raised: "Today",
    vendor: "Surat Zari Works", vendorCity: "Surat, GJ",
    materials: [
      { label: "Jari PLY 2G Gold", qty: "6 Buns (24 Reels)", icon: "layers" },
      { label: "Jari SF 1G Silver", qty: "4 Buns (16 Reels)", icon: "layers" },
    ],
    estimated: "₹1,92,000",
    stock: "PLY-2G-Gold 8 Buns · SF-1G-Silver 2 Buns",
    raisedBy: "Admin (MK)",
  },
];

export const WARP_DATA = [
  {
    id: "W001", name: "Ravi Kumar", code: "WV-001", photo: imgRaviKumar,
    batch: "BATCH-089", raised: "2 days ago",
    material: "3 kg Warp", reason: "Extra sarees for Lakshmi Silks order",
    done: 4, total: 8, pct: 50, qualifies: true,
    design: "BKB-045 · Self Brocade · SB-001 · ₹450/saree",
    stock: "Warp 142 kg — enough to fulfil this request",
  },
  {
    id: "W002", name: "Padma Veni", code: "WV-002", photo: imgPadmaVeni,
    batch: "BATCH-086", raised: "1 day ago",
    material: "2 kg Warp + Resham Red 500g", reason: "Design change by admin",
    done: 3, total: 5, pct: 60, qualifies: true,
    design: "BKB-031 · Heavy Zari · HZ-003",
    stock: "Warp 142 kg · Resham Red 22 kg available",
  },
  {
    id: "W003", name: "Suresh Murti", code: "WV-007", photo: imgSureshMurti,
    batch: "BATCH-081", raised: "Today",
    material: "4 kg Warp", reason: "More sarees for stock",
    done: 2, total: 4, pct: 50, qualifies: true,
    design: "BKB-022 · Plain Silk · PS-002",
    stock: "Warp 142 kg available",
  },
];

export const RATE_DATA = [
  {
    id: "R001",
    sareeType: "Self Brocade", code: "SB-001",
    currentRate: "₹420", requestedRate: "₹450", diff: "+₹30",
    raisedBy: "Admin (BK)", raised: "3 days ago",
    reason: "Market rate increase — raw material costs have gone up",
  },
  {
    id: "R002",
    sareeType: "Heavy Zari", code: "HZ-003",
    currentRate: "₹650", requestedRate: "₹680", diff: "+₹30",
    raisedBy: "Admin (MK)", raised: "1 day ago",
    reason: "Weaver demand — skilled weavers asking for higher rate",
  },
];

export const HISTORY_ROWS = [
  { date: "10 Jun 2026 · 10:30 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (BK)",   details: "PO-2026-019 · Sri Venkateswara · ₹1,28,000",   decision: "Approved" },
  { date: "10 Jun 2026 · 10:15 AM", type: "Warp Request",   typeColor: T_gold,     by: "Weaver (KB)",  details: "Kamala B. · BATCH-079 · 2 kg Warp",            decision: "Approved" },
  { date: "09 Jun 2026 · 3:45 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (MK)",   details: "Plain Silk PS-002 · ₹260 → ₹280",              decision: "Approved" },
  { date: "09 Jun 2026 · 2:20 PM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (LD)",  details: "Lakshmi D. · BATCH-077 · 3 kg Warp",           decision: "Rejected" },
  { date: "08 Jun 2026 · 11:00 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (RK)",   details: "PO-2026-018 · Mysore Silk Co. · ₹1,20,000",    decision: "Approved" },
  { date: "08 Jun 2026 · 9:30 AM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (VR)",  details: "Venkat Rao · BATCH-074 · 4 kg Warp",           decision: "Rejected" },
  { date: "07 Jun 2026 · 4:10 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (BK)",   details: "Bridal Special BS-004 · ₹1,150 → ₹1,200",     decision: "Approved" },
  { date: "07 Jun 2026 · 2:00 PM",  type: "Purchase Order", typeColor: T_burgundy, by: "Admin (MK)",   details: "PO-2026-017 · Surat Zari Works · ₹1,60,000",  decision: "Approved" },
  { date: "06 Jun 2026 · 10:45 AM", type: "Warp Request",   typeColor: T_gold,     by: "Weaver (AK)",  details: "Anand K. · BATCH-071 · 2 kg Warp",             decision: "Approved" },
  { date: "05 Jun 2026 · 3:30 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (RK)",   details: "Light Cotton LC-005 · ₹200 → ₹220",            decision: "Approved" },
  { date: "04 Jun 2026 · 11:20 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (BK)",   details: "PO-2026-016 · Kanchipuram Silks · ₹2,80,000", decision: "Rejected" },
  { date: "03 Jun 2026 · 9:00 AM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (MR)",  details: "Meena R. · BATCH-068 · 3 kg Warp",             decision: "Rejected" },
];
