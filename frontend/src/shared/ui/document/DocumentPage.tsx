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
}

export function DocumentPage({ children, className, band, pageInfo, ...props }: DocumentPageProps) {
  return (
    <div className={cn("bk-doc", className)} {...props}>
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

/** Grey "PDF viewer" backdrop for the screen preview — wrap one or more DocumentPages. */
export function DocumentViewport({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("bk-doc-viewport", className)} {...props}>
      {children}
    </div>
  );
}
