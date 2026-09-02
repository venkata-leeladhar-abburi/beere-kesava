import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

/**
 * Resets window and all scroll containers to top: 0 instantly.
 */
export function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.body.scrollTop = 0;
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    // Also scroll all potential container divs to top
    const scrollContainers = document.querySelectorAll(
      "#main-content, .scroll-container, [data-scroll-container], main, section, .section-nav-scroll"
    );
    scrollContainers.forEach((el) => {
      if (el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
  }
}

/**
 * Scrolls to top whenever `key` changes. For detail views that swap in via
 * local state on the same route, where <ScrollToTop /> never fires because
 * useLocation() sees no change.
 */
export function useScrollTopOnView(key: unknown) {
  useEffect(() => {
    if (key === null || key === undefined) return;
    scrollToTop();
  }, [key]);
}

/**
 * For the common "list page swaps in a full-page detail view via local
 * state, no URL change" pattern (a weaver's profile, a bulk order, a batch
 * tally, and similar). Call `openDetail(() => setDetail(x))` from a "view"
 * handler and `backToList(() => setDetail(null))` from the resulting page's
 * `onBack` — the scroll position at the moment of opening is restored when
 * you come back, instead of every "back" dumping you at the page header.
 *
 * A single saved position isn't enough where these nest (e.g. a bulk order
 * opened from within a customer's own detail page) — the outer view's
 * position would be overwritten by the inner one before its own "back" gets
 * a chance to use it. A stack lets each `backToList` pop the position saved
 * by its matching `openDetail`, regardless of nesting depth.
 */
export function useListDetailScroll() {
  const stackRef = useRef<number[]>([]);

  const openDetail = useCallback((open: () => void) => {
    stackRef.current.push(window.scrollY);
    scrollToTop();
    open();
  }, []);

  const backToList = useCallback((close: () => void) => {
    close();
    const top = stackRef.current.pop() ?? 0;
    window.scrollTo({ top, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return { openDetail, backToList };
}

// Position saved per page: window scroll plus whichever container (if any)
// is the page's actual scrolling element — most layouts scroll the window,
// but a few (ShopStaffPortal, MobileWeaverPortal, dashboards) scroll an
// inner #main-content div instead. sessionStorage survives a hard refresh
// (unlike component/router state) but is cleared when the tab closes and
// never leaks across tabs, which is the right lifetime for "where was I".
const SCROLL_STORAGE_KEY = "bk-scroll-positions";
const MAX_SAVED_POSITIONS = 50;

function readStore(): Record<string, { x: number; y: number; mainContentY: number }> {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, { x: number; y: number; mainContentY: number }>) {
  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // sessionStorage full/unavailable (private browsing) — losing scroll
    // memory is harmless, so fail silently rather than break navigation.
  }
}

function savePosition(key: string) {
  const mainContent = document.getElementById("main-content");
  const store = readStore();
  const keys = Object.keys(store);
  // Cap the store so a long session doesn't grow sessionStorage unbounded —
  // drop the oldest entry (insertion order) before adding a new one.
  if (!(key in store) && keys.length >= MAX_SAVED_POSITIONS) {
    delete store[keys[0]];
  }
  store[key] = {
    x: window.scrollX,
    y: window.scrollY,
    mainContentY: mainContent?.scrollTop ?? 0,
  };
  writeStore(store);
}

function restorePosition(key: string): boolean {
  const saved = readStore()[key];
  if (!saved) return false;
  window.scrollTo({ top: saved.y, left: saved.x, behavior: "instant" as ScrollBehavior });
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.scrollTop = saved.mainContentY;
  }
  return true;
}

/**
 * Global scroll-restoration component mounted inside BrowserRouter.
 *
 * - Fresh navigation to a new page (PUSH/REPLACE — clicking a link, calling
 *   navigate()) still resets to top, same as before.
 * - Returning to a page via the browser's back/forward button (POP), or
 *   reloading the page the user is currently on, restores that page's last
 *   scroll position instead of dumping them back at the top.
 * - Scroll position is saved continuously (throttled to one write per
 *   animation frame) so it's captured on refresh/tab-close, not just on the
 *   next navigation.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();
  const key = `${pathname}${search}`;
  const keyRef = useRef(key);
  const isFirstRender = useRef(true);

  useEffect(() => {
    keyRef.current = key;

    // A hard refresh remounts the whole app with no "previous" location to
    // compare against — this first effect run IS that reload, so restore
    // rather than treating it as a fresh forward navigation.
    const isReload = isFirstRender.current;
    isFirstRender.current = false;

    const restored = (navigationType === "POP" || isReload) && restorePosition(key);
    if (!restored) {
      scrollToTop();
    }
  }, [pathname, search, hash, navigationType, key]);

  useEffect(() => {
    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        savePosition(keyRef.current);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const mainContent = document.getElementById("main-content");
    mainContent?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", () => savePosition(keyRef.current));

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      mainContent?.removeEventListener("scroll", onScroll);
    };
    // Re-attach whenever the route changes in case #main-content was
    // swapped for a different element (portal layouts mount/unmount it).
  }, [pathname]);

  return null;
}
