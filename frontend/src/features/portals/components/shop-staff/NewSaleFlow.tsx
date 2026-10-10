import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../../../../shared/api/customers";
import { IndianRupee, Plus, Wallet, CreditCard, Check } from "lucide-react";
import { useRatesPricing } from "@/features/pricing";
import { useResponsive } from "../../../../hooks/useResponsive";
import { C, F, Card, Chip, ShopDesktopHero, SILK_BG } from "./theme";
import {
  Stepper,
  StepHeader,
  StepBody,
  FlowActions,
  SummaryPanel,
  OptionCard,
  ConsequenceNote,
  ACCENT_SALE,
  type FlowStep,
  type SummaryRow,
} from "./flow-kit";
import { NewSaleBillModal } from "./NewSaleBillModal";
import { NewSaleSuccessView } from "./NewSaleSuccessView";
import { CustomerSelectStep, Customer, isPhoneEntryComplete } from "./CustomerSelectStep";
import { ScanSareeStep } from "./ScanSareeStep";
import {
  cartTotal,
  cartOriginalTotal,
  applyDiscount,
  discountLabel,
  billDiscountAmount,
  billDiscountLabel,
  allocateBillDiscount,
  allocateByWeight,
  gstBreakdown,
  gstIssue,
  normalizeGstin,
  toBillGst,
  NO_BILL_DISCOUNT,
  NO_GST,
  type SaleLine,
  type DiscountMode,
  type BillDiscount,
  type BillGst,
  type GstBreakdown,
} from "./sale-cart";
import { ApiError } from "../../../../shared/api/client";
import { scanApi } from "../../../../shared/api/scan";
import { salesApi } from "../../../../shared/api/sales";
import { Button, Input } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

export function NewSaleFlow() {
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
  // A discount on the whole bill, on top of any per-saree discounts.
  const [billDiscount, setBillDiscount] = useState<BillDiscount>(NO_BILL_DISCOUNT);
  // Optional GST on the whole bill, added on top after every discount.
  const [gst, setGst] = useState<BillGst>(NO_GST);
  // The shop's GSTIN as the server recorded it on the sale (copied from the
  // retail firm) — printed on the bill's letterhead when GST was charged.
  const [sellerGstin, setSellerGstin] = useState<string | undefined>(undefined);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSareeList, setShowSareeList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The backend writes one SaleRecord per saree, so a basket comes back as
  // several refs. The success screen needs all of them: they name the bill
  // the WhatsApp send re-reads its figures from.
  const [saleRefs, setSaleRefs] = useState<string[]>([]);

  // retail total → less per-saree discounts = subtotal → less bill discount
  // = taxable → plus GST (when charged) = total
  const originalTotal = cartOriginalTotal(cart);
  const subtotal = cartTotal(cart);
  const billOff = billDiscountAmount(subtotal, billDiscount);
  const taxable = subtotal - billOff;
  const tax = gstBreakdown(taxable, gst);
  const total = tax ? tax.total : taxable;
  const lineDiscount = originalTotal - subtotal;
  // GST is a tax on top, not a mark-up — the saving is measured before it.
  const priceDiscount = originalTotal - taxable;
  const billGst = tax ? toBillGst(tax, gst.gstin, sellerGstin) : undefined;
  const fmtPrice = (n: number) => formatMoney(rupees(n));

  const queryClient = useQueryClient();

  const { data: customersRes, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-list-newsale", "RETAIL"],
    // Counter sales are always to a retail customer — wholesale accounts are
    // handled through Bulk Orders, not this flow.
    queryFn: () => customersApi.list(100, "RETAIL"),
  });

  const prevCustomers: Customer[] = useMemo(() => {
    return (customersRes?.items ?? []).map((c) => {
      const parts = c.name.split(" ").filter(Boolean);
      const initials =
        parts.length >= 2
          ? `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
          : c.name.slice(0, 2).toUpperCase();
      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? "",
        purchases: c.totalPurchases,
        total: formatMoney(rupees(c.totalSpend)),
        lastPurchase: new Date(c.lastPurchaseDate ?? c.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        initials,
      };
    });
  }, [customersRes]);

  const filteredCustomers =
    custSearch.length >= 2
      ? prevCustomers.filter(
          (c) =>
            c.phone.replace(/\s/g, "").includes(custSearch.replace(/\s/g, "")) ||
            c.name.toLowerCase().includes(custSearch.toLowerCase())
        )
      : prevCustomers;

  // The stock picker is the admin All Sarees table (see ScanSareeStep), fed
  // by the SalesContext / FinishingContext queries plus the money-free
  // production catalog. After a sale every one of those that can report a
  // saree as sold is refetched, so the picker and the Inventory tab agree
  // with the bill that was just raised.
  const refreshStock = () => {
    for (const queryKey of [
      ["shop-stock"],
      ["inventory", "production-catalog"],
      ["backend-inventory-list"],
      ["backend-sales-list"],
    ])
      void queryClient.invalidateQueries({ queryKey });
  };

  /**
   * Resolves one saree id to a basket line. Returns an error string instead of
   * throwing so a bulk add can report every rejected piece at once rather than
   * dying on the first one.
   */
  const resolveLine = async (rawId: string, existing: SaleLine[]): Promise<SaleLine | string> => {
    const id = rawId.trim();
    if (!id) return "Enter a saree ID to look it up, or scan its barcode with the camera.";
    if (existing.some((l) => l.id.toLowerCase() === id.toLowerCase())) {
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
        const reason =
          result.saleEligibility === "WHOLESALE_DISPATCHED"
            ? "already dispatched to a wholesale customer"
            : result.saleEligibility === "SOLD"
              ? "already sold"
              : result.saleEligibility === "DAMAGED_REVIEW_NEEDED"
                ? "flagged for damage review"
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
        batchId: result.batchId ?? "",
        design: result.design?.code ?? "—",
        name: result.design?.name ?? result.sareeType?.type ?? "—",
        // Same "CODE · Name" order the Inventory table uses, so a saree reads
        // identically whether it is being checked in stock or sold.
        // External pieces carry a type name but no ST- code — never print "null".
        type: [result.sareeType?.code, result.sareeType?.type].filter(Boolean).join(" · ") || "—",
        typeCode,
        weight: result.weight != null ? `${result.weight}g` : "—",
        weaver: result.weaver
          ? `${result.weaver.name}${result.weaver.loomNumber != null ? ` · Loom ${result.weaver.loomNumber}` : ""}`
          : result.factoryLoom
            ? `Factory Loom ${result.factoryLoom.code ?? result.factoryLoom.loomNumber}`
            : "—",
        originalPrice: price,
        discountMode: "amount",
        discountValue: 0,
        soldPrice: price,
        source:
          result.origin === "external"
            ? result.supplier
              ? {
                  kind: "external",
                  name: result.supplier.name,
                  detail: result.invoiceNumber ? `Invoice ${result.invoiceNumber}` : undefined,
                }
              : undefined
            : result.weaver
              ? {
                  kind: "weaver",
                  name: result.weaver.name,
                  detail:
                    result.weaver.loomNumber != null
                      ? `Loom ${result.weaver.loomNumber}`
                      : undefined,
                }
              : result.factoryLoom
                ? {
                    kind: "factory",
                    name: `Factory Loom ${result.factoryLoom.code ?? result.factoryLoom.loomNumber}`,
                  }
                : undefined,
      };
    } catch (err) {
      return err instanceof ApiError ? err.message : `Could not find saree ${id}.`;
    }
  };

  /** Scan/type path — one saree at a time, and the field clears for the next. */
  const handleScan = async (overrideId?: string) => {
    setScanError(null);
    const line = await resolveLine(overrideId ?? manualId, cart);
    if (typeof line === "string") {
      setScanError(line);
      return;
    }
    setCart((prev) => [...prev, line]);
    setManualId("");
  };

  /** Stock-table path — every ticked saree is added in one pass. */
  const handleAddSarees = async (ids: string[]) => {
    setScanError(null);
    const added: SaleLine[] = [];
    const errors: string[] = [];
    for (const id of ids) {
      const line = await resolveLine(id, [...cart, ...added]);
      if (typeof line === "string") errors.push(line);
      else added.push(line);
    }
    if (added.length > 0) setCart((prev) => [...prev, ...added]);
    if (errors.length > 0) setScanError(errors.join(" "));
  };

  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  const setLineDiscount = (id: string, mode: DiscountMode, value: number) =>
    setCart((prev) => prev.map((l) => (l.id === id ? applyDiscount(l, mode, value) : l)));

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setPhone(cust.phone);
    setCustSearch(cust.name);
    setShowCustomerList(false);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
  };

  // Opened from a customer's record page with "Record New Sale" — start on the
  // saree step with that customer already attached, instead of making the
  // operator find them again in the search list.
  const location = useLocation();
  const preselectId = (location.state as { customerId?: string } | null)?.customerId ?? null;
  const preselectApplied = useRef(false);

  const { data: preselectCustomer } = useQuery({
    queryKey: ["customers-find-newsale", preselectId],
    queryFn: () => customersApi.findOne(preselectId!),
    enabled: !!preselectId,
  });

  useEffect(() => {
    if (!preselectCustomer || preselectApplied.current) return;
    preselectApplied.current = true;
    handleSelectCustomer({
      id: preselectCustomer.id,
      name: preselectCustomer.name,
      phone: preselectCustomer.phone ?? "",
      purchases: preselectCustomer.totalPurchases ?? 0,
      total: formatMoney(rupees(Number(preselectCustomer.totalSpend ?? 0))),
      lastPurchase: new Date(
        preselectCustomer.lastPurchaseDate ?? preselectCustomer.createdAt
      ).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      initials: preselectCustomer.name,
    });
    setCustAddress(preselectCustomer.address ?? "");
    setStep(2);
  }, [preselectCustomer]);

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(true);
    setShowCustomerList(false);
    setCustName("");
    setPhone("");
    setCustAddress("");
    setCustSearch("");
  };

  // One id per bill, sent with every saree on it so the admin feed gets a
  // single notification for the bill. Kept across a retry after a partial
  // failure, so the sarees that go through second time join the same one.
  const billId = useRef<string | null>(null);

  // The Customer record created for a new walk-in on this sale. Kept across a
  // retry, so confirming again after a failed saree reuses it instead of
  // adding the same person a second time. `key` is the name and phone it was
  // created with — editing either one means a different customer.
  const createdCustomer = useRef<{ key: string; id: string } | null>(null);

  const resetSale = () => {
    billId.current = null;
    createdCustomer.current = null;
    setStep(1);
    setCart([]);
    setBillDiscount(NO_BILL_DISCOUNT);
    setGst(NO_GST);
    setSellerGstin(undefined);
    setManualId("");
    setPayment(null);
    setPayRef("");
    setPhone("");
    setCustName("");
    setCustAddress("");
    setCustSearch("");
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
    setShowCustomerList(false);
    setShowSareeList(false);
    setScanError(null);
    setSubmitError(null);
    setSaleRefs([]);
  };

  const canProceedStep1 =
    isPhoneEntryComplete(phone) &&
    (selectedCustomer !== null || (isNewCustomer && custName.trim() !== ""));

  if (showBill) {
    return (
      <NewSaleBillModal
        lines={cart}
        custName={custName}
        phone={phone}
        custAddress={custAddress}
        payment={payment}
        payRef={payRef}
        total={total}
        billDiscount={
          billOff ? { amount: billOff, note: billDiscountLabel(billDiscount) } : undefined
        }
        gst={billGst}
        billRef={saleRefs[0]}
        saleRefs={saleRefs}
        isMobile={isMobile}
        isTablet={isTablet}
        onClose={() => setShowBill(false)}
      />
    );
  }

  if (step === "success") {
    return (
      <NewSaleSuccessView
        lines={cart}
        custName={custName}
        phone={phone}
        custAddress={custAddress}
        payment={payment}
        payRef={payRef}
        total={total}
        billDiscount={
          billOff ? { amount: billOff, note: billDiscountLabel(billDiscount) } : undefined
        }
        gst={billGst}
        saleRefs={saleRefs}
        fmtPrice={fmtPrice}
        onShowBill={() => setShowBill(true)}
        onResetSale={resetSale}
      />
    );
  }

  // Each completed step reads back what was chosen, so the operator never has
  // to step backwards just to remember who the customer was.
  const steps: FlowStep[] = [
    { label: "Customer", summary: selectedCustomer?.name ?? (custName.trim() || undefined) },
    {
      label: "Sarees & price",
      summary:
        cart.length === 1 ? cart[0]!.id : cart.length > 1 ? `${cart.length} sarees` : undefined,
    },
    {
      label: "Payment",
      summary: payment ? `${payment.toUpperCase()} · ${fmtPrice(total)}` : undefined,
    },
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
          pills={[
            { text: "4-Step Process" },
            { text: "Auto Bill Generation" },
            { text: "Customer Auto-Fill" },
          ]}
          bgUrl={SILK_BG}
        />
      )}

      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_SALE}
        onJump={(n) => setStep(n as 1 | 2 | 3 | 4)}
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
          setLineDiscount={setLineDiscount}
          billDiscount={billDiscount}
          setBillDiscount={setBillDiscount}
          gst={gst}
          setGst={setGst}
          scanError={scanError}
          showSareeList={showSareeList}
          setShowSareeList={setShowSareeList}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* ── Step 3 — Payment ── */}
      {step === 3 && (
        <>
          <StepBody>
            <StepHeader
              title="Payment"
              subtitle="Confirm what the customer owes, then record how they are paying it."
            />

            {/* Amount due — read-only. Prices were set on the previous step,
                where the sarees were picked; repeating the editors here gave
                two places to change one number. "Edit prices" jumps back. */}
            <Card style={{ marginBottom: 22, overflow: "hidden" }}>
              <div style={{ height: 4, background: C.burg }} />
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: `1px solid ${C.bdr}`,
                  background: "rgba(110,15,45,0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap" as const,
                }}
              >
                <span
                  style={{
                    fontFamily: F.m,
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color: C.muted,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {cart.length} saree{cart.length !== 1 ? "s" : ""} · amount due
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="p-0 text-xs underline text-[#69635E]"
                >
                  Edit prices
                </Button>
              </div>

              {cart.map((l, i) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: i < cart.length - 1 ? `1px solid ${C.bdr}` : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>
                      {l.id}
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {l.type !== "—" ? l.type : l.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: F.u,
                        fontWeight: 600,
                        fontSize: 15,
                        color: C.text,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmtPrice(l.soldPrice)}
                    </div>
                    {l.soldPrice !== l.originalPrice && (
                      <div
                        style={{
                          fontFamily: F.u,
                          fontSize: 12,
                          color: C.muted,
                          textDecoration: "line-through",
                          marginTop: 2,
                        }}
                      >
                        {fmtPrice(l.originalPrice)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div
                style={{
                  padding: "14px 16px",
                  borderTop: `1px solid ${C.bdr}`,
                  background: "rgba(110,15,45,0.03)",
                }}
              >
                <BillBreakdown
                  originalTotal={originalTotal}
                  lineDiscount={lineDiscount}
                  subtotal={subtotal}
                  billOff={billOff}
                  billNote={billDiscountLabel(billDiscount)}
                  tax={tax}
                  fmtPrice={fmtPrice}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>
                    Total payable
                  </span>
                  <span
                    style={{
                      fontFamily: F.u,
                      fontWeight: 600,
                      fontSize: 28,
                      color: C.burg,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtPrice(total)}
                  </span>
                </div>
              </div>
            </Card>

            <div
              style={{
                fontFamily: F.u,
                fontWeight: 600,
                fontSize: 15,
                color: C.text,
                marginBottom: 12,
              }}
            >
              How is the customer paying?
            </div>
            <div
              role="radiogroup"
              aria-label="Payment method"
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: 14,
                marginBottom: 20,
              }}
            >
              {[
                { id: "cash" as const, label: "Cash", sub: "Physical currency", icon: IndianRupee },
                { id: "upi" as const, label: "UPI", sub: "GPay, PhonePe, etc.", icon: Wallet },
                { id: "card" as const, label: "Card", sub: "Debit or credit", icon: CreditCard },
                { id: "other" as const, label: "Other", sub: "Cheque / transfer", icon: Plus },
              ].map((p) => (
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
                <label
                  htmlFor="pay-ref"
                  style={{
                    fontFamily: F.u,
                    fontWeight: 500,
                    fontSize: 14,
                    color: C.text,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {payment === "upi" ? "UPI reference" : "Card last 4 digits"}
                  <span style={{ color: C.muted, fontWeight: 400 }}> (optional)</span>
                </label>
                <Input
                  id="pay-ref"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
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
            primaryLabel={`Next — Confirm ${fmtPrice(total)}`}
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
              rows={
                [
                  { label: "Customer", value: custName || selectedCustomer?.name || "—" },
                  { label: "Phone", value: phone ? `+91 ${phone}` : "—", mono: true },
                  ...(custAddress.trim() ? [{ label: "Address", value: custAddress.trim() }] : []),
                  { label: "Sarees", value: `${cart.length} piece${cart.length !== 1 ? "s" : ""}` },
                  {
                    label: "Payment method",
                    value: payment ? payment.toUpperCase() : "—",
                    mono: true,
                  },
                  ...(payRef
                    ? [
                        {
                          label: payment === "upi" ? "UPI reference" : "Card ending",
                          value: payRef,
                          mono: true,
                        },
                      ]
                    : []),
                  {
                    label: "GST",
                    value: tax ? `${tax.rate}% · ${fmtPrice(tax.gst)}` : "Not applied",
                    mono: !!tax,
                  },
                  ...(tax && gst.gstin.trim()
                    ? [{ label: "Customer GSTIN", value: normalizeGstin(gst.gstin), mono: true }]
                    : []),
                  { label: "Amount payable", value: fmtPrice(total), mono: true },
                ] as SummaryRow[]
              }
              footer={
                <div>
                  {/* Every piece on the bill, itemised with its saree type and
                      its retail price alongside what it is actually selling
                      for — on a multi-saree sale a single total is not enough
                      to check the bill against. */}
                  {cart.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, minWidth: 0 }}>
                        <span style={{ fontFamily: F.m, color: C.burg }}>{l.id}</span>
                        <span style={{ color: C.muted }}>
                          {" "}
                          · {l.type !== "—" ? l.type : l.name}
                        </span>
                      </span>
                      <span style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <span
                          style={{
                            fontFamily: F.u,
                            fontSize: 13,
                            color: C.text,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmtPrice(l.soldPrice)}
                        </span>
                        {l.soldPrice !== l.originalPrice && (
                          <span
                            style={{
                              fontFamily: F.u,
                              fontSize: 12,
                              color: C.muted,
                              textDecoration: "line-through",
                              marginLeft: 8,
                            }}
                          >
                            {fmtPrice(l.originalPrice)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginTop: 6 }}>
                    <BillBreakdown
                      originalTotal={originalTotal}
                      lineDiscount={lineDiscount}
                      subtotal={subtotal}
                      billOff={billOff}
                      billNote={billDiscountLabel(billDiscount)}
                      tax={tax}
                      fmtPrice={fmtPrice}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}
                      >
                        Total payable
                      </span>
                      <span
                        style={{
                          fontFamily: F.u,
                          fontWeight: 600,
                          fontSize: 30,
                          color: C.burg,
                          letterSpacing: "-0.02em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmtPrice(total)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 10,
                        flexWrap: "wrap" as const,
                      }}
                    >
                      <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                        Paying by {payment ? payment.toUpperCase() : "—"}
                      </span>
                      {priceDiscount > 0 && (
                        <Chip
                          label={`Total discount · ${fmtPrice(priceDiscount)}`}
                          color="#845E04"
                          bg="rgba(200,155,71,0.15)"
                        />
                      )}
                    </div>
                  </div>
                </div>
              }
            />

            <ConsequenceNote tone="info">
              Confirming records the sale, removes{" "}
              {cart.length === 1 ? "this saree" : `these ${cart.length} sarees`} from shop
              inventory, and generates a bill you can print or send on WhatsApp.
            </ConsequenceNote>

            {submitError && (
              <div
                role="alert"
                style={{ marginTop: 16, fontFamily: F.u, fontSize: 14, color: "#AB3832" }}
              >
                {submitError}
              </div>
            )}
          </StepBody>

          <FlowActions
            accent={ACCENT_SALE}
            tone="confirm"
            backLabel="Edit details"
            onBack={() => setStep(3)}
            primaryIcon={Check}
            primaryLabel={
              cart.length > 1
                ? `Confirm sale — ${cart.length} sarees`
                : "Confirm sale — generate bill"
            }
            primaryBusy={isSubmitting}
            onPrimary={async () => {
              if (isSubmitting) return;
              // The stepper can jump here past the saree step, so the GST
              // entry is checked again rather than trusted.
              const gstProblem = gstIssue(gst);
              if (gstProblem) {
                setSubmitError(gstProblem);
                return;
              }
              setIsSubmitting(true);
              setSubmitError(null);
              try {
                // Every sale needs a real customerId so it actually shows up
                // in that customer's purchase history/lifetime spend — a new
                // walk-in customer gets a Customer record created first,
                // an existing one is reused as-is.
                let customerId: string;
                if (selectedCustomer) {
                  customerId = selectedCustomer.id;
                } else {
                  const key = `${custName.trim().toLowerCase()}|${phone.trim()}`;
                  if (createdCustomer.current?.key !== key) {
                    const created = await customersApi.create({
                      name: custName.trim(),
                      phone: phone.trim() || undefined,
                      address: custAddress.trim() || undefined,
                      type: "RETAIL",
                    });
                    createdCustomer.current = { key, id: created.id };
                    void queryClient.invalidateQueries({ queryKey: ["customers-list-newsale"] });
                  }
                  customerId = createdCustomer.current.id;
                }
                // The backend records one SaleRecord per saree, so a basket
                // is submitted line by line. Sequential, not parallel: each
                // call mutates that saree's inventory status, and a partial
                // failure has to name exactly which pieces did go through.
                const recorded: string[] = [];
                const refs: string[] = [];
                billId.current ??= crypto.randomUUID();
                // The bill discount is shared out across the sarees so each
                // saree's recorded amount is what was really paid for it, and
                // the recorded amounts add up to the bill total.
                const billShares = allocateBillDiscount(cart, billOff);
                const billNote = billOff
                  ? `bill discount ${billDiscountLabel(billDiscount) ?? fmtPrice(billOff)}`
                  : undefined;
                // GST is worked out once on the whole bill, then shared
                // across the sarees by their taxable value, so the recorded
                // GST adds up to exactly what the bill prints.
                const lineTaxable = cart.map((l, i) => l.soldPrice - billShares[i]!);
                const gstShares = tax ? allocateByWeight(lineTaxable, tax.gst) : [];
                const customerGstin =
                  tax && gst.gstin.trim() ? normalizeGstin(gst.gstin) : undefined;
                let recordedSellerGstin: string | undefined;
                try {
                  for (const [i, line] of cart.entries()) {
                    const lineGst = tax ? gstShares[i]! : 0;
                    const sale = await salesApi.create({
                      sareeId: line.id,
                      channel: "RETAIL",
                      // What was paid for this saree — GST included.
                      amount: lineTaxable[i]! + lineGst,
                      customerId,
                      paymentMethod: payment ?? undefined,
                      paymentRef: payRef.trim() || undefined,
                      originalPrice: line.originalPrice,
                      discountNote:
                        [discountLabel(line), billShares[i] ? billNote : undefined]
                          .filter(Boolean)
                          .join(" + ") || undefined,
                      billId: billId.current,
                      ...(tax ? { gstRate: tax.rate, gstAmount: lineGst, customerGstin } : {}),
                    });
                    recorded.push(line.id);
                    refs.push(sale.saleRef);
                    recordedSellerGstin ??= sale.sellerGstin ?? undefined;
                  }
                } catch (err) {
                  if (recorded.length > 0) {
                    refreshStock();
                    // A flat ₹ bill discount was partly used up by the sarees
                    // that went through; only the rest applies to the retry.
                    // A % discount re-applies to what is left unchanged.
                    if (billDiscount.mode === "amount" && billOff) {
                      const used = billShares.slice(0, recorded.length).reduce((a, b) => a + b, 0);
                      setBillDiscount({ mode: "amount", value: Math.max(0, billOff - used) });
                    }
                    setCart((prev) => prev.filter((l) => !recorded.includes(l.id)));
                    throw new Error(
                      `Recorded ${recorded.length} of ${cart.length} sarees (${recorded.join(", ")}). ` +
                        `The rest are still on this sale — try confirming again.`
                    );
                  }
                  throw err;
                }
                // Sold sarees drop out of stock — refresh it so the
                // Inventory tab and the next sale's picker agree with the bill
                // that was just raised.
                refreshStock();
                setSellerGstin(recordedSellerGstin);
                setSaleRefs(refs);
                setStep("success");
              } catch (err) {
                setSubmitError(
                  err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Failed to record sale — please try again."
                );
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

/** Retail total → per-saree discounts → subtotal → bill discount, as the
 *  payment and confirm steps show it above the amount payable. Rows that are
 *  zero are left out; nothing renders when no discount was given at all. */
function BillBreakdown({
  originalTotal,
  lineDiscount,
  subtotal,
  billOff,
  billNote,
  tax,
  fmtPrice,
}: {
  originalTotal: number;
  lineDiscount: number;
  subtotal: number;
  billOff: number;
  billNote?: string;
  /** GST on the bill, when charged — shown as taxable value, CGST and SGST. */
  tax?: GstBreakdown | null;
  fmtPrice: (n: number) => string;
}) {
  if (!lineDiscount && !billOff && !tax) return null;
  const row = (label: string, value: string, color: string = C.muted) => (
    <div
      key={label}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
      }}
    >
      <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{ fontFamily: F.u, fontSize: 14, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
  return (
    <div style={{ marginBottom: 4 }}>
      {row("Retail total", fmtPrice(originalTotal))}
      {lineDiscount !== 0 &&
        row(
          lineDiscount > 0 ? "Saree discounts" : "Saree mark-ups",
          `${lineDiscount > 0 ? "−" : "+"} ${fmtPrice(Math.abs(lineDiscount))}`,
          C.gold
        )}
      {billOff > 0 && lineDiscount !== 0 && row("Subtotal", fmtPrice(subtotal))}
      {billOff > 0 &&
        row(`Bill discount${billNote ? ` (${billNote})` : ""}`, `− ${fmtPrice(billOff)}`, C.gold)}
      {tax && row("Taxable value", fmtPrice(tax.taxable))}
      {tax && row(`CGST @ ${tax.rate / 2}%`, `+ ${fmtPrice(tax.cgst)}`, C.text)}
      {tax && row(`SGST @ ${tax.rate / 2}%`, `+ ${fmtPrice(tax.sgst)}`, C.text)}
    </div>
  );
}
