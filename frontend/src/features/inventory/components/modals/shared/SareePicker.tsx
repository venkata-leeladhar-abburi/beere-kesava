import React, { useState, useMemo, useCallback } from "react";
import { Scan, Package, ChevronDown, ChevronUp, X } from "lucide-react";
import { FinishingReturn } from "../../../../finishing/contexts/FinishingContext";
import { WeaverSareesSection, WeaverSareeRow } from "../../../../weavers/components/WeaverSareesSection";
import { T, F } from "../../theme";

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
export function SareePicker({ available, picked, onChange, label, onBrowseChange }: {
  available: FinishingReturn[];
  picked: FinishingReturn[];
  onChange: (next: FinishingReturn[]) => void;
  label: string;
  onBrowseChange?: (open: boolean) => void;
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
        <button onClick={scan}
          style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: "#FFF", cursor: "pointer" }}>
          <Scan size={15} /> Scan Saree
        </button>
        <button onClick={toggleBrowse}
          style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", background: browse ? T.royalBurgundy : "#FFF", border: `1.5px solid ${browse ? T.royalBurgundy : T.borderMed}`, borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: browse ? "#FFF" : T.royalBurgundy, cursor: "pointer" }}>
          <Package size={15} /> Select from Inventory {browse ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      {scanMsg && (
        <div style={{ marginTop: 10, fontFamily: F.mono, fontSize: 12, color: T.green, background: T.greenBg, borderRadius: 8, padding: "7px 12px", display: "inline-block" }}>{scanMsg}</div>
      )}

      {/* The page's own inventory table, with its tabs and filters intact */}
      {browse && (
        <div style={{ marginTop: 12, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 16, maxHeight: 460, overflowY: "auto" }}>
          <WeaverSareesSection
            ownerType="all"
            selectable
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
              <span key={sId} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF", border: `1px solid ${T.borderMed}`, borderRadius: 999, padding: "5px 8px 5px 12px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                {sId}
                <button onClick={() => onChange(picked.filter(s => (s.sareeId || s.id) !== sId))} title="Remove"
                  style={{ background: "rgba(192,57,43,0.10)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <X size={11} color={T.crimson} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
