import * as React from "react";
import { useDocument } from "../../../../shared/ui/document";
import { labelsApi } from "../../../../shared/api/labels";
import { formatMoney, rupees } from "@/lib/domain/money";

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

// ── Saree tag print sheet ─────────────────────────────────────────────────────
// A grid of cut-apart tags (barcode + saree id + design/type/colour), printed
// through the same isolated #document-print-root as invoices/quotations so it
// never drags the rest of the app onto paper. Works for one row or many —
// the sheet just wraps as many tags as it's given.
function TagCard({ r }: { r: SareeTagData }) {
  const typeLabel = r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : "—";
  const weaverLine = [r.weaverName || null, r.loomNumber != null ? `Loom ${r.loomNumber}` : null].filter(Boolean).join(" · ");
  const date = ddmmyy(r.date);
  return (
    <div
      style={{
        width: "82mm", height: "46mm", boxSizing: "border-box",
        border: "0.3mm solid var(--doc-burgundy)", borderRadius: "1.5mm",
        padding: "3mm 4mm", display: "flex", flexDirection: "column", justifyContent: "space-between",
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "8pt", color: "var(--doc-burgundy)" }}>
          Beere Kesava &amp; Brothers Silks
        </span>
        <span style={{ fontFamily: "var(--font-code)", fontSize: "7pt", color: "var(--doc-muted)" }}>{r.batchId || "—"}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm" }}>
        <img
          src={labelsApi.barcodeUrl(r.sareeId)}
          alt={`Barcode for ${r.sareeId}`}
          style={{ width: "100%", maxWidth: "68mm", height: "11mm", objectFit: "contain" }}
        />
        <span style={{ fontFamily: "var(--font-code)", fontWeight: 700, fontSize: "9.5pt", color: "var(--doc-ink)" }}>{r.sareeId}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", fontFamily: "var(--font-ui)", fontSize: "7.5pt", color: "var(--doc-ink-soft)" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.designCode ? `${r.designCode} · ` : ""}{typeLabel}</span>
        <span style={{ flexShrink: 0 }}>
          {r.retailPrice != null ? formatMoney(rupees(r.retailPrice)) : (r.color || "—")}
        </span>
      </div>

      {weaverLine && (
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "7.5pt", color: "var(--doc-ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {weaverLine}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", fontFamily: "var(--font-code)", fontSize: "7pt", color: "var(--doc-muted)" }}>
        <span>{r.weight != null ? `${r.weight}g` : "—"}</span>
        <span>{date || "—"}</span>
      </div>
    </div>
  );
}

function TagSheet({ rows }: { rows: SareeTagData[] }) {
  return (
    <div style={{ padding: "10mm 8mm", display: "flex", flexWrap: "wrap", gap: "4mm" }}>
      {rows.map(r => <TagCard key={r.sareeId} r={r} />)}
    </div>
  );
}

/** Prints one physical tag per row — pass a single row or many. */
export function usePrintSareeTags() {
  const { print } = useDocument();
  return React.useCallback((rows: SareeTagData[]) => {
    if (rows.length === 0) return;
    print(<TagSheet rows={rows} />);
  }, [print]);
}
