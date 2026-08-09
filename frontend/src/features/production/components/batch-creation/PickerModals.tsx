import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Factory, ShoppingBag, AlertCircle as WarningCircle, Package, X,
} from "lucide-react";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { T, F, fld, lbl } from "./constants";
import { Pip } from "./constants";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { Button, IconButton, Input, SearchInput, Textarea } from "../../../../shared/ui/primitives";
import { Modal, type ModalSize } from "../../../../shared/ui/overlay";

// Deterministic pip colour from a stable palette, keyed by id, so real
// weavers (fetched from the backend) still get a consistent avatar colour
// without needing a "bg" field the backend doesn't have.
const PIP_PALETTE = ["#6E0F2D", "#C4923A", "#69635E", "#4A061B", "#A05080", "#1E6640", "#3D0E1A", "#2C4A8B"];
export function pipColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PIP_PALETTE[hash % PIP_PALETTE.length];
}

// ─── Generic picker shell ──────────────────────────────────────────────────────
// Widths varied per consumer under the old hand-rolled overlay (400-540px);
// Modal's size enum is fixed, so each width buckets to its nearest step.
function sizeForWidth(width: number): ModalSize {
  if (width <= 420) return "xs";
  if (width <= 560) return "sm";
  if (width <= 720) return "md";
  return "lg";
}

export function PickerShell({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <Modal open onOpenChange={o => !o && onClose()} size={sizeForWidth(width)}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
        </Dialog.Title>
        <Dialog.Close asChild>
          <IconButton icon={X} label="Close" variant="ghost" size="sm" />
        </Dialog.Close>
      </div>
      <div style={{ paddingTop: 16, overflowY: "auto" }}>{children}</div>
    </Modal>
  );
}

// ── Weaver Picker ─────────────────────────────────────────────────────────────
export function WeaverPickerModal({ weavers, onClose, onSelect }: { weavers: WeaverOption[]; onClose: () => void; onSelect: (w: WeaverOption) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <PickerShell title="Assign Weaver" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px" }}>
        {weavers.map(w => (
          <Button key={w.id} onClick={() => setSel(w.id)} variant="ghost" fullWidth
            className={`h-auto justify-start gap-2.5 p-[12px_14px] rounded-xl border-2 ${sel === w.id ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
            <Pip initials={w.initials} bg={pipColor(w.id)} size={34} />
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{w.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{w.looms} loom{w.looms !== 1 ? "s" : ""}</div>
            </div>
          </Button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <Button onClick={() => { const w = weavers.find(x => x.id === sel); if (w) onSelect(w); }} disabled={!sel}
          variant="primary" size="lg" className="flex-[2] h-[46px]">
          Assign Weaver
        </Button>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
      </div>
    </PickerShell>
  );
}

// ── Bulk Order Picker ─────────────────────────────────────────────────────────
export function BulkOrderPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (ref: string | null, label: string) => void }) {
  const { bulkOrders } = useBulkOrders();
  const [sel, setSel] = useState<string | "general" | null>(null);
  return (
    <PickerShell title="Assign Bulk Order" onClose={onClose}>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {/* General Stock */}
        <Button onClick={() => setSel("general")} variant="ghost" fullWidth
          className={`h-auto justify-start gap-3 p-[13px_16px] rounded-xl border-2 ${sel === "general" ? "border-[#1E6640] bg-[rgba(30,102,64,0.06)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(30,102,64,0.06)]`}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green }}>General Stock</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Not linked to any bulk order</div>
          </div>
        </Button>
        <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", margin: "4px 0 2px" }}>Active Bulk Orders</div>
        {bulkOrders.map(o => (
          <Button key={o.ref} onClick={() => setSel(o.ref)} variant="ghost" fullWidth
            className={`h-auto justify-start gap-3 p-[12px_16px] rounded-xl border-2 ${sel === o.ref ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShoppingBag size={16} color={T.royalBurgundy} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{o.ref}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.customer} · {o.sareeType}</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, flexShrink: 0 }}>{o.done}/{o.total}</div>
          </Button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <Button onClick={() => {
          if (sel === "general") { onSelect(null, "General Stock"); }
          else if (sel) { const o = bulkOrders.find(x => x.ref === sel); if (o) onSelect(o.ref, `${o.ref} · ${o.customer}`); }
        }} disabled={!sel} variant="primary" size="lg" className="flex-[2] h-[46px]">
          Assign
        </Button>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
      </div>
    </PickerShell>
  );
}

// ── Design Code Picker ────────────────────────────────────────────────────────
export function DesignCodePickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (code: string) => void }) {
  const { designs, addDesign } = useDesignLibrary();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "new">("search");
  const [newCode, setNewCode] = useState("");
  const [newWeaver, setNewWeaver] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = designs.filter(d =>
    d.code.toLowerCase().includes(q.toLowerCase()) ||
    (d.name && d.name.toLowerCase().includes(q.toLowerCase()))
  );

  function handleSaveNew() {
    if (!newCode.trim()) return;
    const entry: DesignEntry = {
      code: newCode.trim(), name: "", typeCode: "", typeName: "",
      desc: "", color: "", weaverName: newWeaver.trim(), notesForWeaver: newNotes.trim(),
      colorSlipPhoto: null, designGraph: null,
      batches: 0, total: 0, hasColorSlip: false, hasGraph: false,
    };
    addDesign(entry);
    onSelect(newCode.trim());
  }

  return (
    <PickerShell title="Assign Design Code" onClose={onClose} width={540}>
      {/* Mode toggle */}
      <div style={{ padding: "0 24px 16px", display: "flex", gap: 8 }}>
        {(["search", "new"] as const).map(m => (
          <Button key={m} onClick={() => setMode(m)} variant={mode === m ? "primary" : "secondary"} size="md" className="flex-1 h-[38px]">
            {m === "search" ? "Select Existing" : "+ Create New"}
          </Button>
        ))}
      </div>

      {mode === "search" ? (
        <>
          <div style={{ padding: "0 24px 12px" }}>
            <SearchInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search design code or name…" autoFocus />
          </div>
          <div style={{ padding: "0 24px", maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(d => (
              <Button key={d.code} onClick={() => setSel(d.code)} variant="ghost" fullWidth
                className={`h-auto justify-start gap-3 p-[11px_14px] rounded-[11px] border-2 ${sel === d.code ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>{d.code}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {d.name && <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>}
                  {d.weaverName && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Weaver: {d.weaverName}</div>}
                </div>
                {(d.hasGraph || d.hasColorSlip) && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {d.hasColorSlip && <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(30,102,64,0.10)", color: T.green, borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>Slip</span>}
                    {d.hasGraph && <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(30,102,64,0.10)", color: T.green, borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>Graph</span>}
                  </div>
                )}
              </Button>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                No designs match "{q}".<br />
                <Button onClick={() => { setMode("new"); setNewCode(q); }} variant="link" className="mt-2.5 text-[13px] font-bold text-[#6E0F2D]">
                  Create "{q}" as new design code →
                </Button>
              </div>
            )}
          </div>
          <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
            <Button onClick={() => { if (sel) onSelect(sel); }} disabled={!sel} variant="primary" size="lg" className="flex-[2] h-[46px]">
              Assign Design Code
            </Button>
            <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
          </div>
        </>
      ) : (
        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. BKB-099" autoFocus />
          </div>
          <div>
            <label style={lbl}>Weaver Name <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <Input value={newWeaver} onChange={e => setNewWeaver(e.target.value)} placeholder="Assign a weaver later if needed" />
          </div>
          <div>
            <label style={lbl}>Notes for Weaver <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} placeholder="Instructions to appear in the Design Library…" />
          </div>
          <div style={{ background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <WarningCircle size={15} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", lineHeight: 1.5 }}>
              This design code will be saved to the master Design Library immediately and will appear there with full detail.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={handleSaveNew} disabled={!newCode.trim()} variant="primary" size="lg" className="flex-[2] h-[46px] bg-[#1E6640] hover:bg-[#1E6640]/90">
              Save to Library & Assign
            </Button>
            <Button onClick={() => setMode("search")} variant="secondary" size="lg" className="flex-1 h-[46px]">Back</Button>
          </div>
        </div>
      )}
    </PickerShell>
  );
}

// ── Saree Type Picker ─────────────────────────────────────────────────────────
// `sareeTypes` comes from the real backend rate catalog (ratesApi) — never a
// hardcoded list, so the making charge shown here always matches Rates & Pricing.
export interface SareeTypeBrief { code: string; name: string; charge: number }

export function SareeTypePickerModal({ sareeTypes, onClose, onSelect }: {
  sareeTypes: SareeTypeBrief[]; onClose: () => void; onSelect: (code: string, name: string) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <PickerShell title="Assign Saree Type" onClose={onClose}>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {sareeTypes.length === 0 && (
          <div style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No saree types configured yet — add one in Rates &amp; Pricing first.
          </div>
        )}
        {sareeTypes.map(t => (
          <Button key={t.code} onClick={() => setSel(t.code)} variant="ghost" fullWidth
            className={`h-auto justify-start gap-3.5 p-[13px_16px] rounded-xl border-2 ${sel === t.code ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{t.code}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{t.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{t.code}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.green }}>₹{t.charge.toLocaleString("en-IN")}</div>
          </Button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <Button onClick={() => { const t = sareeTypes.find(x => x.code === sel); if (t) onSelect(t.code, t.name); }} disabled={!sel} variant="primary" size="lg" className="flex-[2] h-[46px]">
          Assign Saree Type
        </Button>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
      </div>
    </PickerShell>
  );
}

// ── Per-weaver Loom Picker (capped to that weaver's own loom count) ──────────
export function WeaverLoomPickerModal({ weaver, current, onClose, onSelect }: {
  weaver: WeaverOption; current: number | null; onClose: () => void; onSelect: (loomNum: number) => void;
}) {
  const [sel, setSel] = useState<number | null>(current);
  const LOOMS = Array.from({ length: weaver.looms }, (_, i) => i + 1);
  return (
    <PickerShell title={`Select Loom for ${weaver.name}`} onClose={onClose} width={400}>
      <div style={{ padding: "0 24px 8px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        {weaver.name} operates {weaver.looms} loom{weaver.looms !== 1 ? "s" : ""}.
      </div>
      <div style={{ padding: "8px 24px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {LOOMS.map(loom => (
          <Button key={loom} onClick={() => setSel(loom)} variant="ghost"
            className={`h-auto flex-col gap-1.5 p-[16px_12px] rounded-xl border-2 ${sel === loom ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
            <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 800, color: sel === loom ? T.royalBurgundy : T.luxuryBrown }}>
              L{loom}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>
              Loom {loom}
            </div>
          </Button>
        ))}
      </div>
      <div style={{ padding: "20px 24px 24px", display: "flex", gap: 10 }}>
        <Button onClick={() => { if (sel !== null) onSelect(sel); }} disabled={sel === null} variant="primary" size="lg" className="flex-[2] h-[46px]">
          Assign Loom
        </Button>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
      </div>
    </PickerShell>
  );
}

// ── Factory Loom Picker (assigns a factory loom instead of a weaver) ─────────
export function FactoryLoomPickerModal({ looms, onClose, onSelect }: { looms: LoomOption[]; onClose: () => void; onSelect: (loom: LoomOption) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const statusColor = (s: string) => s.toLowerCase() === "active" ? T.green : s.toLowerCase() === "maintenance" ? T.red : T.taupe;
  return (
    <PickerShell title="Assign Factory Loom" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 24px" }}>
        {looms.map(l => (
          <Button key={l.id} onClick={() => setSel(l.id)} variant="ghost" fullWidth
            className={`h-auto justify-start gap-3 p-[12px_14px] rounded-xl border-2 ${sel === l.id ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[rgba(110,15,45,0.10)] bg-[#FFFDF9]"} hover:bg-[rgba(110,15,45,0.05)]`}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={17} color={T.royalBurgundy} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{l.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{l.location}</div>
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: statusColor(l.status), textTransform: "capitalize" }}>{l.status.toLowerCase()}</span>
          </Button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <Button onClick={() => { const l = looms.find(x => x.id === sel); if (l) onSelect(l); }} disabled={!sel}
          variant="primary" size="lg" className="flex-[2] h-[46px]">
          Assign Factory Loom
        </Button>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
      </div>
    </PickerShell>
  );
}
