import React, { useState } from 'react';
import { 
  AlertTriangle, Palette, ThumbsDown, Scale, FileText, Building2, ShoppingBag
} from 'lucide-react';
import { C, F, useCanSeePrices } from './theme';
import { ProcessReturnHeader, ReturnHistorySection, ReturnRecord } from './ProcessReturnHeaderHistory';
import { RetailReturnSuccessView, WholesaleReturnSuccessView } from './ProcessReturnSuccessView';
import { ProcessReturnRetailFlow } from './ProcessReturnRetailFlow';
import { ProcessReturnWholesaleFlow } from './ProcessReturnWholesaleFlow';

type MyReturnType = "retail" | "wholesale" | "damage" | null;
type ReturnStep = "type" | 1 | 2 | 3 | "success";

function ProcessReturn({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");
  const [returnLog, setReturnLog] = useState<ReturnRecord[]>([
    { id: "RTN-2026-0039", type: "retail", date: "10 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "RAVI-L2-007", reason: "Wrong Design", amount: "₹12,000" },
    { id: "RTN-2026-0038", type: "retail", date: "05 Jun 2026", customer: "Smt. Kalpana", originalSaleId: "PADMA-L1-001", reason: "Defective", amount: "₹8,500" },
    { id: "RTN-WS-2026-021", type: "wholesale", date: "02 Jun 2026", vendor: "Ravi Silks", design: "BKB-031", color: "Maroon", weight: "920g", wsReason: "Quality Issue" },
  ]);

  // Retail state
  const [saleFound, setSaleFound] = useState(false);
  const [retailManualId, setRetailManualId] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  // Wholesale state
  const [wsVendor, setWsVendor] = useState("");
  const [wsDesign, setWsDesign] = useState("");
  const [wsColor, setWsColor] = useState("");
  const [wsType, setWsType] = useState("Self Brocade");
  const [wsWeight, setWsWeight] = useState("");
  const [wsPrice, setWsPrice] = useState("");
  const [wsReason, setWsReason] = useState<string | null>(null);
  const [wsNewId, setWsNewId] = useState("");
  const [wsBarcodeGenerated, setWsBarcodeGenerated] = useState(false);

  const returnReasons = [
    { id: "defective", label: "Defective", sub: "Damaged or faulty item", Icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
    { id: "wrong", label: "Wrong Design", sub: "Doesn't match selection", Icon: Palette, color: "#7A4F2F", bg: "rgba(122,79,47,0.08)" },
    { id: "mind", label: "Changed Mind", sub: "Customer preference", Icon: ThumbsDown, color: C.burg, bg: "rgba(107,26,42,0.08)" },
    { id: "weight", label: "Size / Weight", sub: "Doesn't meet expectations", Icon: Scale, color: C.green, bg: "rgba(30,102,64,0.08)" },
    { id: "other", label: "Other Reason", sub: "Describe in notes", Icon: FileText, color: C.muted, bg: "rgba(139,112,96,0.08)" },
  ];

  const wsReasonOptions = ["Defective", "Quality Issue", "Overstock", "Wrong Design", "Damaged in Transit", "Other"];

  const resetReturn = () => {
    setReturnType(null); setStep("type");
    setSaleFound(false); setRetailManualId(""); setReason(null); setOtherReason("");
    setWsVendor(""); setWsDesign(""); setWsColor(""); setWsType("Self Brocade");
    setWsWeight(""); setWsPrice(""); setWsReason(null); setWsNewId(""); setWsBarcodeGenerated(false);
  };

  const canProceedWsStep1 = wsVendor.trim() !== "" && wsWeight.trim() !== "" && wsReason !== null;

  // ── TYPE SELECTION ──
  if (step === "type") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
        <div style={{ margin: "20px 20px 8px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Select Return Type</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Choose the type of return to process</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 20px 8px" }}>
          <button
            onClick={() => { setReturnType("retail"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={24} color={C.crim} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Retail Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Customer returning a saree they purchased from our shop. Has original receipt or saree barcode.</div>
            </div>
          </button>
          <button
            onClick={() => { setReturnType("wholesale"); setStep(1); }}
            style={{ padding: "20px 16px", borderRadius: 16, border: `1.5px solid ${C.bdr}`, background: C.white, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 12, boxShadow: "0 2px 12px rgba(44,24,16,0.06)", textAlign: "left" as const }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(196,146,58,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color={C.gold} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Wholesale Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Saree returned from wholesale buyer. No barcode — a new one will be generated and saree added to inventory.</div>
            </div>
          </button>
        </div>
        <ReturnHistorySection returnLog={returnLog} canSeePrices={canSeePrices} />
      </div>
    );
  }

  // ── RETAIL SUCCESS ──
  if (step === "success" && returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
        <RetailReturnSuccessView resetReturn={resetReturn} onBack={onBack} />
      </div>
    );
  }

  // ── WHOLESALE SUCCESS ──
  if (step === "success" && returnType === "wholesale") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
        <WholesaleReturnSuccessView
          wsNewId={wsNewId}
          wsVendor={wsVendor}
          wsDesign={wsDesign}
          wsColor={wsColor}
          wsWeight={wsWeight}
          resetReturn={resetReturn}
        />
      </div>
    );
  }

  // ── RETAIL STEPS ──
  if (returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
        <ProcessReturnRetailFlow
          step={step as 1 | 2 | 3}
          setStep={setStep}
          saleFound={saleFound}
          setSaleFound={setSaleFound}
          retailManualId={retailManualId}
          setRetailManualId={setRetailManualId}
          reason={reason}
          setReason={setReason}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          returnReasons={returnReasons}
          canSeePrices={canSeePrices}
          onConfirm={() => {
            setReturnLog(prev => [{ id: `RTN-2026-${String(Date.now()).slice(-4)}`, type: "retail", date: "13 Jun 2026", customer: "Smt. Meenakshi", originalSaleId: "PADMA-L1-004", reason: returnReasons.find(r => r.id === reason)?.label ?? reason ?? "Other", amount: "₹8,500" }, ...prev]);
            setStep("success");
          }}
        />
      </div>
    );
  }

  // ── WHOLESALE STEPS ──
  return (
    <div style={{ paddingBottom: 32 }}>
      <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
      <ProcessReturnWholesaleFlow
        step={step as 1 | 2}
        setStep={setStep}
        wsVendor={wsVendor}
        setWsVendor={setWsVendor}
        wsDesign={wsDesign}
        setWsDesign={setWsDesign}
        wsColor={wsColor}
        setWsColor={setWsColor}
        wsType={wsType}
        setWsType={setWsType}
        wsWeight={wsWeight}
        setWsWeight={setWsWeight}
        wsPrice={wsPrice}
        setWsPrice={setWsPrice}
        wsReason={wsReason}
        setWsReason={setWsReason}
        wsReasonOptions={wsReasonOptions}
        wsNewId={wsNewId}
        setWsNewId={setWsNewId}
        wsBarcodeGenerated={wsBarcodeGenerated}
        setWsBarcodeGenerated={setWsBarcodeGenerated}
        canSeePrices={canSeePrices}
        canProceedWsStep1={canProceedWsStep1}
        setReturnType={setReturnType}
        onConfirm={() => {
          setReturnLog(prev => [{ id: wsNewId, type: "wholesale", date: "13 Jun 2026", vendor: wsVendor, design: wsDesign, color: wsColor, weight: wsWeight ? `${wsWeight}g` : "—", wsReason: wsReason ?? "—", newSareeId: wsNewId }, ...prev]);
          setStep("success");
        }}
      />
    </div>
  );
}

export { ProcessReturn };
