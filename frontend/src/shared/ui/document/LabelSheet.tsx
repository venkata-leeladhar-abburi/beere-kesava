/**
 * LabelSheet — the one place that knows how big a physical label is.
 * ═══════════════════════════════════════════════════════════════════════════
 * Every printed sticker in the app (GRN material labels, saree receive tags,
 * shop/inventory tag prints) used to be hard-coded to an A4-tiled 82×46mm or
 * 60×44mm box. The labels actually loaded in the roll printer are 50mm × 25mm,
 * so the tile overflowed its sticker and printed the top slice only, with the
 * rest running onto the backing paper.
 *
 * Now every label sheet renders through this component:
 *   • the tile is exactly the configured stock size, in mm,
 *   • one label per page, via a named `@page bk-label` box whose `size` is
 *     written at print time (an @page rule can't read a CSS variable), so a
 *     roll printer feeds exactly one sticker per label,
 *   • type inside a tile is sized in `em` off `--label-unit`, which scales
 *     with the stock, so the same layout stays proportional on 50×25 and on
 *     100×50 if a superadmin changes the roll.
 *
 * The size comes from superadmin → Label Settings (LabelSettings.labelSize);
 * the default, and the fallback whenever those settings can't be read, is
 * 50mm × 25mm.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { labelsApi } from "../../api/labels";

export interface LabelStock {
  widthMm: number;
  heightMm: number;
}

/** The roll currently in use. Also the fallback when settings are unreadable. */
export const DEFAULT_LABEL_STOCK: LabelStock = { widthMm: 50, heightMm: 25 };
export const DEFAULT_LABEL_SIZE = "50mm × 25mm (Default)";

/** Offered in superadmin → Label Settings. Any "<w>mm × <h>mm" string parses,
 *  so this list is a convenience, not a constraint. */
export const LABEL_SIZE_OPTIONS = [
  DEFAULT_LABEL_SIZE,
  "50mm × 40mm",
  "60mm × 40mm",
  "75mm × 50mm",
  "80mm × 40mm",
  "100mm × 50mm",
];

/** "50mm × 25mm (Default)" → { widthMm: 50, heightMm: 25 }. Accepts ×, x or *
 *  as the separator and tolerates a missing "mm" on either number. */
export function parseLabelSize(size: string | null | undefined): LabelStock {
  if (!size) return DEFAULT_LABEL_STOCK;
  const m = /(\d+(?:\.\d+)?)\s*(?:mm)?\s*[×x*]\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i.exec(size);
  if (!m) return DEFAULT_LABEL_STOCK;
  const widthMm = Number(m[1]);
  const heightMm = Number(m[2]);
  if (!(widthMm > 0) || !(heightMm > 0)) return DEFAULT_LABEL_STOCK;
  return { widthMm, heightMm };
}

/**
 * The configured label stock. Never suspends and never throws — while the
 * settings request is in flight, or if it fails (the endpoint is public, but
 * a print shouldn't depend on the network being up), it returns the 50×25
 * default, so a print triggered immediately on page load still lands on the
 * right sticker.
 */
export function useLabelStock(): LabelStock {
  const { data } = useQuery({
    queryKey: ["label-settings"],
    queryFn: () => labelsApi.getSettings(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return React.useMemo(() => parseLabelSize(data?.labelSize), [data?.labelSize]);
}

/** The stock the surrounding <LabelSheet> is rendering, so a tile can size a
 *  code line against the width it actually has. */
const LabelStockContext = React.createContext<LabelStock>(DEFAULT_LABEL_STOCK);

/** For use inside a tile: the stock it is being printed on. */
export function useTileStock(): LabelStock {
  return React.useContext(LabelStockContext);
}

/**
 * The largest font size (in `em`, i.e. label units) at which `len` monospace
 * characters still fit `availableEm` — so a long id shrinks to fit instead of
 * being ellipsised. A truncated code is worse than a small one: the whole
 * point of the line is that a human can read back what the barcode holds.
 *
 * 0.62em per character is the advance width of the mono stacks in use
 * (JetBrains Mono / ui-monospace), rounded up so the estimate never
 * under-reserves.
 */
export function monoFitEm(len: number, availableEm: number, max: number, min: number): number {
  if (len <= 0) return max;
  return Math.max(min, Math.min(max, availableEm / (0.62 * len)));
}

/** A tile's usable inner width in `em`, i.e. the stock width less the 1.2em
 *  padding on each side that TileFrame applies. */
export function innerWidthEm(stock: LabelStock): number {
  return (stock.widthMm / unitMm(stock)) - 2.4;
}

/** The em-unit a tile's type is sized against: 1/25th of the label height, so
 *  "1.6em" means the same fraction of the sticker on every stock size. */
function unitMm(stock: LabelStock): number {
  return stock.heightMm / 25;
}

export interface LabelSheetProps {
  stock?: LabelStock;
  /** One child per sticker. Each is wrapped in an exactly-sized tile. */
  children: React.ReactNode;
}

/**
 * Wraps label tiles for printing: sets the page box to the sticker size and
 * emits one tile per page. Children are the tile *contents* — the box, its
 * border and its padding are supplied here so no caller can drift.
 */
export function LabelSheet({ stock = DEFAULT_LABEL_STOCK, children }: LabelSheetProps) {
  const { widthMm, heightMm } = stock;
  const u = unitMm(stock);
  const tiles = React.Children.toArray(children);
  return (
    <div
      className="bk-label-sheet"
      style={{
        // Consumed by .bk-label-sheet rules in print.css.
        ["--label-w" as string]: `${widthMm}mm`,
        ["--label-h" as string]: `${heightMm}mm`,
        ["--label-unit" as string]: `${u}mm`,
        fontSize: `${u}mm`,
      }}
    >
      {/* An @page rule cannot read a custom property, so the page box is
          written out literally for whatever stock is configured. margin 0 —
          the sticker has no margin; its own padding does that job. */}
      <style>{`@page bk-label { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`}</style>
      <LabelStockContext.Provider value={stock}>
        {tiles.map((tile, i) => (
          // eslint-disable-next-line react/no-array-index-key -- copies of one label are intentionally identical
          <div key={i} className="bk-label-tile">{tile}</div>
        ))}
      </LabelStockContext.Provider>
    </div>
  );
}
