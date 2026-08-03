import React, { useState } from "react";
import { ChevronDown, QrCode } from "lucide-react";
import { F, GrnBatch, T } from "./theme";

// ── GRN batch selector (searchable + scan simulation) ─────────────────────────
export function GrnBatchSelector({ grnBatches, materialType, value, onChange }: {
  grnBatches: GrnBatch[]; materialType: "Warp" | "Resham" | "Jari"; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = grnBatches.filter(g => g.materialType === materialType && (q.length < 1 || g.grnBatchId.toLowerCase().includes(q.toLowerCase()) || g.vendor.toLowerCase().includes(q.toLowerCase())));
  const selected = grnBatches.find(g => g.grnBatchId === value);

  const handleScan = () => {
    // Simulated barcode scan — auto-select the first available batch of this material type
    const first = grnBatches.find(g => g.materialType === materialType);
    if (first) onChange(first.grnBatchId);
  };

  return (
    <div style={{ position: "relative" as const }}>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>GRN Batch</label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" as const }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${open ? T.royalBurgundy : T.borderDef}`,
            background: "#FFF", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", fontFamily: selected ? F.mono : F.ui, fontSize: 13, color: selected ? T.royalBurgundy : T.taupe,
          }}>
            {selected ? selected.grnBatchId : "Select GRN batch…"}
            <ChevronDown size={14} color={T.taupe} />
          </button>
          {open && (
            <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "#FFF", border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, boxShadow: "0 8px 28px rgba(74,6,27,0.16)", overflow: "hidden" }}>
              <div style={{ padding: 8, borderBottom: `1px solid ${T.borderDef}` }}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search batch ID or vendor…"
                  style={{ width: "100%", height: 34, borderRadius: 8, border: `1px solid ${T.borderDef}`, padding: "0 10px", fontFamily: F.ui, fontSize: 12.5, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" as const }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 14, textAlign: "center" as const, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>No {materialType} batches found</div>
                ) : filtered.map(g => (
                  <button key={g.grnBatchId} onClick={() => { onChange(g.grnBatchId); setOpen(false); setQ(""); }} style={{
                    width: "100%", textAlign: "left" as const, padding: "10px 14px", border: "none", borderBottom: `1px solid ${T.borderDef}`,
                    background: value === g.grnBatchId ? "rgba(110,15,45,0.05)" : "#FFF", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, fontWeight: 700 }}>{g.grnBatchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.green }}>{g.availableQty} {g.unit} left</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{g.vendor} · {g.dateReceived}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleScan} title="Scan GRN Batch Barcode" style={{
          height: 44, width: 44, borderRadius: 10, border: `1.5px solid ${T.borderGold}`, background: T.warmCream,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}><QrCode size={17} color={T.royalBurgundy} /></button>
      </div>
      {selected && (
        <div style={{ marginTop: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Available in {selected.grnBatchId}: <strong style={{ color: T.luxuryBrown }}>{selected.availableQty} {selected.unit} remaining</strong>
        </div>
      )}
    </div>
  );
}
