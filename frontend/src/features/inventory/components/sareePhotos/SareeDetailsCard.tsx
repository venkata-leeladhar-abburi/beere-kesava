import type { SareePhotoRecord } from "@/shared/api/saree-photos";
import { T, F } from "../theme";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const QC_LABEL = { PASSED: "Passed", SEMI: "Semi-approved", DEFECTIVE: "Defective" } as const;

const STAGE_COLOR: Record<string, string> = {
  "QC passed": T.green,
  "Purchased stock": T.green,
  "Received — awaiting QC": "#8B6018",
  "Back with weaver for rework": T.crimson,
  "Returned to supplier": T.taupe,
  "Not yet received": T.taupe,
};

/** Everything known about one saree, laid out for a quick visual check before photographing it. */
export function SareeDetailsCard({ record, compact = false }: { record: SareePhotoRecord; compact?: boolean }) {
  const p = record.purchase;
  const stageColor = STAGE_COLOR[record.stage] ?? T.luxuryBrown;
  const weight = record.weightG != null ? `${record.weightG.toLocaleString("en-IN")} g` : null;

  const facts: [string, string | null][] = record.origin === "production"
    ? [
        ["Design", record.designCode ? [record.designCode, record.designName].filter(Boolean).join(" · ") : null],
        ["Saree type", record.sareeType],
        ["Colour", record.color],
        ["Weight", weight],
        [record.maker?.kind === "loom" ? "Factory loom" : "Weaver", record.maker?.label ?? null],
        ["Batch", record.batchId],
        ["Received", formatDate(record.receivedAt)],
        ["QC", record.qc ? `${QC_LABEL[record.qc.result]} · ${formatDate(record.qc.date)}` : null],
      ]
    : [
        ["Supplier", p?.supplier ?? null],
        ["Purchase", p?.id ?? null],
        ["Invoice", p?.invoiceNumber ?? null],
        ["Bought on", formatDate(p?.date)],
        ["Serial", p ? `${p.lineCode} · piece ${p.pieceNo} of ${p.lineQuantity}` : null],
        ["Saree type", record.sareeType],
        ["Colour", record.color],
        ["Weight", weight],
      ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.taupe }}>
            {record.origin === "production" ? "Woven saree" : "Purchased saree"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: compact ? 16 : 20, fontWeight: 700, color: T.royalBurgundy, overflowWrap: "anywhere", marginTop: 2 }}>
            {record.sareeId}
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: stageColor, background: `${stageColor}14`, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: stageColor }} />
          {record.stage}
        </span>
      </div>

      <dl className={compact ? "grid grid-cols-2 gap-x-4 gap-y-2" : "grid grid-cols-2 sm:grid-cols-2 gap-x-5 gap-y-3"} style={{ marginTop: 14, marginBottom: 0 }}>
        {facts.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <dt style={{ fontFamily: F.ui, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T.taupe }}>{label}</dt>
            <dd style={{ margin: "2px 0 0", fontFamily: F.ui, fontSize: compact ? 13 : 14, fontWeight: 600, color: value ? T.luxuryBrown : T.taupe, overflowWrap: "anywhere" }}>
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
