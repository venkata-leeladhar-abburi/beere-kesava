import { useEffect } from "react";
import { useLocation } from "react-router";

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
 * Global ScrollToTop component mounted inside BrowserRouter.
 * Automatically scrolls page to top on every route/location change.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname, search, hash]);

  return null;
}
