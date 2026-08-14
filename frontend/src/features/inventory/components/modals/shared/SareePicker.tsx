import React, { useState, useMemo, useCallback } from "react";
import { Scan, Package, ChevronDown, ChevronUp } from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { WeaverSareesSection, WeaverSareeRow } from "@/features/weavers";
import { T, F } from "../../theme";
import { Button, Chip } from "../../../../../shared/ui/primitives";

// ── Row → dispatch-saree mapper ───────────────────────────────────────────────
// One definition shared by the page and the in-modal picker so a saree looks the
// same however it was added.
export function rowToDispatchSaree(r: WeaverSareeRow): FinishingReturn {
  return {
    id: r.sareeId,
    assignmentId: "DIRECT-DISPATCH",
    sareeId: r.sareeId,
    designCode: r.designCode || "",
    sareeTypeCode: r.sareeTypeCode,
    sareeType: r.sareeTypeName || r.sareeTypeCode || "—",
    weaverName: r.ownerLabel || "—",
    condition: "perfect",
    receivedBy: "Admin",
    receivedDate: r.finishingCompletedDate || r.qcDate || r.assignedDate || "",
    inventoryStatus: "Ready for Dispatch",
  };
}

// ── Saree picker (scan + pick from inventory) ─────────────────────────────────
// "Select from Inventory" embeds the very same inventory table the page shows —
// identical columns, tabs and filters — so nothing has to be learned twice.
export function SareePicker({ available, picked, onChange, label, onBrowseChange, requireFinishingComplete = true }: {
  available: FinishingReturn[];
  picked: FinishingReturn[];
  onChange: (next: FinishingReturn[]) => void;
  label: string;
  onBrowseChange?: (open: boolean) => void;
  /** False lets a QC-passed-but-not-yet-finished saree be picked — only
   * RaiseQuotationModal sets this, since raising a quotation has no backend
   * eligibility check (unlike an actual dispatch, which does). */
  requireFinishingComplete?: boolean;
}) {
  const [browse, setBrowse] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [rows, setRows] = useState<WeaverSareeRow[]>([]);

  const pickedIds = useMemo(() => new Set(picked.map(s => s.sareeId || s.id)), [picked]);
  // Before the table has been opened it has reported no rows, so the page's
  // pool stands in for scanning.
  const pool = rows.length ? rows.map(rowToDispatchSaree) : available;
  const unpicked = pool.filter(s => !pickedIds.has(s.sareeId || s.id));

  const toggleBrowse = () => setBrowse(b => { onBrowseChange?.(!b); return !b; });

  const toggleRow = useCallback((sareeId: string) => {
    if (pickedIds.has(sareeId)) { onChange(picked.filter(s => (s.sareeId || s.id) !== sareeId)); return; }
    const row = rows.find(r => r.sareeId === sareeId);
    const found = row ? rowToDispatchSaree(row) : available.find(s => (s.sareeId || s.id) === sareeId);
    if (found) onChange([...picked, found]);
  }, [pickedIds, picked, rows, available, onChange]);

  const toggleAll = useCallback((ids: string[]) => {
    const allOn = ids.length > 0 && ids.every(id => pickedIds.has(id));
    if (allOn) { onChange(picked.filter(s => !ids.includes(s.sareeId || s.id))); return; }
    const additions = ids
      .filter(id => !pickedIds.has(id))
      .map(id => {
        const row = rows.find(r => r.sareeId === id);
        return row ? rowToDispatchSaree(row) : available.find(s => (s.sareeId || s.id) === id);
      })
      .filter(Boolean) as FinishingReturn[];
    onChange([...picked, ...additions]);
  }, [pickedIds, picked, rows, available, onChange]);

  // Mirrors the page's barcode simulation — grabs the next unpicked saree.
  const scan = () => {
    if (!unpicked.length) { setScanMsg("No more sarees available to scan."); setTimeout(() => setScanMsg(""), 2200); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const s = unpicked[Math.floor(Math.random() * unpicked.length)];
      onChange([...picked, s]);
      setScanMsg(`Scanned: ${s.sareeId || s.id}`);
      setTimeout(() => setScanMsg(""), 1800);
    }, 450);
  };

  return (
    <div style={{ border: `1.5px solid ${T.borderGold}`, background: "rgba(200,155,71,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.05em", flex: 1 }}>
          {label} <span style={{ color: T.royalBurgundy }}>({picked.length})</span>
        </span>
        <Button
          onClick={scan}
          variant="primary"
          size="sm"
          iconLeft={Scan}
          className="rounded-[10px] bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)]"
        >
          Scan Saree
        </Button>
        <Button
          onClick={toggleBrowse}
          variant={browse ? "primary" : "secondary"}
          size="sm"
          iconLeft={Package}
          iconRight={browse ? ChevronUp : ChevronDown}
          className={browse ? "rounded-[10px] bg-[var(--bk-burgundy-900)]" : "rounded-[10px]"}
        >
          Select from Inventory
        </Button>
      </div>
      {scanMsg && (
        <div style={{ marginTop: 10, fontFamily: F.ui, fontSize: 12, color: T.green, background: T.greenBg, borderRadius: 8, padding: "7px 12px", display: "inline-block" }}>{scanMsg}</div>
      )}

      {/* The page's own inventory table, with its tabs and filters intact */}
      {browse && (
        <div style={{ marginTop: 12, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 16, maxHeight: 460, overflowY: "auto" }}>
          <WeaverSareesSection
            ownerType="all"
            selectable
            requireFinishingComplete={requireFinishingComplete}
            selectedIds={pickedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onVisibleChange={setRows}
          />
        </div>
      )}

      {/* Picked chips */}
      {picked.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 12 }}>
          {picked.map(s => {
            const sId = s.sareeId || s.id;
            return (
              <Chip
                key={sId}
                label={sId}
                onRemove={() => onChange(picked.filter(s => (s.sareeId || s.id) !== sId))}
                className="font-code"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
