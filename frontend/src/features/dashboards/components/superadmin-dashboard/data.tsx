import React from "react";
import {
  Users, Layers, IndianRupee, CheckCircle2, Truck, Clock,
  LayoutDashboard, Factory, Package, Settings2,
} from "lucide-react";
import type { IconComponent } from "../../../../lib/icon";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../../shared/constants/weaverImages";
import { imgWarp, imgResham, imgJari } from "../../../../shared/constants/imageData";
import { T } from "./theme";

// ═══════════════════════════════════════════════════════════════════════════════
// SA METRICS DATA
// ═══════════════════════════════════════════════════════════════════════════════
export const SA_METRICS = [
  { ico: <Users size={22} color={T.warmCream} />, label: "Active Weavers", val: "9", sub: "↑ 12% vs last month", hi: false },
  { ico: <Layers size={22} color={T.warmCream} />, label: "Sarees Produced", val: "248", sub: "↑ 14% vs last month", hi: false },
  { ico: <IndianRupee size={22} color={T.warmCream} />, label: "Pending Payments", val: "₹2.4L", sub: "2 overdue", hi: true },
  { ico: <CheckCircle2 size={22} color={T.warmCream} />, label: "Ready for Sale", val: "84", sub: "Sarees", hi: false },
  { ico: <Truck size={22} color={T.warmCream} />, label: "Dispatched", val: "32", sub: "Sarees this week", hi: false },
  { ico: <Clock size={22} color={T.warmCream} />, label: "Pending Approvals", val: "3", sub: "Require review", hi: false, crimsonHi: true },
];

export const WEAVERS = [
  { name: "Padma Veni",   id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", batch: "BATCH-086", sarees: 18, pct: 85, status: "active", ac: T.royalBurgundy, img: imgPadmaVeni, village: "Pochampally, Telangana", mobile: "×××× 8834", looms: 2, initials: "PV", bg: "#9B6B8A" },
  { name: "Ravi Kumar",   id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", batch: "BATCH-079", sarees: 12, pct: 68, status: "active", ac: "#1E6640",        img: imgRaviKumar, village: "Dharmavaram, AP", mobile: "×××× 4521", looms: 3, initials: "RK", bg: "#5A3E6B" },
  { name: "Suresh Murti", id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", batch: "BATCH-081", sarees: 7,  pct: 35, status: "qc",     ac: "#374151",        img: imgSureshMurti, village: "Venkatagiri, AP", mobile: "×××× 9982", looms: 2, initials: "SM", bg: "#2D6B6B" },
  { name: "Anand K.",     id: "71413724-378d-4336-93dd-1db33cba3510", batch: "BATCH-083", sarees: 9,  pct: 72, status: "active", ac: T.antiqueGold,    img: imgAnandK, village: "Pochampally, Telangana", mobile: "×××× 7723", looms: 2, initials: "AK", bg: "#4A6B4A" },
];

export const WEAVER_RATES: Record<string, { code: string; type: string; rate: string }> = {
  "b5f9178c-b1b9-4871-a7c3-0d68a462d57a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "8937070a-ea63-43f3-9cb4-dcbcfd362ff7": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "11278a51-a26d-4eaa-adbf-bedbfa7fdf46": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "71413724-378d-4336-93dd-1db33cba3510": { code: "PS-002", type: "Plain Silk", rate: "₹280/saree" },
};

export const MATS = [
  {
    name: "Warp", sub: "Base Thread · Cotton/Silk", stock: "142 kg", pct: 72, note: "248 sarees possible", alert: false, img: imgWarp,
    cardBg: "#FFFDF5", accent: T.antiqueGold, accentLight: "rgba(200,155,71,0.10)", borderColor: "rgba(200,155,71,0.20)", tagBg: "rgba(200,155,71,0.10)", tagCol: "#8A6B1F"
  },
  {
    name: "Resham", sub: "Silk Thread · Multiple Colors", stock: "180 kg", pct: 85, note: "6 colors in stock", alert: false, img: imgResham,
    cardBg: "#F8F6F4", accent: "#9E9189", accentLight: "rgba(158,145,137,0.10)", borderColor: "rgba(158,145,137,0.22)", tagBg: "rgba(158,145,137,0.10)", tagCol: "#6B5F58"
  },
  {
    name: "Jari", sub: "Metallic Thread · Gold & Silver", stock: "36 Buns (144 Reels)", pct: 30, note: "3 types available", alert: true, img: imgJari,
    cardBg: "#FFFDF9", accent: T.royalBurgundy, accentLight: "rgba(110,15,45,0.06)", borderColor: "rgba(110,15,45,0.16)", tagBg: "rgba(110,15,45,0.07)", tagCol: T.royalBurgundy
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SA TOP NAV — grouped (mirrors BeereDashboard's Admin TopNav, + gold accent)
// ═══════════════════════════════════════════════════════════════════════════════
export type NavPage = { key: string; label: string; sa?: boolean };
export type NavGroup = { key: string; label: string; icon: IconComponent; pages: NavPage[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "overview", label: "Overview", icon: LayoutDashboard, pages: [
      { key: "Overview", label: "Overview" },
    ]
  },
  {
    key: "production", label: "Production", icon: Factory, pages: [
      { key: "Production", label: "Production" },
      { key: "Batches", label: "Batches" },
      { key: "Designs", label: "Designs" },
      { key: "Finishing", label: "Finishing" },
    ]
  },
  {
    key: "materials", label: "Materials", icon: Package, pages: [
      { key: "Materials", label: "Materials" },
      { key: "ReceiveStock", label: "Receive Stock" },
      { key: "IssueMaterial", label: "Issue Material" },
      { key: "ExternalPurchases", label: "External Purchases" },
    ]
  },
  {
    key: "finance", label: "Finance", icon: IndianRupee, pages: [
      { key: "Payments", label: "Payments" },
      { key: "Firms", label: "Firms" },
      { key: "Reports", label: "Reports" },
    ]
  },
  {
    key: "people", label: "People", icon: Users, pages: [
      { key: "Weavers", label: "Weavers" },
      { key: "Customers", label: "Customers" },
      { key: "Vendors", label: "Vendors" },
      { key: "Suppliers", label: "Suppliers" },
      { key: "FactoryLooms", label: "Factory Looms" },
      { key: "AddUser", label: "Add New User" },
    ]
  },
  {
    key: "operations", label: "Operations", icon: Settings2, pages: [
      { key: "Inventory", label: "Inventory" },
      { key: "Rates", label: "Rates & Pricing" },
      { key: "Notifications", label: "Notifications" },
      { key: "Approvals", label: "Approvals", sa: true },
      { key: "AuditLog", label: "Audit Log", sa: true },
      { key: "LabelSettings", label: "Label Settings", sa: true },
    ]
  },
];

export function findNavGroup(pageKey: string): NavGroup {
  const direct = NAV_GROUPS.find(g => g.pages.some(p => p.key === pageKey));
  return direct ?? NAV_GROUPS[0];
}
