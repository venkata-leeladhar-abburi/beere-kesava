import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, QrCode } from "lucide-react";
import { F, GrnBatch, GrnLine, T } from "./theme";
import { IconButton, SearchInput } from "../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";
import { GrnBarcodeScannerModal } from "./GrnBarcodeScannerModal";

const MAT_COLOR: Record<GrnLine["materialType"], string> = {
  Warp: "#7A5010",
  Resham: "#7A5E1C",
  Jari: T.royalBurgundy,
};

function fmt(n: number): string {
  // Material quantities are fractional (kg, Reels) but usually whole — avoid
  // printing "100.000 kg" while still showing a real 2.5 Reels.
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

/** One material line inside an expanded receipt. Only lines matching the row's material type are selectable; the rest are shown for context, so staff can see the whole delivery. */
function LineRow({ line, selectable, selected, onSelect }: {
  line: GrnLine; selectable: boolean; selected: boolean; onSelect: () => void;
}) {
  const depleted = line.availableQty <= 0;
  const disabled = !selectable || depleted;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full text-left border-0 border-b transition-colors ${selected ? "bg-[#F8EFE0]" : "bg-white hover:bg-[#F9F0E1]/70"}`}
      style={{
        padding: "9px 14px 9px 30px",
        borderBottomColor: T.borderDef,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: selected ? "#2C0913" : T.royalBurgundy }}>{line.itemCode}</span>
        <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: depleted ? T.crimson : T.green, whiteSpace: "nowrap" }}>
          {depleted ? "none left" : `${fmt(line.availableQty)} ${line.unit} left`}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: MAT_COLOR[line.materialType] }}>{line.materialType}</span>
        <span style={{ fontFamily: F.ui, fontSize: 11.5, color: selected ? "#2C0913" : T.luxuryBrown }}>{line.name}</span>
        {line.description && <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>· {line.description}</span>}
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 2 }}>
        Received {fmt(line.receivedQty)} {line.unit} · issued {fmt(line.issuedQty)} {line.unit}
        {!selectable && <span style={{ color: T.antiqueGold }}> · switch this row to {line.materialType} to issue it</span>}
      </div>
    </button>
  );
}

// ── GRN selector: pick a receipt, then the exact material line within it ──────
export function GrnBatchSelector({ grnBatches, materialType, value, selectedLineId, onChange, pendingQty = 0 }: {
  grnBatches: GrnBatch[];
  materialType: "Warp" | "Resham" | "Jari";
  /** Selected receipt id. */
  value: string;
  /** Selected GrnItem id within that receipt. */
  selectedLineId: string;
  onChange: (grnBatchId: string, line: GrnLine | null) => void;
  /** Quantity currently entered on this row, in the same unit as the line — subtracted live from "remaining" so it reflects this issuance before it's confirmed. */
  pendingQty?: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Only receipts that still hold something of this material type are worth
  // offering — a receipt whose matching lines are all spent can't be issued from.
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return grnBatches.filter(g => {
      const hasIssuable = g.lines.some(l => l.materialType === materialType && l.availableQty > 0);
      if (!hasIssuable) return false;
      if (!query) return true;
      return (
        g.grnBatchId.toLowerCase().includes(query) ||
        g.vendor.toLowerCase().includes(query) ||
        (g.poNumber ?? "").toLowerCase().includes(query) ||
        g.lines.some(l => l.itemCode.toLowerCase().includes(query) || l.description.toLowerCase().includes(query))
      );
    });
  }, [grnBatches, materialType, q]);

  const selectedBatch = grnBatches.find(g => g.grnBatchId === value) ?? null;
  const selectedLine = selectedBatch?.lines.find(l => l.id === selectedLineId) ?? null;
  const siblings = selectedBatch ? selectedBatch.lines.filter(l => l.id !== selectedLineId) : [];

  const pick = useCallback((batch: GrnBatch, line: GrnLine) => {
    onChange(batch.grnBatchId, line);
    setOpen(false);
    setQ("");
    setExpanded(null);
  }, [onChange]);

  // A scan can name either a receipt or one exact line. A line code wins
  // (it's unambiguous); a receipt code selects its only issuable line, or
  // expands the receipt when there's more than one to choose from.
  const selectByCode = useCallback((raw: string): boolean => {
    const code = raw.trim().toLowerCase();
    if (!code) return false;

    for (const batch of grnBatches) {
      const line = batch.lines.find(l => l.itemCode.toLowerCase() === code);
      if (line) {
        if (line.materialType !== materialType) {
          toast.error(`${line.itemCode} is ${line.materialType}, not ${materialType}`);
          return false;
        }
        if (line.availableQty <= 0) {
          toast.error(`${line.itemCode} has no stock left`);
          return false;
        }
        pick(batch, line);
        return true;
      }
    }

    const batch = grnBatches.find(b => b.grnBatchId.toLowerCase() === code);
    if (!batch) return false;
    const issuable = batch.lines.filter(l => l.materialType === materialType && l.availableQty > 0);
    if (issuable.length === 0) {
      toast.error(`${batch.grnBatchId} has no ${materialType} left`);
      return false;
    }
    if (issuable.length === 1) {
      pick(batch, issuable[0]!);
      return true;
    }
    setExpanded(batch.grnBatchId);
    setOpen(true);
    return false;
  }, [grnBatches, materialType, pick]);

  const handleDetected = useCallback((text: string) => {
    setScanning(false);
    if (selectByCode(text)) {
      toast.success(`Selected ${text.trim()}`);
    } else if (!grnBatches.some(b => b.grnBatchId.toLowerCase() === text.trim().toLowerCase())) {
      toast.error(`No GRN found for code "${text}"`);
    }
  }, [selectByCode, grnBatches]);

  const remainingAfter = selectedLine ? selectedLine.availableQty - pendingQty : 0;
  const overIssuing = !!selectedLine && pendingQty > selectedLine.availableQty;

  return (
    <div style={{ position: "relative" as const }}>
      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>GRN Batch</span>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" as const }}>
          {/* Custom searchable listbox trigger — not a plain Select (needs inline
              search, a two-level receipt→line hierarchy, and a scan affordance
              in the popover), so it stays a raw button matched to local tokens. */}
          <button type="button" onClick={() => setOpen(o => !o)} style={{
            width: "100%", minHeight: 44, borderRadius: 10, border: `1.5px solid ${open ? T.royalBurgundy : T.borderDef}`,
            background: "#FFF", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: selectedLine ? T.royalBurgundy : T.taupe, textAlign: "left" as const,
          }}>
            {selectedLine ? (
              <span style={{ display: "flex", flexDirection: "column" as const, gap: 2, minWidth: 0 }}>
                <EntityCode type="goodsReceipt" value={selectedLine.itemCode} size="sm" />
                <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
                  {selectedLine.materialType} · {selectedLine.name}{selectedLine.description ? ` · ${selectedLine.description}` : ""}
                </span>
              </span>
            ) : "Select GRN batch…"}
            <ChevronDown size={14} color={T.taupe} style={{ flexShrink: 0 }} />
          </button>

          {open && (
            <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: "#FFF", border: "1px solid rgba(110,15,45,0.14)", borderRadius: 10, boxShadow: "0 10px 30px rgba(74,6,27,0.12)", overflow: "hidden" }}>
              <div style={{ padding: 8, borderBottom: `1px solid ${T.borderDef}` }}>
                <SearchInput
                  aria-label="Scan barcode, or search GRN, item code, or vendor"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- popover opens on user action; focusing the search box it contains is expected keyboard behavior, and a barcode scan types straight into it
                  autoFocus
                  value={q}
                  onChange={e => { setQ(e.target.value); selectByCode(e.target.value); }}
                  placeholder="Scan barcode, or search GRN / item code / vendor…"
                  size="sm"
                  className="w-full"
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" as const }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 14, textAlign: "center" as const, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    No GRN with {materialType} stock remaining
                  </div>
                ) : filtered.map(batch => {
                  const isExpanded = expanded === batch.grnBatchId;
                  const issuableCount = batch.lines.filter(l => l.materialType === materialType && l.availableQty > 0).length;
                  const isSelected = value === batch.grnBatchId;
                  return (
                    <div key={batch.grnBatchId}>
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : batch.grnBatchId)}
                        className={`w-full text-left cursor-pointer border-0 border-b transition-colors ${isSelected ? "bg-[#F8EFE0]" : "bg-white hover:bg-[#F9F0E1]/70"}`}
                        style={{ padding: "10px 14px", borderBottomColor: T.borderDef }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {isExpanded ? <ChevronDown size={13} color={T.royalBurgundy} /> : <ChevronRight size={13} color={T.taupe} />}
                          <EntityCode type="goodsReceipt" value={batch.grnBatchId} size="sm" />
                          <span style={{ marginLeft: "auto", fontFamily: F.ui, fontSize: 11.5, color: isSelected ? "#2C0913" : T.taupe, fontWeight: isSelected ? 600 : 400, whiteSpace: "nowrap" }}>
                            {batch.lines.length} item{batch.lines.length === 1 ? "" : "s"} · {issuableCount} {materialType}
                          </span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: isSelected ? "#3B2314" : T.taupe, marginTop: 3, paddingLeft: 20 }}>
                          {batch.vendor} · {batch.dateReceived}
                          {batch.poNumber && <> · PO {batch.poNumber}</>}
                        </div>
                      </button>
                      {isExpanded && batch.lines.map(line => (
                        <LineRow
                          key={line.id}
                          line={line}
                          selectable={line.materialType === materialType}
                          selected={line.id === selectedLineId}
                          onSelect={() => pick(batch, line)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <IconButton
          icon={QrCode}
          label="Scan GRN Batch Barcode"
          variant="secondary"
          onClick={() => setScanning(true)}
          className="h-11 w-11 shrink-0 border-[1.5px] border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#6E0F2D] hover:bg-[#F5E8D0]"
        />
      </div>

      {selectedLine && selectedBatch && (
        <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          <div>
            Available in <strong style={{ color: T.royalBurgundy }}>{selectedLine.itemCode}</strong>:{" "}
            <strong style={{ color: T.luxuryBrown }}>{fmt(selectedLine.availableQty)} {selectedLine.unit} remaining</strong>
            {pendingQty > 0 && (
              <>
                {" · after this issuance: "}
                <strong style={{ color: overIssuing ? T.crimson : T.green }}>
                  {fmt(Math.max(0, remainingAfter))} {selectedLine.unit}
                </strong>
              </>
            )}
          </div>
          <div style={{ marginTop: 2 }}>
            From <strong style={{ color: T.luxuryBrown }}>{selectedBatch.grnBatchId}</strong>
            {selectedBatch.poNumber && <> · Purchase Order <strong style={{ color: T.luxuryBrown }}>{selectedBatch.poNumber}</strong></>}
          </div>

          {siblings.length > 0 && (
            // The rest of the same delivery, with what each line still holds —
            // this is what makes a split, multi-material purchase traceable
            // from whichever line is being issued.
            <div style={{ marginTop: 8, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Also received on {selectedBatch.grnBatchId}:</div>
              {siblings.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "1px 0" }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums lining-nums" as const, fontSize: 11, color: T.royalBurgundy }}>{s.itemCode}</span>
                    {" · "}{s.materialType} — {s.name}{s.description ? ` (${s.description})` : ""}
                  </span>
                  <strong style={{ color: s.availableQty > 0 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" }}>
                    {fmt(s.availableQty)} / {fmt(s.receivedQty)} {s.unit} left
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <GrnBarcodeScannerModal open={scanning} onClose={() => setScanning(false)} onDetected={handleDetected} />
    </div>
  );
}
