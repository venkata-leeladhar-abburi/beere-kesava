import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../../../shared/api/customers';
import { inventoryApi } from '../../../../shared/api/inventory';
import { 
  IndianRupee, Plus, Wallet, CreditCard, Check,
} from 'lucide-react';
import { useRatesPricing } from "../../../pricing/contexts/RatesContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import { C, F, Card, Btn, Chip, useCanSeePrices, HeroHeader } from './theme';
import {
  Stepper, StepHeader, StepBody, FlowActions, SummaryPanel, OptionCard,
  ConsequenceNote, ACCENT_SALE, type FlowStep, type SummaryRow,
} from './flow-kit';
import { NewSaleBillModal } from './NewSaleBillModal';
import { NewSaleSuccessView } from './NewSaleSuccessView';
import { CustomerSelectStep, Customer } from './CustomerSelectStep';
import { ScanSareeStep } from './ScanSareeStep';
import { ApiError } from "../../../../shared/api/client";
import { scanApi } from "../../../../shared/api/scan";
import { salesApi } from "../../../../shared/api/sales";
import { Button, Input } from '../../../../shared/ui/primitives';
import { rupees, formatMoney } from "@/lib/domain/money";

export function NewSaleFlow() {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const { getSareeTypeByCode } = useRatesPricing();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
  const [sareeFound, setSareeFound] = useState(false);
  const [manualId, setManualId] = useState("");
  const [payment, setPayment] = useState<"cash" | "upi" | "card" | "other" | null>(null);
  const [payRef, setPayRef] = useState("");
  const [phone, setPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [saree, setSaree] = useState({ id: "", design: "", name: "", type: "", typeCode: "", weight: "—", weaver: "" });
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSareeList, setShowSareeList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const originalPrice = Number(getSareeTypeByCode(saree.typeCode)?.retail ?? 0);
  const [soldPrice, setSoldPrice] = useState(originalPrice);
  const priceDiscount = originalPrice - soldPrice;
  const fmtPrice = (n: number) => formatMoney(rupees(n));

  const { data: customersRes } = useQuery({
    queryKey: ["customers-list-newsale", "RETAIL"],
    // Counter sales are always to a retail customer — wholesale accounts are
    // handled through Bulk Orders, not this flow.
    queryFn: () => customersApi.list(100, "RETAIL"),
  });

  const prevCustomers: Customer[] = useMemo(() => {
    return (customersRes?.items ?? []).map(c => {
      const parts = c.name.split(" ").filter(Boolean);
      const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : c.name.slice(0, 2).toUpperCase();
      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? "—",
        purchases: c.totalPurchases,
        total: formatMoney(rupees(c.totalSpend)),
        lastPurchase: new Date(c.lastPurchaseDate ?? c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        initials,
      };
    });
  }, [customersRes]);

  const filteredCustomers = custSearch.length >= 2
    ? prevCustomers.filter(c =>
      c.phone.replace(/\s/g, "").includes(custSearch.replace(/\s/g, "")) ||
      c.name.toLowerCase().includes(custSearch.toLowerCase())
    )
    : prevCustomers;

  // Every QC-passed saree still sitting in shop stock — lets staff pick a
  // saree by browsing/searching instead of only scanning or typing an ID.
  const { data: inventoryRes } = useQuery({
    queryKey: ["inventory-list-newsale"],
    queryFn: () => inventoryApi.list(),
  });

  const availableSarees = useMemo(
    () => (inventoryRes ?? []).filter(item => item.status === "available"),
    [inventoryRes],
  );

  const filteredSarees = manualId.trim().length >= 2
    ? availableSarees.filter(s =>
      s.sareeId.toLowerCase().includes(manualId.trim().toLowerCase()) ||
      (s.designCode ?? "").toLowerCase().includes(manualId.trim().toLowerCase()) ||
      (s.weaverName ?? "").toLowerCase().includes(manualId.trim().toLowerCase())
    )
    : availableSarees;

  const handleScan = async (overrideId?: string) => {
    const id = (overrideId ?? manualId).trim();
    if (!id) {
      setScanError("Enter a saree ID to look it up, or scan its barcode with the camera.");
      return;
    }
    setScanError(null);
    try {
      const result = await scanApi.lookup(id);
      // A scanned/typed ID can belong to any saree ever produced — reject
      // anything not actually sellable (QC not passed, already dispatched,
      // already sold, or flagged for damage review) instead of letting
      // staff proceed to sell it again. Not gated on finishing — a saree
      // counts as in-stock the moment QC passes.
      if (result.saleEligibility !== "PASSED") {
        const reason = result.saleEligibility === "DISPATCHED" ? "already dispatched"
          : result.saleEligibility === "SOLD" ? "already sold"
          : result.saleEligibility === "DAMAGED_REVIEW_NEEDED" ? "flagged for damage review"
          : "has not passed QC yet";
        setScanError(`Saree ${id} is ${reason} — it can't be sold from the counter.`);
        return;
      }
      const typeCode = result.sareeType?.code ?? "";
      const nextSaree = {
        id: result.sareeId,
        design: result.design?.code ?? "—",
        name: result.design?.name ?? result.sareeType?.type ?? "—",
        type: result.sareeType ? `${result.sareeType.type} · ${result.sareeType.code}` : "—",
        typeCode,
        weight: "—",
        weaver: result.weaver?.name ?? (result.factoryLoom ? `Factory Loom ${result.factoryLoom.loomNumber}` : "—"),
      };
      setSaree(nextSaree);
      // The price Worker Staff entered for THIS specific saree at receipt
      // takes priority over the saree type's shared rate — falls back to
      // the type rate for a saree received before that field existed.
      setSoldPrice(result.sellingPrice ?? Number(getSareeTypeByCode(typeCode)?.retail ?? 0));
      setSareeFound(true);
      setShowSareeList(false);
    } catch (err) {
      setScanError(err instanceof ApiError ? err.message : "Could not find this saree.");
    }
  };

  const handleSelectSaree = (id: string) => {
    setManualId(id);
    handleScan(id);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setPhone(cust.phone);
    setCustSearch(cust.name);
    setShowCustomerList(false);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(true);
    setShowCustomerList(false);
    setCustName(""); setPhone(""); setCustAddress(""); setCustSearch("");
  };

  const resetSale = () => {
    setStep(1); setSareeFound(false); setManualId(""); setPayment(null); setPayRef("");
    setPhone(""); setCustName(""); setCustAddress("");
    setCustSearch(""); setSelectedCustomer(null); setIsEditingCustomer(false);
    setIsNewCustomer(false); setShowCustomerList(false); setSoldPrice(originalPrice);
    setShowSareeList(false);
  };

  const canProceedStep1 = selectedCustomer !== null || (isNewCustomer && custName.trim() !== "");

  if (showBill) {
    return (
      <NewSaleBillModal
        saree={saree}
        custName={custName}
        phone={phone}
        payment={payment}
        soldPrice={soldPrice}
        canSeePrices={canSeePrices}
        isMobile={isMobile}
        isTablet={isTablet}
        fmtPrice={fmtPrice}
        onClose={() => setShowBill(false)}
      />
    );
  }

  if (step === "success") {
    return (
      <NewSaleSuccessView
        saree={saree}
        custName={custName}
        payment={payment}
        soldPrice={soldPrice}
        canSeePrices={canSeePrices}
        fmtPrice={fmtPrice}
        onShowBill={() => setShowBill(true)}
        onResetSale={resetSale}
      />
    );
  }

  // Each completed step reads back what was chosen, so the operator never has
  // to step backwards just to remember who the customer was.
  const steps: FlowStep[] = [
    { label: "Customer",   summary: selectedCustomer?.name ?? (custName.trim() || undefined) },
    { label: "Scan Saree", summary: saree.id || undefined },
    { label: "Payment",    summary: payment ? payment.toUpperCase() : undefined },
    { label: "Confirm" },
  ];

  return (
    <div>
      {/* On mobile this flow is the whole screen and needs its own hero. On
          desktop it sits inside a card that already sits under the page hero,
          so a second one was pure duplication — that was the stray dark block
          inside the white card. */}
      {isMobile && (
        <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" desc="Record a sale at the shop counter" />
      )}

      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_SALE}
        onJump={n => setStep(n as 1 | 2 | 3 | 4)}
      />

      {/* ── Step 1 — Customer Details ── */}
      {step === 1 && (
        <CustomerSelectStep
          custSearch={custSearch}
          setCustSearch={setCustSearch}
          showCustomerList={showCustomerList}
          setShowCustomerList={setShowCustomerList}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          filteredCustomers={filteredCustomers}
          isEditingCustomer={isEditingCustomer}
          setIsEditingCustomer={setIsEditingCustomer}
          isNewCustomer={isNewCustomer}
          setIsNewCustomer={setIsNewCustomer}
          custName={custName}
          setCustName={setCustName}
          phone={phone}
          setPhone={setPhone}
          custAddress={custAddress}
          setCustAddress={setCustAddress}
          isMobile={isMobile}
          handleSelectCustomer={handleSelectCustomer}
          handleAddNew={handleAddNew}
          canProceedStep1={canProceedStep1}
          onNext={() => setStep(2)}
        />
      )}

      {/* ── Step 2 — Scan Saree ── */}
      {step === 2 && (
        <ScanSareeStep
          sareeFound={sareeFound}
          setSareeFound={setSareeFound}
          manualId={manualId}
          setManualId={setManualId}
          saree={saree}
          soldPrice={soldPrice}
          setSoldPrice={setSoldPrice}
          originalPrice={originalPrice}
          canSeePrices={canSeePrices}
          isMobile={isMobile}
          fmtPrice={fmtPrice}
          handleScan={handleScan}
          scanError={scanError}
          availableSarees={filteredSarees}
          showSareeList={showSareeList}
          setShowSareeList={setShowSareeList}
          handleSelectSaree={handleSelectSaree}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* ── Step 3 — Payment Method ── */}
      {step === 3 && (
        <>
          <StepBody>
            <StepHeader title="Payment Method" subtitle="How is the customer paying for this saree?" />
            <div role="radiogroup" aria-label="Payment method" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { id: "cash" as const, label: "Cash", sub: "Physical currency", icon: IndianRupee },
                { id: "upi" as const, label: "UPI", sub: "GPay, PhonePe, etc.", icon: Wallet },
                { id: "card" as const, label: "Card", sub: "Debit or credit", icon: CreditCard },
                { id: "other" as const, label: "Other", sub: "Cheque / transfer", icon: Plus },
              ].map(p => (
                <OptionCard
                  key={p.id}
                  name="payment-method"
                  icon={p.icon}
                  label={p.label}
                  sub={p.sub}
                  selected={payment === p.id}
                  onSelect={() => setPayment(p.id)}
                  accent={ACCENT_SALE}
                />
              ))}
            </div>

            {/* The reference field only exists for the methods that have one —
                showing it always would be four fields of dead space. */}
            {(payment === "upi" || payment === "card") && (
              <div style={{ maxWidth: 340 }}>
                <label htmlFor="pay-ref" style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
                  {payment === "upi" ? "UPI reference" : "Card last 4 digits"}
                  <span style={{ color: C.muted, fontWeight: 400 }}> (optional)</span>
                </label>
                <Input
                  id="pay-ref"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  maxLength={payment === "card" ? 4 : undefined}
                  placeholder={payment === "upi" ? "Transaction ID" : "e.g. 4872"}
                  size="lg"
                  className="w-full font-mono"
                />
              </div>
            )}
          </StepBody>

          <FlowActions
            accent={ACCENT_SALE}
            onBack={() => setStep(2)}
            primaryLabel="Next — Confirm"
            onPrimary={() => setStep(4)}
            primaryDisabled={!payment}
            hint="Choose a payment method to continue"
          />
        </>
      )}

      {/* ── Step 4 — Confirm Sale ── */}
      {step === 4 && (
        <>
          <StepBody>
            <StepHeader
              title="Review & confirm"
              subtitle="Check every line before generating the bill — a recorded sale can only be undone with a return."
            />
            <SummaryPanel
              title="Sale summary"
              accent={ACCENT_SALE}
              rows={([
                { label: "Saree ID", value: saree.id || "—", mono: true },
                { label: "Design", value: saree.name || "—" },
                { label: "Customer", value: custName || selectedCustomer?.name || "—" },
                { label: "Phone", value: phone ? `+91 ${phone}` : "—", mono: true },
                { label: "Payment", value: payment ? payment.toUpperCase() : "—", mono: true },
                ...(payRef ? [{ label: payment === "upi" ? "UPI reference" : "Card ending", value: payRef, mono: true }] : []),
              ] as SummaryRow[])}
              footer={canSeePrices ? (
                <div>
                  {soldPrice !== originalPrice && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Original price</span>
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted, textDecoration: "line-through" }}>{fmtPrice(originalPrice)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total payable</span>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 30, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(soldPrice)}</span>
                  </div>
                  {priceDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <Chip label={`Discount applied · ${fmtPrice(priceDiscount)}`} color="#845E04" bg="rgba(200,155,71,0.15)" />
                    </div>
                  )}
                </div>
              ) : undefined}
            />

            <ConsequenceNote tone="info">
              Confirming records the sale, removes this saree from shop inventory, and generates a bill you can print or send on WhatsApp.
            </ConsequenceNote>

            {submitError && (
              <div role="alert" style={{ marginTop: 16, fontFamily: F.u, fontSize: 14, color: "#AB3832" }}>{submitError}</div>
            )}
          </StepBody>

          <FlowActions
            accent={ACCENT_SALE}
            tone="confirm"
            backLabel="Edit details"
            onBack={() => setStep(3)}
            primaryIcon={Check}
            primaryLabel="Confirm sale — generate bill"
            primaryBusy={isSubmitting}
            onPrimary={async () => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              setSubmitError(null);
              try {
                // Every sale needs a real customerId so it actually shows up
                // in that customer's purchase history/lifetime spend — a new
                // walk-in customer gets a Customer record created first,
                // an existing one is reused as-is.
                const customerId = selectedCustomer
                  ? selectedCustomer.id
                  : (await customersApi.create({
                      name: custName.trim(),
                      phone: phone.trim() || undefined,
                      address: custAddress.trim() || undefined,
                      type: "RETAIL",
                    })).id;
                await salesApi.create({ sareeId: saree.id, channel: "RETAIL", amount: soldPrice, customerId });
                setStep("success");
              } catch (err) {
                setSubmitError(err instanceof ApiError ? err.message : "Failed to record sale — please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        </>
      )}

    </div>
  );
}
