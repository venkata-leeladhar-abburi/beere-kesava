/**
 * useDocument — design-system/07-DOCUMENTS.md Part C.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Portals a document tree into `#document-print-root` (declared in
 * index.html), waits for fonts and images so print never silently falls
 * back to Times New Roman, calls `window.print()`, and unmounts on
 * `afterprint`. This is what replaces the app's 6 raw `window.print()`
 * calls — each of which today prints the entire application (nav, scrim,
 * background page) because there is no print-isolated root.
 *
 * `download` is the same print flow for now: this codebase has no backend
 * PDF service yet (design-system/07-DOCUMENTS.md Part L — headless-Chromium
 * PDF generation — is explicitly deferred). The browser's own "Print →
 * Save as PDF" produces the *exact same* document tree and stylesheet as
 * the on-screen preview, which is the actual guarantee Part C.1 ("render
 * once, output three ways") cares about — a real server-rendered PDF file
 * is a later, additive step, not a different document.
 */
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

async function waitForPrintReady() {
  await Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise(resolve => setTimeout(resolve, 1000)), // never block print forever on a slow font load
  ]);
}

function getPrintRoot(): HTMLElement {
  const el = document.getElementById("document-print-root");
  if (!el) throw new Error("#document-print-root is missing from index.html");
  return el;
}

let activeRoot: Root | null = null;

async function renderAndPrint(node: React.ReactNode) {
  const container = getPrintRoot();
  activeRoot?.unmount();
  activeRoot = createRoot(container);
  activeRoot.render(node);

  await waitForPrintReady();

  const cleanup = () => {
    activeRoot?.unmount();
    activeRoot = null;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  window.print();
}

export function useDocument() {
  const print = React.useCallback((node: React.ReactNode) => {
    void renderAndPrint(node);
  }, []);

  // Same mechanism as print() — see file header. Named separately so call
  // sites read as "Download PDF" / "Print" per their own intent, and so a
  // real server-PDF download can replace just this one function later.
  const download = React.useCallback((node: React.ReactNode) => {
    void renderAndPrint(node);
  }, []);

  return { print, download };
}
