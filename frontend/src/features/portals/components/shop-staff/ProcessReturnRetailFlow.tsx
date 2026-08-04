import React from "react";
import { motion } from "motion/react";
import { Camera, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { C, F, Card, Btn } from "./theme";

interface ProcessReturnRetailFlowProps {
  step: 1 | 2 | 3;
  setStep: (s: any) => void;
  saleFound: boolean;
  setSaleFound: (v: boolean) => void;
  retailManualId: string;
  setRetailManualId: (v: string) => void;
  reason: string | null;
  setReason: (r: string | null) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  returnReasons: any[];
  canSeePrices: boolean;
  onConfirm: () => void;
}

export function ProcessReturnRetailFlow({
  step,
  setStep,
  saleFound,
  setSaleFound,
  retailManualId,
  setRetailManualId,
  reason,
  setReason,
  otherReason,
  setOtherReason,
  returnReasons,
  canSeePrices,
  onConfirm,
}: ProcessReturnRetailFlowProps) {
  return (
    <div>
      {/* Progress */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Find Sale", "Return Reason", "Confirm"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.crim : "rgba(192,57,43,0.15)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.crim : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Find Sale */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          {!saleFound ? (
            <>
              <div
                onClick={() => setSaleFound(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSaleFound(true))?.(); } }}
                style={{
                  margin: "0 20px 18px",
                  background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
                  borderRadius: 20, padding: "32px 24px", cursor: "pointer",
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
                  position: "relative" as const, overflow: "hidden",
                  boxShadow: "0 12px 36px rgba(192,57,43,0.28)",
                }}
              >
                <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(192,57,43,0.22)" }} />
                <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}>
                  <Camera size={34} color="#FFF" />
                </div>
                <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Scan the saree tag to locate the original sale record</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: "9px 24px", position: "relative" as const, zIndex: 1, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF" }}>
                  Tap to Open Camera
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
              </div>
              <div style={{ margin: "0 20px" }}>
                <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={retailManualId} onChange={e => setRetailManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                    style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
                  />
                  {retailManualId.length > 3 && (
                    <button onClick={() => setSaleFound(true)} style={{ height: 52, borderRadius: 12, background: C.crim, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={17} color="#FFF" />
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Original Sale Found</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>Sale record located in system</div>
                </div>
              </div>
              <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, letterSpacing: 1, color: C.muted, marginBottom: 14, textTransform: "uppercase" as const }}>Original Sale Details</div>
                  {[
                    ["Saree ID", "PADMA-L1-004", true],
                    ["Design", "BKB-045 · Cream Zari Border Saree", false],
                    ["Sale Date", "05 Jun 2026", true],
                    ["Customer", "Smt. Meenakshi", false],
                    ...(canSeePrices ? [["Amount Paid", "₹8,500", false]] : []),
                    ["Payment Method", "UPI", true],
                  ].map(([k, v, mono], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                      <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: (k as string) === "Amount Paid" ? C.gold : C.text, textAlign: "right" as const }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <button onClick={() => setSaleFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
                <Btn label="Next — Return Reason →" onClick={() => setStep(2)} style={{ flex: 1, background: C.crim }} />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Step 2 — Return Reason */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Return Reason</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Why is the customer returning this saree?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 10px" }}>
            {returnReasons.slice(0, 4).map(r => (
              <button key={r.id} onClick={() => setReason(r.id)} style={{
                padding: "16px 14px", borderRadius: 14,
                border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                background: reason === r.id ? r.bg : C.white,
                cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 8,
                position: "relative" as const,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: reason === r.id ? `1px solid ${r.color}40` : "none" }}>
                  <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                </div>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{r.sub}</div>
                </div>
                {reason === r.id && (
                  <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} color="#FFF" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {(() => {
            const r = returnReasons[4];
            return (
              <button onClick={() => setReason(r.id)} style={{
                margin: "0 20px 16px", width: "calc(100% - 40px)", padding: "14px 18px", borderRadius: 14,
                border: `${reason === r.id ? 2 : 1}px solid ${reason === r.id ? r.color : C.bdr}`,
                background: reason === r.id ? r.bg : C.white,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12, position: "relative" as const,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: reason === r.id ? r.bg : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <r.Icon size={20} color={reason === r.id ? r.color : C.muted} />
                </div>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: reason === r.id ? r.color : C.text }}>{r.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.sub}</div>
                </div>
                {reason === r.id && (
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} color="#FFF" />
                  </div>
                )}
              </button>
            );
          })()}
          {reason === "other" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>Additional Notes</label>
              <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Describe the return reason in detail..." rows={3}
                style={{ width: "100%", background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none" as const, boxSizing: "border-box" as const }}
              />
            </div>
          )}
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }} />
            <Btn label="Next — Confirm →" onClick={() => reason && setStep(3)} style={{ flex: 2, background: reason ? C.crim : "#C0C0C0", cursor: reason ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* Step 3 — Confirm Return */}
      {step === 3 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Confirm Return</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please review before confirming</div>
          </div>
          <Card style={{ margin: "0 20px 14px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.crim}, rgba(192,57,43,0.3))` }} />
            <div style={{ padding: 18 }}>
              {[
                { label: "Saree", value: "PADMA-L1-004 · BKB-045" },
                { label: "Customer", value: "Smt. Meenakshi" },
                { label: "Original Sale", value: "05 Jun 2026" },
                { label: "Return Reason", value: returnReasons.find(r => r.id === reason)?.label ?? "Other" },
              ].map(({ label, value }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{label}</span>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
              {otherReason && reason === "other" && (
                <div style={{ background: "rgba(107,26,42,0.05)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>Notes</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{otherReason}</div>
                </div>
              )}
            </div>
          </Card>
          <div style={{ margin: "0 20px 16px", background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={15} color={C.crim} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: F.u, fontSize: 12, color: "#8B2020", lineHeight: 1.55 }}>
              Confirming will add PADMA-L1-004 back to shop inventory and update the customer's purchase record.
            </div>
          </div>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            <Btn label="Confirm Return" icon={<RotateCcw size={16} />} onClick={onConfirm} style={{ width: "100%", background: C.crim, height: 56 }} />
            <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(2)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}
