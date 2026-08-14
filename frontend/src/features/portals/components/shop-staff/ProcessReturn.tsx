import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { salesApi, BackendSaleRecord } from "../../../../shared/api/sales";
import { 
  AlertTriangle, Palette, ThumbsDown, Scale, FileText, Building2, ShoppingBag
} from 'lucide-react';
import { C, F, useCanSeePrices } from './theme';
import { ProcessReturnHeader, ReturnHistorySection, ReturnRecord } from './ProcessReturnHeaderHistory';
import { RetailReturnSuccessView, WholesaleReturnSuccessView } from './ProcessReturnSuccessView';
import { ProcessReturnRetailFlow } from './ProcessReturnRetailFlow';
import { ProcessReturnWholesaleFlow } from './ProcessReturnWholesaleFlow';
import { Button } from "../../../../shared/ui/primitives";
import { useResponsive } from "../../../../hooks/useResponsive";
import { StepHeader, StepBody } from "./flow-kit";
import { rupees, formatMoney } from "@/lib/domain/money";

type MyReturnType = "retail" | "wholesale" | "damage" | null;
type ReturnStep = "type" | 1 | 2 | 3 | "success";

function ProcessReturn({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const { isMobile } = useResponsive();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");

  const { data: returnsRes, refetch } = useQuery({
    queryKey: ["returns-list-processreturn"],
    queryFn: () => salesApi.listReturns(100),
  });

  // The real sales ledger — "Find the original sale" looks a scanned/typed/
  // browsed sareeId up in here rather than accepting anything the operator
  // types, and "Return History" resolves the real buyer's name off it too
  // (ReturnRecord itself has no customer/name field, only sareeId).
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-processreturn"],
    queryFn: () => salesApi.list(200),
  });
  const allSales = useMemo(() => salesRes?.items ?? [], [salesRes]);
  const saleBySareeId = useMemo(() => new Map(allSales.map(s => [s.sareeId, s])), [allSales]);

  const returnedSareeIds = useMemo(
    () => new Set((returnsRes?.items ?? []).map(r => r.sareeId)),
    [returnsRes],
  );

  // Sold-but-not-yet-returned retail sarees — what "Find the original sale"
  // scans/types/browses against, and what's actually eligible to come back.
  const eligibleSales: BackendSaleRecord[] = useMemo(
    () => allSales.filter(s => s.channel === "RETAIL" && !returnedSareeIds.has(s.sareeId)),
    [allSales, returnedSareeIds],
  );

  const returnLog: ReturnRecord[] = (returnsRes?.items ?? []).map(r => ({
    id: r.returnRef,
    type: "retail",
    date: new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    customer: saleBySareeId.get(r.sareeId)?.customer?.name ?? "Walk-in Customer",
    // ReturnRecord has no saleRef FK — a return only ever references the
    // sareeId, so that's the closest thing to an "original sale" identifier.
    originalSaleId: r.sareeId,
    reason: r.reason ?? "—",
    amount: r.refundAmount ? formatMoney(rupees(Number(r.refundAmount))) : formatMoney(rupees(0)),
  }));

  // Retail state
  const [saleFound, setSaleFound] = useState(false);
  const [foundSale, setFoundSale] = useState<BackendSaleRecord | null>(null);
  const [findError, setFindError] = useState<string | null>(null);
  const [showSaleList, setShowSaleList] = useState(false);
  const [retailManualId, setRetailManualId] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  const handleFindSale = (overrideId?: string) => {
    const id = (overrideId ?? retailManualId).trim();
    if (!id) {
      setFindError("Enter a saree ID to look it up, or scan its barcode with the camera.");
      return;
    }
    const sale = eligibleSales.find(s => s.sareeId === id);
    if (!sale) {
      const alreadyReturned = returnedSareeIds.has(id);
      setFindError(alreadyReturned
        ? `Saree ${id} has already been returned.`
        : `No retail sale found for saree ${id}.`);
      return;
    }
    setFindError(null);
    setFoundSale(sale);
    setRetailManualId(id);
    setSaleFound(true);
    setShowSaleList(false);
  };

  const handleSelectSale = (id: string) => {
    handleFindSale(id);
  };

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
    { id: "mind", label: "Changed Mind", sub: "Customer preference", Icon: ThumbsDown, color: C.burg, bg: "rgba(110,15,45,0.08)" },
    { id: "weight", label: "Size / Weight", sub: "Doesn't meet expectations", Icon: Scale, color: C.green, bg: "rgba(30,102,64,0.08)" },
    { id: "other", label: "Other Reason", sub: "Describe in notes", Icon: FileText, color: C.muted, bg: "rgba(139,112,96,0.08)" },
  ];

  const wsReasonOptions = ["Defective", "Quality Issue", "Overstock", "Wrong Design", "Damaged in Transit", "Other"];

  const resetReturn = () => {
    setReturnType(null); setStep("type");
    setSaleFound(false); setFoundSale(null); setFindError(null); setShowSaleList(false);
    setRetailManualId(""); setReason(null); setOtherReason("");
    setWsVendor(""); setWsDesign(""); setWsColor(""); setWsType("Self Brocade");
    setWsWeight(""); setWsPrice(""); setWsReason(null); setWsNewId(""); setWsBarcodeGenerated(false);
  };

  const canProceedWsStep1 = wsVendor.trim() !== "" && wsWeight.trim() !== "" && wsReason !== null;

  // ── TYPE SELECTION ──
  if (step === "type") {
    return (
      <div style={{ paddingBottom: 32 }}>
        {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
        <StepBody>
          <StepHeader
            title="What kind of return is this?"
            subtitle="The two paths differ: a retail return matches an existing sale, a wholesale return creates a brand-new inventory record."
          />
          <div role="radiogroup" aria-label="Return type" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {[
              {
                id: "retail" as const, Icon: ShoppingBag, accent: "#AB3832", soft: "rgba(171,56,50,0.08)",
                title: "Retail Return",
                desc: "A customer is bringing back a saree they bought here.",
                need: "Needs the saree barcode or the original bill",
              },
              {
                id: "wholesale" as const, Icon: Building2, accent: "#845E04", soft: "rgba(200,155,71,0.14)",
                title: "Wholesale Return",
                desc: "A wholesale buyer is sending stock back to us.",
                need: "No barcode — a new tag is generated and the saree joins inventory",
              },
            ].map(o => (
              <div key={o.id} style={{ ["--rt" as string]: o.accent, ["--rt-soft" as string]: o.soft } as React.CSSProperties}>
                <Button
                  onClick={() => { setReturnType(o.id); setStep(1); }}
                  variant="tertiary"
                  fullWidth
                  role="radio"
                  aria-checked={false}
                  className="h-full flex-col items-start justify-start gap-4 whitespace-normal rounded-[18px] border border-[rgba(110,15,45,0.12)] bg-white p-6 text-left shadow-[0_2px_12px_rgba(74,6,27,0.06)] transition-all hover:border-[var(--rt)] hover:shadow-[0_8px_28px_rgba(74,6,27,0.12)]"
                >
                  <span style={{ width: 52, height: 52, borderRadius: 14, background: o.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <o.Icon size={26} color={o.accent} />
                  </span>
                  <span style={{ display: "block" }}>
                    <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 18, color: C.wine, marginBottom: 6, letterSpacing: "-0.01em" }}>{o.title}</span>
                    <span style={{ display: "block", fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 10 }}>{o.desc}</span>
                    <span style={{ display: "inline-block", fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.5, borderTop: `1px solid ${C.bdr}`, paddingTop: 10 }}>{o.need}</span>
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </StepBody>
        <ReturnHistorySection returnLog={returnLog} canSeePrices={canSeePrices} />
      </div>
    );
  }

  // ── RETAIL SUCCESS ──
  if (step === "success" && returnType === "retail") {
    return (
      <div style={{ paddingBottom: 32 }}>
        {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
        <RetailReturnSuccessView resetReturn={resetReturn} onBack={onBack} />
      </div>
    );
  }

  // ── WHOLESALE SUCCESS ──
  if (step === "success" && returnType === "wholesale") {
    return (
      <div style={{ paddingBottom: 32 }}>
        {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
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
        {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
        <ProcessReturnRetailFlow
          step={step as 1 | 2 | 3}
          setStep={setStep}
          saleFound={saleFound}
          setSaleFound={setSaleFound}
          foundSale={foundSale}
          findError={findError}
          retailManualId={retailManualId}
          setRetailManualId={setRetailManualId}
          handleFindSale={handleFindSale}
          availableSales={eligibleSales}
          showSaleList={showSaleList}
          setShowSaleList={setShowSaleList}
          handleSelectSale={handleSelectSale}
          reason={reason}
          setReason={setReason}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          returnReasons={returnReasons}
          canSeePrices={canSeePrices}
          onConfirm={async () => {
            if (!foundSale) return;
            try {
              await salesApi.createReturn({
                sareeId: foundSale.sareeId,
                reason: returnReasons.find(r => r.id === reason)?.label ?? (reason === "other" ? otherReason.trim() : reason) ?? "Other",
                refundAmount: Number(foundSale.amount),
                restocked: true,
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
      {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
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
              sareeId: wsNewId || "WS-RET-001",
              reason: wsReason ?? "Wholesale Return",
              refundAmount: Number(wsPrice) || 0,
              restocked: true,
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
