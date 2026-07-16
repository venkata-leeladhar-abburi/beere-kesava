import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Scan, CheckSquare, Square, Users, ChevronDown, X, CheckCircle2,
  AlertTriangle, Camera, Package, ArrowDownToLine, Clock, Sparkles, UploadCloud,
} from "lucide-react";
import { C, F, card, btnPrimary, btnGhost, inputStyle } from "./tokens";
import { useFinishing, FinishingAssignment } from "../FinishingContext";
import { useFinishingStaff } from "../FinishingStaffContext";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WORKER_NAME = "Ravi Kumar (WK-042)";

// ── Shared atoms ──────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, accent }: {
  icon: React.ReactNode; title: string; count?: number; accent?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: accent ?? "rgba(107,26,42,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{title}</div>
      </div>
      {count !== undefined && (
        <span style={{ fontFamily: F.m, fontSize: 11, fontWeight: 700, background: "rgba(107,26,42,0.09)", color: C.burg, padding: "3px 9px", borderRadius: 999 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ScanBarBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 38, background: C.dark, border: "none", borderRadius: 10, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.burg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.dark; }}
    >
      <Scan size={15} color="#FFF" /> {label}
    </button>
  );
}

// ── Simulated scan ────────────────────────────────────────────────────────────

function useScanSim(candidateIds: string[], onScanned: (id: string) => void) {
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const startScan = () => {
    if (!candidateIds.length) { setScanMsg("No sarees available to scan."); return; }
    setScanning(true);
    setScanMsg("Scanning…");
    setTimeout(() => {
      const id = candidateIds[Math.floor(Math.random() * candidateIds.length)];
      onScanned(id);
      setScanMsg(`Scanned: ${id}`);
      setScanning(false);
      setTimeout(() => setScanMsg(""), 2500);
    }, 900);
  };

  return { scanning, scanMsg, startScan };
}

// ── Staff picker modal ────────────────────────────────────────────────────────

function StaffPickerModal({ onSelect, onClose }: {
  onSelect: (staff: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  const { activeMembers } = useFinishingStaff();
  const [selected, setSelected] = useState<string | null>(null);

  const pick = activeMembers.find(m => m.id === selected);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", background: "#FFF", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", maxHeight: "70vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: C.text }}>Select Finishing Staff</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {activeMembers.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
              No active finishing staff members found.
            </div>
          )}
          {activeMembers.map(m => {
            const sel = selected === m.id;
            return (
              <button key={m.id} onClick={() => setSelected(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1.5px solid ${sel ? C.burg : "rgba(107,26,42,0.12)"}`, borderRadius: 12, background: sel ? "rgba(107,26,42,0.04)" : "#FFF", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(107,26,42,0.12)", border: `1.5px solid ${sel ? C.burg : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.burg }}>{m.firstName[0]}{m.lastName[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>{m.empId}{m.specialisation ? ` · ${m.specialisation}` : ""}</div>
                </div>
                {sel && <CheckCircle2 size={18} color={C.burg} />}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            disabled={!pick}
            onClick={() => { if (pick) onSelect({ id: pick.id, name: `${pick.firstName} ${pick.lastName}` }); }}
            style={{ ...btnPrimary, opacity: pick ? 1 : 0.45, cursor: pick ? "pointer" : "not-allowed" }}
          >
            Assign to {pick ? `${pick.firstName} ${pick.lastName}` : "Selected Staff"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Verification modal ────────────────────────────────────────────────────────

interface VerifData {
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
          <span style={{ fontFamily: F.d, fontSize: 15, fontWeight: 700, color: C.text }}>Photo Required</span>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Take a photo of the defect as proof. This is required to complete the rejection.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Camera size={13} /> Take Photo
          </button>
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <UploadCloud size={13} /> Upload from Gallery
          </button>
        </div>
        <button onClick={onCancel} style={{ width: "100%", background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", padding: 8 }}>Cancel</button>
      </div>
    </div>
  );
}

function VerificationModal({ assignments, onSave, onClose, isMobile }: {
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
          <span style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: C.text }}>Verify Condition</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 14 }}>
          {assignments.length} saree{assignments.length > 1 ? "s" : ""} · Received by <strong style={{ color: C.text }}>Ravi Kumar</strong> · {today}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Bulk toggle */}
          {assignments.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ v: true, l: "Same condition for all" }, { v: false, l: "Per saree" }].map(opt => (
                <button key={String(opt.v)} onClick={() => setUseBulk(opt.v)}
                  style={{ flex: 1, height: 36, border: `1.5px solid ${useBulk === opt.v ? C.burg : "rgba(107,26,42,0.15)"}`, borderRadius: 8, background: useBulk === opt.v ? "rgba(107,26,42,0.05)" : "transparent", fontFamily: F.u, fontSize: 12, fontWeight: 600, color: useBulk === opt.v ? C.burg : C.muted, cursor: "pointer" }}>
                  {opt.l}
                </button>
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
              <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Condition</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {([["perfect", "Perfect ✓", C.green, "rgba(30,102,64,0.09)"], ["damaged", "Damaged ⚠", C.crim, "rgba(192,57,43,0.08)"]] as const).map(([val, lbl, col, bg]) => (
                  <button key={val} onClick={() => { setBulkCondition(val); if (val === "damaged" && !bulkDamagePhotoUrl) setPhotoPromptFor("bulk"); }}
                    style={{ flex: 1, height: 48, border: `2px solid ${bulkCondition === val ? col : "rgba(107,26,42,0.12)"}`, borderRadius: 12, background: bulkCondition === val ? bg : "transparent", fontFamily: F.u, fontWeight: 700, fontSize: 14, color: bulkCondition === val ? col : C.muted, cursor: "pointer", transition: "all 0.15s" }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Damage fields */}
              <AnimatePresence>
                {bulkCondition === "damaged" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: EASE }} style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 4 }}>
                      <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Damage Type <span style={{ color: C.crim }}>*</span></div>
                          <input value={bulkDamageType} onChange={e => setBulkDamageType(e.target.value)} placeholder="e.g. Stain, Thread break" style={{ ...inputStyle, height: 44, fontSize: 13 }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Severity</div>
                          <div style={{ position: "relative" }}>
                            <select value={bulkDamageSev} onChange={e => setBulkDamageSev(e.target.value as VerifData["damageSeverity"])} style={{ ...inputStyle, height: 44, fontSize: 13, appearance: "none", paddingRight: 32, cursor: "pointer" }}>
                              <option value="">Select severity…</option>
                              {["Minor", "Moderate", "Severe"].map(s => <option key={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={14} color={C.muted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Notes</div>
                        <textarea value={bulkDamageNotes} onChange={e => setBulkDamageNotes(e.target.value)} placeholder="Additional details…" rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 14px", resize: "none", fontSize: 13, lineHeight: 1.5 }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Photo <span style={{ color: C.crim, fontWeight: 400 }}>— Required</span></div>
                        {bulkDamagePhotoUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, background: "rgba(30,102,64,0.05)" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Camera size={14} color="rgba(255,255,255,0.85)" />
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flex: 1 }}>Photo attached</span>
                            <button onClick={() => setPhotoPromptFor("bulk")} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.burg, cursor: "pointer", textDecoration: "underline" }}>Retake</button>
                          </div>
                        ) : (
                          <button onClick={() => setPhotoPromptFor("bulk")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 40, border: `1.5px dashed ${C.crim}`, borderRadius: 10, background: "rgba(192,57,43,0.04)", fontFamily: F.u, fontSize: 13, color: C.crim, cursor: "pointer" }}>
                            <Camera size={15} color={C.crim} /> Take Photo of Defect
                          </button>
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
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 10 }}>{a.designCode} · {a.sareeType}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: d.condition === "damaged" ? 10 : 0 }}>
                      {([["perfect", "Perfect ✓", C.green, "rgba(30,102,64,0.09)"], ["damaged", "Damaged ⚠", C.crim, "rgba(192,57,43,0.08)"]] as const).map(([val, lbl, col, bg]) => (
                        <button key={val} onClick={() => { update({ condition: val }); if (val === "damaged" && !d.damagePhotoUrl) setPhotoPromptFor(a.id); }}
                          style={{ flex: 1, height: 38, border: `1.5px solid ${d.condition === val ? col : "rgba(107,26,42,0.12)"}`, borderRadius: 9, background: d.condition === val ? bg : "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 12, color: d.condition === val ? col : C.muted, cursor: "pointer", transition: "all 0.15s" }}>
                          {lbl}
                        </button>
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
                            <button onClick={() => setPhotoPromptFor(a.id)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.burg, cursor: "pointer", textDecoration: "underline" }}>Retake</button>
                          </div>
                        ) : (
                          <button onClick={() => setPhotoPromptFor(a.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 38, border: `1.5px dashed ${C.crim}`, borderRadius: 9, background: "rgba(192,57,43,0.04)", fontFamily: F.u, fontSize: 12.5, color: C.crim, cursor: "pointer" }}>
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

// ── Success toast ─────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#FFF", padding: "12px 18px", borderRadius: 12, fontFamily: F.u, fontSize: 13, fontWeight: 600, zIndex: 400, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
      <CheckCircle2 size={15} color={C.gold} /> {msg}
    </motion.div>
  );
}

// ── Section A — Assign sarees ─────────────────────────────────────────────────

function SectionA({ isMobile }: { isMobile?: boolean }) {
  const { readySarees, assignSarees } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");

  const unselectedIds = readySarees.filter(s => !selected.has(s.id)).map(s => s.id);
  const { scanning, scanMsg, startScan } = useScanSim(unselectedIds, id => {
    setSelected(prev => { const next = new Set(prev); next.add(id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === readySarees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(readySarees.map(s => s.id)));
    }
  };

  const handleAssign = (staff: { id: string; name: string }) => {
    assignSarees([...selected], staff, WORKER_NAME);
    setToast(`${selected.size} saree${selected.size > 1 ? "s" : ""} assigned to ${staff.name}`);
    setSelected(new Set());
    setShowPicker(false);
  };

  const allChecked = readySarees.length > 0 && selected.size === readySarees.length;

  return (
    <div style={{ ...card, padding: 16, marginBottom: 16 }}>
      <SectionHeader
        icon={<Package size={18} color={C.burg} />}
        title="Assign Sarees for Finishing"
        count={readySarees.length}
        accent="rgba(107,26,42,0.09)"
      />

      {/* Sub-header: scan + select-all */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <ScanBarBtn label={scanning ? "Scanning…" : "Scan Barcode"} onClick={startScan} />
        {readySarees.length > 0 && (
          <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, color: C.muted, padding: "4px 6px" }}>
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(107,26,42,0.05)", border: `1px solid rgba(107,26,42,0.12)`, borderRadius: 8, padding: "7px 11px", marginBottom: 10, fontFamily: F.m, fontSize: 12, color: C.burg }}>
          {scanMsg}
        </div>
      )}

      {/* Table */}
      {readySarees.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No QC-passed sarees awaiting finishing.
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          {readySarees.map((s, i) => {
            const checked = selected.has(s.id);
            return (
              <div key={s.id}
                onClick={() => toggleRow(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderTop: i > 0 ? `1px solid rgba(107,26,42,0.07)` : "none", background: checked ? "rgba(107,26,42,0.04)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}
              >
                <div style={{ flexShrink: 0 }}>
                  {checked ? <CheckSquare size={16} color={C.burg} /> : <Square size={16} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{s.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1 }}>{s.designCode} · {s.sareeType}</div>
                  <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginTop: 1 }}>{s.weaverName}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{s.qcPassDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar — inline on tablet/desktop, bottom action sheet on mobile */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <button onClick={() => setShowPicker(true)}
                style={{ ...btnPrimary, height: 50, fontSize: 14, gap: 7 }}>
                <Users size={16} /> Assign Staff
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ ...btnGhost, height: 46, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowPicker(true)}
              style={{ ...btnPrimary, flex: 1, height: 46, fontSize: 14, gap: 7 }}>
              <Users size={16} /> Assign {selected.size} Saree{selected.size > 1 ? "s" : ""} to Finishing Staff
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ ...btnGhost, width: 46, height: 46, padding: 0, flexShrink: 0, borderRadius: 12, flex: "none" }}>
              <X size={16} color={C.burg} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showPicker && <StaffPickerModal onSelect={handleAssign} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}

// ── Section B — Receive returns ───────────────────────────────────────────────

function SectionB({ isMobile }: { isMobile?: boolean }) {
  const { assignments, receiveReturn } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showVerif, setShowVerif] = useState(false);
  const [toast, setToast] = useState("");

  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);
  const unselectedIds = awaiting.filter(a => !selected.has(a.id)).map(a => a.sareeId);
  // Scan by saree ID → find the assignment
  const { scanning, scanMsg, startScan } = useScanSim(unselectedIds, sareeId => {
    const match = awaiting.find(a => a.sareeId === sareeId);
    if (match) setSelected(prev => { const next = new Set(prev); next.add(match.id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === awaiting.length) setSelected(new Set());
    else setSelected(new Set(awaiting.map(a => a.id)));
  };

  const selectedAssignments = awaiting.filter(a => selected.has(a.id));

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleSave = (data: Record<string, VerifData>) => {
    Object.entries(data).forEach(([assignmentId, d]) => {
      if (!d.condition) return;
      const assignment = awaiting.find(a => a.id === assignmentId);
      if (!assignment) return;
      receiveReturn({
        assignmentId,
        sareeId: assignment.sareeId,
        condition: d.condition,
        damageType: d.damageType || undefined,
        damageSeverity: d.damageSeverity || undefined,
        damageNotes: d.damageNotes || undefined,
        damagePhotoUrl: d.damagePhotoUrl,
        receivedBy: WORKER_NAME,
        receivedDate: today,
      });
    });
    const perfect  = Object.values(data).filter(d => d.condition === "perfect").length;
    const damaged  = Object.values(data).filter(d => d.condition === "damaged").length;
    setToast(`${perfect} perfect, ${damaged} damaged — logged`);
    setSelected(new Set());
    setShowVerif(false);
  };

  const allChecked = awaiting.length > 0 && selected.size === awaiting.length;

  return (
    <div style={{ ...card, padding: 16 }}>
      <SectionHeader
        icon={<ArrowDownToLine size={18} color="#1E6640" />}
        title="Receive Sarees Back"
        count={awaiting.length}
        accent="rgba(30,102,64,0.10)"
      />

      {/* Sub-header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <ScanBarBtn label={scanning ? "Scanning…" : "Scan Barcode"} onClick={startScan} />
        {awaiting.length > 0 && (
          <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, color: C.muted, padding: "4px 6px" }}>
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 8, padding: "7px 11px", marginBottom: 10, fontFamily: F.m, fontSize: 12, color: "#1E6640" }}>
          {scanMsg}
        </div>
      )}

      {awaiting.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No sarees currently awaiting return.
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          {awaiting.map((a, i) => {
            const checked = selected.has(a.id);
            return (
              <div key={a.id}
                onClick={() => toggleRow(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderTop: i > 0 ? `1px solid rgba(107,26,42,0.07)` : "none", background: checked ? "rgba(30,102,64,0.04)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}
              >
                <div style={{ flexShrink: 0 }}>
                  {checked ? <CheckSquare size={16} color="#1E6640" /> : <Square size={16} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{a.sareeId}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1 }}>{a.designCode} · {a.sareeType}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.text, marginTop: 2 }}>{a.finishingStaffName}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginBottom: 4 }}>{a.assignedDate}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(248,140,0,0.10)", border: "1px solid rgba(248,140,0,0.22)", borderRadius: 999, padding: "2px 7px" }}>
                    <Clock size={9} color="#B85C00" />
                    <span style={{ fontFamily: F.u, fontSize: 9, fontWeight: 600, color: "#B85C00" }}>Awaiting</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar — inline on tablet/desktop, bottom action sheet on mobile */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <button onClick={() => setShowVerif(true)}
                style={{ ...btnPrimary, height: 50, fontSize: 14, background: "#1E6640", gap: 7 }}>
                <CheckCircle2 size={16} /> Mark as Received
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ ...btnGhost, height: 46, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowVerif(true)}
              style={{ ...btnPrimary, flex: 1, height: 46, fontSize: 14, background: "#1E6640", gap: 7 }}>
              <CheckCircle2 size={16} /> Mark {selected.size} as Received
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ ...btnGhost, width: 46, height: 46, padding: 0, flexShrink: 0, borderRadius: 12, flex: "none" }}>
              <X size={16} color={C.burg} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showVerif && (
          <VerificationModal
            assignments={selectedAssignments}
            onSave={handleSave}
            onClose={() => setShowVerif(false)}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}

// ── Section C — Assignment History & Tracking ─────────────────────────────────

interface StaffTrackingRow {
  name: string;
  assignedSareeIds: string[];
  returnedSareeIds: string[];
  perfect: number;
  damaged: number;
  lastAssignmentDate: string;
}

function parseDMYDate(s: string): number {
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

function SectionC({ isMobile }: { isMobile?: boolean }) {
  const { assignments, returns } = useFinishing();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<StaffTrackingRow[]>(() => {
    const byStaff = new Map<string, FinishingAssignment[]>();
    assignments.forEach(a => {
      const list = byStaff.get(a.finishingStaffName) ?? [];
      list.push(a);
      byStaff.set(a.finishingStaffName, list);
    });

    return Array.from(byStaff.entries()).map(([name, staffAssignments]) => {
      const assignedSareeIds = staffAssignments.map(a => a.sareeId);
      const staffReturns = returns.filter(r => assignedSareeIds.includes(r.sareeId));
      const returnedSareeIds = staffReturns.map(r => r.sareeId);
      const perfect = staffReturns.filter(r => r.condition === "perfect").length;
      const damaged = staffReturns.filter(r => r.condition === "damaged").length;
      const lastAssignmentDate = staffAssignments
        .map(a => a.assignedDate)
        .sort((a, b) => parseDMYDate(b) - parseDMYDate(a))[0] ?? "—";

      return { name, assignedSareeIds, returnedSareeIds, perfect, damaged, lastAssignmentDate };
    }).sort((a, b) => parseDMYDate(b.lastAssignmentDate) - parseDMYDate(a.lastAssignmentDate));
  }, [assignments, returns]);

  const TH: React.CSSProperties = { fontFamily: F.u, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left" as const, padding: "9px 10px", whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.u, fontSize: 12.5, color: C.text, padding: "10px 10px", verticalAlign: "middle" as const };

  return (
    <div style={{ ...card, padding: 16, marginBottom: 16 }}>
      <SectionHeader
        icon={<Users size={18} color={C.burg} />}
        title="Assignment History & Tracking"
        count={rows.length}
        accent="rgba(107,26,42,0.09)"
      />

      {rows.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No finishing staff assignments yet.
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {rows.map(r => {
            const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
            const isOpen = expanded === r.name;
            return (
              <div key={r.name} style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 12, overflow: "hidden", background: "#FFF" }}>
                <div onClick={() => setExpanded(isOpen ? null : r.name)} style={{ padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</span>
                    <ChevronDown size={14} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Assigned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: C.text }}>{r.assignedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Returned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: C.text }}>{r.returnedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Pending</div>
                      <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: pending > 0 ? "#B85C00" : C.text, background: pending > 0 ? "rgba(184,92,0,0.10)" : "transparent", borderRadius: 999, padding: pending > 0 ? "1px 8px" : 0 }}>{pending}</span>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: `1px solid rgba(107,26,42,0.08)`, background: "rgba(107,26,42,0.02)", padding: "10px 14px 14px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {assignments.filter(a => a.finishingStaffName === r.name).map(a => {
                      const ret = returns.find(rt => rt.sareeId === a.sareeId);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: `1px solid rgba(107,26,42,0.06)`, paddingBottom: 8 }}>
                          <div>
                            <div style={{ fontFamily: F.m, fontSize: 11.5, color: C.burg, fontWeight: 600 }}>{a.sareeId}</div>
                            <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted, marginTop: 2 }}>{a.assignedDate}{ret?.receivedDate ? ` → ${ret.receivedDate}` : ""}</div>
                          </div>
                          {!ret ? (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: "#B85C00", fontWeight: 600, flexShrink: 0 }}>Awaiting Return</span>
                          ) : ret.condition === "perfect" ? (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.green, fontWeight: 600, flexShrink: 0 }}>Perfect ✓</span>
                          ) : (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.crim, fontWeight: 600, flexShrink: 0 }}>Damaged ⚠</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "rgba(107,26,42,0.03)" }}>
                  <th style={TH}>Finishing Staff</th>
                  <th style={TH}>Assigned</th>
                  <th style={TH}>Returned</th>
                  <th style={TH}>Pending Return</th>
                  <th style={TH}>Perfect</th>
                  <th style={TH}>Damaged</th>
                  <th style={TH}>Last Assignment</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
                  return (
                    <React.Fragment key={r.name}>
                      <tr style={{ borderTop: i > 0 ? `1px solid rgba(107,26,42,0.07)` : "none", background: "#FFF" }}>
                        <td style={{ ...TD, fontWeight: 600 }}>{r.name}</td>
                        <td style={TD}>{r.assignedSareeIds.length}</td>
                        <td style={TD}>{r.returnedSareeIds.length}</td>
                        <td style={{ ...TD, color: pending > 0 ? "#B85C00" : C.text, fontWeight: pending > 0 ? 700 : 400 }}>{pending}</td>
                        <td style={{ ...TD, color: C.green, fontWeight: 600 }}>{r.perfect}</td>
                        <td style={{ ...TD, color: r.damaged > 0 ? C.crim : C.text, fontWeight: r.damaged > 0 ? 700 : 400 }}>{r.damaged}</td>
                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{r.lastAssignmentDate}</td>
                        <td style={TD}>
                          <button onClick={() => setExpanded(expanded === r.name ? null : r.name)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" as const }}>
                            View Details <ChevronDown size={12} style={{ transform: expanded === r.name ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                          </button>
                        </td>
                      </tr>
                      {expanded === r.name && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: "rgba(107,26,42,0.02)" }}>
                            <div style={{ padding: "10px 14px 14px" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={TH}>Saree ID</th>
                                    <th style={TH}>Assigned Date</th>
                                    <th style={TH}>Returned Date</th>
                                    <th style={TH}>Condition</th>
                                    <th style={TH}>Photo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assignments.filter(a => a.finishingStaffName === r.name).map((a, ai) => {
                                    const ret = returns.find(rt => rt.sareeId === a.sareeId);
                                    return (
                                      <tr key={a.id} style={{ borderTop: ai > 0 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11.5, color: C.burg, fontWeight: 600 }}>{a.sareeId}</td>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{a.assignedDate}</td>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{ret?.receivedDate ?? "—"}</td>
                                        <td style={TD}>
                                          {!ret ? (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: "#B85C00", fontWeight: 600 }}>Awaiting Return</span>
                                          ) : ret.condition === "perfect" ? (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.green, fontWeight: 600 }}>Perfect ✓</span>
                                          ) : (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.crim, fontWeight: 600 }}>Damaged ⚠</span>
                                          )}
                                        </td>
                                        <td style={TD}>
                                          {ret?.damagePhotoUrl ? (
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                              <Camera size={12} color="rgba(255,255,255,0.85)" />
                                            </div>
                                          ) : (
                                            <span style={{ color: C.muted, fontSize: 11 }}>—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section B with filters — Receive returns ──────────────────────────────────

function SectionBFiltered({ isMobile }: { isMobile?: boolean }) {
  const { assignments, receiveReturn } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showVerif, setShowVerif] = useState(false);
  const [toast, setToast] = useState("");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");

  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);

  // Get unique batches from awaiting
  const uniqueBatches = useMemo(() => {
    const bSet = new Set(awaiting.map(a => a.batchId ?? "—"));
    return Array.from(bSet).filter(b => b !== "—");
  }, [awaiting]);

  // Get unique staff names from awaiting
  const uniqueStaff = useMemo(() => {
    const sSet = new Set(awaiting.map(a => a.finishingStaffName));
    return Array.from(sSet);
  }, [awaiting]);

  const filteredAwaiting = useMemo(() => awaiting.filter(a => {
    const staffOk = filterStaff === "all" || a.finishingStaffName === filterStaff;
    const batchOk = filterBatch === "all" || a.batchId === filterBatch;
    return staffOk && batchOk;
  }), [awaiting, filterStaff, filterBatch]);

  const unselectedIds = filteredAwaiting.filter(a => !selected.has(a.id)).map(a => a.sareeId);
  const { scanning, scanMsg, startScan } = useScanSim(unselectedIds, sareeId => {
    const match = filteredAwaiting.find(a => a.sareeId === sareeId);
    if (match) setSelected(prev => { const next = new Set(prev); next.add(match.id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleAll = () => {
    if (selected.size === filteredAwaiting.length) setSelected(new Set());
    else setSelected(new Set(filteredAwaiting.map(a => a.id)));
  };

  const selectedAssignments = filteredAwaiting.filter(a => selected.has(a.id));
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const allChecked = filteredAwaiting.length > 0 && selected.size === filteredAwaiting.length;

  const handleSave = (data: Record<string, VerifData>) => {
    selectedAssignments.forEach(a => {
      const d = data[a.id];
      if (!d?.condition) return;
      receiveReturn({
        assignmentId: a.id,
        sareeId: a.sareeId,
        condition: d.condition,
        damageType: d.damageType || undefined,
        damageSeverity: d.damageSeverity || undefined,
        damageNotes: d.damageNotes || undefined,
        damagePhotoUrl: d.damagePhotoUrl,
        receivedBy: WORKER_NAME,
        receivedDate: today,
      });
    });
    const perfect = Object.values(data).filter(d => d.condition === "perfect").length;
    const damaged = Object.values(data).filter(d => d.condition === "damaged").length;
    setToast(`${perfect} perfect, ${damaged} damaged — logged`);
    setSelected(new Set());
    setShowVerif(false);
  };

  const selStyle: React.CSSProperties = { height: 36, background: "#FFF", border: `1px solid rgba(107,26,42,0.15)`, borderRadius: 8, fontFamily: F.u, fontSize: 12, color: C.text, paddingLeft: 10, paddingRight: 28, cursor: "pointer", appearance: "none" as const };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
        <ScanBarBtn label={scanning ? "Scanning…" : "Scan Barcode"} onClick={startScan} />
        <div style={{ position: "relative", flex: 1, minWidth: 120 }}>
          <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)} style={{ ...selStyle, width: "100%" }}>
            <option value="all">All Staff</option>
            {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} color={C.muted} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 120 }}>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ ...selStyle, width: "100%" }}>
            <option value="all">All Batches</option>
            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={12} color={C.muted} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
        {filteredAwaiting.length > 0 && (
          <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, color: C.muted, padding: "4px 6px", whiteSpace: "nowrap" as const }}>
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 8, padding: "7px 11px", marginBottom: 10, fontFamily: F.m, fontSize: 12, color: "#1E6640" }}>
          {scanMsg}
        </div>
      )}

      {filteredAwaiting.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          {awaiting.length === 0 ? "No sarees currently awaiting return." : "No results for selected filters."}
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          {filteredAwaiting.map((a, i) => {
            const checked = selected.has(a.id);
            return (
              <div key={a.id} onClick={() => toggleRow(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderTop: i > 0 ? `1px solid rgba(107,26,42,0.07)` : "none", background: checked ? "rgba(30,102,64,0.04)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}>
                <div style={{ flexShrink: 0 }}>
                  {checked ? <CheckSquare size={16} color="#1E6640" /> : <Square size={16} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{a.sareeId}</div>
                  {/* Show saree type code instead of design code */}
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1 }}>{a.sareeTypeCode || a.sareeType} · {a.finishingStaffName}</div>
                  {a.batchId && <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted, marginTop: 1 }}>{a.batchId}</div>}
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginBottom: 4 }}>{a.assignedDate}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(248,140,0,0.10)", border: "1px solid rgba(248,140,0,0.22)", borderRadius: 999, padding: "2px 7px" }}>
                    <Clock size={9} color="#B85C00" />
                    <span style={{ fontFamily: F.u, fontSize: 9, fontWeight: 600, color: "#B85C00" }}>Awaiting</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <button onClick={() => setShowVerif(true)} style={{ ...btnPrimary, height: 50, fontSize: 14, background: "#1E6640", gap: 7 }}>
                <CheckCircle2 size={16} /> Mark as Received
              </button>
              <button onClick={() => setSelected(new Set())} style={{ ...btnGhost, height: 46, fontSize: 13 }}>Cancel</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowVerif(true)} style={{ ...btnPrimary, flex: 1, height: 46, fontSize: 14, background: "#1E6640", gap: 7 }}>
              <CheckCircle2 size={16} /> Mark {selected.size} as Received
            </button>
            <button onClick={() => setSelected(new Set())} style={{ ...btnGhost, width: 46, height: 46, padding: 0, flexShrink: 0, borderRadius: 12, flex: "none" }}>
              <X size={16} color={C.burg} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showVerif && (
          <VerificationModal assignments={selectedAssignments} onSave={handleSave} onClose={() => setShowVerif(false)} isMobile={isMobile} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WorkerFinishing({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { readySarees, assignments, returns } = useFinishing();
  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);
  const isMobile = !isDesktop && !isTablet;
  const [activeAction, setActiveAction] = useState<"assign" | "receive" | null>(null);

  return (
    <div style={{ padding: isDesktop ? "28px 40px" : isTablet ? "20px 24px" : "16px 14px 24px", background: "#FAFAF8", minHeight: "100%" }}>

      {/* Page heading for desktop */}
      {isDesktop && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 24, background: C.gold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>Finishing</h2>
          </div>
          <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "0 0 0 14px" }}>Assign sarees to finishing staff and receive them back after finishing.</p>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { val: readySarees.length, label: "Ready to Assign", icon: <Sparkles size={15} color={C.gold} />,        bg: "rgba(200,146,58,0.10)", col: C.gold   },
          { val: awaiting.length,    label: "With Staff",       icon: <Clock size={15} color="#B85C00" />,           bg: "rgba(248,140,0,0.09)", col: "#B85C00" },
          { val: returns.length,     label: "Returned",         icon: <CheckCircle2 size={15} color={C.green} />,    bg: "rgba(30,102,64,0.09)", col: C.green   },
        ].map((s, i) => (
          <div key={i} style={{ background: "#FFF", border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 14, padding: "12px 10px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 8px rgba(107,26,42,0.05)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 800, fontSize: 20, color: s.col, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two primary action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveAction(activeAction === "assign" ? null : "assign")}
          style={{
            padding: "16px 12px", borderRadius: 16, cursor: "pointer",
            background: activeAction === "assign"
              ? `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`
              : "#FFF",
            boxShadow: activeAction === "assign"
              ? "0 4px 20px rgba(107,26,42,0.30)"
              : "0 2px 12px rgba(107,26,42,0.08)",
            border: activeAction === "assign" ? "none" : `1.5px solid rgba(107,26,42,0.14)`,
            transition: "all 0.2s",
          } as React.CSSProperties}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "assign" ? "rgba(255,255,255,0.15)" : "rgba(107,26,42,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Package size={20} color={activeAction === "assign" ? "#FFF" : C.burg} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: activeAction === "assign" ? "#FFF" : C.text, marginBottom: 3 }}>Assign Sarees</div>
          <div style={{ fontFamily: F.u, fontSize: 11, color: activeAction === "assign" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {readySarees.length} ready · assign to finishing staff
          </div>
        </button>

        <button
          onClick={() => setActiveAction(activeAction === "receive" ? null : "receive")}
          style={{
            padding: "16px 12px", borderRadius: 16, cursor: "pointer",
            background: activeAction === "receive"
              ? "linear-gradient(135deg, #1E5A3A 0%, #1E6640 100%)"
              : "#FFF",
            boxShadow: activeAction === "receive"
              ? "0 4px 20px rgba(30,102,64,0.28)"
              : "0 2px 12px rgba(107,26,42,0.08)",
            border: activeAction === "receive" ? "none" : `1.5px solid rgba(107,26,42,0.14)`,
            transition: "all 0.2s",
          } as React.CSSProperties}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: activeAction === "receive" ? "rgba(255,255,255,0.15)" : "rgba(30,102,64,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <ArrowDownToLine size={20} color={activeAction === "receive" ? "#FFF" : C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: activeAction === "receive" ? "#FFF" : C.text, marginBottom: 3 }}>Receive Back</div>
          <div style={{ fontFamily: F.u, fontSize: 11, color: activeAction === "receive" ? "rgba(255,255,255,0.65)" : C.muted, lineHeight: 1.4 }}>
            {awaiting.length} awaiting · mark as received
          </div>
        </button>
      </div>

      {/* Expanded action panels */}
      <AnimatePresence>
        {activeAction === "assign" && (
          <motion.div key="assign-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ ...card, padding: 16, marginBottom: 16, overflow: "hidden" }}>
              <SectionHeader
                icon={<Package size={18} color={C.burg} />}
                title="Assign Sarees for Finishing"
                count={readySarees.length}
                accent="rgba(107,26,42,0.09)"
              />
              <SectionA isMobile={isMobile} />
            </div>
          </motion.div>
        )}
        {activeAction === "receive" && (
          <motion.div key="receive-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div style={{ ...card, padding: 16, marginBottom: 16, overflow: "hidden" }}>
              <SectionHeader
                icon={<ArrowDownToLine size={18} color="#1E6640" />}
                title="Receive Sarees Back"
                count={awaiting.length}
                accent="rgba(30,102,64,0.10)"
              />
              <SectionBFiltered isMobile={isMobile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History always visible */}
      <SectionC isMobile={isMobile} />
    </div>
  );
}

