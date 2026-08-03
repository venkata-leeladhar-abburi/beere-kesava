import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, Camera, UploadCloud, CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import {
  T, F, baseCard, SareeItem, InspectionResult, DEFECT_TYPES, variance,
} from "./WorkerQCTypes";

interface WorkerQCInspectionScreenProps {
  inspecting: SareeItem;
  result: InspectionResult;
  isDesktop?: boolean;
  defectSubmitted: boolean;
  defectTypes: string[];
  setDefectTypes: React.Dispatch<React.SetStateAction<string[]>>;
  hasPhoto: boolean;
  setHasPhoto: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  deductionAmount: number | "";
  setDeductionAmount: React.Dispatch<React.SetStateAction<number | "">>;
  makingChargeOf: (s: SareeItem | null) => number;
  closeInspect: () => void;
  confirmSemiApproved: () => void;
  confirmDefective: () => void;
}

export function WorkerQCInspectionScreen({
  inspecting,
  result,
  isDesktop,
  defectSubmitted,
  defectTypes,
  setDefectTypes,
  hasPhoto,
  setHasPhoto,
  notes,
  setNotes,
  deductionAmount,
  setDeductionAmount,
  makingChargeOf,
  closeInspect,
  confirmSemiApproved,
  confirmDefective,
}: WorkerQCInspectionScreenProps) {
  const v = variance(inspecting.weight, inspecting.std);

  return (
    <AnimatePresence mode="wait">
      <motion.div key="inspect" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div style={{ background: T.gradHero, height: 50, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, borderRadius: isDesktop ? "10px 10px 0 0" : 0 }}>
          <button onClick={closeInspect} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
            <ChevronLeft size={18} color="rgba(255,255,255,0.85)" />
          </button>
          <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", flex: 1 }}>
            {result === "semi_approved" ? `Semi-Approved: ${inspecting.id}` : `Mark Defective: ${inspecting.id}`}
          </span>
        </div>

        {/* Defect submitted — confirmation */}
        {defectSubmitted && (
          <div style={{ padding: "20px 16px" }}>
            <div style={{ ...baseCard, padding: 20, border: `1px solid ${result === "semi_approved" ? "rgba(200,155,71,0.25)" : "rgba(192,57,43,0.25)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: result === "semi_approved" ? T.bgGold : T.bgCrim, border: `1.5px solid ${result === "semi_approved" ? T.gold : T.crim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result === "semi_approved" ? <AlertTriangle size={22} color={T.gold} /> : <XCircle size={22} color={T.crim} />}
                </div>
                <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: T.brown }}>{inspecting.id} — {result === "semi_approved" ? "SEMI-APPROVED" : "DEFECTIVE"}</div>
              </div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>
                {result === "semi_approved" ? "Saree passed QC with deduction applied. WhatsApp sent." : "Stored in defective inventory. No payment for this saree. WhatsApp sent."}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                {defectTypes.map(d => <span key={d} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#FFF", background: result === "semi_approved" ? T.gold : T.crim, padding: "2px 9px", borderRadius: 999 }}>{d}</span>)}
              </div>
              {(() => {
                const charge = makingChargeOf(inspecting);
                const ded = result === "semi_approved" ? (Number(deductionAmount) || 0) : charge;
                const payable = Math.max(charge - ded, 0);
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: result === "semi_approved" ? T.gold : T.crim }}>₹{ded} deducted</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: T.muted, marginTop: 4 }}>
                      {result === "semi_approved"
                        ? `Weaver earns ₹${payable} of the ₹${charge} making charge.`
                        : `Weaver earns nothing for this saree (full ₹${charge} making charge withheld).`}
                    </div>
                  </div>
                );
              })()}
              <button onClick={closeInspect} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: 48, background: T.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 14, fontWeight: 700, color: "#FFF", cursor: "pointer", marginBottom: 10 }}>
                <CheckCircle2 size={15} /> Back to Queue
              </button>
            </div>
          </div>
        )}

        {/* Defect entry form */}
        {!defectSubmitted && (
          <div style={{ paddingBottom: 28 }}>
            {/* Saree info strip */}
            <div style={{ margin: "12px 16px" }}>
              <div style={{ ...baseCard, overflow: "hidden" }}>
                <div style={{ background: T.gradHero, padding: "12px 16px 10px" }}>
                  <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 700, color: T.goldL, marginBottom: 4 }}>{inspecting.id}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.m, fontSize: 10, color: T.goldL, background: "rgba(200,155,71,0.20)", padding: "2px 7px", borderRadius: 999 }}>{inspecting.batch}</span>
                    <span style={{ fontFamily: F.u, fontSize: 10, color: "#FFF", background: inspecting.source === "outsourced" ? "rgba(30,102,64,0.70)" : "rgba(255,255,255,0.20)", padding: "2px 7px", borderRadius: 999 }}>
                      {inspecting.source === "outsourced" ? `Weaver: ${inspecting.weaver}` : `Own: ${inspecting.weaver}`}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "10px 16px", display: "flex", gap: 20, alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 10, color: T.muted }}>Recorded</div>
                    <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 600, color: T.brown }}>{inspecting.weight}g</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 10, color: T.muted }}>Standard</div>
                    <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 600, color: T.brown }}>{inspecting.std}g</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {v.ok ? <CheckCircle2 size={12} color={T.green} /> : <AlertTriangle size={12} color={T.crim} />}
                    <span style={{ fontFamily: F.u, fontSize: 11, color: v.ok ? T.green : T.crim }}>{v.d > 0 ? "+" : ""}{v.d}g {v.ok ? "✓" : "✗"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Defect types */}
            <div style={{ padding: "0 16px" }}>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: T.brown, marginBottom: 3 }}>What is wrong with this saree?</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: T.muted, marginBottom: 12 }}>Select all that apply.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {DEFECT_TYPES.map(dt => {
                  const sel = defectTypes.includes(dt.label);
                  return (
                    <button key={dt.label} onClick={() => setDefectTypes(p => p.includes(dt.label) ? p.filter(x => x !== dt.label) : [...p, dt.label])}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: 72, background: sel ? "rgba(110,15,45,0.05)" : T.card, border: sel ? `2px solid ${T.burg}` : `1px solid ${T.bdr}`, borderRadius: 10, cursor: "pointer", position: "relative" }}>
                      {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: T.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
                      <dt.Icon size={18} color={sel ? T.burg : T.muted} />
                      <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: sel ? 600 : 400, color: sel ? T.brown : T.muted, textAlign: "center", lineHeight: 1.2 }}>{dt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown, marginBottom: 8 }}>Photo of defect</div>
              {!hasPhoto ? (
                <div style={{ border: "1px dashed rgba(110,15,45,0.25)", borderRadius: 10, padding: "14px 12px", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: T.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Camera size={13} /> Take Photo
                    </button>
                    <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${T.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <UploadCloud size={13} /> Gallery
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 60, height: 60, background: "#F5E8D0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.bdr}`, position: "relative" }}>
                    <Camera size={22} color={T.muted} />
                    <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: T.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={10} color="#FFF" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: T.green }}>Defect photo captured</div>
                    <button onClick={() => setHasPhoto(false)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: T.burg, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Retake</button>
                  </div>
                </div>
              )}

              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes (optional)..."
                style={{ width: "100%", minHeight: 70, background: T.inp, border: `1px solid ${T.bdrMed}`, borderRadius: 10, padding: "10px 12px", fontFamily: F.u, fontSize: 13, color: T.brown, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 14 } as React.CSSProperties} />

              {result === "semi_approved" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown, marginBottom: 8 }}>Deduction Amount (₹)</div>
                  <input type="number" value={deductionAmount} onChange={e => setDeductionAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Enter deduction amount"
                    style={{ width: "100%", height: 44, background: T.inp, border: `1px solid ${T.bdrMed}`, borderRadius: 10, padding: "0 12px", fontFamily: F.m, fontSize: 14, color: T.brown, outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              <div style={{ background: result === "semi_approved" ? T.bgGold : T.bgCrim, border: `1px solid ${result === "semi_approved" ? "rgba(200,155,71,0.20)" : "rgba(192,57,43,0.20)"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertTriangle size={14} color={result === "semi_approved" ? T.gold : T.crim} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: F.u, fontSize: 11, color: result === "semi_approved" ? T.gold : T.crim, lineHeight: 1.5 }}>
                  {result === "semi_approved"
                    ? `₹${Number(deductionAmount) || 0} of the ₹${makingChargeOf(inspecting)} making charge will be deducted from ${inspecting.source === "outsourced" ? inspecting.weaver : "this loom"}'s payment.`
                    : `${inspecting.source === "outsourced" ? inspecting.weaver : "This loom"} will not be paid for this saree — the full ₹${makingChargeOf(inspecting)} making charge is withheld.`}
                  {" "}Weaver notified via WhatsApp.
                </div>
              </div>

              <button onClick={result === "semi_approved" ? confirmSemiApproved : confirmDefective} disabled={defectTypes.length === 0 || !hasPhoto || (result === "semi_approved" && deductionAmount === "")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: 52, background: defectTypes.length > 0 && hasPhoto && (result !== "semi_approved" || deductionAmount !== "") ? (result === "semi_approved" ? T.gold : T.crim) : "#DDD", border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 14, fontWeight: 700, color: defectTypes.length > 0 && hasPhoto && (result !== "semi_approved" || deductionAmount !== "") ? "#FFF" : "#999", cursor: defectTypes.length > 0 && hasPhoto && (result !== "semi_approved" || deductionAmount !== "") ? "pointer" : "not-allowed" }}>
                {result === "semi_approved" ? <CheckCircle2 size={15} /> : <XCircle size={15} />} Confirm — {result === "semi_approved" ? "Semi-Approve" : "Mark as Defective"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
