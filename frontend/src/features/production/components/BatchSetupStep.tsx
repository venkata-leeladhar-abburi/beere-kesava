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
  /** Editing an existing (saved) batch — the table already exists, so it must
   *  never be regenerated from scratch: that would wipe every assignment. */
  isEditing: boolean;
  /** Live row count, shown read-only in place of the count input while editing. */
  rowCount: number;
  /** Batch lifecycle state of the record being edited, for the header chip. */
  batchStatus?: "draft" | "active" | "completed";
}

const readOnlyFld: React.CSSProperties = {
  ...fld,
  display: "flex",
  alignItems: "center",
  background: T.warmCream,
  color: T.taupe,
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  fontWeight: 700,
  borderStyle: "dashed",
  cursor: "default",
};

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
  isEditing,
  rowCount,
  batchStatus,
}: BatchSetupStepProps) {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
      <SectionCard
        icon={ClipboardList}
        title={isEditing ? "Batch Details" : "Batch Setup"}
        subtitle={isEditing
          ? "Editing an existing batch — update the due date, then use the table below to change saree assignments."
          : "Set the batch ID, saree count, and due date to generate the saree table."}
      >
        <div
          className={isEditing
            ? "grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr]"
            : "grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto]"}
          style={{ gap: 16, alignItems: "end" }}
        >
          <div>
            <span style={lbl}>Batch ID</span>
            <div style={readOnlyFld}>{batchId}</div>
          </div>
          <div>
            {isEditing ? (
              <>
                {/* No count input while editing: rows are added with "Add No. of
                    Sarees" and removed with "Remove Row(s)", both of which keep
                    the existing assignments intact. */}
                <span style={lbl}>Total Sarees</span>
                <div style={readOnlyFld}>
                  {rowCount}
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, marginLeft: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    in this batch
                  </span>
                </div>
              </>
            ) : (
              <>
                <span style={lbl}>Total Saree Count <span style={{ color: T.royalBurgundy }}>*</span></span>
                <NumberInput min={1} max={500} value={totalCount === "" ? "" : Number(totalCount)}
                  onValueChange={v => { setTotalCount(v === "" ? "" : String(v)); setGenerated(false); }}
                  placeholder="e.g. 30" />
              </>
            )}
          </div>
          <div>
            <label style={lbl} htmlFor="due-date">Due Date</label>
            <DatePicker
              id="due-date"
              value={dueDate ? new Date(dueDate) : null}
              onChange={date => setDueDate(date ? formatDate(date, "iso") : "")}
            />
          </div>
          {!isEditing && (
            <Button onClick={generateRows} disabled={!totalCount || parseInt(totalCount, 10) < 1} variant="primary" size="lg">
              Generate Table →
            </Button>
          )}
        </div>

        {isEditing && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: F.ui, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px",
              color: batchStatus === "active" ? T.green : T.amber,
              background: batchStatus === "active" ? "rgba(30,102,64,0.10)" : "rgba(183,121,31,0.10)",
              border: `1px solid ${batchStatus === "active" ? "rgba(30,102,64,0.25)" : "rgba(183,121,31,0.25)"}`,
              borderRadius: 999, padding: "3px 10px",
            }}>
              {batchStatus === "active" ? "Active batch" : batchStatus === "completed" ? "Completed batch" : "Draft batch"}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
              The saree count is fixed here — add rows with <strong>Add No. of Sarees</strong> below, or select rows and use <strong>Remove Row(s)</strong>.
            </span>
          </div>
        )}
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
