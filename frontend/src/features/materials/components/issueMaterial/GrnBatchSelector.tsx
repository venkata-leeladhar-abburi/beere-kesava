import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, QrCode } from "lucide-react";
import { F, GrnBatch, T } from "./theme";
import { IconButton, SearchInput } from "../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";
import { GrnBarcodeScannerModal } from "./GrnBarcodeScannerModal";

// ── GRN batch selector (searchable + live camera scan) ─────────────────────────
export function GrnBatchSelector({ grnBatches, materialType, value, onChange, pendingQty = 0 }: {
  grnBatches: GrnBatch[]; materialType: "Warp" | "Resham" | "Jari"; value: string; onChange: (id: string) => void;
  /** Quantity currently entered on this row, in the same unit as the batch — subtracted live from "remaining" so it reflects this issuance before it's confirmed. */
  pendingQty?: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const filtered = grnBatches.filter(g => g.materialType === materialType && (q.length < 1 || g.grnBatchId.toLowerCase().includes(q.toLowerCase()) || g.vendor.toLowerCase().includes(q.toLowerCase())));
  const selected = grnBatches.find(g => g.grnBatchId === value);

  const handleDetected = useCallback((text: string) => {
    setScanning(false);
    const code = text.trim().toUpperCase();
    const match = grnBatches.find(g => g.grnBatchId.toUpperCase() === code);
    if (!match) {
      toast.error(`No GRN batch found for code "${text}"`);
      return;
    }
    if (match.materialType !== materialType) {
      toast.error(`${match.grnBatchId} is a ${match.materialType} batch, not ${materialType}`);
      return;
    }
    onChange(match.grnBatchId);
    toast.success(`Selected ${match.grnBatchId}`);
  }, [grnBatches, materialType, onChange]);

  // Opens the searchable list with the search box focused. A barcode scanner
  // acts as a keyboard, so scanning types the batch id straight into that box
  // and `selectOnExactMatch` below picks the batch it actually matches.
  const selectOnExactMatch = (typed: string) => {
    const hit = grnBatches.find(
      g => g.materialType === materialType && g.grnBatchId.toLowerCase() === typed.trim().toLowerCase(),
    );
    if (!hit) return;
    onChange(hit.grnBatchId);
    setOpen(false);
    setQ("");
  };

  return (
    <div style={{ position: "relative" as const }}>
      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>GRN Batch</span>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" as const }}>
          {/* Custom searchable listbox trigger — not a plain Select (needs inline search + scan
              affordance in the popover), so it stays a raw button matched to local tokens. */}
          <button type="button" onClick={() => setOpen(o => !o)} style={{
            width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${open ? T.royalBurgundy : T.borderDef}`,
            background: "#FFF", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: selected ? T.royalBurgundy : T.taupe,
          }}>
            {selected ? <EntityCode type="goodsReceipt" value={selected.grnBatchId} size="sm" /> : "Select GRN batch…"}
            <ChevronDown size={14} color={T.taupe} />
          </button>
          {open && (
            <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "#FFF", border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, boxShadow: "0 8px 28px rgba(74,6,27,0.16)", overflow: "hidden" }}>
              <div style={{ padding: 8, borderBottom: `1px solid ${T.borderDef}` }}>
                <SearchInput
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- popover opens on user action; focusing the search box it contains is expected keyboard behavior, and a barcode scan types straight into it
                  autoFocus
                  value={q}
                  onChange={e => { setQ(e.target.value); selectOnExactMatch(e.target.value); }}
                  placeholder="Scan barcode, or search batch ID / vendor…"
                  size="sm"
                  className="w-full"
                />
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" as const }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 14, textAlign: "center" as const, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>No {materialType} batches found</div>
                ) : filtered.map(g => (
                  <button
                    key={g.grnBatchId}
                    type="button"
                    onClick={() => { onChange(g.grnBatchId); setOpen(false); setQ(""); }}
                    className="w-full text-left cursor-pointer border-0 border-b"
                    style={{
                      padding: "10px 14px", borderBottomColor: T.borderDef,
                      background: value === g.grnBatchId ? "rgba(110,15,45,0.05)" : "#FFF",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <EntityCode type="goodsReceipt" value={g.grnBatchId} size="sm" />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green }}>{g.availableQty} {g.unit} left</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      {g.vendor} · {g.dateReceived}
                      {g.poNumber && <> · PO {g.poNumber}</>}
                    </div>
                    {g.siblingItems.length > 0 && (
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold, marginTop: 2 }}>
                        Also on this receipt: {g.siblingItems.map(s => `${s.materialType} (${s.quantity} ${s.unit})`).join(", ")}
                      </div>
                    )}
                  </button>
                ))}
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
      {selected && (
        <div style={{ marginTop: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          <div>
            Available in {selected.grnBatchId}: <strong style={{ color: T.luxuryBrown }}>{selected.availableQty} {selected.unit} remaining</strong>
            {pendingQty > 0 && (
              <>
                {" · after this issuance: "}
                <strong style={{ color: pendingQty > selected.availableQty ? T.crimson : T.green }}>
                  {Math.max(0, selected.availableQty - pendingQty)} {selected.unit}
                </strong>
              </>
            )}
          </div>
          {selected.poNumber && <div style={{ marginTop: 2 }}>Received against Purchase Order <strong style={{ color: T.luxuryBrown }}>{selected.poNumber}</strong></div>}
          {selected.siblingItems.length > 0 && (
            // Same delivery brought in other materials too — surfacing them
            // here is what makes a split, multi-material purchase
            // traceable from a single GRN batch, instead of only showing
            // the one line item that matches the row's material type.
            <div style={{ marginTop: 6, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Also received on this GRN:</div>
              {selected.siblingItems.map((s, i) => (
                // eslint-disable-next-line react/no-array-index-key -- sibling lines have no stable id in this shape; order is fixed per batch, so index is safe
                <div key={i}>{s.materialType} — {s.name}: <strong style={{ color: T.luxuryBrown }}>{s.quantity} {s.unit}</strong></div>
              ))}
            </div>
          )}
        </div>
      )}
      <GrnBarcodeScannerModal open={scanning} onClose={() => setScanning(false)} onDetected={handleDetected} />
    </div>
  );
}
