import {
  Users, IndianRupee,
  LayoutDashboard, Factory, Package, Settings2,
} from "lucide-react";
import type { IconComponent } from "../../../../lib/icon";
import { imgWarp, imgResham, imgJari } from "../../../../shared/constants/imageData";
import { T } from "./theme";

// NOTE: the SA_METRICS, WEAVERS, and WEAVER_RATES exports that used to live
// here (hardcoded "9 active weavers"/"248 sarees"/fake per-weaver rate
// lookup) have been removed as dead mock data — nothing in this dashboard
// imported them (the real overview metrics come from the shared
// useDashboardMetrics/useDashboardWeavers hooks used elsewhere in this
// sweep). MATS below stays static mock data — see the documented gap note
// in SAOverviewPage.tsx: raw-material stock has no backend module yet.

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
    name: "Jari", sub: "Metallic Thread · Gold & Silver", stock: "9 Reels (36 Buns)", pct: 30, note: "3 types available", alert: true, img: imgJari,
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
      { key: "ReturnMaterial", label: "Return Materials" },
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
