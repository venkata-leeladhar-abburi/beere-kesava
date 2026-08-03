import React from "react";
import { Camera, Package, QrCode, Check } from "lucide-react";
import { C, F, Card, Btn } from "./theme";

interface ProcessReturnWholesaleFlowProps {
  step: 1 | 2;
  setStep: (s: any) => void;
  wsVendor: string;
  setWsVendor: (v: string) => void;
  wsDesign: string;
  setWsDesign: (v: string) => void;
  wsColor: string;
  setWsColor: (v: string) => void;
  wsType: string;
  setWsType: (v: string) => void;
  wsWeight: string;
  setWsWeight: (v: string) => void;
  wsPrice: string;
  setWsPrice: (v: string) => void;
  wsReason: string | null;
  setWsReason: (v: string | null) => void;
  wsReasonOptions: string[];
  wsNewId: string;
  setWsNewId: (v: string) => void;
  wsBarcodeGenerated: boolean;
  setWsBarcodeGenerated: (v: boolean) => void;
  canSeePrices: boolean;
  canProceedWsStep1: boolean;
  setReturnType: (t: any) => void;
  onConfirm: () => void;
}

export function ProcessReturnWholesaleFlow({
  step,
  setStep,
  wsVendor,
  setWsVendor,
  wsDesign,
  setWsDesign,
  wsColor,
  setWsColor,
  wsType,
  setWsType,
  wsWeight,
  setWsWeight,
  wsPrice,
  setWsPrice,
  wsReason,
  setWsReason,
  wsReasonOptions,
  wsNewId,
  setWsNewId,
  wsBarcodeGenerated,
  setWsBarcodeGenerated,
  canSeePrices,
  canProceedWsStep1,
  setReturnType,
  onConfirm,
}: ProcessReturnWholesaleFlowProps) {
  return (
    <div>
      {/* Progress */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Saree Details", "Generate Barcode"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.gold : "rgba(196,146,58,0.20)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? "#8B6520" : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Saree Details */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 16 }}>Enter Saree Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Vendor / Source Name", val: wsVendor, setter: setWsVendor, placeholder: "e.g. Ravi Silks", type: "text" },
                  { label: "Design Code", val: wsDesign, setter: setWsDesign, placeholder: "e.g. BKB-045", type: "text" },
                  { label: "Saree Color", val: wsColor, setter: setWsColor, placeholder: "e.g. Maroon", type: "text" },
                ].map((f, i) => (
                  <div key={i} style={{ gridColumn: i === 0 ? "1 / -1" : undefined }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                      style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Saree Type</label>
                  <select value={wsType} onChange={e => setWsType(e.target.value)}
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none" }}>
                    {["Self Brocade", "Heavy Zari", "Plain Silk", "Kanjivaram", "Cotton"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Weight (grams)</label>
                  <input value={wsWeight} onChange={e => setWsWeight(e.target.value)} placeholder="e.g. 840" type="number"
                    style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                {canSeePrices && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Original Purchase Price ₹</label>
                    <input value={wsPrice} onChange={e => setWsPrice(e.target.value)} placeholder="e.g. 6500" type="number"
                      style={{ width: "100%", height: 46, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 10, padding: "0 14px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, marginBottom: 10 }}>Return Reason</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {wsReasonOptions.map(r => (
                <button key={r} onClick={() => setWsReason(r)} style={{
                  padding: "6px 14px", borderRadius: 999,
                  border: `${wsReason === r ? 2 : 1}px solid ${wsReason === r ? C.gold : C.bdr}`,
                  background: wsReason === r ? "rgba(196,146,58,0.12)" : "transparent",
                  fontFamily: F.u, fontSize: 12, fontWeight: wsReason === r ? 600 : 400,
                  color: wsReason === r ? "#8B6520" : C.muted, cursor: "pointer",
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ margin: "0 20px 16px", display: "flex", gap: 10 }}>
            <button onClick={() => { }} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Camera size={16} color={C.muted} /> Add Photo
            </button>
            <button onClick={() => { }} style={{ flex: 1, height: 46, border: `1.5px dashed ${C.bdr}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Package size={16} color={C.muted} /> From Gallery
            </button>
          </div>
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => { setStep("type"); setReturnType(null); }} style={{ flex: 1 }} />
            <Btn label="Next — Barcode →" onClick={() => canProceedWsStep1 && setStep(2)} style={{ flex: 2, background: canProceedWsStep1 ? C.gold : "#C0C0C0", color: canProceedWsStep1 ? C.text : "#888", cursor: canProceedWsStep1 ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* Step 2 — Generate Barcode */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, rgba(196,146,58,0.3))` }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 14 }}>Review — Saree Details</div>
              {[
                ["Vendor", wsVendor || "—"], ["Design Code", wsDesign || "—"],
                ["Color", wsColor || "—"], ["Type", wsType],
                ["Weight", wsWeight ? `${wsWeight} grams` : "—"],
                ...(canSeePrices ? [["Price", wsPrice ? `₹${wsPrice}` : "—"]] : []),
                ["Return Reason", wsReason || "—"],
              ].map(([k, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: i < arr.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {!wsBarcodeGenerated ? (
            <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
              <button
                onClick={() => {
                  setWsNewId(`RTN-WS-2026-${String(Date.now()).slice(-3)}`);
                  setWsBarcodeGenerated(true);
                }}
                style={{ width: "100%", height: 58, borderRadius: 14, border: `2px solid ${C.gold}`, background: "rgba(196,146,58,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#8B6520" }}
              >
                <QrCode size={22} color={C.gold} /> Generate New Barcode
              </button>
            </div>
          ) : (
            <div style={{ margin: "0 20px 16px" }}>
              <div style={{ background: "#111", borderRadius: 14, padding: "20px 16px", textAlign: "center" as const, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 48, justifyContent: "center", marginBottom: 8 }}>
                  {[3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 2, 1, 4].map((w, i) => (
                    <div key={i} style={{ width: w * 2, background: "#FFF", height: i % 3 === 0 ? 48 : i % 2 === 0 ? 38 : 44, borderRadius: 1 }} />
                  ))}
                </div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: "#AAA", letterSpacing: 2 }}>{wsNewId}</div>
              </div>
              <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={15} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.green }}>This saree will be added to shop inventory with ID {wsNewId}</span>
              </div>
            </div>
          )}

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {wsBarcodeGenerated && (
              <Btn label="Confirm — Add to Inventory" icon={<Check size={16} />} onClick={onConfirm} style={{ width: "100%", background: C.green, height: 56 }} />
            )}
            <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}
