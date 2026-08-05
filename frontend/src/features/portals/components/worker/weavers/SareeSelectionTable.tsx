import React from "react";
import { CheckCircle2, AlertTriangle, Square } from "lucide-react";
import { C, F } from "../tokens";
import { type WeaverBatchData, type WEAVERS } from "./weaversData";
import { IconButton, Select, SelectItem } from "../../../../../shared/ui/primitives";

interface SareeSelectionTableProps {
  currentBatch: WeaverBatchData;
  selectedWeaver: typeof WEAVERS[0];
  doneCount: number;
  sareeSort: "serial" | "status";
  setSareeSort: (sort: "serial" | "status") => void;
  selectedSareeNo: number | null;
  selectSareeSlot: (no: number) => void;
}

export function SareeSelectionTable({
  currentBatch,
  selectedWeaver,
  doneCount,
  sareeSort,
  setSareeSort,
  selectedSareeNo,
  selectSareeSlot,
}: SareeSelectionTableProps) {
  return (
    <div style={{ margin: "10px 16px 0" }}>
      <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        Sarees in {currentBatch.id}
      </div>
      <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${C.bdr}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text }}>{currentBatch.total} Sarees</span>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 999, padding: "3px 9px" }}>
              {doneCount} complete
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Sort by</span>
            <Select value={sareeSort} onValueChange={v => setSareeSort(v as "serial" | "status")} size="sm">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </Select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr style={{ background: "rgba(196,146,58,0.10)" }}>
                {["", "#", "Saree ID", "Weaver / Loom", "Loom No.", "Saree Type", "Bulk Order", "Status"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "8px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...currentBatch.sarees]
                .sort((a, b) => sareeSort === "status" ? a.status.localeCompare(b.status) : a.no - b.no)
                .map((s, idx) => {
                  const isSel = selectedSareeNo === s.no;
                  const rowSareeId = `${selectedWeaver.name.split(" ")[0].toUpperCase()}-L${selectedWeaver.looms}-00${s.no}`;
                  const statusCfg = s.status === "received" ? { label: "Received", bg: "rgba(30,102,64,0.10)", col: C.green }
                    : s.status === "defective" ? { label: "Defective", bg: "rgba(220,53,69,0.10)", col: C.crim }
                    : { label: "Pending", bg: "rgba(196,146,58,0.12)", col: C.gold };
                  return (
                    <tr key={s.no} onClick={() => selectSareeSlot(s.no)}
                      style={{ background: isSel ? "rgba(107,26,42,0.05)" : idx % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.5)", borderBottom: `1px solid rgba(107,26,42,0.06)`, cursor: s.status === "pending" ? "pointer" : "default" }}>
                      <td style={{ padding: "9px 10px" }}>
                        {s.status === "pending" ? (
                          <IconButton
                            icon={isSel ? CheckCircle2 : Square}
                            label={isSel ? "Deselect saree" : "Select saree"}
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); selectSareeSlot(s.no); }}
                            className={isSel ? "text-[#6B1A2A]" : "text-[rgba(139,26,46,0.20)]"}
                          />
                        ) : (
                          <IconButton
                            icon={s.status === "received" ? CheckCircle2 : AlertTriangle}
                            label={s.status === "received" ? "Received" : "Defective"}
                            variant="ghost"
                            size="sm"
                            disabled
                            className={s.status === "received" ? "text-[#1E6640]" : "text-[#C0392B]"}
                          />
                        )}
                      </td>
                      <td style={{ padding: "9px 10px", fontFamily: F.m, fontSize: 12, color: C.muted }}>{s.no}</td>
                      <td style={{ padding: "9px 10px" }}>
                        {s.status === "pending" ? (
                          <span
                            style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: isSel ? "#FFF" : C.burg, background: isSel ? C.burg : "rgba(107,26,42,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                            {rowSareeId}
                          </span>
                        ) : (
                          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.text, background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "3px 8px" }}>{rowSareeId}</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: F.d, fontSize: 7, fontWeight: 700, color: "#FFF" }}>{selectedWeaver.avatar}</span>
                          </div>
                          <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{selectedWeaver.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.gold, background: "rgba(196,146,58,0.10)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 6, padding: "3px 8px" }}>Loom {selectedWeaver.looms}</span>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "3px 8px" }}>{currentBatch.sareeTypeCode}</span>
                      </td>
                      <td style={{ padding: "9px 10px", fontFamily: F.u, fontSize: 12, color: currentBatch.bulkOrderLabel ? C.burg : C.muted }}>
                        {currentBatch.bulkOrderLabel ?? "—"}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: statusCfg.col, background: statusCfg.bg, borderRadius: 999, padding: "3px 9px" }}>{statusCfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
