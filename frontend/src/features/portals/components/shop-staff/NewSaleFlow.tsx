import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../../../../shared/api/customers';
import { inventoryApi } from '../../../../shared/api/inventory';
import { 
  IndianRupee, Plus, Wallet, CreditCard, Check,
} from 'lucide-react';
import { useRatesPricing } from "@/features/pricing";
import { useResponsive } from "../../../../hooks/useResponsive";
import { C, F, Card, Chip, useCanSeePrices, ShopDesktopHero, SILK_BG } from './theme';
import {
  Stepper, StepHeader, StepBody, FlowActions, SummaryPanel, OptionCard,
  ConsequenceNote, ACCENT_SALE, type FlowStep, type SummaryRow,
} from './flow-kit';
import { NewSaleBillModal } from './NewSaleBillModal';
import { NewSaleSuccessView } from './NewSaleSuccessView';
import { CustomerSelectStep, Customer } from './CustomerSelectStep';
import { ScanSareeStep } from './ScanSareeStep';
import { cartTotal, cartOriginalTotal, type SaleLine } from './sale-cart';
import { ApiError } from "../../../../shared/api/client";
import { scanApi } from "../../../../shared/api/scan";
import { salesApi } from "../../../../shared/api/sales";
import { Input, CurrencyInput } from '../../../../shared/ui/primitives';
import { rupees, formatMoney } from "@/lib/domain/money";

export function NewSaleFlow() {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const { getSareeTypeByCode } = useRatesPricing();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
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

  // A counter sale is a basket, not a single piece — the customer can walk up
  // with several sarees and they all go on one bill.
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSareeList, setShowSareeList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = cartTotal(cart);
  const originalTotal = cartOriginalTotal(cart);
  const priceDiscount = originalTotal - total;
  const fmtPrice = (n: number) => formatMoney(rupees(n));

  const queryClient = useQueryClient();

  const { data: customersRes, isLoading: customersLoading } = useQuery({
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

  // What is actually on the shop floor — the sarees an admin dispatched to this
  // shop and that have not been sold yet. Lets staff pick by browsing/searching
  // instead of only scanning or typing an ID. Previously this read the factory
  // stock list, which offered the counter sarees that had never been sent here
  // (and hid the ones that had, since a dispatch removes a saree from that list).
  const { data: inventoryRes, isLoading: inventoryLoading } = useQuery({
    queryKey: ["shop-stock"],
    queryFn: () => inventoryApi.shopStock(),
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

  /**
   * Resolves one saree id to a basket line. Returns an error string instead of
   * throwing so a bulk add can report every rejected piece at once rather than
   * dying on the first one.
   */
  const resolveLine = async (rawId: string, existing: SaleLine[]): Promise<SaleLine | string> => {
    const id = rawId.trim();
    if (!id) return "Enter a saree ID to look it up, or scan its barcode with the camera.";
    if (existing.some(l => l.id.toLowerCase() === id.toLowerCase())) {
      return `${id} is already on this sale.`;
    }
    try {
      const result = await scanApi.lookup(id);
      // A scanned/typed ID can belong to any saree ever produced — reject
      // anything not actually sellable (QC not passed, already dispatched,
      // already sold, or flagged for damage review) instead of letting
      // staff proceed to sell it again. Not gated on finishing — a saree
      // counts as in-stock the moment QC passes.
      if (result.saleEligibility !== "PASSED") {
        if (result.saleEligibility === "NOT_IN_SHOP") {
          return `Saree ${id} hasn't been dispatched to the shop yet — ask an admin to send it over before selling it.`;
        }
        const reason = result.saleEligibility === "WHOLESALE_DISPATCHED" ? "already dispatched to a wholesale customer"
          : result.saleEligibility === "SOLD" ? "already sold"
          : result.saleEligibility === "DAMAGED_REVIEW_NEEDED" ? "flagged for damage review"
          : "has not passed QC yet";
        return `Saree ${id} is ${reason} — it can't be sold from the counter.`;
      }
      const typeCode = result.sareeType?.code ?? "";
      // The price Worker Staff entered for THIS specific saree at receipt
      // takes priority over the saree type's shared rate — falls back to
      // the type rate for a saree received before that field existed.
      const price = result.sellingPrice ?? Number(getSareeTypeByCode(typeCode)?.retail ?? 0);
      return {
        id: result.sareeId,
        design: result.design?.code ?? "—",
        name: result.design?.name ?? result.sareeType?.type ?? "—",
        type: result.sareeType ? `${result.sareeType.type} · ${result.sareeType.code}` : "—",
        typeCode,
        weight: "—",
        weaver: result.weaver?.name ?? (result.factoryLoom ? `Factory Loom ${result.factoryLoom.loomNumber}` : "—"),
        originalPrice: price,
        soldPrice: price,
      };
    } catch (err) {
      return err instanceof ApiError ? err.message : `Could not find saree ${id}.`;
    }
  };

  /** Scan/type path — one saree at a time, and the field clears for the next. */
  const handleScan = async (overrideId?: string) => {
    setScanError(null);
    const line = await resolveLine(overrideId ?? manualId, cart);
    if (typeof line === "string") { setScanError(line); return; }
    setCart(prev => [...prev, line]);
    setManualId("");
  };

  /** Stock-table path — every ticked saree is added in one pass. */
  const handleAddSarees = async (ids: string[]) => {
    setScanError(null);
    const added: SaleLine[] = [];
    const errors: string[] = [];
    for (const id of ids) {
      const line = await resolveLine(id, [...cart, ...added]);
      if (typeof line === "string") errors.push(line); else added.push(line);
    }
    if (added.length > 0) setCart(prev => [...prev, ...added]);
    if (errors.length > 0) setScanError(errors.join(" "));
  };

  const removeLine = (id: string) => setCart(prev => prev.filter(l => l.id !== id));

  const setLinePrice = (id: string, price: number) =>
    setCart(prev => prev.map(l => (l.id === id ? { ...l, soldPrice: price } : l)));

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
    setStep(1); setCart([]); setManualId(""); setPayment(null); setPayRef("");
    setPhone(""); setCustName(""); setCustAddress("");
    setCustSearch(""); setSelectedCustomer(null); setIsEditingCustomer(false);
    setIsNewCustomer(false); setShowCustomerList(false);
    setShowSareeList(false); setScanError(null); setSubmitError(null);
  };

  const canProceedStep1 = selectedCustomer !== null || (isNewCustomer && custName.trim() !== "");

  if (showBill) {
    return (
      <NewSaleBillModal
        lines={cart}
        custName={custName}
        phone={phone}
        payment={payment}
        total={total}
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
        lines={cart}
        custName={custName}
        payment={payment}
        total={total}
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
    { label: "Scan Saree", summary: cart.length === 1 ? cart[0].id : cart.length > 1 ? `${cart.length} sarees` : undefined },
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
        <ShopDesktopHero
          bp="tablet"
          breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · NEW SALE"
          titleMain="New Retail Sale"
          titleSub="& Record at Counter"
          description="Scan the saree barcode, record the payment method, enter customer details, and generate a bill — all in one flow."
          pills={[{ text: "4-Step Process" }, { text: "Auto Bill Generation" }, { text: "Customer Auto-Fill" }]}
          bgUrl={SILK_BG}
        />
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
          customersLoading={customersLoading}
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
          cart={cart}
          manualId={manualId}
          setManualId={setManualId}
          isMobile={isMobile}
          handleScan={handleScan}
          handleAddSarees={handleAddSarees}
          removeLine={removeLine}
          scanError={scanError}
          availableSarees={filteredSarees}
          sareesLoading={inventoryLoading}
          showSareeList={showSareeList}
          setShowSareeList={setShowSareeList}
          isFiltered={manualId.trim().length >= 2}
          onClearFilters={() => setManualId("")}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* ── Step 3 — Payment Method ── */}
      {step === 3 && (
        <>
          <StepBody>
            <StepHeader
              title="Price & payment"
              subtitle="Set what each saree is actually selling for, then record how the customer is paying."
            />

            {/* ── Per-saree pricing ── the price lives here, not at the scan
                step, so the operator sets every price and sees the basket
                total in one place before choosing a payment method. */}
            {canSeePrices && (
              <Card style={{ marginBottom: 22, overflow: "hidden" }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)" }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                    {cart.length} saree{cart.length !== 1 ? "s" : ""} · set selling price
                  </span>
                </div>
                {cart.map((l, i) => (
                  <div
                    key={l.id}
                    style={{
                      display: isMobile ? "block" : "flex", alignItems: "center", gap: 16,
                      padding: "14px 16px",
                      borderBottom: i < cart.length - 1 ? `1px solid ${C.bdr}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{l.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {l.name}{l.design && l.design !== "—" ? ` · ${l.design}` : ""}
                      </div>
                    </div>
                    <div style={{ width: isMobile ? "100%" : 200, flexShrink: 0, marginTop: isMobile ? 10 : 0 }}>
                      <label htmlFor={`price-${l.id}`} className="sr-only">Selling price for {l.id}</label>
                      <CurrencyInput
                        id={`price-${l.id}`}
                        value={l.soldPrice}
                        onValueChange={v => setLinePrice(l.id, v === "" ? 0 : v)}
                        size="lg"
                        className="w-full font-['Plus_Jakarta_Sans'] text-xl font-bold"
                      />
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 6 }}>
                        Default: {fmtPrice(l.originalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total</span>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 26, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(total)}</span>
                </div>
              </Card>
            )}

            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 12 }}>
              How is the customer paying?
            </div>
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
              <div className="max-w-[340px]">
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
                { label: "Customer", value: custName || selectedCustomer?.name || "—" },
                { label: "Phone", value: phone ? `+91 ${phone}` : "—", mono: true },
                { label: "Sarees", value: `${cart.length} piece${cart.length !== 1 ? "s" : ""}` },
                { label: "Payment", value: payment ? payment.toUpperCase() : "—", mono: true },
                ...(payRef ? [{ label: payment === "upi" ? "UPI reference" : "Card ending", value: payRef, mono: true }] : []),
              ] as SummaryRow[])}
              footer={
                <div>
                  {/* Every piece on the bill, itemised — on a multi-saree sale
                      a single total is not enough to check against. */}
                  {cart.map(l => (
                    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, minWidth: 0 }}>
                        <span style={{ fontFamily: F.m, color: C.burg }}>{l.id}</span>
                        <span style={{ color: C.muted }}> · {l.name}</span>
                      </span>
                      {canSeePrices && (
                        <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtPrice(l.soldPrice)}</span>
                      )}
                    </div>
                  ))}
                  {canSeePrices && (
                    <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginTop: 6 }}>
                      {priceDiscount !== 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Original total</span>
                          <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted, textDecoration: "line-through" }}>{fmtPrice(originalTotal)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total payable</span>
                        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 30, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(total)}</span>
                      </div>
                      {priceDiscount > 0 && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                          <Chip label={`Discount applied · ${fmtPrice(priceDiscount)}`} color="#845E04" bg="rgba(200,155,71,0.15)" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
            />

            <ConsequenceNote tone="info">
              Confirming records the sale, removes {cart.length === 1 ? "this saree" : `these ${cart.length} sarees`} from shop inventory, and generates a bill you can print or send on WhatsApp.
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
            primaryLabel={cart.length > 1 ? `Confirm sale — ${cart.length} sarees` : "Confirm sale — generate bill"}
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
                // The backend records one SaleRecord per saree, so a basket
                // is submitted line by line. Sequential, not parallel: each
                // call mutates that saree's inventory status, and a partial
                // failure has to name exactly which pieces did go through.
                const recorded: string[] = [];
                try {
                  for (const line of cart) {
                    await salesApi.create({ sareeId: line.id, channel: "RETAIL", amount: line.soldPrice, customerId });
                    recorded.push(line.id);
                  }
                } catch (err) {
                  if (recorded.length > 0) {
                    setCart(prev => prev.filter(l => !recorded.includes(l.id)));
                    throw new Error(
                      `Recorded ${recorded.length} of ${cart.length} sarees (${recorded.join(", ")}). ` +
                      `The rest are still on this sale — try confirming again.`,
                    );
                  }
                  throw err;
                }
                // Sold sarees drop out of shop stock — refresh it so the
                // Inventory tab and the next sale's picker agree with the bill
                // that was just raised.
                void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
                setStep("success");
              } catch (err) {
                setSubmitError(
                  err instanceof ApiError ? err.message
                    : err instanceof Error ? err.message
                    : "Failed to record sale — please try again.",
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        </>
      )}

      {/* On mobile screen, render How It Works & After Sale cards */}
      {isMobile && typeof step === "number" && (
        <div style={{ margin: "32px 20px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* How It Works */}
          <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>HOW IT WORKS</div>
            {[
              { n: "1", title: "Scan Saree", desc: "Scan the barcode tag on the saree to auto-fill all details" },
              { n: "2", title: "Payment Method", desc: "Select Cash, UPI, Card, or Other" },
              { n: "3", title: "Customer Details", desc: "Search by phone — auto-fills for returning customers" },
              { n: "4", title: "Confirm & Bill", desc: "Review summary and generate the bill" },
            ].map((s, i) => (
              <div key={s.n} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 18 : 0, paddingBottom: i < 3 ? 18 : 0, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.dark }}>{s.n}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* After Sale */}
          <div style={{ background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 10 }}>After Sale</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>A bill is generated automatically. Print it or send via WhatsApp to the customer. The sale is recorded and inventory updated.</div>
          </div>
        </div>
      )}

    </div>
  );
}
