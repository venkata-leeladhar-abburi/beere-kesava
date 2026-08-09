/**
 * DocumentViewer — design-system/07-DOCUMENTS.md Part D.2.
 * ═══════════════════════════════════════════════════════════════════════════
 * The toolbar + grey backdrop around a document's screen preview. Print and
 * Download both go through `useDocument` (Part C.3) — never a raw
 * `window.print()` — so the isolated `#document-print-root` is always what
 * actually reaches paper, not the modal chrome this is likely sitting in.
 */
import * as React from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "../primitives/Button";
import { DocumentViewport } from "./DocumentPage";
import { useDocument } from "./useDocument";

export interface DocumentViewerProps {
  /** The DocumentPage tree — rendered identically on screen and in print/download. */
  children: React.ReactNode;
  /** Optional extra actions rendered alongside Print/Download (e.g. a future Email button). */
  actions?: React.ReactNode;
  className?: string;
}

export function DocumentViewer({ children, actions, className }: DocumentViewerProps) {
  const { print, download } = useDocument();

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        {actions}
        <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => print(children)}>
          Print
        </Button>
        <Button variant="primary" size="sm" iconLeft={Download} onClick={() => download(children)}>
          Download PDF
        </Button>
      </div>
      <DocumentViewport style={{ flex: 1 }}>{children}</DocumentViewport>
    </div>
  );
}
