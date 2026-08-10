import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../shared/api/sales";
import { 
  AlertTriangle, Palette, ThumbsDown, Scale, FileText, Building2, ShoppingBag
} from 'lucide-react';
import { C, F, useCanSeePrices } from './theme';
import { ProcessReturnHeader, ReturnHistorySection, ReturnRecord } from './ProcessReturnHeaderHistory';
import { RetailReturnSuccessView, WholesaleReturnSuccessView } from './ProcessReturnSuccessView';
import { ProcessReturnRetailFlow } from './ProcessReturnRetailFlow';
import { ProcessReturnWholesaleFlow } from './ProcessReturnWholesaleFlow';
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

type MyReturnType = "retail" | "wholesale" | "damage" | null;
type ReturnStep = "type" | 1 | 2 | 3 | "success";

function ProcessReturn({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");

  const { data: returnsRes, refetch } = useQuery({
    queryKey: ["returns-list-processreturn"],
    queryFn: () => salesApi.listReturns(100),
  });

  const returnLog: ReturnRecord[] = (returnsRes?.items ?? []).map(r => ({
    id: r.ref,
    type: "retail",
    date: new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    customer: "Retail Customer",
    originalSaleId: r.saleRef ?? r.sareeId,
    reason: r.reason,
    amount: r.refundAmount ? formatMoney(rupees(Number(r.refundAmount))) : formatMoney(rupees(0)),
  }));

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
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Select Return Type</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Choose the type of return to process</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 20px 8px" }}>
          <Button
            onClick={() => { setReturnType("retail"); setStep(1); }}
            variant="ghost"
            className="h-auto p-5 rounded-2xl border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white flex-col items-start gap-3 shadow-[0_2px_12px_rgba(44,24,16,0.06)] text-left justify-start"
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={24} color={C.crim} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Retail Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Customer returning a saree they purchased from our shop. Has original receipt or saree barcode.</div>
            </div>
          </Button>
          <Button
            onClick={() => { setReturnType("wholesale"); setStep(1); }}
            variant="ghost"
            className="h-auto p-5 rounded-2xl border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white flex-col items-start gap-3 shadow-[0_2px_12px_rgba(44,24,16,0.06)] text-left justify-start"
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(196,146,58,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color={C.gold} />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Wholesale Return</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Saree returned from wholesale buyer. No barcode — a new one will be generated and saree added to inventory.</div>
            </div>
          </Button>
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
          onConfirm={async () => {
            try {
              await salesApi.createReturn({
                saleRef: retailManualId || "PADMA-L1-004",
                reason: returnReasons.find(r => r.id === reason)?.label ?? reason ?? "Other",
                refundAmount: 8500,
              });
              refetch();
            } catch (err) {
              console.error("Failed to record return", err);
            }
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
        onConfirm={async () => {
          try {
            await salesApi.createReturn({
              saleRef: wsNewId || "WS-RET-001",
              reason: wsReason ?? "Wholesale Return",
              refundAmount: Number(wsPrice) || 0,
            });
            refetch();
          } catch (err) {
            console.error("Failed to record wholesale return", err);
          }
          setStep("success");
        }}
      />
    </div>
  );
}

export { ProcessReturn };
