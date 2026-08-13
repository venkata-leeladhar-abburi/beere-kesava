import React from "react";
import { AlertCircle as WarningCircle, ClipboardList } from "lucide-react";
import { T, F, fld, lbl } from "./batch-creation/constants";
import { SareeRow } from "../contexts/BatchContext";
import { Button, NumberInput } from "../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../shared/ui/date";
import { SectionCard } from "./common/primitives";

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
      <div style={{ marginBottom: 24 }}>
      <SectionCard icon={ClipboardList} title="Batch Setup" subtitle="Set the batch ID, saree count, and due date to generate the saree table.">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto]" style={{ gap: 16, alignItems: "end" }}>
          <div>
            <label style={lbl}>Batch ID</label>
            <div style={{ ...fld, display: "flex", alignItems: "center", background: T.warmCream, color: T.taupe, fontFamily: F.mono, fontSize: 14, fontWeight: 700, borderStyle: "dashed", cursor: "default" }}>
              {batchId}
            </div>
          </div>
          <div>
            <label style={lbl}>Total Saree Count <span style={{ color: T.royalBurgundy }}>*</span></label>
            <NumberInput min={1} max={500} value={totalCount === "" ? "" : Number(totalCount)}
              onValueChange={v => { setTotalCount(v === "" ? "" : String(v)); setGenerated(false); }}
              placeholder="e.g. 30" />
          </div>
          <div>
            <label style={lbl} htmlFor="due-date">Due Date</label>
            <DatePicker
              id="due-date"
              value={dueDate ? new Date(dueDate) : null}
              onChange={date => setDueDate(date ? formatDate(date, "iso") : "")}
            />
          </div>
          <Button onClick={generateRows} disabled={!totalCount || parseInt(totalCount, 10) < 1} variant="primary" size="lg">
            Generate Table →
          </Button>
        </div>
      </SectionCard>
      </div>

      {generated && incompleteRows.length > 0 && (
        <div style={{ background: "rgba(183,121,31,0.08)", border: "1px solid rgba(183,121,31,0.28)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <WarningCircle size={17} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />
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
