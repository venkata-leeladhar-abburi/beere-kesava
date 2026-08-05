import React, { useState } from "react";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { ProductionDialog } from "../../production/components/ProductionPage";
import { PageShell } from "../../../shared/ui/PageShell";
import { Button } from "../../../shared/ui/primitives";

const T = { silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D", deepWine: "#4A061B", luxuryBrown: "#3B2314", taupe: "#69635E", green: "#1E6640", crimson: "#C0392B", borderDef: "rgba(110,15,45,0.10)" };
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

const QC_QUEUE = [
  { batchId: "BATCH-081", weaver: "Suresh Murti", sareeType: "Plain Silk", count: 4, submitted: "20 May 2026" },
  { batchId: "BATCH-084", weaver: "Anand K.",     sareeType: "Bridal Special", count: 8, submitted: "21 May 2026" },
  { batchId: "BATCH-088", weaver: "Ravi Kumar",   sareeType: "Heavy Zari", count: 6, submitted: "22 May 2026" },
  { batchId: "BATCH-090", weaver: "Kamala B.",    sareeType: "Self Brocade", count: 5, submitted: "22 May 2026" },
];

/**
 * Migrated onto PageShell — design-system/02-LAYOUT.md Part E — as the
 * Step 2.6 proof case. Previously this page hand-rolled its own gradient
 * hero, its own minHeight, and a hardcoded `repeat(3, 1fr)` grid; those are
 * now PageShell.Header and the `.bk-layout-cards` recipe respectively
 * (auto-fit/minmax, reflows without a media query).
 */
export function QcHistoryPage({ onBack }: { onBack?: () => void }) {
  const [selected, setSelected] = useState<typeof QC_QUEUE[0] | null>(null);

  return (
    <PageShell>
      <div className="px-[var(--gutter-page-x)] py-[var(--gutter-page-y)]">
        <PageShell.Header
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.display }}>
              <ClipboardCheck size={26} color={T.royalBurgundy} />
              Full QC History
            </span>
          }
          subtitle="All batches awaiting and completed quality checks."
          actions={
            onBack && (
              <Button
                variant="secondary"
                size="md"
                iconLeft={ArrowLeft}
                onClick={onBack}
              >
                Back to Production
              </Button>
            )
          }
        />

        <PageShell.Content>
          <PageShell.Section id="qc-queue">
            <div className="bk-layout-cards">
              {QC_QUEUE.concat(QC_QUEUE).map((q, i) => (
                <div
                  key={`${q.batchId}-${i}`}
                  style={{
                    background: "#fff", border: `1px solid ${T.borderDef}`,
                    borderLeft: `5px solid ${i % 3 === 0 ? T.green : T.crimson}`,
                    borderRadius: 18, padding: 22, boxShadow: "0 6px 24px rgba(74,6,27,0.07)",
                  }}
                >
                  <div style={{ fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700 }}>{q.batchId}</div>
                  <h3 style={{ fontFamily: F.display, color: T.luxuryBrown, margin: "8px 0" }}>{q.weaver}</h3>
                  <div style={{ color: T.taupe, lineHeight: 1.6 }}>
                    {q.count} sarees · {q.sareeType}
                    <br />
                    Submitted {q.submitted}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => setSelected(q)}
                    className="mt-[18px]"
                  >
                    Start QC
                  </Button>
                </div>
              ))}
            </div>
          </PageShell.Section>
        </PageShell.Content>
      </div>

      {selected && (
        <ProductionDialog open={!!selected} title="Start quality check" onClose={() => setSelected(null)}>
          <div style={{ fontFamily: F.ui, color: T.luxuryBrown }}>
            Begin QC for <b>{selected.batchId}</b> from {selected.weaver}. Record pass/reject results for{" "}
            {selected.count} sarees.
          </div>
        </ProductionDialog>
      )}
    </PageShell>
  );
}
