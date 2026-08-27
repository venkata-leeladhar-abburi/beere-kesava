// ═══════════════════════════════════════════════════════════════════════════════
// SECTION NAVIGATOR — shared sticky "jump to section" pill bar for long pages
// Used by both BeereDashboard (Admin) and SuperadminDashboard.
// ═══════════════════════════════════════════════════════════════════════════════
// Sticky-stack layout constants — re-pointed at the app-shell tokens in
// design-system/02-LAYOUT.md Part C.2 (single source of truth: 4 base
// heights, not 9 independently-drifting ones). Names are UNCHANGED from
// before this migration so every existing import keeps working — only the
// values moved. This is also the fix for the documented SUB_NAV_H bug: the
// admin dashboard's TopNav used to shadow this with its own local
// `const SUB_NAV_H = 60`, 6px off from this file's old value of 66; that
// shadow has been removed (see beere-dashboard/components/TopNav.tsx) so
// every consumer now derives from this one constant, currently 52.
export const MAIN_NAV_H = 72;      // was 90  — --shell-topbar-h
export const SUB_NAV_H = 52;       // was 66  — --shell-groupbar-h
export const SECTION_NAV_H = 48;   // was 56  — --shell-sectionbar-h
export const MOBILE_NAV_H = 60;    // 60px exact match for MobileTopNav height

// Worker portal — previously its own independent heights; now the same
// shell geometry as everything else, aliased under its existing names.
export const WORKER_MOBILE_HEADER_H = 56;
export const WORKER_TOPNAV_H = MAIN_NAV_H;
export const WORKER_SECTION_NAV_H = SECTION_NAV_H;

// Shop Staff portal — same alignment.
export const SHOP_MOBILE_HEADER_H = 56;
export const SHOP_SECTION_NAV_H = SECTION_NAV_H;

export interface SectionNavItem { id: string; label: string; }

export const PAGE_SECTIONS: Record<string, SectionNavItem[]> = {
  Production: [
    { id: "prod-bulk-orders", label: "Bulk Orders" },
    { id: "prod-active-batches", label: "Active Batches" },
    { id: "prod-defective", label: "Defective Sarees" },
    { id: "prod-analytics", label: "Analytics" },
    { id: "prod-history", label: "Production History" },
  ],
  Materials: [
    { id: "mat-alerts", label: "Stock Alerts" },
    { id: "mat-po-tracker", label: "Purchase Orders" },
    { id: "mat-stock-overview", label: "Current Stock" },
    { id: "mat-issued", label: "Issued to Weavers" },
    { id: "mat-purchase-history", label: "Purchase History" },
    { id: "mat-recent", label: "Recently Received" },
    { id: "mat-movement", label: "Movement History" },
  ],
  Payments: [
    { id: "pay-summary", label: "Financial Summary" },
    { id: "pay-making-charges", label: "Making Charges" },
    { id: "pay-wholesale", label: "Wholesale Collections" },
    { id: "pay-vendor", label: "Vendor Payments" },
    { id: "pay-analytics", label: "Analytics" },
    { id: "pay-history", label: "Payment History" },
  ],
  Reports: [],
  Weavers: [
    { id: "weav-all-weavers", label: "All Weavers" },
    { id: "weav-performance", label: "Performance" },
    { id: "weav-activities", label: "Activities" },
  ],
  WorkerQC: [
    { id: "wqc-pending", label: "Pending QC" },
    { id: "wqc-completed", label: "Completed Today" },
    { id: "wqc-semi-defective", label: "Semi Defective" },
    { id: "wqc-defective", label: "Defective" },
    { id: "wqc-history", label: "QC History" },
  ],
  ShopSalesReport: [
    { id: "shoprep-today-sales", label: "Today's Sales" },
    { id: "shoprep-monthly-totals", label: "Monthly Totals" },
    { id: "shoprep-top-customers", label: "Top Customers" },
    { id: "shoprep-by-design", label: "Sales by Design" },
    { id: "shoprep-returns", label: "Returns" },
  ],
};

export function getSectionsForPage(nav: string): SectionNavItem[] {
  if (PAGE_SECTIONS[nav] && PAGE_SECTIONS[nav].length > 0) {
    return PAGE_SECTIONS[nav];
  }
  const aliases: Record<string, string> = {
    Batches: "Production",
    Designs: "Production",
    Finishing: "Production",
    ReceiveStock: "Materials",
    IssueMaterial: "Materials",
    ReturnMaterial: "Materials",
    ExternalPurchases: "Materials",
    SupplierReturns: "Materials",
    Firms: "Payments",
    Reports: "Payments",
    Customers: "Weavers",
    Vendors: "Weavers",
    Suppliers: "Weavers",
    FactoryLooms: "Weavers",
    AllWeavers: "Weavers",
  };
  const parentKey = aliases[nav];
  if (parentKey && PAGE_SECTIONS[parentKey]) {
    return PAGE_SECTIONS[parentKey];
  }
  return PAGE_SECTIONS[nav] || [];
}

// Global CSS needed by SectionNavigator — render once per dashboard root.
export const SECTION_NAV_GLOBAL_STYLE = `
  .section-nav-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(110,15,45,0.32) transparent;
  }
  .section-nav-scroll::-webkit-scrollbar {
    height: 4px;
    display: block !important;
  }
  .section-nav-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .section-nav-scroll::-webkit-scrollbar-thumb {
    background: rgba(110,15,45,0.32);
    border-radius: 4px;
  }
  .section-nav-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(110,15,45,0.60);
  }

  /* scroll-margin-top: sticky navbars height + 16px breathing room so the
     section heading always lands cleanly below the last sticky bar. */
  [id^="prod-"], [id^="mat-"], [id^="pay-"], [id^="rep-"], [id^="weav-"] {
    scroll-margin-top: ${MOBILE_NAV_H + SECTION_NAV_H + 16}px;
  }
  @media (min-width: 768px) {
    [id^="prod-"], [id^="mat-"], [id^="pay-"], [id^="rep-"], [id^="weav-"] {
      scroll-margin-top: ${MAIN_NAV_H + SUB_NAV_H + 16}px;
    }
  }

  [id^="wqc-"] {
    scroll-margin-top: ${WORKER_MOBILE_HEADER_H + WORKER_SECTION_NAV_H + 16}px;
  }
  @media (min-width: 768px) {
    [id^="wqc-"] {
      scroll-margin-top: ${WORKER_TOPNAV_H + WORKER_SECTION_NAV_H + 16}px;
    }
  }

  [id^="shoprep-"] {
    scroll-margin-top: ${SHOP_MOBILE_HEADER_H + SHOP_SECTION_NAV_H + 16}px;
  }
`;

