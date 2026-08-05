import React from "react";
import { motion } from "motion/react";
import { WarningCircle } from "@phosphor-icons/react";
import { T, F, G, fld, lbl } from "./batch-creation/constants";
import { SareeRow } from "../contexts/BatchContext";

interface BatchSetupStepProps {
  batchId: string;
  totalCount: string;
  setTotalCount: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  generateRows: () => void;
  setGenerated: (v: boolean) => void;
  generated: boolean;
  incompleteRows: SareeRow[];
}

export function BatchSetupStep({
  batchId,
  totalCount,
  setTotalCount,
  dueDate,
  setDueDate,
  generateRows,
  setGenerated,
  generated,
  incompleteRows,
}: BatchSetupStepProps) {
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", marginBottom: 24, boxShadow: "0 2px 12px rgba(74,6,27,0.05)" }}>
        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>1</span>
          </div>
          Batch Setup
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "end" }}>
          <div>
            <label style={lbl}>Batch ID</label>
            <div style={{ ...fld, display: "flex", alignItems: "center", background: T.warmCream, color: T.taupe, fontFamily: F.mono, fontSize: 14, fontWeight: 700, borderStyle: "dashed", cursor: "default" }}>
              {batchId}
            </div>
          </div>
          <div>
            <label style={lbl}>Total Saree Count <span style={{ color: T.royalBurgundy }}>*</span></label>
            <input type="number" min={1} max={500} value={totalCount}
              onChange={e => { setTotalCount(e.target.value); setGenerated(false); }}
              style={fld} placeholder="e.g. 30" />
          </div>
          <div>
            <label style={lbl} htmlFor="due-date">Due Date</label>
            <input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={fld} />
          </div>
          <motion.button onClick={generateRows} disabled={!totalCount || parseInt(totalCount, 10) < 1}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ height: 44, padding: "0 24px", background: totalCount && parseInt(totalCount, 10) > 0 ? G.button : T.taupe, color: "#fff", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: totalCount && parseInt(totalCount, 10) > 0 ? 1 : 0.5 }}>
            Generate Table →
          </motion.button>
        </div>
      </div>

      {generated && incompleteRows.length > 0 && (
        <div style={{ background: "rgba(183,121,31,0.08)", border: "1px solid rgba(183,121,31,0.28)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <WarningCircle size={17} color={T.amber} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5A10", lineHeight: 1.6 }}>
            <strong>{incompleteRows.length} row(s) are incomplete</strong> — missing weaver or saree type.
            {" "}Rows {incompleteRows.slice(0, 8).map(r => r.serial).join(", ")}{incompleteRows.length > 8 ? "…" : ""} need attention.
            {" "}You can save as draft and complete them later, but <strong>Finalize</strong> will remain disabled until all rows are complete.
          </div>
        </div>
      )}
    </>
  );
}
