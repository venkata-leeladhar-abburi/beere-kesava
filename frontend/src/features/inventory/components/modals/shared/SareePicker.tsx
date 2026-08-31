import { useState, useMemo, useCallback } from "react";
import { Scan, Package, ChevronDown, ChevronUp } from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { WeaverSareesSection, WeaverSareeRow } from "@/features/weavers";
import { T, F } from "../../theme";
import { Button, Chip, Input } from "../../../../../shared/ui/primitives";
import { CameraScannerModal } from "../../../../../shared/ui/CameraScannerModal";

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
  const [scanValue, setScanValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [rows, setRows] = useState<WeaverSareeRow[]>([]);

  const pickedIds = useMemo(() => new Set(picked.map(s => s.sareeId || s.id)), [picked]);
  // Before the table has been opened it has reported no rows, so the page's
  // pool stands in for scanning.
  const pool = rows.length ? rows.map(rowToDispatchSaree) : available;

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

  // Adds the saree whose id was actually scanned. Barcode scanners type the
  // code and press Enter, so the same input covers scanning and manual entry.
  // This previously picked a *random* unpicked saree regardless of input.
  const scan = (rawId: string) => {
    const id = rawId.trim();
    const show = (msg: string) => { setScanMsg(msg); setTimeout(() => setScanMsg(""), 2200); };
    if (!id) return show("Scan a barcode or type a saree ID.");

    const match = pool.find(s => (s.sareeId || s.id).toLowerCase() === id.toLowerCase());
    if (!match) return show(`No saree "${id}" available here.`);
    if (pickedIds.has(match.sareeId || match.id)) return show(`${match.sareeId || match.id} is already added.`);

    onChange([...picked, match]);
    show(`Added ${match.sareeId || match.id}`);
  };

  const handleDetected = (text: string) => {
    setCameraOpen(false);
    scan(text);
  };

  return (
    <div style={{ border: `1.5px solid ${T.borderGold}`, background: "rgba(200,155,71,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.05em", flex: 1 }}>
          {label} <span style={{ color: T.royalBurgundy }}>({picked.length})</span>
        </span>
        {/* One Scan button covers both routes: with an ID in the field it adds
            that saree, and with the field empty it opens the camera for
            devices with no hardware scanner attached. */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!scanValue.trim()) { setCameraOpen(true); return; }
            scan(scanValue);
            setScanValue("");
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Input
            value={scanValue}
            onChange={e => setScanValue(e.target.value)}
            placeholder="Scan or type saree ID"
            aria-label="Saree ID to scan"
            title="Type an ID and press Scan, or press Scan with the box empty to use the camera"
            className="w-[210px] font-mono"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            iconLeft={Scan}
            className="rounded-[10px] bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)]"
          >
            Scan Saree
          </Button>
        </form>
        <CameraScannerModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onDetected={handleDetected}
          title="Scan Saree Barcode"
          hint="Point the camera at the barcode tag on the saree label."
        />
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
