
import React from 'react';
import { imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../../../../shared/constants/imageData";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../../shared/constants/weaverImages";

const T = {
  silkCream:      semantic.surface.canvas,
  warmIvory:      semantic.surface.raised,
  royalBurgundy:  brand.burgundy[900],
  darkBurgundy:   "#3D0E1A",
  deepWine:       brand.burgundy[950],
  antiqueGold:    brand.gold[500],
  goldLight:      "#E7C983",
  luxuryBrown:    "#3B2314",
  ivoryCream:     "#F7F2EA",
  pureWhite:      "#FFFDF9",
  crimson:        semantic.text.danger,
  mahogany:       "#4A061B",
  gold:           "#C89B47",
  deepBlack:      "#3B2314",
  burgundy:       "#3D2030",
  taupe:          semantic.text.tertiary,
  warmCream:      "#F5E8D0",
  green:          semantic.text.success,
  borderDef:      "rgba(110,15,45,0.10)",
  borderMed:      "rgba(110,15,45,0.20)",
  borderGold:     "rgba(200,155,71,0.22)",
  bgSuccess:      "rgba(30,102,64,0.10)",
  bgWarning:      "rgba(110,15,45,0.10)",
  bgAlert:        "rgba(110,15,45,0.18)",
  bgGold:         "rgba(200,155,71,0.15)",
};

const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

const NUM: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

const G = {
  hero   : "linear-gradient(135deg, #4A061B 0%, #6E0F2D 45%, #C89B47 100%)",
  card   : "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold   : "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button : "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};

const DARK_MAROON = "#3D1020";

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];


import { LayoutDashboard, Factory, Package, IndianRupee, Users, Settings2 } from "lucide-react";

import { brand, fonts, semantic } from '@/design-system/tokens';
export type NavPage = { key: string; label: string };
export type NavGroup = { key: string; label: string; icon: React.ElementType; pages: NavPage[] };

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_GROUPS: NavGroup[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, pages: [
      { key: "Overview", label: "Overview" },
  ]},
  { key: "production", label: "Production", icon: Factory, pages: [
      { key: "Production", label: "Production" },
      { key: "Batches",    label: "Batches" },
      { key: "Designs",    label: "Designs" },
      { key: "Finishing",  label: "Finishing" },
  ]},
  { key: "materials", label: "Materials", icon: Package, pages: [
      { key: "Materials",         label: "Materials" },
      { key: "ReceiveStock",      label: "Receive Stock" },
      { key: "IssueMaterial",     label: "Issue Material" },
      { key: "ReturnMaterial",    label: "Return Materials" },
      { key: "ExternalPurchases", label: "External Purchases" },
  ]},
  { key: "finance", label: "Finance", icon: IndianRupee, pages: [
      { key: "Payments", label: "Payments" },
      { key: "Firms",    label: "Firms" },
      { key: "Reports",  label: "Reports" },
  ]},
  { key: "people", label: "People", icon: Users, pages: [
      { key: "Weavers",       label: "Weavers" },
      { key: "Customers",     label: "Customers" },
      { key: "Vendors",       label: "Vendors" },
      { key: "Suppliers",     label: "Suppliers" },
      { key: "FactoryLooms",  label: "Factory Looms" },
      { key: "AddUser",       label: "Add New User" },
  ]},
  { key: "operations", label: "Operations", icon: Settings2, pages: [
      { key: "Inventory",     label: "Inventory" },
      { key: "Rates",         label: "Rates & Pricing" },
      { key: "Notifications", label: "Notifications" },
  ]},
];

// Drill-down pages reachable from within a page but not shown as their own nav pill —
// mapped to the group whose bar should stay highlighted while viewing them.
const NAV_GROUP_FALLBACK: Record<string, string> = {
  AllWeavers: "people",
  AllStock:   "materials",
  AllOrders:  "production",
};

function findNavGroup(pageKey: string): NavGroup {
  const direct = NAV_GROUPS.find(g => g.pages.some(p => p.key === pageKey));
  if (direct) return direct;
  const fallback = NAV_GROUP_FALLBACK[pageKey];
  return NAV_GROUPS.find(g => g.key === fallback) ?? NAV_GROUPS[0];
}


const GLOBAL_STYLE = `
  /* Override ALL Tailwind v4 oklch CSS variables with hex/rgb equivalents
     so Motion never reads oklch when sampling computed styles for animation */
  :root {
    --foreground: #1F1209;
    --card: #ffffff;
    --card-foreground: #1F1209;
    --popover: #ffffff;
    --popover-foreground: #1F1209;
    --primary-foreground: #ffffff;
    --secondary: #f1f1f5;
    --ring: rgb(139,112,96);
    --sidebar: #fafafa;
    --sidebar-foreground: #1F1209;
    --sidebar-primary-foreground: #fafafa;
    --sidebar-accent: #f5f5f5;
    --sidebar-accent-foreground: #2a2a2a;
    --sidebar-border: #e8e8e8;
    --sidebar-ring: rgb(139,112,96);
    --chart-1: rgb(200,120,60);
    --chart-2: rgb(60,160,140);
    --chart-3: rgb(50,90,140);
    --chart-4: rgb(200,180,60);
    --chart-5: rgb(200,160,50);
    --tw-shadow: 0 0 rgba(0,0,0,0);
    --tw-shadow-colored: 0 0 rgba(0,0,0,0);
    --tw-ring-shadow: 0 0 rgba(0,0,0,0);
    --tw-ring-color: rgba(139,112,96,0.5);
  }
  body {
    color: #3B2314;
  }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #F7F2EA; }
  ::-webkit-scrollbar-thumb { background: rgba(110,15,45,0.16); border-radius: 3px; }

  body, input, textarea, select {
    font-family: 'Manrope', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .dms { font-family: 'DM Serif Display', serif; }

  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.55); opacity: 0.55; }
  }
  .pulse-dot { animation: pulse-ring 2.2s ease-in-out infinite; }

  @keyframes gold-shimmer {
    0% { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  .gold-bar-shimmer {
    background: linear-gradient(90deg, #C89B47 0%, #E7C983 30%, #FFFDF9 50%, #E7C983 70%, #C89B47 100%);
    background-size: 300%;
    animation: gold-shimmer 3s linear infinite;
    opacity: 0.72;
  }

`;


export { T, F, NUM, G, DARK_MAROON, EASE, NAV_GROUPS, NAV_GROUP_FALLBACK, GLOBAL_STYLE, findNavGroup };
