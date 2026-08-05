import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, CheckCircle2, AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { C, F, btnPrimary, inputStyle } from "../tokens";
import { FinishingAssignment } from "../../../../finishing/contexts/FinishingContext";
import { EASE } from "./shared";
import { Button, IconButton, Input, Textarea, Select, SelectItem } from "../../../../../shared/ui/primitives";

export interface VerifData {
  condition: "perfect" | "damaged" | null;
  damageType: string;
  damageSeverity: "Minor" | "Moderate" | "Severe" | "";
  damageNotes: string;
  damagePhotoUrl?: string;
}

function DamagePhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(27,12,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, padding: 20, width: "min(92vw, 340px)", boxShadow: "0 24px 60px rgba(27,12,8,0.30)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={18} color={C.crim} />
          <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text }}>Photo Required</span>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Take a photo of the defect as proof. This is required to complete the rejection.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Button variant="primary" fullWidth size="sm" iconLeft={Camera} onClick={onCapture} className="h-11 rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A]">
            Take Photo
          </Button>
          <Button variant="secondary" fullWidth size="sm" iconLeft={UploadCloud} onClick={onCapture} className="h-11 rounded-full border-[#6B1A2A] text-[#6B1A2A]">
            Upload from Gallery
          </Button>
        </div>
        <Button variant="link" fullWidth onClick={onCancel} className="text-xs text-[#69635E] p-2">Cancel</Button>
      </div>
    </div>
  );
}

export function VerificationModal({ assignments, onSave, onClose, isMobile }: {
  assignments: FinishingAssignment[];
  onSave: (data: Record<string, VerifData>) => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // Bulk mode: one form for all if same condition, else per-saree
  const [bulkCondition, setBulkCondition] = useState<"perfect" | "damaged" | null>(null);
  const [perSaree, setPerSaree] = useState<Record<string, VerifData>>(() =>
    Object.fromEntries(assignments.map(a => [a.id, { condition: null, damageType: "", damageSeverity: "", damageNotes: "" }]))
  );
  const [useBulk, setUseBulk] = useState(true);
  const [bulkDamageType, setBulkDamageType] = useState("");
  const [bulkDamageSev, setBulkDamageSev] = useState<"Minor" | "Moderate" | "Severe" | "">("");
  const [bulkDamageNotes, setBulkDamageNotes] = useState("");
  const [bulkDamagePhotoUrl, setBulkDamagePhotoUrl] = useState<string | undefined>(undefined);
  const [photoPromptFor, setPhotoPromptFor] = useState<"bulk" | string | null>(null);

  const isBulkReady = bulkCondition === "perfect" || (bulkCondition === "damaged" && bulkDamageType.trim() && !!bulkDamagePhotoUrl);

  function handleSave() {
    if (useBulk && bulkCondition) {
      const result: Record<string, VerifData> = {};
      assignments.forEach(a => {
        result[a.id] = {
          condition: bulkCondition,
          damageType: bulkDamageType,
          damageSeverity: bulkDamageSev as VerifData["damageSeverity"],
          damageNotes: bulkDamageNotes,
          damagePhotoUrl: bulkDamagePhotoUrl,
        };
      });
      onSave(result);
    } else {
      onSave(perSaree);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ position: "relative", width: "100%", maxWidth: isMobile ? 420 : "min(600px, 100vw)", margin: "0 auto", background: "#FFF", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text }}>Verify Condition</span>
          <IconButton icon={X} label="Close" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 14 }}>
          {assignments.length} saree{assignments.length > 1 ? "s" : ""} · Received by <strong style={{ color: C.text }}>Ravi Kumar</strong> · {today}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Bulk toggle */}
          {assignments.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ v: true, l: "Same condition for all" }, { v: false, l: "Per saree" }].map(opt => (
                <Button key={String(opt.v)} variant="tertiary" fullWidth size="sm" onClick={() => setUseBulk(opt.v)}
                  className={useBulk === opt.v ? "h-9 rounded-lg border-[1.5px] border-[#6B1A2A] bg-[rgba(107,26,42,0.05)] text-[#6B1A2A]" : "h-9 rounded-lg border-[1.5px] border-[rgba(107,26,42,0.15)] bg-transparent"}>
                  {opt.l}
                </Button>
              ))}
            </div>
          )}

          {useBulk ? (
            <div>
              {/* Saree list */}
              <div style={{ background: "rgba(107,26,42,0.03)", border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
                {assignments.map((a, i) => (
                  <div key={a.id} style={{ padding: "9px 12px", borderBottom: i < assignments.length - 1 ? `1px solid rgba(107,26,42,0.07)` : "none", fontFamily: F.m, fontSize: 12, color: C.text }}>
                    {a.sareeId} <span style={{ color: C.muted, fontFamily: F.u }}>· {a.designCode} · {a.sareeType}</span>
                  </div>
                ))}
              </div>

              {/* Condition radio */}
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Condition</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {([["perfect", "Perfect ✓", C.green, "rgba(30,102,64,0.09)"], ["damaged", "Damaged ⚠", C.crim, "rgba(192,57,43,0.08)"]] as const).map(([val, lbl, col, bg]) => (
                  <div key={val} style={{ flex: 1, ["--cond-col" as string]: col, ["--cond-bg" as string]: bg } as React.CSSProperties}>
                    <Button variant="tertiary" fullWidth
                      onClick={() => { setBulkCondition(val); if (val === "damaged" && !bulkDamagePhotoUrl) setPhotoPromptFor("bulk"); }}
                      className={bulkCondition === val
                        ? "h-12 w-full rounded-xl border-2 font-bold text-sm transition-all border-[var(--cond-col)] bg-[var(--cond-bg)] text-[var(--cond-col)]"
                        : "h-12 w-full rounded-xl border-2 border-[rgba(107,26,42,0.12)] bg-transparent font-bold text-sm text-[#69635E] transition-all"}>
                      {lbl}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Damage fields */}
              <AnimatePresence>
                {bulkCondition === "damaged" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 4 }}>
                      <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Damage Type <span style={{ color: C.crim }}>*</span></div>
                          <Input value={bulkDamageType} onChange={e => setBulkDamageType(e.target.value)} placeholder="e.g. Stain, Thread break" size="lg" className="text-[13px]" />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Severity</div>
                          <Select value={bulkDamageSev} onValueChange={v => setBulkDamageSev(v as VerifData["damageSeverity"])} size="lg" placeholder="Select severity…">
                            {["Minor", "Moderate", "Severe"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </Select>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Notes</div>
                        <Textarea value={bulkDamageNotes} onChange={e => setBulkDamageNotes(e.target.value)} placeholder="Additional details…" rows={2} className="resize-none text-[13px] leading-relaxed" />
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Photo <span style={{ color: C.crim, fontWeight: 400 }}>— Required</span></div>
                        {bulkDamagePhotoUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, background: "rgba(30,102,64,0.05)" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Camera size={14} color="rgba(255,255,255,0.85)" />
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flex: 1 }}>Photo attached</span>
                            <Button variant="link" onClick={() => setPhotoPromptFor("bulk")} className="p-0 text-xs text-[#6B1A2A] underline">Retake</Button>
                          </div>
                        ) : (
                          <Button variant="secondary" iconLeft={Camera} onClick={() => setPhotoPromptFor("bulk")}
                            className="h-10 rounded-[10px] border-[1.5px] border-dashed border-[#C0392B] bg-[rgba(192,57,43,0.04)] text-[13px] text-[#C0392B] hover:bg-[rgba(192,57,43,0.04)]">
                            Take Photo of Defect
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Per-saree mode */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {assignments.map(a => {
                const d = perSaree[a.id];
                const update = (patch: Partial<VerifData>) => setPerSaree(prev => ({ ...prev, [a.id]: { ...prev[a.id], ...patch } }));
                return (
                  <div key={a.id} style={{ border: `1px solid rgba(107,26,42,0.12)`, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 4 }}>{a.sareeId}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>{a.designCode} · {a.sareeType}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: d.condition === "damaged" ? 10 : 0 }}>
                      {([["perfect", "Perfect ✓", C.green, "rgba(30,102,64,0.09)"], ["damaged", "Damaged ⚠", C.crim, "rgba(192,57,43,0.08)"]] as const).map(([val, lbl, col, bg]) => (
                        <div key={val} style={{ flex: 1, ["--cond-col" as string]: col, ["--cond-bg" as string]: bg } as React.CSSProperties}>
                          <Button variant="tertiary" fullWidth
                            onClick={() => { update({ condition: val }); if (val === "damaged" && !d.damagePhotoUrl) setPhotoPromptFor(a.id); }}
                            className={d.condition === val
                              ? "h-[38px] w-full rounded-[9px] border-[1.5px] font-semibold text-xs transition-all border-[var(--cond-col)] bg-[var(--cond-bg)] text-[var(--cond-col)]"
                              : "h-[38px] w-full rounded-[9px] border-[1.5px] border-[rgba(107,26,42,0.12)] bg-transparent font-semibold text-xs text-[#69635E] transition-all"}>
                            {lbl}
                          </Button>
                        </div>
                      ))}
                    </div>
                    {d.condition === "damaged" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        <input value={d.damageType} onChange={e => update({ damageType: e.target.value })} placeholder="Damage type *" style={{ ...inputStyle, height: 40, fontSize: 13 }} />
                        <div style={{ position: "relative" }}>
                          <select value={d.damageSeverity} onChange={e => update({ damageSeverity: e.target.value as VerifData["damageSeverity"] })} style={{ ...inputStyle, height: 40, fontSize: 13, appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                            <option value="">Severity…</option>
                            {["Minor", "Moderate", "Severe"].map(s => <option key={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={13} color={C.muted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        </div>
                        <textarea value={d.damageNotes} onChange={e => update({ damageNotes: e.target.value })} placeholder="Notes…" rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 14px", resize: "none", fontSize: 13, lineHeight: 1.5 }} />
                        {d.damagePhotoUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, background: "rgba(30,102,64,0.05)" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Camera size={12} color="rgba(255,255,255,0.85)" />
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flex: 1 }}>Photo attached</span>
                            <button onClick={() => setPhotoPromptFor(a.id)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.burg, cursor: "pointer", textDecoration: "underline" }}>Retake</button>
                          </div>
                        ) : (
                          <button onClick={() => setPhotoPromptFor(a.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 38, border: `1.5px dashed ${C.crim}`, borderRadius: 9, background: "rgba(192,57,43,0.04)", fontFamily: F.u, fontSize: 12, color: C.crim, cursor: "pointer" }}>
                            <Camera size={14} color={C.crim} /> Take Photo of Defect <span style={{ color: C.crim }}>*</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            disabled={useBulk ? !isBulkReady : Object.values(perSaree).some(d => !d.condition || (d.condition === "damaged" && (!d.damageType.trim() || !d.damagePhotoUrl)))}
            onClick={handleSave}
            style={{ ...btnPrimary, opacity: (useBulk ? isBulkReady : Object.values(perSaree).every(d => d.condition && (d.condition !== "damaged" || (d.damageType.trim() && d.damagePhotoUrl)))) ? 1 : 0.45, cursor: "pointer" }}
          >
            <CheckCircle2 size={16} /> Save &amp; Mark Received
          </button>
        </div>
      </motion.div>

      {photoPromptFor && (
        <DamagePhotoPrompt
          onCancel={() => {
            if (photoPromptFor === "bulk") setBulkCondition(null);
            else setPerSaree(prev => ({ ...prev, [photoPromptFor]: { ...prev[photoPromptFor], condition: null } }));
            setPhotoPromptFor(null);
          }}
          onCapture={() => {
            if (photoPromptFor === "bulk") setBulkDamagePhotoUrl("captured-defect-photo");
            else setPerSaree(prev => ({ ...prev, [photoPromptFor]: { ...prev[photoPromptFor], damagePhotoUrl: "captured-defect-photo" } }));
            setPhotoPromptFor(null);
          }}
        />
      )}
    </div>
  );
}
