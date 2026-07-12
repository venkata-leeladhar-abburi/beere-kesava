import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION NAVIGATOR — shared sticky "jump to section" pill bar for long pages
// Used by both BeereDashboard (Admin) and SuperadminDashboard.
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  royalBurgundy: "#6E0F2D",
  taupe: "#8B7060",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = {
  ui: "'Inter', sans-serif",
};

// Sticky-stack layout constants — shared across both dashboards (identical navbars).
export const MAIN_NAV_H = 90;
export const SUB_NAV_H = 66;
export const SECTION_NAV_H = 56;
export const MOBILE_NAV_H = 60;

// Worker portal — different nav-bar heights, reuses this same component/pattern.
export const WORKER_MOBILE_HEADER_H = 56;
export const WORKER_TOPNAV_H = 72;
export const WORKER_SECTION_NAV_H = 52;

// Shop Staff portal — different nav-bar heights, reuses this same component/pattern.
export const SHOP_MOBILE_HEADER_H = 56;
export const SHOP_SECTION_NAV_H = 52;

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
  Reports: [
    { id: "rep-raw-materials", label: "Raw Materials" },
    { id: "rep-production", label: "Production" },
    { id: "rep-weaver-payments", label: "Weaver Payments" },
    { id: "rep-retail", label: "Retail Sales" },
    { id: "rep-wholesale", label: "Wholesale Sales" },
    { id: "rep-pnl", label: "P&L" },
    { id: "rep-customers", label: "Customers" },
    { id: "rep-overdue", label: "Overdue & Alerts" },
  ],
  Weavers: [
    { id: "weav-all-weavers", label: "All Weavers" },
    { id: "weav-performance", label: "Performance" },
    { id: "weav-activities", label: "Activities" },
  ],
  WorkerQC: [
    { id: "wqc-pending", label: "Pending QC" },
    { id: "wqc-in-progress", label: "In Progress" },
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

export function SectionNavigator({
  sections, stickyTop = 0, height = SECTION_NAV_H,
  activeColor = T.royalBurgundy, mutedColor = T.taupe, borderColor = T.borderDef,
  fontFamily = F.ui, padding = "0 40px", layoutId = "section-nav-active-pill",
  inline = false,
}: {
  sections: SectionNavItem[];
  stickyTop?: number;
  height?: number;
  activeColor?: string;
  mutedColor?: string;
  borderColor?: string;
  fontFamily?: string;
  padding?: string;
  layoutId?: string;
  inline?: boolean;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const stripRef = useRef<HTMLDivElement | null>(null);

  const horizontalScrollRafRef = useRef<number>(0);

  const smoothScrollHorizontal = (container: HTMLElement, targetX: number) => {
    if (horizontalScrollRafRef.current) cancelAnimationFrame(horizontalScrollRafRef.current);

    const startX = container.scrollLeft;
    const delta = targetX - startX;
    if (Math.abs(delta) < 1) return;

    const duration = 650; // ms: slow and smooth glide
    let startTime = -1;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      if (startTime < 0) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      container.scrollLeft = startX + delta * eased;

      if (progress < 1) {
        horizontalScrollRafRef.current = requestAnimationFrame(step);
      } else {
        container.scrollLeft = targetX;
        horizontalScrollRafRef.current = 0;
      }
    };

    horizontalScrollRafRef.current = requestAnimationFrame(step);
  };

  // Keep the active pill scrolled into view within its own horizontal strip.
  // We deliberately do NOT use pill.scrollIntoView() here: that scrolls every
  // scrollable ancestor (not just this strip) to bring the pill fully into
  // view, including — on some browsers — ancestors with `overflow: hidden`,
  // which shifts the entire page sideways and exposes the hidden overflow as
  // a blank gap. Scrolling only this strip's own scrollLeft avoids touching
  // any ancestor.
  useEffect(() => {
    const timer = setTimeout(() => {
      const pill = pillRefs.current[active];
      const strip = stripRef.current;
      if (!pill || !strip) return;
      const target = pill.offsetLeft + pill.offsetWidth / 2 - strip.clientWidth / 2;
      smoothScrollHorizontal(strip, Math.max(0, target));
    }, 60);

    return () => clearTimeout(timer);
  }, [active, sections.map(s => s.id).join("|")]);

  const isTransitioningRef = useRef(true);

  useEffect(() => {
    setActive(sections[0]?.id ?? "");
    pillRefs.current = {};
    isTransitioningRef.current = true;
    if (stripRef.current) {
      stripRef.current.scrollLeft = 0;
    }
    const timer = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 400);

    let observer: IntersectionObserver | null = null;
    let rafId = 0;
    let cancelled = false;

    // The target section elements may not exist in the DOM yet on this same tick —
    // e.g. when the page content is mounted inside an AnimatePresence(mode="wait")
    // that delays mounting until the previous page's exit transition finishes.
    // Poll a few frames until they show up (or give up after ~1s) before observing,
    // otherwise the observer silently watches nothing and `active` never updates.
    const trySetup = (attempt: number) => {
      if (cancelled) return;
      const els = sections
        .map(s => document.getElementById(s.id))
        .filter((el): el is HTMLElement => el !== null);

      if (els.length === sections.length || attempt > 60) {
        // Use a negative top rootMargin equal to the sticky nav height so that a
        // section is only marked active once its top edge has scrolled fully past
        // all sticky bars (otherwise the previous section remains "active" even
        // after the user has scrolled past its heading).
        const isMobileOrTablet = window.innerWidth <= 1024;
        const stickyH = inline
          ? (isMobileOrTablet ? MOBILE_NAV_H : MAIN_NAV_H + SUB_NAV_H)
          : (isMobileOrTablet ? MOBILE_NAV_H + SECTION_NAV_H : MAIN_NAV_H + SUB_NAV_H + SECTION_NAV_H);
        observer = new IntersectionObserver(
          () => {
            // Ignore observer callbacks during tab transition to prevent stale layout scroll positions from setting incorrect active tab
            if (isTransitioningRef.current) {
              setActive(sections[0]?.id ?? "");
              return;
            }

            // If we are at the very top of the page, force the active section to be the first one.
            const firstEl = document.getElementById(sections[0]?.id);
            const container = firstEl ? findScrollContainer(firstEl) : null;
            const scrollTop = container ? container.scrollTop : (window.scrollY || document.documentElement.scrollTop);
            if (scrollTop < 80) {
              setActive(sections[0]?.id ?? "");
              return;
            }

            // Find the topmost intersecting section by querying all observed elements
            const visible = sections
              .map(s => document.getElementById(s.id))
              .filter((el): el is HTMLElement => el !== null)
              .map(el => {
                const rect = el.getBoundingClientRect();
                const isIntersecting = rect.bottom > stickyH && rect.top < window.innerHeight * 0.6;
                return { id: el.id, top: rect.top, isIntersecting };
              })
              .filter(item => item.isIntersecting)
              .sort((a, b) => a.top - b.top);

            if (visible.length > 0) {
              setActive(visible[0].id);
            }
          },
          {
            rootMargin: `-${stickyH}px 0px -40% 0px`,
            threshold: 0,
          }
        );
        els.forEach(el => observer!.observe(el));
        return;
      }
      rafId = requestAnimationFrame(() => trySetup(attempt + 1));
    };
    trySetup(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      if (horizontalScrollRafRef.current) cancelAnimationFrame(horizontalScrollRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map(s => s.id).join("|"), inline]);



  // ─── Custom RAF smooth scroll ──────────────────────────────────────────────
  // Native browser scrollTo({ behavior:'smooth' }) is unreliable on mobile
  // and tablet (especially iOS Safari): it can stutter, overshoot, or feel
  // sluggish because the browser controls the duration and easing.
  // We drive the animation ourselves with requestAnimationFrame so we get a
  // consistent cubic-ease-out feel at the display's refresh rate on every device.
  const scrollRafRef = useRef<number>(0);

  const smoothScrollTo = (container: HTMLElement, targetY: number) => {
    // Cancel any in-flight scroll from a previous tap.
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);

    const startY = container.scrollTop;
    const delta = targetY - startY;
    if (Math.abs(delta) < 1) return;                 // already there

    // Shorter on desktop, longer on mobile/tablet for a luxurious glide feel.
    const isMobileOrTablet = window.innerWidth <= 1024;
    const duration = isMobileOrTablet ? 520 : 340;  // ms
    let startTime = -1;

    // Quartic ease-out: snappy start, velvety deceleration — feels great on touch.
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      if (startTime < 0) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      container.scrollTop = startY + delta * eased;

      if (progress < 1) {
        scrollRafRef.current = requestAnimationFrame(step);
      } else {
        // Ensure exact final position — no floating-point drift.
        container.scrollTop = targetY;
        scrollRafRef.current = 0;
      }
    };

    scrollRafRef.current = requestAnimationFrame(step);
  };

  // Scroll vertically only — element.scrollIntoView() would also nudge any
  // ancestor with horizontal overflow (see note above), so we compute the
  // target's position relative to whichever element actually scrolls and set
  // its scrollTop directly instead.
  const scrollToSection = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (!el) return;
    const container = findScrollContainer(el);
    if (!container) return;

    // Compute the sticky-offset directly from known JS constants instead of
    // reading scroll-margin-top from CSS.  getComputedStyle returns "0px" for
    // scroll-margin-top on some mobile browsers (especially older iOS Safari),
    // making the formula land at the wrong position.
    //
    // Sticky stack heights:
    //   Mobile/tablet  (≤ 1024px): MobileTopNav (60) + SectionNav (56) = 116px
    //   Desktop        (> 1024px): MainNav (90) + SubNav (66) + SectionNav (56) = 212px
    //
    // +16px breathing room so the section title sits just below the tab bar
    // with a comfortable gap rather than being flush against it.
    const isMobileOrTablet = window.innerWidth <= 1024;
    const stickyOffset = isMobileOrTablet
      ? MOBILE_NAV_H + SECTION_NAV_H + 16
      : (inline ? MAIN_NAV_H + SUB_NAV_H + 16 : MAIN_NAV_H + SUB_NAV_H + SECTION_NAV_H + 16);

    // Freeze the element's position BEFORE starting the animation.
    // FadeUp entrance animations (opacity/y transform) fire as soon as the
    // section enters the viewport; reading getBoundingClientRect() after that
    // gives a mid-animation value and corrupts the target.
    const containerTop =
      container === document.scrollingElement
        ? 0
        : container.getBoundingClientRect().top;
    const target =
      el.getBoundingClientRect().top - containerTop + container.scrollTop - stickyOffset;

    smoothScrollTo(container, Math.max(0, target));
  };

  // Cancel any in-flight RAF scroll on unmount.
  useEffect(() => () => { if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current); }, []);

  return (
    <div
      style={inline ? {
        display: "flex", alignItems: "center", gap: 16,
        overflowX: "hidden",
        flex: 1, minWidth: 0,
      } : {
        position: "sticky", top: stickyTop, zIndex: 90,
        height,
        background: "#FFFFFF",
        borderBottom: `1px solid ${borderColor}`,
        display: "flex", alignItems: "center", gap: 20,
        padding,
        overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      <span style={{ flexShrink: 0, fontFamily, fontWeight: 600, fontSize: 11, color: mutedColor, letterSpacing: "1.3px", textTransform: "uppercase" as const }}>
        Jump to
      </span>
      <div ref={stripRef} className="section-nav-scroll" style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, overflowX: "auto", minWidth: 0, flex: 1, paddingTop: 6, paddingBottom: 6 }}>
        {sections.map(s => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              ref={el => { pillRefs.current[s.id] = el; }}
              onClick={() => scrollToSection(s.id)}
              style={{
                position: "relative",
                flexShrink: 0,
                fontFamily,
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                color: isActive ? "#FFFFFF" : mutedColor,
                background: "transparent",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.06)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  style={{ position: "absolute", inset: 0, background: activeColor, borderRadius: 8, zIndex: 0 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
