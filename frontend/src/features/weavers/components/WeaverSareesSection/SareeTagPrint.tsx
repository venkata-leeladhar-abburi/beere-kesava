import * as React from "react";
import {
  useDocument, LabelSheet, useLabelStock, useTileStock, monoFitEm, innerWidthEm,
  DEFAULT_LABEL_STOCK, type LabelStock,
} from "../../../../shared/ui/document";
import { labelsApi } from "../../../../shared/api/labels";
import { formatMoney, rupees } from "@/lib/domain/money";
import { encodeCostCipher } from "@/lib/domain/costCipher";

/**
 * The only fields a physical tag actually prints. Kept deliberately narrow so
 * any stock list can print tags — `WeaverSareeRow` satisfies it structurally,
 * and so does the shop portal's `ShopStockItem` once mapped.
 */
export interface SareeTagData {
  sareeId: string;
  batchId?: string | null;
  designCode?: string | null;
  sareeTypeCode?: string | null;
  sareeTypeName?: string | null;
  color?: string | null;
  /** Weight in grams. */
  weight?: number | null;
  /** Full weaver name, printed with the loom number ("Ramoji Rao · Loom 1"). */
  weaverName?: string | null;
  loomNumber?: number | null;
  /** Printed as DDMMYY (e.g. "020926"). */
  date?: string | null;
  /** Printed on the tag when present — the shop's counter price. */
  retailPrice?: number | null;

  /** Set only for an external-purchase piece — switches the tag to that
   *  layout: supplier short name, invoice, serial, ciphered cost, plain
   *  selling price, instead of the weaver/loom/weight layout above. */
  isExternal?: boolean;
  supplierShortName?: string | null;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  serial?: string | null;
  /** Retail/selling price, printed in plain rupees. */
  sellingPrice?: number | null;
  /** Buying/cost price — printed cost-ciphered (see costCipher.ts), never in plain rupees. */
  costPrice?: number | null;
}

/** DDMMYY, e.g. 2026-09-02 -> "020926". */
function ddmmyy(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

// ── Saree tag print sheet ────────────────────────────────────────────────────
// A run of physical stickers (default 50mm x 25mm, superadmin-configurable in
// Label Settings), printed through the same isolated #document-print-root as
// invoices so it never drags the rest of the app onto paper. One sticker per
// page, so a roll printer feeds exactly one label per tag.
//
// Everything inside a tile is sized in `em` against --label-unit (a 25th of
// the label height, set by <LabelSheet>), so the layout stays proportional if
// a different roll is configured instead of overflowing the sticker the way
// the old fixed 82x46mm tile did.

/** The shared frame: hairline border, tight padding, vertical rhythm. */
function TileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        border: "0.25mm solid #000", borderRadius: "0.8em",
        padding: "1em 1.2em",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden", lineHeight: 1.15,
      }}
    >
      {children}
    </div>
  );
}

const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

/** Barcode + the code printed underneath, the two things a tag exists for.
 *  The generator's own baked-in text is suppressed (withText: false) — at this
 *  size printing the code twice just costs the bars their height. */
function TileCode({ code }: { code: string }) {
  const stock = useTileStock();
  // Shrink to fit rather than ellipsise — a half-printed id is unreadable and
  // the barcode's own caption is switched off.
  const size = monoFitEm(code.length, innerWidthEm(stock), 2.5, 1.5);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img
        src={labelsApi.barcodeUrl(code, { withText: false })}
        alt={`Barcode for ${code}`}
        style={{ width: "100%", height: "9.4em", objectFit: "contain", display: "block" }}
      />
      <span
        style={{
          fontFamily: "var(--font-code, ui-monospace, monospace)", fontWeight: 700,
          fontSize: `${size}em`, letterSpacing: "0.02em", maxWidth: "100%", ...ellipsis,
        }}
      >
        {code}
      </span>
    </div>
  );
}

function TagCard({ r }: { r: SareeTagData }) {
  if (r.isExternal) return <ExternalTagCard r={r} />;

  const typeLabel = r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : "";
  const weaverLine = [r.weaverName || null, r.loomNumber != null ? `Loom ${r.loomNumber}` : null].filter(Boolean).join(" · ");
  const date = ddmmyy(r.date);
  // One detail line only — a 25mm sticker has room for the code and a single
  // line of context, not the five rows the old A4 tile carried.
  const left = [r.designCode || null, typeLabel || null].filter(Boolean).join(" · ") || weaverLine || "—";
  const right = r.retailPrice != null
    ? formatMoney(rupees(r.retailPrice))
    : (r.weight != null ? `${r.weight}g` : (r.color || date || ""));

  return (
    <TileFrame>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-display, sans-serif)", fontWeight: 700, fontSize: "1.9em", ...ellipsis }}>
          Beere Kesava &amp; Brothers Silks
        </span>
        <span style={{ fontFamily: "var(--font-code, ui-monospace, monospace)", fontSize: "1.7em", flexShrink: 0 }}>
          {r.batchId || ""}
        </span>
      </div>

      <TileCode code={r.sareeId} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", fontFamily: "var(--font-ui, sans-serif)", fontSize: "1.8em" }}>
        <span style={{ minWidth: 0, ...ellipsis }}>{left}</span>
        <span style={{ flexShrink: 0, fontWeight: 700 }}>{right}</span>
      </div>
    </TileFrame>
  );
}

/** External-purchase piece tag — its own barcode plus invoice / serial /
 *  ciphered cost / selling price. Cost is cipher-encoded (see costCipher.ts);
 *  selling price is plain rupees. */
function ExternalTagCard({ r }: { r: SareeTagData }) {
  const typeLabel = r.sareeTypeCode
    ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}`
    : (r.sareeTypeName || "");
  const left = [r.invoiceNumber || null, r.serial || null].filter(Boolean).join(" · ") || typeLabel || "—";

  return (
    <TileFrame>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-display, sans-serif)", fontWeight: 700, fontSize: "1.9em", ...ellipsis }}>
          Beere Kesava &amp; Brothers Silks
        </span>
        {/* Cost price is never printed as a plain number — encoded via the
            LORD GANESH letter cipher (see costCipher.ts) so a customer can't
            read it while staff who know the phrase can decode it back. */}
        <span style={{ fontFamily: "var(--font-code, ui-monospace, monospace)", fontSize: "1.7em", letterSpacing: "0.04em", flexShrink: 0 }}>
          {r.costPrice != null ? encodeCostCipher(r.costPrice) : ""}
        </span>
      </div>

      <TileCode code={r.sareeId} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", fontFamily: "var(--font-ui, sans-serif)", fontSize: "1.8em" }}>
        <span style={{ minWidth: 0, ...ellipsis }}>{left}</span>
        <span style={{ flexShrink: 0, fontWeight: 700 }}>
          {r.sellingPrice != null ? formatMoney(rupees(r.sellingPrice)) : ""}
        </span>
      </div>
    </TileFrame>
  );
}

function TagSheet({ rows, stock }: { rows: SareeTagData[]; stock: LabelStock }) {
  return (
    <LabelSheet stock={stock}>
      {/* eslint-disable-next-line react/no-array-index-key -- extra copies of one saree id are intentionally identical */}
      {rows.map((r, i) => <TagCard key={`${r.sareeId}-${i}`} r={r} />)}
    </LabelSheet>
  );
}

/**
 * A single tag rendered exactly as it prints, for on-screen preview — same
 * tile, same stock, same barcode endpoint, magnified with `zoom` so the
 * superadmin's "Live Preview" is the real label rather than a hand-drawn
 * approximation that could drift from it.
 */
export function SareeTagPreview({ tag, stock, zoom = 3 }: { tag: SareeTagData; stock?: LabelStock; zoom?: number }) {
  return (
    <div style={{ ["--label-zoom" as string]: zoom, zoom, width: "fit-content" }}>
      <TagSheet rows={[tag]} stock={stock ?? DEFAULT_LABEL_STOCK} />
    </div>
  );
}

/**
 * Prints one physical tag per row — pass a single row or many.
 *
 * The sticker size comes from superadmin → Label Settings (50mm × 25mm by
 * default); `stockOverride` is for the one screen that offers its own Label
 * Size selector, so that selector actually changes what is printed rather
 * than being decoration.
 */
export function usePrintSareeTags() {
  const { print } = useDocument();
  const stock = useLabelStock();
  return React.useCallback((rows: SareeTagData[], stockOverride?: LabelStock) => {
    if (rows.length === 0) return;
    print(<TagSheet rows={rows} stock={stockOverride ?? stock} />);
  }, [print, stock]);
}
