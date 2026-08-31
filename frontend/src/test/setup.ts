import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // Storage is shared across tests in a file — clear it so one test's
  // writes can't leak into the next and cause order-dependent flakes.
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom 29 exposes Storage differently than vitest 2.x's jsdom environment
// copies globals, so `localStorage` lands undefined and any component that
// touches it throws on render. Back it with a plain in-memory Storage.
if (typeof globalThis.localStorage === "undefined") {
  const makeStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    } as Storage;
  };
  for (const name of ["localStorage", "sessionStorage"] as const) {
    const storage = makeStorage();
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
    Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
  }
}

// jsdom doesn't implement these — Radix Select/Slider rely on them for
// pointer capture and viewport scrolling during open/drag interactions.
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.releasePointerCapture = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
// Scroll-reveal wrappers (FadeUp and friends) construct one on mount, so any
// component rendered inside them throws in jsdom without this.
if (!("IntersectionObserver" in window)) {
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  // @ts-expect-error — minimal test-only polyfill
  window.IntersectionObserver = MockIntersectionObserver;
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

if (!("ResizeObserver" in window)) {
  // @ts-expect-error — minimal test-only polyfill
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
