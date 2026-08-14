import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { C, F } from "../tokens";
import { FinishingAssignment } from "@/features/finishing";
import { EASE } from "./shared";
import { Button, Input, Textarea, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";

export interface VerifData {
  condition: "perfect" | "damaged" | null;
  damageType: string;
  damageSeverity: "Minor" | "Moderate" | "Severe" | "";
  damageNotes: string;
  damagePhotoUrl?: string;
}

function DamagePhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <div
      role="button"
      aria-label="Close photo prompt"
      tabIndex={0}
      style={{ position: "fixed", inset: 0, zIndex: "var(--z-popover)", background: "var(--surface-scrim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onCancel}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { onCancel(); } }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Photo Required"
        style={{ background: "#FFF", borderRadius: 16, padding: 20, width: "min(92vw, 340px)", boxShadow: "0 24px 60px rgba(27,12,8,0.30)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={18} color={C.crim} />
          <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text }}>Photo Required</span>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Take a photo of the defect as proof. This is required to complete the rejection.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Button variant="primary" fullWidth size="sm" iconLeft={Camera} onClick={onCapture} className="h-11 rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]">
            Take Photo
          </Button>
          <Button variant="secondary" fullWidth size="sm" iconLeft={UploadCloud} onClick={onCapture} className="h-11 rounded-full border-[#6E0F2D] text-[#6E0F2D]">
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
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size={isMobile ? "xs" : "md"}>
      <Modal.Header
        title="Verify Condition"
        subtitle={`${assignments.length} saree${assignments.length > 1 ? "s" : ""} · Received by Ravi Kumar · ${today}`}
      />
      <Modal.Body>
        <div style={{ paddingTop: 10 }}>
          {/* Bulk toggle */}
          {assignments.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ v: true, l: "Same condition for all" }, { v: false, l: "Per saree" }].map(opt => (
                <Button key={String(opt.v)} variant="tertiary" fullWidth size="sm" onClick={() => setUseBulk(opt.v)}
                  className={useBulk === opt.v ? "h-9 rounded-lg border-[1.5px] border-[#6E0F2D] bg-[rgba(110,15,45,0.05)] text-[#6E0F2D]" : "h-9 rounded-lg border-[1.5px] border-[rgba(110,15,45,0.15)] bg-transparent"}>
                  {opt.l}
                </Button>
              ))}
            </div>
          )}

          {useBulk ? (
            <div>
              {/* Saree list */}
              <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
                {assignments.map((a, i) => (
                  <div key={a.id} style={{ padding: "9px 12px", borderBottom: i < assignments.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none", fontFamily: F.m, fontSize: 12, color: C.text }}>
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
                        : "h-12 w-full rounded-xl border-2 border-[rgba(110,15,45,0.12)] bg-transparent font-bold text-sm text-[#69635E] transition-all"}>
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
                            <Button variant="link" onClick={() => setPhotoPromptFor("bulk")} className="p-0 text-xs text-[#6E0F2D] underline">Retake</Button>
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
                  <div key={a.id} style={{ border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 4 }}>{a.sareeId}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>{a.designCode} · {a.sareeType}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: d.condition === "damaged" ? 10 : 0 }}>
                      {([["perfect", "Perfect ✓", C.green, "rgba(30,102,64,0.09)"], ["damaged", "Damaged ⚠", C.crim, "rgba(192,57,43,0.08)"]] as const).map(([val, lbl, col, bg]) => (
                        <div key={val} style={{ flex: 1, ["--cond-col" as string]: col, ["--cond-bg" as string]: bg } as React.CSSProperties}>
                          <Button variant="tertiary" fullWidth
                            onClick={() => { update({ condition: val }); if (val === "damaged" && !d.damagePhotoUrl) setPhotoPromptFor(a.id); }}
                            className={d.condition === val
                              ? "h-[38px] w-full rounded-[9px] border-[1.5px] font-semibold text-xs transition-all border-[var(--cond-col)] bg-[var(--cond-bg)] text-[var(--cond-col)]"
                              : "h-[38px] w-full rounded-[9px] border-[1.5px] border-[rgba(110,15,45,0.12)] bg-transparent font-semibold text-xs text-[#69635E] transition-all"}>
                            {lbl}
                          </Button>
                        </div>
                      ))}
                    </div>
                    {d.condition === "damaged" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        <Input value={d.damageType} onChange={e => update({ damageType: e.target.value })} placeholder="Damage type *" className="h-10 text-[13px]" />
                        <Select value={d.damageSeverity} onValueChange={v => update({ damageSeverity: v as VerifData["damageSeverity"] })} placeholder="Severity…">
                          {["Minor", "Moderate", "Severe"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </Select>
                        <Textarea value={d.damageNotes} onChange={e => update({ damageNotes: e.target.value })} placeholder="Notes…" rows={2} className="resize-none text-[13px] leading-relaxed" />
                        {d.damagePhotoUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, background: "rgba(30,102,64,0.05)" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Camera size={12} color="rgba(255,255,255,0.85)" />
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flex: 1 }}>Photo attached</span>
                            <Button variant="link" onClick={() => setPhotoPromptFor(a.id)} className="p-0 text-xs text-[#6E0F2D] underline">Retake</Button>
                          </div>
                        ) : (
                          <Button variant="secondary" size="sm" iconLeft={Camera} onClick={() => setPhotoPromptFor(a.id)}
                            className="h-[38px] justify-start rounded-[9px] border-[1.5px] border-dashed border-[#C0392B] bg-[rgba(192,57,43,0.04)] text-xs text-[#C0392B] hover:bg-[rgba(192,57,43,0.04)]">
                            Take Photo of Defect <span className="text-[#C0392B]">*</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-stretch">
        <Button
          variant="primary"
          fullWidth
          iconLeft={CheckCircle2}
          disabled={useBulk ? !isBulkReady : Object.values(perSaree).some(d => !d.condition || (d.condition === "damaged" && (!d.damageType.trim() || !d.damagePhotoUrl)))}
          onClick={handleSave}
          className="rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]"
        >
          Save &amp; Mark Received
        </Button>
      </Modal.Footer>

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
    </Modal>
  );
}
