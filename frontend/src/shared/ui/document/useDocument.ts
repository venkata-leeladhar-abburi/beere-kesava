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
import { toast } from "sonner";
import { useDownloadsAllowed } from "../DownloadAccess";

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
  const downloadsAllowed = useDownloadsAllowed();

  // Print (Part L.3's table) is available to every role — physical printing
  // is a legitimate, universal action and this app has no way to tell a
  // real printer from a "Print to PDF" virtual one at the JS layer, so print
  // itself is never gated here.
  const print = React.useCallback((node: React.ReactNode) => {
    void renderAndPrint(node);
  }, []);

  /**
   * Same render path as print(), but GATED — this is the PrintGate/L.3 half
   * of Phase 7: "an accountant blocked from exporting can still Print → Save
   * as PDF" is exactly the bypass this closes for the direct Download
   * button. It is a partial fix, not a complete one, and that's worth being
   * honest about: because download() and print() still share one
   * window.print() call (no backend PDF service exists yet — Part L is
   * deferred), a blocked user can still reach the identical output by
   * clicking Print and choosing "Save as PDF" from the OS dialog, since
   * nothing in the browser lets JS distinguish that choice from sending to
   * a physical printer. Closing that path for real needs Part L's
   * server-rendered PDF, gated at the backend endpoint instead of in the
   * browser. Until then this stops the direct, one-click bypass and leaves
   * an honest audit trail (the toast) for the indirect one.
   */
  const download = React.useCallback((node: React.ReactNode) => {
    if (!downloadsAllowed) {
      toast.error("Your account can't download documents.", {
        description: "Contact an admin if you need this file exported.",
      });
      return;
    }
    void renderAndPrint(node);
  }, [downloadsAllowed]);

  return { print, download, downloadsAllowed };
}
