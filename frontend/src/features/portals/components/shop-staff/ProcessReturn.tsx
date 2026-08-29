import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi, BackendSaleRecord } from "../../../../shared/api/sales";
import { customersApi } from "../../../../shared/api/customers";
import { ratesApi } from "../../../../shared/api/rates";
import { usePrintSareeTags, type SareeTagData } from "@/features/weavers";
import { 
  AlertTriangle, Palette, ThumbsDown, Scale, FileText, Building2, ShoppingBag, RotateCcw
} from 'lucide-react';
import { C, F, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
import { ProcessReturnHeader, ReturnHistorySection, ReturnRecord } from './ProcessReturnHeaderHistory';
import { RetailReturnSuccessView, WholesaleReturnSuccessView, type RetailReturnResult } from './ProcessReturnSuccessView';
import { ProcessReturnRetailFlow } from './ProcessReturnRetailFlow';
import { ProcessReturnWholesaleFlow } from './ProcessReturnWholesaleFlow';
import { ProcessReturnWholesaleConsignment } from './ProcessReturnWholesaleConsignment';
import { emptyDraft, toItem, type WholesaleReturnDraft } from './wholesale-return-draft';
import type { WholesaleReturnResult } from './ProcessReturnSuccessView';
import { Button } from "../../../../shared/ui/primitives";
import { useResponsive } from "../../../../hooks/useResponsive";
import { StepHeader, StepBody } from "./flow-kit";
import { rupees, formatMoney } from "@/lib/domain/money";

type MyReturnType = "retail" | "wholesale" | "damage" | null;
type ReturnStep = "type" | 1 | 2 | 3 | "success";

function ProcessReturn({ onBack }: { onBack: () => void }) {
  const canSeePrices = useCanSeePrices();
  const { isMobile } = useResponsive();
  const queryClient = useQueryClient();
  const printTags = usePrintSareeTags();
  const [returnType, setReturnType] = useState<MyReturnType>(null);
  const [step, setStep] = useState<ReturnStep>("type");

  const { data: returnsRes, isLoading: returnsLoading, isError: returnsError, refetch } = useQuery({
    queryKey: ["returns-list-processreturn"],
    queryFn: () => salesApi.listReturns(100),
  });

  // The real sales ledger — "Find the original sale" looks a scanned/typed/
  // browsed sareeId up in here rather than accepting anything the operator
  // types.
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-processreturn"],
    queryFn: () => salesApi.list(200),
  });
  const allSales = useMemo(() => salesRes?.items ?? [], [salesRes]);

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

  // Return History reads the categorised stock list rather than the raw
  // ledger: only that knows whether a return was a counter return or a
  // wholesale consignment, and who it actually came back from. The raw list
  // has no customer field at all, so labelling every row "retail" and
  // "Walk-in Customer" — as this once did — was fiction.
  const { data: returnStock } = useQuery({
    queryKey: ["return-stock"],
    queryFn: () => salesApi.listReturnStock(),
  });

  const returnLog: ReturnRecord[] = (returnStock ?? []).map(r => ({
    id: r.returnRef,
    type: r.category,
    date: new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    customer: r.category === "retail" ? r.source ?? "Walk-in Customer" : undefined,
    vendor: r.category === "wholesale" ? r.source ?? "—" : undefined,
    originalSaleId: r.saleRef ?? r.sareeId,
    reason: r.reason ?? "—",
    color: r.color ?? undefined,
    weight: r.weightG != null ? `${r.weightG} g` : undefined,
    amount: formatMoney(rupees(r.refundAmount ?? 0)),
  }));

  // Retail state — a return is one customer bringing back one OR MORE of the
  // pieces they bought, so the selection is a list, not a single sale.
  const [selectedSales, setSelectedSales] = useState<BackendSaleRecord[]>([]);
  const [findError, setFindError] = useState<string | null>(null);
  const [showSaleList, setShowSaleList] = useState(false);
  const [retailManualId, setRetailManualId] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [retailError, setRetailError] = useState<string | null>(null);
  const [retailSubmitting, setRetailSubmitting] = useState(false);
  const [retailResults, setRetailResults] = useState<RetailReturnResult[]>([]);
  const [retailCustomerName, setRetailCustomerName] = useState("");
  const [retailReasonLabel, setRetailReasonLabel] = useState("");

  /** Identity of the customer a sale belongs to, used to keep one return to
   *  one customer. Falls back to the name for a legacy row with no id. */
  const customerKeyOf = (s: BackendSaleRecord): string =>
    s.customer?.id ?? s.customerId ?? `name:${s.customer?.name ?? "Walk-in Customer"}`;

  /** Adds a saree to the return, or removes it if it is already on. Rejects a
   *  piece belonging to a different customer rather than silently mixing two
   *  customers' refunds onto one return. */
  const toggleSale = (sareeId: string) => {
    setFindError(null);
    setSelectedSales(prev => {
      if (prev.some(s => s.sareeId === sareeId)) {
        return prev.filter(s => s.sareeId !== sareeId);
      }
      const sale = eligibleSales.find(s => s.sareeId === sareeId);
      if (!sale) {
        setFindError(
          returnedSareeIds.has(sareeId)
            ? `Saree ${sareeId} has already been returned.`
            : `No retail sale found for saree ${sareeId}.`,
        );
        return prev;
      }
      if (prev.length > 0 && customerKeyOf(prev[0]) !== customerKeyOf(sale)) {
        setFindError(
          `${sareeId} was sold to ${sale.customer?.name ?? "another customer"}, not ` +
          `${prev[0].customer?.name ?? "this customer"}. One return covers one customer — ` +
          `finish this one first, then start another.`,
        );
        return prev;
      }
      return [...prev, sale];
    });
  };

  const handleFindSale = (overrideId?: string) => {
    const id = (overrideId ?? retailManualId).trim();
    if (!id) {
      setFindError("Enter a saree ID to look it up, or scan its barcode with the camera.");
      return;
    }
    if (selectedSales.some(s => s.sareeId === id)) {
      setFindError(`${id} is already on this return.`);
      return;
    }
    toggleSale(id);
    setRetailManualId("");
  };

  // Wholesale returns come in two shapes, and they need different screens:
  //   "consignment" — a buyer sending back part of something WE dispatched.
  //                   We know the sarees and the price, so nothing is typed.
  //   "untracked"   — a piece with no record here at all. Everything about it
  //                   has to be described by hand, under a new tag.
  // The first is the normal case, so it is the default.
  const [wsMode, setWsMode] = useState<"consignment" | "untracked">("consignment");
  const [wsVendorId, setWsVendorId] = useState("");
  const [wsVendorName, setWsVendorName] = useState("");
  const [wsDrafts, setWsDrafts] = useState<WholesaleReturnDraft[]>(() => [emptyDraft()]);
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsSubmitting, setWsSubmitting] = useState(false);
  const [wsResults, setWsResults] = useState<WholesaleReturnResult[]>([]);
  // The success screen prints tags after the drafts have served their purpose,
  // so it keeps its own snapshot of them.
  const [confirmedTags, setConfirmedTags] = useState<SareeTagData[]>([]);

  // The vendor picker lists wholesale customers, and the saree-type picker
  // lists the configured rates — the backend validates against exactly these,
  // so a hardcoded list here would be rejected on confirm.
  const { data: wholesaleCustomers, isLoading: vendorsLoading } = useQuery({
    queryKey: ["wholesale-customers-processreturn"],
    queryFn: () => customersApi.list(100, "WHOLESALE"),
  });
  const vendors = useMemo(
    () => (wholesaleCustomers?.items ?? []).map(c => ({ id: c.id, name: c.name, city: c.city })),
    [wholesaleCustomers],
  );

  const { data: ratesRes } = useQuery({
    queryKey: ["saree-types-processreturn"],
    queryFn: () => ratesApi.list(100),
  });
  const sareeTypes = useMemo(
    () => (ratesRes?.items ?? []).map(r => ({ code: r.code, name: r.type, retailPrice: Number(r.retailPrice) })),
    [ratesRes],
  );
  const sareeTypeByCode = useMemo(() => new Map(sareeTypes.map(t => [t.code, t])), [sareeTypes]);

  /** The drafted pieces as printable tags — used before and after confirming. */
  const draftTags = (): SareeTagData[] => wsDrafts
    .filter(d => d.sareeId.trim())
    .map(d => {
      const t = sareeTypeByCode.get(d.sareeType);
      return {
        sareeId: d.sareeId.trim(),
        batchId: null,
        designCode: null,
        sareeTypeCode: t?.code ?? null,
        sareeTypeName: t?.name ?? null,
        color: d.color.trim() || null,
        retailPrice: t?.retailPrice ?? null,
      };
    });

  const returnReasons = [
    { id: "defective", label: "Defective", sub: "Damaged or faulty item", Icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
    { id: "wrong", label: "Wrong Design", sub: "Doesn't match selection", Icon: Palette, color: "#7A4F2F", bg: "rgba(122,79,47,0.08)" },
    { id: "mind", label: "Changed Mind", sub: "Customer preference", Icon: ThumbsDown, color: C.burg, bg: "rgba(110,15,45,0.08)" },
    { id: "weight", label: "Size / Weight", sub: "Doesn't meet expectations", Icon: Scale, color: C.green, bg: "rgba(30,102,64,0.08)" },
    { id: "other", label: "Other Reason", sub: "Describe in notes", Icon: FileText, color: C.muted, bg: "rgba(139,112,96,0.08)" },
  ];

  const resetReturn = () => {
    setReturnType(null); setStep("type");
    setSelectedSales([]); setFindError(null); setShowSaleList(false);
    setRetailManualId(""); setReason(null); setOtherReason(""); setRetailError(null);
    setRetailResults([]); setRetailCustomerName(""); setRetailReasonLabel("");
    setWsMode("consignment");
    setWsVendorId(""); setWsVendorName(""); setWsDrafts([emptyDraft()]);
    setWsError(null); setWsResults([]); setConfirmedTags([]);
  };

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
              description="Find the original sale by scanning the barcode, select the return reason, and confirm. Returned sarees are held in Shop Inventory until you send them back on sale."
              pills={[
                { text: "3-Step Process" },
                { text: "Checked Before Restocking" },
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
                id: "retail" as const, Icon: ShoppingBag, accent: C.burg, soft: "rgba(110,15,45,0.08)",
                title: "Retail Return",
                desc: "A customer is bringing back a saree they bought here.",
                need: "Needs the saree barcode or the original bill",
              },
              {
                id: "wholesale" as const, Icon: Building2, accent: C.gold, soft: "rgba(200,155,71,0.14)",
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
                  className="h-full flex-col items-start justify-start gap-4 whitespace-normal rounded-xl border border-[rgba(200,155,71,0.4)] bg-white p-6 text-left transition-all hover:border-[#6E0F2D] hover:bg-[#F8F4F0]"
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
                  { n: "3", title: "Confirm Return", desc: "Review and confirm. The saree is held under Returns in Shop Inventory until you send it back into sellable stock" },
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
        <RetailReturnSuccessView
          results={retailResults}
          customerName={retailCustomerName || "Walk-in Customer"}
          reason={retailReasonLabel || "—"}
          canSeePrices={canSeePrices}
          resetReturn={resetReturn}
          onBack={onBack}
        />
      </div>
    );
  }

  // ── WHOLESALE SUCCESS ──
  if (step === "success" && returnType === "wholesale") {
    return (
      <div style={{ paddingBottom: 32 }}>
        {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}
        <WholesaleReturnSuccessView
          vendorName={wsVendorName}
          results={wsResults}
          onPrintTags={() => printTags(confirmedTags)}
          resetReturn={resetReturn}
          onBack={onBack}
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
          selectedSales={selectedSales}
          toggleSale={toggleSale}
          clearSelection={() => { setSelectedSales([]); setFindError(null); }}
          findError={findError}
          retailManualId={retailManualId}
          setRetailManualId={setRetailManualId}
          handleFindSale={handleFindSale}
          availableSales={eligibleSales}
          sareeTypes={sareeTypes}
          showSaleList={showSaleList}
          setShowSaleList={setShowSaleList}
          reason={reason}
          setReason={setReason}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          returnReasons={returnReasons}
          submitting={retailSubmitting}
          submitError={retailError}
          onConfirm={async () => {
            if (selectedSales.length === 0 || retailSubmitting) return;
            const label = returnReasons.find(r => r.id === reason)?.label ?? "Other";
            const fullReason = reason === "other" && otherReason.trim()
              ? `${label} — ${otherReason.trim()}`
              : label;
            const customerName = selectedSales[0].customer?.name ?? "Walk-in Customer";
            setRetailSubmitting(true);
            setRetailError(null);
            // One ReturnRecord per saree, written one after another: each call
            // mutates that saree's status, and a partial failure has to name
            // exactly which pieces did go through.
            const recorded: RetailReturnResult[] = [];
            try {
              for (const sale of selectedSales) {
                // restocked stays false on purpose: the piece is held under
                // "Retail returns" in Shop Inventory until someone inspects it
                // and explicitly sends it back into sellable stock.
                const record = await salesApi.createReturn({
                  sareeId: sale.sareeId,
                  reason: fullReason,
                  refundAmount: Number(sale.amount),
                  restocked: false,
                });
                recorded.push({
                  sareeId: sale.sareeId,
                  returnRef: record.returnRef,
                  refundAmount: Number(sale.amount),
                });
              }
              setRetailResults(recorded);
              setRetailCustomerName(customerName);
              setRetailReasonLabel(fullReason);
              await refetch();
              void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
              void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
              void queryClient.invalidateQueries({ queryKey: ["sales-list-processreturn"] });
              setStep("success");
            } catch (err) {
              const detail = err instanceof Error ? err.message : "unknown error";
              if (recorded.length > 0) {
                // Drop the ones that succeeded so pressing Confirm again does
                // not try to return them a second time.
                const doneIds = new Set(recorded.map(r => r.sareeId));
                setSelectedSales(prev => prev.filter(s => !doneIds.has(s.sareeId)));
                setRetailError(
                  `Recorded ${recorded.length} of ${recorded.length + selectedSales.length - recorded.length} returns ` +
                  `(${recorded.map(r => r.sareeId).join(", ")}). The rest are still on this return — ${detail}`,
                );
                void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
                void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
              } else {
                setRetailError(`Could not record this return: ${detail}`);
              }
            } finally {
              setRetailSubmitting(false);
            }
          }}
        />
      </div>
    );
  }

  // ── WHOLESALE STEPS ──
  return (
    <div style={{ paddingBottom: 32 }}>
      {isMobile && <ProcessReturnHeader step={step} onBack={onBack} setStep={setStep} setReturnType={setReturnType} />}

      {/* Which of the two wholesale paths this is. Offered as a switch rather
          than a separate entry on the return-type screen, because the operator
          often does not know which one applies until they have looked the
          buyer up. */}
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 20px 0" }}>
        <div role="tablist" aria-label="Wholesale return path" style={{
          display: "inline-flex", gap: 4, padding: 4, borderRadius: 999,
          background: "rgba(110,15,45,0.06)", border: "1px solid rgba(110,15,45,0.20)",
          maxWidth: "100%", overflowX: "auto" as const,
        }}>
          {([
            { key: "consignment" as const, label: "From a consignment we sent" },
            { key: "untracked" as const, label: "Not in our records" },
          ]).map(m => {
            const on = wsMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => { setWsMode(m.key); setStep(1); }}
                style={{
                  padding: "7px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                  background: on ? C.burg : "transparent",
                  color: on ? "#FFFDF9" : C.muted,
                  fontFamily: F.u, fontSize: 13, fontWeight: 700,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {wsMode === "consignment" ? (
        <ProcessReturnWholesaleConsignment
          vendors={vendors}
          vendorsLoading={vendorsLoading}
          onBackToType={() => { setStep("type"); setReturnType(null); }}
          onDone={(vendorName, results) => {
            setWsVendorName(vendorName);
            setWsResults(results.map(r => ({
              sareeId: r.sareeId,
              returnRef: r.returnRef,
              sareeTypeLabel: r.sareeTypeLabel,
              color: null,
              weight: "",
            })));
            // These pieces already carry their own printed tags — they went out
            // on them — so there is nothing new to print here.
            setConfirmedTags([]);
            void refetch();
            void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
            void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
            setStep("success");
          }}
        />
      ) : (
      <ProcessReturnWholesaleFlow
        step={step as 1 | 2}
        setStep={setStep}
        vendorId={wsVendorId}
        setVendorId={setWsVendorId}
        vendorName={wsVendorName}
        setVendorName={setWsVendorName}
        vendors={vendors}
        vendorsLoading={vendorsLoading}
        sareeTypes={sareeTypes}
        drafts={wsDrafts}
        setDrafts={setWsDrafts}
        canSeePrices={canSeePrices}
        wsError={wsError}
        submitting={wsSubmitting}
        setReturnType={setReturnType}
        onPrintTags={() => printTags(draftTags())}
        // These pieces have no prior record, so this registers each saree from
        // the details above under the tag id being attached and books a return
        // against it — POST /sales/returns/untracked/bulk, one transaction for
        // the whole consignment. The plain /sales/returns endpoint cannot be
        // used here: it requires a saree we already sold.
        onConfirm={async () => {
          if (wsSubmitting) return;
          setWsSubmitting(true);
          setWsError(null);
          const tags = draftTags();
          try {
            const records = await salesApi.registerReturnedSarees({
              sourceName: wsVendorName.trim(),
              sourceCustomerId: wsVendorId || undefined,
              items: wsDrafts.map(toItem),
            });
            // records come back in the same order as the items were sent, which
            // is the only reliable way to line them up for a no-tag draft: its
            // sareeId is blank until the server generates one.
            setWsResults(wsDrafts.map((d, i) => {
              const t = sareeTypeByCode.get(d.sareeType);
              const record = records[i];
              return {
                sareeId: record?.sareeId ?? d.sareeId.trim(),
                returnRef: record?.returnRef ?? "—",
                sareeTypeLabel: t ? `${t.code} · ${t.name}` : null,
                color: d.color.trim() || null,
                weight: d.weight,
              };
            }));
            setConfirmedTags(tags);
            await refetch();
            void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
            void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
            setStep("success");
          } catch (err) {
            setWsError(
              err instanceof Error
                ? `Could not record this return: ${err.message}`
                : "Could not record this return.",
            );
          } finally {
            setWsSubmitting(false);
          }
        }}
      />
      )}
    </div>
  );
}

export { ProcessReturn };
