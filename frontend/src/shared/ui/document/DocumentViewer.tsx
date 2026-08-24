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
import { Button } from "../primitives/Button";
import { DocumentViewport } from "./DocumentPage";
import { useDocument } from "./useDocument";
import { PrintGate } from "../DownloadAccess";

export interface DocumentViewerProps {
  /** The DocumentPage tree — rendered identically on screen and in print/download. */
  children: React.ReactNode;
  /** Extra actions rendered before Print/Download (e.g. a future Email button). */
  actions?: React.ReactNode;
  /**
   * File name (no extension) for the downloaded PDF — pass the document's
   * own number so the file lands in Downloads as `INV-Parvathi-1-004.pdf`
   * rather than a generic `document.pdf`.
   */
  fileName?: string;
  /** PDF metadata title, e.g. "Tax Invoice INV-Parvathi-1-004". */
  documentTitle?: string;
  className?: string;
}

export function DocumentViewer({ children, actions, fileName, documentTitle, className }: DocumentViewerProps) {
  const { print, download } = useDocument();

  // Download writes a real PDF from this exact tree (see exportPdf.ts) — no
  // "pick Save as PDF in the dialog" instruction toast any more, because
  // there is no dialog.
  const handleDownload = () => download(children, { fileName, title: documentTitle });

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
        {/* Part L.3 — hidden rather than disabled: a role with no export
            rights shouldn't see a Download affordance dangling in front of
            them at all. useDocument().download() enforces the same check
            independently, so this is a UX nicety, not the real gate. */}
        <PrintGate>
          <Button variant="primary" size="sm" iconLeft={Download} onClick={handleDownload}>
            Download PDF
          </Button>
        </PrintGate>
      </div>
      <DocumentViewport style={{ flex: 1, minHeight: 0 }}>{children}</DocumentViewport>
    </div>
  );
}
