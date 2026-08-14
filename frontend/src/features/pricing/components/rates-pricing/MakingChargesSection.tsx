import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Plus, Check, X, AlertTriangle, BarChart2, Eye, Tags } from "lucide-react";
import { T, F, cardStyle, labelStyle } from "./theme";
import { SectionCard, GoldLink, JariWeightField, SareeTypeCombobox } from "./sharedUI";
import { Button, IconButton, NumberInput, Input, Textarea } from "../../../../shared/ui/primitives";
import type { SareeTypeRecord } from "./sareeTypeData";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useDataAccess } from "@/shared/ui/domain";

export function MakingChargesSection({
  rates, setRates, onView, onPersistEdit, onPersistNew,
}: {
  rates: SareeTypeRecord[];
  setRates: React.Dispatch<React.SetStateAction<SareeTypeRecord[]>>;
  onView: (row: SareeTypeRecord) => void;
  onPersistEdit?: (code: string, updates: Partial<SareeTypeRecord>) => void;
  onPersistNew?: (entry: SareeTypeRecord) => void;
}) {
  const canSeeCost = useDataAccess("cost");
  const [editCode, setEditCode] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit form state
  const [editVals, setEditVals] = useState<Partial<SareeTypeRecord>>({});

  // New form state
  const [newVals, setNewVals] = useState<Partial<SareeTypeRecord>>({});

  function openEdit(row: SareeTypeRecord) {
    if (editCode === row.code) { setEditCode(null); return; }
    setEditCode(row.code);
    setEditVals({ ...row });
  }

  function saveEdit(row: SareeTypeRecord) {
    setRates(prev => prev.map(r => r.code === row.code ? { ...r, ...editVals, changed: "Just now" } as SareeTypeRecord : r));
    onPersistEdit?.(row.code, editVals);
    setEditCode(null);
  }

  function saveNew() {
    if (!newVals.type?.trim() || !newVals.code?.trim()) return;
    const entry: SareeTypeRecord = {
      code: newVals.code!.trim(),
      type: newVals.type!.trim(),
      description: newVals.description ?? "",
      charge: newVals.charge ?? "0",
      retail: newVals.retail ?? "0",
      wholesale: newVals.wholesale ?? "0",
      stdWeight: newVals.stdWeight ?? "0",
      warpWeight: newVals.warpWeight ?? "0",
      reshamWeight: newVals.reshamWeight ?? "0",
      jariWeight: newVals.jariWeight ?? "0",
      changed: "Just now",
    };
    setRates(prev => [entry, ...prev]);
    onPersistNew?.(entry);
    setNewVals({});
    setShowNewForm(false);
  }

  // All current type names for the combobox
  const typeNames = rates.map(r => r.type);

  const columns: ColumnDef<SareeTypeRecord>[] = [
    {
      id: "code", header: "Code", accessor: r => r.code,
      cell: v => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 600, background: "rgba(110,15,45,0.08)", padding: "3px 8px", borderRadius: 6 }}>{v as string}</span>
      ),
    },
    { id: "type", header: "Saree Type", accessor: r => r.type, cell: v => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    {
      id: "charge", header: "Making Charge", accessor: r => r.charge,
      cell: v => <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.antiqueGold }}>{canSeeCost ? formatMoney(rupees(parseInt(v as string))) : "••••"}</span>,
    },
    { id: "retail", header: "Retail", accessor: r => r.retail, cell: v => <>{formatMoney(rupees(parseInt(v as string)))}</> },
    { id: "wholesale", header: "Wholesale", accessor: r => r.wholesale, cell: v => <>{formatMoney(rupees(parseInt(v as string)))}</> },
    { id: "stdWeight", header: "Std Weight", accessor: r => r.stdWeight, cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{v as string}g</span> },
    { id: "changed", header: "Last Changed", accessor: r => r.changed, cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{v as string}</span> },
    {
      id: "actions", header: "Actions", accessor: () => null,
      cell: (_v, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <IconButton
            icon={Eye} label="View" variant="secondary" size="sm"
            className="rounded-[10px] text-[var(--text-tertiary)]"
            onClick={() => onView(row)}
          />
          <Button
            variant="secondary" size="sm" iconLeft={Edit2}
            className="rounded-[10px] border-[#6E0F2D] text-[#6E0F2D] h-auto py-[5px] px-3 text-[12px] font-medium"
            onClick={() => openEdit(row)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96 }}>
    <SectionCard
      icon={Tags}
      title="Making Charge Rates — Per Saree Type"
      subtitle="Applied to each saree during production billing. Making charge is the amount paid to the weaver per saree woven. All prices in Indian Rupees (INR)."
      actions={<GoldLink><BarChart2 size={13} /> View Rate Change History →</GoldLink>}
    >
      {/* Rates Table */}
      <div style={cardStyle}>
        <DataTable
          columns={columns}
          data={rates}
          getRowId={r => r.code}
          rowClassName={r => editCode === r.code ? "bg-[rgba(110,15,45,0.03)]" : undefined}
          expandedIds={editCode ? new Set([editCode]) : undefined}
          emptyTitle='No rates configured yet. Use "Add New Saree Type" below to create the first entry.'
          renderExpandedRow={row => (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                      Editing: {row.type} — <span style={{ fontFamily: "var(--font-mono)", color: T.royalBurgundy }}>{row.code}</span>
                    </span>
                    <IconButton
                      icon={X} label="Close" variant="ghost" size="sm"
                      className="text-[var(--text-tertiary)]"
                      onClick={() => setEditCode(null)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginBottom: 18 }}>
                    {/* Col 1 — Identity */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <span style={{ ...labelStyle, display: "block" }}>Saree Type Name *</span>
                        <SareeTypeCombobox
                          value={editVals.type ?? row.type}
                          onChange={v => setEditVals(p => ({ ...p, type: v }))}
                          options={typeNames.filter(n => n !== row.type)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="short-code">Short Code</label>
                        <Input id="short-code" value={row.code} readOnly className="bg-[#EDE5D8] text-[var(--text-tertiary)] cursor-not-allowed" />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4, display: "block" }}>Code cannot be changed</span>
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="description">Description</label>
                        <Textarea id="description" rows={2} value={editVals.description ?? row.description} onChange={e => setEditVals(p => ({ ...p, description: e.target.value }))} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="Short description…" />
                      </div>
                    </div>
                    {/* Col 2 — Pricing */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle} htmlFor="making-charge">Making Charge (INR) *</label>
                        <NumberInput id="making-charge" addonLeft="INR" value={Number(editVals.charge ?? row.charge)} onValueChange={v => setEditVals(p => ({ ...p, charge: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="retail-price">Retail Price (INR)</label>
                        <NumberInput id="retail-price" addonLeft="INR" value={Number(editVals.retail ?? row.retail)} onValueChange={v => setEditVals(p => ({ ...p, retail: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                      </div>
                      <div>
                        <label style={labelStyle} htmlFor="wholesale-price">Wholesale Price (INR)</label>
                        <NumberInput id="wholesale-price" addonLeft="INR" value={Number(editVals.wholesale ?? row.wholesale)} onValueChange={v => setEditVals(p => ({ ...p, wholesale: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                      </div>
                    </div>
                    {/* Col 3 — Weights */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle} htmlFor="standard-weight-g">Standard Weight (g) *</label>
                        <NumberInput id="standard-weight-g" value={Number(editVals.stdWeight ?? row.stdWeight)} onValueChange={v => setEditVals(p => ({ ...p, stdWeight: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="Enter manually" />
                      </div>
                      <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div>
                            <span style={{ ...labelStyle, marginBottom: 3, display: "block" }}>Warp Weight (g)</span>
                            <NumberInput value={Number(editVals.warpWeight ?? row.warpWeight)} onValueChange={v => setEditVals(p => ({ ...p, warpWeight: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                          </div>
                          <div>
                            <span style={{ ...labelStyle, marginBottom: 3, display: "block" }}>Resham Weight (g)</span>
                            <NumberInput value={Number(editVals.reshamWeight ?? row.reshamWeight)} onValueChange={v => setEditVals(p => ({ ...p, reshamWeight: String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                          </div>
                          <JariWeightField
                            reels={editVals.jariWeight ?? row.jariWeight}
                            onChange={v => setEditVals(p => ({ ...p, jariWeight: v }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: "rgba(196,146,58,0.10)", border: `1px solid rgba(200,155,71,0.35)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
                  }}>
                    <AlertTriangle size={15} color={T.antiqueGold} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "#7A5E1A" }}>
                      Changing making charges affects all future production bills for <strong>{row.type}</strong>. Changes are logged in rate history.
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="primary" iconLeft={Check} className="rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-[9px] px-[22px] text-[13px] font-semibold" onClick={() => saveEdit(row)}>
                      Save Changes
                    </Button>
                    <Button variant="secondary" iconLeft={X} className="rounded-full h-auto py-[9px] px-[18px] text-[13px]" onClick={() => setEditCode(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        />
      </div>

      {/* Add New Saree Type */}
      <Button
        variant="primary" iconLeft={Plus}
        className="mt-4 w-full rounded-full h-12 bg-[#6E0F2D] hover:bg-[#6E0F2D]/90 text-[14px] font-semibold"
        onClick={() => { setShowNewForm(!showNewForm); setNewVals({}); }}
      >
        Add New Saree Type
      </Button>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden", marginTop: 12 }}
          >
            <div style={{ ...cardStyle, padding: 24 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 18 }}>
                New Saree Type
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginBottom: 18 }}>
                {/* Col 1 — Identity */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <span style={{ ...labelStyle, display: "block" }}>Saree Type Name * <span style={{ color: T.antiqueGold, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select existing or type new)</span></span>
                    <SareeTypeCombobox
                      value={newVals.type ?? ""}
                      onChange={v => setNewVals(p => ({ ...p, type: v }))}
                      options={typeNames}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="short-code-2">Short Code *</label>
                    <Input id="short-code-2" value={newVals.code ?? ""} onChange={e => setNewVals(p => ({ ...p, code: e.target.value }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)] font-[var(--font-mono)]" placeholder="e.g. KS-006" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="description-2">Description</label>
                    <Textarea id="description-2" rows={2} value={newVals.description ?? ""} onChange={e => setNewVals(p => ({ ...p, description: e.target.value }))} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="Short description…" />
                  </div>
                </div>
                {/* Col 2 — Pricing */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle} htmlFor="making-charge-2">Making Charge (INR) *</label>
                    <NumberInput id="making-charge-2" addonLeft="INR" value={newVals.charge ? Number(newVals.charge) : ""} onValueChange={v => setNewVals(p => ({ ...p, charge: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="retail-price-2">Retail Price (INR)</label>
                    <NumberInput id="retail-price-2" addonLeft="INR" value={newVals.retail ? Number(newVals.retail) : ""} onValueChange={v => setNewVals(p => ({ ...p, retail: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="wholesale-price-2">Wholesale Price (INR)</label>
                    <NumberInput id="wholesale-price-2" addonLeft="INR" value={newVals.wholesale ? Number(newVals.wholesale) : ""} onValueChange={v => setNewVals(p => ({ ...p, wholesale: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="0" />
                  </div>
                </div>
                {/* Col 3 — Weights */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle} htmlFor="standard-weight-g-2">Standard Weight (g) *</label>
                    <NumberInput id="standard-weight-g-2" value={newVals.stdWeight ? Number(newVals.stdWeight) : ""} onValueChange={v => setNewVals(p => ({ ...p, stdWeight: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="Enter manually" />
                  </div>
                  <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <span style={{ ...labelStyle, marginBottom: 3, display: "block" }}>Warp Weight (g)</span>
                        <NumberInput value={newVals.warpWeight ? Number(newVals.warpWeight) : ""} onValueChange={v => setNewVals(p => ({ ...p, warpWeight: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="0" />
                      </div>
                      <div>
                        <span style={{ ...labelStyle, marginBottom: 3, display: "block" }}>Resham Weight (g)</span>
                        <NumberInput value={newVals.reshamWeight ? Number(newVals.reshamWeight) : ""} onValueChange={v => setNewVals(p => ({ ...p, reshamWeight: v === "" ? "" : String(v) }))} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="0" />
                      </div>
                      <JariWeightField
                        reels={newVals.jariWeight ?? ""}
                        onChange={v => setNewVals(p => ({ ...p, jariWeight: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="primary" iconLeft={Check}
                  className="rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-[9px] px-[22px] text-[13px] font-semibold"
                  onClick={saveNew}
                  disabled={!newVals.type?.trim() || !newVals.code?.trim()}
                >
                  Save New Type
                </Button>
                <Button
                  variant="secondary" iconLeft={X}
                  className="rounded-full h-auto py-[9px] px-[18px] text-[13px]"
                  onClick={() => { setShowNewForm(false); setNewVals({}); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
    </div>
  );
}
