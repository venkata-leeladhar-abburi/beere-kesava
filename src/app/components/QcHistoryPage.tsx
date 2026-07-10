import React, { useState } from "react";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { ProductionDialog } from "./ProductionPage";
const T = { silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D", deepWine: "#4A061B", luxuryBrown: "#3B2314", taupe: "#8B7060", green: "#1E6640", crimson: "#C0392B", borderDef: "rgba(110,15,45,0.10)" };
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };
const QC_QUEUE = [
  { batchId: "BATCH-081", weaver: "Suresh Murti", sareeType: "Plain Silk", count: 4, submitted: "20 May 2026" },
  { batchId: "BATCH-084", weaver: "Anand K.",     sareeType: "Bridal Special", count: 8, submitted: "21 May 2026" },
  { batchId: "BATCH-088", weaver: "Ravi Kumar",   sareeType: "Heavy Zari", count: 6, submitted: "22 May 2026" },
  { batchId: "BATCH-090", weaver: "Kamala B.",    sareeType: "Self Brocade", count: 5, submitted: "22 May 2026" },
];
export function QcHistoryPage({ onBack }: { onBack?: () => void }) {
  const [selected, setSelected] = useState<typeof QC_QUEUE[0] | null>(null);
  return <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
    <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "34px 48px", color: "#FFFDF9" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", marginBottom: 22 }}><ArrowLeft size={16} /> Back to Production</button>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}><ClipboardCheck size={30} /><div><h1 style={{ margin: 0, fontFamily: F.display, fontSize: 38 }}>Full QC History</h1><p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.68)" }}>All batches awaiting and completed quality checks.</p></div></div>
    </div>
    <div style={{ padding: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {QC_QUEUE.concat(QC_QUEUE).map((q, i) => <div key={`${q.batchId}-${i}`} style={{ background: "#fff", border: `1px solid ${T.borderDef}`, borderLeft: `5px solid ${i % 3 === 0 ? T.green : T.crimson}`, borderRadius: 18, padding: 22, boxShadow: "0 6px 24px rgba(74,6,27,0.07)" }}>
        <div style={{ fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700 }}>{q.batchId}</div><h3 style={{ fontFamily: F.display, color: T.luxuryBrown, margin: "8px 0" }}>{q.weaver}</h3><div style={{ color: T.taupe, lineHeight: 1.6 }}>{q.count} sarees · {q.sareeType}<br />Submitted {q.submitted}</div>
        <button onClick={() => setSelected(q)} style={{ marginTop: 18, width: "100%", background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: 12, fontWeight: 700, cursor: "pointer" }}>Start QC</button>
      </div>)}
    </div>
    {selected && <ProductionDialog open={!!selected} title="Start quality check" onClose={() => setSelected(null)}><div style={{ fontFamily: F.ui, color: T.luxuryBrown }}>Begin QC for <b>{selected.batchId}</b> from {selected.weaver}. Record pass/reject results for {selected.count} sarees.</div></ProductionDialog>}
  </div>;
}
