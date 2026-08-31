import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";

import { MAIN_NAV_H, SUB_NAV_H, SECTION_NAV_H, MOBILE_NAV_H } from "./section-navigator-data";
import type { SectionNavItem } from "./section-navigator-data";
export { MAIN_NAV_H, SUB_NAV_H, SECTION_NAV_H, MOBILE_NAV_H, WORKER_MOBILE_HEADER_H, WORKER_TOPNAV_H, WORKER_SECTION_NAV_H, SHOP_MOBILE_HEADER_H, SHOP_SECTION_NAV_H, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, getSectionsForPage } from "./section-navigator-data";
export type { SectionNavItem } from "./section-navigator-data";

const T = { royalBurgundy: "#6E0F2D", taupe: "#69635E", borderDef: "rgba(110,15,45,0.10)" };
const F = { ui: "'Inter', sans-serif" };
function findScrollContainer(el: HTMLElement | null): HTMLElement {
  if (!el) return document.documentElement;
  let cur: HTMLElement | null = el.parentElement;
  while (cur) {
    const { overflow, overflowY } = window.getComputedStyle(cur);
    if (/(auto|scroll)/.test(overflow + overflowY)) return cur;
    cur = cur.parentElement;
  }
  return document.documentElement;
}


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
  // Value is unused — only the setter drives the overflow effect below.
  const [, setHasScrollbar] = useState(false);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const stripRef = useRef<HTMLDivElement | null>(null);

  const horizontalScrollRafRef = useRef<number>(0);
  const sectionIds = useMemo(() => sections.map(s => s.id).join("|"), [sections]);

  useEffect(() => {
    const checkScrollbar = () => {
      if (stripRef.current) {
        const isOverflowing = stripRef.current.scrollWidth > stripRef.current.clientWidth + 1;
        setHasScrollbar(isOverflowing);
      }
    };

    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && stripRef.current) {
      observer = new ResizeObserver(checkScrollbar);
      observer.observe(stripRef.current);
    }
    return () => {
      window.removeEventListener("resize", checkScrollbar);
      if (observer) observer.disconnect();
    };
  }, [sectionIds]);

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
  }, [active, sectionIds]);

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
              return;
            }

            // If we are at the very top of the page, force the active section to be the first one.
            const firstEl = document.getElementById(sections[0]?.id);
            const container = firstEl ? findScrollContainer(firstEl) : null;
            const isWin = !container || container === document.documentElement || container === document.body || container === document.scrollingElement;
            const scrollTop = isWin
              ? (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
              : container.scrollTop;
            if (scrollTop < 50) {
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
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);

    const isWindow =
      container === document.documentElement ||
      container === document.body ||
      container === document.scrollingElement;

    if (isWindow) {
      try {
        window.scrollTo({ top: targetY, behavior: "smooth" });
      } catch {
        window.scrollTo(0, targetY);
      }
      return;
    }

    const startY = container.scrollTop;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) return;

    const duration = 360;
    let startTime = -1;
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
        container.scrollTop = targetY;
        scrollRafRef.current = 0;
      }
    };

    scrollRafRef.current = requestAnimationFrame(step);
  };

  const scrollToSection = (id: string) => {
    setActive(id);
    // Temporarily pause IntersectionObserver while programmatic scroll is in progress
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 650);

    const el = document.getElementById(id);
    if (!el) return;

    const container = findScrollContainer(el);
    const isWindow =
      !container ||
      container === document.documentElement ||
      container === document.body ||
      container === document.scrollingElement;

    let offset = 0;
    if (isWindow) {
      const topNavH = stickyTop > 0 ? stickyTop : (isMobile ? MOBILE_NAV_H : MAIN_NAV_H + SUB_NAV_H);
      offset = topNavH + height + 16;
    } else {
      offset = height + 16;
    }

    const containerTop = isWindow ? 0 : container.getBoundingClientRect().top;
    const currentScroll = isWindow
      ? (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
      : container.scrollTop;

    const targetY = el.getBoundingClientRect().top - containerTop + currentScroll - offset;

    smoothScrollTo(isWindow ? document.documentElement : container, Math.max(0, targetY));
  };

  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const diff = currentScrollY - lastScrollYRef.current;

      // Thresholds kept identical to the mobile/desktop top bars
      // (MobileNavDrawer.tsx, beere-dashboard/components/TopNav.tsx) so this
      // bar's `top` slides in lockstep with the bar collapsing above it.
      if (currentScrollY <= MOBILE_NAV_H) {
        setScrollDirection("up");
      } else if (diff > 6) {
        setScrollDirection("down");
      } else if (diff < -6) {
        setScrollDirection("up");
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cancel any in-flight RAF scroll on unmount.
  useEffect(() => () => { if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current); }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 1024;
  const currentStickyTop = (!inline && isMobile && scrollDirection === "down") ? 0 : stickyTop;
  if (!sections || sections.length === 0) return null;

  return (
    <div
      style={inline ? {
        display: "flex", alignItems: "center", gap: 16,
        overflowX: "hidden",
        flex: 1, minWidth: 0,
      } : {
        position: "sticky", top: currentStickyTop, zIndex: 90,
        height,
        background: "#FFFFFF",
        borderBottom: `1px solid ${borderColor}`,
        display: "flex", alignItems: "center", gap: 20,
        padding,
        overflowX: "hidden",
        maxWidth: "100%",
        transition: "top 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <span style={{ flexShrink: 0, fontFamily, fontWeight: 600, fontSize: 12, color: mutedColor, letterSpacing: "1.3px", textTransform: "uppercase" as const, alignSelf: "center", display: "flex", alignItems: "center" }}>
        Jump to
      </span>
      <div ref={stripRef} className="section-nav-scroll" style={{ position: "relative", display: "flex", alignItems: "center", gap: 24, overflowX: "auto", minWidth: 0, flex: 1, paddingTop: 10, paddingBottom: 10, marginTop: 3, transition: "all 0.2s" }}>
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
                borderRadius: 10,
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
                  style={{ position: "absolute", inset: 0, background: activeColor, borderRadius: 10, zIndex: 0 }}
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
