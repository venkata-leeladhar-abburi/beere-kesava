/**
 * DocumentPage — design-system/07-DOCUMENTS.md Part D + G.
 * ═══════════════════════════════════════════════════════════════════════════
 * The A4 sheet itself. The document component never knows whether it's in
 * the screen preview or mid-print (Part C.1) — this component and print.css
 * are the only places that know the difference.
 *
 * The sheet has no padding of its own: `band` renders full-bleed (the brand
 * gradient letterhead runs to the paper edge) and everything else sits
 * inside .bk-doc__body, which owns the 15mm side margins.
 */
import * as React from "react";
import { cn } from "../utils";

export interface DocumentPageProps extends React.ComponentProps<"div"> {
  /** Full-bleed letterhead — rendered outside the body's side margins. */
  band?: React.ReactNode;
  /** Page number of m, shown bottom-right — omit on a single-page document. */
  pageInfo?: { page: number; of: number };
  /**
   * "a4" (default, 210×297mm portrait) or "a5-landscape" (210×148mm) — Part
   * H.5's Payment Receipt is the one document type that doesn't need a full
   * A4 sheet. Applies a modifier class that print.css binds to a named
   * `@page` rule, so this document prints at the smaller size on its own
   * page box rather than a full A4 sheet with the bottom half blank.
   */
  size?: "a4" | "a5-landscape";
}

export function DocumentPage({ children, className, band, pageInfo, size = "a4", ...props }: DocumentPageProps) {
  return (
    <div className={cn("bk-doc", size === "a5-landscape" && "bk-doc--a5", className)} {...props}>
      {band}
      <div className="bk-doc__body">
        {children}
        {pageInfo && (
          <div
            style={{
              marginTop: "auto", paddingTop: "6mm", textAlign: "right",
              fontSize: "var(--doc-small)", color: "var(--doc-muted)",
            }}
          >
            Page {pageInfo.page} of {pageInfo.of}
          </div>
        )}
      </div>
    </div>
  );
}

/** 210mm at CSS's fixed 96dpi — the sheet's true unscaled width in px. */
const SHEET_WIDTH_PX = 793.7;

/**
 * Grey "PDF viewer" backdrop for the screen preview — wrap one or more DocumentPages.
 *
 * The sheet is fit to the viewport's OWN width, not the window's: inside a
 * modal with a side panel the window can be wide while the preview column is
 * narrow, and a window media query then let the sheet's right edge run off
 * behind the modal's overflow. The measured scale lands on `--doc-zoom`,
 * which print.css applies as `zoom` (never enlarging past 1).
 */
export function DocumentViewport({ children, className, style, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const available = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (available <= 0) return;
      setZoom(Math.min(1, Math.floor((available / SHEET_WIDTH_PX) * 1000) / 1000));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("bk-doc-viewport", zoom !== undefined && "bk-doc-viewport--fit", className)}
      style={{ ...style, ...(zoom !== undefined ? { ["--doc-zoom" as string]: zoom } : null) }}
      {...props}
    >
      {children}
    </div>
  );
}
