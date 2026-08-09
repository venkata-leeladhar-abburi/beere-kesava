/**
 * DocumentPage — design-system/07-DOCUMENTS.md Part D + G.
 * ═══════════════════════════════════════════════════════════════════════════
 * The A4 sheet itself. The document component never knows whether it's in
 * the screen preview or mid-print (Part C.1) — this component and print.css
 * are the only places that know the difference.
 */
import * as React from "react";
import { cn } from "../utils";

export interface DocumentPageProps extends React.ComponentProps<"div"> {
  /** Page number of m, shown bottom-right — omit on a single-page document. */
  pageInfo?: { page: number; of: number };
}

export function DocumentPage({ children, className, pageInfo, ...props }: DocumentPageProps) {
  return (
    <div className={cn("bk-doc", className)} {...props}>
      {children}
      {pageInfo && (
        <div
          className="text-right"
          style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-faint)", marginTop: "4mm" }}
        >
          Page {pageInfo.page} of {pageInfo.of}
        </div>
      )}
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
