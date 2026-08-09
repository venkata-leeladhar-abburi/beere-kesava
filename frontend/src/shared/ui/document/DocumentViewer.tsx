/**
 * DocumentViewer — design-system/07-DOCUMENTS.md Part D.2.
 * ═══════════════════════════════════════════════════════════════════════════
 * Toolbar + grey backdrop around a document's screen preview. Print and
 * Download both go through `useDocument` (Part C.3) — never a raw
 * `window.print()` — so the isolated `#document-print-root` is what reaches
 * paper, not the modal chrome this is usually sitting inside.
 */
import * as React from "react";
import { Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../primitives/Button";
import { DocumentViewport } from "./DocumentPage";
import { useDocument } from "./useDocument";

export interface DocumentViewerProps {
  /** The DocumentPage tree — rendered identically on screen and in print/download. */
  children: React.ReactNode;
  /** Extra actions rendered before Print/Download (e.g. a future Email button). */
  actions?: React.ReactNode;
  className?: string;
}

export function DocumentViewer({ children, actions, className }: DocumentViewerProps) {
  const { print, download } = useDocument();

  const handleDownload = () => {
    toast.info("Choose “Save as PDF” as the destination to download this document.");
    download(children);
  };

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div
        data-print="hide"
        style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8,
          padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)",
          background: "var(--surface-raised)", flexShrink: 0,
        }}
      >
        {actions}
        <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => print(children)}>
          Print
        </Button>
        <Button variant="primary" size="sm" iconLeft={Download} onClick={handleDownload}>
          Download PDF
        </Button>
      </div>
      <DocumentViewport style={{ flex: 1, minHeight: 0 }}>{children}</DocumentViewport>
    </div>
  );
}
