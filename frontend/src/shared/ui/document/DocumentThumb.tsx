/**
 * DocumentThumb — live, true-to-print document preview at thumbnail size.
 * ═══════════════════════════════════════════════════════════════════════════
 * The create/compose screens (PO create modal, quotation & invoice
 * generators) all used to carry their OWN hand-rolled mock of the document
 * in their right-hand "preview" panel — a card that resembled the real
 * output but was a separate implementation, and so drifted away from it.
 * That is why the PO create screen was still showing the pre-Phase-7
 * letterhead ("🪷 … Guntur, Andhra Pradesh") long after the real
 * PurchaseOrderDocument had moved on.
 *
 * This component removes the second implementation entirely: it renders the
 * REAL <DocumentPage> tree — the same one that prints and downloads — and
 * simply scales it down to whatever width the side panel gives it. A live
 * preview is now, by construction, the document.
 *
 * Scaling is `transform: scale()` with a measured height compensation
 * rather than `zoom`: transform is supported everywhere, and measuring the
 * scaled height back onto the wrapper stops the panel from reserving a
 * full unscaled 297mm of dead space beneath the sheet.
 */
import * as React from "react";

/** 210mm at CSS's fixed 96dpi — the sheet's true unscaled width in px. */
const SHEET_WIDTH_PX = 793.7;

export interface DocumentThumbProps {
  children: React.ReactNode;
  /** Cap the scale so the sheet never renders larger than life. */
  maxScale?: number;
  className?: string;
}

export function DocumentThumb({ children, maxScale = 1, className }: DocumentThumbProps) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.4);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    const outer = outerRef.current;
    const sheet = sheetRef.current;
    if (!outer || !sheet) return;

    const measure = () => {
      const available = outer.clientWidth;
      if (!available) return;
      const next = Math.min(maxScale, available / SHEET_WIDTH_PX);
      setScale(next);
      setHeight(sheet.offsetHeight * next);
    };

    measure();
    // Two observers, deliberately: the outer box changes when the panel is
    // resized, and the sheet's own height changes every time the form adds
    // a line item — both have to re-run the height compensation or the
    // wrapper clips a growing document.
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div ref={outerRef} className={className} style={{ width: "100%", height, overflow: "hidden" }}>
      <div
        ref={sheetRef}
        style={{
          width: SHEET_WIDTH_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // The real sheet carries its own drop shadow only inside
          // .bk-doc-viewport; in a panel it sits on a tinted background, so
          // it gets a light one here to read as paper.
          filter: "drop-shadow(0 6px 20px rgba(44, 6, 27, 0.16))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
