import React, { useState } from "react";
import { ArrowLeft, ClipboardCheck, ArrowRight } from "lucide-react";
import { ProductionDialog } from "@/features/production";
import { PageShell } from "../../../shared/ui/PageShell";
import { Button } from "../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#3D0E1A",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  antiqueGold: "#C89B47",
  crimson: "#8A1224",
  darkGreen: "#184E34",
  borderDef: "rgba(110,15,45,0.10)",
};

const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

const luxuryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `1.5px solid ${T.royalBurgundy}`,
  padding: 22,
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const QC_QUEUE = [
  { batchId: "BATCH-081", weaver: "Suresh Murti", sareeType: "Plain Silk", count: 4, submitted: "20 May 2026" },
  { batchId: "BATCH-084", weaver: "Anand K.",     sareeType: "Bridal Special", count: 8, submitted: "21 May 2026" },
  { batchId: "BATCH-088", weaver: "Ravi Kumar",   sareeType: "Heavy Zari", count: 6, submitted: "22 May 2026" },
  { batchId: "BATCH-090", weaver: "Kamala B.",    sareeType: "Self Brocade", count: 5, submitted: "22 May 2026" },
];

export function QcHistoryPage({ onBack }: { onBack?: () => void }) {
  const [selected, setSelected] = useState<typeof QC_QUEUE[0] | null>(null);

  return (
    <PageShell>
      <div className="px-[var(--gutter-page-x)] py-[var(--gutter-page-y)]">
        <Breadcrumbs
          items={[
            { key: "production", label: "Production", onClick: onBack },
            { key: "quality-control", label: "Quality Control", onClick: onBack },
            { key: "qc-history", label: "Full QC History" },
          ]}
        />
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
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${q.batchId}-${i}`}
                  style={luxuryCardStyle}
                >
                  <CardBloom />
                  
                  <div>
                    {/* Top Row: Batch ID badge & Status Pill */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{
                        background: "rgba(110,15,45,0.06)", border: `1px solid rgba(110,15,45,0.15)`,
                        borderRadius: 8, padding: "4px 10px",
                        fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy,
                      }}>
                        {q.batchId}
                      </div>
                      <div style={{
                        background: "rgba(200,155,71,0.12)", border: `1px solid rgba(200,155,71,0.25)`,
                        borderRadius: 20, padding: "3px 10px",
                        fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.antiqueGold,
                      }}>
                        Awaiting QC
                      </div>
                    </div>

                    {/* Weaver Name */}
                    <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 6px 0", lineHeight: 1.2 }}>
                      {q.weaver}
                    </h3>

                    {/* Sarees Count & Type */}
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>
                      {q.count} sarees <span style={{ color: T.taupe, fontWeight: 400 }}>· {q.sareeType}</span>
                    </div>

                    {/* Submission Date */}
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 18 }}>
                      Submitted {q.submitted}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    iconRight={ArrowRight}
                    onClick={() => setSelected(q)}
                    className="rounded-[10px] bg-[#6E0F2D] hover:bg-[#3D0E1A] h-auto py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors"
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
