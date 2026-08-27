/**
 * exportPdf — pixel-exact PDF download for the document system.
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY THIS EXISTS. Download used to share one code path with Print: render
 * into #document-print-root, call window.print(), and let the user pick
 * "Save as PDF". That routes the document through the browser's print
 * engine, which re-lays it out against the @page box, drops or re-tints
 * backgrounds depending on the "Background graphics" checkbox, re-flows
 * mm-sized boxes against the printer's own margins, and adds its own
 * headers/footers. The result never matched the on-screen preview — which
 * is precisely the complaint this replaces.
 *
 * The fix is to stop asking the browser to re-render the document at all.
 * We mount the SAME React tree the preview renders, at its true unscaled
 * 210mm width, into an offscreen container that has NO viewport zoom and no
 * print stylesheet applied, rasterise each A4 sheet with html2canvas, and
 * place the bitmaps into a jsPDF A4 page box at exactly 210×297mm. What the
 * designer sees in the preview is, by construction, the same DOM that gets
 * captured — so the download is an exact copy of the preview, every time,
 * in every browser.
 *
 * Print() is deliberately left on the old window.print() path: printing to
 * a physical printer SHOULD use the browser's print pipeline.
 */
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

const ASSET_TIMEOUT_MS = 6000;
/**
 * Capture scale. 2 is the usual html2canvas default and reads soft on the
 * 8pt type an invoice uses; 3 is visibly crisper on screen and at print
 * size and still keeps a one-page invoice comfortably under ~2MB.
 */
const CAPTURE_SCALE = 3;

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A5L_WIDTH_MM = 210;
const A5L_HEIGHT_MM = 148;

/**
 * How far past one page a document may run and still be squeezed onto a
 * single sheet.
 *
 * Calibrated against the reference invoice in doc-preview.tsx (5 line
 * items, tax summary, bank details, dispatch details): it renders 1229px
 * tall against A4's 1123px — a 9.5% overflow, entirely made up of the
 * signature block and footer. The preview shows that as ONE sheet, so the
 * download must be one sheet too. 15% covers that case with headroom while
 * still only shrinking the type to ~87% at worst, which stays comfortably
 * legible; anything past it is a genuinely multi-page document and is
 * paginated properly instead.
 */
const SINGLE_PAGE_FIT_TOLERANCE = 0.15;
const JPEG_QUALITY = 0.95;
/** How far back from a page boundary we will hunt for a clean cut. */
const MAX_CUT_SEARCH_PX = 140;

const CONTAINER_ID = "document-pdf-root";

/**
 * Choose where to end a page, given a page-height budget.
 *
 * Scans upward from the ideal boundary for a pixel row that is uniform
 * across the sheet's inner width — i.e. genuine whitespace between blocks,
 * not the middle of a table row or a line of text. Returns the ideal
 * boundary unchanged if no gap is found within MAX_CUT_SEARCH_PX, so a
 * solid block of content still paginates rather than looping forever.
 */
function findCutRow(canvas: HTMLCanvasElement, top: number, pageHeightPx: number): number {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return pageHeightPx;

  const ideal = top + pageHeightPx;
  const limit = Math.max(top + 1, ideal - MAX_CUT_SEARCH_PX);
  // Ignore the outer 6% of the width: the letterhead band and the totals
  // bar bleed to the sheet edge, and their solid colour would otherwise
  // read as "not whitespace" on every row.
  const inset = Math.floor(canvas.width * 0.06);
  const scanWidth = canvas.width - inset * 2;
  if (scanWidth <= 0) return pageHeightPx;

  for (let y = ideal - 1; y >= limit; y--) {
    const row = ctx.getImageData(inset, y, scanWidth, 1).data;
    let uniform = true;
    for (let i = 4; i < row.length; i += 4) {
      // Compare against the row's first pixel rather than testing for pure
      // white — the cream zebra fill and the tinted cards are legitimate
      // gaps too, they just aren't #FFFFFF.
      if (
        Math.abs(row[i] - row[0]) > 6 ||
        Math.abs(row[i + 1] - row[1]) > 6 ||
        Math.abs(row[i + 2] - row[2]) > 6
      ) {
        uniform = false;
        break;
      }
    }
    if (uniform) return y - top;
  }
  return pageHeightPx;
}

function getPdfContainer(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    document.body.appendChild(el);
  }
  // Offscreen but genuinely laid out and painted — `display:none` or
  // `visibility:hidden` would give html2canvas a zero-sized, unstyled tree.
  // Left-positioning it off the viewport is the only way to keep real
  // layout while keeping it invisible to the user.
  Object.assign(el.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: `${A4_WIDTH_MM}mm`,
    background: "#FFFFFF",
    zIndex: "-1",
    pointerEvents: "none",
    // Belt and braces: the preview shrinks the sheet with `zoom` under
    // 900px (print.css). This container is not inside .bk-doc-viewport so
    // it never inherits that, but pinning it makes the capture width
    // independent of the window size the user happens to have open.
    zoom: "1",
  } as Partial<CSSStyleDeclaration>);
  return el;
}

function nextPaint(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([promise, new Promise<void>(resolve => setTimeout(resolve, ms))]);
}

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

// One persistent root, same reasoning as useDocument's print root: calling
// createRoot twice on one container is a React error, and unmounting between
// exports races the next render.
let pdfRoot: Root | null = null;

/** Trim a filename down to something a filesystem will accept. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "-").replace(/-+/g, "-").trim();
  return (cleaned || "document").slice(0, 120);
}

export interface ExportPdfOptions {
  /** File name without extension, e.g. the invoice number. */
  fileName?: string;
  /** PDF metadata title — what a viewer shows in its title bar. */
  title?: string;
}

/**
 * Renders `node` offscreen at true A4 width, rasterises every `.bk-doc`
 * sheet in it, and builds the PDF — shared by exportDocumentPdf (saves it to
 * disk) and exportDocumentPdfBlob (hands back the bytes, e.g. to upload for
 * WhatsApp sharing). Returns the jsPDF instance so each caller decides what
 * to do with it.
 */
async function buildDocumentPdf(node: React.ReactNode, options: ExportPdfOptions = {}) {
  // Both libraries are heavy (~250KB gzipped combined) and only ever needed
  // the moment someone clicks Download, so they're split out of the main
  // bundle rather than loaded on every page view.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const container = getPdfContainer();
  if (!pdfRoot) pdfRoot = createRoot(container);
  pdfRoot.render(node as React.ReactElement);

  try {
    await nextPaint();
    await withTimeout(
      Promise.all([document.fonts?.ready ?? Promise.resolve(), imagesSettled(container)]),
      ASSET_TIMEOUT_MS
    );
    await nextPaint();

    const sheets = Array.from(container.querySelectorAll<HTMLElement>(".bk-doc"));
    if (sheets.length === 0) throw new Error("Nothing to export — the document rendered empty.");

    // Page geometry comes from the FIRST sheet: a receipt (.bk-doc--a5) is
    // A5 landscape, everything else A4 portrait. Mixing the two in one file
    // isn't a case any document type produces.
    const isA5 = sheets[0].classList.contains("bk-doc--a5");
    const pageWidthMm = isA5 ? A5L_WIDTH_MM : A4_WIDTH_MM;
    const pageHeightMm = isA5 ? A5L_HEIGHT_MM : A4_HEIGHT_MM;

    const orientation: "portrait" | "landscape" = pageWidthMm >= pageHeightMm ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [pageWidthMm, pageHeightMm],
      compress: true,
    });

    let firstPage = true;

    for (const sheet of sheets) {
      const canvas = await html2canvas(sheet, {
        scale: CAPTURE_SCALE,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        logging: false,
        // The sheet is a fixed-width box; passing its real size stops
        // html2canvas from clipping to the (offscreen) window rect.
        width: sheet.offsetWidth,
        height: sheet.offsetHeight,
        windowWidth: sheet.offsetWidth,
        windowHeight: sheet.offsetHeight,
      });

      // px → mm for this capture. Width always maps to the full page width,
      // so the document is never scaled differently across pages.
      const pxPerMm = canvas.width / pageWidthMm;
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

      // ── Pagination ───────────────────────────────────────────────────────
      // A .bk-doc is min-height A4 but grows with its content. Two cases:
      //
      // 1. It overflows the page by only a little. A document that runs 5%
      //    past the sheet is a document that was MEANT to be one page — the
      //    designer sees one sheet in the preview — and blindly cutting it
      //    exiles the signature block to an otherwise blank page 2. So a
      //    small overflow is fitted to a single page instead. The scale is
      //    uniform, so the layout is unchanged; it is the same "Fit to page"
      //    every print dialog offers, applied automatically.
      //
      // 2. It is genuinely multi-page. Then we slice — but never blindly:
      //    a cut at an arbitrary pixel row bisects a table row or a line of
      //    type. findCutRow() walks back from the page boundary looking for
      //    a band of uniform pixels (a real gap between blocks) and cuts
      //    there instead.
      const overflow = canvas.height / pageHeightPx;

      if (overflow <= 1 + SINGLE_PAGE_FIT_TOLERANCE) {
        const naturalHeightMm = canvas.height / pxPerMm;
        // UNIFORM scale — width shrinks with height. Scaling only the height
        // to make it fit would squash the document vertically, which is the
        // one thing this whole module exists to prevent.
        const fit = Math.min(1, pageHeightMm / naturalHeightMm);
        const renderWidthMm = pageWidthMm * fit;
        const renderHeightMm = naturalHeightMm * fit;
        // Re-centre horizontally so a fitted sheet isn't glued to the left
        // edge with a white strip down the right.
        const offsetX = (pageWidthMm - renderWidthMm) / 2;

        if (!firstPage) pdf.addPage([pageWidthMm, pageHeightMm], orientation);
        firstPage = false;
        pdf.addImage(
          canvas.toDataURL("image/jpeg", JPEG_QUALITY),
          "JPEG", offsetX, 0, renderWidthMm, renderHeightMm, undefined, "FAST"
        );
        continue;
      }

      let sliceTop = 0;
      while (sliceTop < canvas.height) {
        const remaining = canvas.height - sliceTop;
        const sliceHeight =
          remaining <= pageHeightPx ? remaining : findCutRow(canvas, sliceTop, pageHeightPx);

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        const ctx = slice.getContext("2d");
        if (!ctx) throw new Error("Could not create the export canvas.");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, sliceTop, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (!firstPage) pdf.addPage([pageWidthMm, pageHeightMm], orientation);
        firstPage = false;

        pdf.addImage(
          slice.toDataURL("image/jpeg", JPEG_QUALITY),
          "JPEG", 0, 0, pageWidthMm, sliceHeight / pxPerMm, undefined, "FAST"
        );

        sliceTop += sliceHeight;
      }
    }

    if (options.title) pdf.setProperties({ title: options.title });
    return pdf;
  } finally {
    // Always tear the tree down, even if capture threw — otherwise a failed
    // export leaves a full document mounted offscreen for the rest of the
    // session, holding on to its subscriptions and context.
    pdfRoot.render(null);
  }
}

/**
 * Renders `node` offscreen at true A4 width, rasterises every `.bk-doc`
 * sheet in it, and saves the result as a single PDF.
 */
export async function exportDocumentPdf(node: React.ReactNode, options: ExportPdfOptions = {}): Promise<void> {
  const pdf = await buildDocumentPdf(node, options);
  pdf.save(`${safeFileName(options.fileName || options.title || "document")}.pdf`);
}

/**
 * Same rasterisation as exportDocumentPdf, but hands back the PDF bytes
 * instead of triggering a browser download — for flows that upload the file
 * elsewhere (e.g. "Share with Vendor" posting it to /whatsapp/send-po-document).
 */
export async function exportDocumentPdfBlob(node: React.ReactNode, options: ExportPdfOptions = {}): Promise<Blob> {
  const pdf = await buildDocumentPdf(node, options);
  return pdf.output("blob");
}
