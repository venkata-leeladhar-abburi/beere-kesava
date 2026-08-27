import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { salesApi, BackendSaleRecord } from "../../../../shared/api/sales";
import { 
  AlertTriangle, Palette, ThumbsDown, Scale, FileText, Building2, ShoppingBag, RotateCcw
} from 'lucide-react';
import { C, F, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
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
  // The real signed-in person — an admin working inside the Shop portal is
  // recorded as themselves, not as generic shop staff.
  const { user } = useAuth();
  const canSeePrices = useCanSeePrices();
  const { isMobile } = useResponsive();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");

  const { data: returnsRes, isLoading: returnsLoading, isError: returnsError, refetch } = useQuery({
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
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsPhotoUrl, setWsPhotoUrl] = useState<string | null>(null);

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
    setWsPhotoUrl(null);
  };

  const canProceedWsStep1 = wsVendor.trim() !== "" && wsWeight.trim() !== "" && wsReason !== null;

  const todayStr = new Date().toDateString();
  const todayReturnsCount = (returnsRes?.items ?? []).filter(r => new Date(r.returnDate).toDateString() === todayStr).length;
  const monthReturnsCount = returnsRes?.items?.length ?? 0;
  const monthRefundSum = (returnsRes?.items ?? []).reduce((sum, r) => sum + Number(r.refundAmount ?? 0), 0);

  const stats: PortalStat[] = [
    { label: "Returns today", value: todayReturnsCount, sub: "Processed today", icon: RotateCcw, highlight: true },
    { label: "This month returns", value: monthReturnsCount, sub: "Recorded returns", icon: RotateCcw },
    { label: "Eligible sarees", value: eligibleSales.length, sub: "Available for return", icon: ShoppingBag },
    ...(canSeePrices ? [{ label: "Total refund value", value: formatMoney(rupees(monthRefundSum)), sub: "Month refunds", icon: RotateCcw }] : []),
  ];

  // ── TYPE SELECTION ──
  if (step === "type") {
    return (
      <div style={{ paddingBottom: isMobile ? 110 : 32 }}>
        {isMobile ? (
          <>
            <PageHero
              eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
              title="Process Return"
              titleAccent="& Handle Customer Returns"
              description="Find the original sale by scanning the barcode, select the return reason, and confirm. Inventory is updated automatically."
              pills={[
                { text: "3-Step Process" },
                { text: "Auto Inventory Update" },
                { text: `${todayReturnsCount} Return Today Already` },
              ]}
            />
            <PortalStatsStrip stats={stats} />
          </>
        ) : (
          <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />
        )}

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

        {/* Return Process Guide on Mobile */}
        {isMobile && (
          <>
            <div style={{ margin: "24px 20px 0" }}>
              <div style={{ background: C.dark, borderRadius: 18, padding: "20px 22px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 14 }}>RETURN PROCESS</div>
                {[
                  { n: "1", title: "Find Original Sale", desc: "Scan the saree barcode or enter the Saree ID to find the original sale record" },
                  { n: "2", title: "Select Reason", desc: "Choose why the customer is returning — defective, wrong design, changed mind, etc." },
                  { n: "3", title: "Confirm Return", desc: "Review and confirm. Inventory +1, customer profile updated, admin notified" },
                ].map((s, i) => (
                  <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: i < 2 ? 16 : 0, paddingBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.crim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: "#FFF" }}>{s.n}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Returns Box on Mobile */}
            <div style={{ margin: "24px 20px 0" }}>
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.crim, marginBottom: 10 }}>Today's Returns</div>
                {todayReturnsCount > 0 && (returnsRes?.items ?? [])[0] ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <RotateCcw size={20} color={C.crim} />
                      </div>
                      <div>
                        <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg, marginBottom: 3 }}>{(returnsRes?.items ?? [])[0].sareeId}</div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>
                          Return Record{canSeePrices && (returnsRes?.items ?? [])[0].refundAmount ? ` · ${formatMoney(rupees(Number((returnsRes?.items ?? [])[0].refundAmount)))}` : ""}
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                          {(returnsRes?.items ?? [])[0].reason} · {new Date((returnsRes?.items ?? [])[0].returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 6, borderTop: `1px solid rgba(192,57,43,0.15)`, paddingTop: 12 }}>
                      Return Reference: {(returnsRes?.items ?? [])[0].returnRef}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, padding: "8px 0" }}>
                    No returns recorded today yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <ReturnHistorySection returnLog={returnLog} canSeePrices={canSeePrices} isLoading={returnsLoading} isError={returnsError} onRetry={() => void refetch()} />
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
          onBackToType={() => { setStep("type"); setReturnType(null); }}
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
                actorId: user?.id,
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
        setPhotoUrl={setWsPhotoUrl}
        wsError={wsError}
        // The piece has no prior record, so this registers the saree from the
        // details above under the tag id being attached, and books the return
        // against it — POST /sales/returns/untracked. The plain /sales/returns
        // endpoint cannot be used here: it requires a saree we already sold.
        onConfirm={async () => {
          setWsError(null);
          try {
            await salesApi.registerReturnedSaree({
              sareeId: wsNewId.trim(),
              sourceName: wsVendor.trim(),
              reason: wsReason ?? "Wholesale Return",
              weightG: Number(wsWeight) || 0,
              costPrice: wsPrice ? Number(wsPrice) : undefined,
              designCode: wsDesign.trim() || undefined,
              sareeType: wsType || undefined,
              color: wsColor.trim() || undefined,
              photoUrl: wsPhotoUrl ?? undefined,
              actorId: user?.id,
            });
            refetch();
            setStep("success");
          } catch (err) {
            setWsError(
              err instanceof Error
                ? `Could not record this return: ${err.message}`
                : "Could not record this return.",
            );
          }
        }}
      />
    </div>
  );
}

export { ProcessReturn };
