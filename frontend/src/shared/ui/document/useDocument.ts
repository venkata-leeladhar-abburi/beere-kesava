/**
 * useDocument — design-system/07-DOCUMENTS.md Part C.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Portals a document tree into `#document-print-root` (declared in
 * index.html), waits until it has actually painted, then calls
 * `window.print()`. This is what replaces the app's raw `window.print()`
 * calls, each of which prints the entire application (nav, scrim,
 * background page) because there is no print-isolated root.
 *
 * THE ORDERING MATTERS. `root.render()` is asynchronous — React schedules
 * the work rather than committing it inline. Calling `window.print()`
 * straight after (even after awaiting `document.fonts.ready`, which usually
 * resolves in a microtask when fonts are already cached) fires while the
 * print root is still empty, and the print preview comes up blank. So we
 * explicitly wait for: commit + paint (double rAF) → fonts → images →
 * one more paint, each with a timeout so a slow asset can never wedge the
 * print button permanently.
 */
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

const ASSET_TIMEOUT_MS = 3000;

function getPrintContainer(): HTMLElement {
  const el = document.getElementById("document-print-root");
  if (!el) throw new Error("#document-print-root is missing from index.html");
  return el;
}

/** Resolves after React has committed and the browser has painted. */
function nextPaint(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([promise, new Promise<void>(resolve => setTimeout(resolve, ms))]);
}

/** Every <img> in the subtree has either loaded or definitively failed. */
function imagesSettled(container: HTMLElement): Promise<unknown> {
  const images = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );
}

// One persistent root for the print container. Re-calling createRoot on a
// container that already has one is a React error, and unmounting between
// prints would race the next render — so the root is created once and the
// tree is simply swapped (and cleared back to null after printing).
let printRoot: Root | null = null;

function ensureRoot(container: HTMLElement): Root {
  if (!printRoot) printRoot = createRoot(container);
  return printRoot;
}

async function renderAndPrint(node: React.ReactNode) {
  const container = getPrintContainer();
  const root = ensureRoot(container);

  root.render(node as React.ReactElement);

  await nextPaint();
  await withTimeout(
    Promise.all([document.fonts?.ready ?? Promise.resolve(), imagesSettled(container)]),
    ASSET_TIMEOUT_MS
  );
  await nextPaint();

  // Scopes print.css's isolation rules to this print only, so the older
  // `.print-area` mechanism in globals.css (still used by five legacy
  // modals) keeps working when we're not printing a document.
  document.body.setAttribute("data-printing-document", "");

  let cleared = false;
  const clear = () => {
    if (cleared) return;
    cleared = true;
    window.removeEventListener("afterprint", clear);
    document.body.removeAttribute("data-printing-document");
    printRoot?.render(null);
  };
  window.addEventListener("afterprint", clear);
  // Safari/Firefox don't always fire `afterprint` — clear on a delay too so
  // the print root never keeps a stale document mounted.
  setTimeout(clear, 60_000);

  window.print();
}

export function useDocument() {
  const print = React.useCallback((node: React.ReactNode) => {
    void renderAndPrint(node);
  }, []);

  /**
   * Same render path as print(). There is no backend PDF service yet
   * (07-DOCUMENTS.md Part L is deferred), and the browser's own
   * "Save as PDF" print destination produces the identical tree and
   * stylesheet — which is exactly the "download must be the same document"
   * requirement. Swapping in a server-rendered PDF later replaces just
   * this function.
   */
  const download = React.useCallback((node: React.ReactNode) => {
    void renderAndPrint(node);
  }, []);

  return { print, download };
}
