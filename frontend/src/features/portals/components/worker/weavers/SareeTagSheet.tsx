/**
 * The physical saree tag — printed and tied to the piece on receipt.
 * ═══════════════════════════════════════════════════════════════════════════
 * Same contract as the GRN label sheet: printed through useDocument() so only
 * the tags reach the page, tiled across A4 so a sheet runs in one job, and
 * carrying a genuinely scannable code rather than decorative stripes — the
 * shop-staff scanner reads these tags to look a saree up by its id.
 */
import React from "react";
import { ScannableCode } from "@/shared/ui/domain";

export interface SareeTag {
  sareeId: string;
  entityLabel: string;
  entityValue: string;
  date: string;
}

const mono = "var(--font-code, ui-monospace, monospace)";
const ui = "var(--font-ui, system-ui, sans-serif)";

export function SareeTagSheet({ tags }: { tags: SareeTag[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4mm", padding: "8mm", background: "#FFFFFF", width: "194mm" }}>
      {tags.map((tag, i) => (
        <div
          // One saree can be tagged more than once (extra copies), so the id
          // alone isn't unique across the sheet.
          // eslint-disable-next-line react/no-array-index-key -- copies of one id are intentionally identical
          key={`${tag.sareeId}-${i}`}
          style={{
            width: "60mm", height: "44mm", boxSizing: "border-box",
            border: "1px solid #000", borderRadius: "2mm", padding: "3mm",
            display: "flex", flexDirection: "column", alignItems: "center",
            background: "#FFFFFF", color: "#000000",
            breakInside: "avoid", pageBreakInside: "avoid",
          }}
        >
          <div style={{ fontFamily: ui, fontSize: "2.5mm", textAlign: "center" }}>
            Beere Kesava &amp; Brothers Silks · Est. 1999
          </div>
          <ScannableCode value={tag.sareeId} size={104} />
          <div style={{ fontFamily: mono, fontSize: "3.4mm", fontWeight: 700, marginTop: "1mm" }}>{tag.sareeId}</div>
          <div style={{ marginTop: "auto", width: "100%", fontFamily: ui, fontSize: "2.5mm", display: "flex", justifyContent: "space-between", gap: "2mm" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tag.entityLabel}: {tag.entityValue}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{tag.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
