// ═══════════════════════════════════════════════════════════════════════════════
// SECTION NAVIGATOR — shared sticky "jump to section" pill bar for long pages
// Used by both BeereDashboard (Admin) and SuperadminDashboard.
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  royalBurgundy: "#6E0F2D",
  taupe: "#69635E",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = {
  ui: "'Inter', sans-serif",
};

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
export const MOBILE_NAV_H = 64;    // was 60  — --shell-mobilenav-h

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
    { id: "wqc-defective", label: "Defective" },
  ],
  ShopSalesReport: [
    { id: "shoprep-today-sales", label: "Today's Sales" },
    { id: "shoprep-monthly-totals", label: "Monthly Totals" },
    { id: "shoprep-top-customers", label: "Top Customers" },
    { id: "shoprep-by-design", label: "Sales by Design" },
    { id: "shoprep-returns", label: "Returns" },
  ],
};

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

// Find the element that's actually doing the scrolling for this page. In
// this app that's sometimes `document.body` rather than the window/
// documentElement (window.scrollY stays 0 while body.scrollTop moves), so
// window.scrollTo() alone silently does nothing. Walk up from the target
// looking for the nearest ancestor whose content overflows its box.
const findScrollContainer = (el: HTMLElement): HTMLElement | null => {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    if (node.scrollHeight > node.clientHeight + 1) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll" || node === document.body) return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
};
