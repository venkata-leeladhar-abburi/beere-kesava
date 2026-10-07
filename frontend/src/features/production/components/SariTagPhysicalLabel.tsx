import * as React from "react";
import { SareeTagPreview, type SareeTagData } from "@/features/weavers";
import type { LabelStock } from "../../../shared/ui/document";

const T = {
  taupe: "#69635E",
};

const F = {
  ui: "'Inter', sans-serif",
};

export interface SareeProps {
  id: string;
  weaver: string | null;
  design: string;
  sareeType: string;
  sareeTypeCode?: string;
  weight: string;
  qcDate: string;
  source: string;
  loom: number;
  supplier?: string;
  /** External-purchase-only fields — printed on that branch of the tag. */
  supplierShortName?: string | null;
  invoiceNumber?: string | null;
  serial?: string | null;
  /** Retail/selling price, printed in plain rupees. */
  sellingPrice?: number | null;
  /** Buying/cost price — printed cost-ciphered (see costCipher.ts), never in plain rupees. */
  costPrice?: number | null;
}

const PX_PER_MM = 96 / 25.4;
/** The most the tag is magnified, however wide the pane. */
const MAX_ZOOM = 3;

interface SariTagPhysicalLabelProps {
  /** Exactly the tag "Print Now" sends to the printer. */
  tag: SareeTagData;
  /** The label size picked in the modal. */
  stock: LabelStock;
  caption: string;
}

/**
 * The preview pane of the single-tag print modal.
 *
 * Draws the real printed tile (<SareeTagPreview>), magnified — the same
 * component "Print All Barcodes" and every other tag button print through.
 * It used to be a hand-built mock of a 100x50mm label with branding, an
 * invoice row and a small centred code, none of which the printer produced,
 * so the preview and the sticker had nothing in common.
 */
export function SariTagPhysicalLabel({ tag, stock, caption }: SariTagPhysicalLabelProps) {
  // Magnified to fill the pane, whatever the modal's width and the label
  // size picked — the whole tag has to be visible, never scrolled or clipped.
  const paneRef = React.useRef<HTMLDivElement | null>(null);
  const [paneWidth, setPaneWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const measure = () => setPaneWidth(pane.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);
  const tagPx = stock.widthMm * PX_PER_MM;
  const zoom = paneWidth > 0 ? Math.min(MAX_ZOOM, paneWidth / tagPx) : 1;

  return (
    <div
      style={{
        flex: "0 0 60%",
        minWidth: 0,
        padding: 32,
        background: "#F7F4F0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>
        LABEL PREVIEW — {stock.widthMm}mm × {stock.heightMm}mm
      </div>

      <div ref={paneRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {paneWidth > 0 && (
          <div style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)", borderRadius: 4 }}>
            <SareeTagPreview tag={tag} stock={stock} zoom={zoom} />
          </div>
        )}
      </div>

      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "center" }}>
        {caption}
      </div>
    </div>
  );
}
